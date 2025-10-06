import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { put } from '@vercel/blob'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lavorazioneId = params.id
    const formData = await request.formData()

    console.log('📥 Completamento integrazione per:', lavorazioneId)

    // 1. Parse dati
    const datiVerificheStr = formData.get('dati_verifiche') as string
    const fotoInfoStr = formData.get('foto_info') as string
    
    const datiVerifiche = datiVerificheStr ? JSON.parse(datiVerificheStr) : {}
    const fotoInfo = fotoInfoStr ? JSON.parse(fotoInfoStr) : {}

    console.log('📋 Dati ricevuti:', { datiVerifiche, fotoInfo })

    // 2. Recupera lavorazione integrazione
    const { data: lavorazione, error: fetchError } = await supabase
      .from('lavorazioni')
      .select('*')
      .eq('id', lavorazioneId)
      .single()

    if (fetchError || !lavorazione) {
      console.error('❌ Lavorazione non trovata:', fetchError)
      return NextResponse.json(
        { error: 'Lavorazione non trovata' },
        { status: 404 }
      )
    }

    if (lavorazione.stato !== 'integrazione') {
      return NextResponse.json(
        { error: 'Questa lavorazione non è un\'integrazione in corso' },
        { status: 400 }
      )
    }

    // 3. Upload foto su blob storage
    const fotoUploadate: Record<string, string[]> = {}
    
    for (const [nomeCampo, count] of Object.entries(fotoInfo)) {
      const numFoto = count as number
      const urls: string[] = []
      
      for (let i = 0; i < numFoto; i++) {
        const file = formData.get(`foto_${nomeCampo}_${i}`) as File
        
        if (file) {
          console.log(`📤 Upload foto ${i + 1}/${numFoto} per campo ${nomeCampo}`)
          
          // Converti File in Buffer
          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          
          // Genera pathname univoco
          const timestamp = Date.now()
          const ext = file.name.split('.').pop() || 'jpg'
          const pathname = `lavorazione/${lavorazione.id_cartella}/foto/${nomeCampo}-${timestamp}-${i}.${ext}`
          
          // Upload su Vercel Blob
          const blob = await put(pathname, buffer, {
            access: 'public',
            addRandomSuffix: false
          })
          
          urls.push(blob.url)
          console.log(`✅ Foto uploaded: ${blob.url}`)
        }
      }
      
      if (urls.length > 0) {
        fotoUploadate[nomeCampo] = urls
      }
    }

    // 4. Merge dati con foto
    const datiCompleti = {
      ...datiVerifiche,
      ...fotoUploadate
    }

    console.log('💾 Dati completi da salvare:', datiCompleti)

    // 5. Aggiorna lavorazione: stato = completata + salva dati
    const { error: updateError } = await supabase
      .from('lavorazioni')
      .update({
        stato: 'completata',
        dati_verifiche: datiCompleti,
        data_completamento: new Date().toISOString()
      })
      .eq('id', lavorazioneId)

    if (updateError) {
      console.error('❌ Errore aggiornamento:', updateError)
      return NextResponse.json(
        { error: 'Errore durante il salvataggio', details: updateError },
        { status: 500 }
      )
    }

    console.log('✅ Integrazione completata con successo')

    // 6. Crea notifica per admin
    try {
      // Recupera info utente
      const { data: utente } = await supabase
        .from('users')
        .select('nome, cognome, email')
        .eq('id', lavorazione.utente_assegnato_id || lavorazione.user_id)
        .single()

      const utenteNome = utente 
        ? `${utente.nome} ${utente.cognome}` 
        : 'Sopralluoghista'

      // Recupera lavorazione originale per il titolo
      const { data: lavorazioneOriginale } = await supabase
        .from('lavorazioni')
        .select('titolo, utente_assegnato_id, user_id')
        .eq('id', lavorazione.lavorazione_originale_id)
        .single()

      const titoloOriginale = lavorazioneOriginale?.titolo || 'Lavorazione'

      await supabase
        .from('notifiche')
        .insert({
          tipo: 'lavorazione_completata',
          titolo: '✅ Integrazione Completata',
          messaggio: `${utenteNome} ha completato l'integrazione per "${titoloOriginale}"`,
          utente_id: 'a0000000-0000-0000-0000-000000000001', // Admin hardcoded
          lavorazione_id: lavorazioneId,
          priorita: 'alta',
          letta: false,
          data_creazione: new Date().toISOString()
        })

      console.log('📧 Notifica inviata all\'admin')
    } catch (notifError) {
      console.error('⚠️ Errore notifica (non bloccante):', notifError)
    }

    return NextResponse.json({
      success: true,
      message: 'Integrazione completata con successo',
      dati_salvati: Object.keys(datiCompleti).length,
      foto_caricate: Object.values(fotoUploadate).flat().length
    })

  } catch (error: any) {
    console.error('❌ Errore generico:', error)
    return NextResponse.json(
      { error: error.message || 'Errore durante il completamento dell\'integrazione' },
      { status: 500 }
    )
  }
}
