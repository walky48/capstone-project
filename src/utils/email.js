import emailjs from '@emailjs/browser'

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

export const isEmailConfigured = () => Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY)

export const genCode = () => String(Math.floor(100000 + Math.random() * 900000))

export const genTempPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export async function sendEmail({ toEmail, toName, subject, message, code = '' }) {
  if (!isEmailConfigured()) throw new Error('EmailJS not configured')
  return emailjs.send(
    SERVICE_ID,
    TEMPLATE_ID,
    { to_email: toEmail, to_name: toName || toEmail, subject, message, code },
    { publicKey: PUBLIC_KEY },
  )
}
