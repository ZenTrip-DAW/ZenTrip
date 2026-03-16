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

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: ROUTES.HOME, element: <Home /> },
  {
    path: 'auth',
    children: [
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'verify-email', element: <VerifyEmail /> },
    ],
  },
  {
    path: 'profile',
    children: [
      { path: 'edit', element: <EditProfile /> },
    ],
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
