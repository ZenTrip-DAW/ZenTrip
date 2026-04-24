import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { collection, onSnapshot, query, updateDoc, doc, where } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [tripNotifications, setTripNotifications] = useState([]);
  const [acceptedNotifications, setAcceptedNotifications] = useState([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const knownIdsRef = useRef(new Set());
  const knownTripNotifsRef = useRef(new Set());
  const seenInvitationIdsRef = useRef(new Set());
  const consumedAcceptedIdsRef = useRef(new Set());

  useEffect(() => {
    if (!user?.email) {
      setNotifications([]);
      setUnseenCount(0);
      knownIdsRef.current = new Set();
      seenInvitationIdsRef.current = new Set();
      return;
    }

    const q = query(
      collection(db, 'invitations'),
      where('email', '==', user.email.toLowerCase()),
      where('status', '==', 'pending'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const newIds = new Set(docs.map((d) => d.id));
        const added = [...newIds].filter((id) => !knownIdsRef.current.has(id));
        const removed = [...knownIdsRef.current].filter((id) => !newIds.has(id));
        if (added.length > 0) setUnseenCount((prev) => prev + added.length);
        const removedUnseen = removed.filter((id) => !seenInvitationIdsRef.current.has(id));
        if (removedUnseen.length > 0) setUnseenCount((prev) => Math.max(0, prev - removedUnseen.length));
        removed.forEach((id) => seenInvitationIdsRef.current.delete(id));
        knownIdsRef.current = newIds;
        setNotifications(docs);
      },
      (err) => {
        console.warn('Error en listener de notificaciones:', err);
      },
    );

    return unsubscribe;
  }, [user?.email]);

  useEffect(() => {
    if (!user?.uid) {
      setTripNotifications([]);
      knownTripNotifsRef.current = new Set();
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('recipientUid', '==', user.uid),
      where('read', '==', false),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const newIds = new Set(docs.map((d) => d.id));
      const added = [...newIds].filter((id) => !knownTripNotifsRef.current.has(id));
      if (added.length > 0) setUnseenCount((prev) => prev + added.length);
      knownTripNotifsRef.current = newIds;
      setTripNotifications(docs);
    }, (err) => {
      console.warn('Error en listener de notificaciones de viaje:', err);
    });

    return unsubscribe;
  }, [user?.uid]);

  // Escucha aceptaciones desde el flujo de login/registro por enlace
  useEffect(() => {
    const handleEmailAccepted = (e) => {
      const { tripId, tripName } = e.detail || {};
      if (!tripName) return;
      setAcceptedNotifications((prev) => [{ tripId, tripName, createdAt: new Date().toISOString() }, ...prev]);
      setUnseenCount((prev) => prev + 1);
    };
    window.addEventListener('zt-invitation-accepted-email', handleEmailAccepted);
    return () => window.removeEventListener('zt-invitation-accepted-email', handleEmailAccepted);
  }, []);

  const markAsSeen = useCallback(() => {
    setUnseenCount(0);
  }, []);

  const markInvitationNotificationSeen = useCallback((notifId) => {
    if (!notifId || seenInvitationIdsRef.current.has(notifId)) return;
    seenInvitationIdsRef.current.add(notifId);
    setUnseenCount((prev) => Math.max(0, prev - 1));
  }, []);

  const decrementUnseenCount = useCallback(() => {
    setUnseenCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markTripNotificationRead = useCallback(async (notifId) => {
    await updateDoc(doc(db, 'notifications', notifId), { read: true });
    decrementUnseenCount();
  }, [decrementUnseenCount]);

  const addAcceptedNotification = useCallback((data) => {
    const uiId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setAcceptedNotifications((prev) => [{ uiId, createdAt: new Date().toISOString(), ...data }, ...prev]);
  }, []);

  const consumeAcceptedNotification = useCallback((uiId) => {
    if (!uiId || consumedAcceptedIdsRef.current.has(uiId)) return;
    consumedAcceptedIdsRef.current.add(uiId);
    setAcceptedNotifications((prev) => prev.filter((notification) => notification.uiId !== uiId));
    setUnseenCount((prev) => Math.max(0, prev - 1));
  }, []);

  const clearAcceptedNotifications = useCallback(() => {
    setAcceptedNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      tripNotifications,
      unseenCount,
      markAsSeen,
      decrementUnseenCount,
      markInvitationNotificationSeen,
      markTripNotificationRead,
      acceptedNotifications,
      addAcceptedNotification,
      consumeAcceptedNotification,
      clearAcceptedNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
