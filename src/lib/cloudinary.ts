/**
 * Configurazione Cloudinary per gestione foto delle lavorazioni
 */

import { v2 as cloudinary } from 'cloudinary'

// Configurazione server-side
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Upload foto su Cloudinary con organizzazione per lavorazioni
 */
export const uploadFotoLavorazione = async (
  fotoBase64: string,
  lavorazioneId: string,
  fotoIndex: number
): Promise<{ url: string; publicId: string }> => {
  try {
    // Genera public_id univoco: lavorazione-{id}/foto-{index}-{timestamp}
    const timestamp = Date.now()
    const publicId = `lavorazioni/${lavorazioneId}/foto-${fotoIndex}-${timestamp}`
    
    console.log('📤 Uploading foto to Cloudinary:', { lavorazioneId, fotoIndex, publicId })
    
    // Upload su Cloudinary
    const result = await cloudinary.uploader.upload(fotoBase64, {
      public_id: publicId,
      folder: 'condomini-app/lavorazioni',
      resource_type: 'image',
      transformation: [
        // Ottimizzazione automatica
        { quality: 'auto', fetch_format: 'auto' },
        // Resize se troppo grande
        { width: 1920, height: 1920, crop: 'limit' },
      ],
      // Genera anche thumbnail
      eager: [
        { width: 300, height: 300, crop: 'fill', quality: 'auto' },
        { width: 150, height: 150, crop: 'thumb', gravity: 'face' }
      ],
    })

    console.log('✅ Foto uploaded successfully:', result.secure_url)

    return {
      url: result.secure_url,
      publicId: result.public_id,
    }
  } catch (error) {
    console.error('❌ Errore upload Cloudinary:', error)
    throw new Error('Errore durante l\'upload della foto')
  }
}

/**
 * Elimina foto da Cloudinary
 */
export const deleteFotoCloudinary = async (publicId: string): Promise<boolean> => {
  try {
    console.log('🗑️ Deleting foto from Cloudinary:', publicId)
    
    const result = await cloudinary.uploader.destroy(publicId)
    
    console.log('✅ Foto deleted:', result)
    return result.result === 'ok'
  } catch (error) {
    console.error('❌ Errore eliminazione Cloudinary:', error)
    return false
  }
}

/**
 * Genera URL ottimizzato per diverse dimensioni
 */
export const getOptimizedImageUrl = (
  publicId: string, 
  options: {
    width?: number
    height?: number
    quality?: string | number
    crop?: string
  } = {}
) => {
  const { width = 800, height, quality = 'auto', crop = 'limit' } = options
  
  return cloudinary.url(publicId, {
    width,
    height,
    quality,
    crop,
    fetch_format: 'auto',
  })
}

/**
 * Ottieni URL thumbnail
 */
export const getThumbnailUrl = (publicId: string, size: number = 150) => {
  return cloudinary.url(publicId, {
    width: size,
    height: size,
    crop: 'thumb',
    gravity: 'face',
    quality: 'auto',
    fetch_format: 'auto',
  })
}

/**
 * Lista tutte le foto di una lavorazione
 */
export const getFotoLavorazione = async (lavorazioneId: string) => {
  try {
    const result = await cloudinary.search
      .expression(`folder:condomini-app/lavorazioni/${lavorazioneId}`)
      .sort_by('created_at', 'desc')
      .execute()
    
    return result.resources.map((resource: any) => ({
      url: resource.secure_url,
      publicId: resource.public_id,
      createdAt: resource.created_at,
    }))
  } catch (error) {
    console.error('❌ Errore recupero foto lavorazione:', error)
    return []
  }
}

export default cloudinary