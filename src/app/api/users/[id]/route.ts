import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/supabase'

// GET - Ottieni utente per ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data, error } = await dbQuery.users.getById(id)

    if (error) {
      console.error('Errore Supabase GET user:', error)
      return NextResponse.json(
        { success: false, error: 'Errore nel recupero dell\'utente' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Utente non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('Errore GET user:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nel recupero dell\'utente' },
      { status: 500 }
    )
  }
}

// PUT - Aggiorna utente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { azione, ...updateData } = body

    // Ottieni l'utente esistente
    const { data: existingUser, error: getError } = await dbQuery.users.getById(id)

    if (getError) {
      console.error('Errore Supabase GET user esistente:', getError)
      return NextResponse.json(
        { success: false, error: 'Errore nel recupero dell\'utente' },
        { status: 500 }
      )
    }

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Utente non trovato' },
        { status: 404 }
      )
    }

    const now = new Date().toISOString()
    let finalUpdateData: any = {}

    switch (azione) {
      case 'approve':
        // Approva sopralluoghista
        if (existingUser.role !== 'sopralluoghista') {
          return NextResponse.json(
            { success: false, error: 'Solo i sopralluoghisti possono essere approvati' },
            { status: 400 }
          )
        }
        finalUpdateData = {
          approved_at: now,
          // approved_by dovrebbe essere l'ID dell'admin che fa l'approvazione
        }
        break

      case 'deactivate':
        finalUpdateData = { attivo: false }
        break

      case 'activate':
        finalUpdateData = { attivo: true }
        break

      case 'reject':
        // Rifiuta utente: lo disattiva e rimuove approved_at per nasconderlo dalla lista attesa
        finalUpdateData = { 
          attivo: false,
          approved_at: null,
          // rejected_at: now  // Campo da aggiungere al DB schema
        }
        break

      case 'reset_password':
        // Per ora aggiungiamo solo una nota nel campo note o usiamo un approccio temporaneo
        // I campi password_reset_required e password_reset_at devono essere aggiunti al DB prima
        finalUpdateData = { 
          // Temporaneamente usiamo last_login per tracciare il reset (da migliorare)
          last_login: null, // Forza re-login 
          // password_reset_required: true,  // Da attivare dopo schema update
          // password_reset_at: now,         // Da attivare dopo schema update
        }
        break

      case 'update':
        // Aggiorna dati generici
        finalUpdateData = updateData
        // Rimuovi azione dai dati da aggiornare
        delete finalUpdateData.azione
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Azione non valida' },
          { status: 400 }
        )
    }

    const { data: updatedData, error: updateError } = await dbQuery.users.update(id, finalUpdateData)

    if (updateError) {
      console.error('Errore Supabase UPDATE user:', updateError)
      return NextResponse.json(
        { success: false, error: 'Errore nell\'aggiornamento dell\'utente' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedData,
      message: 'Utente aggiornato con successo'
    })

  } catch (error) {
    console.error('Errore PUT user:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nell\'aggiornamento dell\'utente' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina utente
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { error } = await dbQuery.users.delete(id)

    if (error) {
      console.error('Errore Supabase DELETE user:', error)
      return NextResponse.json(
        { success: false, error: 'Errore nell\'eliminazione dell\'utente' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Utente eliminato con successo'
    })

  } catch (error) {
    console.error('Errore DELETE user:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nell\'eliminazione dell\'utente' },
      { status: 500 }
    )
  }
}