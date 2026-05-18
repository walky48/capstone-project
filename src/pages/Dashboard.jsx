import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts'
import { Sun, Battery, Zap, TrendingDown, RefreshCw, Download } from 'lucide-react'
import Card from '../components/ui/Card'
import ChartTooltip from '../components/ui/Tooltip'
import { hourly, monthly } from '../data/dashboard'
import { useLang } from '../contexts/LanguageContext'

const kpisBase = [
  { key: 'pvGeneration', value: '4,280', unit: 'kWh/day', sub: '+12% this month', icon: Sun, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  { key: 'energyDemand', value: '5,840', unit: 'kWh/day', sub: '-3% this month', icon: Zap, color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  { key: 'selfSufficiency', value: '73.2', unit: '%', sub: 'Target: 80%', icon: Battery, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { key: 'gridImport', value: '1,560', unit: 'kWh/day', sub: 'vs. grid-only baseline', icon: TrendingDown, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
]

const flowsBase = [
  { key: 'pvToLoad', value: 3120, pct: 73, color: '#f59e0b' },
  { key: 'pvToBess', value: 860, pct: 20, color: '#7c3aed' },
  { key: 'bessToLoad', value: 420, pct: 10, color: '#7c3aed' },
  { key: 'gridToLoad', value: 1560, pct: 27, color: '#dc2626' },
  { key: 'pvToGrid', value: 300, pct: 7, color: '#10b981' },
]

const quickStatsBase = [
  { key: 'specificYield', value: '1,420 kWh/kWp', color: '#f59e0b' },
  { key: 'lcoe', value: '₺0.14/kWh', color: '#7c3aed' },
  { key: 'co2Avoided', value: '1,240 kg/day', color: '#10b981' },
  { key: 'paybackPeriod', value: '11.8 yrs', color: '#0891b2' },
  { key: 'panelModel', value: 'JKM570N · 22.1%', color: '#64748b' },
  { key: 'gridCO2', value: '452 g CO₂/kWh', color: '#dc2626' },
]

export default function Dashboard() {
  const { t } = useLang()
  const [range, setRange] = useState(0)
  const chartData = range >= 2 ? monthly : hourly
  const xKey = range >= 2 ? 'month' : 'hour'

  const kpis = kpisBase.map(k => ({ ...k, label: t.dashboard.kpis[k.key] }))
  const flows = flowsBase.map((f, i) => ({ ...f, label: t.dashboard.flows[i] }))
  const quickStats = quickStatsBase.map(s => ({ ...s, label: t.dashboard.stats[s.key] }))

  return (
    <div className="page-wrap">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div className="section-label">{t.dashboard.sectionLabel}</div>
          <h1 className="page-title">{t.dashboard.title}</h1>
          <p style={{ color: '#64748b', fontSize: 13 }}>{t.dashboard.subtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline"><RefreshCw size={14} /> {t.dashboard.refresh}</button>
          <button className="btn btn-outline"><Download size={14} /> {t.dashboard.export}</button>
          <button className="btn btn-primary">{t.dashboard.newScenario}</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        {kpis.map(({ label, value, unit, sub, icon: Icon, color, bg, border }) => (
          <Card key={label} style={{ padding: '18px 20px', borderColor: border }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{label}</span>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={color} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>{value}</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>{unit}</span>
            </div>
            <div style={{ fontSize: 11, color: sub.startsWith('-') ? '#10b981' : '#64748b', fontWeight: 500 }}>{sub}</div>
            <div style={{ height: 28, marginTop: 10, position: 'relative', overflow: 'hidden' }}>
              <svg width="100%" height="100%" viewBox="0 0 100 28" preserveAspectRatio="none">
                <polyline points="0,20 10,18 20,12 30,8 40,10 50,6 60,9 70,14 80,10 90,7 100,9" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card style={{ padding: '20px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{t.dashboard.energyBalance}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{t.dashboard.energyBalanceSub} · kW</div>
            </div>
            <div className="tab-group">
              {t.dashboard.ranges.map((r, i) => (
                <button key={r} onClick={() => setRange(i)} className={`tab-btn${range === i ? ' active' : ''}`}>{r}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gPV" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gLoad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0891b2" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0891b2" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={range === 0 ? 3 : 0} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 12 }} formatter={v => t.dashboard.chartLabels[v] || v} />
              <Area type="monotone" dataKey="pv" name="pv" stroke="#f59e0b" strokeWidth={2} fill="url(#gPV)" />
              <Area type="monotone" dataKey="load" name="load" stroke="#0891b2" strokeWidth={2} fill="url(#gLoad)" strokeDasharray="4 2" />
              <Area type="monotone" dataKey="grid" name="grid" stroke="#dc2626" strokeWidth={1.5} fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>{t.dashboard.energyFlow}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>{t.dashboard.energyFlowSub}</div>
          <div style={{ fontSize: 11, color: '#92400e', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 5, padding: '5px 8px', marginBottom: 14 }}>
            {t.dashboard.pvFlowNote}
          </div>
          {flows.map(({ label, value, pct, color }) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{value.toLocaleString()} kWh</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 14, padding: '12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.dashboard.bessStatus}</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <div style={{ flex: 1, background: '#ecfdf5', borderRadius: 6, padding: '6px 8px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>{t.dashboard.bessState}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>⚡ {t.dashboard.bessCharging}</div>
              </div>
              <div style={{ flex: 1, background: '#f5f3ff', borderRadius: 6, padding: '6px 8px', border: '1px solid #ddd6fe' }}>
                <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>{t.dashboard.bessPower}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed' }}>245 kW</div>
              </div>
              <div style={{ flex: 1, background: '#fff7ed', borderRadius: 6, padding: '6px 8px', border: '1px solid #fed7aa' }}>
                <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>{t.dashboard.bessTemp}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>28°C</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ flex: 1, height: 10, background: '#e2e8f0', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '64%', background: 'linear-gradient(90deg,#7c3aed,#a855f7)', borderRadius: 5 }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>64%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>960 / 1,500 kWh {t.dashboard.bessCharged}</div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{t.dashboard.bessETA}: ~2.2h</div>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <Card style={{ padding: '20px 20px 16px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{t.dashboard.monthlyBalance}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>{t.dashboard.monthlyBalanceSub}</div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={monthly} barSize={10} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="pv" name={t.dashboard.chartLabels.pv} fill="#f59e0b" radius={[3, 3, 0, 0]} />
              <Bar dataKey="load" name={t.dashboard.chartLabels.load} fill="#0891b2" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 18 }}>{t.dashboard.quickStats}</div>
          {quickStats.map(({ label, value, color }) => (
            <div key={label} className="stat-row">
              <span className="stat-label">{label}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color }}>{value}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
