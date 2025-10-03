import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/supabase'

// GET - Ottieni nota specifica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    console.log('🔍 GET /api/note/[id] - ID:', id)

    const { data: nota, error } = await dbQuery.note_personali.getById(id)

    if (error) {
      console.error('Errore Supabase GET nota:', error)
      return NextResponse.json({
        success: false,
        error: 'Errore nel recupero della nota'
      }, { status: 500 })
    }

    if (!nota) {
      return NextResponse.json({
        success: false,
        error: 'Nota non trovata'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: nota
    })
  } catch (error) {
    console.error('❌ Errore GET nota:', error)
    return NextResponse.json({
      success: false,
      error: 'Errore interno del server'
    }, { status: 500 })
  }
}

// PUT - Aggiorna nota
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const body = await request.json()
    const { titolo, contenuto, utente_id } = body

    console.log('✏️ PUT /api/note/[id] - Aggiornamento nota:', id)

    if (!titolo || !contenuto) {
      return NextResponse.json({
        success: false,
        error: 'Titolo e contenuto sono richiesti'
      }, { status: 400 })
    }

    // Verifica proprietà nota (solo l'utente può modificare le sue note)
    const { data: notaEsistente } = await dbQuery.note_personali.getById(id)
    if (!notaEsistente || notaEsistente.utente_id !== utente_id) {
      return NextResponse.json({
        success: false,
        error: 'Non autorizzato a modificare questa nota'
      }, { status: 403 })
    }

    const { data: notaAggiornata, error } = await dbQuery.note_personali.update(id, {
      titolo,
      contenuto,
      data_modifica: new Date().toISOString()
    })

    if (error) {
      console.error('Errore Supabase UPDATE nota:', error)
      return NextResponse.json({
        success: false,
        error: 'Errore nell\'aggiornamento della nota'
      }, { status: 500 })
    }

    console.log('✅ Nota aggiornata:', id)

    return NextResponse.json({
      success: true,
      data: notaAggiornata
    })
  } catch (error) {
    console.error('❌ Errore aggiornamento nota:', error)
    return NextResponse.json({
      success: false,
      error: 'Errore interno del server'
    }, { status: 500 })
  }
}

// DELETE - Elimina nota
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const { searchParams } = new URL(request.url)
    const utente_id = searchParams.get('utente_id')

    console.log('🗑️ DELETE /api/note/[id] - Eliminazione nota:', id)

    if (!utente_id) {
      return NextResponse.json({
        success: false,
        error: 'ID utente richiesto'
      }, { status: 400 })
    }

    // Verifica proprietà nota (solo l'utente può eliminare le sue note)
    const { data: notaEsistente } = await dbQuery.note_personali.getById(id)
    if (!notaEsistente || notaEsistente.utente_id !== utente_id) {
      return NextResponse.json({
        success: false,
        error: 'Non autorizzato a eliminare questa nota'
      }, { status: 403 })
    }

    const { error } = await dbQuery.note_personali.delete(id)

    if (error) {
      console.error('Errore Supabase DELETE nota:', error)
      return NextResponse.json({
        success: false,
        error: 'Errore nell\'eliminazione della nota'
      }, { status: 500 })
    }

    console.log('✅ Nota eliminata:', id)

    return NextResponse.json({
      success: true,
      message: 'Nota eliminata con successo'
    })
  } catch (error) {
    console.error('❌ Errore eliminazione nota:', error)
    return NextResponse.json({
      success: false,
      error: 'Errore interno del server'
    }, { status: 500 })
  }
}