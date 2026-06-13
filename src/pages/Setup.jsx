import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronRight, ChevronLeft, MapPin, Zap, Sun, Upload, Car, Building2, LayoutGrid, Wand2, Database } from 'lucide-react'
import Card from '../components/ui/Card'
import { pvModels, bessModels } from '../data/models'
import { computeSimulation, effectivePvArea } from '../utils/sim'
import { buildHourlyLoad, defaultPeakGrid, DAYS } from '../utils/loadProfile'
import { geocodeCity, reverseGeocode } from '../utils/geocode'

const steps = [
  { id: 1, label: 'Campus Info', icon: MapPin, desc: 'Basic campus and location details' },
  { id: 2, label: 'Load Profile', icon: Zap, desc: 'Electricity consumption data' },
  { id: 3, label: 'PV & BESS Config', icon: Sun, desc: 'Solar panel and battery design' },
]

function Field({ label, help, children, style }) {
  return (
    <div style={{ marginBottom: 20, ...style }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}</label>
      {children}
      {help && <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 5 }}>{help}</p>}
    </div>
  )
}

function Input({ ...props }) {
  return (
    <input {...props} style={{
      width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 7,
      fontSize: 13, color: props.disabled ? '#64748b' : '#0f172a', background: props.disabled ? '#f8fafc' : '#fff', outline: 'none',
      transition: 'border-color 0.2s', ...props.style
    }}
      onFocus={e => !props.disabled && (e.target.style.borderColor = '#2563eb')}
      onBlur={e => !props.disabled && (e.target.style.borderColor = '#e2e8f0')}
    />
  )
}

function Select({ children, ...props }) {
  return (
    <select {...props} style={{
      width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 7,
      fontSize: 13, color: '#0f172a', background: '#fff', outline: 'none', cursor: 'pointer'
    }}>{children}</select>
  )
}

function TagSelect({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map(opt => (
        <button key={opt} onClick={() => onChange(opt)} type="button" style={{
          padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
          border: value === opt ? '2px solid #2563eb' : '1px solid #e2e8f0',
          background: value === opt ? '#eff6ff' : '#fff', color: value === opt ? '#2563eb' : '#64748b',
          transition: 'all 0.15s'
        }}>{opt}</button>
      ))}
    </div>
  )
}

function Segmented({ options, value, onChange }) {
  return (
    <div style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: 8, padding: 3, gap: 3 }}>
      {options.map(o => {
        const on = value === o.value
        return (
          <button key={o.value} type="button" onClick={() => onChange(o.value)} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 600, background: on ? '#fff' : 'transparent', color: on ? '#2563eb' : '#64748b',
            boxShadow: on ? '0 1px 2px rgba(0,0,0,0.10)' : 'none', transition: 'all 0.15s'
          }}>{o.icon}{o.label}</button>
        )
      })}
    </div>
  )
}

function MapPicker({ lat, lon, onPick }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    const L = window.L
    if (!L || !containerRef.current || mapRef.current) return
    const startLat = parseFloat(lat) || 41.124
    const startLon = parseFloat(lon) || 28.985
    const map = L.map(containerRef.current).setView([startLat, startLon], 14)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© OpenStreetMap'
    }).addTo(map)
    const marker = L.marker([startLat, startLon], { draggable: true }).addTo(map)
    const emit = (ll) => onPick(ll.lat.toFixed(3), ll.lng.toFixed(3))
    marker.on('dragend', () => emit(marker.getLatLng()))
    map.on('click', (e) => { marker.setLatLng(e.latlng); emit(e.latlng) })
    mapRef.current = map
    markerRef.current = marker
    const t = setTimeout(() => { if (mapRef.current === map) map.invalidateSize() }, 120)
    return () => { clearTimeout(t); map.remove(); mapRef.current = null; markerRef.current = null }
  }, [])

  useEffect(() => {
    const map = mapRef.current, marker = markerRef.current
    if (!map || !marker) return
    const la = parseFloat(lat), lo = parseFloat(lon)
    if (Number.isNaN(la) || Number.isNaN(lo)) return
    const cur = marker.getLatLng()
    if (Math.abs(cur.lat - la) > 1e-6 || Math.abs(cur.lng - lo) > 1e-6) {
      marker.setLatLng([la, lo])
      map.panTo([la, lo])
    }
  }, [lat, lon])

  const ready = typeof window !== 'undefined' && window.L
  return (
    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      <div ref={containerRef} style={{ height: 230, width: '100%', background: '#eef2f6' }} />
      {ready ? (
        <div style={{
          position: 'absolute', bottom: 10, left: 10, zIndex: 1000, background: 'rgba(255,255,255,0.95)',
          borderRadius: 6, padding: '6px 10px', fontSize: 11, color: '#475569', boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
          pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 6
        }}>
          <MapPin size={13} color="#2563eb" /> Click the map or drag the pin to set coordinates
        </div>
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#94a3b8' }}>
          Map unavailable offline — enter coordinates manually below
        </div>
      )}
    </div>
  )
}

function PeakGrid({ value, onChange }) {
  const paint = useRef(null)
  useEffect(() => {
    const stop = () => { paint.current = null }
    window.addEventListener('pointerup', stop)
    return () => window.removeEventListener('pointerup', stop)
  }, [])
  const apply = (d, h, v) => onChange(value.map((row, ri) => ri === d ? row.map((c, ci) => ci === h ? v : c) : row))
  const cols = '32px repeat(24, 1fr)'
  return (
    <div style={{ userSelect: 'none', touchAction: 'none' }}>
      <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 2, marginBottom: 3 }}>
        <div />
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} style={{ fontSize: 8, color: '#94a3b8', textAlign: 'center' }}>{h % 3 === 0 ? h : ''}</div>
        ))}
      </div>
      {value.map((row, d) => (
        <div key={d} style={{ display: 'grid', gridTemplateColumns: cols, gap: 2, marginBottom: 2 }}>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 500, display: 'flex', alignItems: 'center' }}>{DAYS[d]}</div>
          {row.map((on, h) => (
            <div key={h}
              onPointerDown={e => { e.preventDefault(); paint.current = !on; apply(d, h, !on) }}
              onPointerEnter={() => { if (paint.current !== null) apply(d, h, paint.current) }}
              style={{
                height: 17, borderRadius: 3, cursor: 'pointer', transition: 'background 0.1s',
                background: on ? '#2563eb' : '#eef2f7', border: `1px solid ${on ? '#2563eb' : '#e2e8f0'}`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function ProfilePreview({ data }) {
  const { load } = buildHourlyLoad(data)
  const max = Math.max(...load, 1)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 64 }}>
        {load.map((v, h) => (
          <div key={h} title={`${String(h).padStart(2, '0')}:00 · ${Math.round(v).toLocaleString()} kWh`} style={{
            flex: 1, height: `${(v / max) * 100}%`, minHeight: 2, borderRadius: '2px 2px 0 0',
            background: 'linear-gradient(to top, #2563eb, #7cb0ff)',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#94a3b8', marginTop: 4 }}>
        <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:00</span>
      </div>
    </div>
  )
}

function Step1({ data, setData }) {
  const upd = (k, v) => setData(d => ({ ...d, [k]: v }))
  const area = effectivePvArea(data)
  const mode = data.sizingMode || 'single'
  const fmt = (n) => Math.round(n).toLocaleString()

  const [geo, setGeo] = useState('')
  const firstRun = useRef(true)
  const skipGeocode = useRef(false)

  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return }
    if (skipGeocode.current) { skipGeocode.current = false; return }
    const name = (data.city || '').trim()
    if (!name) { setGeo(''); return }
    setGeo('searching')
    const id = setTimeout(async () => {
      const hit = await geocodeCity(name)
      if (hit) {
        setGeo('')
        setData(d => ({ ...d, lat: hit.lat.toFixed(3), lon: hit.lon.toFixed(3) }))
      } else {
        setGeo('notfound')
      }
    }, 700)
    return () => clearTimeout(id)
  }, [data.city])

  const handlePick = async (lat, lon) => {
    setData(d => ({ ...d, lat, lon }))
    const city = await reverseGeocode(lat, lon)
    if (city) {
      skipGeocode.current = true
      setGeo('')
      setData(d => ({ ...d, city }))
    }
  }

  const cityHelp = geo === 'searching' ? 'Searching…'
    : geo === 'notfound' ? 'City not found — try another name'
    : 'Type a city to move the map · click the map to fill this in'

  return (
    <div style={{ display: 'grid', gap: 22 }}>
      <MapPicker lat={data.lat} lon={data.lon} onPick={handlePick} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
        <Field label="Campus Name" help="Enter the official campus name"><Input value={data.campusName} onChange={e => upd('campusName', e.target.value)} /></Field>
        <Field label="City / Region" help={cityHelp}><Input value={data.city} onChange={e => upd('city', e.target.value)} /></Field>
        <Field label="Latitude (°N)" help="Set by the map, or type manually"><Input type="number" value={data.lat} onChange={e => upd('lat', e.target.value)} step="0.001" /></Field>
        <Field label="Longitude (°E)" help="Set by the map, or type manually"><Input type="number" value={data.lon} onChange={e => upd('lon', e.target.value)} step="0.001" /></Field>
        <Field label="Number of Buildings" style={{ gridColumn: '1/-1' }} help="Used for per-building (precise) sizing"><Input type="number" value={data.buildings} onChange={e => upd('buildings', e.target.value)} /></Field>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Available PV Area</div>
          <Segmented
            value={mode}
            onChange={v => upd('sizingMode', v)}
            options={[
              { value: 'single', label: 'One Space · rough', icon: <LayoutGrid size={13} /> },
              { value: 'perBuilding', label: 'Per Building · precise', icon: <Building2 size={13} /> },
            ]}
          />
        </div>

        {mode === 'single' ? (
          <Field label="Total Available Roof Area (m²)" help="The free rooftop surface across the whole campus — quick, approximate sizing">
            <Input type="number" value={data.roofArea} onChange={e => upd('roofArea', e.target.value)} />
          </Field>
        ) : (
          <Field label="Available Area per Building (m²)" help={`Free rooftop area on a typical building — multiplied by ${parseInt(data.buildings) || 0} buildings for precise sizing`}>
            <Input type="number" value={data.roofAreaPerBuilding} onChange={e => upd('roofAreaPerBuilding', e.target.value)} />
          </Field>
        )}
      </div>

      <div>
        <button type="button" onClick={() => upd('extendedEnabled', !data.extendedEnabled)} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
          border: data.extendedEnabled ? '1px solid #2563eb' : '1px solid #e2e8f0',
          background: data.extendedEnabled ? '#eff6ff' : '#fff', transition: 'all 0.15s'
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: data.extendedEnabled ? '#2563eb' : '#fff', border: data.extendedEnabled ? 'none' : '1.5px solid #cbd5e1'
          }}>
            {data.extendedEnabled && <Check size={13} color="#fff" />}
          </div>
          <Car size={17} color={data.extendedEnabled ? '#2563eb' : '#94a3b8'} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: data.extendedEnabled ? '#1d4ed8' : '#334155' }}>Parking Canopy PV</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Optional · add carport solar over open parking for more generation</div>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: data.extendedEnabled ? '#2563eb' : '#94a3b8', border: `1px solid ${data.extendedEnabled ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: 5, padding: '3px 7px' }}>EXTENDED</span>
        </button>
        {data.extendedEnabled && (
          <div style={{ marginTop: 12 }}>
            <Field label="Parking / Open Area (m²)" help="Open lots get PV canopies (carports) — extra area that adds to total generation">
              <Input type="number" value={data.parkingArea} onChange={e => upd('parkingArea', e.target.value)} />
            </Field>
          </div>
        )}
      </div>

      <Card style={{ padding: 16, background: '#f0f9ff', borderColor: '#bae6fd' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <MapPin size={18} color="#0891b2" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0c4a6e', marginBottom: 4 }}>Location &amp; Sizing Summary</div>
            <div style={{ fontSize: 12, color: '#0369a1', lineHeight: 1.6 }}>
              {data.campusName || 'Campus'} · {data.lat}°N, {data.lon}°E · GHI 1,680 kWh/m²/yr · Optimum tilt 33°<br />
              Usable PV area: <b>{fmt(area.total)} m²</b>
              {area.parking > 0 && <> ({fmt(area.baseArea)} roof + {fmt(area.parking)} carport)</>}
              {' '}· ≈ <b>{area.numPanels.toLocaleString()} panels</b>
              {mode === 'perBuilding' && <> · ~{area.panelsPerBuilding} per building</>}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

const StepContent = ({ step, data, setData }) => {
  const upd = (k, v) => setData(d => ({ ...d, [k]: v }))

  if (step === 1) return <Step1 data={data} setData={setData} />

  if (step === 2) {
    const mode = data.loadMode || 'generate'
    const grid = data.peakGrid || defaultPeakGrid()
    const gen = buildHourlyLoad(data)
    return (
      <div style={{ display: 'grid', gap: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>How do you want to provide load data?</div>
          <Segmented value={mode} onChange={v => upd('loadMode', v)} options={[
            { value: 'generate', label: 'Generate', icon: <Wand2 size={13} /> },
            { value: 'upload', label: 'Upload Dataset', icon: <Database size={13} /> },
          ]} />
        </div>

        {mode === 'generate' ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
              <Field label="Consumption (kWh)" help="Total electricity used over the selected period">
                <Input type="number" value={data.consumption} onChange={e => upd('consumption', e.target.value)} />
              </Field>
              <Field label="Time Window" help="The period the consumption above covers — used to annualise">
                <TagSelect options={['1m', '3m', '6m', '12m', 'custom']} value={data.loadWindow} onChange={v => upd('loadWindow', v)} />
              </Field>
            </div>
            {data.loadWindow === 'custom' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                <Field label="Start Date"><Input type="date" value={data.windowStart} onChange={e => upd('windowStart', e.target.value)} /></Field>
                <Field label="End Date"><Input type="date" value={data.windowEnd} onChange={e => upd('windowEnd', e.target.value)} /></Field>
              </div>
            )}

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Peak Consumption Pattern</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" onClick={() => upd('peakGrid', defaultPeakGrid())} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Business hours</button>
                  <button type="button" onClick={() => upd('peakGrid', DAYS.map(() => Array(24).fill(false)))} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Clear</button>
                </div>
              </div>
              <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 10px' }}>Paint the days &amp; hours when the campus consumes most — click or drag across the grid.</p>
              <PeakGrid value={grid} onChange={v => upd('peakGrid', v)} />
            </div>

            <Card style={{ padding: 16, background: '#f0f9ff', borderColor: '#bae6fd' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0c4a6e', marginBottom: 10 }}>Generated Daily Load Profile</div>
              <ProfilePreview data={data} />
              <div style={{ fontSize: 12, color: '#0369a1', marginTop: 10, lineHeight: 1.6 }}>
                Annualised demand: <b>{Math.round(gen.annualLoad).toLocaleString()} kWh/yr</b> · Estimated peak: <b>{gen.peakDemand.toLocaleString()} kW</b><br />
                Modelled with a normal-distribution daily curve and fed straight into the simulation.
              </div>
            </Card>
          </>
        ) : (
          <>
            <Field label="Upload Dataset" help="Time-series load data exported from your meter or utility portal">
              <div style={{ border: '2px dashed #e2e8f0', borderRadius: 8, padding: '24px', textAlign: 'center', cursor: 'pointer', background: '#f8fafc' }}>
                <Upload size={20} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Drag file or click to upload</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>CSV, XLSX · Max 10MB</div>
              </div>
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
              <Field label="Annual Consumption (kWh)" help="Total over 12 months, read from the dataset"><Input type="number" value={data.annualLoad} onChange={e => upd('annualLoad', e.target.value)} /></Field>
              <Field label="Sampling Resolution" help="Time step between rows in the dataset">
                <TagSelect options={['15 min', '30 min', '1 hour', '1 day']} value={data.dataDuration} onChange={v => upd('dataDuration', v)} />
              </Field>
              <Field label="Start Date"><Input type="date" value={data.startDate} onChange={e => upd('startDate', e.target.value)} /></Field>
              <Field label="End Date"><Input type="date" value={data.endDate} onChange={e => upd('endDate', e.target.value)} /></Field>
            </div>
            <button type="button" onClick={() => upd('cumulative', !data.cumulative)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
              border: data.cumulative ? '1px solid #2563eb' : '1px solid #e2e8f0', background: data.cumulative ? '#eff6ff' : '#fff', transition: 'all 0.15s',
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: 5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: data.cumulative ? '#2563eb' : '#fff', border: data.cumulative ? 'none' : '1.5px solid #cbd5e1',
              }}>
                {data.cumulative && <Check size={13} color="#fff" />}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: data.cumulative ? '#1d4ed8' : '#334155' }}>Cumulative meter readings</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>On = running total per row · Off = consumption within each interval</div>
              </div>
            </button>
          </>
        )}
      </div>
    )
  }

  if (step === 3) {
    const selectedPV = pvModels[data.pvModel] || pvModels['JKM580N-72HL4-BDV']
    const selectedBESS = bessModels[data.bessModel] || bessModels['Model A - LFP']

    return (
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>Solar Panel (PV) Configuration</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', marginBottom: 24 }}>
          <Field label="PV Model" style={{ gridColumn: '1/-1' }} help={`Panel Model Name: ${data.pvModel}`}>
            <Select value={data.pvModel} onChange={e => upd('pvModel', e.target.value)}>
              {Object.keys(pvModels).map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
          </Field>

          <Field label="PV Capacity (kWp)"><Input disabled value={selectedPV.kwp} /></Field>
          <Field label="Panel Technology"><Input disabled value={selectedPV.tech} /></Field>
          <Field label="Module Efficiency" style={{ gridColumn: '1/-1' }}><Input disabled value={selectedPV.eff} /></Field>
          <div style={{ gridColumn: '1/-1' }}>
            <Field label="Solar Data Source">
              <TagSelect options={['NASA POWER API', 'PVGIS', 'PV*SOL', 'On-site Measurement']} value={data.solarData} onChange={v => upd('solarData', v)} />
            </Field>
          </div>
        </div>

        <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>Battery (BESS) Configuration</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
          <Field label="BESS Model" style={{ gridColumn: '1/-1' }} help={`Battery System Type: ${data.bessModel}`}>
            <Select value={data.bessModel} onChange={e => upd('bessModel', e.target.value)}>
              {Object.keys(bessModels).map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
          </Field>

          <Field label="BESS Capacity (kWh)"><Input disabled value={selectedBESS.cap} /></Field>
          <Field label="Battery Technology"><Input disabled value={selectedBESS.tech} /></Field>
          <Field label="Power Converter (kW)"><Input disabled value={selectedBESS.power} /></Field>
          <Field label="Depth of Discharge (DoD %)"><Input disabled value={`${selectedBESS.dod}%`} /></Field>
          <Field label="Storage Duration (hours)"><Input disabled value={`${selectedBESS.duration} h`} /></Field>
          <Field label="Round-trip Efficiency (%)"><Input disabled value={`${selectedBESS.rte}%`} /></Field>
        </div>
      </div>
    )
  }

  return null
}

const DRAFT_KEY = 'setup_draft'

export default function Setup() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      return saved ? JSON.parse(saved) : {
        campusName: 'BAU Kemerburgaz', city: 'Istanbul', lat: '41.124', lon: '28.985',
        buildings: '12',
        sizingMode: 'single', roofArea: '5800', roofAreaPerBuilding: '480', extendedEnabled: false, parkingArea: '3000',
        loadMode: 'generate', consumption: '3800000', loadWindow: '12m', windowStart: '', windowEnd: '', peakGrid: defaultPeakGrid(),
        annualLoad: '3800000', dataDuration: '1 hour', cumulative: false, startDate: '', endDate: '',
        pvModel: 'JKM580N-72HL4-BDV', tilt: 33, azimuth: 'South', pvEff: 82, solarData: 'NASA POWER API',
        bessModel: 'Model A - LFP',
      }
    } catch { return {} }
  })
  const [draftSaved, setDraftSaved] = useState(false)
  const navigate = useNavigate()

  function handleSaveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
    setDraftSaved(true)
    setTimeout(() => setDraftSaved(false), 2000)
  }

  function handleRunSimulation() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
    const result = computeSimulation(data)
    localStorage.setItem('simulation_result', JSON.stringify(result))
    navigate('/dashboard')
  }

  const cur = steps[step - 1]
  const Icon = cur.icon

  return (
    <div className="page-wrap">
      <div style={{ marginBottom: 24 }}>
        <div className="section-label">Project Setup</div>
        <h1 className="page-title">Configure New Simulation</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '16px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          {steps.map((s) => {
            const done = s.id < step, active = s.id === step
            return (
              <button key={s.id} onClick={() => setStep(s.id)} type="button" style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 10px', borderRadius: 8, marginBottom: 4, border: 'none', cursor: 'pointer',
                background: active ? '#eff6ff' : 'transparent', transition: 'background 0.15s', textAlign: 'left'
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? '#10b981' : active ? '#2563eb' : '#f1f5f9',
                  color: done || active ? '#fff' : '#94a3b8', fontSize: 11, fontWeight: 700
                }}>
                  {done ? <Check size={13} /> : s.id}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? '#1d4ed8' : done ? '#0f172a' : '#94a3b8' }}>{s.label}</div>
                </div>
              </button>
            )
          })}
        </div>

        <div>
          <Card style={{ padding: '28px 28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, paddingBottom: 20, borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} color="#2563eb" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Step {step}: {cur.label}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{cur.desc}</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>{step} / {steps.length}</div>
            </div>
            <div style={{ paddingTop: 20 }}>
              <StepContent step={step} data={data} setData={setData} />
            </div>
          </Card>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
            <button type="button" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="btn btn-outline" style={{ color: step === 1 ? '#cbd5e1' : '#475569', cursor: step === 1 ? 'default' : 'pointer' }}>
              <ChevronLeft size={15} /> Back
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-outline" onClick={handleSaveDraft} style={{ color: draftSaved ? '#10b981' : undefined, borderColor: draftSaved ? '#10b981' : undefined }}>
                {draftSaved ? <><Check size={14} /> Saved!</> : 'Save Draft'}
              </button>
              {step < steps.length ? (
                <button type="button" onClick={() => setStep(s => Math.min(steps.length, s + 1))} className="btn btn-primary">
                  Next <ChevronRight size={15} />
                </button>
              ) : (
                <button type="button" className="btn btn-success" onClick={handleRunSimulation}>
                  <Zap size={15} /> Run Simulation
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
