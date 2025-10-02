import { NextRequest, NextResponse } from 'next/server'
import { Lavorazione } from '@/lib/types'

// Riferimento al database in memoria
let lavorazioniDB: Lavorazione[] = [
  {
    id: '1',
    verifica_id: '1',
    stato: 'completata',
    descrizione: 'Verifica antincendio - Condominio Via Roma 15',
    note: [
      'Tutti gli estintori controllati e funzionanti',
      'Vie di fuga libere e segnalate correttamente'
    ],
    data_apertura: '2024-02-01T09:00:00Z',
    data_chiusura: '2024-02-01T11:30:00Z',
    utente_assegnato: 'user-001',
    data_assegnazione: '2024-02-01T08:00:00Z'
  },
  {
    id: '2',
    verifica_id: '2',
    stato: 'da_eseguire',
    descrizione: 'Verifica elettrica - Condominio Via Milano 32',
    note: [],
    data_apertura: '2024-02-02T08:00:00Z',
    utente_assegnato: 'user-001',
    data_assegnazione: '2024-02-02T08:00:00Z'
  },
  {
    id: '3',
    verifica_id: '3',
    stato: 'riaperta',
    descrizione: 'Verifica ascensore - Condominio Via Torino 8',
    note: [
      'Prima verifica completata',
      'Riaperta per controllo aggiuntivo cavi'
    ],
    data_apertura: '2024-02-03T10:00:00Z',
    data_chiusura: '2024-02-03T12:00:00Z',
    data_riapertura: '2024-02-04T09:00:00Z',
    utente_assegnato: 'user-002',
    data_assegnazione: '2024-02-04T09:00:00Z'
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
      case 'inizia':
        if (lavorazione.stato !== 'da_eseguire') {
          return NextResponse.json(
            { success: false, error: 'Solo le lavorazioni da eseguire possono essere iniziate' },
            { status: 400 }
          )
        }
        lavorazione.stato = 'in_corso'
        if (nota) lavorazione.note.push(nota)
        break

      case 'completa':
        if (lavorazione.stato !== 'in_corso' && lavorazione.stato !== 'da_eseguire') {
          return NextResponse.json(
            { success: false, error: 'Solo le lavorazioni da eseguire o in corso possono essere completate' },
            { status: 400 }
          )
        }
        lavorazione.stato = 'completata'
        lavorazione.data_chiusura = now
        if (nota) lavorazione.note.push(nota)
        break

      case 'riapri':
        if (lavorazione.stato !== 'completata') {
          return NextResponse.json(
            { success: false, error: 'Solo le lavorazioni completate possono essere riaperte' },
            { status: 400 }
          )
        }
        lavorazione.stato = 'riaperta'
        lavorazione.data_riapertura = now
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