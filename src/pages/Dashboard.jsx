import { useState, useMemo } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts'
import { Sun, Battery, Zap, TrendingDown, RefreshCw, Download, X, FolderOpen } from 'lucide-react'
import Card from '../components/ui/Card'
import ChartTooltip from '../components/ui/Tooltip'
import { hourly, weekly, monthly, yearly } from '../data/dashboard'
import { useLang } from '../hooks/useLang'

const KPI_DATA = [
  { key: 'pvGeneration', value: '2,720', unit: 'kWh/day', sub: '+1.8% this month', icon: Sun, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  { key: 'energyDemand', value: '10,411', unit: 'kWh/day', sub: '-0.8% this month', icon: Zap, color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  { key: 'selfSufficiency', value: '26.1', unit: '%', sub: 'Target: 35%', icon: Battery, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  { key: 'gridImport', value: '7,691', unit: 'kWh/day', sub: '-26% vs. no PV', icon: TrendingDown, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
]

const FLOW_DATA = [
  { key: 'pvToLoad', value: 2400, pct: 25, color: '#f59e0b' },
  { key: 'pvToBess', value: 320, pct: 3, color: '#7c3aed' },
  { key: 'bessToLoad', value: 288, pct: 3, color: '#7c3aed' },
  { key: 'gridToLoad', value: 7691, pct: 74, color: '#dc2626' },
]

const STATS_DATA = [
  { key: 'specificYield', value: '1,378 kWh/kWp', color: '#f59e0b' },
  { key: 'lcoe', value: '₺0.77/kWh', color: '#7c3aed' },
  { key: 'co2Avoided', value: '1,229 kg/day', color: '#10b981' },
  { key: 'paybackPeriod', value: '5.0 yrs', color: '#0891b2' },
  { key: 'panelModel', value: 'JKM570N · 22.07%', color: '#64748b' },
  { key: 'gridCO2', value: '452 g CO₂/kWh', color: '#dc2626' },
]

const BLUE = [37, 99, 235]
const GRAY = [100, 116, 139]

const fmtTick = (v) => {
  if (v >= 1e9) return Math.round(v / 1e9) + 'B'
  if (v >= 1e6) return Math.round(v / 1e6) + 'M'
  if (v >= 1e5) return Math.round(v / 1e3) + 'K'
  return v
}

const pdfSafe = str => String(str)
  .replace(/→/g, '->')
  .replace(/·/g, '-')
  .replace(/₺/g, 'TL')
  .replace(/₂/g, '2')

export default function Dashboard() {
  const { t } = useLang()
  const [range, setRange] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [updatedAt] = useState('14:32')
  const [exportOpen, setExportOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState('csv')
  const [exportScope, setExportScope] = useState('current')
  const [saveLocation, setSaveLocation] = useState('default')

  const canPickFile = typeof window !== 'undefined' && 'showSaveFilePicker' in window

  const fmtNum = n => Math.round(n).toLocaleString('en-US')

  const sim = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('simulation_result')) } catch { return null }
  }, [])

  const scaleRow = (row, s) => {
    const pv = Math.round(row.pv * s.pvScale)
    const load = Math.round(row.load * s.loadScale)
    return { ...row, pv, load, grid: Math.max(0, load - pv) }
  }

  const activeKPIs = sim ? [
    { key: 'pvGeneration', value: fmtNum(sim.dailyPV), unit: 'kWh/day', sub: `${fmtNum(sim.totalKWp)} kWp installed`, icon: Sun, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
    { key: 'energyDemand', value: fmtNum(sim.dailyLoad), unit: 'kWh/day', sub: `${fmtNum(sim.annualLoad / 1000)} MWh/yr`, icon: Zap, color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
    { key: 'selfSufficiency', value: String(sim.selfSufficiency), unit: '%', sub: 'Target: 35%', icon: Battery, color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
    { key: 'gridImport', value: fmtNum(sim.gridToLoad), unit: 'kWh/day', sub: `${(100 - sim.selfSufficiency).toFixed(0)}% grid dependency`, icon: TrendingDown, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  ] : KPI_DATA

  const activeFlows = sim ? [
    { key: 'pvToLoad', value: sim.pvToLoad, pct: Math.round(sim.pvToLoad / sim.dailyLoad * 100), color: '#f59e0b' },
    { key: 'pvToBess', value: sim.pvToBess, pct: Math.round(sim.pvToBess / sim.dailyLoad * 100), color: '#7c3aed' },
    { key: 'bessToLoad', value: sim.bessToLoad, pct: Math.round(sim.bessToLoad / sim.dailyLoad * 100), color: '#7c3aed' },
    { key: 'gridToLoad', value: sim.gridToLoad, pct: Math.round(sim.gridToLoad / sim.dailyLoad * 100), color: '#dc2626' },
  ] : FLOW_DATA

  const activeStats = sim ? [
    { key: 'specificYield', value: `${fmtNum(sim.specificYield)} kWh/kWp`, color: '#f59e0b' },
    { key: 'lcoe', value: `₺${sim.lcoe}/kWh`, color: '#7c3aed' },
    { key: 'co2Avoided', value: `${fmtNum(sim.co2AvoidedDaily)} kg/day`, color: '#10b981' },
    { key: 'paybackPeriod', value: `${sim.paybackYears} yrs`, color: '#0891b2' },
    { key: 'panelModel', value: sim.pvModel ? sim.pvModel.replace('-72HL4-BDV', '') + ' · ' + sim.pvEff : 'JKM570N · 22.07%', color: '#64748b' },
    { key: 'gridCO2', value: '452 g CO₂/kWh', color: '#dc2626' },
  ] : STATS_DATA

  const activeHourly = sim?.hourlyProfile?.length ? sim.hourlyProfile : (sim ? hourly.map(r => scaleRow(r, sim)) : hourly)
  const activeWeekly = sim ? weekly.map(r => scaleRow(r, sim)) : weekly
  const activeMonthly = sim ? monthly.map(r => scaleRow(r, sim)) : monthly
  const activeYearly = sim ? yearly.map(r => scaleRow(r, sim)) : yearly

  const bessChargePct = sim ? sim.bessChargePct : 64
  const bessCapacityDisplay = sim ? sim.bessCapacity : 1500
  const bessChargedKwh = Math.round(bessCapacityDisplay * 0.9 * bessChargePct / 100)

  const chartData = [activeHourly, activeWeekly, activeMonthly, activeYearly][range]
  const xKey = ['hour', 'day', 'month', 'year'][range]

  const kpis = activeKPIs.map(k => ({ ...k, label: t.dashboard.kpis[k.key] }))
  const flows = activeFlows.map((f, i) => ({ ...f, label: t.dashboard.flows[i] }))
  const quickStats = activeStats.map(s => ({ ...s, label: t.dashboard.stats[s.key] }))

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => window.location.reload(), 800)
  }

  const handleExport = () => setExportOpen(true)

  const buildPdf = (rangeLabel) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    doc.setFillColor(...BLUE)
    doc.rect(0, 0, 210, 16, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('BAU Kemerburgaz Campus  ·  Dashboard Export', 14, 11)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(new Date().toLocaleString(), 196, 11, { align: 'right' })

    let y = 24

    const section = (title) => {
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...GRAY)
      doc.text(title.toUpperCase(), 14, y)
      y += 3
    }

    const tblOpts = (startY, head, body) => ({
      startY, head, body,
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: BLUE, fontSize: 7.5, fontStyle: 'bold', textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
      theme: 'grid',
    })

    section('KPI Summary')
    autoTable(doc, tblOpts(y, [['Metric', 'Value', 'Unit']],
      activeKPIs.map(k => [pdfSafe(t.dashboard.kpis[k.key]), k.value, k.unit])
    ))
    y = doc.lastAutoTable.finalY + 7

    section('Energy Flow')
    autoTable(doc, tblOpts(y, [['Flow', 'Energy (kWh)', 'Share (%)']],
      activeFlows.map((f, i) => [pdfSafe(t.dashboard.flows[i]), f.value.toLocaleString(), f.pct + '%'])
    ))
    y = doc.lastAutoTable.finalY + 7

    section('Quick Statistics')
    autoTable(doc, tblOpts(y, [['Metric', 'Value']],
      activeStats.map(s => [pdfSafe(t.dashboard.stats[s.key]), pdfSafe(s.value)])
    ))
    y = doc.lastAutoTable.finalY + 7

    if (exportScope !== 'kpi') {
      const addDataTable = (data, key, title) => {
        if (y > 240) { doc.addPage(); y = 20 }
        section(title)
        autoTable(doc, tblOpts(y,
          [[key.charAt(0).toUpperCase() + key.slice(1), 'PV (kWh)', 'Load (kWh)', 'Grid (kWh)']],
          data.map(r => [r[key], r.pv, r.load, r.grid])
        ))
        y = doc.lastAutoTable.finalY + 7
      }

      if (exportScope === 'current') {
        addDataTable(chartData, xKey, `Energy Balance — ${rangeLabel}`)
      } else {
        addDataTable(activeHourly, 'hour', 'Energy Balance — Hourly')
        addDataTable(activeWeekly, 'day', 'Energy Balance — Weekly')
        addDataTable(activeMonthly, 'month', 'Energy Balance — Monthly')
        addDataTable(activeYearly, 'year', 'Energy Balance — Yearly')
      }
    }

    const pages = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i)
      doc.setFontSize(7)
      doc.setTextColor(...GRAY)
      doc.text(`BAU Kemerburgaz · CEMS Dashboard  ·  Page ${i} of ${pages}`, 14, 291)
    }

    return doc
  }

  const doExport = async () => {
    const rangeLabel = t.dashboard.ranges[range]
    const scopeSlug = exportScope === 'current' ? rangeLabel.toLowerCase() : exportScope
    const dateSuffix = new Date().toISOString().split('T')[0]
    const filename = `dashboard-${scopeSlug}-${dateSuffix}.${exportFormat}`

    let blob
    if (exportFormat === 'pdf') {
      blob = buildPdf(rangeLabel).output('blob')
    } else if (exportFormat === 'json') {
      const out = { exported: new Date().toISOString(), campus: sim?.campusName || 'BAU Kemerburgaz' }
      out.kpis = activeKPIs.map(k => ({ name: t.dashboard.kpis[k.key], value: k.value, unit: k.unit }))
      if (exportScope === 'current') { out.range = rangeLabel; out.chartData = chartData }
      else if (exportScope === 'all') { out.hourly = activeHourly; out.weekly = activeWeekly; out.monthly = activeMonthly; out.yearly = activeYearly }
      blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' })
    } else {
      const block = (data, key) => {
        const hdr = [key, 'PV', 'Load', 'Grid'].join(',')
        return [hdr, ...data.map(r => [r[key], r.pv, r.load, r.grid].join(','))].join('\n')
      }
      const kpiLines = activeKPIs.map(k => `${t.dashboard.kpis[k.key]},${k.value},${k.unit}`).join('\n')
      let body = `${sim?.campusName || 'BAU Kemerburgaz'} - Dashboard Export\nExported: ${new Date().toLocaleString()}\n\n== KPI Summary ==\n${kpiLines}\n\n`
      if (exportScope === 'current') body += `== Energy Balance (${rangeLabel}) ==\n` + block(chartData, xKey)
      else if (exportScope === 'all') {
        body += '== Hourly ==\n' + block(activeHourly, 'hour') + '\n\n'
        body += '== Weekly ==\n' + block(activeWeekly, 'day') + '\n\n'
        body += '== Monthly ==\n' + block(activeMonthly, 'month') + '\n\n'
        body += '== Yearly ==\n' + block(activeYearly, 'year')
      }
      blob = new Blob([body], { type: 'text/csv' })
    }

    if (saveLocation === 'choose' && canPickFile) {
      const types = {
        csv: { description: 'CSV File', accept: { 'text/csv': ['.csv'] } },
        json: { description: 'JSON File', accept: { 'application/json': ['.json'] } },
        pdf: { description: 'PDF File', accept: { 'application/pdf': ['.pdf'] } },
      }
      try {
        const handle = await window.showSaveFilePicker({ suggestedName: filename, types: [types[exportFormat]] })
        const writable = await handle.createWritable()
        await writable.write(blob)
        await writable.close()
      } catch (e) {
        if (e.name !== 'AbortError') console.error(e)
      }
    } else {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      URL.revokeObjectURL(a.href)
    }

    setExportOpen(false)
  }

  const fmtDescs = { csv: t.dashboard.exportModal.csvDesc, json: t.dashboard.exportModal.jsonDesc, pdf: t.dashboard.exportModal.pdfDesc }

  return (
    <div className="page-wrap">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div className="section-label">{t.dashboard.sectionLabel}</div>
          <h1 className="page-title">
            {t.dashboard.title}
            {sim && <span style={{ marginLeft: 10, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: '#10b981', background: '#ecfdf5', border: '1px solid #bbf7d0', borderRadius: 4, padding: '2px 7px', verticalAlign: 'middle' }}>SIMULATION</span>}
          </h1>
          <p style={{ color: '#64748b', fontSize: 13 }}>
            {sim
              ? <><span style={{ color: '#10b981', fontWeight: 600 }}>⚡ {sim.campusName}</span> · {sim.totalKWp} kWp · {new Date(sim.runAt).toLocaleTimeString()}</>
              : <>{t.dashboard.subtitleUpdated} {updatedAt} · {t.dashboard.subtitleScenario}</>
            }
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} /> {t.dashboard.refresh}
          </button>
          <button className="btn btn-outline" onClick={handleExport}>
            <Download size={14} /> {t.dashboard.export}
          </button>
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
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={fmtTick} />
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
                <div style={{ height: '100%', width: `${bessChargePct}%`, background: 'linear-gradient(90deg,#7c3aed,#a855f7)', borderRadius: 5 }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>{bessChargePct}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{bessChargedKwh.toLocaleString()} / {bessCapacityDisplay.toLocaleString()} kWh {t.dashboard.bessCharged}</div>
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
            <BarChart data={activeMonthly} barSize={10} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={fmtTick} />
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

      {exportOpen && (
        <div className="modal-overlay" onClick={() => setExportOpen(false)}>
          <div className="modal" style={{ width: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{t.dashboard.exportModal.title}</span>
              <button className="modal-close" onClick={() => setExportOpen(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">

              <div className="modal-section">
                <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.dashboard.exportModal.format}</div>
                <div className="tab-group" style={{ display: 'inline-flex' }}>
                  {['csv', 'json', 'pdf'].map(f => (
                    <button key={f} className={`tab-btn${exportFormat === f ? ' active' : ''}`} onClick={() => setExportFormat(f)} style={{ padding: '5px 16px', fontSize: 12 }}>
                      {f.toUpperCase()}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 8, fontSize: 11, color: '#94a3b8' }}>{fmtDescs[exportFormat]}</div>
              </div>

              <div className="modal-section">
                <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.dashboard.exportModal.scope}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {t.dashboard.exportModal.scopes.map((label, i) => {
                    const val = ['current', 'all', 'kpi'][i]
                    return (
                      <label key={val} className={`radio-opt${exportScope === val ? ' sel' : ''}`}>
                        <input type="radio" name="exportScope" value={val} checked={exportScope === val} onChange={() => setExportScope(val)} style={{ accentColor: '#2563eb', cursor: 'pointer', marginTop: 1 }} />
                        <span style={{ fontSize: 13, color: '#0f172a', fontWeight: exportScope === val ? 500 : 400 }}>{label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="modal-section">
                <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.dashboard.exportModal.location}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label className={`radio-opt${saveLocation === 'default' ? ' sel' : ''}`}>
                    <input type="radio" name="saveLocation" value="default" checked={saveLocation === 'default'} onChange={() => setSaveLocation('default')} style={{ accentColor: '#2563eb', cursor: 'pointer', marginTop: 3 }} />
                    <div>
                      <div style={{ fontSize: 13, color: '#0f172a', fontWeight: saveLocation === 'default' ? 500 : 400 }}>{t.dashboard.exportModal.locationDefault}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{t.dashboard.exportModal.locationDefaultDesc}</div>
                    </div>
                  </label>
                  <label className={`radio-opt${saveLocation === 'choose' ? ' sel' : ''}`} style={{ opacity: canPickFile ? 1 : 0.45, cursor: canPickFile ? 'pointer' : 'not-allowed' }}>
                    <input type="radio" name="saveLocation" value="choose" checked={saveLocation === 'choose'} onChange={() => canPickFile && setSaveLocation('choose')} disabled={!canPickFile} style={{ accentColor: '#2563eb', cursor: canPickFile ? 'pointer' : 'not-allowed', marginTop: 3 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, color: '#0f172a', fontWeight: saveLocation === 'choose' ? 500 : 400 }}>{t.dashboard.exportModal.locationChoose}</span>
                        <FolderOpen size={13} color="#64748b" />
                      </div>
                      <div style={{ fontSize: 11, color: canPickFile ? '#94a3b8' : '#dc2626', marginTop: 2 }}>
                        {canPickFile ? t.dashboard.exportModal.locationChooseDesc : t.dashboard.exportModal.locationNotSupported}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="modal-section-alt" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '14px 24px' }}>
                <button className="btn btn-outline" onClick={() => setExportOpen(false)}>{t.dashboard.exportModal.cancel}</button>
                <button className="btn btn-primary" onClick={doExport}><Download size={13} /> {t.dashboard.exportModal.export}</button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
