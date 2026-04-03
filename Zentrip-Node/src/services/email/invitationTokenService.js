const jwt = require('jsonwebtoken');
const admin = require('../../config/firebase');

const EMAIL_INVITATION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 dias
const PUBLIC_INVITATION_TTL_SECONDS = 365 * 24 * 60 * 60; // 1 ano

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

  // Sin UID, se conserva el documento por email para invitados no registrados.
  if (!normalizedUid) {
    const emailMemberRef = membersRef.doc(normalizedEmail);
    await emailMemberRef.set(payload, { merge: true });
    return;
  }

  // Con UID, el documento canónico siempre es por UID.
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

  // Limpia el documento legacy por email para evitar duplicados lógicos.
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

  const normalizedEmail = normalizeEmail(invitedEmail);

  await upsertTripMember({
    tripId,
    member: {
      email: normalizedEmail,
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
  const decoded = verifyInvitationJwt(token);

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
    decoded,
  };
}

async function resolvePublicInvitationByToken(token) {
  const db = admin.firestore();
  const decoded = verifyInvitationJwt(token);

  if (decoded?.kind !== 'public') {
    return null;
  }

  const snapshot = await db
    .collection('tripPublicInvitations')
    .where('token', '==', token)
    .where('status', '==', 'active')
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];

  return {
    publicInvitationId: doc.id,
    data: doc.data(),
    decoded,
    docRef: doc.ref,
  };
}

async function createInvitation({ tripId, tripName, email, creatorId, creatorName }) {
  const db = admin.firestore();
  const normalizedEmail = normalizeEmail(email);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

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
    {
      kind: 'email',
      invitationId: invitationRef.id,
      tripId,
      email: normalizedEmail,
    },
    EMAIL_INVITATION_TTL_SECONDS,
  );

  await invitationRef.update({ token });

  return { invitationId: invitationRef.id, token };
}

async function verifyToken(token) {
  const resolved = await resolveEmailInvitationByToken(token);
  if (!resolved) {
    return null;
  }

  const { invitationId, data, decoded } = resolved;

  if (data.status !== 'pending') {
    return null;
  }

  const expiry = resolveExpiryDate(data, decoded);
  if (expiry && new Date() > expiry) {
    return null;
  }

  return { invitationId, ...data };
}

async function acceptInvitation(token, userId, userEmail) {
  const resolved = await resolveEmailInvitationByToken(token);
  if (!resolved) {
    throw new Error('Invitación no válida');
  }

  const { invitationId, data, decoded, docRef } = resolved;

  const normalizedInvitationEmail = normalizeEmail(data.email);
  const normalizedUserEmail = normalizeEmail(userEmail);
  if (!normalizedUserEmail || normalizedInvitationEmail !== normalizedUserEmail) {
    throw new Error('El correo autenticado no coincide con el correo invitado');
  }

  if (data.status === 'accepted') {
    return {
      tripId: data.tripId,
      invitationId,
      alreadyAccepted: true,
    };
  }

  if (data.status !== 'pending') {
    throw new Error('Invitación ya fue procesada y no puede aceptarse');
  }

  const expiry = resolveExpiryDate(data, decoded);
  if (expiry && new Date() > expiry) {
    throw new Error('Invitación expirada');
  }

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
    if (expiry && now > expiry) {
      continue;
    }

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
    for (const doc of activeSnapshot.docs) {
      const data = doc.data();
      const expiry = data?.expiresAt?.toDate ? data.expiresAt.toDate() : null;
      if (!expiry || now <= expiry) {
        return {
          publicInvitationId: doc.id,
          token: data.token,
          tripId: data.tripId,
          tripName: data.tripName || tripData.name || tripData.nombre || 'Viaje',
        };
      }
    }
  }

  if (!activeSnapshot.empty && forceRegenerate) {
    const nowTimestamp = admin.firestore.FieldValue.serverTimestamp();
    const batch = db.batch();

    activeSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        status: 'rotated',
        rotatedAt: nowTimestamp,
      });
    });

    await batch.commit();
  }

  const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

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
        if (usedTokenTripId !== tripId) {
          token = '';
        }
      }
    }
  }

  if (!token) {
    token = signInvitationJwt(
      {
        kind: 'public',
        tripId,
      },
      PUBLIC_INVITATION_TTL_SECONDS,
    );
  }

  await publicInvitationRef.update({ token });

  return {
    publicInvitationId: publicInvitationRef.id,
    token,
    tripId,
    tripName: tripData.name || tripData.nombre || 'Viaje',
  };
}

async function verifyTripPublicToken(token) {
  const resolved = await resolvePublicInvitationByToken(token);
  if (!resolved) {
    return null;
  }

  const { publicInvitationId, data, decoded } = resolved;

  if (data.status !== 'active') {
    return null;
  }

  const expiry = resolveExpiryDate(data, decoded);
  if (expiry && new Date() > expiry) {
    return null;
  }

  return {
    publicInvitationId,
    ...data,
  };
}

async function acceptTripPublicInvitation(token, userId, userEmail) {
  const invitation = await verifyTripPublicToken(token);
  if (!invitation) {
    throw new Error('Enlace de invitación no válido o expirado');
  }

  const normalizedUserEmail = normalizeEmail(userEmail);
  if (!userId || !normalizedUserEmail) {
    throw new Error('No se pudo identificar al usuario autenticado');
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
