import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [remember, setRemember] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setError(false)
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      if (email === 'admin' && pass === '1234') {
        onLogin()
      } else {
        setError(true)
      }
    }, 1200)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      
      <div style={{
        width: '34%', background: '#0a0a0a', display: 'flex',
        flexDirection: 'column', padding: 40, position: 'relative'
      }}>
       
        <div style={{ marginBottom: 'auto' }}>
          <div style={{ color: '#fff', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.25 }}>Energy Management Tool</div>
        </div>

        
        <div style={{ width: '100%', maxWidth: 340, alignSelf: 'center', marginTop: 'auto', marginBottom: 'auto' }}>

          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#e2e8f0', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Username</label>
              <input
                type="text" value={email} onChange={e => setEmail(e.target.value)} required
                style={{
                  width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a',
                  borderRadius: 7, padding: '11px 14px', color: '#e2e8f0', fontSize: 13,
                  outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = '#2563eb'}
                onBlur={e => e.target.style.borderColor = '#2a2a2a'}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', color: '#e2e8f0', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={show ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)} required
                  style={{
                    width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a',
                    borderRadius: 7, padding: '11px 42px 11px 14px', color: '#e2e8f0', fontSize: 13,
                    outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box'
                  }}
                  onFocus={e => e.target.style.borderColor = '#2563eb'}
                  onBlur={e => e.target.style.borderColor = '#2a2a2a'}
                />
                <button type="button" onClick={() => setShow(!show)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 2
                }}>
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <input
                id="remember" type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                style={{ width: 15, height: 15, accentColor: '#2563eb', cursor: 'pointer' }}
              />
              <label htmlFor="remember" style={{ color: '#94a3b8', fontSize: 12, cursor: 'pointer', userSelect: 'none' }}>
                Remember Me
              </label>
            </div>

            {error && (
              <div style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 7, padding: '9px 14px', color: '#f87171', fontSize: 12, marginBottom: 14, textAlign: 'center' }}>
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
            <button style={{ background: 'none', border: 'none', color: '#475569', fontSize: 12, cursor: 'pointer', letterSpacing: '0.03em' }}>FORGOT PASSWORD</button>
          </div>
        </div>
        <div style={{ marginTop: 'auto' }} />
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <img
          src="/campus.webp"
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
