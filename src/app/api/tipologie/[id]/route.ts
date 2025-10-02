import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/supabase'

// GET - Ottieni tipologia per ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { data, error } = await dbQuery.tipologie.getById(id)

    if (error) {
      console.error('Errore Supabase GET by ID:', error)
      return NextResponse.json(
        { success: false, error: 'Errore nel recupero della tipologia' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Tipologia non trovata' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('Errore GET tipologia by ID:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nel recupero della tipologia' },
      { status: 500 }
    )
  }
}

// PUT - Aggiorna tipologia
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { nome, descrizione, campi_personalizzati, campi_richiesti, attiva } = body

    if (!nome || nome.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Il nome della tipologia è obbligatorio' },
        { status: 400 }
      )
    }

    const updateData = {
      nome: nome.trim(),
      descrizione: descrizione || '',
      campi_richiesti: campi_richiesti || campi_personalizzati || [],
      attiva: attiva !== undefined ? attiva : true
    }

    const { data, error } = await dbQuery.tipologie.update(id, updateData)
    
    if (error) {
      console.error('Errore Supabase UPDATE:', error)
      return NextResponse.json(
        { success: false, error: 'Errore nell\'aggiornamento della tipologia' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Tipologia non trovata' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Tipologia aggiornata con successo'
    })

  } catch (error) {
    console.error('Errore PUT tipologie:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nell\'aggiornamento della tipologia' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina tipologia
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // TODO: Verificare che non ci siano verifiche associate
    
    const { error } = await dbQuery.tipologie.delete(id)
    
    if (error) {
      console.error('Errore Supabase DELETE:', error)
      return NextResponse.json(
        { success: false, error: 'Errore nell\'eliminazione della tipologia' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Tipologia eliminata con successo'
    })

  } catch (error) {
    console.error('Errore DELETE tipologie:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nell\'eliminazione della tipologia' },
      { status: 500 }
    )
  }
}