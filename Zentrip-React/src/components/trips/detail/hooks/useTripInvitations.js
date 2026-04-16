import { useEffect, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { addMemberToTrip, removeMemberFromTrip, getTripPublicInviteLink, sendTripInvitations } from '../../../../services/tripService';
import { useRecentMembers } from '../../create/hooks/useRecentMembers';

export function useTripInvitations(tripId, tripName, initialMembers = [], onMemberRemoved) {
  const { user } = useAuth();
  const [invitados, setInvitados] = useState(initialMembers);
  const [inviteLink, setInviteLink] = useState('');
  const { recientes, addToRecentMembers } = useRecentMembers(user);

  useEffect(() => {
    setInvitados(initialMembers);
  }, [initialMembers]);

  useEffect(() => {
    if (!tripId) return;
    let active = true;
    getTripPublicInviteLink(tripId, '')
      .then((data) => { if (active) setInviteLink(data?.shareLink || ''); })
      .catch(() => {});
    return () => { active = false; };
  }, [tripId]);

  const handleAddMember = async (member) => {
    if (!member?.uid) return;
    if (invitados.some((i) => i.uid === member.uid)) return;

    const newMember = {
      id: member.uid,
      uid: member.uid,
      email: member.email || '',
      name: [member.firstName, member.lastName].filter(Boolean).join(' ') || member.name || member.email || '',
      username: member.username || '',
      avatar: member.avatar || '',
      role: 'member',
      invitationStatus: 'pending',
    };

    setInvitados((prev) => [...prev, newMember]);
    addToRecentMembers(member);

    try {
      await addMemberToTrip(tripId, newMember);
      await sendTripInvitations({
        tripId,
        tripName,
        creatorName: user?.displayName || user?.email || 'ZenTrip',
        invites: [newMember],
      });
    } catch (err) {
      console.error('[useTripInvitations] Error al añadir miembro:', err);
    }
  };

  const handleAddEmailGuest = async (invitedUser) => {
    const email = String(invitedUser?.email || '').trim().toLowerCase();
    if (!email) return;

    const exists = invitados.some(
      (i) => (i.email || '').toLowerCase() === email || (i.uid && i.uid === invitedUser?.uid),
    );
    if (exists) return;

    const isRegistered = Boolean(invitedUser?.uid);
    const newMember = {
      id: invitedUser?.uid || email,
      uid: invitedUser?.uid || null,
      email,
      name: invitedUser?.name || invitedUser?.firstName || email,
      avatar: invitedUser?.avatar || '',
      role: 'member',
      invitationStatus: isRegistered ? 'pending' : 'pending_email',
    };

    setInvitados((prev) => [...prev, newMember]);

    try {
      if (isRegistered) await addMemberToTrip(tripId, newMember);
      await sendTripInvitations({
        tripId,
        tripName,
        creatorName: user?.displayName || user?.email || 'ZenTrip',
        invites: [newMember],
      });
    } catch (err) {
      console.error('[useTripInvitations] Error al invitar por email:', err);
    }
  };

  const handleRemoveMember = async (invitadoId) => {
    const member = invitados.find((i) => i.id === invitadoId);
    if (!member || member.role === 'coordinator') return;

    setInvitados((prev) => prev.filter((i) => i.id !== invitadoId));

    try {
      await removeMemberFromTrip(tripId, member.uid || invitadoId);
      onMemberRemoved?.(member.uid || invitadoId);
    } catch (err) {
      console.error('[useTripInvitations] Error al eliminar miembro:', err);
      setInvitados((prev) => [...prev, member]);
    }
  };

  return {
    invitados,
    inviteLink,
    recientes,
    handleAddMember,
    handleAddEmailGuest,
    handleRemoveMember,
  };
}
