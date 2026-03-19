import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import { getUserProfile } from '../services/profileService';

const AuthContext = createContext(null);

const EMPTY_PROFILE = {
  nombre: '',
  apellidos: '',
  fotoPerfil: '',
  displayName: '',
};

function mapProfile(data, firebaseUser) {
  const appDisplayName = `${data?.nombre || ''} ${data?.apellidos || ''}`.trim();

  return {
    ...EMPTY_PROFILE,
    nombre: data?.nombre || '',
    apellidos: data?.apellidos || '',
    fotoPerfil: data?.fotoPerfil || '',
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
      setProfile(mapProfile(data, firebaseUser));
    } catch {
      setProfile(mapProfile(null, firebaseUser));
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

  const value = useMemo(
    () => ({
      user,
      profile,
      authLoading,
      profileLoading,
      loading: authLoading || profileLoading,
      setProfile,
      refreshProfile,
    }),
    [user, profile, authLoading, profileLoading, refreshProfile]
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
