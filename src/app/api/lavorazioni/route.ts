import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { Lavorazione } from '@/lib/types'
import { dbQuery } from '@/lib/supabase'

// GET - Ottieni tutte le lavorazioni
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const stato = searchParams.get('stato')
    const verificaId = searchParams.get('verifica_id')
    const utenteAssegnato = searchParams.get('utente_assegnato')

    let query = dbQuery.lavorazioni.getAll()

    // Applica filtri se presenti
    if (stato && stato !== 'tutte') {
      query = query.eq('stato', stato)
    }
    if (verificaId) {
      query = query.eq('verifica_id', verificaId)
    }
    if (utenteAssegnato) {
      query = query.eq('utente_assegnato', utenteAssegnato)
    }

    const { data, error } = await query

    if (error) {
      console.error('Errore Supabase GET lavorazioni:', error)
      return NextResponse.json(
        { success: false, error: 'Errore nel recupero delle lavorazioni' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: data?.length || 0
    })
  } catch (error) {
    console.error('Errore GET lavorazioni:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nel recupero delle lavorazioni' },
      { status: 500 }
    )
  }
}

// POST - Crea nuova lavorazione
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { verifica_id, descrizione, note, utente_assegnato } = body

    if (!verifica_id || !descrizione) {
      return NextResponse.json(
        { success: false, error: 'Verifica ID e descrizione sono obbligatori' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    const nuovaLavorazione = {
      id: uuidv4(),
      verifica_id,
      stato: 'da_eseguire',
      descrizione: descrizione.trim(),
      note: note ? [note] : [],
      data_apertura: now,
      utente_assegnato
    }

    const { data, error } = await dbQuery.lavorazioni.create(nuovaLavorazione)

    if (error) {
      console.error('Errore Supabase POST lavorazione:', error)
      return NextResponse.json(
        { success: false, error: 'Errore nella creazione della lavorazione' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Lavorazione creata con successo'
    }, { status: 201 })

  } catch (error) {
    console.error('Errore POST lavorazione:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nella creazione della lavorazione' },
      { status: 500 }
    )
  }
}