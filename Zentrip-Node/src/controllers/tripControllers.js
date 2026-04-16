const admin = require('../config/firebase');
const { AppError } = require('../errors');

/**
 * GET /api/trips/:tripId/members
 * Devuelve los miembros del viaje enriquecidos con datos de perfil.
 * Solo accesible si el usuario autenticado es miembro o creador del viaje.
 */
const getTripMembers = async (req, res, next) => {
  const { tripId } = req.params;
  const requestingUid = req.user.uid;

  if (!tripId) return next(new AppError('tripId requerido', 400, 'VALIDATION_ERROR'));

  try {
    const db = admin.firestore();

    // Verificar que el viaje existe y que el usuario tiene acceso
    const tripSnap = await db.collection('trips').doc(tripId).get();
    if (!tripSnap.exists) return next(new AppError('Viaje no encontrado', 404, 'NOT_FOUND'));

    const tripData = tripSnap.data();
    const isCreator = tripData.uid === requestingUid;

    // Comprobar si el usuario es miembro aceptado
    const requestingMemberSnap = await db
      .collection('trips').doc(tripId)
      .collection('members').doc(requestingUid)
      .get();

    const isMember = requestingMemberSnap.exists &&
      requestingMemberSnap.data().invitationStatus === 'accepted';

    if (!isCreator && !isMember) {
      return next(new AppError('No tienes acceso a este viaje', 403, 'FORBIDDEN'));
    }

    // Leer todos los miembros
    const membersSnap = await db
      .collection('trips').doc(tripId)
      .collection('members')
      .get();

    const members = membersSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((m) => m.invitationStatus !== 'removed');

    // Enriquecer con datos de perfil de la colección users
    const enriched = await Promise.all(
      members.map(async (member) => {
        if (!member.uid) return member;
        try {
          const profileSnap = await db.collection('users').doc(member.uid).get();
          if (profileSnap.exists) {
            const p = profileSnap.data();
            const firstName = p.firstName || '';
            const lastName = p.lastName || '';
            return {
              ...member,
              name: `${firstName} ${lastName}`.trim() || member.name || '',
              username: p.username || member.username || '',
              avatar: p.profilePhoto || member.avatar || '',
              avatarColor: p.avatarColor || member.avatarColor || '',
            };
          }
        } catch {
          // Si falla el perfil, devolvemos los datos base del miembro
        }
        return member;
      })
    );

    res.json(enriched);
  } catch (error) {
    console.error('[getTripMembers] Error:', error);
    return next(error);
  }
};

module.exports = { getTripMembers };
