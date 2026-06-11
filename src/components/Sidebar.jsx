import { useState, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Settings, ListChecks, GitCompare, TrendingUp, FileText, LogOut, Menu, ChevronRight, SlidersHorizontal, X, Bell, Moon, User, Mail, Lock, Eye, EyeOff, Check } from 'lucide-react'
import { useLang } from '../hooks/useLang'
import { sendEmail, isEmailConfigured, genCode } from '../utils/email'

const navRoutes = [
  { key: 'dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { key: 'setup', icon: Settings, to: '/setup' },
  { key: 'scenarios', icon: ListChecks, to: '/scenarios' },
  { key: 'compare', icon: GitCompare, to: '/compare' },
  { key: 'forecast', icon: TrendingUp, to: '/forecast' },
  { key: 'reports', icon: FileText, to: '/reports' },
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

function ProfileModal({ onClose, onProfileSave }) {
  const { t } = useLang()
  const v = t.profile.verify
  const DEFAULT_EMAIL = 'volkansahin499@gmail.com'
  const originalEmail = useRef(localStorage.getItem('profile_email') || DEFAULT_EMAIL)

  const [name, setName] = useState(() => localStorage.getItem('profile_name') || 'Volkan Şahin')
  const [email, setEmail] = useState(() => localStorage.getItem('profile_email') || DEFAULT_EMAIL)
  const [currentPass, setCurrentPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saved, setSaved] = useState(false)
  const [passError, setPassError] = useState('')

  // Verification (email / password changes require a code).
  const [phase, setPhase] = useState('edit')
  const [pendingCode, setPendingCode] = useState('')
  const [enteredCode, setEnteredCode] = useState('')
  const [verifyTarget, setVerifyTarget] = useState('')
  const [sending, setSending] = useState(false)
  const [devCode, setDevCode] = useState('')
  const [verifyError, setVerifyError] = useState('')
  const [codeError, setCodeError] = useState('')
  const [resent, setResent] = useState(false)

  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const flashSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2200) }

  const commit = () => {
    if (newPass) localStorage.setItem('dev_pass', newPass)
    localStorage.setItem('profile_name', name)
    localStorage.setItem('profile_email', email.trim())
    originalEmail.current = email.trim()
    onProfileSave(name)
    setCurrentPass(''); setNewPass(''); setConfirmPass('')
  }

  const sendCode = async (target) => {
    const code = genCode()
    setPendingCode(code); setVerifyTarget(target)
    setEnteredCode(''); setCodeError(''); setVerifyError(''); setDevCode('')
    if (isEmailConfigured()) {
      setSending(true)
      try {
        await sendEmail({
          toEmail: target, toName: name,
          subject: 'CEMS - Verification code',
          message: `Your verification code is ${code}. Enter it in the app to confirm your account changes.`,
          code,
        })
      } catch { setVerifyError(v.sendError) }
      setSending(false)
    } else {
      setDevCode(code) // dev fallback so the flow is testable without keys
    }
  }

  const handleSave = async () => {
    const wantsPass = newPass || currentPass || confirmPass
    if (wantsPass) {
      if (!currentPass) { setPassError(t.profile.errors.enterCurrentPass); return }
      if (newPass.length < 6) { setPassError(t.profile.errors.minLength); return }
      if (newPass !== confirmPass) { setPassError(t.profile.errors.noMatch); return }
    }
    setPassError('')
    const emailChanged = email.trim() !== originalEmail.current
    if (!emailChanged && !wantsPass) { commit(); flashSaved(); return } // name-only: no code
    setPhase('verify')
    await sendCode(emailChanged ? email.trim() : originalEmail.current)
  }

  const confirmCode = () => {
    if (pendingCode && enteredCode.trim() === pendingCode) {
      commit(); setPhase('edit'); flashSaved()
    } else {
      setCodeError(v.wrong)
    }
  }

  const resend = async () => { await sendCode(verifyTarget); setResent(true); setTimeout(() => setResent(false), 2500) }
  const cancelVerify = () => { setPhase('edit'); setEnteredCode(''); setCodeError(''); setVerifyError(''); setDevCode('') }

  const EyeBtn = ({ show, onToggle }) => (
    <button onClick={onToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: 0 }}>
      {show ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  )
  const note = (color, bg, border) => ({ fontSize: 12, color, background: bg, border: `1px solid ${border}`, borderRadius: 7, padding: '8px 12px', marginBottom: 10 })
  const primaryBtn = (green) => ({ width: '100%', padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: green ? '#10b981' : '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 4 })

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
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{t.profile.title}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{t.profile.subtitle}</div>
            </div>
          </div>
          <button onClick={onClose} className="modal-close"><X size={15} /></button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(160deg,#eff6ff,#f5f3ff)', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 700, marginBottom: 10, boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}>
            {initials}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{name}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{t.profile.role}</div>
        </div>

        <div className="modal-body" style={{ padding: '22px' }}>
          {phase === 'edit' ? (
            <>
              <SectionLabel>{t.profile.accountInfo}</SectionLabel>
              <FieldInput label={t.profile.displayName} icon={User} value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
              <FieldInput label={t.profile.emailAddress} icon={Mail} value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 18, marginTop: 4 }}>
                <SectionLabel>
                  <Lock size={10} style={{ display: 'inline', marginRight: 5 }} />{t.profile.changePassword}
                </SectionLabel>
                <FieldInput label={t.profile.currentPassword} icon={Lock} value={currentPass} onChange={e => setCurrentPass(e.target.value)} type={showCurrent ? 'text' : 'password'} placeholder="••••••••" rightEl={<EyeBtn show={showCurrent} onToggle={() => setShowCurrent(v => !v)} />} />
                <FieldInput label={t.profile.newPassword} icon={Lock} value={newPass} onChange={e => setNewPass(e.target.value)} type={showNew ? 'text' : 'password'} placeholder="••••••••" rightEl={<EyeBtn show={showNew} onToggle={() => setShowNew(v => !v)} />} />
                <FieldInput label={t.profile.confirmPassword} icon={Lock} value={confirmPass} onChange={e => setConfirmPass(e.target.value)} type={showConfirm ? 'text' : 'password'} placeholder="••••••••" rightEl={<EyeBtn show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />} />
              </div>

              {passError && <div style={note('#dc2626', '#fef2f2', '#fecaca')}>{passError}</div>}
              <button onClick={handleSave} style={primaryBtn(saved)}>
                {saved ? <><Check size={15} /> {t.profile.saved}</> : t.profile.save}
              </button>
            </>
          ) : (
            <>
              <SectionLabel><Lock size={10} style={{ display: 'inline', marginRight: 5 }} />{v.title}</SectionLabel>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 4 }}>{v.sentTo}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 14, wordBreak: 'break-all' }}>{verifyTarget}</div>
              <FieldInput label={v.codeLabel} icon={Lock} value={enteredCode} onChange={e => setEnteredCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} placeholder="123456" />
              {sending && <div style={note('#475569', '#f1f5f9', '#e2e8f0')}>{v.sending}</div>}
              {devCode && <div style={note('#92400e', '#fffbeb', '#fde68a')}>{v.devNote} <b style={{ letterSpacing: 2 }}>{devCode}</b></div>}
              {verifyError && <div style={note('#dc2626', '#fef2f2', '#fecaca')}>{verifyError}</div>}
              {codeError && <div style={note('#dc2626', '#fef2f2', '#fecaca')}>{codeError}</div>}
              {resent && <div style={note('#047857', '#ecfdf5', '#a7f3d0')}>{v.resent}</div>}
              <button onClick={confirmCode} style={primaryBtn(false)}>{v.confirm}</button>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                <button onClick={resend} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{v.resend}</button>
                <button onClick={cancelVerify} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{v.cancel}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

function SettingsModal({ onClose }) {
  const { lang, setLang, t } = useLang()
  const profileEmail = localStorage.getItem('profile_email') || 'volkansahin499@gmail.com'
  const profileName = localStorage.getItem('profile_name') || ''
  const [emailAlerts, setEmailAlerts] = useState(() => localStorage.getItem('email_alerts') !== '0')
  const [alertStatus, setAlertStatus] = useState('') // '' | sending | sent | error | unconfigured
  const [dashboardAlerts, setDashboardAlerts] = useState(true)
  const [darkMode, setDarkMode] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark')
  const [pendingLang, setPendingLang] = useState(lang)
  const [saved, setSaved] = useState(false)

  const handleDarkMode = (val) => {
    setDarkMode(val)
    document.documentElement.setAttribute('data-theme', val ? 'dark' : 'light')
    localStorage.setItem('theme', val ? 'dark' : 'light')
  }

  // Toggling email alerts ON sends a real confirmation email to the profile address.
  const handleEmailAlerts = async (val) => {
    setEmailAlerts(val)
    localStorage.setItem('email_alerts', val ? '1' : '0')
    if (!val) { setAlertStatus(''); return }
    if (!isEmailConfigured()) { setAlertStatus('unconfigured'); return }
    setAlertStatus('sending')
    try {
      await sendEmail({
        toEmail: profileEmail, toName: profileName,
        subject: 'CEMS - Email alerts enabled',
        message: `Email alerts are now ON. Simulation results and warnings will be sent to ${profileEmail}.`,
      })
      setAlertStatus('sent')
    } catch { setAlertStatus('error') }
  }

  const alertColor = { sending: '#475569', sent: '#047857', error: '#dc2626', unconfigured: '#92400e' }[alertStatus]
  const alertText = alertStatus ? t.settings.alertStatus[alertStatus].replace('{email}', profileEmail) : ''

  const handleSave = () => {
    setLang(pendingLang)
    localStorage.setItem('language', pendingLang)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{t.settings.title}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{t.settings.subtitle}</div>
            </div>
          </div>
          <button onClick={onClose} className="modal-close"><X size={15} /></button>
        </div>

        <div className="modal-body">
          <div className="modal-section">
            <SectionLabel><Moon size={10} style={{ display: 'inline', marginRight: 5 }} />{t.settings.appearance}</SectionLabel>
            <SettingsRow
              label={t.settings.language}
              desc={t.settings.languageDesc}
              right={
                <select value={pendingLang} onChange={e => setPendingLang(e.target.value)} style={{ padding: '5px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, color: '#0f172a', background: '#fff', cursor: 'pointer', outline: 'none' }}>
                  <option value="en">{t.settings.langOptions.en}</option>
                  <option value="tr">{t.settings.langOptions.tr}</option>
                </select>
              }
            />
            <SettingsRow label={t.settings.darkMode} desc={t.settings.darkModeDesc} right={<Toggle checked={darkMode} onChange={handleDarkMode} />} />
          </div>

          <div className="modal-section">
            <SectionLabel><Bell size={10} style={{ display: 'inline', marginRight: 5 }} />{t.settings.notifications}</SectionLabel>
            <SettingsRow label={t.settings.emailAlerts} desc={t.settings.emailAlertsDesc} right={<Toggle checked={emailAlerts} onChange={handleEmailAlerts} />} />
            {alertStatus && <div style={{ fontSize: 11.5, color: alertColor, padding: '0 2px 8px' }}>{alertText}</div>}
            <SettingsRow label={t.settings.dashboardAlerts} desc={t.settings.dashboardAlertsDesc} right={<Toggle checked={dashboardAlerts} onChange={setDashboardAlerts} />} />
          </div>

          <div className="modal-section">
            <button
              onClick={handleSave}
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: saved ? '#10b981' : '#2563eb', color: '#fff', fontSize: 13, fontWeight: 600, transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
            >
              {saved ? <><Check size={15} /> {t.settings.saved}</> : t.settings.save}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default function Sidebar({ onLogout, open, onToggle }) {
  const { t } = useLang()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileName, setProfileName] = useState(() => localStorage.getItem('profile_name') || 'Volkan Şahin')

  const initials = profileName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const nav = navRoutes.map(r => ({ ...r, label: t.nav[r.key] }))

  return (
    <>
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      {profileOpen && <ProfileModal onClose={() => setProfileOpen(false)} onProfileSave={name => setProfileName(name)} />}

      <aside style={{
        width: open ? 240 : 52,
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        background: 'var(--sidebar-bg)',
        display: 'flex', flexDirection: 'column',
        height: '100vh', position: 'fixed', left: 0, top: 0,
        zIndex: 200, overflow: 'hidden', flexShrink: 0,
      }}>
        <div className="sidebar-topbar">
          <button onClick={onToggle} className="sb-icon-btn">
            <Menu size={18} />
          </button>
        </div>

        <nav style={{ flex: 1, padding: open ? '12px 10px' : '10px 6px', overflowY: 'auto', overflowX: 'hidden' }}>
          {nav.map(({ label, icon: Icon, to }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link${isActive ? ' nav-active' : ''}`}
              style={({ isActive }) => ({
                gap: open ? 10 : 0,
                padding: open ? '9px 10px' : '10px 0',
                justifyContent: open ? 'flex-start' : 'center',
                color: isActive ? '#60a5fa' : '#94a3b8',
                background: isActive ? 'rgba(37,99,235,0.12)' : undefined,
                borderLeft: open ? (isActive ? '2px solid #2563eb' : '2px solid transparent') : 'none',
                fontWeight: isActive ? 500 : 400,
              })}
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
              <button onClick={() => setSettingsOpen(true)} className="sb-action-btn">
                <SlidersHorizontal size={15} /> {t.nav.settings}
              </button>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginBottom: 8, marginTop: 2 }} />
              <button onClick={() => setProfileOpen(true)} className="sb-profile-btn">
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{initials}</div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>{profileName}</div>
                  <div style={{ color: '#475569', fontSize: 10 }}>{t.profile.role.split('·')[0].trim()}</div>
                </div>
              </button>
              <button onClick={onLogout} className="sb-logout-btn">
                <LogOut size={15} /> {t.nav.signOut}
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setSettingsOpen(true)} className="sb-icon-btn">
                <SlidersHorizontal size={15} />
              </button>
              <button
                onClick={() => setProfileOpen(true)}
                className="sb-avatar-btn"
                style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff', fontSize: 11, fontWeight: 600, border: 'none' }}
              >
                {initials}
              </button>
              <button onClick={onLogout} className="sb-icon-btn" style={{ color: '#64748b' }}>
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
