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

  useEffect(() => {
    if (!user?.email) {
      setNotifications([]);
      setUnseenCount(0);
      knownIdsRef.current = new Set();
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
        if (removed.length > 0) setUnseenCount((prev) => Math.max(0, prev - removed.length));
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
      const { tripName } = e.detail || {};
      if (!tripName) return;
      setAcceptedNotifications((prev) => [{ tripName }, ...prev]);
      setUnseenCount((prev) => prev + 1);
    };
    window.addEventListener('zt-invitation-accepted-email', handleEmailAccepted);
    return () => window.removeEventListener('zt-invitation-accepted-email', handleEmailAccepted);
  }, []);

  const markAsSeen = useCallback(() => {
    setUnseenCount(0);
  }, []);

  const markTripNotificationRead = useCallback(async (notifId) => {
    await updateDoc(doc(db, 'notifications', notifId), { read: true });
  }, []);

  const addAcceptedNotification = useCallback((data) => {
    setAcceptedNotifications((prev) => [data, ...prev]);
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
      markTripNotificationRead,
      acceptedNotifications,
      addAcceptedNotification,
      clearAcceptedNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
