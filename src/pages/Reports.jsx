import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Sparkles, BarChart3, Wallet, Settings2, Download, Clock, Trash2, FileText, ChevronRight } from 'lucide-react'
import Card from '../components/ui/Card'
import { pvModels, bessModels } from '../data/models'
import { useLang } from '../hooks/useLang'

const BLUE = [37, 99, 235]
const GRAY = [100, 116, 139]
const TARIFF_TL = 3.5

const fmt = n => Math.round(Number(n) || 0).toLocaleString('en-US')
const pdfSafe = s => String(s ?? '')
  .replace(/→/g, '->').replace(/·/g, '-').replace(/₺/g, 'TL')
  .replace(/₂/g, '2').replace(/°/g, 'deg').replace(/²/g, '2')

// Visual config + English PDF titles (jsPDF core fonts can't render ş/ğ/ı, so
// the generated documents stay English while the page UI is localised).
const REPORTS = {
  executive: { icon: Sparkles, color: '#2563eb', bg: '#eff6ff', pdfTitle: 'Executive Summary' },
  energy: { icon: BarChart3, color: '#0891b2', bg: '#ecfeff', pdfTitle: 'Energy Performance' },
  financial: { icon: Wallet, color: '#7c3aed', bg: '#f5f3ff', pdfTitle: 'Financial & ROI' },
  technical: { icon: Settings2, color: '#0f766e', bg: '#f0fdfa', pdfTitle: 'Technical Configuration' },
}

function buildReport(type, sim, draft) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const meta = REPORTS[type]
  const campus = sim.campusName || draft.campusName || 'Campus'

  doc.setFillColor(...BLUE)
  doc.rect(0, 0, 210, 16, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10); doc.setFont('helvetica', 'bold')
  doc.text(`${pdfSafe(campus)}  -  ${meta.pdfTitle}`, 14, 11)
  doc.setFontSize(8); doc.setFont('helvetica', 'normal')
  doc.text(new Date().toLocaleDateString(), 196, 11, { align: 'right' })

  let y = 26
  const section = (title) => {
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...GRAY)
    doc.text(title.toUpperCase(), 14, y); y += 3
  }
  const table = (head, body) => {
    autoTable(doc, {
      startY: y, head, body,
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: BLUE, fontSize: 7.5, fontStyle: 'bold', textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 }, theme: 'grid',
    })
    y = doc.lastAutoTable.finalY + 7
  }

  const annualSavings = Math.round(sim.annualPV * 0.70 * TARIFF_TL)
  const capex = Math.round((sim.paybackYears || 0) * annualSavings)

  if (type === 'executive') {
    section('Project')
    table([['Field', 'Value']], [
      ['Campus', pdfSafe(campus)],
      ['Location', `${draft.lat || '-'} N, ${draft.lon || '-'} E${draft.city ? ' - ' + pdfSafe(draft.city) : ''}`],
      ['Installed PV', `${fmt(sim.totalKWp)} kWp`],
      ['Battery (BESS)', `${fmt(sim.bessCapacity)} kWh`],
      ['Simulation run', sim.runAt ? new Date(sim.runAt).toLocaleString() : '-'],
    ])
    section('Key Results')
    table([['Metric', 'Value']], [
      ['PV Generation', `${fmt(sim.dailyPV)} kWh/day`],
      ['Energy Demand', `${fmt(sim.dailyLoad)} kWh/day`],
      ['Self-Sufficiency', `${sim.selfSufficiency}%`],
      ['Grid Import', `${fmt(sim.gridToLoad)} kWh/day`],
      ['Payback Period', `${sim.paybackYears} yrs`],
      ['CO2 Avoided', `${fmt(sim.co2AvoidedDaily)} kg/day`],
    ])
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40)
    const narrative = `The proposed ${fmt(sim.totalKWp)} kWp solar system paired with a ${fmt(sim.bessCapacity)} kWh battery covers ${sim.selfSufficiency}% of the campus daily demand, generating ${fmt(sim.dailyPV)} kWh/day and avoiding ${fmt(sim.co2AvoidedDaily)} kg of CO2 per day. The estimated payback period is ${sim.paybackYears} years at an LCOE of TL ${sim.lcoe}/kWh.`
    doc.text(doc.splitTextToSize(narrative, 182), 14, y)
  }

  if (type === 'energy') {
    section('Daily Energy Balance')
    table([['Metric', 'Value']], [
      ['PV Generation', `${fmt(sim.dailyPV)} kWh/day`],
      ['Energy Demand', `${fmt(sim.dailyLoad)} kWh/day`],
      ['PV -> Load', `${fmt(sim.pvToLoad)} kWh`],
      ['PV -> BESS', `${fmt(sim.pvToBess)} kWh`],
      ['BESS -> Load', `${fmt(sim.bessToLoad)} kWh`],
      ['Grid -> Load', `${fmt(sim.gridToLoad)} kWh`],
      ['Self-Sufficiency', `${sim.selfSufficiency}%`],
      ['Specific Yield', `${fmt(sim.specificYield)} kWh/kWp`],
    ])
    if (sim.hourlyProfile?.length) {
      section('Hourly Profile (representative day)')
      table([['Hour', 'PV (kWh)', 'Load (kWh)', 'Grid (kWh)']],
        sim.hourlyProfile.map(r => [r.hour, fmt(r.pv), fmt(r.load), fmt(r.grid)]))
    }
  }

  if (type === 'financial') {
    section('Financial Summary')
    table([['Metric', 'Value']], [
      ['CAPEX (estimated)', `TL ${fmt(capex)}`],
      ['Annual Savings', `TL ${fmt(annualSavings)}`],
      ['Payback Period', `${sim.paybackYears} yrs`],
      ['LCOE', `TL ${sim.lcoe}/kWh`],
      ['Annual PV Generation', `${fmt(sim.annualPV)} kWh/yr`],
      ['CO2 Avoided', `${fmt(sim.co2AvoidedDaily * 365)} kg/yr`],
    ])
    doc.setFontSize(8); doc.setFont('helvetica', 'italic'); doc.setTextColor(...GRAY)
    doc.text(`Assumes a tariff of TL ${TARIFF_TL}/kWh and a 25-year system lifetime.`, 14, y)
  }

  if (type === 'technical') {
    const pv = pvModels[draft.pvModel] || {}
    const bess = bessModels[draft.bessModel] || {}
    section('Solar PV')
    table([['Parameter', 'Value']], [
      ['PV Model', pdfSafe(draft.pvModel)],
      ['Panel Capacity', `${pv.kwp || '-'} kWp`],
      ['Panel Technology', pdfSafe(pv.tech)],
      ['Module Efficiency', pdfSafe(pv.eff)],
      ['Installed Capacity', `${fmt(sim.totalKWp)} kWp`],
      ['Tilt / Azimuth', `${draft.tilt ?? 33} deg / ${pdfSafe(draft.azimuth ?? 'South')}`],
      ['Solar Data Source', pdfSafe(draft.solarData ?? 'NASA POWER API')],
    ])
    section('Battery (BESS)')
    table([['Parameter', 'Value']], [
      ['BESS Model', pdfSafe(draft.bessModel)],
      ['Capacity', `${bess.cap || '-'} kWh`],
      ['Technology', pdfSafe(bess.tech)],
      ['Depth of Discharge', `${bess.dod ?? '-'}%`],
      ['Round-trip Efficiency', `${bess.rte ?? '-'}%`],
      ['Power Converter', `${bess.power ?? '-'} kW`],
      ['Storage Duration', `${bess.duration ?? '-'} h`],
    ])
  }

  const pages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY)
    doc.text(`${pdfSafe(campus)} - CEMS Report  -  Page ${i} of ${pages}`, 14, 291)
  }
  return doc
}

const HISTORY_KEY = 'report_history'

export default function Reports() {
  const { t } = useLang()
  const L = t.reports
  const navigate = useNavigate()
  const sim = (() => { try { return JSON.parse(localStorage.getItem('simulation_result')) } catch { return null } })()
  const draft = (() => { try { return JSON.parse(localStorage.getItem('setup_draft')) || {} } catch { return {} } })()
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [] } catch { return [] }
  })

  const persist = (next) => { setHistory(next); localStorage.setItem(HISTORY_KEY, JSON.stringify(next)) }

  const generate = (type) => {
    if (!sim) return
    const doc = buildReport(type, sim, draft)
    const date = new Date().toISOString().split('T')[0]
    const blob = doc.output('blob')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${type}-report-${date}.pdf`
    a.click()
    URL.revokeObjectURL(a.href)
    persist([{ id: Date.now(), type, at: new Date().toISOString() }, ...history].slice(0, 12))
  }

  const removeOne = (id) => persist(history.filter(h => h.id !== id))

  return (
    <div className="page-wrap">
      <div style={{ marginBottom: 24 }}>
        <div className="section-label">{L.sectionLabel}</div>
        <h1 className="page-title">{L.title}</h1>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{L.subtitle}</p>
      </div>

      {!sim ? (
        <Card style={{ padding: 36, textAlign: 'center' }}>
          <FileText size={32} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>{L.emptyTitle}</div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 18 }}>{L.emptyDesc}</div>
          <button className="btn btn-primary" onClick={() => navigate('/setup')}>
            {L.goSetup} <ChevronRight size={15} />
          </button>
        </Card>
      ) : (
        <>
          <Card style={{ padding: '14px 18px', marginBottom: 20, background: '#f8fafc', display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
            {[
              [L.ctx.project, sim.campusName || draft.campusName || 'Campus'],
              [L.ctx.installedPv, `${fmt(sim.totalKWp)} kWp`],
              [L.ctx.bess, `${fmt(sim.bessCapacity)} kWh`],
              [L.ctx.selfSufficiency, `${sim.selfSufficiency}%`],
              [L.ctx.lastRun, sim.runAt ? new Date(sim.runAt).toLocaleDateString() : '-'],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4 }}>{k}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{v}</div>
              </div>
            ))}
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
            {Object.entries(REPORTS).map(([key, cfg]) => {
              const Icon = cfg.icon
              const c = L.cards[key]
              return (
                <Card key={key} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={19} color={cfg.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{c.title}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 3, lineHeight: 1.5 }}>{c.desc}</div>
                    </div>
                  </div>
                  <button className="btn btn-outline" onClick={() => generate(key)} style={{ alignSelf: 'flex-start', marginTop: 'auto' }}>
                    <Download size={14} /> {L.generate}
                  </button>
                </Card>
              )
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={15} color="#64748b" /> {L.recent}
            </div>
            {history.length > 0 && (
              <button onClick={() => persist([])} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>{L.clearAll}</button>
            )}
          </div>
          <Card style={{ padding: history.length ? 0 : 28 }}>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>{L.none}</div>
            ) : (
              history.map((h, i) => (
                <div key={h.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  borderTop: i === 0 ? 'none' : '1px solid #f1f5f9',
                }}>
                  <FileText size={16} color="#64748b" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{L.cards[h.type]?.title || h.type}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(h.at).toLocaleString()} · PDF</div>
                  </div>
                  <button className="btn btn-outline" onClick={() => generate(h.type)} style={{ padding: '6px 10px' }}>
                    <Download size={13} /> {L.redownload}
                  </button>
                  <button onClick={() => removeOne(h.id)} title="Remove" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', display: 'flex' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </Card>
        </>
      )}
    </div>
  )
}
