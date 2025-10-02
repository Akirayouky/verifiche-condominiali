import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/supabase'

// GET - Ottieni tutte le tipologie
export async function GET() {
  try {
    const { data, error } = await dbQuery.tipologie.getAll()
    
    if (error) {
      console.error('Errore Supabase:', error)
      return NextResponse.json(
        { success: false, error: 'Errore nel recupero delle tipologie' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: data?.length || 0
    })
  } catch (error) {
    console.error('Errore GET tipologie:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nel recupero delle tipologie' },
      { status: 500 }
    )
  }
}

// POST - Crea nuova tipologia
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, descrizione, campi_personalizzati } = body

    if (!nome || nome.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Il nome della tipologia è obbligatorio' },
        { status: 400 }
      )
    }

    const tipologiaData = {
      nome: nome.trim(),
      descrizione: descrizione || '',
      campi_personalizzati: campi_personalizzati || [],
      attiva: true
    }

    const { data, error } = await dbQuery.tipologie.create(tipologiaData)
    
    if (error) {
      console.error('Errore Supabase create:', error)
      return NextResponse.json(
        { success: false, error: 'Errore nella creazione della tipologia' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Tipologia creata con successo'
    }, { status: 201 })

  } catch (error) {
    console.error('Errore POST tipologie:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nella creazione della tipologia' },
      { status: 500 }
    )
  }
}