import { useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { AlertCircle, CheckCircle, FileText, ChevronRight } from 'lucide-react'
import Card from '../components/ui/Card'
import ChartTooltip from '../components/ui/Tooltip'
import { useLang } from '../hooks/useLang'

const MODEL_METRICS = [
  { label: 'RMSE', value: '998.87 kWh', good: true },
  { label: 'MAE', value: '601.34 kWh', good: true },
  { label: 'MAPE', value: '6.13%', good: true },
  { label: 'R²', value: '0.9056', good: true },
]

export default function Forecast() {
  const { t } = useLang()
  const navigate = useNavigate()
  const sim = (() => { try { return JSON.parse(localStorage.getItem('simulation_result')) } catch { return null } })()

  const forecastData = sim?.forecastDaily?.length ? sim.forecastDaily : []
  const pvData = sim?.daily?.length ? sim.daily : []

  const modelInfo = [
    [t.forecast.modelInfo.model, 'LSTM (2-layer, 256 hidden)'],
    [t.forecast.modelInfo.trainingPeriod, 'Mar 2023 – May 2024'],
    [t.forecast.modelInfo.featureCount, '19 input features'],
    [t.forecast.modelInfo.validationSet, '70 / 10 / 20 block split'],
    [t.forecast.modelInfo.dataSources, 'HKUST campus, NASA POWER'],
    [t.forecast.modelInfo.lastUpdated, sim?.metadata?.forecast_model || 'lstm_2layer_256h'],
    [t.forecast.modelInfo.crossValidation, 'Block-based (168h)'],
  ]

  return (
    <div className="page-wrap">
      <div style={{ marginBottom: 24 }}>
        <div className="section-label">{t.forecast.sectionLabel}</div>
        <h1 className="page-title">{t.forecast.title}</h1>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>{t.forecast.subtitle}</p>
      </div>

      {!sim ? (
        <Card style={{ padding: 36, textAlign: 'center' }}>
          <FileText size={32} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>{t.forecast.emptyTitle}</div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 18 }}>{t.forecast.emptyDesc}</div>
          <button className="btn btn-primary" onClick={() => navigate('/setup')}>
            {t.forecast.goSetup} <ChevronRight size={15} />
          </button>
        </Card>
      ) : (
        <>
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
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{t.forecast.targets[0]} {t.forecast.forecastLabel}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{t.forecast.actualVsModel} · {t.forecast.models[0]}</div>
            </div>
            {forecastData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={forecastData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(forecastData.length / 8))} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                  <Line type="monotone" dataKey="actual" name={t.forecast.actual} stroke="#0f172a" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="forecast" name={t.forecast.forecastLabel} stroke="#2563eb" strokeWidth={2} strokeDasharray="5 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>{t.forecast.noForecast}</div>
            )}
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Card style={{ padding: '20px 20px 16px' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{t.forecast.pvForecastTitle}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>{t.forecast.pvForecastSub}</div>
              {pvData.length ? (
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={pvData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(pvData.length / 6))} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="pv" name={t.dashboard.chartLabels.pv} stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>{t.forecast.noForecast}</div>
              )}
            </Card>

            <Card style={{ padding: '20px' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 14 }}>{t.forecast.modelInfoTitle}</div>
              {modelInfo.map(([k, v]) => (
                <div key={k} className="stat-row">
                  <span className="stat-label">{k}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: '#0f172a' }}>{v}</span>
                </div>
              ))}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
