import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Settings, ListChecks, GitCompare, TrendingUp, FileText, LogOut, Menu, ChevronRight, SlidersHorizontal, X, Bell, Moon, Info, User, Mail, Lock, Eye, EyeOff, Check } from 'lucide-react'

const nav = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Project Setup', icon: Settings, to: '/setup' },
  { label: 'Scenarios', icon: ListChecks, to: '/scenarios' },
  { label: 'Comparison', icon: GitCompare, to: '/compare' },
  { label: 'Forecasting', icon: TrendingUp, to: '/forecast' },
  { label: 'Reports', icon: FileText, to: '/reports' },
]

function Toggle({ checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{ width: 38, height: 21, borderRadius: 11, flexShrink: 0, background: checked ? '#2563eb' : '#e2e8f0', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}
    >
      <div style={{
        position: 'absolute', top: 2.5, left: checked ? 19 : 2.5,
        width: 16, height: 16, borderRadius: '50%',
        background: '#fff', transition: 'left 0.18s', boxShadow: '0 1px 3px rgba(0,0,0,0.18)'
      }} />
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div className="section-label" style={{ marginBottom: 14 }}>
      {children}
    </div>
  )
}

function SettingsRow({ label, desc, right }) {
  return (
    <div className="settings-row">
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{desc}</div>}
      </div>
      {right}
    </div>
  )
}

function FieldInput({ label, icon: Icon, value, onChange, type = 'text', placeholder, rightEl }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
        <Icon size={12} /> {label}
      </div>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{ width: '100%', padding: '9px 36px 9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#0f172a', outline: 'none', background: '#f8fafc', transition: 'border 0.15s', boxSizing: 'border-box' }}
          onFocus={e => { e.target.style.border = '1px solid #2563eb'; e.target.style.background = '#fff' }}
          onBlur={e => { e.target.style.border = '1px solid #e2e8f0'; e.target.style.background = '#f8fafc' }}
        />
        {rightEl && (
          <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
            {rightEl}
          </div>
        )}
      </div>
    </div>
  )
}

function ProfileModal({ onClose }) {
  const [name, setName] = useState('Volkan Şahin')
  const [email, setEmail] = useState('volkansahin499@gmail.com')
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saved, setSaved] = useState(false)

  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }

  const EyeBtn = ({ show, onToggle }) => (
    <button
      onClick={onToggle}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: 0 }}
      onMouseEnter={e => { e.currentTarget.style.color = '#64748b' }}
      onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8' }}
    >
      {show ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  )

  return (
    <>
      <div onClick={onClose} className="modal-overlay" />
      <div className="modal" style={{ width: 440, maxHeight: '92vh' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={15} color="#2563eb" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Profile</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Edit your account details</div>
            </div>
          </div>
          <button onClick={onClose} className="modal-close"><X size={15} /></button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(160deg,#eff6ff,#f5f3ff)', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 10, boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}>
            {initials}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{name}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>Software Eng. · BAU</div>
        </div>

        <div className="modal-body" style={{ padding: '22px' }}>
          <SectionLabel>Account Info</SectionLabel>
          <FieldInput label="Display Name" icon={User} value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
          <FieldInput label="Email Address" icon={Mail} value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 18, marginTop: 4 }}>
            <SectionLabel>
              <Lock size={10} style={{ display: 'inline', marginRight: 5 }} />Change Password
            </SectionLabel>
            <FieldInput label="Current Password" icon={Lock} value={currentPass} onChange={e => setCurrentPass(e.target.value)} type={showCurrent ? 'text' : 'password'} placeholder="Enter current password" rightEl={<EyeBtn show={showCurrent} onToggle={() => setShowCurrent(v => !v)} />} />
            <FieldInput label="New Password" icon={Lock} value={newPass} onChange={e => setNewPass(e.target.value)} type={showNew ? 'text' : 'password'} placeholder="Enter new password" rightEl={<EyeBtn show={showNew} onToggle={() => setShowNew(v => !v)} />} />
            <FieldInput label="Confirm New Password" icon={Lock} value={confirmPass} onChange={e => setConfirmPass(e.target.value)} type={showConfirm ? 'text' : 'password'} placeholder="Repeat new password" rightEl={<EyeBtn show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />} />
          </div>

          <button
            onClick={handleSave}
            style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: saved ? '#10b981' : '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 4 }}
          >
            {saved ? <><Check size={15} /> Saved!</> : 'Save Changes'}
          </button>
        </div>
      </div>
    </>
  )
}

function SettingsModal({ onClose }) {
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [dashboardAlerts, setDashboardAlerts] = useState(true)
  const [darkMode, setDarkMode] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark')
  const [language, setLanguage] = useState('English')

  const handleDarkMode = (val) => {
    setDarkMode(val)
    document.documentElement.setAttribute('data-theme', val ? 'dark' : 'light')
    localStorage.setItem('theme', val ? 'dark' : 'light')
  }

  return (
    <>
      <div onClick={onClose} className="modal-overlay" />
      <div className="modal" style={{ width: 480, maxHeight: '88vh' }}>
        <div className="modal-header" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SlidersHorizontal size={16} color="#2563eb" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Settings</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Preferences & account</div>
            </div>
          </div>
          <button onClick={onClose} className="modal-close"><X size={15} /></button>
        </div>

        <div className="modal-body">
          <div className="modal-section">
            <SectionLabel><Moon size={10} style={{ display: 'inline', marginRight: 5 }} />Appearance</SectionLabel>
            <SettingsRow
              label="Language"
              desc="Interface display language"
              right={
                <select value={language} onChange={e => setLanguage(e.target.value)} style={{ padding: '5px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, color: '#0f172a', background: '#fff', cursor: 'pointer', outline: 'none' }}>
                  <option>English</option>
                  <option>Turkish</option>
                </select>
              }
            />
            <SettingsRow label="Dark Mode" desc="Switch to dark interface theme" right={<Toggle checked={darkMode} onChange={handleDarkMode} />} />
          </div>

          <div className="modal-section">
            <SectionLabel><Bell size={10} style={{ display: 'inline', marginRight: 5 }} />Notifications</SectionLabel>
            <SettingsRow label="Email Alerts" desc="Receive simulation results via email" right={<Toggle checked={emailAlerts} onChange={setEmailAlerts} />} />
            <SettingsRow label="Dashboard Alerts" desc="Show in-app warnings and updates" right={<Toggle checked={dashboardAlerts} onChange={setDashboardAlerts} />} />
          </div>

          <div className="modal-section-alt">
            <SectionLabel><Info size={10} style={{ display: 'inline', marginRight: 5 }} />About</SectionLabel>
            {[
              ['Platform', 'CEMS Dashboard'],
              ['Version', '1.0.0'],
              ['Build', 'May 2025'],
              ['Project', 'BAU Kemerburgaz'],
            ].map(([k, v]) => (
              <div key={k} className="stat-row">
                <span className="stat-label">{k}</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#0f172a' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default function Sidebar({ onLogout, open, onToggle }) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <>
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} />}

      <aside style={{
        width: open ? 240 : 52,
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        background: 'var(--sidebar-bg)',
        display: 'flex', flexDirection: 'column',
        height: '100vh', position: 'fixed', left: 0, top: 0,
        zIndex: 200, overflow: 'hidden', flexShrink: 0,
      }}>
        <div className="sidebar-topbar">
          <button
            onClick={onToggle}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#e2e8f0' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#94a3b8' }}
          >
            <Menu size={18} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: open ? '12px 10px' : '10px 6px', overflowY: 'auto', overflowX: 'hidden' }}>
          {nav.map(({ label, icon: Icon, to }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: open ? 10 : 0,
                padding: open ? '9px 10px' : '10px 0',
                justifyContent: open ? 'flex-start' : 'center',
                borderRadius: 7, marginBottom: 2,
                color: isActive ? '#60a5fa' : '#94a3b8',
                background: isActive ? 'rgba(37,99,235,0.12)' : 'transparent',
                borderLeft: open ? (isActive ? '2px solid #2563eb' : '2px solid transparent') : 'none',
                fontSize: 13, fontWeight: isActive ? 500 : 400,
                transition: 'all 0.15s', textDecoration: 'none', overflow: 'hidden',
              })}
              onMouseEnter={e => { if (!e.currentTarget.className.includes('active')) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
              onMouseLeave={e => { if (!e.currentTarget.className.includes('active')) e.currentTarget.style.background = 'transparent' }}
            >
              <Icon size={16} style={{ flexShrink: 0 }} />
              {open && (
                <>
                  <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{label}</span>
                  <ChevronRight size={12} style={{ opacity: 0.4, flexShrink: 0 }} />
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: open ? '12px 10px' : '10px 6px' }}>
          {open ? (
            <>
              <button
                onClick={() => setSettingsOpen(true)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 7, color: '#64748b', fontSize: 12, transition: 'all 0.15s', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 8 }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#e2e8f0' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' }}
              >
                <SlidersHorizontal size={15} /> Settings
              </button>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginBottom: 8 }} />
              <button
                onClick={() => setProfileOpen(true)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 7, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 6, transition: 'background 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>VS</div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>Volkan Şahin</div>
                  <div style={{ color: '#475569', fontSize: 10 }}>Software Eng.</div>
                </div>
              </button>
              <button
                onClick={onLogout}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 7, color: '#64748b', fontSize: 12, transition: 'all 0.15s', background: 'none', border: 'none', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#f87171' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' }}
              >
                <LogOut size={15} /> Sign Out
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => setSettingsOpen(true)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 6, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#64748b' }}
              >
                <SlidersHorizontal size={15} />
              </button>
              <button
                onClick={() => setProfileOpen(true)}
                style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 0 0 0 transparent', transition: 'box-shadow 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.35)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 0 0 transparent' }}
              >
                VS
              </button>
              <button
                onClick={onLogout}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 6, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#f87171' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#64748b' }}
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
