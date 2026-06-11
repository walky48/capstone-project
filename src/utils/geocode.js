// Forward / reverse geocoding via OpenStreetMap's free Nominatim service
// (no API key). Used to keep the City/Region field and the map in sync.
const NOMINATIM = 'https://nominatim.openstreetmap.org'

// City name → coordinates (for moving the map when the user types a city).
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

// Coordinates → city/region name (for filling the field when the map is clicked).
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
