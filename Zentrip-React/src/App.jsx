import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './App.css'
import Register from './components/auth/register/Register'

function App() {

  const rutasAplicaciones = createBrowserRouter([
    {
      path: 'Auth',
      children: [
        // { path: 'Login', element: <Login /> },
        { path: 'Register', element: <Register /> }
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
