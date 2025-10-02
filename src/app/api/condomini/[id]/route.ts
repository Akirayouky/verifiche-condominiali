import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/supabase'

// GET - Ottieni condominio per ID o Token
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Prima prova per ID
    let { data, error } = await dbQuery.condomini.getById(id)
    
    // Se non trovato per ID, cerca per token
    if (!data && !error) {
      const { data: allData } = await dbQuery.condomini.getAll()
      data = allData?.find(c => c.token === id) || null
    }

    if (error) {
      console.error('Errore Supabase GET by ID:', error)
      return NextResponse.json(
        { success: false, error: 'Errore nel recupero del condominio' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Condominio non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('Errore GET condominio:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nel recupero del condominio' },
      { status: 500 }
    )
  }
}

// PUT - Aggiorna condominio
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { nome } = body

    if (!nome || nome.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Il nome del condominio è obbligatorio' },
        { status: 400 }
      )
    }

    const updateData = {
      nome: nome.trim()
    }
    
    const { data, error } = await dbQuery.condomini.update(id, updateData)

    if (error) {
      console.error('Errore Supabase UPDATE:', error)
      return NextResponse.json(
        { success: false, error: 'Errore nell\'aggiornamento del condominio' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Condominio non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Condominio aggiornato con successo'
    })

  } catch (error) {
    console.error('Errore PUT condominio:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nell\'aggiornamento del condominio' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina condominio
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // TODO: Verifica che non ci siano verifiche associate prima di eliminare
    // Per ora eliminiamo direttamente
    
    const { error } = await dbQuery.condomini.delete(id)

    if (error) {
      console.error('Errore Supabase DELETE:', error)
      return NextResponse.json(
        { success: false, error: 'Errore nell\'eliminazione del condominio' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Condominio eliminato con successo'
    })

  } catch (error) {
    console.error('Errore DELETE condominio:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nell\'eliminazione del condominio' },
      { status: 500 }
    )
  }
}