import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'

export default function Layout({ onLogout }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 150,
            background: 'rgba(0,0,0,0.35)',
          }}
        />
      )}
      <Sidebar onLogout={onLogout} open={open} onToggle={() => setOpen(v => !v)} />
      <main className="main-content" style={{
        flex: 1,
        marginLeft: 52,
        minHeight: '100vh',
        background: 'var(--bg, #f0f4f8)',
        transition: 'margin-left 0.25s cubic-bezier(0.4,0,0.2,1)'
      }}>
        <Outlet />
      </main>
    </div>
  )
}
