import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Setup from './pages/Setup.jsx'
import Scenarios from './pages/Scenarios.jsx'
import Compare from './pages/Compare.jsx'
import Forecast from './pages/Forecast.jsx'
import Login from './pages/Login.jsx'

export default function App() {
  const [auth, setAuth] = useState(false)

  if (!auth) return <Login onLogin={() => setAuth(true)} />

  return (
    <Routes>
      <Route path="/" element={<Layout onLogout={() => setAuth(false)} />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="setup" element={<Setup />} />
        <Route path="scenarios" element={<Scenarios />} />
        <Route path="compare" element={<Compare />} />
        <Route path="forecast" element={<Forecast />} />
      </Route>
    </Routes>
  )
}
