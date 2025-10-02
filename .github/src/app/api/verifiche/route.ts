import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { Verifica } from '@/lib/types'

// Database in memoria per le verifiche
let verificheDB: Verifica[] = [
  {
    id: '1',
    condominioId: '1',
    tipologiaId: '1',
    stato: 'completata',
    datiVerifica: {
      'numero_estintori': 12,
      'stato_vie_fuga': 'Libere',
      'note_aggiuntive': 'Tutti i sistemi funzionanti correttamente'
    },
    note: 'Verifica completata senza anomalie',
    emailInviata: true,
    dataCreazione: '2024-02-01T09:00:00Z',
    dataCompletamento: '2024-02-01T11:30:00Z',
    dataUltimaModifica: '2024-02-01T11:30:00Z'
  },
  {
    id: '2',
    condominioId: '2',
    tipologiaId: '2',
    stato: 'in_corso',
    datiVerifica: {
      'numero_impianto': 'ASC001',
      'ultima_manutenzione': '2024-01-15'
    },
    note: 'Verifica in corso',
    emailInviata: false,
    dataCreazione: '2024-02-05T14:00:00Z',
    dataUltimaModifica: '2024-02-05T14:00:00Z'
  }
]

// GET - Ottieni tutte le verifiche
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const condominioId = searchParams.get('condominioId')
    const tipologiaId = searchParams.get('tipologiaId')
    const stato = searchParams.get('stato')

    let filteredVerifiche = verificheDB

    if (condominioId) {
      filteredVerifiche = filteredVerifiche.filter(v => v.condominioId === condominioId)
    }

    if (tipologiaId) {
      filteredVerifiche = filteredVerifiche.filter(v => v.tipologiaId === tipologiaId)
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
    const { condominioId, tipologiaId, datiVerifica, note } = body

    if (!condominioId || !tipologiaId) {
      return NextResponse.json(
        { success: false, error: 'Condominio e tipologia sono obbligatori' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    const nuovaVerifica: Verifica = {
      id: uuidv4(),
      condominioId,
      tipologiaId,
      stato: 'bozza',
      datiVerifica: datiVerifica || {},
      note: note || '',
      emailInviata: false,
      dataCreazione: now,
      dataUltimaModifica: now
    }

    verificheDB.push(nuovaVerifica)

    return NextResponse.json({
      success: true,
      data: nuovaVerifica,
      message: 'Verifica creata con successo'
    }, { status: 201 })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Errore nella creazione della verifica' },
      { status: 500 }
    )
  }
}