const { sendTripInvitationEmail } = require('../services/email/mailjetService');
const { createInvitation } = require('../services/email/invitationTokenService');
const { verifyToken, acceptInvitation } = require('../services/email/invitationTokenService');
const { claimPendingInvitationsForUser } = require('../services/email/invitationTokenService');
const { upsertTripMember } = require('../services/email/invitationTokenService');
const admin = require('../config/firebase');

async function getRegisteredUserByEmail(email) {
  try {
    const userRecord = await admin.auth().getUserByEmail(String(email).trim().toLowerCase());
    return userRecord;
  } catch (error) {
    if (error?.code === 'auth/user-not-found') {
      return null;
    }
    throw error;
  }
}

const sendTripInvitations = async (req, res) => {
  const { tripId, tripName, creatorName, invites = [] } = req.body;
  const creatorId = req.user?.uid;

  if (!tripId || !tripName) {
    return res.status(400).json({ error: 'tripId y tripName son obligatorios' });
  }

  const emailInvites = invites.filter((invite) => invite?.email);

  if (emailInvites.length === 0) {
    return res.json({ message: 'No hay invitaciones por correo para enviar', sent: 0 });
  }

  const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';
  const registerLink = `${frontendUrl}/auth/register`;
  const loginLink = `${frontendUrl}/auth/login`;

  const results = [];

  for (const invite of emailInvites) {
    try {
      const normalizedEmail = String(invite.email).trim().toLowerCase();
      const registeredUser = await getRegisteredUserByEmail(normalizedEmail);

      const { token } = await createInvitation({
        tripId,
        tripName,
        email: normalizedEmail,
        creatorId,
        creatorName,
      });

      const recipientIsRegistered = Boolean(registeredUser?.uid);
      const authLink = recipientIsRegistered ? loginLink : registerLink;
      const recipientName = registeredUser?.displayName || invite.nombre || invite.email;

      await upsertTripMember({
        tripId,
        member: {
          email: normalizedEmail,
          uid: registeredUser?.uid || invite?.uid || null,
          rol: 'miembro',
          estadoInvitacion: 'pendiente',
        },
      });

      const providerResult = await sendTripInvitationEmail({
        toEmail: normalizedEmail,
        toName: recipientName,
        tripName,
        creatorName: creatorName || req.user?.email || 'ZenTrip',
        tripLink: authLink,
        invitationToken: token,
        recipientIsRegistered,
      });
      results.push({
        email: invite.email,
        status: 'sent',
        recipientIsRegistered,
        providerResult,
      });
    } catch (error) {
      console.error(`Error enviando invitación a ${invite.email}:`, error.message);
      results.push({ email: invite.email, status: 'failed', error: error.message });
    }
  }

  const sent = results.filter((item) => item.status === 'sent').length;
  const failed = results.filter((item) => item.status === 'failed').length;
  const sentToRegistered = results.filter((item) => item.status === 'sent' && item.recipientIsRegistered).length;
  const sentToUnregistered = results.filter((item) => item.status === 'sent' && !item.recipientIsRegistered).length;

  return res.json({
    message: 'Proceso de invitaciones por correo completado',
    sent,
    failed,
    sentToRegistered,
    sentToUnregistered,
    results,
  });
};

const verifyInvitationToken = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token es obligatorio' });
  }

  try {
    const invitation = await verifyToken(token);

    if (!invitation) {
      return res.status(404).json({ error: 'Invitación no válida o expirada' });
    }

    return res.json({
      valid: true,
      email: invitation.email,
      tripName: invitation.tripName,
      tripId: invitation.tripId,
      creatorName: invitation.creatorName,
    });
  } catch (error) {
    console.error('Error al verificar token:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

const acceptInvitationHandler = async (req, res) => {
  const { token } = req.body;
  const userId = req.user?.uid;
  const userEmail = req.user?.email;

  if (!token || !userId) {
    return res.status(400).json({ error: 'Token y autenticación son obligatorios' });
  }

  try {
    const { tripId, invitationId, alreadyAccepted } = await acceptInvitation(token, userId, userEmail);

    if (alreadyAccepted) {
      return res.json({
        message: 'Esta invitación ya fue aceptada. Ya estás dentro del viaje.',
        tripId,
        invitationId,
        alreadyAccepted: true,
      });
    }

    return res.json({
      message: 'Invitación aceptada',
      tripId,
      invitationId,
    });
  } catch (error) {
    console.error('Error al aceptar invitación:', error.message);
    return res.status(400).json({ error: error.message });
  }
};

const claimMyInvitationsHandler = async (req, res) => {
  const userId = req.user?.uid;
  const userEmail = req.user?.email;

  if (!userId || !userEmail) {
    return res.status(400).json({ error: 'Autenticación inválida para reclamar invitaciones' });
  }

  try {
    const claimed = await claimPendingInvitationsForUser(userId, userEmail);
    return res.json({
      message: 'Reclamación de invitaciones completada',
      claimedCount: claimed.length,
      claimed,
    });
  } catch (error) {
    console.error('Error al reclamar invitaciones:', error.message);
    return res.status(400).json({ error: error.message });
  }
};

module.exports = {
  sendTripInvitations,
  verifyInvitationToken,
  acceptInvitationHandler,
  claimMyInvitationsHandler,
};