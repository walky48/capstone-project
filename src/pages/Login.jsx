import { useState } from 'react'
import { Eye, EyeOff, ArrowLeft, Mail } from 'lucide-react'
import { sendEmail, isEmailConfigured, genTempPassword } from '../utils/email'

export default function Login({ onLogin }) {
  const [view, setView] = useState('login')
  const [username, setUsername] = useState('')
  const [pass, setPass] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const [fEmail, setFEmail] = useState('')
  const [fSending, setFSending] = useState(false)
  const [fMsg, setFMsg] = useState(null)

  const inputStyle = {
    width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a',
    borderRadius: 7, padding: '11px 14px', color: '#e2e8f0', fontSize: 13,
    outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box'
  }
  const focus = e => e.target.style.borderColor = '#2563eb'
  const blur = e => e.target.style.borderColor = '#2a2a2a'
  const noteBox = (color, bg, border) => ({
    background: bg, border: `1px solid ${border}`, borderRadius: 7,
    padding: '9px 14px', color, fontSize: 12, marginBottom: 14, textAlign: 'center', lineHeight: 1.5
  })

  function handleSubmit(e) {
    e.preventDefault()
    setError(false)
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      const devUser = localStorage.getItem('dev_user') || 'admin'
      const devPass = localStorage.getItem('dev_pass') || '1234'
      const tempPass = localStorage.getItem('temp_pass') || ''
      if (username === devUser && pass === devPass) {
        onLogin()
      } else if (username === devUser && tempPass && pass === tempPass) {
        localStorage.removeItem('temp_pass')
        onLogin()
      } else {
        setError(true)
      }
    }, 900)
  }

  async function handleForgot(e) {
    e.preventDefault()
    setFMsg(null)
    const entered = fEmail.trim().toLowerCase()
    if (!entered) return
    const accountEmail = (localStorage.getItem('profile_email') || 'volkansahin499@gmail.com').trim().toLowerCase()
    const devUser = localStorage.getItem('dev_user') || 'admin'
    if (entered !== accountEmail) {
      setFMsg({ type: 'error', text: 'No account is registered with this email address.' })
      return
    }
    const temp = genTempPassword()
    localStorage.setItem('temp_pass', temp)
    if (isEmailConfigured()) {
      setFSending(true)
      try {
        await sendEmail({
          toEmail: accountEmail,
          toName: localStorage.getItem('profile_name') || '',
          subject: 'CEMS - Temporary password',
          message: `Your username is "${devUser}" and your temporary password is ${temp}. Use it to sign in once, then change your password from Profile settings.`,
          code: temp,
        })
        setFMsg({ type: 'success', text: 'A temporary password has been sent to your email. Use it to sign in once, then change it from Profile.' })
      } catch {
        setFMsg({ type: 'error', text: 'Could not send the email. Please try again.' })
      }
      setFSending(false)
    } else {
      setFMsg({ type: 'dev', text: temp })
    }
  }

  const backToLogin = () => {
    setView('login'); setFMsg(null); setFEmail(''); setError(false)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>

      <div style={{
        width: '34%', background: '#0a0a0a', display: 'flex',
        flexDirection: 'column', padding: 40, position: 'relative'
      }}>

        <div style={{ width: '100%', maxWidth: 340, alignSelf: 'center', marginTop: 'auto', marginBottom: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: -8, marginTop: -60 }}>
            <img
              src={`${import.meta.env.BASE_URL}helios-logo.png`}
              alt="Helios"
              style={{ width: 310, height: 310, objectFit: 'contain' }}
            />
          </div>

          {view === 'login' ? (
            <>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', color: '#e2e8f0', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Username</label>
                  <input
                    type="text" value={username} onChange={e => setUsername(e.target.value)} required
                    style={inputStyle} onFocus={focus} onBlur={blur}
                  />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', color: '#e2e8f0', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={show ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)} required
                      style={{ ...inputStyle, padding: '11px 42px 11px 14px' }} onFocus={focus} onBlur={blur}
                    />
                    <button type="button" onClick={() => setShow(!show)} style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 2
                    }}>
                      {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div style={noteBox('#f87171', 'rgba(220,38,38,0.12)', 'rgba(220,38,38,0.3)')}>
                    Invalid username or password.
                  </div>
                )}
                <button type="submit" disabled={loading} style={{
                  width: '100%', background: loading ? '#1d4ed8' : '#2563eb',
                  color: '#fff', border: 'none', borderRadius: 7, padding: '13px',
                  fontSize: 14, fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'background 0.2s', letterSpacing: '0.03em'
                }}>
                  {loading ? (
                    <>
                      <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                      Signing in...
                    </>
                  ) : 'SIGN IN →'}
                </button>
              </form>
              <div style={{ textAlign: 'center', marginTop: 18 }}>
                <button
                  onClick={() => { setView('forgot'); setError(false) }}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer', letterSpacing: '0.03em' }}
                >
                  FORGOT PASSWORD
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 18 }}>
                <div style={{ color: '#e2e8f0', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Reset password</div>
                <div style={{ color: '#64748b', fontSize: 12.5, lineHeight: 1.5 }}>
                  Enter your account email and we'll send you a temporary password.
                </div>
              </div>
              <form onSubmit={handleForgot}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', color: '#e2e8f0', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Email address</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email" value={fEmail} onChange={e => setFEmail(e.target.value)} required placeholder="you@example.com"
                      style={{ ...inputStyle, padding: '11px 14px 11px 40px' }} onFocus={focus} onBlur={blur}
                    />
                    <Mail size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  </div>
                </div>

                {fMsg?.type === 'error' && <div style={noteBox('#f87171', 'rgba(220,38,38,0.12)', 'rgba(220,38,38,0.3)')}>{fMsg.text}</div>}
                {fMsg?.type === 'success' && <div style={noteBox('#34d399', 'rgba(16,185,129,0.12)', 'rgba(16,185,129,0.3)')}>{fMsg.text}</div>}
                {fMsg?.type === 'dev' && (
                  <div style={noteBox('#fbbf24', 'rgba(245,158,11,0.1)', 'rgba(245,158,11,0.3)')}>
                    EmailJS not configured — temporary password:<br />
                    <b style={{ letterSpacing: 2, fontSize: 14, color: '#fde68a' }}>{fMsg.text}</b>
                  </div>
                )}

                <button type="submit" disabled={fSending} style={{
                  width: '100%', background: fSending ? '#1d4ed8' : '#2563eb',
                  color: '#fff', border: 'none', borderRadius: 7, padding: '13px',
                  fontSize: 14, fontWeight: 600, cursor: fSending ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'background 0.2s', letterSpacing: '0.03em'
                }}>
                  {fSending ? (
                    <>
                      <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                      Sending...
                    </>
                  ) : 'SEND TEMPORARY PASSWORD'}
                </button>
              </form>
              <div style={{ textAlign: 'center', marginTop: 18 }}>
                <button
                  onClick={backToLogin}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <ArrowLeft size={13} /> Back to sign in
                </button>
              </div>
            </>
          )}
        </div>
        <div style={{ marginTop: 'auto' }} />
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <img
          src={`${import.meta.env.BASE_URL}campus.webp`}
          alt="BAU Kemerburgaz Kampüsü"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(10,22,40,0.65) 0%, rgba(10,22,40,0.35) 60%, rgba(10,22,40,0.2) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', background: 'linear-gradient(to top, rgba(5,15,30,0.7) 0%, transparent 100%)' }} />

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
