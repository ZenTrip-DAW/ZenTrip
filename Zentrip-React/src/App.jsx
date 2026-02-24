import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import './App.css'
import Register from './components/auth/register/Register'
import Login from './components/auth/login/Login'
import EditProfile from './components/profile/EditProfile'

function App() {

  const rutasAplicaciones = createBrowserRouter([
    {
      path: '/',
      element: <Navigate to="/Auth/Register" replace />
    },
    {
      path: 'Auth',
      children: [
        { path: 'Login', element: <Login /> },
        { path: 'Register', element: <Register /> }
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
