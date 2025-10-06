import { NextRequest, NextResponse } from 'next/server'
import { supabase, dbQuery } from '@/lib/supabase'
import { NotificationManager } from '@/lib/notifications'
import { del, put } from '@vercel/blob'

/**
 * PUT /api/lavorazioni/[id]/completa-integrazione
 * 
 * Completa l'integrazione di una lavorazione riaperta
 * Merge dei campi ricompilati + aggiunta nuovi campi + gestione foto
 * 
 * Body (FormData):
 * {
 *   campi_ricompilati: JSON string Record<string, any>
 *   campi_nuovi_compilati: JSON string Record<string, any>
 *   utente_id: string
 *   foto_mantenute: JSON string string[] (pathname delle foto da mantenere)
 *   foto_rimosse: JSON string string[] (pathname delle foto da eliminare)
 *   foto_nuove_info: JSON string Record<string, number> (campo -> count)
 *   foto_nuove_{campo}_{index}: File (per ogni nuova foto)
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Parse FormData invece di JSON
    const formData = await request.formData()
    
    // Estrai dati JSON con fallback sicuri
    let campi_ricompilati: Record<string, any> = {}
    let campi_nuovi_compilati: Record<string, any> = {}
    let foto_mantenute: string[] = []
    let foto_rimosse: string[] = []
    let foto_nuove_info: Record<string, number> = {}
    
    try {
      const campiRicompStr = formData.get('campi_ricompilati')
      campi_ricompilati = campiRicompStr ? JSON.parse(campiRicompStr as string) : {}
    } catch (e) {
      console.warn('⚠️ Error parsing campi_ricompilati:', e)
    }
    
    try {
      const campiNuoviStr = formData.get('campi_nuovi_compilati')
      campi_nuovi_compilati = campiNuoviStr ? JSON.parse(campiNuoviStr as string) : {}
    } catch (e) {
      console.warn('⚠️ Error parsing campi_nuovi_compilati:', e)
    }
    
    try {
      const fotoMantStr = formData.get('foto_mantenute')
      foto_mantenute = fotoMantStr ? JSON.parse(fotoMantStr as string) : []
    } catch (e) {
      console.warn('⚠️ Error parsing foto_mantenute:', e)
    }
    
    try {
      const fotoRimStr = formData.get('foto_rimosse')
      foto_rimosse = fotoRimStr ? JSON.parse(fotoRimStr as string) : []
    } catch (e) {
      console.warn('⚠️ Error parsing foto_rimosse:', e)
    }
    
    try {
      const fotoInfoStr = formData.get('foto_nuove_info')
      foto_nuove_info = fotoInfoStr ? JSON.parse(fotoInfoStr as string) : {}
    } catch (e) {
      console.warn('⚠️ Error parsing foto_nuove_info:', e)
    }
    
    const utente_id = formData.get('utente_id') as string

    console.log('📥 Received completa-integrazione request:', {
      lavorazioneId: id,
      campiRicompilati: Object.keys(campi_ricompilati).length,
      campiNuovi: Object.keys(campi_nuovi_compilati).length,
      fotoMantenute: foto_mantenute.length,
      fotoRimosse: foto_rimosse.length,
      fotoNuoveInfo: foto_nuove_info
    })

    if (!utente_id) {
      return NextResponse.json(
        { success: false, error: 'ID utente mancante' },
        { status: 400 }
      )
    }

    // Verifica che la lavorazione esista e sia riaperta
    console.log('🔍 Step 1: Fetching lavorazione...')
    const { data: lavorazione, error: fetchError } = await dbQuery.lavorazioni.getById(id)

    if (fetchError || !lavorazione) {
      console.error('❌ Errore recupero lavorazione:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Lavorazione non trovata' },
        { status: 404 }
      )
    }
    
    console.log('✅ Lavorazione trovata:', { id: lavorazione.id, stato: lavorazione.stato })

    if (lavorazione.stato !== 'riaperta') {
      console.error('❌ Stato lavorazione non valido:', lavorazione.stato)
      return NextResponse.json(
        { 
          success: false, 
          error: `Solo le lavorazioni riaperte possono completare l'integrazione. Stato attuale: ${lavorazione.stato}` 
        },
        { status: 400 }
      )
    }

    console.log('🔍 Step 2: Parsing campi JSONB...')
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

    // Controlla campi da ricompilare (escludi file, sono gestiti separatamente)
    campiDaRicompilare.forEach((campo: any) => {
      // Skip validation per campi file
      if (campo.tipo === 'file') {
        return
      }
      
      const nomeCampo = campo.nome
      const valore = campi_ricompilati[nomeCampo]
      
      // Considera vuoto solo se undefined, null o stringa vuota
      if (valore === undefined || valore === null || valore === '') {
        campiObbligatoriMancanti.push(`Ricompilato: ${campo.label || nomeCampo}`)
      }
    })

    // Controlla nuovi campi obbligatori (escludi file)
    campiNuovi.forEach((campo: any) => {
      // Skip validation per campi file
      if (campo.tipo === 'file') {
        return
      }
      
      if (campo.required) {
        const valore = campi_nuovi_compilati[campo.nome]
        if (valore === undefined || valore === null || valore === '') {
          campiObbligatoriMancanti.push(`Nuovo: ${campo.label || campo.nome}`)
        }
      }
    })

    console.log('✅ Step 3: Validazione completata. Campi mancanti:', campiObbligatoriMancanti.length)

    if (campiObbligatoriMancanti.length > 0) {
      console.error('❌ Campi mancanti:', campiObbligatoriMancanti)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Campi obbligatori mancanti',
          campi_mancanti: campiObbligatoriMancanti
        },
        { status: 400 }
      )
    }

    // ========================================
    // GESTIONE FOTO
    // ========================================
    
    console.log('🔍 Step 4: Gestione foto...')
    const idCartella = lavorazione.id // O lavorazione.id_cartella se esiste
    const fotoPrefix = `lavorazione/${idCartella}/foto/`
    
    // 1. Elimina foto rimosse dal blob storage
    if (foto_rimosse.length > 0) {
      console.log(`🗑️ Deleting ${foto_rimosse.length} foto from blob storage...`)
      
      for (const pathname of foto_rimosse) {
        try {
          // Il pathname include già il prefisso, costruisci l'URL completo
          // Vercel Blob del() può accettare pathname o URL
          await del(pathname)
          console.log(`  ✓ Deleted: ${pathname}`)
        } catch (delError) {
          console.error(`  ✗ Failed to delete ${pathname}:`, delError)
          // Continua con le altre anche se una fallisce
        }
      }
    }
    
    // 2. Uploada nuove foto al blob storage
    const fotoNuoveUploaded: Record<string, string[]> = {} // campo -> array di URL
    
    if (Object.keys(foto_nuove_info).length > 0) {
      console.log('📤 Uploading new foto to blob storage...')
      
      for (const [nomeCampo, count] of Object.entries(foto_nuove_info)) {
        fotoNuoveUploaded[nomeCampo] = []
        
        for (let i = 0; i < count; i++) {
          const fileKey = `foto_nuove_${nomeCampo}_${i}`
          const file = formData.get(fileKey) as File
          
          if (!file) {
            console.warn(`  ⚠️ File missing: ${fileKey}`)
            continue
          }
          
          try {
            // Converti File in Buffer
            const bytes = await file.arrayBuffer()
            const buffer = Buffer.from(bytes)
            
            // Genera pathname unico
            const timestamp = Date.now()
            const extension = file.name.split('.').pop() || 'jpg'
            const pathname = `${fotoPrefix}${nomeCampo}-${timestamp}-${i}.${extension}`
            
            // Upload al blob storage
            const blob = await put(pathname, buffer, {
              access: 'public',
              contentType: file.type || 'image/jpeg',
              addRandomSuffix: false
            })
            
            fotoNuoveUploaded[nomeCampo].push(blob.url)
            console.log(`  ✓ Uploaded: ${pathname} -> ${blob.url}`)
          } catch (uploadError) {
            console.error(`  ✗ Failed to upload ${fileKey}:`, uploadError)
            // Continua con le altre
          }
        }
      }
    }
    
    console.log('✅ Foto processing complete:', {
      rimosse: foto_rimosse.length,
      nuoveUploaded: Object.values(fotoNuoveUploaded).flat().length,
      mantenute: foto_mantenute.length
    })

    // ========================================
    // MERGE DATI
    // ========================================

    // Merge dei dati esistenti con i nuovi
    const datiEsistenti = lavorazione.dati_verifiche || {}
    
    // Aggiorna i campi ricompilati e nuovi
    const datiAggiornati = {
      ...datiEsistenti,
      ...campi_ricompilati,
      ...campi_nuovi_compilati,
    }
    
    // Aggiungi le nuove foto uploaded agli URL dei campi corrispondenti
    Object.entries(fotoNuoveUploaded).forEach(([nomeCampo, urls]) => {
      if (urls.length > 0) {
        // Se il campo già esiste, aggiungi agli URL esistenti, altrimenti crea nuovo array
        const existingUrls = Array.isArray(datiAggiornati[nomeCampo]) 
          ? datiAggiornati[nomeCampo] 
          : []
        
        datiAggiornati[nomeCampo] = [...existingUrls, ...urls]
      }
    })

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
    const totalFotoNuove = Object.values(fotoNuoveUploaded).flat().length
    
    if (!adminsError && admins && admins.length > 0) {
      const notificationManager = NotificationManager.getInstance()
      
      for (const admin of admins) {
        await notificationManager.creaNotifica({
          tipo: 'integrazione_completata' as const,
          titolo: '✅ Integrazione Lavorazione Completata',
          messaggio: `${sopralluoghista?.nome || 'Sopralluoghista'} ${sopralluoghista?.cognome || ''} ha completato l'integrazione della lavorazione "${condominio?.nome || 'N/A'}". ${numCampiRicompilati} campo/i ricompilati, ${numCampiNuovi} nuovo/i campo/i aggiunti${totalFotoNuove > 0 ? `, ${totalFotoNuove} foto aggiunte` : ''}.`,
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
      foto_rimosse: foto_rimosse.length,
      foto_aggiunte: totalFotoNuove,
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
        foto_rimosse: foto_rimosse.length,
        foto_aggiunte: totalFotoNuove,
        totale_campi: Object.keys(datiAggiornati).length
      }
    })

  } catch (error) {
    console.error('❌ Errore completamento integrazione:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Errore interno del server',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    )
  }
}
