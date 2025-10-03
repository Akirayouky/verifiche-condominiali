import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/supabase'

// GET - Ottieni lavorazione per ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data, error } = await dbQuery.lavorazioni.getById(id)

    if (error) {
      console.error('Errore Supabase GET lavorazione:', error)
      return NextResponse.json(
        { success: false, error: 'Errore nel recupero della lavorazione' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Lavorazione non trovata' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('Errore GET lavorazione:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nel recupero della lavorazione' },
      { status: 500 }
    )
  }
}

// PUT - Aggiorna lavorazione
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { azione, dati } = body

    // Ottieni la lavorazione esistente
    const { data: lavorazioneEsistente, error: getError } = await dbQuery.lavorazioni.getById(id)

    if (getError) {
      console.error('Errore Supabase GET lavorazione esistente:', getError)
      return NextResponse.json(
        { success: false, error: 'Errore nel recupero della lavorazione' },
        { status: 500 }
      )
    }

    if (!lavorazioneEsistente) {
      return NextResponse.json(
        { success: false, error: 'Lavorazione non trovata' },
        { status: 404 }
      )
    }

    const now = new Date().toISOString()
    let updateData: any = {}

    switch (azione) {
      case 'completa':
        if (lavorazioneEsistente.stato === 'completata') {
          return NextResponse.json(
            { success: false, error: 'La lavorazione è già completata' },
            { status: 400 }
          )
        }

        updateData = {
          stato: 'completata',
          data_chiusura: now,
          note: (dati && dati.note) ? [...(lavorazioneEsistente.note || []), dati.note] : lavorazioneEsistente.note
        }
        break

      case 'riapri':
        if (lavorazioneEsistente.stato !== 'completata') {
          return NextResponse.json(
            { success: false, error: 'Solo le lavorazioni completate possono essere riaperte' },
            { status: 400 }
          )
        }

        updateData = {
          stato: 'riaperta',
          data_riapertura: now,
          note: (dati && dati.motivo) ? [...(lavorazioneEsistente.note || []), `Riapertura: ${dati.motivo}`] : lavorazioneEsistente.note
        }
        break

      case 'assegna':
        if (!dati || !dati.utenteAssegnato) {
          return NextResponse.json(
            { success: false, error: 'Utente assegnato obbligatorio per questa azione' },
            { status: 400 }
          )
        }
        updateData = {
          utente_assegnato: dati.utenteAssegnato,
          data_assegnazione: now
        }
        break

      case 'aggiungi_nota':
        if (!dati || !dati.nota) {
          return NextResponse.json(
            { success: false, error: 'Nota obbligatoria per questa azione' },
            { status: 400 }
          )
        }
        updateData = {
          note: [...(lavorazioneEsistente.note || []), dati.nota]
        }
        break

      case 'aggiorna':
        updateData = {
          ...dati,
          data_ultima_modifica: now
        }
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Azione non valida' },
          { status: 400 }
        )
    }

    const { data: updatedData, error: updateError } = await dbQuery.lavorazioni.update(id, updateData)

    if (updateError) {
      console.error('Errore Supabase UPDATE lavorazione:', updateError)
      return NextResponse.json(
        { success: false, error: 'Errore nell\'aggiornamento della lavorazione' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedData,
      message: 'Lavorazione aggiornata con successo'
    })

  } catch (error) {
    console.error('Errore PUT lavorazione:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nell\'aggiornamento della lavorazione' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina lavorazione
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { error } = await dbQuery.lavorazioni.delete(id)

    if (error) {
      console.error('Errore Supabase DELETE lavorazione:', error)
      return NextResponse.json(
        { success: false, error: 'Errore nell\'eliminazione della lavorazione' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Lavorazione eliminata con successo'
    })

  } catch (error) {
    console.error('Errore DELETE lavorazione:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nell\'eliminazione della lavorazione' },
      { status: 500 }
    )
  }
}