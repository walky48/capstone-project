import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts'
import { SCENARIOS } from '../data/scenarios'
import Card from '../components/ui/Card'
import { useLang } from '../hooks/useLang'

const METRIC_CONFIG = [
  { key: 'selfSuff', max: 100, unit: '%', color: '#10b981' },
  { key: 'co2', max: 2500, unit: 'kg', color: '#0891b2' },
  { key: 'gridImport', max: 2500, unit: 'kWh', color: '#dc2626' },
  { key: 'lcoe', max: 0.25, unit: '$', color: '#7c3aed' },
  { key: 'payback', max: 20, unit: 'yrs', color: '#f59e0b' },
]

const RADAR_AXES = [
  { key: 'selfSuff', high: true },
  { key: 'lcoe', high: false },
  { key: 'co2', high: true },
  { key: 'gridImport', high: false },
  { key: 'payback', high: false },
  { key: 'pv', high: true },
]

const score = (v, vals, high) => {
  const mx = Math.max(...vals)
  const mn = Math.min(...vals)
  if (high) return mx > 0 ? Math.round((v / mx) * 100) : 0
  return v > 0 ? Math.round(((mn || v) / v) * 100) : 100
}

export default function Compare() {
  const { t } = useLang()

  const sim = (() => { try { return JSON.parse(localStorage.getItem('simulation_result')) } catch { return null } })()
  const current = sim ? {
    id: 0, name: `${sim.campusName || 'Current'} (Current)`, color: '#2563eb',
    pv: sim.totalKWp || 0, bess: sim.bessCapacity || 0, selfSuff: sim.selfSufficiency || 0,
    gridImport: sim.gridToLoad || 0, co2: sim.co2AvoidedDaily || 0, lcoe: sim.lcoe || 0,
    capex: Math.round(sim.economics?.total_capex || 0), payback: sim.paybackYears || 0,
  } : null
  const refs = [SCENARIOS.find(s => s.id === 1), SCENARIOS.find(s => s.id === 3)].filter(Boolean)
  const compareScenarios = current ? [current, ...refs] : [2, 1, 3].map(id => SCENARIOS.find(s => s.id === id))

  const radarData = t.compare.radarAxes.map((axis, i) => {
    const def = RADAR_AXES[i] || RADAR_AXES[0]
    const vals = compareScenarios.map(s => s[def.key] ?? 0)
    return { axis, a: score(vals[0], vals, def.high), b: score(vals[1], vals, def.high), c: score(vals[2], vals, def.high) }
  })

  const metrics = METRIC_CONFIG.map((m, i) => ({ ...m, label: t.compare.metrics[i] }))

  return (
    <div className="page-wrap">
      <div style={{ marginBottom: 24 }}>
        <div className="section-label">{t.compare.sectionLabel}</div>
        <h1 className="page-title">{t.compare.title}</h1>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>{t.compare.subtitle}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        {compareScenarios.map((sc, idx) => (
          <Card key={sc.id} style={{ padding: '20px', borderColor: idx === 0 ? sc.color : '#e2e8f0', borderWidth: idx === 0 ? 2 : 1, position: 'relative', overflow: 'visible' }}>
            {idx === 0 && (
              <div style={{ position: 'absolute', top: -10, left: 16, background: sc.color, color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 12px', borderRadius: 10, letterSpacing: '0.05em' }}>
                {t.compare.recommended}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: sc.color, flexShrink: 0 }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{sc.name}</div>
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 16 }}>PV: {sc.pv} kWp · BESS: {sc.bess} kWh · CAPEX: ${(sc.capex / 1000).toFixed(0)}k</div>
            {metrics.map(m => {
              const pct = Math.min(100, (sc[m.key] / m.max) * 100)
              return (
                <div key={m.key} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{m.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: m.color }}>
                      {m.key === 'lcoe' ? `$${sc[m.key]}` : `${sc[m.key].toLocaleString()} ${m.unit}`}
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
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>{t.compare.radarTitle}</div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>{t.compare.radarSub}</div>
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
