import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '../../../config/routes';
import { useAuth } from '../../../context/AuthContext';
import SplashScreen from '../../shared/SplashScreen';

export default function GuestRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  if (user) {
    return <Navigate to={ROUTES.HOME} replace />;
  }

  return <Outlet />;
}
