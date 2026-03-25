import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ROUTES } from '../../../config/routes';
import { useAuth } from '../../../context/AuthContext';
import SplashScreen from '../../shared/SplashScreen';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <SplashScreen />;
  }

  if (!user) {
    return <Navigate to={ROUTES.AUTH.LOGIN} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
