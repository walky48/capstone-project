import { useState } from 'react'
import { Check, ChevronRight, ChevronLeft, MapPin, Zap, Sun, Battery, Globe, ClipboardCheck, Upload } from 'lucide-react'
import Card from '../components/ui/Card'

const steps = [
  { id: 1, label: 'Campus Info', icon: MapPin, desc: 'Basic campus and location details' },
  { id: 2, label: 'Load Profile', icon: Zap, desc: 'Electricity consumption data' },
  { id: 3, label: 'PV Configuration', icon: Sun, desc: 'Solar panel system design' },
  { id: 4, label: 'BESS Configuration', icon: Battery, desc: 'Battery storage system' },
  { id: 5, label: 'Grid Connection', icon: Globe, desc: 'Grid parameters' },
  { id: 6, label: 'Review', icon: ClipboardCheck, desc: 'Summary and run' },
]

function Field({ label, help, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
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
      fontSize: 13, color: '#0f172a', background: '#fff', outline: 'none',
      transition: 'border-color 0.2s', ...props.style
    }}
      onFocus={e => e.target.style.borderColor = '#2563eb'}
      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
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
        <button key={opt} onClick={() => onChange(opt)} style={{
          padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
          border: value === opt ? '2px solid #2563eb' : '1px solid #e2e8f0',
          background: value === opt ? '#eff6ff' : '#fff', color: value === opt ? '#2563eb' : '#64748b',
          transition: 'all 0.15s'
        }}>{opt}</button>
      ))}
    </div>
  )
}

function Slider({ min, max, value, onChange, unit }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>{min}{unit}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#2563eb' }}>{value}{unit}</span>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>{max}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))} style={{ width: '100%', accentColor: '#2563eb', cursor: 'pointer' }} />
    </div>
  )
}

const StepContent = ({ step, data, setData }) => {
  const upd = (k, v) => setData(d => ({ ...d, [k]: v }))
  if (step === 1) return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
      <Field label="Campus Name" help="Enter the official campus name"><Input value={data.campusName} onChange={e => upd('campusName', e.target.value)} /></Field>
      <Field label="City / Region"><Input value={data.city} onChange={e => upd('city', e.target.value)} /></Field>
      <Field label="Latitude (°N)" help="GPS coordinate"><Input type="number" value={data.lat} onChange={e => upd('lat', e.target.value)} step="0.001" /></Field>
      <Field label="Longitude (°E)"><Input type="number" value={data.lon} onChange={e => upd('lon', e.target.value)} step="0.001" /></Field>
      <Field label="Campus Area (m²)" help="Total campus surface area"><Input type="number" value={data.area} onChange={e => upd('area', e.target.value)} /></Field>
      <Field label="Number of Buildings"><Input type="number" value={data.buildings} onChange={e => upd('buildings', e.target.value)} /></Field>
      <Field label="Campus Type" style={{ gridColumn: '1/-1' }}>
        <TagSelect options={['University', 'High School', 'Research Center', 'Mixed']} value={data.campusType} onChange={v => upd('campusType', v)} />
      </Field>
      <div style={{ gridColumn: '1/-1' }}>
        <Card style={{ padding: 16, background: '#f0f9ff', borderColor: '#bae6fd' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <MapPin size={18} color="#0891b2" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0c4a6e', marginBottom: 2 }}>Location Confirmed</div>
              <div style={{ fontSize: 12, color: '#0369a1' }}>BAU Kemerburgaz · GHI: 1,680 kWh/m²/yr · Optimum tilt: 33°</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
  if (step === 2) return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
        <Field label="Annual Consumption (kWh)" help="Total electricity consumption over last 12 months"><Input type="number" value={data.annualLoad} onChange={e => upd('annualLoad', e.target.value)} /></Field>
        <Field label="Peak Demand (kW)" help="Recorded maximum power demand"><Input type="number" value={data.peakDemand} onChange={e => upd('peakDemand', e.target.value)} /></Field>
        <Field label="Data Source">
          <Select value={data.loadSource} onChange={e => upd('loadSource', e.target.value)}>
            <option>Utility Bills</option>
            <option>Smart Meter Data</option>
            <option>Representative Profile</option>
          </Select>
        </Field>
        <Field label="Load Profile Type">
          <TagSelect options={['Education', 'Mixed', 'Custom']} value={data.loadProfile} onChange={v => upd('loadProfile', v)} />
        </Field>
      </div>
      <Field label="Upload CSV" help="15-minute or hourly load profile data">
        <div style={{ border: '2px dashed #e2e8f0', borderRadius: 8, padding: '24px', textAlign: 'center', cursor: 'pointer', background: '#f8fafc' }}>
          <Upload size={20} color="#94a3b8" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Drag file or click to upload</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>CSV, XLSX · Max 10MB</div>
        </div>
      </Field>
    </div>
  )
  if (step === 3) return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
      <Field label="PV Capacity (kWp)" help="Installed PV power"><Input type="number" value={data.pvCapacity} onChange={e => upd('pvCapacity', e.target.value)} /></Field>
      <Field label="Available Roof Area (m²)"><Input type="number" value={data.roofArea} onChange={e => upd('roofArea', e.target.value)} /></Field>
      <Field label="Tilt Angle (°)" help="Recommended: 0°–60°">
        <Slider min={0} max={60} value={data.tilt} onChange={v => upd('tilt', v)} unit="°" />
      </Field>
      <Field label="Azimuth Direction">
        <TagSelect options={['North', 'East', 'South', 'West']} value={data.azimuth} onChange={v => upd('azimuth', v)} />
      </Field>
      <Field label="Panel Technology">
        <Select value={data.pvTech} onChange={e => upd('pvTech', e.target.value)}>
          <option>Monocrystalline (monoSi)</option>
          <option>Polycrystalline (polySi)</option>
          <option>Thin Film (CdTe)</option>
          <option>Bifacial</option>
        </Select>
      </Field>
      <Field label="System Efficiency (%)">
        <Slider min={70} max={98} value={data.pvEff} onChange={v => upd('pvEff', v)} unit="%" />
      </Field>
      <div style={{ gridColumn: '1/-1' }}>
        <Field label="Solar Data Source">
          <TagSelect options={['NASA POWER API', 'PVGIS', 'PV*SOL', 'On-site Measurement']} value={data.solarData} onChange={v => upd('solarData', v)} />
        </Field>
      </div>
    </div>
  )
  if (step === 4) return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
      <Field label="BESS Capacity (kWh)" help="Total storage capacity"><Input type="number" value={data.bessCapacity} onChange={e => upd('bessCapacity', e.target.value)} /></Field>
      <Field label="Power Converter (kW)"><Input type="number" value={data.bessPC} onChange={e => upd('bessPC', e.target.value)} /></Field>
      <Field label="Battery Technology">
        <Select value={data.bessTech} onChange={e => upd('bessTech', e.target.value)}>
          <option>Lithium-Ion (Li-Ion)</option>
          <option>LFP (Lithium Iron Phosphate)</option>
          <option>Lead-Acid</option>
          <option>Redox Flow</option>
        </Select>
      </Field>
      <Field label="Depth of Discharge (DoD %)">
        <Slider min={50} max={100} value={data.dod} onChange={v => upd('dod', v)} unit="%" />
      </Field>
      <Field label="Storage Duration (hours)">
        <TagSelect options={['2h', '4h', '6h', '8h', '12h']} value={data.bessHours} onChange={v => upd('bessHours', v)} />
      </Field>
      <Field label="Round-trip Efficiency (%)">
        <Slider min={80} max={98} value={data.bessEff} onChange={v => upd('bessEff', v)} unit="%" />
      </Field>
    </div>
  )
  if (step === 5) return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
      <Field label="Grid Connection Type">
        <TagSelect options={['Island Mode', 'Grid-Connected', 'Hybrid']} value={data.gridMode} onChange={v => upd('gridMode', v)} />
      </Field>
      <Field label="Grid Voltage (V)"><Input type="number" value={data.gridV} onChange={e => upd('gridV', e.target.value)} /></Field>
      <Field label="Electricity Rate (₺/kWh)"><Input type="number" value={data.elecPrice} onChange={e => upd('elecPrice', e.target.value)} step="0.01" /></Field>
      <Field label="Feed-in Tariff (₺/kWh)"><Input type="number" value={data.feedInPrice} onChange={e => upd('feedInPrice', e.target.value)} step="0.01" /></Field>
      <div style={{ gridColumn: '1/-1' }}>
        <Field label="BESS Strategy (Grid-connected)">
          <Select value={data.bessStrategy} onChange={e => upd('bessStrategy', e.target.value)}>
            <option>Peak Shaving</option>
            <option>Maximize Self-Consumption</option>
            <option>Cost Optimization</option>
            <option>Backup Power Priority</option>
          </Select>
        </Field>
      </div>
    </div>
  )
  if (step === 6) {
    const items = [
      ['Campus', `${data.campusName} · ${data.city}`],
      ['PV Capacity', `${data.pvCapacity} kWp · ${data.azimuth} · ${data.tilt}° tilt`],
      ['BESS', `${data.bessCapacity} kWh · ${data.bessTech}`],
      ['Annual Consumption', `${Number(data.annualLoad).toLocaleString('en-US')} kWh`],
      ['Grid Mode', data.gridMode],
      ['Unit Price', `₺${data.elecPrice}/kWh`],
    ]
    return (
      <div>
        <Card style={{ padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Configuration Summary</div>
          {items.map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>{k}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>{v}</span>
            </div>
          ))}
        </Card>
        <Card style={{ padding: 16, background: '#f0fdf4', borderColor: '#86efac' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <Check size={18} color="#16a34a" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#15803d', marginBottom: 2 }}>Ready</div>
              <div style={{ fontSize: 12, color: '#166534' }}>All required fields completed. Click "Run Simulation" to start.</div>
            </div>
          </div>
        </Card>
      </div>
    )
  }
  return null
}

export default function Setup() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState({
    campusName: 'BAU Kemerburgaz', city: 'Istanbul', lat: '41.124', lon: '28.985',
    area: '45000', buildings: '12', campusType: 'University',
    annualLoad: '3800000', peakDemand: '650', loadSource: 'Utility Bills', loadProfile: 'Education',
    pvCapacity: '720', roofArea: '5800', tilt: 33, azimuth: 'South', pvTech: 'Monocrystalline (monoSi)', pvEff: 82, solarData: 'NASA POWER API',
    bessCapacity: '1500', bessPC: '500', bessTech: 'LFP (Lithium Iron Phosphate)', dod: 90, bessHours: '4h', bessEff: 92,
    gridMode: 'Hybrid', gridV: '380', elecPrice: '2.85', feedInPrice: '1.20', bessStrategy: 'Peak Shaving',
  })

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
            const SIcon = s.icon
            return (
              <button key={s.id} onClick={() => setStep(s.id)} style={{
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
            <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1} className="btn btn-outline" style={{ color: step === 1 ? '#cbd5e1' : '#475569', cursor: step === 1 ? 'default' : 'pointer' }}>
              <ChevronLeft size={15} /> Back
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline">Save Draft</button>
              {step < 6 ? (
                <button onClick={() => setStep(s => Math.min(6, s + 1))} className="btn btn-primary">
                  Next <ChevronRight size={15} />
                </button>
              ) : (
                <button className="btn btn-success">
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
