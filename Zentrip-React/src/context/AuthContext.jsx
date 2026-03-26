import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { getUserProfile } from '../services/profileService';

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
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    refreshProfile(user);
  }, [authLoading, user?.uid]);

  const logout = useCallback(async () => {
    await signOut(auth);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      authLoading,
      profileLoading,
      loading: authLoading || profileLoading,
      setProfile,
      refreshProfile,
      logout,
    }),
    [user, profile, authLoading, profileLoading, refreshProfile, logout]
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
