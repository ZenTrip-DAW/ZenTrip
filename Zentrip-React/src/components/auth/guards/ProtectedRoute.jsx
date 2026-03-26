import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '../../../config/routes';
import { useAuth } from '../../../context/AuthContext';
import SplashScreen from '../../shared/SplashScreen';

function isProfileComplete(profile) {
  return profile?.nombre?.trim() && profile?.apellidos?.trim() && profile?.username?.trim();
}

export default function ProtectedRoute() {
  const { user, loading, profile } = useAuth();
  const location = useLocation();

  if (loading) {
    return <SplashScreen />;
  }

  if (!user) {
    return <Navigate to={ROUTES.AUTH.LOGIN} replace state={{ from: location }} />;
  }

  if (!user.emailVerified) {
    return <Navigate to={ROUTES.AUTH.VERIFY_EMAIL} replace />;
  }

  if (!isProfileComplete(profile) && location.pathname !== ROUTES.PROFILE.SETUP) {
    return <Navigate to={ROUTES.PROFILE.SETUP} replace />;
  }

  return <Outlet />;
}
