import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { AlertCircle, CheckCircle } from 'lucide-react'
import Card from '../components/ui/Card'
import ChartTooltip from '../components/ui/Tooltip'
import { useLang } from '../hooks/useLang'

function genForecastData(days) {
  return Array.from({ length: days }, (_, i) => {
    const base = 3800 + Math.sin((i / 7) * Math.PI) * 400
    const actual = i < 20 ? Math.round(base + (Math.random() - 0.5) * 600) : null
    const forecast = Math.round(base + (Math.random() - 0.5) * 200)
    const d = new Date(2025, 4, 1 + i)
    return { date: `${d.getDate()}/${d.getMonth() + 1}`, actual, forecast }
  })
}

const pvForecastData = Array.from({ length: 30 }, (_, i) => {
  const base = 2200 + Math.sin((i / 14) * Math.PI) * 800
  const actual = i < 20 ? Math.round(base + (Math.random() - 0.5) * 400) : null
  const forecast = Math.round(base + (Math.random() - 0.5) * 150)
  const d = new Date(2025, 4, 1 + i)
  return { date: `${d.getDate()}/${d.getMonth() + 1}`, actual, forecast }
})

const MODEL_METRICS = [
  { label: 'RMSE', value: '142 kWh', good: true },
  { label: 'MAE', value: '108 kWh', good: true },
  { label: 'MAPE', value: '3.1%', good: true },
  { label: 'R²', value: '0.94', good: false },
]

export default function Forecast() {
  const { t } = useLang()
  const [horizon, setHorizon] = useState(30)
  const [modelIdx, setModelIdx] = useState(0)
  const [targetIdx, setTargetIdx] = useState(0)
  const data = genForecastData(horizon)

  const horizons = [7, 30, 90]

  return (
    <div className="page-wrap">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="section-label">{t.forecast.sectionLabel}</div>
          <h1 className="page-title">{t.forecast.title}</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>{t.forecast.subtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={modelIdx} onChange={e => setModelIdx(Number(e.target.value))} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, background: '#fff', cursor: 'pointer', outline: 'none' }}>
            {t.forecast.models.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select value={targetIdx} onChange={e => setTargetIdx(Number(e.target.value))} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, background: '#fff', cursor: 'pointer', outline: 'none' }}>
            {t.forecast.targets.map((tg, i) => <option key={i} value={i}>{tg}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {MODEL_METRICS.map(({ label, value, good }, i) => (
          <Card key={label} style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>{value}</div>
              </div>
              {good ? <CheckCircle size={18} color="#10b981" /> : <AlertCircle size={18} color="#f59e0b" />}
            </div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{t.forecast.metricDescs[i]}</div>
          </Card>
        ))}
      </div>

      <Card style={{ padding: '20px 20px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{t.forecast.targets[targetIdx]} {t.forecast.forecastLabel}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{t.forecast.actualVsModel} · {t.forecast.models[modelIdx]}</div>
          </div>
          <div className="tab-group">
            {horizons.map(h => (
              <button key={h} onClick={() => setHorizon(h)} className={`tab-btn${horizon === h ? ' active' : ''}`}>{h} {t.forecast.days}</button>
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
            <ReferenceLine x={data[19]?.date} stroke="#e2e8f0" strokeDasharray="4 2" label={{ value: t.forecast.today, fontSize: 10, fill: '#94a3b8', position: 'insideTopRight' }} />
            <Line type="monotone" dataKey="actual" name={t.forecast.actual} stroke="#0f172a" strokeWidth={2} dot={false} connectNulls={false} />
            <Line type="monotone" dataKey="forecast" name={t.forecast.forecastLabel} stroke="#2563eb" strokeWidth={2} strokeDasharray="5 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card style={{ padding: '20px 20px 16px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{t.forecast.pvForecastTitle}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>{t.forecast.pvForecastSub}</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={pvForecastData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={5} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="actual" name={t.forecast.actual} stroke="#f59e0b" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="forecast" name={t.forecast.forecastLabel} stroke="#fbbf24" strokeWidth={2} strokeDasharray="5 3" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ padding: '20px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 14 }}>{t.forecast.modelInfoTitle}</div>
          {[
            [t.forecast.modelInfo.model, t.forecast.models[modelIdx]],
            [t.forecast.modelInfo.trainingPeriod, '2022–2024 (3 years)'],
            [t.forecast.modelInfo.featureCount, '18 input variables'],
            [t.forecast.modelInfo.validationSet, '20% holdout'],
            [t.forecast.modelInfo.dataSources, 'NASA POWER, TEDAŞ, Weather API'],
            [t.forecast.modelInfo.lastUpdated, 'May 10, 2025'],
            [t.forecast.modelInfo.crossValidation, 'k-fold (k=5)'],
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
