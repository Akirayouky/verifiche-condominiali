import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { Lavorazione } from '@/lib/types'

// Database in memoria per le lavorazioni
let lavorazioniDB: Lavorazione[] = [
  {
    id: '1',
    verifica_id: '1',
    stato: 'completata',
    descrizione: 'Verifica antincendio completata - Sistema conforme',
    note: [
      'Tutti gli estintori controllati e funzionanti',
      'Vie di fuga libere e segnalate correttamente',
      'Controlli periodici programmati per il prossimo trimestre'
    ],
    data_apertura: '2024-02-01T09:00:00Z',
    data_chiusura: '2024-02-01T11:30:00Z',
    utente_assegnato: 'mario.rossi'
  },
  {
    id: '2',
    verifica_id: '2', 
    stato: 'in_corso',
    descrizione: 'Controllo ascensore in corso',
    note: [
      'Iniziata verifica funzionamento meccanico',
      'Controllo sistemi di sicurezza previsto per domani'
    ],
    data_apertura: '2024-02-05T14:00:00Z',
    utente_assegnato: 'mario.rossi',
    verifica: {
      id: '2',
      condominio_id: 'cond_002',
      tipologia_id: 'tip_002',
      stato: 'in_corso',
      dati_verifica: {},
      note: '',
      email_inviata: false,
      data_creazione: '2024-02-05T14:00:00Z',
      data_ultima_modifica: '2024-02-05T14:00:00Z'
    }
  },
  {
    id: '3',
    verifica_id: '3',
    stato: 'da_eseguire',
    descrizione: 'Controllo impianto elettrico - Verifica quadri elettrici',
    note: [],
    data_apertura: '2024-02-10T08:00:00Z',
    utente_assegnato: 'luigi.verdi',
    verifica: {
      id: '4',
      condominio_id: 'cond_001',
      tipologia_id: 'tip_001',
      stato: 'bozza',
      dati_verifica: {},
      note: '',
      email_inviata: false,
      data_creazione: '2024-02-10T08:00:00Z',
      data_ultima_modifica: '2024-02-10T08:00:00Z'
    }
  },
  {
    id: '4',
    verifica_id: '1',
    stato: 'riaperta',
    descrizione: 'Riapertura per controllo aggiuntivo estintore piano terra',
    note: [
      'Rilevata anomalia su estintore E-12',
      'Necessaria sostituzione entro 7 giorni',
      'Contattato fornitore per preventivo'
    ],
    data_apertura: '2024-02-01T09:00:00Z',
    data_chiusura: '2024-02-01T11:30:00Z',
    data_riapertura: '2024-02-10T10:15:00Z',
    utente_assegnato: 'mario.rossi',
    verifica: {
      id: '1',
      condominio_id: 'cond_001',
      tipologia_id: 'tip_001',
      stato: 'completata',
      dati_verifica: {},
      note: '',
      email_inviata: true,
      data_creazione: '2024-02-01T08:00:00Z',
      data_completamento: '2024-02-01T11:30:00Z',
      data_ultima_modifica: '2024-02-10T10:15:00Z'
    }
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
      filteredLavorazioni = filteredLavorazioni.filter(l => l.verifica_id === verificaId)
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
      verifica_id: verificaId,
      stato: 'da_eseguire',
      descrizione: descrizione.trim(),
      note: note ? [note] : [],
      data_apertura: now
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