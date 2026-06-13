const NOMINATIM = 'https://nominatim.openstreetmap.org'

export async function geocodeCity(query) {
  try {
    const res = await fetch(`${NOMINATIM}/search?format=json&limit=1&accept-language=en&q=${encodeURIComponent(query)}`)
    const data = await res.json()
    if (!data?.length) return null
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

export async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(`${NOMINATIM}/reverse?format=json&zoom=10&accept-language=en&lat=${lat}&lon=${lon}`)
    const data = await res.json()
    const a = data?.address || {}
    return a.city || a.town || a.village || a.county || a.province || a.state || null
  } catch {
    return null
  }
}
