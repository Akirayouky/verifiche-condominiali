import { NextResponse } from 'next/server'
import { uploadFotoVercelBlob } from '@/lib/vercel-blob'

/**
 * API per upload foto su Vercel Blob Storage
 * POST /api/upload-foto-vercel
 * Body: { foto: string[], lavorazioneId: string }
 */
export async function POST(request: Request) {
  try {
    const { foto, lavorazioneId } = await request.json()

    if (!foto || !Array.isArray(foto) || foto.length === 0) {
      return NextResponse.json(
        { error: 'Nessuna foto fornita' },
        { status: 400 }
      )
    }

    if (!lavorazioneId) {
      return NextResponse.json(
        { error: 'lavorazioneId mancante' },
        { status: 400 }
      )
    }

    console.log(`📤 Uploading ${foto.length} foto to Vercel Blob...`, { lavorazioneId })

    // Upload foto in parallelo
    const uploadPromises = foto.map((fotoBase64, index) =>
      uploadFotoVercelBlob(fotoBase64, lavorazioneId, index)
        .catch(error => ({ error: error.message, index }))
    )

    const results = await Promise.all(uploadPromises)

    // Separa successi ed errori
    const successi = results.filter(r => !('error' in r))
    const errori = results.filter(r => 'error' in r)

    console.log(`✅ Upload completato: ${successi.length}/${foto.length} foto`)

    if (errori.length > 0) {
      console.error('⚠️ Alcuni upload falliti:', errori)
    }

    return NextResponse.json({
      success: true,
      foto: successi,
      errori: errori.length > 0 ? errori : undefined,
    })

  } catch (error) {
    console.error('❌ Errore upload foto Vercel Blob:', error)
    return NextResponse.json(
      { 
        error: 'Errore durante upload foto',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
