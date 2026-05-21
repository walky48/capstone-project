import { pvModels, bessModels } from '../data/models'

const GHI_ISTANBUL = 1680 // kWh/m²/yr, NASA POWER average
const PANEL_AREA = 2.7    // m² per 72-cell panel (approx 2390x1134mm)
const TARIFF_TL = 3.5     // TL/kWh
const PV_COST_PER_KWP = 9600  // TL (≈ 300 USD × 32)
const BESS_COST_PER_KWH = 6400 // TL (≈ 200 USD × 32)

export function computeSimulation(data) {
  const pv = pvModels[data.pvModel] || pvModels['JKM580N-72HL4-BDV']
  const bess = bessModels[data.bessModel] || bessModels['Model A - LFP']

  const numPanels = Math.floor(parseFloat(data.roofArea || 5800) / PANEL_AREA)
  const totalKWp = numPanels * parseFloat(pv.kwp)

  const tilt = data.tilt || 33
  const tiltFactor = 1 + 0.08 * (1 - Math.min(Math.abs(tilt - 33) / 60, 1))
  const azimuthMap = { South: 1.0, East: 0.85, West: 0.85, North: 0.65 }
  const azimuthFactor = azimuthMap[data.azimuth] || 1.0
  const sysEff = (data.pvEff || 82) / 100

  const annualPV = totalKWp * GHI_ISTANBUL * sysEff * tiltFactor * azimuthFactor
  const dailyPV = annualPV / 365
  const specificYield = totalKWp > 0 ? annualPV / totalKWp : 0

  const annualLoad = parseFloat(data.annualLoad || 3800000)
  const dailyLoad = annualLoad / 365

  const bessCap = parseFloat(bess.cap)
  const usable = bessCap * ((data.dod || 90) / 100)
  const bessEff = (data.bessEff || 92) / 100

  const pvToLoad = Math.min(dailyPV * 0.70, dailyLoad)
  const pvToBess = Math.min(dailyPV * 0.30, usable)
  const bessToLoad = Math.min(pvToBess * bessEff, Math.max(0, dailyLoad - pvToLoad))
  const gridToLoad = Math.max(0, dailyLoad - pvToLoad - bessToLoad)
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
