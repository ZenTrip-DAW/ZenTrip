import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, reload, signOut } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { getUserProfile } from '../services/profileService';
import { isSessionExpired, clearSessionExpiry } from '../components/auth/login/services/loginFirebaseService';

const AuthContext = createContext(null);

function mapProfile(data) {
  const appDisplayName = `${data?.nombre || ''} ${data?.apellidos || ''}`.trim();

  return {
    nombre: data?.nombre || '',
    apellidos: data?.apellidos || '',
    username: data?.username || '',
    bio: data?.bio || '',
    telefono: data?.telefono || '',
    pais: data?.pais || '',
    idioma: data?.idioma || 'Español',
    moneda: data?.moneda || 'EUR €',
    fotoPerfil: data?.fotoPerfil || '',
    avatarColor: data?.avatarColor || '',
    viajesSoloGrupo: data?.viajesSoloGrupo || 'ambos',
    petFriendly: data?.petFriendly || false,
    displayName: appDisplayName,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const sessionTimerRef = useRef(null);

  const doLogout = useCallback(async () => {
    clearSessionExpiry();
    clearTimeout(sessionTimerRef.current);
    await signOut(auth);
    setProfile(null);
  }, []);

  const scheduleSessionExpiry = useCallback(() => {
    clearTimeout(sessionTimerRef.current);
    const expiry = Number(sessionStorage.getItem('sessionExpiry'));
    if (!expiry) return;
    const remaining = expiry - Date.now();
    if (remaining <= 0) {
      doLogout();
      return;
    }
    sessionTimerRef.current = setTimeout(() => doLogout(), remaining);
  }, [doLogout]);

  const refreshProfile = useCallback(async (firebaseUser = user) => {
    if (!firebaseUser?.uid) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    try {
      const data = await getUserProfile(firebaseUser.uid);
      setProfile(mapProfile(data));
    } catch {
      setProfile(mapProfile(null));
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const syncAuthState = async () => {
        if (!firebaseUser) {
          clearTimeout(sessionTimerRef.current);
          if (isMounted) {
            setUser(null);
            setAuthLoading(false);
          }
          return;
        }

        // Si la sesión ya expiró, cerramos sin mostrar nada
        const expiry = sessionStorage.getItem('sessionExpiry');
        if (expiry && isSessionExpired()) {
          await signOut(auth);
          clearSessionExpiry();
          if (isMounted) {
            setUser(null);
            setAuthLoading(false);
          }
          return;
        }

        try {
          await reload(firebaseUser);
        } catch {
          // Si reload falla por red, mantenemos el usuario actual para no bloquear la sesión.
        }

        if (isMounted) {
          setUser(auth.currentUser || firebaseUser);
          setAuthLoading(false);
          scheduleSessionExpiry();
        }
      };

      syncAuthState();
    });

    return () => {
      isMounted = false;
      unsubscribe();
      clearTimeout(sessionTimerRef.current);
    };
  }, [scheduleSessionExpiry]);

  useEffect(() => {
    if (authLoading) return;
    refreshProfile(user);
  }, [authLoading, user?.uid]);

  const value = useMemo(
    () => ({
      user,
      profile,
      authLoading,
      profileLoading,
      loading: authLoading || profileLoading,
      setProfile,
      refreshProfile,
      logout: doLogout,
    }),
    [user, profile, authLoading, profileLoading, refreshProfile, doLogout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
