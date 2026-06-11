import { pvModels, bessModels } from '../data/models'
import { buildHourlyLoad } from './loadProfile'

const GHI_ISTANBUL = 1680 // kWh/m²/yr, NASA POWER average
const PANEL_AREA = 2.7    // m² per 72-cell panel (approx 2390x1134mm)
const TARIFF_TL = 3.5     // TL/kWh
const PV_COST_PER_KWP = 9600  // TL (≈ 300 USD × 32)
const BESS_COST_PER_KWH = 6400 // TL (≈ 200 USD × 32)

// Distribute a daily PV total over a clear-sky half-sine (sunrise 06:00 → sunset 19:00).
function pvHourly(dailyPV) {
  const sr = 6, ss = 19
  const shape = Array.from({ length: 24 }, (_, h) =>
    h >= sr && h <= ss ? Math.sin(Math.PI * (h - sr) / (ss - sr)) : 0)
  const s = shape.reduce((a, b) => a + b, 0)
  return shape.map(x => (s > 0 ? (x / s) * dailyPV : 0))
}

// Resolve the usable PV area from the Campus Info inputs.
// "single"      → one total roof-area number (rough sizing)
// "perBuilding" → area per building × number of buildings (precise sizing)
// Extended mode adds parking/open area for carport (canopy) PV.
export function effectivePvArea(data) {
  const buildings = parseFloat(data.buildings) || 0
  const perBuildingArea = parseFloat(data.roofAreaPerBuilding) || 0
  const baseArea = data.sizingMode === 'perBuilding'
    ? perBuildingArea * buildings
    : (parseFloat(data.roofArea) || 5800)
  const parking = data.extendedEnabled ? (parseFloat(data.parkingArea) || 0) : 0
  const total = baseArea + parking
  const perBuildingSource = data.sizingMode === 'perBuilding'
    ? perBuildingArea
    : (buildings > 0 ? baseArea / buildings : 0)
  return {
    baseArea,
    parking,
    total,
    numPanels: Math.floor(total / PANEL_AREA),
    panelsPerBuilding: Math.floor(perBuildingSource / PANEL_AREA),
  }
}

export function computeSimulation(data) {
  const pv = pvModels[data.pvModel] || pvModels['JKM580N-72HL4-BDV']
  const bess = bessModels[data.bessModel] || bessModels['Model A - LFP']

  const { numPanels } = effectivePvArea(data)
  const totalKWp = numPanels * parseFloat(pv.kwp)

  const tilt = data.tilt || 33
  const tiltFactor = 1 + 0.08 * (1 - Math.min(Math.abs(tilt - 33) / 60, 1))
  const azimuthMap = { South: 1.0, East: 0.85, West: 0.85, North: 0.65 }
  const azimuthFactor = azimuthMap[data.azimuth] || 1.0
  const sysEff = (data.pvEff || 82) / 100

  const annualPV = totalKWp * GHI_ISTANBUL * sysEff * tiltFactor * azimuthFactor
  const dailyPV = annualPV / 365
  const specificYield = totalKWp > 0 ? annualPV / totalKWp : 0

  const { load: loadH, peakDemand, annualLoad, dailyLoad } = buildHourlyLoad(data)
  const pvH = pvHourly(dailyPV)

  const bessCap = parseFloat(bess.cap)
  const usable = bessCap * ((bess.dod || 90) / 100)
  const bessEff = (bess.rte || 92) / 100

  // Hour-by-hour dispatch: PV serves load first, surplus charges the battery,
  // remaining deficit discharges the battery, then the grid covers the rest.
  let pvToLoad = 0, pvToBess = 0, bessToLoad = 0, gridToLoad = 0, soc = 0
  const hourlyProfile = []
  for (let h = 0; h < 24; h++) {
    const p = pvH[h], l = loadH[h]
    const direct = Math.min(p, l)
    pvToLoad += direct
    const charge = Math.min(p - direct, usable - soc)
    soc += charge
    pvToBess += charge
    const deficit = l - direct
    const delivered = Math.min(deficit, soc * bessEff)
    soc -= delivered / bessEff
    bessToLoad += delivered
    const gridH = deficit - delivered
    gridToLoad += gridH
    hourlyProfile.push({
      hour: `${String(h).padStart(2, '0')}:00`,
      pv: Math.round(p), load: Math.round(l), grid: Math.round(gridH),
    })
  }
  const selfSufficiency = dailyLoad > 0 ? ((pvToLoad + bessToLoad) / dailyLoad) * 100 : 0

  const capex = totalKWp * PV_COST_PER_KWP + bessCap * BESS_COST_PER_KWH
  const annualSavings = annualPV * 0.70 * TARIFF_TL
  const paybackYears = annualSavings > 0 ? capex / annualSavings : 99
  const lcoe = annualPV > 0 ? (capex * 1.375) / (annualPV * 25) : 0

  return {
    totalKWp: Math.round(totalKWp),
    annualPV: Math.round(annualPV),
    dailyPV: Math.round(dailyPV),
    annualLoad: Math.round(annualLoad),
    dailyLoad: Math.round(dailyLoad),
    peakDemand,
    hourlyProfile,
    selfSufficiency: parseFloat(selfSufficiency.toFixed(1)),
    pvToLoad: Math.round(pvToLoad),
    pvToBess: Math.round(pvToBess),
    bessToLoad: Math.round(bessToLoad),
    gridToLoad: Math.round(gridToLoad),
    specificYield: Math.round(specificYield),
    lcoe: parseFloat(lcoe.toFixed(2)),
    co2AvoidedDaily: Math.round(dailyPV * 0.452),
    paybackYears: parseFloat(paybackYears.toFixed(1)),
    bessCapacity: bessCap,
    bessChargePct: Math.min(100, Math.round((pvToBess / Math.max(usable, 1)) * 100)),
    pvModel: data.pvModel,
    pvEff: pv.eff,
    pvScale: dailyPV / 2720,
    loadScale: dailyLoad / 10411,
    campusName: data.campusName || 'BAU Kemerburgaz',
    runAt: new Date().toISOString(),
  }
}
