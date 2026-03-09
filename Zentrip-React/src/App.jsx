import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './App.css'
import Register from './components/auth/register/Register'
import Login from './components/auth/login/Login'
import VerifyEmail from './components/auth/verify-email/VerifyEmail'
import EditProfile from './components/profile/EditProfile'
import Landing from './components/landing/landing'

function App() {

  const rutasAplicaciones = createBrowserRouter([
    {
      path: '/',
      element: <Landing />
    },
    {
      path: 'Auth',
      children: [
        { path: 'Login', element: <Login /> },
        { path: 'Register', element: <Register /> },
        { path: 'VerifyEmail', element: <VerifyEmail /> }
      ]
    },
    {
      path: 'perfil',
      children: [
        { path: 'editar', element: <EditProfile /> }
      ]
    }
  ])

  return (
    <>
      <RouterProvider router={rutasAplicaciones} />
    </>
  )
}

export default App
