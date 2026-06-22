import { bessModels } from '../data/models'
import { PV_PRESETS } from '../data/pvPresets'
import { effectivePvArea } from './sim'
import { synthesizeLoadCsv } from './loadProfile'

const API_BASE = import.meta.env.VITE_API_URL || ''

export const isApiConfigured = () => Boolean(API_BASE)
export const apiUrl = (path) => `${API_BASE}${path}`

const RESOLUTION_MAP = { '15 min': '15min', '30 min': '30min', '1 hour': 'hourly' }

const num = (v, d) => { const n = Number(v); return Number.isFinite(n) ? n : d }

export async function fetchPvModels() {
  if (!API_BASE) return null
  try {
    const res = await fetch(apiUrl('/api/v1/pv-models'))
    if (!res.ok) return null
    const data = await res.json()
    return Array.isArray(data?.models) ? data.models : null
  } catch {
    return null
  }
}

export function buildAnalyzeRequest(data) {
  const preset = PV_PRESETS.find(p => p.model === data.pvModel) || PV_PRESETS[0]
  const bess = bessModels[data.bessModel] || bessModels['Model A - LFP']
  const area = effectivePvArea(data)
  const useBess = data.useBess !== false

  const dod = (bess.dod || 90) / 100
  const socMin = Math.max(0, Math.round((1 - dod) * 100) / 100)
  const degradation = preset.degradation_rate ?? 0.005

  const req = {
    location: { lat: num(data.lat, 41.04), lon: num(data.lon, 29.0), city: data.city || null },
    site: { usable_rooftop_m2: Math.max(1, Math.round(area.total)) },
    pv: {
      panel_model: preset.model,
      panel_width_m: preset.panel_width_m,
      panel_length_m: preset.panel_length_m,
      panel_power_wp: preset.panel_power_wp,
      performance_ratio: num(data.performanceRatio, 0.885),
      degradation_rate: degradation,
    },
    load: {
      source: data.loadMode === 'upload' ? 'uploaded_csv' : 'generated',
      timestamp_col: data.timestampCol || 'timestamp',
      load_col: data.loadCol || 'load_kwh',
      resolution: RESOLUTION_MAP[data.resolution] || 'hourly',
    },
    simulation: {
      duration_days: Math.min(365, Math.max(1, parseInt(data.simDurationDays, 10) || 7)),
      view: 'timeline',
      use_bess: useBess,
    },
    preferences: { priority: data.priority || 'cost_saving' },
    economics: {
      cost_per_kwp: num(data.costPerKwp, 800),
      bess_cost_per_kwh: num(data.bessCostPerKwh, 300),
      inverter_power_kw: num(data.inverterPowerKw, 50),
      inverter_unit_price: num(data.inverterUnitPrice, 2000),
      installation_rate: num(data.installationRate, 0.15),
      opex_rate: num(data.opexRate, 0.01),
      degradation_rate: degradation,
      electricity_tariff: num(data.electricityTariff, 0.12),
      system_lifetime_years: parseInt(data.systemLifetimeYears, 10) || 25,
      discount_rate: num(data.discountRate, 0.08),
    },
  }

  if (useBess) {
    req.bess = {
      capacity_kwh: num(bess.cap, 1500),
      power_kw: num(bess.power, num(bess.cap, 1500) / (bess.duration || 4)),
      soc_min: socMin,
      soc_max: 0.95,
      initial_soc: Math.min(0.5, Math.max(socMin, 0.5)),
      roundtrip_efficiency: (bess.rte || 92) / 100,
    }
  }

  return req
}

export async function runAnalyze(data, file) {
  if (!API_BASE) throw new Error('Backend API is not configured (VITE_API_URL).')

  const fd = new FormData()
  fd.append('request', JSON.stringify(buildAnalyzeRequest(data)))
  const csv = (data.loadMode === 'upload' && file)
    ? file
    : new Blob([synthesizeLoadCsv(data)], { type: 'text/csv' })
  fd.append('load_file', csv, file?.name || 'load.csv')

  const res = await fetch(apiUrl('/api/v1/analyze'), { method: 'POST', body: fd })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`Analyze failed (${res.status}) ${detail.slice(0, 300)}`)
  }
  return res.json()
}

export function buildPvRequest(data) {
  const preset = PV_PRESETS.find(p => p.model === data.pvModel) || PV_PRESETS[0]
  const area = effectivePvArea(data)
  return {
    location: { lat: num(data.lat, 41.04), lon: num(data.lon, 29.0), city: data.city || null },
    site: { usable_rooftop_m2: Math.max(1, Math.round(area.total)) },
    pv: {
      panel_model: preset.model,
      panel_width_m: preset.panel_width_m,
      panel_length_m: preset.panel_length_m,
      panel_power_wp: preset.panel_power_wp,
      performance_ratio: num(data.performanceRatio, 0.885),
      degradation_rate: preset.degradation_rate ?? 0.005,
    },
    start_date: new Date().toISOString().slice(0, 10),
    duration_days: Math.min(365, Math.max(1, parseInt(data.simDurationDays, 10) || 7)),
  }
}

async function postPv(path, data) {
  if (!API_BASE) throw new Error('Backend API is not configured (VITE_API_URL).')
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildPvRequest(data)),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`${path} failed (${res.status}) ${detail.slice(0, 200)}`)
  }
  return res.json()
}

export const fetchPvGeneration = (data) => postPv('/api/v1/pv-generation', data)

export const fetchPvBenchmark = (data) => postPv('/api/v1/pv-generation/benchmark', data)
