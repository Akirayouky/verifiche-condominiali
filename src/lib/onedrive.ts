/**
 * OneDrive Client per gestione foto lavorazioni
 * Usa Microsoft Graph API
 */

import 'isomorphic-fetch'
import { Client } from '@microsoft/microsoft-graph-client'
import { ClientSecretCredential } from '@azure/identity'

// Configurazione Microsoft Graph
const tenantId = process.env.MICROSOFT_TENANT_ID || ''
const clientId = process.env.MICROSOFT_CLIENT_ID || ''
const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || ''

/**
 * Crea client Microsoft Graph autenticato
 */
function getAuthenticatedClient(): Client {
  const credential = new ClientSecretCredential(
    tenantId,
    clientId,
    clientSecret
  )

  return Client.initWithMiddleware({
    authProvider: {
      getAccessToken: async () => {
        const token = await credential.getToken('https://graph.microsoft.com/.default')
        return token.token
      }
    }
  })
}

/**
 * Upload foto su OneDrive
 * Organizza in cartelle: /Apps/CondominieApp/lavorazioni/{lavorazioneId}/
 */
export async function uploadFotoOneDrive(
  fotoBase64: string,
  lavorazioneId: string,
  fotoIndex: number
): Promise<{ url: string; id: string; webUrl: string }> {
  try {
    const client = getAuthenticatedClient()

    // Nome file univoco
    const timestamp = Date.now()
    const fileName = `foto-${fotoIndex}-${timestamp}.jpg`
    
    // Path OneDrive: /Apps/CondominieApp/lavorazioni/{lavorazioneId}/
    const folderPath = `/me/drive/root:/Apps/CondominieApp/lavorazioni/${lavorazioneId}`
    const filePath = `${folderPath}/${fileName}:`

    console.log('📤 Uploading foto to OneDrive:', { lavorazioneId, fotoIndex, fileName })

    // Converti Base64 a Buffer
    const base64Data = fotoBase64.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Crea cartella se non esiste (verifica prima)
    try {
      await client.api(`${folderPath}`).get()
    } catch (error) {
      // Cartella non esiste, creala
      console.log('📁 Creando cartella lavorazione su OneDrive...')
      await client
        .api('/me/drive/root:/Apps/CondominieApp/lavorazioni:/children')
        .post({
          name: lavorazioneId,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'rename'
        })
    }

    // Upload file
    const uploadedFile = await client
      .api(filePath)
      .putStream(buffer)

    console.log('✅ Foto uploaded to OneDrive:', uploadedFile.id)

    // Crea link di condivisione pubblico
    const shareLink = await client
      .api(`/me/drive/items/${uploadedFile.id}/createLink`)
      .post({
        type: 'view', // Link di sola visualizzazione
        scope: 'anonymous' // Accessibile senza autenticazione
      })

    return {
      id: uploadedFile.id,
      url: shareLink.link.webUrl, // URL condivisibile
      webUrl: uploadedFile.webUrl // URL diretto OneDrive
    }

  } catch (error) {
    console.error('❌ Errore upload OneDrive:', error)
    throw new Error('Errore durante upload su OneDrive')
  }
}

/**
 * Elimina foto da OneDrive
 */
export async function deleteFotoOneDrive(fileId: string): Promise<boolean> {
  try {
    const client = getAuthenticatedClient()
    
    await client
      .api(`/me/drive/items/${fileId}`)
      .delete()

    console.log('🗑️ Foto eliminata da OneDrive:', fileId)
    return true

  } catch (error) {
    console.error('❌ Errore eliminazione OneDrive:', error)
    return false
  }
}

/**
 * Elimina tutte le foto di una lavorazione
 */
export async function deleteLavorazioneFotoOneDrive(lavorazioneId: string): Promise<boolean> {
  try {
    const client = getAuthenticatedClient()
    
    // Path della cartella lavorazione
    const folderPath = `/me/drive/root:/Apps/CondominieApp/lavorazioni/${lavorazioneId}`

    await client
      .api(folderPath)
      .delete()

    console.log('🗑️ Cartella lavorazione eliminata da OneDrive:', lavorazioneId)
    return true

  } catch (error) {
    console.error('❌ Errore eliminazione cartella OneDrive:', error)
    return false
  }
}

/**
 * Ottieni thumbnail di una foto
 */
export async function getThumbnailOneDrive(
  fileId: string,
  size: 'small' | 'medium' | 'large' = 'medium'
): Promise<string | null> {
  try {
    const client = getAuthenticatedClient()
    
    const thumbnails = await client
      .api(`/me/drive/items/${fileId}/thumbnails`)
      .get()

    if (thumbnails.value && thumbnails.value.length > 0) {
      return thumbnails.value[0][size]?.url || null
    }

    return null

  } catch (error) {
    console.error('❌ Errore recupero thumbnail OneDrive:', error)
    return null
  }
}

/**
 * Ottieni direct download link per una foto
 */
export async function getDownloadUrlOneDrive(fileId: string): Promise<string | null> {
  try {
    const client = getAuthenticatedClient()
    
    const file = await client
      .api(`/me/drive/items/${fileId}`)
      .select('@microsoft.graph.downloadUrl')
      .get()

    return file['@microsoft.graph.downloadUrl'] || null

  } catch (error) {
    console.error('❌ Errore recupero download URL OneDrive:', error)
    return null
  }
}

/**
 * Verifica configurazione OneDrive
 */
export async function testOneDriveConnection(): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const client = getAuthenticatedClient()
    
    // Test: ottieni info utente
    const user = await client.api('/me').get()
    
    console.log('✅ OneDrive connesso per utente:', user.displayName)
    return { 
      success: true, 
      user: {
        displayName: user.displayName,
        email: user.mail || user.userPrincipalName,
        id: user.id
      }
    }

  } catch (error) {
    console.error('❌ OneDrive non configurato correttamente:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
