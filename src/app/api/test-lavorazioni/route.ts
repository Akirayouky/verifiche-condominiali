import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { NotificationManager } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📝 Test semplice - Dati ricevuti:', body)

    const {
      condominio_id,
      tipologia_id,
      descrizione,
      sopralluoghista_id,
      data_scadenza,
      note
    } = body

    // Validazioni basilari
    if (!descrizione) {
      return NextResponse.json({
        success: false,
        error: 'Descrizione è obbligatoria'
      }, { status: 400 })
    }

    const now = new Date().toISOString()

    // Crea una lavorazione semplificata per test
    const lavorazioneTest = {
      condominio_id: condominio_id || '00000000-0000-0000-0000-000000000000', // NULL UUID per test
      user_id: sopralluoghista_id || null,
      titolo: 'Test Lavorazione',
      descrizione: descrizione,
      stato: 'aperta',
      priorita: 'media',
      data_apertura: now,
      data_scadenza: data_scadenza || null,
      note: note || null,
      allegati: JSON.stringify({
        tipologia: 'test',
        tipologia_id: tipologia_id || null,
        test: true
      })
    }

    console.log('🔨 Inserendo lavorazione test:', lavorazioneTest)

    // Prova a inserire nel database
    const { data, error } = await supabase
      .from('lavorazioni')
      .insert(lavorazioneTest)
      .select()
      .single()

    if (error) {
      console.error('❌ Errore Supabase inserimento:', error)
      return NextResponse.json({
        success: false,
        error: `Errore database: ${error.message}`,
        details: error
      }, { status: 500 })
    }

    console.log('✅ Lavorazione creata:', data.id)

    // Prova a creare notifica se c'è un sopralluoghista
    if (sopralluoghista_id) {
      try {
        const notificationManager = new NotificationManager()
        
        const notificaResult = await notificationManager.creaNotifica({
          tipo: 'nuova_assegnazione',
          titolo: 'Test Lavorazione Assegnata',
          messaggio: `Test: ${descrizione}`,
          utente_id: sopralluoghista_id,
          priorita: 'media',
          lavorazione_id: data.id,
          condominio_id: condominio_id || undefined
        })

        console.log('🔔 Notifica creata:', notificaResult ? 'SUCCESS' : 'FAILED')
      } catch (notifError) {
        console.warn('⚠️ Errore notifica (ignorato per test):', notifError)
      }
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Lavorazione test creata con successo'
    })

  } catch (error) {
    console.error('💥 Errore generale:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}