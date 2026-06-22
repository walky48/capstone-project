import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ChevronRight, FileText } from 'lucide-react'
import Card from '../components/ui/Card'
import ChartTooltip from '../components/ui/Tooltip'
import { useLang } from '../hooks/useLang'
import { fetchPvGeneration, fetchPvBenchmark, isApiConfigured } from '../utils/api'

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const fmt = n => Math.round(Number(n) || 0).toLocaleString('en-US')
const readDraft = () => { try { return JSON.parse(localStorage.getItem('setup_draft')) || null } catch { return null } }

function Stat({ label, value, color }) {
  return (
    <Card style={{ padding: '14px 16px' }}>
      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: color || '#0f172a' }}>{value}</div>
    </Card>
  )
}

export default function PvAnalysis() {
  const { t } = useLang()
  const L = t.pvAnalysis
  const navigate = useNavigate()
  const draft = readDraft()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [bm, setBm] = useState(null)
  const [bmLoading, setBmLoading] = useState(false)
  const [bmError, setBmError] = useState('')

  useEffect(() => {
    if (!draft || !isApiConfigured()) return
    setLoading(true); setError('')
    fetchPvGeneration(draft)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
    // eslint-disable-next-line
  }, [])

  const runBenchmark = () => {
    setBmLoading(true); setBmError('')
    fetchPvBenchmark(draft)
      .then(setBm)
      .catch(e => setBmError(e.message))
      .finally(() => setBmLoading(false))
  }

  const meta = data?.metadata
  const dayProfile = (data?.hourly_profile || []).slice(0, 24).map(r => ({
    hour: `${String(new Date(r.timestamp).getHours()).padStart(2, '0')}:00`,
    poa: Math.round(r.poa_irradiance_wm2),
    ghi: Math.round(r.ghi_wm2),
  }))
  const dailyGen = (data?.daily_summary || []).map(r => ({
    date: String(r.date).slice(5),
    gen: Math.round(r.total_generation_kwh),
  }))
  const monthly = (bm?.benchmark?.monthly || []).map(m => ({
    month: MON[m.month - 1], ours: Math.round(m.our_kwh), pvgis: Math.round(m.pvgis_kwh),
  }))

  const header = (
    <div style={{ marginBottom: 24 }}>
      <div className="section-label">{L.sectionLabel}</div>
      <h1 className="page-title">{L.title}</h1>
      <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>{L.subtitle}</p>
    </div>
  )

  if (!draft || !isApiConfigured()) {
    return (
      <div className="page-wrap">
        {header}
        <Card style={{ padding: 36, textAlign: 'center' }}>
          <FileText size={32} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 18 }}>{!draft ? L.empty : L.noApi}</div>
          {!draft && (
            <button className="btn btn-primary" onClick={() => navigate('/setup')}>{L.goSetup} <ChevronRight size={15} /></button>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="page-wrap">
      {header}

      {loading && <Card style={{ padding: 28, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>{L.loading}</Card>}
      {error && <Card style={{ padding: 20, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', fontSize: 13 }}>{error}</Card>}

      {meta && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 20 }}>
            <Stat label={L.tilt} value={`${meta.panel_tilt_deg}°`} color="#f59e0b" />
            <Stat label={L.azimuth} value={`${meta.panel_azimuth_deg}°`} color="#f59e0b" />
            <Stat label={L.capacity} value={`${fmt(meta.pv_capacity_kwp)} kWp`} color="#2563eb" />
            <Stat label={L.panels} value={fmt(meta.num_panels)} color="#0891b2" />
            <Stat label={L.total} value={`${fmt(meta.total_generation_kwh)} kWh`} color="#10b981" />
            <Stat label={L.degradation} value={`${(meta.degradation_rate * 100).toFixed(2)}%/yr`} color="#64748b" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <Card style={{ padding: '20px 20px 16px' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{L.dailyTitle}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>{L.dailySub}</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dailyGen} barSize={10} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={Math.max(0, Math.floor(dailyGen.length / 8))} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="gen" name={L.generation} fill="#f59e0b" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card style={{ padding: '20px 20px 16px' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{L.irradianceTitle}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>{L.irradianceSub}</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dayProfile} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={3} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                  <Line type="monotone" dataKey="poa" name="POA (W/m²)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="ghi" name="GHI (W/m²)" stroke="#0891b2" strokeWidth={2} strokeDasharray="5 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{L.benchmarkTitle}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{L.benchmarkSub}</div>
              </div>
              <button className="btn btn-outline" onClick={runBenchmark} disabled={bmLoading}>
                {bmLoading ? L.benchmarkRunning : L.runBenchmark}
              </button>
            </div>
            {bmError && <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 10 }}>{bmError}</div>}
            {bm && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, margin: '16px 0' }}>
                  <Stat label={L.ourYearly} value={`${fmt(bm.benchmark.our_yearly_kwh)} kWh`} color="#2563eb" />
                  <Stat label={L.pvgisYearly} value={`${fmt(bm.benchmark.pvgis_yearly_kwh)} kWh`} color="#0891b2" />
                  <Stat label={L.deviation} value={`${bm.benchmark.deviation_pct > 0 ? '+' : ''}${bm.benchmark.deviation_pct}%`} color={Math.abs(bm.benchmark.deviation_pct) <= 10 ? '#10b981' : '#f59e0b'} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>{L.monthlyTitle}</div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthly} barSize={9} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                    <Bar dataKey="ours" name={L.ourYearly} fill="#2563eb" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="pvgis" name={L.pvgisYearly} fill="#0891b2" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
