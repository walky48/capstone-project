import { PV_PRESETS } from '../data/pvPresets'
import { bessModels } from '../data/models'

const sum = (arr, f) => arr.reduce((a, x) => a + (f(x) || 0), 0)

// AnalyzeResponse (backend) -> the flat shape the dashboard and reports already read
export function adaptAnalyzeResponse(resp, data) {
  const { summary = {}, economics = {}, metadata = {}, timeline = [] } = resp || {}
  const days = Math.max(1, metadata.duration_days || 1)

  const totalKWp = metadata.pv_capacity_kwp || 0
  const dailyPV = (summary.total_pv_generation_kwh || 0) / days
  const dailyLoad = (summary.total_load_kwh || 0) / days
  const annualPV = dailyPV * 365
  const annualLoad = dailyLoad * 365

  // energy-flow split derived from the per-step timeline (kWh over the window)
  const charge = sum(timeline, r => r.battery_charge_kwh)
  const discharge = sum(timeline, r => r.battery_discharge_kwh)
  const excess = sum(timeline, r => r.excess_pv_kwh)
  const pvTotal = sum(timeline, r => r.pv_generation_kwh)
  const gridTotal = sum(timeline, r => r.grid_import_kwh)
  const pvToLoad = Math.max(0, pvTotal - charge - excess) / days

  // average 24h day aggregated from the timeline
  const buckets = Array.from({ length: 24 }, () => ({ pv: 0, load: 0, grid: 0, n: 0 }))
  for (const r of timeline) {
    const b = buckets[new Date(r.timestamp).getHours()]
    b.pv += r.pv_generation_kwh || 0
    b.load += r.load_kwh || 0
    b.grid += r.grid_import_kwh || 0
    b.n += 1
  }
  const hourlyProfile = buckets.map((b, h) => ({
    hour: `${String(h).padStart(2, '0')}:00`,
    pv: Math.round(b.n ? b.pv / b.n : 0),
    load: Math.round(b.n ? b.load / b.n : 0),
    grid: Math.round(b.n ? b.grid / b.n : 0),
  }))

  // daily totals over the window, then per-weekday averages
  const byDate = new Map()
  for (const r of timeline) {
    const d = new Date(r.timestamp)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    const o = byDate.get(key) || { date: d, pv: 0, load: 0, grid: 0, forecast: 0 }
    o.pv += r.pv_generation_kwh || 0
    o.load += r.load_kwh || 0
    o.grid += r.grid_import_kwh || 0
    o.forecast += r.forecast_kwh || 0
    byDate.set(key, o)
  }
  const dailyAgg = [...byDate.values()].sort((a, b) => a.date - b.date)
  const daily = dailyAgg.map(o => ({
    day: `${o.date.getMonth() + 1}/${o.date.getDate()}`,
    pv: Math.round(o.pv), load: Math.round(o.load), grid: Math.round(o.grid),
  }))
  const forecastDaily = dailyAgg.map(o => ({
    date: `${o.date.getDate()}/${o.date.getMonth() + 1}`,
    actual: Math.round(o.load), forecast: Math.round(o.forecast),
  }))
  // weekly totals, grouped by calendar week (Monday start)
  const byWeek = new Map()
  for (const o of dailyAgg) {
    const m = new Date(o.date)
    m.setDate(m.getDate() - ((m.getDay() + 6) % 7))
    m.setHours(0, 0, 0, 0)
    const key = m.getTime()
    const w = byWeek.get(key) || { date: m, pv: 0, load: 0, grid: 0 }
    w.pv += o.pv; w.load += o.load; w.grid += o.grid
    byWeek.set(key, w)
  }
  const weekly = [...byWeek.values()].sort((a, b) => a.date - b.date).map(w => ({
    day: `${w.date.getMonth() + 1}/${w.date.getDate()}`,
    pv: Math.round(w.pv), load: Math.round(w.load), grid: Math.round(w.grid),
  }))

  // monthly totals, grouped by calendar month
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const byMonth = new Map()
  for (const o of dailyAgg) {
    const key = `${o.date.getFullYear()}-${o.date.getMonth()}`
    const mm = byMonth.get(key) || { y: o.date.getFullYear(), m: o.date.getMonth(), pv: 0, load: 0, grid: 0 }
    mm.pv += o.pv; mm.load += o.load; mm.grid += o.grid
    byMonth.set(key, mm)
  }
  const monthly = [...byMonth.values()].sort((a, b) => a.y - b.y || a.m - b.m).map(mm => ({
    day: MON[mm.m],
    pv: Math.round(mm.pv), load: Math.round(mm.load), grid: Math.round(mm.grid),
  }))

  const preset = PV_PRESETS.find(p => p.model === data.pvModel)
  const moduleEff = preset
    ? (preset.panel_power_wp / (preset.panel_width_m * preset.panel_length_m * 1000) * 100).toFixed(2) + '%'
    : ''
  const bess = bessModels[data.bessModel] || bessModels['Model A - LFP']
  const useBess = data.useBess !== false
  const last = timeline[timeline.length - 1] || {}
  const lastSoc = last.battery_soc_percent || 0
  const bessState = !useBess ? 'Idle'
    : (last.battery_charge_kwh || 0) > (last.battery_discharge_kwh || 0) ? 'Charging'
      : (last.battery_discharge_kwh || 0) > 0 ? 'Discharging' : 'Idle'

  return {
    source: 'backend',
    totalKWp: Math.round(totalKWp),
    annualPV: Math.round(annualPV),
    dailyPV: Math.round(dailyPV),
    annualLoad: Math.round(annualLoad),
    dailyLoad: Math.round(dailyLoad),
    peakDemand: Math.round(summary.peak_grid_import_kw || 0),
    hourlyProfile,
    selfSufficiency: parseFloat(((summary.self_sufficiency_ratio || 0) * 100).toFixed(1)),
    pvToLoad: Math.round(pvToLoad),
    pvToBess: Math.round(charge / days),
    bessToLoad: Math.round(discharge / days),
    gridToLoad: Math.round(gridTotal / days),
    specificYield: totalKWp > 0 ? Math.round(annualPV / totalKWp) : 0,
    lcoe: economics.lcoe != null ? parseFloat(Number(economics.lcoe).toFixed(2)) : 0,
    co2AvoidedDaily: Math.round((summary.co2_saving_kg || 0) / days),
    paybackYears: economics.simple_payback_years != null ? parseFloat(Number(economics.simple_payback_years).toFixed(1)) : 99,
    bessCapacity: useBess ? parseFloat(bess.cap) : 0,
    bessChargePct: Math.round(lastSoc),
    bessPower: useBess ? (Number(bess.power) || 0) : 0,
    bessState,
    pvModel: data.pvModel,
    pvEff: moduleEff,
    hourly: hourlyProfile,
    daily,
    weekly,
    monthly,
    forecastDaily,
    campusName: data.campusName || 'BAU Kemerburgaz',
    runAt: new Date().toISOString(),
    // extra backend metrics surfaced in the UI
    selfConsumption: summary.self_consumption_ratio != null ? +(summary.self_consumption_ratio * 100).toFixed(1) : null,
    renewableFraction: summary.renewable_energy_fraction != null ? +(summary.renewable_energy_fraction * 100).toFixed(1) : null,
    pvToBessRatio: summary.pv_to_bess_ratio ?? null,
    treesEquivalent: economics.trees_equivalent != null ? Math.round(economics.trees_equivalent) : null,
    numInverters: economics.num_inverters ?? null,
    inverterCapex: economics.inverter_capex ?? null,
    opexAnnual: economics.opex_annual ?? null,
    npv: economics.npv ?? null,
    totalCapex: economics.total_capex ?? null,
    dailyRef: resp?.daily_ref || [],
    // rich backend payload kept for the reports page and the suggestions UI
    summary,
    economics,
    suggestions: resp?.suggestions || [],
    feedback: resp?.feedback || [],
    metadata,
  }
}
