import { useState, useEffect } from 'react'
import { Search, Plus, ChevronUp, ChevronDown, Trash2, Copy, ExternalLink, Filter } from 'lucide-react'
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

export default function Scenarios() {
  const { t } = useLang()
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [sort, setSort] = useState({ key: 'selfSuff', dir: 'desc' })
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 650)
    return () => clearTimeout(timer)
  }, [])

  const colKeys = ['name', 'pv', 'bess', 'selfSuff', 'gridImport', 'co2', 'lcoe', 'payback']
  const cols = colKeys.map((key, i) => ({ key, label: t.scenarios.cols[i] }))

  let rows = SCENARIOS
    .filter(s => filter === 'All' || s.tag === filter)
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const v = sort.dir === 'asc' ? 1 : -1
      return a[sort.key] > b[sort.key] ? v : -v
    })

  const toggleSort = (key) => setSort(s => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }))
  const sel = selected != null ? SCENARIOS.find(s => s.id === selected) : null

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

  return (
    <div className="page-wrap">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div className="section-label">{t.scenarios.sectionLabel}</div>
          <h1 className="page-title">{t.scenarios.title}</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>{rows.length} {t.scenarios.subtitleSuffix}</p>
        </div>
        <button className="btn btn-primary">
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
        <button className="btn btn-outline"><Filter size={13} /> {t.scenarios.filter}</button>
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
              ) : rows.map((row, i) => (
                <tr
                  key={row.id}
                  onClick={() => setSelected(selected === row.id ? null : row.id)}
                  style={{ background: selected === row.id ? '#eff6ff' : i % 2 === 0 ? '#fff' : '#fafbfc' }}
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
                      <button title="Clone" style={{ padding: 5, border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer', color: '#64748b' }}><Copy size={13} /></button>
                      <button title="Delete" style={{ padding: 5, border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer', color: '#64748b' }}><Trash2 size={13} /></button>
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
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}>
              <ExternalLink size={14} /> {t.scenarios.detail.detailedView}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
