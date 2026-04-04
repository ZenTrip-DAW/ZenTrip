import { useEffect, useState } from 'react';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../../../../config/firebaseConfig';
import { getUserByUid } from '../../../../services/userService';
import { MAX_RECENT_MEMBERS, normalizeRecentMembers } from '../../../../utils/members';

const RECENT_MEMBERS_KEY_PREFIX = 'zentrip:create-trip-recent-members';

function getStorageKey(uid) {
  return `${RECENT_MEMBERS_KEY_PREFIX}:${uid}`;
}

function loadFromCache(uid) {
  try {
    const raw = localStorage.getItem(getStorageKey(uid));
    return normalizeRecentMembers(raw ? JSON.parse(raw) : [], uid);
  } catch {
    return [];
  }
}

export function useRecentMembers(user) {
  const [recientes, setRecientes] = useState([]);

  // Carga inicial desde caché.
  useEffect(() => {
    if (!user?.uid) { setRecientes([]); return; }
    setRecientes(loadFromCache(user.uid));
  }, [user?.uid]);

  // Enriquece con datos de viajes anteriores vía Firestore + backend.
  useEffect(() => {
    if (!user?.uid) return;
    let active = true;

    const load = async () => {
      try {
        const tripsQuery = query(
          collection(db, 'viajes'),
          where('uid', '==', user.uid),
          limit(20),
        );
        const tripsSnapshot = await getDocs(tripsQuery);
        const membersFromTrips = [];

        for (const tripDoc of tripsSnapshot.docs) {
          const membersSnapshot = await getDocs(collection(db, 'viajes', tripDoc.id, 'miembros'));
          membersSnapshot.forEach((memberDoc) => {
            const data = memberDoc.data() || {};
            const memberUid = String(data.uid || '').trim();
            const memberEmail = String(data.email || '').trim().toLowerCase();
            if (!memberUid || memberUid === user.uid) return;
            membersFromTrips.push({
              id: memberUid,
              uid: memberUid,
              nombre: String(data.nombre || '').trim(),
              apellidos: String(data.apellidos || '').trim(),
              email: memberEmail,
              username: String(data.username || '').trim(),
              avatar: data.avatar || data.fotoPerfil || '',
            });
          });
        }

        if (!active) return;

        const cachedRecents = loadFromCache(user.uid);
        const merged = normalizeRecentMembers([...cachedRecents, ...membersFromTrips], user.uid);
        const toEnrich = merged.slice(0, MAX_RECENT_MEMBERS);

        const enriched = await Promise.all(
          toEnrich.map(async (recentMember) => {
            try {
              const profile = await getUserByUid(recentMember.uid);
              if (!profile) return recentMember;

              const fullName = String(profile.nombre || '').trim();
              const parts = fullName.split(/\s+/).filter(Boolean);
              return {
                ...recentMember,
                nombre: parts[0] || recentMember.nombre,
                apellidos: parts.slice(1).join(' ') || recentMember.apellidos,
                username: profile.username || recentMember.username,
                avatar: profile.avatar || recentMember.avatar,
              };
            } catch {
              return recentMember;
            }
          }),
        );

        if (active) setRecientes(normalizeRecentMembers(enriched, user.uid));
      } catch (error) {
        console.warn('No se pudieron cargar miembros recientes desde viajes anteriores:', error);
      }
    };

    load();
    return () => { active = false; };
  }, [user?.uid]);

  // Persiste en localStorage cada vez que cambian.
  useEffect(() => {
    if (!user?.uid) return;
    localStorage.setItem(
      getStorageKey(user.uid),
      JSON.stringify(normalizeRecentMembers(recientes, user.uid)),
    );
  }, [recientes, user?.uid]);

  const addToRecentMembers = (member) => {
    if (!member?.uid) return;
    setRecientes((prev) => normalizeRecentMembers([
      {
        id: member.uid,
        uid: member.uid,
        nombre: String(member.nombre || '').trim(),
        apellidos: String(member.apellidos || '').trim(),
        email: String(member.email || '').trim().toLowerCase(),
        username: String(member.username || '').trim(),
        avatar: member.avatar || '',
      },
      ...prev,
    ], user?.uid || ''));
  };

  return { recientes, addToRecentMembers };
}
