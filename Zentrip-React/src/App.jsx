import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import { ROUTES } from './config/routes';
import Register from './components/auth/register/Register';
import Login from './components/auth/login/Login';
import VerifyEmail from './components/auth/verify-email/VerifyEmail';
import AuthActionHandler from './components/auth/action/AuthActionHandler';
import EditProfile from './components/profile/EditProfile';
import CreateTrip from './components/trips/create/CreateTrip';
import InvitacionesPage from './components/trips/invitaciones/InvitacionesPage';
import ResumenTrip from './components/trips/resumen/ResumenTrip';
import Landing from './components/landing/landing';
import Home from './components/home/Home';
import MainLayout from './layouts/MainLayout';
// import ProtectedRoute from './components/auth/guards/ProtectedRoute';
import GuestRoute from './components/auth/guards/GuestRoute';

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  {
    element: <MainLayout />,
    children: [
      { path: ROUTES.HOME, element: <Home /> },
      { path: ROUTES.PROFILE.EDIT, element: <EditProfile /> },
      { path: ROUTES.TRIPS.CREATE, element: <CreateTrip /> },
      { path: ROUTES.TRIPS.INVITACIONES, element: <InvitacionesPage /> },
      { path: ROUTES.TRIPS.RESUMEN, element: <ResumenTrip /> },
      { path: ROUTES.PROFILE.SETUP, element: <EditProfile isOnboarding /> },
    ],
  },
  {
    element: <GuestRoute />,
    children: [
      {
        path: ROUTES.AUTH.LOGIN,
        element: <Login />,
      },
      {
        path: ROUTES.AUTH.REGISTER,
        element: <Register />,
      },
      {
        path: ROUTES.AUTH.VERIFY_EMAIL,
        element: <VerifyEmail />,
      },
    ],
  },
  {
    path: ROUTES.AUTH.ACTION,
    element: <AuthActionHandler />,
  },
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
