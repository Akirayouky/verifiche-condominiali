import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/supabase'
import { NotificationManager } from '@/lib/notifications'

/**
 * POST /api/lavorazioni/[id]/riapri
 * 
 * Riapre una lavorazione completata per integrazioni/correzioni
 * 
 * Body:
 * {
 *   motivo: string (min 10 chars),
 *   riaperta_da: string (UUID admin),
 *   campi_da_ricompilare: Array<{nome, tipo, label, valore_precedente}>,
 *   campi_nuovi: Array<{nome, tipo, label, required, descrizione, opzioni?}>
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // Validazione input
    const { motivo, riaperta_da, campi_da_ricompilare = [], campi_nuovi = [] } = body

    if (!motivo || motivo.trim().length < 10) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Il motivo della riapertura deve essere di almeno 10 caratteri' 
        },
        { status: 400 }
      )
    }

    if (!riaperta_da) {
      return NextResponse.json(
        { success: false, error: 'ID amministratore mancante' },
        { status: 400 }
      )
    }

    // Verifica che la lavorazione esista e sia completata
    const { data: lavorazione, error: fetchError } = await dbQuery.lavorazioni.getById(id)

    if (fetchError || !lavorazione) {
      console.error('Errore recupero lavorazione:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Lavorazione non trovata' },
        { status: 404 }
      )
    }

    if (lavorazione.stato !== 'completata') {
      return NextResponse.json(
        { 
          success: false, 
          error: `Solo le lavorazioni completate possono essere riaperte. Stato attuale: ${lavorazione.stato}` 
        },
        { status: 400 }
      )
    }

    // Prepara i dati per l'update
    const updateData = {
      stato: 'riaperta' as const,
      data_riapertura: new Date().toISOString(),
      riaperta_da,
      motivo_riapertura: motivo.trim(),
      campi_da_ricompilare: JSON.stringify(campi_da_ricompilare),
      campi_nuovi: JSON.stringify(campi_nuovi)
    }

    // Aggiorna la lavorazione su Supabase
    const { supabase } = await import('@/lib/supabase')
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
          error: 'Errore durante la riapertura della lavorazione',
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

    const { data: admin } = await supabase
      .from('users')
      .select('email, nome, cognome')
      .eq('id', riaperta_da)
      .single()

    const { data: sopralluoghista } = await supabase
      .from('users')
      .select('id, email, nome, cognome')
      .eq('id', lavorazione.utente_id)
      .single()

    // Crea notifica per il sopralluoghista
    if (sopralluoghista) {
      const notificationManager = NotificationManager.getInstance()
      
      const numCampiRicompilare = campi_da_ricompilare.length
      const numCampiNuovi = campi_nuovi.length
      
      let messaggioDettagli = ''
      if (numCampiRicompilare > 0) {
        messaggioDettagli += `${numCampiRicompilare} campo/i da ricompilare`
      }
      if (numCampiNuovi > 0) {
        if (messaggioDettagli) messaggioDettagli += ', '
        messaggioDettagli += `${numCampiNuovi} nuovo/i campo/i da compilare`
      }

      await notificationManager.creaNotifica({
        tipo: 'lavorazione_riaperta' as const,
        titolo: '🔄 Lavorazione Riaperta per Integrazione',
        messaggio: `La lavorazione "${condominio?.nome || 'N/A'}" è stata riaperta da ${admin?.nome || 'Admin'} ${admin?.cognome || ''}. ${messaggioDettagli}.`,
        utente_id: sopralluoghista.id,
        lavorazione_id: id,
        priorita: 'media' as const
      })

      // Invia email al sopralluoghista
      if (sopralluoghista.email) {
        console.log('📧 Email da inviare a:', sopralluoghista.email)
        console.log('   Oggetto: Lavorazione Riaperta - Integrazione Richiesta')
        console.log('   Dettagli:', messaggioDettagli)
        console.log('   Motivo:', motivo.trim())
        // TODO: Implementare invio email reale quando configurato
      }
    }

    console.log('✅ Lavorazione riaperta con successo:', {
      id,
      stato: 'riaperta',
      motivo: motivo.trim(),
      campi_da_ricompilare: campi_da_ricompilare.length,
      campi_nuovi: campi_nuovi.length,
      riaperta_da: admin?.email || riaperta_da
    })

    return NextResponse.json({
      success: true,
      message: 'Lavorazione riaperta con successo. Notifica inviata al sopralluoghista.',
      data: {
        id: updated.id,
        stato: updated.stato,
        data_riapertura: updated.data_riapertura,
        motivo_riapertura: updated.motivo_riapertura,
        campi_da_ricompilare: campi_da_ricompilare.length,
        campi_nuovi: campi_nuovi.length
      }
    })

  } catch (error) {
    console.error('❌ Errore riapertura lavorazione:', error)
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
