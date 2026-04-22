import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { addActivity, addBooking, createTrip, deleteTrip, getTripPublicInviteLink, getTripPublicInvitePreview, saveTripDraft, sendTripInvitations, updateTrip } from '../../../../services/tripService';
import { ROUTES } from '../../../../config/routes';
import { STORAGE_KEY, useTripDraft } from './useTripDraft';
import { useRecentMembers } from './useRecentMembers';

export function useCreateTripController() {
  const { user } = useAuth();
  const location = useLocation();
  // Pre-relleno con vuelo pendiente
  let prefill = location.state?.prefill ?? null;
  if (!prefill && typeof window !== 'undefined') {
    const pendingFlightRaw = sessionStorage.getItem('zt_pending_flight');
    if (pendingFlightRaw) {
      try {
        const pendingFlight = JSON.parse(pendingFlightRaw);
        // Estructura básica para pre-rellenar el formulario
        prefill = {
          origin: pendingFlight?.segments?.[0]?.departureAirport?.cityName || '',
          destination: pendingFlight?.segments?.[pendingFlight.segments.length - 1]?.arrivalAirport?.cityName || '',
          startDate: pendingFlight?.segments?.[0]?.departureTime?.slice(0, 10) || '',
          endDate: pendingFlight?.segments?.[pendingFlight.segments.length - 1]?.arrivalTime?.slice(0, 10) || '',
          stops: pendingFlight?.segments?.length > 2
            ? pendingFlight.segments.slice(1, -1).map(seg => ({
                name: seg.arrivalAirport?.cityName || '',
                startDate: seg.arrivalTime?.slice(0, 10) || '',
                endDate: seg.arrivalTime?.slice(0, 10) || '',
              }))
            : [],
          hasMultipleStops: (pendingFlight?.segments?.length ?? 0) > 2,
        };
      } catch {}
    }
  }
  const { step, form, setForm, fieldErrors, handleChange, handleNext, handleBack, handleGoToStep, handleCancel, navigate } = useTripDraft(prefill);
  const { recientes, addToRecentMembers } = useRecentMembers(user);

  const draftIdRef = useRef(location.state?.draftId || null);
  const editTripIdRef = useRef(location.state?.editTripId || null);
  const isEditing = Boolean(editTripIdRef.current);

  const [previewJoinToken, setPreviewJoinToken] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [tripCreationLocked, setTripCreationLocked] = useState(false);
  const creatingTripRef = useRef(false);

  useEffect(() => {
    let active = true;
    getTripPublicInvitePreview()
      .then((data) => {
        if (!active) return;
        setPreviewJoinToken(data?.token || '');
        setInviteLink(data?.shareLink || '');
      })
      .catch((error) => {
        if (!active) return;
        console.warn('Could not get invite link preview:', error);
      });
    return () => { active = false; };
  }, []);

  const handleAddMember = (member) => {
    if (!member?.uid) return;
    setForm((prev) => {
      if (prev.members.some((item) => item.uid === member.uid)) return prev;
      return {
        ...prev,
        members: [
          ...prev.members,
          {
            id: member.uid,
            uid: member.uid,
            email: member.email || '',
            name: [member.firstName, member.lastName].filter(Boolean).join(' ') || member.name || member.email || '',
            username: member.username,
            avatar: member.avatar,
            role: 'member',
            invitationStatus: 'pending',
          },
        ],
      };
    });
  };

  const handleAddEmailGuest = (invitedUser) => {
    const email = String(invitedUser?.email || '').trim().toLowerCase();
    if (!email) return;
    setForm((prev) => {
      const exists = prev.members.some(
        (item) => (item.email || '').toLowerCase() === email || (item.uid && item.uid === invitedUser?.uid),
      );
      if (exists) return prev;
      const isRegistered = Boolean(invitedUser?.uid);
      return {
        ...prev,
        members: [
          ...prev.members,
          {
            id: invitedUser?.uid || email,
            uid: invitedUser?.uid || null,
            email,
            name: invitedUser?.name || invitedUser?.firstName || email,
            avatar: invitedUser?.avatar || '',
            role: 'member',
            invitationStatus: isRegistered ? 'pending' : 'pending_email',
          },
        ],
      };
    });
  };

  const handleRemoveMember = (invitadoId) => {
    setForm((prev) => ({
      ...prev,
      members: prev.members.filter((item) => item.id !== invitadoId),
    }));
  };

  const handleCreateTrip = async () => {
    if (!user?.uid || creatingTripRef.current || tripCreationLocked) return;

    creatingTripRef.current = true;
    setIsCreatingTrip(true);
    let tripCreated = false;

    try {
      if (isEditing) {
        await updateTrip(editTripIdRef.current, form);
        localStorage.removeItem(STORAGE_KEY);
        navigate(ROUTES.TRIPS.LIST);
        return;
      }

      const tripId = await createTrip(user.uid, form);
      tripCreated = true;
      setTripCreationLocked(true);

      const pendingHotelRaw = sessionStorage.getItem('zt_pending_hotel_booking');
      if (pendingHotelRaw) {
        try {
          const bookingData = JSON.parse(pendingHotelRaw);
          const activityId = await addActivity(tripId, {
            date: bookingData.checkIn,
            startTime: '15:00',
            endTime: '11:00',
            name: bookingData.hotelName,
            type: 'hotel',
            notes: bookingData.pricePerNight != null
              ? `Reservado · ${bookingData.pricePerNight} ${bookingData.currency}/noche · ${bookingData.nights} noche${bookingData.nights !== 1 ? 's' : ''}`
              : 'Reservado',
            status: 'reservado',
          });
          await addBooking(tripId, { ...bookingData, activityId });
        } catch {
          // si falla la reserva no bloqueamos la creación del viaje
        } finally {
          sessionStorage.removeItem('zt_pending_hotel_booking');
        }
      }

      for (const member of form.members) {
        if (member?.uid) addToRecentMembers(member);
      }

      try {
        const linkResponse = await getTripPublicInviteLink(tripId, previewJoinToken);
        const sharedLink = linkResponse?.shareLink || '';
        if (sharedLink) {
          setInviteLink(sharedLink);
          if (navigator?.clipboard?.writeText) await navigator.clipboard.writeText(sharedLink);
        }
      } catch (error) {
        console.warn('Could not generate or copy trip share link:', error);
      }

      const pendingInvites = form.members.filter(
        (item) => item.email && (item.invitationStatus === 'pending' || item.invitationStatus === 'pending_email'),
      );

      if (pendingInvites.length > 0) {
        try {
          const response = await sendTripInvitations({
            tripId,
            tripName: form.name,
            creatorName: user.displayName || user.email || 'ZenTrip',
            invites: pendingInvites,
          });
          if (response?.failed > 0) console.warn('Some invitations failed:', response);
        } catch (error) {
          console.error('Could not send all invitations:', error);
        }
      }

      localStorage.removeItem(STORAGE_KEY);

      if (draftIdRef.current) {
        try { await deleteTrip(draftIdRef.current); } catch (e) { console.warn('Could not delete draft:', e); }
      }

      if (sessionStorage.getItem('zt_pending_flight')) {
        navigate('/flights');
      } else {
        navigate(ROUTES.TRIPS.LIST);
      }
    } catch (error) {
      console.error('Could not create trip:', error);
      if (!tripCreated) setTripCreationLocked(false);
    } finally {
      creatingTripRef.current = false;
      setIsCreatingTrip(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!user?.uid) return;
    try {
      const savedId = await saveTripDraft(user.uid, form, draftIdRef.current);
      draftIdRef.current = savedId;
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error('Error saving draft:', err);
    }
    navigate(ROUTES.TRIPS.LIST);
  };

  return {
    step,
    form,
    recientes,
    fieldErrors,
    isCreatingTrip,
    tripCreationLocked,
    isEditing,
    inviteLink,
    handleChange,
    handleNext,
    handleBack,
    handleGoToStep,
    handleCancel,
    handleSaveDraft,
    handleAddMember,
    handleAddEmailGuest,
    handleRemoveMember,
    handleCreateTrip,
  };
}
