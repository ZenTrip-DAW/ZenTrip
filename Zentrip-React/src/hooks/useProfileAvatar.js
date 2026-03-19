import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

function buildInitials(profile) {
  const fullName = `${profile?.nombre || ''} ${profile?.apellidos || ''}`.trim() || profile?.displayName || '';
  const parts = fullName.split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] || 'Z'}${parts[1]?.[0] || 'T'}`.toUpperCase();
}

export function useProfileAvatar() {
  const { profile, loading } = useAuth();

  return useMemo(
    () => ({
      avatarSrc: profile?.fotoPerfil || '',
      initials: loading ? '' : buildInitials(profile),
    }),
    [profile, loading]
  );
}
