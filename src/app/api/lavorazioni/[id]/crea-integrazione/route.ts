import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lavorazioneId = params.id
    const body = await request.json()
    const { motivo_integrazione, campi_nuovi, admin_id } = body

    console.log('📝 Creazione integrazione per lavorazione:', lavorazioneId)

    // Validazione
    if (!motivo_integrazione?.trim()) {
      return NextResponse.json(
        { error: 'Motivo integrazione obbligatorio' },
        { status: 400 }
      )
    }

    if (!Array.isArray(campi_nuovi) || campi_nuovi.length === 0) {
      return NextResponse.json(
        { error: 'Deve esserci almeno un campo da integrare' },
        { status: 400 }
      )
    }

    // 1. Recupera lavorazione originale
    const { data: lavorazioneOriginale, error: fetchError } = await supabase
      .from('lavorazioni')
      .select('*')
      .eq('id', lavorazioneId)
      .single()

    if (fetchError || !lavorazioneOriginale) {
      console.error('❌ Lavorazione non trovata:', fetchError)
      return NextResponse.json(
        { error: 'Lavorazione non trovata' },
        { status: 404 }
      )
    }

    // 2. Genera nuovo ID cartella per l'integrazione
    const nuovoIdCartella = uuidv4()

    // 3. Crea nuova lavorazione di tipo 'integrazione'
    const integrazione = {
      condominio_id: lavorazioneOriginale.condominio_id,
      tipologia_id: lavorazioneOriginale.tipologia_id,
      utente_assegnato_id: lavorazioneOriginale.utente_assegnato_id,
      titolo: `${lavorazioneOriginale.titolo} - Integrazione`,
      descrizione: lavorazioneOriginale.descrizione,
      stato: 'integrazione',
      lavorazione_originale_id: lavorazioneId,
      motivo_integrazione,
      id_cartella: nuovoIdCartella,
      campi_da_ricompilare: [],
      campi_nuovi: campi_nuovi,
      dati_verifiche: {},
      created_at: new Date().toISOString()
    }

    const { data: nuovaIntegrazione, error: createError } = await supabase
      .from('lavorazioni')
      .insert(integrazione)
      .select()
      .single()

    if (createError) {
      console.error('❌ Errore creazione integrazione:', createError)
      return NextResponse.json(
        { error: 'Errore durante la creazione dell\'integrazione', details: createError },
        { status: 500 }
      )
    }

    console.log('✅ Integrazione creata:', nuovaIntegrazione.id)

    // 4. Notifica sopralluoghista
    try {
      const { data: admin } = await supabase
        .from('users')
        .select('nome, cognome')
        .eq('id', admin_id)
        .single()

      const adminNome = admin ? `${admin.nome} ${admin.cognome}` : 'Amministratore'

      await supabase
        .from('notifiche')
        .insert({
          tipo: 'lavorazione_assegnata',
          titolo: '📋 Nuova Integrazione Assegnata',
          messaggio: `${adminNome} ha richiesto un'integrazione per "${lavorazioneOriginale.titolo}". Motivo: ${motivo_integrazione}`,
          utente_id: lavorazioneOriginale.utente_assegnato_id,
          lavorazione_id: nuovaIntegrazione.id,
          priorita: 'alta',
          letta: false
        })

      console.log('📧 Notifica inviata al sopralluoghista')
    } catch (notifError) {
      console.error('⚠️ Errore invio notifica:', notifError)
    }

    return NextResponse.json({
      success: true,
      integrazione: nuovaIntegrazione
    })

  } catch (error: any) {
    console.error('❌ Errore:', error)
    return NextResponse.json(
      { error: error.message || 'Errore durante la creazione dell\'integrazione' },
      { status: 500 }
    )
  }
}
