import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

/**
 * API per upload firma digitale su Vercel Blob
 * Accetta file PNG da canvas signature
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const lavorazioneId = formData.get('lavorazioneId') as string

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Nessun file ricevuto' },
        { status: 400 }
      )
    }

    if (!lavorazioneId) {
      return NextResponse.json(
        { success: false, error: 'lavorazioneId mancante' },
        { status: 400 }
      )
    }

    // Upload a Vercel Blob
    const filename = `firme/${lavorazioneId}/${file.name}`
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: true
    })

    console.log('✍️ Firma caricata:', {
      url: blob.url,
      size: file.size,
      lavorazione: lavorazioneId
    })

    return NextResponse.json({
      success: true,
      data: {
        url: blob.url,
        size: file.size
      }
    })
  } catch (error) {
    console.error('Errore upload firma:', error)
    return NextResponse.json(
      { success: false, error: 'Errore durante upload firma' },
      { status: 500 }
    )
  }
}
