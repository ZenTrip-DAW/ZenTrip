const { sendTripInvitationEmail } = require('../services/email/mailjetService');
const { createInvitation } = require('../services/email/invitationTokenService');
const { verifyToken, acceptInvitation } = require('../services/email/invitationTokenService');
const { claimPendingInvitationsForUser } = require('../services/email/invitationTokenService');
const { upsertTripMember } = require('../services/email/invitationTokenService');
const { getOrCreateTripPublicInvitation, signInvitationJwt } = require('../services/email/invitationTokenService');
const { verifyTripPublicToken, acceptTripPublicInvitation } = require('../services/email/invitationTokenService');
const admin = require('../config/firebase');

function getFrontendBaseUrl() {
  return process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173';
}

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

  const frontendUrl = getFrontendBaseUrl();
  const registerLink = `${frontendUrl}/auth/register`;
  const loginLink = `${frontendUrl}/auth/login`;

  const results = [];

  for (const invite of emailInvites) {
    try {
      const normalizedEmail = String(invite.email).trim().toLowerCase();
      const registeredUser = await getRegisteredUserByEmail(normalizedEmail);

      const { token, alreadyAccepted } = await createInvitation({
        tripId,
        tripName,
        email: normalizedEmail,
        creatorId,
        creatorName,
      });

      // Ya es miembro → no reenviar correo
      if (alreadyAccepted) {
        results.push({ email: invite.email, status: 'already_member' });
        continue;
      }

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
      return res.status(404).json({ error: 'Invitación no válida' });
    }

    if (invitation.expired) {
      return res.status(410).json({
        error: 'La invitación ha caducado. Pide al organizador que te reenvíe el correo.',
        expired: true,
      });
    }

    return res.json({
      valid: true,
      email: invitation.email,
      tripName: invitation.tripName,
      tripId: invitation.tripId,
      creatorName: invitation.creatorName,
      requiresEmailMatch: true,
      inviteMode: 'email',
    });
  } catch (error) {
    console.error('Error al verificar token:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

const createOrGetTripPublicLinkHandler = async (req, res) => {
  const { tripId, preferredToken } = req.body;
  const creatorId = req.user?.uid;

  if (!tripId || !creatorId) {
    return res.status(400).json({ error: 'tripId y autenticación son obligatorios' });
  }

  try {
    const result = await getOrCreateTripPublicInvitation({ tripId, creatorId, preferredToken });
    const frontendUrl = getFrontendBaseUrl();
    const shareLink = `${frontendUrl}/auth/login?join=${encodeURIComponent(result.token)}`;

    return res.json({
      message: 'Enlace compartible del viaje listo',
      tripId: result.tripId,
      tripName: result.tripName,
      token: result.token,
      shareLink,
    });
  } catch (error) {
    console.error('Error al crear/obtener enlace público:', error.message);
    return res.status(400).json({ error: error.message });
  }
};

const getTripPublicLinkPreviewHandler = async (_req, res) => {
  try {
    const frontendUrl = getFrontendBaseUrl();
    const token = signInvitationJwt({ kind: 'public', scope: 'preview' }, 365 * 24 * 60 * 60);
    const shareLink = `${frontendUrl}/auth/login?join=${encodeURIComponent(token)}`;

    return res.json({
      token,
      shareLink,
    });
  } catch (error) {
    console.error('Error al generar preview de enlace público:', error.message);
    return res.status(500).json({ error: 'No se pudo generar el enlace de invitación' });
  }
};
const regenerateTripPublicLinkHandler = async (req, res) => {
  const { tripId } = req.body;
  const creatorId = req.user?.uid;

  if (!tripId || !creatorId) {
    return res.status(400).json({ error: 'tripId y autenticación son obligatorios' });
  }

  try {
    const result = await getOrCreateTripPublicInvitation({ tripId, creatorId, forceRegenerate: true });
    const frontendUrl = getFrontendBaseUrl();
    const shareLink = `${frontendUrl}/auth/login?join=${encodeURIComponent(result.token)}`;

    return res.json({
      message: 'Enlace compartible regenerado',
      tripId: result.tripId,
      tripName: result.tripName,
      token: result.token,
      shareLink,
    });
  } catch (error) {
    console.error('Error al regenerar enlace público:', error.message);
    return res.status(400).json({ error: error.message });
  }
};

const verifyTripPublicTokenHandler = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token es obligatorio' });
  }

  try {
    const invitation = await verifyTripPublicToken(token);

    if (!invitation) {
      return res.status(404).json({ error: 'Enlace de invitación no válido' });
    }

    if (invitation.expired) {
      return res.status(410).json({
        error: 'El enlace ha caducado. Pide al organizador que comparta el nuevo enlace.',
        expired: true,
      });
    }

    if (invitation.rotated) {
      return res.status(410).json({
        error: 'Este enlace ya no es válido. El organizador ha generado uno nuevo.',
        rotated: true,
      });
    }

    return res.json({
      valid: true,
      tripName: invitation.tripName,
      tripId: invitation.tripId,
      requiresEmailMatch: false,
      inviteMode: 'public',
    });
  } catch (error) {
    console.error('Error al verificar enlace público:', error.message);
    return res.status(500).json({ error: error.message });
  }
};

const acceptTripPublicInvitationHandler = async (req, res) => {
  const { token } = req.body;
  const userId = req.user?.uid;
  const userEmail = req.user?.email;

  if (!token || !userId || !userEmail) {
    return res.status(400).json({ error: 'Token y autenticación son obligatorios' });
  }

  try {
    const result = await acceptTripPublicInvitation(token, userId, userEmail);

    if (result.alreadyMember) {
      return res.json({
        message: 'Ya eres miembro de este viaje.',
        tripId: result.tripId,
        alreadyMember: true,
      });
    }

    return res.json({
      message: 'Te uniste al viaje con el enlace compartible',
      tripId: result.tripId,
      publicInvitationId: result.publicInvitationId,
    });
  } catch (error) {
    console.error('Error al aceptar enlace público:', error.message);
    return res.status(400).json({ error: error.message });
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
  createOrGetTripPublicLinkHandler,
  getTripPublicLinkPreviewHandler,
  regenerateTripPublicLinkHandler,
  verifyTripPublicTokenHandler,
  acceptTripPublicInvitationHandler,
};