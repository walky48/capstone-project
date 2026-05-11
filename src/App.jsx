import { Routes, Route, Navigate } from 'react-router-dom'
// import { useState } from 'react'
// import Login from './pages/Login.jsx'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Setup from './pages/Setup.jsx'
import Scenarios from './pages/Scenarios.jsx'
import Compare from './pages/Compare.jsx'
import Forecast from './pages/Forecast.jsx'

export default function App() {
  // const [auth, setAuth] = useState(false)
  // const navigate = useNavigate()

  // function handleLogin() {
  //   setAuth(true)
  //   navigate('/dashboard', { replace: true })
  // }

  // function handleLogout() {
  //   setAuth(false)
  //   navigate('/login', { replace: true })
  // }

  return (
    <Routes>
      {/* <Route path="/login" element={<Login onLogin={handleLogin} />} /> */}
      <Route path="/" element={<Layout />}>
        {/* <Layout onLogout={handleLogout} /> */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="setup" element={<Setup />} />
        <Route path="scenarios" element={<Scenarios />} />
        <Route path="compare" element={<Compare />} />
        <Route path="forecast" element={<Forecast />} />
      </Route>
      {/* {auth ? (...) : (<Route path="*" element={<Navigate to="/login" replace />} />)} */}
    </Routes>
  )
}
