import { NextRequest, NextResponse } from 'next/server'
import { CreateVerificaRequest } from '@/lib/types'
import { dbQuery } from '@/lib/supabase'
import { NotificationManager } from '@/lib/notifications'

// GET - Ottieni tutte le verifiche
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const condominioId = searchParams.get('condominioId')
    const tipologiaId = searchParams.get('tipologiaId')
    const stato = searchParams.get('stato')

    // Per ora prendiamo tutte le verifiche, poi filtriamo lato client se necessario
    const { data, error } = await dbQuery.verifiche.getAll()
    
    if (error) {
      console.error('Errore Supabase GET verifiche:', error)
      return NextResponse.json(
        { success: false, error: 'Errore nel recupero delle verifiche' },
        { status: 500 }
      )
    }

    // Filtri opzionali (da implementare lato database se necessario)
    let filteredVerifiche = data || []

    if (condominioId) {
      filteredVerifiche = filteredVerifiche.filter(v => v.condominio_id === condominioId)
    }

    if (tipologiaId) {
      filteredVerifiche = filteredVerifiche.filter(v => v.tipologia_id === tipologiaId)
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
    console.error('Errore GET verifiche:', error)
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
    const { condominio_id, tipologia_id, dati_verifica, note } = body

    if (!condominio_id || !tipologia_id) {
      return NextResponse.json(
        { success: false, error: 'Condominio e tipologia sono obbligatori' },
        { status: 400 }
      )
    }

    const verificaData = {
      condominio_id,
      tipologia_id,
      stato: 'bozza',
      dati_verifica: dati_verifica || {},
      note: note || '',
      email_inviata: false
    }

    const { data, error } = await dbQuery.verifiche.create(verificaData)
    
    if (error) {
      console.error('Errore Supabase create verifica:', error)
      return NextResponse.json(
        { success: false, error: 'Errore nella creazione della verifica' },
        { status: 500 }
      )
    }

    // Carica dati aggiuntivi per la notifica
    const { data: condominio } = await dbQuery.condomini.getById(condominio_id)
    const { data: tipologia } = await dbQuery.tipologie.getById(tipologia_id)

    // Crea notifica automatica per nuova verifica
    try {
      const notificationManager = new NotificationManager()
      await notificationManager.creaNotifica({
        tipo: 'nuova_assegnazione', // Temporaneamente usiamo tipo esistente
        titolo: '📝 Nuova Verifica Creata',
        messaggio: `Verifica ${tipologia?.nome || 'sconosciuta'} creata per ${condominio?.nome || 'condominio'}`,
        utente_id: '', // Notifica generale per admin (string vuota per notifica globale)
        priorita: 'media',
        condominio_id: condominio_id
      })
      console.log('✅ Notifica creata per nuova verifica:', data.id)
    } catch (notifError) {
      console.error('⚠️ Errore nella creazione della notifica:', notifError)
      // Non bloccare l'operazione principale
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Verifica creata con successo'
    }, { status: 201 })

  } catch (error) {
    console.error('Errore POST verifiche:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nella creazione della verifica' },
      { status: 500 }
    )
  }
}