import { NextRequest, NextResponse } from 'next/server'
import { supabase, dbQuery } from '@/lib/supabase'
import { NotificationManager } from '@/lib/notifications'

/**
 * PUT /api/lavorazioni/[id]/completa-integrazione
 * 
 * Completa l'integrazione di una lavorazione riaperta
 * Merge dei campi ricompilati + aggiunta nuovi campi
 * 
 * Body:
 * {
 *   campi_ricompilati: Record<string, any>, // Campi che erano da ricompilare, ora compilati
 *   campi_nuovi_compilati: Record<string, any>, // Nuovi campi ora compilati
 *   utente_id: string // UUID sopralluoghista
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    const { campi_ricompilati = {}, campi_nuovi_compilati = {}, utente_id } = body

    if (!utente_id) {
      return NextResponse.json(
        { success: false, error: 'ID utente mancante' },
        { status: 400 }
      )
    }

    // Verifica che la lavorazione esista e sia riaperta
    const { data: lavorazione, error: fetchError } = await dbQuery.lavorazioni.getById(id)

    if (fetchError || !lavorazione) {
      console.error('Errore recupero lavorazione:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Lavorazione non trovata' },
        { status: 404 }
      )
    }

    if (lavorazione.stato !== 'riaperta') {
      return NextResponse.json(
        { 
          success: false, 
          error: `Solo le lavorazioni riaperte possono completare l'integrazione. Stato attuale: ${lavorazione.stato}` 
        },
        { status: 400 }
      )
    }

    // Recupera i campi da ricompilare e i nuovi campi dalla lavorazione
    let campiDaRicompilare: any[] = []
    let campiNuovi: any[] = []
    
    try {
      campiDaRicompilare = typeof lavorazione.campi_da_ricompilare === 'string' 
        ? JSON.parse(lavorazione.campi_da_ricompilare) 
        : lavorazione.campi_da_ricompilare || []
      
      campiNuovi = typeof lavorazione.campi_nuovi === 'string'
        ? JSON.parse(lavorazione.campi_nuovi)
        : lavorazione.campi_nuovi || []
    } catch (parseError) {
      console.error('Errore parsing campi JSONB:', parseError)
      campiDaRicompilare = []
      campiNuovi = []
    }

    // Validazione: controlla che tutti i campi obbligatori siano stati compilati
    const campiObbligatoriMancanti: string[] = []

    // Controlla campi da ricompilare
    campiDaRicompilare.forEach((campo: any) => {
      const nomeCampo = campo.nome
      if (!campi_ricompilati[nomeCampo] || campi_ricompilati[nomeCampo] === '') {
        campiObbligatoriMancanti.push(`Ricompilato: ${campo.label || nomeCampo}`)
      }
    })

    // Controlla nuovi campi obbligatori
    campiNuovi.forEach((campo: any) => {
      if (campo.required && (!campi_nuovi_compilati[campo.nome] || campi_nuovi_compilati[campo.nome] === '')) {
        campiObbligatoriMancanti.push(`Nuovo: ${campo.label || campo.nome}`)
      }
    })

    if (campiObbligatoriMancanti.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Campi obbligatori mancanti',
          campi_mancanti: campiObbligatoriMancanti
        },
        { status: 400 }
      )
    }

    // Merge dei dati esistenti con i nuovi
    const datiEsistenti = lavorazione.dati_verifiche || {}
    
    // Aggiorna i campi ricompilati
    const datiAggiornati = {
      ...datiEsistenti,
      ...campi_ricompilati,
      ...campi_nuovi_compilati
    }

    // Prepara update
    const updateData = {
      stato: 'completata' as const,
      dati_verifiche: datiAggiornati,
      data_completamento: new Date().toISOString(),
      // Pulizia campi riapertura (manteniamo storico ma puliamo working data)
      // Nota: NON cancelliamo motivo_riapertura, data_riapertura, riaperta_da per storico
    }

    // Aggiorna la lavorazione
    const { data: updated, error: updateError } = await supabase
      .from('lavorazioni')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Errore aggiornamento lavorazione:', updateError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Errore durante il completamento dell\'integrazione',
          details: updateError.message 
        },
        { status: 500 }
      )
    }

    // Recupera info per notifica
    const { data: condominio } = await supabase
      .from('condomini')
      .select('nome')
      .eq('id', lavorazione.condominio_id)
      .single()

    const { data: sopralluoghista } = await supabase
      .from('users')
      .select('email, nome, cognome')
      .eq('id', utente_id)
      .single()

    // Invia notifica agli admin
    const { data: admins, error: adminsError } = await supabase
      .from('users')
      .select('id, email, nome, cognome')
      .eq('role', 'admin')
      .eq('attivo', true)
    
    const numCampiRicompilati = Object.keys(campi_ricompilati).length
    const numCampiNuovi = Object.keys(campi_nuovi_compilati).length
    
    if (!adminsError && admins && admins.length > 0) {
      const notificationManager = NotificationManager.getInstance()
      
      for (const admin of admins) {
        await notificationManager.creaNotifica({
          tipo: 'integrazione_completata' as const,
          titolo: '✅ Integrazione Lavorazione Completata',
          messaggio: `${sopralluoghista?.nome || 'Sopralluoghista'} ${sopralluoghista?.cognome || ''} ha completato l'integrazione della lavorazione "${condominio?.nome || 'N/A'}". ${numCampiRicompilati} campo/i ricompilati, ${numCampiNuovi} nuovo/i campo/i aggiunti.`,
          utente_id: admin.id,
          lavorazione_id: id,
          priorita: 'media' as const
        })

        // Log email (TODO: implementare invio reale)
        if (admin.email) {
          console.log('📧 Email da inviare a admin:', admin.email)
          console.log('   Oggetto: Integrazione Completata')
          console.log('   Lavorazione:', condominio?.nome)
          console.log('   Completata da:', sopralluoghista?.email)
        }
      }
    }

    console.log('✅ Integrazione completata con successo:', {
      id,
      stato: 'completata',
      campi_ricompilati: numCampiRicompilati,
      campi_nuovi: numCampiNuovi,
      completata_da: sopralluoghista?.email || utente_id
    })

    return NextResponse.json({
      success: true,
      message: 'Integrazione completata con successo. Lavorazione aggiornata.',
      data: {
        id: updated.id,
        stato: updated.stato,
        data_completamento: updated.data_completamento,
        campi_ricompilati: numCampiRicompilati,
        campi_nuovi_aggiunti: numCampiNuovi,
        totale_campi: Object.keys(datiAggiornati).length
      }
    })

  } catch (error) {
    console.error('❌ Errore completamento integrazione:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Errore interno del server',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
