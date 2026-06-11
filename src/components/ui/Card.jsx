export default function Card({ children, style, className }) {
  return (
    <div
      className={className}
      style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', ...style }}
    >
      {children}
    </div>
  )
}
