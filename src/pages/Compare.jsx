import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts'
import { SCENARIOS } from '../data/scenarios'
import Card from '../components/ui/Card'

const compareScenarios = [2, 1, 3].map(id => SCENARIOS.find(s => s.id === id))

const radarData = [
  { axis: 'Self-Sufficiency', a: 74, b: 48, c: 94 },
  { axis: 'Economy', a: 70, b: 90, c: 40 },
  { axis: 'CO₂ Savings', a: 72, b: 28, c: 100 },
  { axis: 'Reliability', a: 75, b: 50, c: 95 },
  { axis: 'Feasibility', a: 80, b: 85, c: 55 },
  { axis: 'Sustainability', a: 76, b: 52, c: 92 },
]

const metrics = [
  { key: 'selfSuff', label: 'Self-Sufficiency (%)', max: 100, unit: '%', color: '#10b981', goodHigh: true },
  { key: 'co2', label: 'CO₂ Savings (kg/day)', max: 2500, unit: 'kg', color: '#0891b2', goodHigh: true },
  { key: 'gridImport', label: 'Grid Import (kWh/day)', max: 2500, unit: 'kWh', color: '#dc2626', goodHigh: false },
  { key: 'lcoe', label: 'LCOE (₺/kWh)', max: 0.25, unit: '₺', color: '#7c3aed', goodHigh: false },
  { key: 'payback', label: 'Payback (yrs)', max: 20, unit: 'yrs', color: '#f59e0b', goodHigh: false },
]

export default function Compare() {
  return (
    <div className="page-wrap">
      <div style={{ marginBottom: 24 }}>
        <div className="section-label">Scenario Analysis</div>
        <h1 className="page-title">Comparison View</h1>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>Side-by-side comparison of 3 scenarios</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        {compareScenarios.map((sc, idx) => (
          <Card key={sc.id} style={{ padding: '20px', borderColor: idx === 0 ? sc.color : '#e2e8f0', borderWidth: idx === 0 ? 2 : 1, position: 'relative', overflow: 'visible' }}>
            {idx === 0 && (
              <div style={{ position: 'absolute', top: -10, left: 16, background: sc.color, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 12px', borderRadius: 10, letterSpacing: '0.05em' }}>
                ★ RECOMMENDED
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: sc.color, flexShrink: 0 }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{sc.name}</div>
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 16 }}>PV: {sc.pv} kWp · BESS: {sc.bess} kWh · CAPEX: ₺{(sc.capex / 1000).toFixed(0)}k</div>
            {metrics.map(m => {
              const pct = Math.min(100, (sc[m.key] / m.max) * 100)
              return (
                <div key={m.key} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{m.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: m.color }}>
                      {typeof sc[m.key] === 'number' && sc[m.key] < 1 ? `₺${sc[m.key]}` : sc[m.key].toLocaleString()} {m.key !== 'lcoe' ? m.unit : ''}
                    </span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: m.color, opacity: 0.85 }} />
                  </div>
                </div>
              )
            })}
          </Card>
        ))}
      </div>

      <Card style={{ padding: '20px' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Multi-Dimensional Comparison</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>6-axis radar analysis · normalized values</div>
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart data={radarData} margin={{ top: 10, right: 40, left: 40, bottom: 10 }}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <Radar name={compareScenarios[0].name} dataKey="a" stroke={compareScenarios[0].color} fill={compareScenarios[0].color} fillOpacity={0.15} strokeWidth={2} />
            <Radar name={compareScenarios[1].name} dataKey="b" stroke={compareScenarios[1].color} fill={compareScenarios[1].color} fillOpacity={0.1} strokeWidth={2} />
            <Radar name={compareScenarios[2].name} dataKey="c" stroke={compareScenarios[2].color} fill={compareScenarios[2].color} fillOpacity={0.1} strokeWidth={2} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
          </RadarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
