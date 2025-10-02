import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { TipologiaVerifica } from '@/lib/types'

// Database in memoria per le tipologie
let tipologieDB: TipologiaVerifica[] = [
  {
    id: '1',
    nome: 'Verifica Antincendio',
    descrizione: 'Controllo sistemi antincendio e vie di fuga',
    campiPersonalizzati: [
      {
        id: '1',
        nome: 'Numero estintori controllati',
        tipo: 'numero',
        obbligatorio: true
      },
      {
        id: '2', 
        nome: 'Stato vie di fuga',
        tipo: 'select',
        obbligatorio: true,
        opzioni: ['Libere', 'Parzialmente ostruite', 'Ostruite']
      },
      {
        id: '3',
        nome: 'Note aggiuntive',
        tipo: 'textarea',
        obbligatorio: false,
        placeholder: 'Inserisci eventuali osservazioni...'
      }
    ],
    attiva: true,
    dataCreazione: '2024-01-10T09:00:00Z',
    dataUltimaModifica: '2024-01-10T09:00:00Z'
  },
  {
    id: '2',
    nome: 'Controllo Ascensore',
    descrizione: 'Verifica funzionamento e sicurezza ascensore',
    campiPersonalizzati: [
      {
        id: '4',
        nome: 'Numero impianto',
        tipo: 'testo',
        obbligatorio: true
      },
      {
        id: '5',
        nome: 'Ultima manutenzione',
        tipo: 'data',
        obbligatorio: true
      },
      {
        id: '6',
        nome: 'Funzionamento regolare',
        tipo: 'checkbox',
        obbligatorio: true
      }
    ],
    attiva: true,
    dataCreazione: '2024-01-12T14:30:00Z',
    dataUltimaModifica: '2024-01-12T14:30:00Z'
  }
]

// GET - Ottieni tutte le tipologie
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: tipologieDB,
      total: tipologieDB.length
    })
  } catch (error) {
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
    const { nome, descrizione, campiPersonalizzati } = body

    if (!nome || nome.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Il nome della tipologia è obbligatorio' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    // Genera ID per i campi personalizzati
    const campiConId = campiPersonalizzati.map((campo: any) => ({
      ...campo,
      id: uuidv4()
    }))

    const nuovaTipologia: TipologiaVerifica = {
      id: uuidv4(),
      nome: nome.trim(),
      descrizione: descrizione || '',
      campiPersonalizzati: campiConId,
      attiva: true,
      dataCreazione: now,
      dataUltimaModifica: now
    }

    tipologieDB.push(nuovaTipologia)

    return NextResponse.json({
      success: true,
      data: nuovaTipologia,
      message: 'Tipologia creata con successo'
    }, { status: 201 })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Errore nella creazione della tipologia' },
      { status: 500 }
    )
  }
}