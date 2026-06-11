// Synthetic load-profile generation for the "Generate" mode of Step 2.
// The user paints a 7-day × 24-hour grid marking peak-consumption cells
// (LettuceMeet-style). We turn that grid into an hourly load shape and scale
// it to the consumption entered for the selected time window, so WHEN the
// campus peaks (vs. when the sun shines) genuinely drives the simulation.

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Weekday business hours (09:00–17:00) marked as peak by default.
export function defaultPeakGrid() {
  return DAYS.map((_, d) => Array.from({ length: 24 }, (_, h) => d < 5 && h >= 9 && h <= 17))
}

function windowMonths(data) {
  if (data.loadWindow === 'custom') {
    const a = Date.parse(data.windowStart), b = Date.parse(data.windowEnd)
    if (!Number.isNaN(a) && !Number.isNaN(b) && b > a) return (b - a) / 86400000 / 30.44
    return 12
  }
  return { '1m': 1, '3m': 3, '6m': 6, '12m': 12 }[data.loadWindow] || 12
}

// Annualise the consumption the user entered for the selected window.
export function annualConsumption(data) {
  const c = parseFloat(data.consumption) || 0
  const m = windowMonths(data)
  return m > 0 ? c * (12 / m) : c
}

const validGrid = (g) =>
  Array.isArray(g) && g.length === 7 && g.every(r => Array.isArray(r) && r.length === 24)
    ? g : defaultPeakGrid()

// Build a representative average-day hourly load (24 values, kWh) plus the
// weekly peak demand (kW), scaled so the year sums to the annual consumption.
export function buildHourlyLoad(data) {
  const annual = data.loadMode === 'upload'
    ? (parseFloat(data.annualLoad) || 3800000)
    : (annualConsumption(data) || 3800000)
  const grid = validGrid(data.peakGrid)

  const base = 0.40                                       // always-on overnight base load
  const dayBump = h => 0.30 * Math.exp(-((h - 13) ** 2) / 32)   // gentle midday operational rise
  const PEAK = 1.0                                        // boost on painted peak cells

  const w = grid.map(row => row.map((on, h) => base + dayBump(h) + (on ? PEAK : 0)))
  const weekTotal = w.reduce((s, row) => s + row.reduce((a, b) => a + b, 0), 0)
  const k = weekTotal > 0 ? (annual / 52) / weekTotal : 0

  // Peak demand = busiest single hour of the week (kWh in 1h ≈ kW).
  let peak = 0
  w.forEach(row => row.forEach(x => { if (x * k > peak) peak = x * k }))

  // Average-day shape, normalised so one day sums to annual / 365.
  const dailyLoad = annual / 365
  const avg = Array.from({ length: 24 }, (_, h) => w.reduce((s, row) => s + row[h], 0) / 7)
  const avgSum = avg.reduce((a, b) => a + b, 0)
  const load = avg.map(x => avgSum > 0 ? (x / avgSum) * dailyLoad : 0)

  return { load, peakDemand: Math.round(peak), annualLoad: annual, dailyLoad }
}
