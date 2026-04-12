import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { createTrip, getTripPublicInviteLink, getTripPublicInvitePreview, sendTripInvitations } from '../../../../services/tripService';
import { STORAGE_KEY, useTripDraft } from './useTripDraft';
import { useRecentMembers } from './useRecentMembers';

export function useCreateTripController() {
  const { user } = useAuth();
  const { step, form, setForm, fieldErrors, handleChange, handleSiguiente, handleAtras, handleGoToStep } = useTripDraft();
  const { recientes, addToRecentMembers } = useRecentMembers(user);

  const [previewJoinToken, setPreviewJoinToken] = useState('');
  const [enlaceInvitacion, setEnlaceInvitacion] = useState('');
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [tripCreationLocked, setTripCreationLocked] = useState(false);
  const creatingTripRef = useRef(false);

  useEffect(() => {
    let active = true;
    getTripPublicInvitePreview()
      .then((data) => {
        if (!active) return;
        setPreviewJoinToken(data?.token || '');
        setEnlaceInvitacion(data?.shareLink || '');
      })
      .catch((error) => {
        if (!active) return;
        console.warn('No se pudo obtener preview de enlace de invitación:', error);
      });
    return () => { active = false; };
  }, []);

  const handleAgregarMiembro = (member) => {
    if (!member?.uid) return;
    setForm((prev) => {
      if (prev.miembros.some((item) => item.uid === member.uid)) return prev;
      return {
        ...prev,
        miembros: [
          ...prev.miembros,
          {
            id: member.uid,
            uid: member.uid,
            email: member.email || '',
            nombre: [member.nombre, member.apellidos].filter(Boolean).join(' ') || member.email || '',
            username: member.username,
            avatar: member.avatar,
            tipo: 'miembro',
            estadoInvitacion: 'pendiente',
          },
        ],
      };
    });
  };

  const handleAgregarInvitadoEmail = (invitedUser) => {
    const email = String(invitedUser?.email || '').trim().toLowerCase();
    if (!email) return;
    setForm((prev) => {
      const exists = prev.miembros.some(
        (item) => (item.email || '').toLowerCase() === email || (item.uid && item.uid === invitedUser?.uid),
      );
      if (exists) return prev;
      const isRegisteredMember = Boolean(invitedUser?.uid);
      return {
        ...prev,
        miembros: [
          ...prev.miembros,
          {
            id: invitedUser?.uid || email,
            uid: invitedUser?.uid || null,
            email,
            nombre: invitedUser?.nombre || email,
            avatar: invitedUser?.avatar || '',
            tipo: isRegisteredMember ? 'miembro' : 'email',
            estadoInvitacion: isRegisteredMember ? 'pendiente' : 'pendiente_correo',
          },
        ],
      };
    });
  };

  const handleEliminarInvitado = (participantId) => {
    setForm((prev) => ({
      ...prev,
      miembros: prev.miembros.filter((item) => item.id !== participantId),
    }));
  };

  const handleCrearViaje = async () => {
    if (!user?.uid || creatingTripRef.current || tripCreationLocked) return;

    creatingTripRef.current = true;
    setIsCreatingTrip(true);
    let tripCreated = false;

    try {
      const tripId = await createTrip(user.uid, form);
      tripCreated = true;
      setTripCreationLocked(true);

      for (const member of form.miembros) {
        if (member?.uid) addToRecentMembers(member);
      }

      try {
        const linkResponse = await getTripPublicInviteLink(tripId, previewJoinToken);
        const sharedLink = linkResponse?.shareLink || '';
        if (sharedLink) {
          setEnlaceInvitacion(sharedLink);
          if (navigator?.clipboard?.writeText) await navigator.clipboard.writeText(sharedLink);
        }
      } catch (error) {
        console.warn('No se pudo generar o copiar el enlace compartible del viaje:', error);
      }

      const pendingInvites = form.miembros.filter(
        (item) => item.email && (item.estadoInvitacion === 'pendiente' || item.estadoInvitacion === 'pendiente_correo'),
      );

      if (pendingInvites.length > 0) {
        try {
          const response = await sendTripInvitations({
            tripId,
            tripName: form.nombre,
            creatorName: user.displayName || user.email || 'ZenTrip',
            invites: pendingInvites,
          });
          if (response?.failed > 0) console.warn('Invitaciones con errores:', response);
          else console.info('Invitaciones enviadas correctamente:', response);
        } catch (error) {
          console.error('No se pudieron enviar todas las invitaciones por correo:', error);
        }
      }

      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('No se pudo crear el viaje:', error);
      if (!tripCreated) setTripCreationLocked(false);
    } finally {
      creatingTripRef.current = false;
      setIsCreatingTrip(false);
    }
  };

  return {
    step,
    form,
    recientes,
    fieldErrors,
    isCreatingTrip,
    tripCreationLocked,
    enlaceInvitacion,
    handleChange,
    handleSiguiente,
    handleAtras,
    handleGoToStep,
    handleAgregarMiembro,
    handleAgregarInvitadoEmail,
    handleEliminarInvitado,
    handleCrearViaje,
  };
}
