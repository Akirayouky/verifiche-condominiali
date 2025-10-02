import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/supabase'

// GET - Ottieni tutte le verifiche
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const condominioId = searchParams.get('condominioId')
    const tipologiaId = searchParams.get('tipologiaId')
    const stato = searchParams.get('stato')

    // Per ora prendiamo tutte le verifiche, poi filtriamo lato client se necessario
    const { data, error } = await dbQuery.verifiche.getAll()
    
    if (error) {
      console.error('Errore Supabase GET verifiche:', error)
      return NextResponse.json(
        { success: false, error: 'Errore nel recupero delle verifiche' },
        { status: 500 }
      )
    }

    // Filtri opzionali (da implementare lato database se necessario)
    let filteredVerifiche = data || []

    if (condominioId) {
      filteredVerifiche = filteredVerifiche.filter(v => v.condominio_id === condominioId)
    }

    if (tipologiaId) {
      filteredVerifiche = filteredVerifiche.filter(v => v.tipologia_id === tipologiaId)
    }

    if (stato) {
      filteredVerifiche = filteredVerifiche.filter(v => v.stato === stato)
    }

    return NextResponse.json({
      success: true,
      data: filteredVerifiche,
      total: filteredVerifiche.length
    })
  } catch (error) {
    console.error('Errore GET verifiche:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nel recupero delle verifiche' },
      { status: 500 }
    )
  }
}

// POST - Crea nuova verifica
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { condominio_id, tipologia_id, dati_verifica, note } = body

    if (!condominio_id || !tipologia_id) {
      return NextResponse.json(
        { success: false, error: 'Condominio e tipologia sono obbligatori' },
        { status: 400 }
      )
    }

    const verificaData = {
      condominio_id,
      tipologia_id,
      stato: 'bozza',
      dati_verifica: dati_verifica || {},
      note: note || '',
      email_inviata: false
    }

    const { data, error } = await dbQuery.verifiche.create(verificaData)
    
    if (error) {
      console.error('Errore Supabase create verifica:', error)
      return NextResponse.json(
        { success: false, error: 'Errore nella creazione della verifica' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Verifica creata con successo'
    }, { status: 201 })

  } catch (error) {
    console.error('Errore POST verifiche:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nella creazione della verifica' },
      { status: 500 }
    )
  }
}