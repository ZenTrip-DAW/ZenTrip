import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import { ROUTES } from './config/routes';
import Register from './components/auth/register/Register';
import Login from './components/auth/login/Login';
import VerifyEmail from './components/auth/verify-email/VerifyEmail';
import EditProfile from './components/profile/EditProfile';
import Landing from './components/landing/landing';
import Home from './components/home/Home';
import MainLayout from './layouts/MainLayout';

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  {
    element: <MainLayout />,
    children: [
      { path: ROUTES.HOME, element: <Home /> },
      { path: ROUTES.PROFILE.EDIT, element: <EditProfile /> },
    ],
  },
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
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
