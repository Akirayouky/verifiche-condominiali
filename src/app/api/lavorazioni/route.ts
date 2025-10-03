import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { Lavorazione } from '@/lib/types'
import { dbQuery, supabase } from '@/lib/supabase'

// GET - Ottieni tutte le lavorazioni
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const stato = searchParams.get('stato')
    const verificaId = searchParams.get('verifica_id')
    const utenteAssegnato = searchParams.get('utente_assegnato')

    let query = supabase
      .from('lavorazioni')
      .select(`
        *,
        condomini(
          id,
          nome,
          indirizzo
        ),
        users(
          id,
          username,
          nome,
          cognome,
          email
        )
      `)

    // Applica filtri se presenti
    if (stato && stato !== 'tutte') {
      query = query.eq('stato', stato)
    }
    if (verificaId) {
      query = query.eq('verifica_id', verificaId)
    }
    if (utenteAssegnato) {
      query = query.eq('user_id', utenteAssegnato)
    }

    const { data, error } = await query

    if (error) {
      console.error('Errore Supabase GET lavorazioni:', error)
      return NextResponse.json(
        { success: false, error: 'Errore nel recupero delle lavorazioni' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: data?.length || 0
    })
  } catch (error) {
    console.error('Errore GET lavorazioni:', error)
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
    const { 
      condominio_id, 
      tipologia, 
      tipologia_verifica_id, 
      descrizione, 
      priorita, 
      assegnato_a, 
      data_scadenza, 
      note,
      // Retrocompatibilità con API esistente
      verifica_id,
      utente_assegnato 
    } = body

    // Validazione: almeno condominio e descrizione per nuove lavorazioni, o verifica_id per quelle esistenti
    if (!condominio_id && !verifica_id) {
      return NextResponse.json(
        { success: false, error: 'Condominio ID o Verifica ID sono obbligatori' },
        { status: 400 }
      )
    }

    if (!descrizione) {
      return NextResponse.json(
        { success: false, error: 'La descrizione è obbligatoria' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    // Crea titolo automatico basato sulla tipologia
    const getTitolo = () => {
      if (tipologia === 'verifica' && tipologia_verifica_id) {
        return `Verifica Tecnica - ${tipologia_verifica_id}` // Verrà sostituito con il nome della tipologia
      }
      const tipoMap: Record<string, string> = {
        'manutenzione': 'Manutenzione Ordinaria',
        'riparazione': 'Riparazione Urgente', 
        'verifica': 'Verifica Tecnica',
        'sicurezza': 'Sicurezza e Conformità',
        'pulizia': 'Pulizia Straordinaria',
        'altro': 'Altro'
      }
      return tipoMap[tipologia || 'altro'] || 'Lavorazione'
    }

    const nuovaLavorazione = {
      // Nuovi campi per wizard admin
      condominio_id,
      user_id: assegnato_a || utente_assegnato, // user_id nel DB
      titolo: getTitolo(),
      descrizione: descrizione.trim(),
      stato: 'aperta', // Stati DB: 'aperta', 'in_corso', 'completata', 'archiviata'
      priorita: priorita || 'media',
      data_apertura: now,
      data_scadenza: data_scadenza || null,
      note: note || null,
      // Campi personalizzati (JSON per metadata)
      allegati: JSON.stringify({
        tipologia: tipologia || 'altro',
        tipologia_verifica_id: tipologia_verifica_id || null,
        verifica_id: verifica_id || null // Per retrocompatibilità
      })
    }

    const { data, error } = await dbQuery.lavorazioni.create(nuovaLavorazione)

    if (error) {
      console.error('Errore Supabase POST lavorazione:', error)
      return NextResponse.json(
        { success: false, error: 'Errore nella creazione della lavorazione' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Lavorazione creata con successo'
    }, { status: 201 })

  } catch (error) {
    console.error('Errore POST lavorazione:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nella creazione della lavorazione' },
      { status: 500 }
    )
  }
}