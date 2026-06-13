export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

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

export function annualConsumption(data) {
  const c = parseFloat(data.consumption) || 0
  const m = windowMonths(data)
  return m > 0 ? c * (12 / m) : c
}

const validGrid = (g) =>
  Array.isArray(g) && g.length === 7 && g.every(r => Array.isArray(r) && r.length === 24)
    ? g : defaultPeakGrid()

export function buildHourlyLoad(data) {
  const annual = data.loadMode === 'upload'
    ? (parseFloat(data.annualLoad) || 3800000)
    : (annualConsumption(data) || 3800000)
  const grid = validGrid(data.peakGrid)

  const base = 0.40
  const dayBump = h => 0.30 * Math.exp(-((h - 13) ** 2) / 32)
  const PEAK = 1.0

  const w = grid.map(row => row.map((on, h) => base + dayBump(h) + (on ? PEAK : 0)))
  const weekTotal = w.reduce((s, row) => s + row.reduce((a, b) => a + b, 0), 0)
  const k = weekTotal > 0 ? (annual / 52) / weekTotal : 0

  let peak = 0
  w.forEach(row => row.forEach(x => { if (x * k > peak) peak = x * k }))

  const dailyLoad = annual / 365
  const avg = Array.from({ length: 24 }, (_, h) => w.reduce((s, row) => s + row[h], 0) / 7)
  const avgSum = avg.reduce((a, b) => a + b, 0)
  const load = avg.map(x => avgSum > 0 ? (x / avgSum) * dailyLoad : 0)

  return { load, peakDemand: Math.round(peak), annualLoad: annual, dailyLoad }
}
