/**
 * Utility per geolocalizzazione foto
 */

export interface GeoLocation {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

export interface GeoPhoto {
  url: string
  pathname: string
  geo?: GeoLocation
}

/**
 * Richiede permessi di geolocalizzazione e ottiene posizione corrente
 */
export async function getCurrentPosition(): Promise<GeoLocation | null> {
  try {
    // Verifica supporto Geolocation API
    if (!navigator.geolocation) {
      console.warn('Geolocation API non supportata')
      return null
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const geo: GeoLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          }
          console.log('📍 Posizione GPS catturata:', geo)
          resolve(geo)
        },
        (error) => {
          console.warn('❌ Errore geolocalizzazione:', error.message)
          // Non blocchiamo l'upload se GPS fallisce
          resolve(null)
        },
        {
          enableHighAccuracy: true, // Usa GPS invece di Wi-Fi/IP
          timeout: 10000, // 10 secondi max
          maximumAge: 0 // No cache, posizione fresca
        }
      )
    })
  } catch (error) {
    console.error('Errore durante richiesta GPS:', error)
    return null
  }
}

/**
 * Formatta coordinate per display umano
 */
export function formatCoordinates(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S'
  const lngDir = lng >= 0 ? 'E' : 'W'
  
  return `${Math.abs(lat).toFixed(6)}° ${latDir}, ${Math.abs(lng).toFixed(6)}° ${lngDir}`
}

/**
 * Genera URL Google Maps per coordinate
 */
export function getGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}&z=18`
}

/**
 * Calcola distanza tra due coordinate in metri (formula Haversine)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3 // Raggio della Terra in metri
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Verifica se le coordinate sono valide
 */
export function isValidCoordinates(lat: number, lng: number): boolean {
  return (
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}
