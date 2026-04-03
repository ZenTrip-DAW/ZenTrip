const crypto = require('crypto');
const admin = require('../../config/firebase');

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function buildMemberDocId({ email, uid }) {
  const normalizedEmail = normalizeEmail(email);
  if (normalizedEmail) return normalizedEmail;
  return String(uid || '').trim();
}

async function upsertTripMember({ tripId, member }) {
  const db = admin.firestore();
  const memberDocId = buildMemberDocId(member);
  if (!memberDocId) return;

  const memberRef = db.collection('viajes').doc(tripId).collection('miembros').doc(memberDocId);

  const payload = {
    email: normalizeEmail(member.email),
    uid: member.uid || null,
    rol: member.rol || 'miembro',
    estadoInvitacion: member.estadoInvitacion || 'pendiente',
  };

  if (member.estadoInvitacion === 'pendiente' || member.estadoInvitacion === 'pendiente_correo') {
    payload.invitadoEn = admin.firestore.FieldValue.serverTimestamp();
  }

  if (member.estadoInvitacion === 'aceptada') {
    payload.aceptadoEn = admin.firestore.FieldValue.serverTimestamp();
  }

  await memberRef.set(payload, { merge: true });
}

async function applyAcceptanceToTrip({ tripId, invitedEmail, userId }) {
  const db = admin.firestore();
  const tripRef = db.collection('viajes').doc(tripId);
  const tripDoc = await tripRef.get();

  if (!tripDoc.exists) {
    throw new Error('No se encontró el viaje asociado a la invitación');
  }

  const normalizedEmail = String(invitedEmail || '').trim().toLowerCase();

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

async function createInvitation({ tripId, tripName, email, creatorId, creatorName }) {
  const db = admin.firestore();
  const token = generateToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 días

  const invitationRef = await db.collection('invitations').add({
    tripId,
    tripName,
    email: String(email).trim().toLowerCase(),
    creatorId,
    creatorName,
    token,
    status: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
  });

  return { invitationId: invitationRef.id, token };
}

async function verifyToken(token) {
  const db = admin.firestore();
  const snapshot = await db
    .collection('invitations')
    .where('token', '==', token)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  if (data.status !== 'pending') {
    return null;
  }

  const expiry = data.expiresAt.toDate();
  if (new Date() > expiry) {
    return null;
  }

  return { invitationId: doc.id, ...data };
}

async function acceptInvitation(token, userId, userEmail) {
  const db = admin.firestore();
  const snapshot = await db
    .collection('invitations')
    .where('token', '==', token)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new Error('Invitación no válida');
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  const normalizedInvitationEmail = String(data.email || '').trim().toLowerCase();
  const normalizedUserEmail = String(userEmail || '').trim().toLowerCase();
  if (!normalizedUserEmail || normalizedInvitationEmail !== normalizedUserEmail) {
    throw new Error('El correo autenticado no coincide con el correo invitado');
  }

  if (data.status === 'accepted') {
    return {
      tripId: data.tripId,
      invitationId: doc.id,
      alreadyAccepted: true,
    };
  }

  if (data.status !== 'pending') {
    throw new Error('Invitación ya fue procesada y no puede aceptarse');
  }

  const expiry = data.expiresAt.toDate();
  if (new Date() > expiry) {
    throw new Error('Invitación expirada');
  }

  await db.collection('invitations').doc(doc.id).update({
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

  return { tripId: data.tripId, invitationId: doc.id };
}

async function claimPendingInvitationsForUser(userId, userEmail) {
  const db = admin.firestore();
  const normalizedUserEmail = String(userEmail || '').trim().toLowerCase();

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

    await db.collection('invitations').doc(doc.id).update({
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

module.exports = {
  createInvitation,
  verifyToken,
  acceptInvitation,
  claimPendingInvitationsForUser,
  upsertTripMember,
  generateToken,
};
