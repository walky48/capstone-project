import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { AlertCircle, CheckCircle } from 'lucide-react'
import Card from '../components/ui/Card'
import ChartTooltip from '../components/ui/Tooltip'

function genForecastData(days) {
  return Array.from({ length: days }, (_, i) => {
    const base = 3800 + Math.sin((i / 7) * Math.PI) * 400
    const actual = i < 20 ? Math.round(base + (Math.random() - 0.5) * 600) : null
    const forecast = Math.round(base + (Math.random() - 0.5) * 200)
    const upper = forecast + Math.round(200 + i * 3)
    const lower = forecast - Math.round(200 + i * 3)
    const d = new Date(2025, 4, 1 + i)
    return { date: `${d.getDate()}/${d.getMonth() + 1}`, actual, forecast, upper, lower }
  })
}

const pvForecastData = Array.from({ length: 30 }, (_, i) => {
  const base = 2200 + Math.sin((i / 14) * Math.PI) * 800
  const actual = i < 20 ? Math.round(base + (Math.random() - 0.5) * 400) : null
  const forecast = Math.round(base + (Math.random() - 0.5) * 150)
  const d = new Date(2025, 4, 1 + i)
  return { date: `${d.getDate()}/${d.getMonth() + 1}`, actual, forecast }
})

const modelMetrics = [
  { label: 'RMSE', value: '142 kWh', desc: 'Root Mean Square Error', status: 'good', icon: CheckCircle },
  { label: 'MAE', value: '108 kWh', desc: 'Mean Absolute Error', status: 'good', icon: CheckCircle },
  { label: 'MAPE', value: '3.1%', desc: 'Mean Abs. Percentage Error', status: 'good', icon: CheckCircle },
  { label: 'R²', value: '0.94', desc: 'Coefficient of Determination', status: 'warning', icon: AlertCircle },
]

export default function Forecast() {
  const [horizon, setHorizon] = useState(30)
  const [model, setModel] = useState('XGBoost')
  const [target, setTarget] = useState('Load Demand')
  const data = genForecastData(horizon)

  return (
    <div className="page-wrap">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="section-label">Machine Learning</div>
          <h1 className="page-title">Energy Forecasting</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>XGBoost · LightGBM · LSTM prediction models</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={model} onChange={e => setModel(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, background: '#fff', cursor: 'pointer', outline: 'none' }}>
            {['XGBoost', 'LightGBM', 'LSTM', 'Hybrid LSTM+CNN'].map(m => <option key={m}>{m}</option>)}
          </select>
          <select value={target} onChange={e => setTarget(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, background: '#fff', cursor: 'pointer', outline: 'none' }}>
            {['Load Demand', 'PV Generation', 'Grid Import'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {modelMetrics.map(({ label, value, desc, status, icon: Icon }) => (
          <Card key={label} style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>{value}</div>
              </div>
              <Icon size={18} color={status === 'good' ? '#10b981' : '#f59e0b'} />
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{desc}</div>
          </Card>
        ))}
      </div>

      <Card style={{ padding: '20px 20px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{target} Forecast</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Actual vs. model output · {model}</div>
          </div>
          <div className="tab-group">
            {[7, 30, 90].map(h => (
              <button key={h} onClick={() => setHorizon(h)} className={`tab-btn${horizon === h ? ' active' : ''}`}>{h} Days</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={Math.floor(data.length / 8)} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
            <ReferenceLine x={data[19]?.date} stroke="#e2e8f0" strokeDasharray="4 2" label={{ value: 'Today', fontSize: 10, fill: '#94a3b8', position: 'insideTopRight' }} />
            <Line type="monotone" dataKey="actual" name="Actual" stroke="#0f172a" strokeWidth={2} dot={false} connectNulls={false} />
            <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#2563eb" strokeWidth={2} strokeDasharray="5 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card style={{ padding: '20px 20px 16px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>PV Generation Forecast</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>30-day NASA POWER + XGBoost</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={pvForecastData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={5} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="actual" name="Actual" stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#fbbf24" strokeWidth={2} strokeDasharray="5 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 14 }}>Model Information</div>
          {[
            ['Model', model],
            ['Training Period', '2022–2024 (3 years)'],
            ['Feature Count', '18 input variables'],
            ['Validation Set', '20% holdout'],
            ['Data Sources', 'NASA POWER, TEDAŞ, Weather API'],
            ['Last Updated', 'May 10, 2025'],
            ['Cross-Validation', 'k-fold (k=5)'],
          ].map(([k, v]) => (
            <div key={k} className="stat-row">
              <span className="stat-label">{k}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#0f172a' }}>{v}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}
