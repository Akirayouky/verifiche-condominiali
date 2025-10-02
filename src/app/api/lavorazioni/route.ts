import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { Lavorazione } from '@/lib/types'

// Database in memoria per le lavorazioni
let lavorazioniDB: Lavorazione[] = [
  {
    id: '1',
    verificaId: '1',
    stato: 'chiusa',
    descrizione: 'Verifica antincendio completata - Sistema conforme',
    note: [
      'Tutti gli estintori controllati e funzionanti',
      'Vie di fuga libere e segnalate correttamente',
      'Controlli periodici programmati per il prossimo trimestre'
    ],
    dataApertura: '2024-02-01T09:00:00Z',
    dataChiusura: '2024-02-01T11:30:00Z'
  },
  {
    id: '2',
    verificaId: '2', 
    stato: 'aperta',
    descrizione: 'Controllo ascensore in corso',
    note: [
      'Iniziata verifica funzionamento meccanico',
      'Controllo sistemi di sicurezza previsto per domani'
    ],
    dataApertura: '2024-02-05T14:00:00Z'
  },
  {
    id: '3',
    verificaId: '1',
    stato: 'riaperta',
    descrizione: 'Riapertura per controllo aggiuntivo estintore piano terra',
    note: [
      'Rilevata anomalia su estintore E-12',
      'Necessaria sostituzione entro 7 giorni',
      'Contattato fornitore per preventivo'
    ],
    dataApertura: '2024-02-01T09:00:00Z',
    dataChiusura: '2024-02-01T11:30:00Z',
    dataRiapertura: '2024-02-10T10:15:00Z'
  }
]

// GET - Ottieni tutte le lavorazioni
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const stato = searchParams.get('stato')
    const verificaId = searchParams.get('verificaId')

    let filteredLavorazioni = lavorazioniDB

    if (stato) {
      filteredLavorazioni = filteredLavorazioni.filter(l => l.stato === stato)
    }

    if (verificaId) {
      filteredLavorazioni = filteredLavorazioni.filter(l => l.verificaId === verificaId)
    }

    return NextResponse.json({
      success: true,
      data: filteredLavorazioni,
      total: filteredLavorazioni.length
    })
  } catch (error) {
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
    const { verificaId, descrizione, note } = body

    if (!verificaId || !descrizione) {
      return NextResponse.json(
        { success: false, error: 'Verifica ID e descrizione sono obbligatori' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    const nuovaLavorazione: Lavorazione = {
      id: uuidv4(),
      verificaId,
      stato: 'aperta',
      descrizione: descrizione.trim(),
      note: note ? [note] : [],
      dataApertura: now
    }

    lavorazioniDB.push(nuovaLavorazione)

    return NextResponse.json({
      success: true,
      data: nuovaLavorazione,
      message: 'Lavorazione creata con successo'
    }, { status: 201 })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Errore nella creazione della lavorazione' },
      { status: 500 }
    )
  }
}