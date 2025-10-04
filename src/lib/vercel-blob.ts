import { put, del, list } from '@vercel/blob'
import { GeoLocation } from './geolocation'

export interface FotoBlob {
  url: string
  pathname: string
  downloadUrl: string
  geo?: GeoLocation
}

/**
 * Upload foto su Vercel Blob Storage con metadata GPS
 * @param base64 - Foto in formato base64
 * @param lavorazioneId - ID della lavorazione
 * @param index - Indice della foto
 * @param geo - Coordinate GPS (opzionale)
 * @returns URL pubblico della foto con metadata
 */
export async function uploadFotoVercelBlob(
  base64: string,
  lavorazioneId: string,
  index: number,
  geo?: GeoLocation
): Promise<FotoBlob> {
  try {
    // Rimuovi prefix "data:image/...;base64," se presente
    const base64Data = base64.includes('base64,') 
      ? base64.split('base64,')[1] 
      : base64

    // Converti base64 in Buffer
    const buffer = Buffer.from(base64Data, 'base64')

    // Determina tipo file dalla stringa base64
    const mimeType = base64.match(/data:([^;]+);/)?.[1] || 'image/jpeg'
    const extension = mimeType.split('/')[1] || 'jpg'

    // Crea pathname per organizzazione
    const timestamp = Date.now()
    const pathname = `lavorazioni/${lavorazioneId}/foto-${index}-${timestamp}.${extension}`

    console.log('📤 Uploading foto to Vercel Blob:', { 
      lavorazioneId, 
      index, 
      size: buffer.length,
      pathname,
      hasGeo: !!geo
    })

    // Upload su Vercel Blob
    const blob = await put(pathname, buffer, {
      access: 'public',
      contentType: mimeType,
      addRandomSuffix: false, // Usa pathname esatto per organizzazione
    })

    console.log('✅ Foto uploaded to Vercel Blob:', blob.url)

    // Restituisci URL con metadata GPS
    return {
      url: blob.url,
      pathname: blob.pathname,
      downloadUrl: blob.downloadUrl,
      geo: geo || undefined,
    }

  } catch (error) {
    console.error('❌ Errore upload foto su Vercel Blob:', error)
    throw new Error('Errore durante upload foto su Vercel Blob')
  }
}

/**
 * Elimina una foto da Vercel Blob
 * @param url - URL della foto da eliminare
 */
export async function deleteFotoVercelBlob(url: string): Promise<void> {
  try {
    console.log('🗑️ Deleting foto from Vercel Blob:', url)
    await del(url)
    console.log('✅ Foto deleted from Vercel Blob')
  } catch (error) {
    console.error('❌ Errore eliminazione foto da Vercel Blob:', error)
    throw new Error('Errore durante eliminazione foto')
  }
}

/**
 * Elimina tutte le foto di una lavorazione
 * @param lavorazioneId - ID della lavorazione
 */
export async function deleteLavorazioneFotoVercelBlob(
  lavorazioneId: string
): Promise<void> {
  try {
    console.log('🗑️ Deleting all foto for lavorazione:', lavorazioneId)

    // Lista tutte le foto della lavorazione
    const { blobs } = await list({
      prefix: `lavorazioni/${lavorazioneId}/`,
    })

    // Elimina tutte le foto
    await Promise.all(
      blobs.map(blob => del(blob.url))
    )

    console.log(`✅ Deleted ${blobs.length} foto for lavorazione ${lavorazioneId}`)
  } catch (error) {
    console.error('❌ Errore eliminazione foto lavorazione:', error)
    throw new Error('Errore durante eliminazione foto lavorazione')
  }
}

/**
 * Ottieni tutte le foto di una lavorazione
 * @param lavorazioneId - ID della lavorazione
 */
export async function getLavorazioneFotoVercelBlob(
  lavorazioneId: string
): Promise<FotoBlob[]> {
  try {
    const { blobs } = await list({
      prefix: `lavorazioni/${lavorazioneId}/`,
    })

    return blobs.map(blob => ({
      url: blob.url,
      pathname: blob.pathname,
      downloadUrl: blob.downloadUrl,
    }))
  } catch (error) {
    console.error('❌ Errore recupero foto lavorazione:', error)
    return []
  }
}

/**
 * Test connessione Vercel Blob
 */
export async function testVercelBlobConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    // Verifica che le variabili d'ambiente siano configurate
    // Vercel Blob funziona automaticamente su Vercel, nessuna config necessaria
    
    // Test: lista blob (anche vuoto va bene)
    const { blobs } = await list({ limit: 1 })
    
    console.log('✅ Vercel Blob connesso, blobs trovati:', blobs.length)
    return { success: true }

  } catch (error) {
    console.error('❌ Vercel Blob non configurato correttamente:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
