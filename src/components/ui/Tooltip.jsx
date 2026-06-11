export default function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <p style={{ fontWeight: 600, marginBottom: 6, color: '#0f172a', fontSize: 12 }}>{label}</p>
      {payload.map(p => p.value != null && (
        <p key={p.name} style={{ color: p.color, fontSize: 12, marginBottom: 2 }}>
          {p.name}: <strong>{p.value?.toLocaleString()} kWh</strong>
        </p>
      ))}
    </div>
  )
}
