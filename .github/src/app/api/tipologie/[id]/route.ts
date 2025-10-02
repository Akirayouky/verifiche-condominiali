import { NextRequest, NextResponse } from 'next/server'
import { TipologiaVerifica } from '@/lib/types'

// Riferimento al database in memoria (stesso di route.ts)
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
      }
    ],
    attiva: true,
    dataCreazione: '2024-01-10T09:00:00Z',
    dataUltimaModifica: '2024-01-10T09:00:00Z'
  }
]

// GET - Ottieni tipologia per ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const tipologia = tipologieDB.find(t => t.id === id)

    if (!tipologia) {
      return NextResponse.json(
        { success: false, error: 'Tipologia non trovata' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: tipologia
    })

  } catch (error) {
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
    const { nome, descrizione, campiPersonalizzati, attiva } = body

    const tipologiaIndex = tipologieDB.findIndex(t => t.id === id)
    
    if (tipologiaIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Tipologia non trovata' },
        { status: 404 }
      )
    }

    const tipologiaEsistente = tipologieDB[tipologiaIndex]
    const tipologiaAggiornata: TipologiaVerifica = {
      ...tipologiaEsistente,
      nome: nome.trim(),
      descrizione: descrizione || '',
      campiPersonalizzati: campiPersonalizzati,
      attiva: attiva,
      dataUltimaModifica: new Date().toISOString()
    }

    tipologieDB[tipologiaIndex] = tipologiaAggiornata

    return NextResponse.json({
      success: true,
      data: tipologiaAggiornata,
      message: 'Tipologia aggiornata con successo'
    })

  } catch (error) {
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
    const tipologiaIndex = tipologieDB.findIndex(t => t.id === id)
    
    if (tipologiaIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Tipologia non trovata' },
        { status: 404 }
      )
    }

    // TODO: Verificare che non ci siano verifiche associate
    
    tipologieDB.splice(tipologiaIndex, 1)

    return NextResponse.json({
      success: true,
      message: 'Tipologia eliminata con successo'
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Errore nell\'eliminazione della tipologia' },
      { status: 500 }
    )
  }
}