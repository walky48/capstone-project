import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts'
import { Sun, Battery, Zap, TrendingDown, RefreshCw, Download } from 'lucide-react'
import Card from '../components/ui/Card'
import ChartTooltip from '../components/ui/Tooltip'
import { hourly, monthly } from '../data/dashboard'

const kpis = [
  { label: 'PV Generation', value: '4,280', unit: 'kWh/day', sub: '+12% this month', icon: Sun, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  { label: 'Energy Demand', value: '5,840', unit: 'kWh/day', sub: '-3% this month', icon: Zap, color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  { label: 'Self-Sufficiency', value: '73.2', unit: '%', sub: 'Target: 80%', icon: Battery, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { label: 'Grid Import', value: '1,560', unit: 'kWh/day', sub: '-18% saved', icon: TrendingDown, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
]

const flows = [
  { label: 'PV → Load', value: 3120, pct: 73, color: '#f59e0b' },
  { label: 'PV → BESS', value: 860, pct: 20, color: '#7c3aed' },
  { label: 'BESS → Load', value: 420, pct: 10, color: '#7c3aed' },
  { label: 'Grid → Load', value: 1560, pct: 27, color: '#dc2626' },
  { label: 'PV → Grid', value: 300, pct: 7, color: '#10b981' },
]

export default function Dashboard() {
  const [range, setRange] = useState('Daily')
  const ranges = ['Daily', 'Weekly', 'Monthly', 'Yearly']
  const chartData = range === 'Monthly' || range === 'Yearly' ? monthly : hourly
  const xKey = range === 'Monthly' || range === 'Yearly' ? 'month' : 'hour'

  return (
    <div className="page-wrap">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div className="section-label">Dashboard</div>
          <h1 className="page-title">BAU Kemerburgaz Campus</h1>
          <p style={{ color: '#64748b', fontSize: 13 }}>Last updated: Today, 14:32 · Active scenario: PV+BESS Optimal</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline"><RefreshCw size={14} /> Refresh</button>
          <button className="btn btn-outline"><Download size={14} /> Export</button>
          <button className="btn btn-primary">+ New Scenario</button>
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
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>Energy Balance</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>PV · Load · BESS · Grid</div>
            </div>
            <div className="tab-group">
              {ranges.map(r => (
                <button key={r} onClick={() => setRange(r)} className={`tab-btn${range === r ? ' active' : ''}`}>{r}</button>
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
              <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={range === 'Daily' ? 3 : 0} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 12 }} formatter={v => ({ pv: 'PV Generation', load: 'Load', grid: 'Grid' }[v] || v)} />
              <Area type="monotone" dataKey="pv" name="pv" stroke="#f59e0b" strokeWidth={2} fill="url(#gPV)" />
              <Area type="monotone" dataKey="load" name="load" stroke="#0891b2" strokeWidth={2} fill="url(#gLoad)" strokeDasharray="4 2" />
              <Area type="monotone" dataKey="grid" name="grid" stroke="#dc2626" strokeWidth={1.5} fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Energy Flow</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 18 }}>Daily total · MWh</div>
          {flows.map(({ label, value, pct, color }) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{value} kWh</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 18, padding: '12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>BESS Status</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 10, background: '#e2e8f0', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '64%', background: 'linear-gradient(90deg,#7c3aed,#a855f7)', borderRadius: 5 }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>64%</span>
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>960 / 1,500 kWh charged</div>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <Card style={{ padding: '20px 20px 16px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>Monthly Energy Balance</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>PV generation vs demand · 2025</div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={monthly} barSize={10} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="pv" name="PV" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              <Bar dataKey="load" name="Load" fill="#0891b2" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 18 }}>Quick Statistics</div>
          {[
            { label: 'Capacity Factor', value: '18.4%', color: '#f59e0b' },
            { label: 'LCOE', value: '₺0.14/kWh', color: '#7c3aed' },
            { label: 'CO₂ Savings', value: '1,240 kg/day', color: '#10b981' },
            { label: 'Payback Period', value: '11.8 yrs', color: '#0891b2' },
            { label: 'Peak Demand', value: '486 kW', color: '#dc2626' },
            { label: 'PV Area Used', value: '3,200 m²', color: '#64748b' },
          ].map(({ label, value, color }) => (
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
