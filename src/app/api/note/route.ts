import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/supabase'

// GET - Ottieni note personali dell'utente
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const utente_id = searchParams.get('utente_id')

    if (!utente_id) {
      return NextResponse.json({
        success: false,
        error: 'ID utente richiesto'
      }, { status: 400 })
    }

    console.log('🔍 GET /api/note - Recupero note per utente:', utente_id)

    const { data: note, error } = await dbQuery.note_personali.getAllByUser(utente_id)

    if (error) {
      console.error('Errore Supabase GET note:', error)
      return NextResponse.json({
        success: false,
        error: 'Errore nel recupero delle note'
      }, { status: 500 })
    }

    console.log('✅ Note recuperate:', note?.length || 0)

    return NextResponse.json({
      success: true,
      data: note || [],
      total: note?.length || 0
    })
  } catch (error) {
    console.error('❌ Errore recupero note:', error)
    return NextResponse.json({
      success: false,
      error: 'Errore interno del server'
    }, { status: 500 })
  }
}

// POST - Crea nuova nota personale
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { utente_id, titolo, contenuto } = body

    console.log('📝 POST /api/note - Creazione nota:', { utente_id, titolo })

    if (!utente_id || !titolo || !contenuto) {
      return NextResponse.json({
        success: false,
        error: 'Utente ID, titolo e contenuto sono richiesti'
      }, { status: 400 })
    }

    const { data: nuovaNota, error } = await dbQuery.note_personali.create({
      utente_id,
      titolo,
      contenuto,
      data_creazione: new Date().toISOString(),
      data_modifica: new Date().toISOString()
    })

    if (error) {
      console.error('Errore Supabase CREATE nota:', error)
      return NextResponse.json({
        success: false,
        error: 'Errore nella creazione della nota'
      }, { status: 500 })
    }

    console.log('✅ Nota creata con ID:', nuovaNota?.id)

    return NextResponse.json({
      success: true,
      data: nuovaNota
    })
  } catch (error) {
    console.error('❌ Errore creazione nota:', error)
    return NextResponse.json({
      success: false,
      error: 'Errore interno del server'
    }, { status: 500 })
  }
}