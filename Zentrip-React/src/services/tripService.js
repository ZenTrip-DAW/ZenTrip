import { addDoc, collection, collectionGroup, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db, auth } from '../config/firebaseConfig';
import { apiClient } from './apiClient';
import { deleteCloudinaryPhoto } from './cloudinaryService';

function deriveDatesFromStops(stops, fallbackStart, fallbackEnd) {
  let startDate = fallbackStart || '';
  let endDate = fallbackEnd || '';
  if (stops.length > 0) {
    const withStart = stops.filter((s) => s.startDate);
    const withEnd = stops.filter((s) => s.endDate);
    if (withStart.length > 0) startDate = withStart.map((s) => s.startDate).sort()[0];
    if (withEnd.length > 0) endDate = withEnd.map((s) => s.endDate).sort().reverse()[0];
  }
  return { startDate, endDate };
}

export async function createTrip(uid, form) {
  const { members, ...tripData } = form;
  const rawStops = Array.isArray(tripData.stops) ? tripData.stops : [];
  const { startDate, endDate } = deriveDatesFromStops(rawStops, tripData.startDate, tripData.endDate);
  const tripPayload = {
    uid,
    name: tripData.name || '',
    origin: tripData.origin || '',
    destination: tripData.destination || '',
    stops: rawStops,
    startDate,
    endDate,
    currency: tripData.currency || '',
    budget: tripData.budget || '',
    hasPet: Boolean(tripData.hasPet),
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'trips'), tripPayload);

  const memberRef = doc(db, 'trips', docRef.id, 'members', uid);
  try {
    await setDoc(memberRef, {
      uid,
      email: auth.currentUser?.email || '',
      role: 'coordinator',
      invitationStatus: 'accepted',
      acceptedAt: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.warn('No se pudo guardar el creador en members:', error);
  }

  for (const member of (members || [])) {
    if (!member?.uid) continue;
    const invitedRef = doc(db, 'trips', docRef.id, 'members', member.uid);
    try {
      await setDoc(invitedRef, {
        uid: member.uid,
        email: member.email || '',
        name: member.name || '',
        username: member.username || '',
        avatar: member.avatar || '',
        role: 'member',
        invitationStatus: member.invitationStatus || 'pending',
      }, { merge: true });
    } catch {
      // No bloquear la creación del viaje si falla la escritura de un miembro.
    }
  }

  return docRef.id;
}

export async function saveTripDraft(uid, form, existingDraftId = null) {
  const { members, ...tripData } = form;
  const payload = {
    uid,
    isDraft: true,
    name: tripData.name || '',
    origin: tripData.origin || '',
    destination: tripData.destination || '',
    startDate: tripData.startDate || '',
    endDate: tripData.endDate || '',
    currency: tripData.currency || '',
    budget: tripData.budget || '',
    hasPet: Boolean(tripData.hasPet),
    members: members || [],
    formSnapshot: form,
    updatedAt: serverTimestamp(),
  };

  if (existingDraftId) {
    await setDoc(doc(db, 'trips', existingDraftId), payload, { merge: true });
    return existingDraftId;
  }

  payload.createdAt = serverTimestamp();
  const docRef = await addDoc(collection(db, 'trips'), payload);
  return docRef.id;
}

export async function deleteTrip(tripId) {
  const subcollections = ['members', 'activities', 'bookings', 'galleryFolders', 'galleryPhotos'];
  await Promise.all(
    subcollections.map(async (sub) => {
      const snap = await getDocs(collection(db, 'trips', tripId, sub));
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
    })
  );
  await deleteDoc(doc(db, 'trips', tripId));
}

export async function updateTripCover(tripId, imageUrl) {
  await updateDoc(doc(db, 'trips', tripId), { coverImage: imageUrl });
}

export async function updateTrip(tripId, form) {
  const { members, ...tripData } = form;
  const rawStops = Array.isArray(tripData.stops) ? tripData.stops : [];
  const sorted = [...rawStops].sort((a, b) => {
    const aDate = a.startDate || '';
    const bDate = b.startDate || '';
    if (aDate && bDate) return aDate.localeCompare(bDate);
    if (aDate) return -1;
    if (bDate) return 1;
    return (a.order ?? 0) - (b.order ?? 0);
  }).map((s, i) => ({ ...s, order: i + 1 }));
  const destination = sorted.length > 0 ? sorted[sorted.length - 1].name : (tripData.destination || '');
  const { startDate, endDate } = deriveDatesFromStops(sorted, tripData.startDate, tripData.endDate);
  await updateDoc(doc(db, 'trips', tripId), {
    name: tripData.name || '',
    origin: tripData.origin || '',
    destination,
    stops: sorted,
    startDate,
    endDate,
    currency: tripData.currency || '',
    budget: tripData.budget || '',
    hasPet: Boolean(tripData.hasPet),
    updatedAt: serverTimestamp(),
  });
  return tripId;
}

export async function getUserTrips(uid) {
  // Viajes creados por el usuario
  const creatorSnapshot = await getDocs(
    query(collection(db, 'trips'), where('uid', '==', uid))
  );
  const creatorTripIds = new Set(creatorSnapshot.docs.map((d) => d.id));
  const creatorTrips = creatorSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Viajes donde el usuario es miembro (aceptado)
  let memberTrips = [];
  try {
    const memberSnapshot = await getDocs(
      query(
        collectionGroup(db, 'members'),
        where('uid', '==', uid),
        where('invitationStatus', '==', 'accepted')
      )
    );

    const memberTripDocs = await Promise.all(
      memberSnapshot.docs
        .map((d) => d.ref.parent.parent)
        .filter((ref) => !creatorTripIds.has(ref.id))
        .map((ref) => getDoc(ref))
    );

    memberTrips = memberTripDocs
      .filter((d) => d.exists())
      .map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    // La query de collectionGroup puede fallar si las reglas o el índice aún no están configurados
  }

  return [...creatorTrips, ...memberTrips].sort(
    (a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)
  );
}

export async function sendTripInvitations(payload) {
  return apiClient.post('/invitations/send', payload);
}

export async function getTripPublicInvitePreview() {
  return apiClient.get('/invitations/public-link/preview');
}

export async function getTripPublicInviteLink(tripId, preferredToken = '') {
  return apiClient.post('/invitations/public-link', { tripId, preferredToken });
}

export async function getTripById(tripId) {
  const snap = await getDoc(doc(db, 'trips', tripId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getTripMembers(tripId) {
  return apiClient.get(`/trips/${tripId}/members`);
}

export async function removeMemberFromTrip(tripId, memberUid) {
  await updateDoc(doc(db, 'trips', tripId, 'members', memberUid), {
    invitationStatus: 'removed',
  });
}

export async function addMemberToTrip(tripId, member) {
  if (!member?.uid) return;
  const memberRef = doc(db, 'trips', tripId, 'members', member.uid);
  await setDoc(memberRef, {
    uid: member.uid,
    email: member.email || '',
    name: member.name || '',
    username: member.username || '',
    avatar: member.avatar || '',
    role: 'member',
    invitationStatus: 'pending',
  }, { merge: true });
}

export async function getActivities(tripId) {
  const snap = await getDocs(collection(db, 'trips', tripId, 'activities'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addActivity(tripId, activity) {
  const docRef = await addDoc(collection(db, 'trips', tripId, 'activities'), {
    ...activity,
    createdAt: serverTimestamp(),
  });

  // --- ACTUALIZAR FECHAS DEL VIAJE SI NO HAY PARADAS ---
  const tripSnap = await getDoc(doc(db, 'trips', tripId));
  const trip = tripSnap.exists() ? tripSnap.data() : null;
  if (trip && (!trip.stops || trip.stops.length === 0)) {
    // Obtener todas las actividades y bookings para calcular el rango
    const acts = await getDocs(collection(db, 'trips', tripId, 'activities'));
    const bookings = await getDocs(collection(db, 'trips', tripId, 'bookings'));
    const fechas = [];
    acts.forEach((d) => { if (d.data().date) fechas.push(d.data().date); });
    bookings.forEach((d) => { if (d.data().date) fechas.push(d.data().date); });
    if (activity.date) fechas.push(activity.date);
    if (fechas.length > 0) {
      const sorted = fechas.sort();
      const startDate = sorted[0];
      const endDate = sorted[sorted.length - 1];
      await updateDoc(doc(db, 'trips', tripId), { startDate, endDate });
    }
  }
  return docRef.id;
}

export async function updateActivity(tripId, activityId, data) {
  await updateDoc(doc(db, 'trips', tripId, 'activities', activityId), data);
}

export async function deleteActivity(tripId, activityId) {
  await deleteDoc(doc(db, 'trips', tripId, 'activities', activityId));
}

export async function addBooking(tripId, booking) {
  const docRef = await addDoc(collection(db, 'trips', tripId, 'bookings'), {
    ...booking,
    createdAt: serverTimestamp(),
  });

  // --- ACTUALIZAR FECHAS DEL VIAJE SI NO HAY PARADAS ---
  const tripSnap = await getDoc(doc(db, 'trips', tripId));
  const trip = tripSnap.exists() ? tripSnap.data() : null;
  if (trip && (!trip.stops || trip.stops.length === 0)) {
    // Obtener todas las actividades y bookings para calcular el rango
    const acts = await getDocs(collection(db, 'trips', tripId, 'activities'));
    const bookings = await getDocs(collection(db, 'trips', tripId, 'bookings'));
    const fechas = [];
    acts.forEach((d) => { if (d.data().date) fechas.push(d.data().date); });
    bookings.forEach((d) => { if (d.data().date) fechas.push(d.data().date); });
    if (booking.date) fechas.push(booking.date);
    if (fechas.length > 0) {
      const sorted = fechas.sort();
      const startDate = sorted[0];
      const endDate = sorted[sorted.length - 1];
      await updateDoc(doc(db, 'trips', tripId), { startDate, endDate });
    }
  }
  return docRef.id;
}

export async function getBookings(tripId) {
  const snap = await getDocs(collection(db, 'trips', tripId, 'bookings'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateBooking(tripId, bookingId, data) {
  await updateDoc(doc(db, 'trips', tripId, 'bookings', bookingId), data);
}

export async function deleteBooking(tripId, bookingId) {
  await deleteDoc(doc(db, 'trips', tripId, 'bookings', bookingId));
}

// Elimina una reserva de vuelo junto con su actividad y las paradas que creó.
export async function deleteFlightBooking(tripId, bookingId) {
  const bookingSnap = await getDoc(doc(db, 'trips', tripId, 'bookings', bookingId));
  const booking = bookingSnap.exists() ? bookingSnap.data() : {};

  await deleteDoc(doc(db, 'trips', tripId, 'bookings', bookingId));

  const activityIds = booking.activityIds ?? (booking.activityId ? [booking.activityId] : []);
  for (const actId of activityIds) {
    try { await deleteDoc(doc(db, 'trips', tripId, 'activities', actId)); } catch { /* actividad ya eliminada */ }
  }

  const stopIds = booking.stopIds ?? (booking.stopId ? [booking.stopId] : []);
  if (stopIds.length === 0) return;

  // Mantener paradas referenciadas por otras reservas de vuelo
  const remaining = await getBookings(tripId);
  const otherRefs = new Set(
    remaining.flatMap((b) => b.stopIds ?? (b.stopId ? [b.stopId] : []))
  );

  const currentStops = await getStops(tripId);

  // Para paradas compartidas (otros vuelos la referencian): recalcular fechas desde los vuelos restantes
  const normName = (s) =>
    (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().split(',')[0].trim();

  const recalcDates = (stopName, bookingList) => {
    let minStart = '';
    let maxEnd = '';
    for (const b of bookingList) {
      if (!(b.stopIds ?? (b.stopId ? [b.stopId] : [])).some((id) => stopIds.includes(id))) continue;
      // Buscar la ciudad en los segmentos del vuelo
      const bSegs = b.segments ?? [];
      const arrSeg = bSegs.find((seg) =>
        normName(seg.arrivalAirport?.cityName ?? seg.arrivalAirport?.code ?? '') === normName(stopName)
      );
      const depSeg = bSegs.find((seg) =>
        normName(seg.departureAirport?.cityName ?? seg.departureAirport?.code ?? '') === normName(stopName)
      );
      const s = arrSeg?.arrivalTime?.slice(0, 10) || '';
      const e = depSeg?.departureTime?.slice(0, 10) || '';
      if (s && (!minStart || s < minStart)) minStart = s;
      if (e && (!maxEnd   || e > maxEnd))   maxEnd   = e;
    }
    return { startDate: minStart, endDate: maxEnd };
  };

  const keptStops = currentStops
    .filter((s) => !stopIds.includes(s.id) || otherRefs.has(s.id))
    .map((s) => {
      if (!stopIds.includes(s.id) || !otherRefs.has(s.id)) return s;
      // Parada compartida: recalcular fechas desde los vuelos que aún la referencian
      const { startDate, endDate } = recalcDates(s.name, remaining);
      return { ...s, startDate: startDate || s.startDate, endDate: endDate || s.endDate };
    });

  if (keptStops.length !== currentStops.length || JSON.stringify(keptStops) !== JSON.stringify(currentStops)) {
    if (keptStops.length > 0) {
      await updateStops(tripId, keptStops);
    } else {
      await updateDoc(doc(db, 'trips', tripId), { stops: [], destination: '', updatedAt: serverTimestamp() });
    }
  }
}

export async function sendBookingNotifications(tripId, { bookerUid, bookerName, hotelName, tripName }) {
  const membersSnap = await getDocs(collection(db, 'trips', tripId, 'members'));
  const recipients = membersSnap.docs
    .map((d) => d.data())
    .filter((m) => m.uid && m.uid !== bookerUid);

  await Promise.all(recipients.map((m) =>
    addDoc(collection(db, 'notifications'), {
      recipientUid: m.uid,
      type: 'hotel_booked',
      tripId,
      tripName: tripName || '',
      hotelName,
      bookerName: bookerName || 'Un miembro',
      read: false,
      createdAt: serverTimestamp(),
    })
  ));
}

// ── Paradas del viaje ────────────────────────────────────────────────────────

export async function getStops(tripId) {
  const snap = await getDoc(doc(db, 'trips', tripId));
  if (!snap.exists()) return [];
  return snap.data().stops || [];
}

export async function updateStops(tripId, stops) {
  // Si tienen fecha se ordenan por startDate; sin fecha, por order manual.
  const sorted = [...stops].sort((a, b) => {
    const aDate = a.startDate || '';
    const bDate = b.startDate || '';
    if (aDate && bDate) return aDate.localeCompare(bDate);
    if (aDate) return -1;
    if (bDate) return 1;
    return (a.order ?? 0) - (b.order ?? 0);
  }).map((s, i) => ({ ...s, order: i + 1 }));
  // Destination = parada con endDate más tardío (no la última por startDate).
  // Esto evita que una parada interna (ej. Chiang Mai mayo 3-8 dentro de Bangkok mayo 2-10)
  // sobreescriba el destino final del viaje.
  const destination = sorted.reduce((best, s) => {
    if (!best) return s;
    const sKey = s.endDate || s.startDate || '';
    const bestKey = best.endDate || best.startDate || '';
    return sKey > bestKey ? s : best;
  }, null)?.name ?? (sorted.length > 0 ? sorted[sorted.length - 1].name : '');
  await updateDoc(doc(db, 'trips', tripId), {
    stops: sorted,
    destination,
    updatedAt: serverTimestamp(),
  });
}

// insertBeforeLast=true → inserta como parada intermedia sin cambiar el destino del viaje
export async function addStop(tripId, stop, { insertBeforeLast = false } = {}) {
  const existing = await getStops(tripId);
  const sorted = [...existing].sort((a, b) => a.order - b.order);
  const maxOrder = sorted.length > 0 ? sorted[sorted.length - 1].order : 0;

  // Normaliza nombre para comparación: sin acentos, minúsculas, primera parte antes de coma
  const normName = (s) =>
    (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().split(',')[0].trim();
  const newName = normName(stop.name || '');

  // Si ya existe una parada con el mismo nombre → actualizar fechas en lugar de duplicar.
  // Esto evita el caso Bangkok→Bangkok cuando el vuelo llega al destino ya configurado del viaje.
  const matchIdx = newName
    ? sorted.findIndex((s) => normName(s.name) === newName)
    : -1;
  if (matchIdx >= 0) {
    const updated = sorted.map((s, i) => {
      if (i !== matchIdx) return s;
      // Expandir rango: min(startDate) y max(endDate) para cubrir a todos los viajeros del grupo
      const ns = stop.startDate;
      const ne = stop.endDate;
      const cs = s.startDate;
      const ce = s.endDate;
      return {
        ...s,
        startDate: ns && cs ? (ns < cs ? ns : cs) : ns || cs || '',
        endDate:   ne && ce ? (ne > ce ? ne : ce) : ne || ce || '',
      };
    });
    await updateStops(tripId, updated);
    return updated[matchIdx];
  }

  // Si la nueva parada cae DENTRO del rango de una parada existente → partirla en tres tramos.
  // Ej: Bangkok(1-10) + Chiang Mai(3-8) → Bangkok(1-3), Chiang Mai(3-8), Bangkok(8-10)
  // GUARD: solo si la parada anfitriona la referencia un único vuelo.
  // Si varios miembros del grupo tienen vuelos a esa ciudad (union expand), el stop es compartido
  // y partirlo corrupmería los datos de otros miembros al borrar su vuelo.
  if (stop.startDate && stop.endDate) {
    const hostIdx = sorted.findIndex((s) =>
      s.startDate && s.endDate &&
      stop.startDate >= s.startDate &&
      stop.endDate <= s.endDate
    );
    if (hostIdx >= 0) {
      const host = sorted[hostIdx];
      const allBookings = await getBookings(tripId);
      const sharedCount = allBookings.filter((b) =>
        (b.stopIds ?? (b.stopId ? [b.stopId] : [])).includes(host.id)
      ).length;

      if (sharedCount <= 1) {
        const others = sorted.filter((_, i) => i !== hostIdx);
        const newStop = { id: crypto.randomUUID(), name: stop.name || '', startDate: stop.startDate, endDate: stop.endDate, order: 0 };
        const parts = [];
        if (host.startDate !== stop.startDate) {
          parts.push({ ...host, endDate: stop.startDate });
        }
        parts.push(newStop);
        const part2 = host.endDate !== stop.endDate
          ? { ...host, id: crypto.randomUUID(), startDate: stop.endDate }
          : null;
        if (part2) parts.push(part2);
        await updateStops(tripId, [...others, ...parts]);
        return part2 ? [newStop, part2] : [newStop];
      }
      // sharedCount > 1: la parada es compartida entre varios miembros → no partir,
      // se añade la parada interna sin tocar el stop anfitrión (las fechas se solaparán
      // pero es el comportamiento correcto para itinerarios de grupo divergentes)
    }
  }

  // Si solo hay un destino (ninguna parada), al añadir la primera parada, preserva el destino original
  if (sorted.length === 1) {
    const destinoOriginal = sorted[0];
    const newStop = { id: crypto.randomUUID(), name: stop.name || '', order: 1, startDate: stop.startDate || '', endDate: stop.endDate || '' };
    // El destino original pasa a ser el segundo tramo
    const destinoFinal = { ...destinoOriginal, order: 2 };
    await updateStops(tripId, [newStop, destinoFinal]);
    return newStop;
  }

  if (insertBeforeLast && sorted.length > 0) {
    const shifted = sorted.map((s, i) =>
      i === sorted.length - 1 ? { ...s, order: s.order + 1 } : s
    );
    const newStop = { id: crypto.randomUUID(), name: stop.name || '', order: maxOrder, startDate: stop.startDate || '', endDate: stop.endDate || '' };
    await updateStops(tripId, [...shifted, newStop]);
    return newStop;
  }

  const newStop = { id: crypto.randomUUID(), name: stop.name || '', order: stop.order ?? maxOrder + 1, startDate: stop.startDate || '', endDate: stop.endDate || '' };
  await updateStops(tripId, [...existing, newStop]);
  return newStop;
}

export async function sendFlightBookingNotifications(tripId, { bookerUid, bookerName, flightLabel, tripName }) {
  const membersSnap = await getDocs(collection(db, 'trips', tripId, 'members'));
  const recipients = membersSnap.docs
    .map((d) => d.data())
    .filter((m) => m.uid && m.uid !== bookerUid);

  await Promise.all(recipients.map((m) =>
    addDoc(collection(db, 'notifications'), {
      recipientUid: m.uid,
      type: 'flight_booked',
      tripId,
      tripName: tripName || '',
      flightLabel,
      bookerName: bookerName || 'Un miembro',
      read: false,
      createdAt: serverTimestamp(),
    })
  ));
}

export async function sendRestaurantBookingNotifications(tripId, { bookerUid, bookerName, restaurantName, tripName }) {
  const membersSnap = await getDocs(collection(db, 'trips', tripId, 'members'));
  const recipients = membersSnap.docs
    .map((d) => d.data())
    .filter((m) => m.uid && m.uid !== bookerUid);

  await Promise.all(recipients.map((m) =>
    addDoc(collection(db, 'notifications'), {
      recipientUid: m.uid,
      type: 'restaurant_booked',
      tripId,
      tripName: tripName || '',
      restaurantName,
      bookerName: bookerName || 'Un miembro',
      read: false,
      createdAt: serverTimestamp(),
    })
  ));
}

export async function sendActivityBookingNotifications(tripId, { bookerUid, bookerName, activityName, tripName }) {
  const membersSnap = await getDocs(collection(db, 'trips', tripId, 'members'));
  const recipients = membersSnap.docs
    .map((d) => d.data())
    .filter((m) => m.uid && m.uid !== bookerUid);

  await Promise.all(recipients.map((m) =>
    addDoc(collection(db, 'notifications'), {
      recipientUid: m.uid,
      type: 'activity_booked',
      tripId,
      tripName: tripName || '',
      activityName,
      bookerName: bookerName || 'Un miembro',
      read: false,
      createdAt: serverTimestamp(),
    })
  ));
}

// Trip gallery

export async function getGalleryFolders(tripId) {
  const snap = await getDocs(collection(db, 'trips', tripId, 'galleryFolders'));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const aTs = a?.createdAt?.seconds ?? 0;
      const bTs = b?.createdAt?.seconds ?? 0;
      return aTs - bTs;
    });
}

export async function createGalleryFolder(tripId, folderName, createdBy) {
  const trimmed = String(folderName || '').trim();
  if (!trimmed) throw new Error('Folder name is required.');

  const existing = await getGalleryFolders(tripId);
  const duplicate = existing.find((f) => String(f.name || '').toLowerCase() === trimmed.toLowerCase());
  if (duplicate) return duplicate;

  const docRef = await addDoc(collection(db, 'trips', tripId, 'galleryFolders'), {
    name: trimmed,
    createdByUid: createdBy?.uid || '',
    createdByName: createdBy?.name || createdBy?.email || 'Unknown user',
    createdAt: serverTimestamp(),
  });

  return {
    id: docRef.id,
    name: trimmed,
    createdByUid: createdBy?.uid || '',
    createdByName: createdBy?.name || createdBy?.email || 'Unknown user',
  };
}

export async function deleteGalleryFolder(tripId, folderId) {
  if (!tripId || !folderId) throw new Error('Trip id and folder id are required.');
  await deleteDoc(doc(db, 'trips', tripId, 'galleryFolders', folderId));
}

export async function getGalleryPhotos(tripId) {
  const snap = await getDocs(collection(db, 'trips', tripId, 'galleryPhotos'));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const aTs = a?.createdAt?.seconds ?? 0;
      const bTs = b?.createdAt?.seconds ?? 0;
      return bTs - aTs;
    });
}

export async function addGalleryPhoto(tripId, photoData) {
  const docRef = await addDoc(collection(db, 'trips', tripId, 'galleryPhotos'), {
    ...photoData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function deleteGalleryPhoto(tripId, photoId, publicId) {
  if (!tripId || !photoId) throw new Error('Trip id and photo id are required.');
  await deleteDoc(doc(db, 'trips', tripId, 'galleryPhotos', photoId));
  if (publicId) {
    await deleteCloudinaryPhoto(publicId).catch(() => {});
  }
}
