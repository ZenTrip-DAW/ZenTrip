const jwt = require('jsonwebtoken');
const admin = require('../../config/firebase');

const EMAIL_INVITATION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 días
const PUBLIC_INVITATION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 días

function getJwtSecret() {
  return process.env.JWT_INVITE_SECRET || process.env.JWT_SECRET || 'dev-invite-secret-change-me';
}

function signInvitationJwt(payload, ttlSeconds) {
  return jwt.sign(payload, getJwtSecret(), {
    algorithm: 'HS256',
    expiresIn: ttlSeconds,
  });
}

function verifyInvitationJwt(token) {
  try {
    return jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
  } catch {
    return null;
  }
}

// Distingue token expirado de token inválido/malformado.
// Retorna { decoded, expired: false } si es válido,
// { decoded (payload), expired: true } si solo expiró,
// { decoded: null, expired: false } si es basura.
function decodeJwtWithExpiry(token) {
  try {
    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
    return { decoded, expired: false };
  } catch (err) {
    if (err?.name === 'TokenExpiredError') {
      return { decoded: jwt.decode(token), expired: true };
    }
    return { decoded: null, expired: false };
  }
}

function isValidPublicJwtToken(token) {
  const decoded = verifyInvitationJwt(token);
  return Boolean(decoded?.kind === 'public');
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function upsertTripMember({ tripId, member }) {
  const db = admin.firestore();
  const normalizedUid = String(member?.uid || '').trim();
  const normalizedEmail = normalizeEmail(member?.email);
  const memberRole = String(member?.role || member?.rol || 'miembro').trim();
  const invitationStatus = String(member?.invitationStatus || member?.estadoInvitacion || 'pendiente').trim();
  if (!normalizedUid && !normalizedEmail) return;

  const membersRef = db.collection('viajes').doc(tripId).collection('miembros');

  const payload = {
    email: normalizedEmail,
    uid: normalizedUid || null,
    role: memberRole,
    invitationStatus,
  };

  if (invitationStatus === 'pendiente' || invitationStatus === 'pendiente_correo') {
    payload.invitedAt = admin.firestore.FieldValue.serverTimestamp();
  }

  if (invitationStatus === 'aceptada') {
    payload.acceptedAt = admin.firestore.FieldValue.serverTimestamp();
  }

  if (!normalizedUid) {
    const emailMemberRef = membersRef.doc(normalizedEmail);
    await emailMemberRef.set(payload, { merge: true });
    return;
  }

  const uidMemberRef = membersRef.doc(normalizedUid);
  const emailMemberRef = normalizedEmail ? membersRef.doc(normalizedEmail) : null;

  const [uidSnap, emailSnap] = await Promise.all([
    uidMemberRef.get(),
    emailMemberRef && emailMemberRef.path !== uidMemberRef.path ? emailMemberRef.get() : Promise.resolve(null),
  ]);

  const mergedPayload = {
    ...(emailSnap?.exists ? emailSnap.data() : {}),
    ...(uidSnap.exists ? uidSnap.data() : {}),
    ...payload,
  };

  const batch = db.batch();
  batch.set(uidMemberRef, mergedPayload, { merge: true });

  if (emailSnap?.exists && emailMemberRef && emailMemberRef.path !== uidMemberRef.path) {
    batch.delete(emailMemberRef);
  }

  await batch.commit();
}

async function applyAcceptanceToTrip({ tripId, invitedEmail, userId }) {
  const db = admin.firestore();
  const tripRef = db.collection('viajes').doc(tripId);
  const tripDoc = await tripRef.get();

  if (!tripDoc.exists) {
    throw new Error('No se encontró el viaje asociado a la invitación');
  }

  await upsertTripMember({
    tripId,
    member: {
      email: normalizeEmail(invitedEmail),
      uid: userId,
      rol: 'miembro',
      estadoInvitacion: 'aceptada',
    },
  });
}

function resolveExpiryDate(data, decodedToken = null) {
  if (data?.expiresAt?.toDate) {
    return data.expiresAt.toDate();
  }
  if (decodedToken?.exp) {
    return new Date(decodedToken.exp * 1000);
  }
  return null;
}

async function resolveEmailInvitationByToken(token) {
  const db = admin.firestore();
  const { decoded, expired } = decodeJwtWithExpiry(token);

  if (!(decoded?.kind === 'email' && decoded?.invitationId)) {
    return null;
  }

  const docRef = db.collection('invitations').doc(String(decoded.invitationId));
  const doc = await docRef.get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  if (String(data?.token || '') !== String(token)) {
    return null;
  }

  return {
    invitationId: doc.id,
    data,
    docRef,
    decoded: expired ? null : decoded,
    jwtExpired: expired,
  };
}

// Upsert: si ya existe una invitación para tripId+email, actualiza el token
// en lugar de crear un documento nuevo (evita duplicados al reenviar).
async function createInvitation({ tripId, tripName, email, creatorId, creatorName }) {
  const db = admin.firestore();
  const normalizedEmail = normalizeEmail(email);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + EMAIL_INVITATION_TTL_SECONDS * 1000);

  const existing = await db
    .collection('invitations')
    .where('tripId', '==', tripId)
    .where('email', '==', normalizedEmail)
    .limit(1)
    .get();

  if (!existing.empty) {
    const doc = existing.docs[0];
    const data = doc.data();

    // Ya aceptó → no reenviar
    if (data.status === 'accepted') {
      return { invitationId: doc.id, token: data.token, alreadyAccepted: true };
    }

    // Pendiente (expirada o vigente) → refrescar token sobre el mismo doc
    const newToken = signInvitationJwt(
      { kind: 'email', invitationId: doc.id, tripId, email: normalizedEmail },
      EMAIL_INVITATION_TTL_SECONDS,
    );

    await doc.ref.update({
      token: newToken,
      status: 'pending',
      tripName,
      creatorId,
      creatorName,
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { invitationId: doc.id, token: newToken };
  }

  // Primera invitación → crear nuevo documento
  const invitationRef = await db.collection('invitations').add({
    tripId,
    tripName,
    email: normalizedEmail,
    creatorId,
    creatorName,
    token: null,
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
  });

  const token = signInvitationJwt(
    { kind: 'email', invitationId: invitationRef.id, tripId, email: normalizedEmail },
    EMAIL_INVITATION_TTL_SECONDS,
  );

  await invitationRef.update({ token });
  return { invitationId: invitationRef.id, token };
}

// Devuelve null si es inválido/malformado,
// { expired: true } si caducó,
// o los datos de la invitación si es válida.
async function verifyToken(token) {
  const resolved = await resolveEmailInvitationByToken(token);
  if (!resolved) return null;

  const { invitationId, data, decoded, jwtExpired } = resolved;

  if (data.status !== 'pending') return null;

  if (jwtExpired) return { expired: true };

  const expiry = resolveExpiryDate(data, decoded);
  if (expiry && new Date() > expiry) return { expired: true };

  return { invitationId, ...data };
}

async function acceptInvitation(token, userId, userEmail) {
  const resolved = await resolveEmailInvitationByToken(token);
  if (!resolved) throw new Error('Invitación no válida');

  const { invitationId, data, decoded, jwtExpired, docRef } = resolved;

  const normalizedInvitationEmail = normalizeEmail(data.email);
  const normalizedUserEmail = normalizeEmail(userEmail);
  if (!normalizedUserEmail || normalizedInvitationEmail !== normalizedUserEmail) {
    throw new Error('El correo autenticado no coincide con el correo invitado');
  }

  if (data.status === 'accepted') {
    return { tripId: data.tripId, invitationId, alreadyAccepted: true };
  }

  if (data.status !== 'pending') {
    throw new Error('Invitación ya fue procesada y no puede aceptarse');
  }

  if (jwtExpired) throw new Error('Invitación expirada');

  const expiry = resolveExpiryDate(data, decoded);
  if (expiry && new Date() > expiry) throw new Error('Invitación expirada');

  await docRef.update({
    status: 'accepted',
    acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
    acceptedById: userId,
    acceptedByEmail: normalizedUserEmail,
  });

  await applyAcceptanceToTrip({
    tripId: data.tripId,
    invitedEmail: normalizedInvitationEmail,
    userId,
  });

  return { tripId: data.tripId, invitationId };
}

async function claimPendingInvitationsForUser(userId, userEmail) {
  const db = admin.firestore();
  const normalizedUserEmail = normalizeEmail(userEmail);

  if (!normalizedUserEmail) {
    throw new Error('No se pudo determinar el correo del usuario autenticado');
  }

  const now = new Date();
  const snapshot = await db
    .collection('invitations')
    .where('email', '==', normalizedUserEmail)
    .where('status', '==', 'pending')
    .get();

  const claimed = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const expiry = data?.expiresAt?.toDate ? data.expiresAt.toDate() : null;
    if (expiry && now > expiry) continue;

    await doc.ref.update({
      status: 'accepted',
      acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
      acceptedById: userId,
      acceptedByEmail: normalizedUserEmail,
    });

    await applyAcceptanceToTrip({
      tripId: data.tripId,
      invitedEmail: normalizedUserEmail,
      userId,
    });

    claimed.push({ invitationId: doc.id, tripId: data.tripId });
  }

  return claimed;
}

async function getOrCreateTripPublicInvitation({ tripId, creatorId, forceRegenerate = false, preferredToken = '' }) {
  const db = admin.firestore();
  const tripRef = db.collection('viajes').doc(tripId);
  const tripDoc = await tripRef.get();

  if (!tripDoc.exists) {
    throw new Error('No se encontró el viaje para generar enlace compartible');
  }

  const tripData = tripDoc.data() || {};
  const ownerId = String(tripData.uid || '').trim();
  if (!ownerId || ownerId !== String(creatorId || '').trim()) {
    throw new Error('No tienes permisos para generar el enlace de este viaje');
  }

  const activeSnapshot = await db
    .collection('tripPublicInvitations')
    .where('tripId', '==', tripId)
    .where('status', '==', 'active')
    .get();

  const now = new Date();

  if (!activeSnapshot.empty && !forceRegenerate) {
    const expiredBatch = db.batch();
    let hasExpiredDocs = false;

    for (const doc of activeSnapshot.docs) {
      const data = doc.data();
      const expiry = data?.expiresAt?.toDate ? data.expiresAt.toDate() : null;
      if (!expiry || now <= expiry) {
        // Vigente → devolver sin crear uno nuevo
        return {
          publicInvitationId: doc.id,
          token: data.token,
          tripId: data.tripId,
          tripName: data.tripName || tripData.name || tripData.nombre || 'Viaje',
        };
      }
      // Expirado → marcar y seguir buscando
      expiredBatch.update(doc.ref, {
        status: 'expired',
        expiredAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      hasExpiredDocs = true;
    }

    if (hasExpiredDocs) await expiredBatch.commit();
    // Todos estaban expirados → caer al bloque de creación
  }

  // forceRegenerate: marcar los activos como rotados (link viejo invalidado)
  if (!activeSnapshot.empty && forceRegenerate) {
    const batch = db.batch();
    activeSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        status: 'rotated',
        rotatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
  }

  const expiresAt = new Date(now.getTime() + PUBLIC_INVITATION_TTL_SECONDS * 1000);

  const publicInvitationRef = await db.collection('tripPublicInvitations').add({
    tripId,
    tripName: tripData.name || tripData.nombre || 'Viaje',
    token: null,
    status: 'active',
    creatorId: ownerId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
  });

  let token = String(preferredToken || '').trim();

  if (token) {
    if (!isValidPublicJwtToken(token)) {
      token = '';
    } else {
      const tokenSnapshot = await db
        .collection('tripPublicInvitations')
        .where('token', '==', token)
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (!tokenSnapshot.empty) {
        const usedTokenTripId = tokenSnapshot.docs[0].data()?.tripId;
        if (usedTokenTripId !== tripId) token = '';
      }
    }
  }

  if (!token) {
    token = signInvitationJwt({ kind: 'public', tripId }, PUBLIC_INVITATION_TTL_SECONDS);
  }

  await publicInvitationRef.update({ token });

  return {
    publicInvitationId: publicInvitationRef.id,
    token,
    tripId,
    tripName: tripData.name || tripData.nombre || 'Viaje',
  };
}

// Verifica un token público. Devuelve:
// null               → token malformado o no encontrado
// { expired: true }  → token caducado (se marca el doc en Firestore)
// { rotated: true }  → el coordinador generó un nuevo enlace (link invalidado)
// { ...data }        → válido, con datos del viaje
async function verifyTripPublicToken(token) {
  const { decoded, expired: jwtExpired } = decodeJwtWithExpiry(token);

  if (!decoded || decoded.kind !== 'public') return null;

  const db = admin.firestore();
  const snapshot = await db
    .collection('tripPublicInvitations')
    .where('token', '==', token)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return jwtExpired ? { expired: true } : null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  if (data.status === 'rotated') return { rotated: true };
  if (data.status === 'expired') return { expired: true };

  const expiry = resolveExpiryDate(data, jwtExpired ? null : decoded);
  const isExpired = jwtExpired || (expiry && new Date() > expiry);

  if (isExpired) {
    if (data.status === 'active') {
      await doc.ref.update({
        status: 'expired',
        expiredAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    return { expired: true };
  }

  if (data.status !== 'active') return null;

  return { publicInvitationId: doc.id, ...data };
}

async function acceptTripPublicInvitation(token, userId, userEmail) {
  const invitation = await verifyTripPublicToken(token);

  if (!invitation) throw new Error('Enlace de invitación no válido');
  if (invitation.expired) throw new Error('El enlace de invitación ha caducado');
  if (invitation.rotated) throw new Error('Este enlace ya no es válido. El organizador ha generado uno nuevo.');

  const normalizedUserEmail = normalizeEmail(userEmail);
  if (!userId || !normalizedUserEmail) {
    throw new Error('No se pudo identificar al usuario autenticado');
  }

  // Comprobar si el usuario ya es miembro activo del viaje
  const db = admin.firestore();
  const memberSnap = await db
    .collection('viajes')
    .doc(invitation.tripId)
    .collection('miembros')
    .doc(userId)
    .get();

  if (memberSnap.exists && memberSnap.data()?.invitationStatus === 'aceptada') {
    return {
      tripId: invitation.tripId,
      publicInvitationId: invitation.publicInvitationId,
      alreadyMember: true,
    };
  }

  await applyAcceptanceToTrip({
    tripId: invitation.tripId,
    invitedEmail: normalizedUserEmail,
    userId,
  });

  return {
    tripId: invitation.tripId,
    publicInvitationId: invitation.publicInvitationId,
  };
}

module.exports = {
  createInvitation,
  verifyToken,
  acceptInvitation,
  claimPendingInvitationsForUser,
  getOrCreateTripPublicInvitation,
  verifyTripPublicToken,
  acceptTripPublicInvitation,
  upsertTripMember,
  signInvitationJwt,
};
