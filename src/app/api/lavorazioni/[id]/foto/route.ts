import { NextRequest, NextResponse } from 'next/server'
import { list } from '@vercel/blob'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/lavorazioni/[id]/foto
 * Lista tutte le foto di una lavorazione dal Blob Storage
 * 
 * Path struttura: lavorazione/{idCartella}/foto/*
 * Restituisce array di foto con url, nome, dimensione
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lavorazioneId = params.id

    console.log('📸 Listing foto for lavorazione:', lavorazioneId)

    // 1. Ottieni lavorazione per recuperare id_cartella
    const { data: lavorazione, error: lavorazioneError } = await supabase
      .from('lavorazioni')
      .select('id, condominio_id, created_at')
      .eq('id', lavorazioneId)
      .single()

    if (lavorazioneError || !lavorazione) {
      console.error('❌ Lavorazione non trovata:', lavorazioneError)
      return NextResponse.json(
        { error: 'Lavorazione non trovata' },
        { status: 404 }
      )
    }

    // 2. Costruisci prefix blob storage
    // Se hai un campo id_cartella specifico, usalo qui
    // Altrimenti usa l'id della lavorazione come identificatore cartella
    const idCartella = lavorazione.id // O lavorazione.id_cartella se esiste
    const prefix = `lavorazione/${idCartella}/foto/`

    console.log('🔍 Searching blobs with prefix:', prefix)

    // 3. Lista blob con prefix specifico
    const { blobs } = await list({
      prefix: prefix,
    })

    console.log(`✅ Found ${blobs.length} foto in blob storage`)

    // 4. Mappa blob in formato frontend-friendly
    const foto = blobs.map(blob => ({
      url: blob.url,
      downloadUrl: blob.downloadUrl,
      pathname: blob.pathname,
      nome: blob.pathname.split('/').pop() || 'foto.jpg', // Estrai nome file dal pathname
      size: blob.size,
      uploadedAt: blob.uploadedAt,
    }))

    return NextResponse.json({
      success: true,
      lavorazioneId,
      idCartella,
      count: foto.length,
      foto,
    })

  } catch (error) {
    console.error('❌ Errore listing foto blob storage:', error)
    return NextResponse.json(
      { 
        error: 'Errore durante recupero foto',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
