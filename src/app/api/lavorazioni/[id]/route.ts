import { NextRequest, NextResponse } from 'next/server'
import { Lavorazione } from '@/lib/types'

// Riferimento al database in memoria
let lavorazioniDB: Lavorazione[] = [
  {
    id: '1',
    verificaId: '1',
    stato: 'chiusa',
    descrizione: 'Verifica antincendio completata - Sistema conforme',
    note: [
      'Tutti gli estintori controllati e funzionanti',
      'Vie di fuga libere e segnalate correttamente'
    ],
    dataApertura: '2024-02-01T09:00:00Z',
    dataChiusura: '2024-02-01T11:30:00Z'
  }
]

// GET - Ottieni lavorazione per ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const lavorazione = lavorazioniDB.find(l => l.id === id)

    if (!lavorazione) {
      return NextResponse.json(
        { success: false, error: 'Lavorazione non trovata' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: lavorazione
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Errore nel recupero della lavorazione' },
      { status: 500 }
    )
  }
}

// PUT - Aggiorna lavorazione (chiudi, riapri, modifica)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { azione, descrizione, nota } = body

    const lavorazioneIndex = lavorazioniDB.findIndex(l => l.id === id)
    
    if (lavorazioneIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Lavorazione non trovata' },
        { status: 404 }
      )
    }

    const lavorazione = lavorazioniDB[lavorazioneIndex]
    const now = new Date().toISOString()

    switch (azione) {
      case 'chiudi':
        if (lavorazione.stato !== 'aperta') {
          return NextResponse.json(
            { success: false, error: 'Solo le lavorazioni aperte possono essere chiuse' },
            { status: 400 }
          )
        }
        lavorazione.stato = 'chiusa'
        lavorazione.dataChiusura = now
        if (nota) lavorazione.note.push(nota)
        break

      case 'riapri':
        if (lavorazione.stato !== 'chiusa') {
          return NextResponse.json(
            { success: false, error: 'Solo le lavorazioni chiuse possono essere riaperte' },
            { status: 400 }
          )
        }
        lavorazione.stato = 'riaperta'
        lavorazione.dataRiapertura = now
        if (nota) lavorazione.note.push(nota)
        break

      case 'aggiungi_nota':
        if (nota) lavorazione.note.push(nota)
        break

      case 'modifica':
        if (descrizione) lavorazione.descrizione = descrizione
        if (nota) lavorazione.note.push(nota)
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Azione non riconosciuta' },
          { status: 400 }
        )
    }

    lavorazioniDB[lavorazioneIndex] = lavorazione

    return NextResponse.json({
      success: true,
      data: lavorazione,
      message: 'Lavorazione aggiornata con successo'
    })

  } catch (error) {
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
    const lavorazioneIndex = lavorazioniDB.findIndex(l => l.id === id)
    
    if (lavorazioneIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Lavorazione non trovata' },
        { status: 404 }
      )
    }

    lavorazioniDB.splice(lavorazioneIndex, 1)

    return NextResponse.json({
      success: true,
      message: 'Lavorazione eliminata con successo'
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Errore nell\'eliminazione della lavorazione' },
      { status: 500 }
    )
  }
}