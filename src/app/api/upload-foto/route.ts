/**
 * API Route per upload foto su Cloudinary
 * POST /api/upload-foto
 */

import { NextRequest, NextResponse } from 'next/server'
import { uploadFotoLavorazione } from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  try {
    console.log('📤 API Upload foto - Start')
    
    const { foto, lavorazioneId } = await request.json()

    // Validazione input
    if (!foto || !lavorazioneId) {
      return NextResponse.json(
        { success: false, error: 'Foto e lavorazioneId sono obbligatori' },
        { status: 400 }
      )
    }

    if (!Array.isArray(foto)) {
      return NextResponse.json(
        { success: false, error: 'Foto deve essere un array' },
        { status: 400 }
      )
    }

    console.log(`📷 Uploading ${foto.length} foto per lavorazione ${lavorazioneId}`)

    // Upload di tutte le foto in parallelo
    const uploadPromises = foto.map(async (fotoBase64: string, index: number) => {
      try {
        const result = await uploadFotoLavorazione(fotoBase64, lavorazioneId, index)
        return {
          index,
          success: true,
          url: result.url,
          publicId: result.publicId,
        }
      } catch (error) {
        console.error(`❌ Errore upload foto ${index}:`, error)
        return {
          index,
          success: false,
          error: error instanceof Error ? error.message : 'Errore upload',
        }
      }
    })

    const results = await Promise.all(uploadPromises)
    
    // Separa successi e errori
    const successi = results.filter(r => r.success)
    const errori = results.filter(r => !r.success)

    console.log(`✅ Upload completato: ${successi.length} successi, ${errori.length} errori`)

    return NextResponse.json({
      success: true,
      data: {
        foto: successi.map(s => ({
          url: s.url,
          publicId: s.publicId,
        })),
        errori: errori.length > 0 ? errori : undefined,
      },
    })

  } catch (error) {
    console.error('❌ Errore generale upload foto:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Errore interno del server durante upload foto' 
      },
      { status: 500 }
    )
  }
}