import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, ChevronUp, ChevronDown, Trash2, Copy, ExternalLink, Filter, X } from 'lucide-react'
import { SCENARIOS } from '../data/scenarios'
import { useLang } from '../hooks/useLang'

function Badge({ tag, filters, filterKeys }) {
  const cls = { Recommended: 'badge-recommended', Active: 'badge-active', Draft: 'badge-draft' }[tag] || 'badge-draft'
  const label = filters[filterKeys.indexOf(tag)] || tag
  return <span className={`badge ${cls}`}>{label.toUpperCase()}</span>
}

function SelfSuffBar({ value }) {
  const color = value >= 80 ? '#10b981' : value >= 60 ? '#f59e0b' : '#dc2626'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div className="progress-track" style={{ flex: 1 }}>
        <div className="progress-fill" style={{ width: `${value}%`, background: color }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 34 }}>{value}%</span>
    </div>
  )
}

const SCENARIO_STORAGE = 'custom_scenarios'
const HIDDEN_STORAGE = 'hidden_scenarios'
const emptyForm = { name: '', tag: 'Draft', pv: '', bess: '', selfSuff: '', gridImport: '', co2: '', lcoe: '', capex: '', payback: '' }

export default function Scenarios() {
  const { t } = useLang()
  const navigate = useNavigate()
  const filterRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [sort, setSort] = useState({ key: 'selfSuff', dir: 'desc' })
  const [selected, setSelected] = useState(null)
  const [customScenarios, setCustomScenarios] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SCENARIO_STORAGE) || '[]') } catch { return [] }
  })
  const [hiddenIds, setHiddenIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(HIDDEN_STORAGE) || '[]') } catch { return [] }
  })
  const [newModalOpen, setNewModalOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [advFilter, setAdvFilter] = useState({ selfSuffMin: 0, pvMin: 0, paybackMax: 99 })
  const [newForm, setNewForm] = useState(emptyForm)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 650)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!filterOpen) return
    const handle = (e) => { if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [filterOpen])

  const allScenarios = [...SCENARIOS, ...customScenarios].filter(s => !hiddenIds.includes(s.id))
  const colKeys = ['name', 'pv', 'bess', 'selfSuff', 'gridImport', 'co2', 'lcoe', 'payback']
  const cols = colKeys.map((key, i) => ({ key, label: t.scenarios.cols[i] }))
  const hasAdvFilter = advFilter.selfSuffMin > 0 || advFilter.pvMin > 0 || advFilter.paybackMax < 99

  let rows = allScenarios
    .filter(s => filter === 'All' || s.tag === filter)
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    .filter(s => s.selfSuff >= advFilter.selfSuffMin && s.pv >= advFilter.pvMin && s.payback <= advFilter.paybackMax)
    .sort((a, b) => {
      const v = sort.dir === 'asc' ? 1 : -1
      return a[sort.key] > b[sort.key] ? v : -v
    })

  const toggleSort = (key) => setSort(s => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }))
  const sel = selected != null ? allScenarios.find(s => s.id === selected) : null

  const detailRows = sel ? [
    [t.scenarios.detail.pvCapacity, `${sel.pv} kWp`],
    [t.scenarios.detail.bessCapacity, `${sel.bess} kWh`],
    [t.scenarios.detail.selfSufficiency, `${sel.selfSuff}%`],
    [t.scenarios.detail.gridImport, `${sel.gridImport} kWh/day`],
    [t.scenarios.detail.co2Savings, `${sel.co2} kg/day`],
    [t.scenarios.detail.lcoe, `₺${sel.lcoe}/kWh`],
    [t.scenarios.detail.capex, `₺${sel.capex.toLocaleString()}`],
    [t.scenarios.detail.payback, `${sel.payback} yrs`],
  ] : []

  function handleAddScenario() {
    if (!newForm.name.trim()) return
    const newId = Math.max(...allScenarios.map(s => s.id), 0) + 1
    const scenario = {
      id: newId,
      name: newForm.name.trim(),
      tag: newForm.tag,
      pv: parseFloat(newForm.pv) || 0,
      bess: parseFloat(newForm.bess) || 0,
      selfSuff: parseFloat(newForm.selfSuff) || 0,
      gridImport: parseFloat(newForm.gridImport) || 0,
      co2: parseFloat(newForm.co2) || 0,
      lcoe: parseFloat(newForm.lcoe) || 0,
      capex: parseFloat(newForm.capex) || 0,
      payback: parseFloat(newForm.payback) || 0,
      color: '#6366f1',
    }
    const updated = [...customScenarios, scenario]
    setCustomScenarios(updated)
    localStorage.setItem(SCENARIO_STORAGE, JSON.stringify(updated))
    setNewModalOpen(false)
    setNewForm(emptyForm)
  }

  function handleClone(row, e) {
    e.stopPropagation()
    const newId = Math.max(...allScenarios.map(s => s.id), 0) + 1
    const clone = { ...row, id: newId, name: row.name + ' (Copy)', tag: 'Draft' }
    const updated = [...customScenarios, clone]
    setCustomScenarios(updated)
    localStorage.setItem(SCENARIO_STORAGE, JSON.stringify(updated))
  }

  function handleDelete(row, e) {
    e.stopPropagation()
    if (selected === row.id) setSelected(null)
    const isCustom = customScenarios.some(s => s.id === row.id)
    if (isCustom) {
      const updated = customScenarios.filter(s => s.id !== row.id)
      setCustomScenarios(updated)
      localStorage.setItem(SCENARIO_STORAGE, JSON.stringify(updated))
    } else {
      const updated = [...hiddenIds, row.id]
      setHiddenIds(updated)
      localStorage.setItem(HIDDEN_STORAGE, JSON.stringify(updated))
    }
  }

  function handleDetailedView() {
    if (!sel) return
    const dailyLoad = 10411
    const dailyPV = Math.round(sel.pv * 1378 / 365)
    const pvToLoad = Math.round(dailyLoad * sel.selfSuff / 100 * 0.75)
    const bessToLoad = Math.round(dailyLoad * sel.selfSuff / 100 * 0.25)
    const simResult = {
      totalKWp: sel.pv,
      annualPV: Math.round(sel.pv * 1378),
      dailyPV,
      annualLoad: 3800000,
      dailyLoad,
      selfSufficiency: sel.selfSuff,
      pvToLoad,
      pvToBess: Math.round(dailyPV * 0.20),
      bessToLoad,
      gridToLoad: sel.gridImport,
      specificYield: 1378,
      lcoe: sel.lcoe,
      co2AvoidedDaily: sel.co2,
      paybackYears: sel.payback,
      bessCapacity: sel.bess,
      bessChargePct: 64,
      pvModel: 'JKM570N-72HL4-BDV',
      pvEff: '22.07%',
      pvScale: dailyPV / 2720,
      loadScale: 1.0,
      campusName: sel.name,
      runAt: new Date().toISOString(),
    }
    localStorage.setItem('simulation_result', JSON.stringify(simResult))
    navigate('/dashboard')
  }

  const fldStyle = { width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, outline: 'none', boxSizing: 'border-box' }

  return (
    <div className="page-wrap">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="section-label">{t.scenarios.sectionLabel}</div>
          <h1 className="page-title">{t.scenarios.title}</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>{rows.length} {t.scenarios.subtitleSuffix}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setNewModalOpen(true)}>
          <Plus size={15} /> {t.scenarios.newScenario}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '0 0 260px' }}>
          <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t.scenarios.searchPlaceholder}
            style={{ width: '100%', padding: '8px 12px 8px 32px', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 13, outline: 'none', background: '#fff' }}
          />
        </div>
        <div style={{ display: 'flex', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 7, overflow: 'hidden' }}>
          {t.scenarios.filterKeys.map((fk, i) => (
            <button key={fk} onClick={() => setFilter(fk)} style={{
              padding: '7px 14px', border: 'none', borderRight: '1px solid #e2e8f0', cursor: 'pointer', fontSize: 12, fontWeight: 500,
              background: filter === fk ? '#eff6ff' : '#fff', color: filter === fk ? '#2563eb' : '#64748b'
            }}>{t.scenarios.filters[i]}</button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative' }} ref={filterRef}>
          <button
            className="btn btn-outline"
            onClick={() => setFilterOpen(v => !v)}
            style={{ color: hasAdvFilter ? '#2563eb' : undefined, borderColor: hasAdvFilter ? '#2563eb' : undefined }}
          >
            <Filter size={13} /> {t.scenarios.filter}
            {hasAdvFilter && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563eb', display: 'inline-block', marginLeft: 4 }} />}
          </button>
          {filterOpen && (
            <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', width: 250, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 18, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', zIndex: 200 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', marginBottom: 14 }}>ADVANCED FILTERS</div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  Min Self-Sufficiency <span style={{ color: '#2563eb', fontWeight: 700 }}>{advFilter.selfSuffMin}%</span>
                </label>
                <input type="range" min={0} max={100} value={advFilter.selfSuffMin}
                  onChange={e => setAdvFilter(f => ({ ...f, selfSuffMin: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: '#2563eb' }} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  Min PV Capacity <span style={{ color: '#2563eb', fontWeight: 700 }}>{advFilter.pvMin} kWp</span>
                </label>
                <input type="range" min={0} max={1500} step={50} value={advFilter.pvMin}
                  onChange={e => setAdvFilter(f => ({ ...f, pvMin: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: '#2563eb' }} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  Max Payback Period <span style={{ color: '#2563eb', fontWeight: 700 }}>{advFilter.paybackMax < 99 ? advFilter.paybackMax + ' yrs' : 'Any'}</span>
                </label>
                <input type="range" min={5} max={25} value={Math.min(advFilter.paybackMax, 25)}
                  onChange={e => setAdvFilter(f => ({ ...f, paybackMax: Number(e.target.value) }))}
                  style={{ width: '100%', accentColor: '#2563eb' }} />
              </div>

              {hasAdvFilter && (
                <button onClick={() => setAdvFilter({ selfSuffMin: 0, pvMin: 0, paybackMax: 99 })}
                  style={{ fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <X size={11} /> Reset filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: sel ? '1fr 340px' : '1fr', gap: 16 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <table className="data-table">
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ width: 36, padding: '12px 14px' }}></th>
                {cols.map(c => (
                  <th key={c.key} onClick={() => toggleSort(c.key)}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {c.label}
                      {sort.key === c.key
                        ? (sort.dir === 'asc' ? <ChevronUp size={12} color="#2563eb" /> : <ChevronDown size={12} color="#2563eb" />)
                        : <ChevronDown size={12} style={{ opacity: 0.3 }} />}
                    </span>
                  </th>
                ))}
                <th style={{ width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: 13 }}>
                    {t.scenarios.loading}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: 13 }}>
                    No scenarios match the current filters.
                  </td>
                </tr>
              ) : rows.map((row, i) => (
                <tr
                  key={row.id}
                  onClick={() => setSelected(selected === row.id ? null : row.id)}
                  style={{ background: selected === row.id ? '#eff6ff' : i % 2 === 0 ? '#fff' : '#fafbfc', cursor: 'pointer' }}
                  onMouseEnter={e => { if (selected !== row.id) e.currentTarget.style.background = '#f8fafc' }}
                  onMouseLeave={e => { e.currentTarget.style.background = selected === row.id ? '#eff6ff' : i % 2 === 0 ? '#fff' : '#fafbfc' }}
                >
                  <td style={{ padding: '13px 14px' }}>
                    <Badge tag={row.tag} filters={t.scenarios.filters} filterKeys={t.scenarios.filterKeys} />
                  </td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{row.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>ID: SC-00{row.id}</div>
                  </td>
                  <td style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{row.pv.toLocaleString()}</td>
                  <td style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{row.bess.toLocaleString()}</td>
                  <td style={{ minWidth: 140 }}><SelfSuffBar value={row.selfSuff} /></td>
                  <td style={{ fontSize: 13, color: '#dc2626', fontWeight: 500 }}>{row.gridImport.toLocaleString()}</td>
                  <td style={{ fontSize: 13, color: '#10b981', fontWeight: 500 }}>{row.co2.toLocaleString()}</td>
                  <td style={{ fontSize: 13, fontWeight: 600, color: '#7c3aed' }}>₺{row.lcoe}</td>
                  <td style={{ fontSize: 13, color: '#0f172a' }}>{row.payback}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <button title="Clone" onClick={e => handleClone(row, e)} style={{ padding: 5, border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer', color: '#64748b' }}><Copy size={13} /></button>
                      <button title="Delete" onClick={e => handleDelete(row, e)} style={{ padding: 5, border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer', color: '#64748b' }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sel && (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{sel.name}</div>
                <Badge tag={sel.tag} filters={t.scenarios.filters} filterKeys={t.scenarios.filterKeys} />
              </div>
              <button onClick={() => setSelected(null)} style={{ border: 'none', background: '#f1f5f9', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 12, color: '#64748b' }}>✕</button>
            </div>
            {detailRows.map(([k, v]) => (
              <div key={k} className="stat-row">
                <span className="stat-label">{k}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{v}</span>
              </div>
            ))}
            <button className="btn btn-primary" onClick={handleDetailedView} style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}>
              <ExternalLink size={14} /> {t.scenarios.detail.detailedView}
            </button>
          </div>
        )}
      </div>

      {newModalOpen && (
        <div className="modal-overlay" onClick={() => setNewModalOpen(false)}>
          <div className="modal" style={{ width: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>New Scenario</span>
              <button className="modal-close" onClick={() => setNewModalOpen(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Scenario Name *</label>
                  <input value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. High Efficiency Config" style={fldStyle} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Tag</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {['Draft', 'Recommended', 'Active'].map(tag => (
                      <button key={tag} type="button" onClick={() => setNewForm(f => ({ ...f, tag }))} style={{
                        padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                        border: newForm.tag === tag ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        background: newForm.tag === tag ? '#eff6ff' : '#fff', color: newForm.tag === tag ? '#2563eb' : '#64748b',
                      }}>{tag}</button>
                    ))}
                  </div>
                </div>
                {[
                  ['PV Capacity (kWp)', 'pv'],
                  ['BESS Capacity (kWh)', 'bess'],
                  ['Self-Sufficiency (%)', 'selfSuff'],
                  ['Grid Import (kWh/day)', 'gridImport'],
                  ['CO₂ Savings (kg/day)', 'co2'],
                  ['LCOE (₺/kWh)', 'lcoe'],
                  ['CAPEX (₺)', 'capex'],
                  ['Payback (yrs)', 'payback'],
                ].map(([label, key]) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
                    <input type="number" value={newForm[key]} onChange={e => setNewForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder="0" style={fldStyle} />
                  </div>
                ))}
              </div>
              <div className="modal-section-alt" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '14px 24px' }}>
                <button className="btn btn-outline" onClick={() => { setNewModalOpen(false); setNewForm(emptyForm) }}>Cancel</button>
                <button className="btn btn-primary" onClick={handleAddScenario} disabled={!newForm.name.trim()}>
                  <Plus size={14} /> Add Scenario
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
