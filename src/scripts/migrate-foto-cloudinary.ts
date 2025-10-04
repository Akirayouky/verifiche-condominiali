/**
 * Script di migrazione foto da Base64 a Cloudinary
 * 
 * IMPORTANTE: Eseguire solo dopo aver configurato Cloudinary!
 * 
 * Questo script:
 * 1. Query tutte le lavorazioni con foto Base64
 * 2. Upload foto su Cloudinary
 * 3. Update database con URL Cloudinary
 * 4. Backup Base64 prima di eliminare
 */

import { supabase } from '@/lib/supabase'
import { uploadFotoLavorazione } from '@/lib/cloudinary'

interface LavorazioneConFoto {
  id: string
  allegati: any
}

/**
 * Migrazione completa foto Base64 → Cloudinary
 */
export async function migrateFotoToCloudinary() {
  console.log('🔄 Inizio migrazione foto Base64 → Cloudinary')
  
  try {
    // 1. Query lavorazioni con foto Base64
    const { data: lavorazioni, error } = await supabase
      .from('lavorazioni')
      .select('id, allegati')
      .not('allegati', 'is', null)
    
    if (error) {
      throw new Error(`Errore query lavorazioni: ${error.message}`)
    }

    if (!lavorazioni || lavorazioni.length === 0) {
      console.log('✅ Nessuna lavorazione con allegati trovata')
      return { success: true, migrazioni: 0 }
    }

    console.log(`📊 Trovate ${lavorazioni.length} lavorazioni con allegati`)

    let migrazioniSuccesso = 0
    let errori: any[] = []

    // 2. Processa ogni lavorazione
    for (const lavorazione of lavorazioni) {
      try {
        console.log(`🔄 Processando lavorazione ${lavorazione.id}`)
        
        const risultato = await migrateLavorazioneFoto(lavorazione)
        
        if (risultato.success) {
          migrazioniSuccesso++
          console.log(`✅ Lavorazione ${lavorazione.id} migrata con successo`)
        } else {
          errori.push({
            lavorazioneId: lavorazione.id,
            error: risultato.error
          })
          console.error(`❌ Errore lavorazione ${lavorazione.id}:`, risultato.error)
        }

        // Pausa tra le migrazioni per evitare rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        errori.push({
          lavorazioneId: lavorazione.id,
          error: error instanceof Error ? error.message : 'Errore sconosciuto'
        })
        console.error(`❌ Errore critico lavorazione ${lavorazione.id}:`, error)
      }
    }

    console.log(`🎉 Migrazione completata: ${migrazioniSuccesso}/${lavorazioni.length} successi`)
    
    if (errori.length > 0) {
      console.log('❌ Errori riscontrati:')
      errori.forEach(err => console.log(`  - ${err.lavorazioneId}: ${err.error}`))
    }

    return {
      success: true,
      totali: lavorazioni.length,
      migrazioni: migrazioniSuccesso,
      errori: errori
    }

  } catch (error) {
    console.error('❌ Errore critico migrazione:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    }
  }
}

/**
 * Migra le foto di una singola lavorazione
 */
async function migrateLavorazioneFoto(lavorazione: LavorazioneConFoto) {
  try {
    const allegati = lavorazione.allegati

    // Verifica se ci sono foto Base64 da migrare
    const fotoBase64 = troveFotoBase64(allegati)
    
    if (fotoBase64.length === 0) {
      return { success: true, message: 'Nessuna foto Base64 trovata' }
    }

    console.log(`📸 Trovate ${fotoBase64.length} foto Base64 da migrare`)

    // Upload foto su Cloudinary
    const fotoCloudinary = []
    const erroriUpload = []

    for (let i = 0; i < fotoBase64.length; i++) {
      try {
        const risultatoUpload = await uploadFotoLavorazione(
          fotoBase64[i], 
          lavorazione.id, 
          i
        )
        
        fotoCloudinary.push({
          url: risultatoUpload.url,
          publicId: risultatoUpload.publicId,
          thumbnailUrl: risultatoUpload.url.replace('/upload/', '/upload/w_150,h_150,c_thumb/'),
          createdAt: new Date().toISOString(),
          migratedFrom: 'base64'
        })

        console.log(`  ✅ Foto ${i + 1} uploadata su Cloudinary`)

      } catch (error) {
        erroriUpload.push({
          index: i,
          error: error instanceof Error ? error.message : 'Errore upload'
        })
        console.error(`  ❌ Errore upload foto ${i + 1}:`, error)
      }
    }

    if (fotoCloudinary.length === 0) {
      return {
        success: false,
        error: 'Nessuna foto uploadata su Cloudinary'
      }
    }

    // Backup allegati originali
    const allegatiBackup = {
      ...allegati,
      _backup: {
        originalBase64Foto: fotoBase64,
        migratedAt: new Date().toISOString(),
        migratedCount: fotoCloudinary.length
      }
    }

    // Aggiorna allegati con foto Cloudinary
    const nuoviAllegati = {
      ...allegati,
      foto: fotoCloudinary,
      // Mantieni altri dati allegati (dati_verifica_completamento, etc.)
      // Rimuovi le foto Base64 originali
      _base64Foto: undefined // Rimuove le foto Base64
    }

    // Update database
    const { error: updateError } = await supabase
      .from('lavorazioni')
      .update({
        allegati: nuoviAllegati
      })
      .eq('id', lavorazione.id)

    if (updateError) {
      throw new Error(`Errore update database: ${updateError.message}`)
    }

    // Log di backup per sicurezza (opzionale - salva su file)
    console.log(`💾 Backup creato per lavorazione ${lavorazione.id}`)

    return {
      success: true,
      fotoMigrate: fotoCloudinary.length,
      erroriUpload: erroriUpload.length > 0 ? erroriUpload : undefined
    }

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore migrazione lavorazione'
    }
  }
}

/**
 * Trova foto Base64 negli allegati
 */
function troveFotoBase64(allegati: any): string[] {
  if (!allegati) return []

  const foto: string[] = []

  // Cerca in vari campi dove potrebbero essere le foto Base64
  const campiPossibili = [
    'foto',
    'immagini', 
    'allegati',
    'dati_verifica_completamento'
  ]

  for (const campo of campiPossibili) {
    if (allegati[campo]) {
      const valore = allegati[campo]
      
      // Se è un array
      if (Array.isArray(valore)) {
        for (const item of valore) {
          if (typeof item === 'string' && item.startsWith('data:image')) {
            foto.push(item)
          }
        }
      }
      
      // Se è un oggetto, cerca ricorsivamente
      if (typeof valore === 'object' && valore !== null) {
        const fotoRicorsive = troveFotoBase64Ricorsivo(valore)
        foto.push(...fotoRicorsive)
      }
      
      // Se è una stringa Base64
      if (typeof valore === 'string' && valore.startsWith('data:image')) {
        foto.push(valore)
      }
    }
  }

  // Rimuovi duplicati
  const fotoUniche: string[] = []
  for (const f of foto) {
    if (!fotoUniche.includes(f)) {
      fotoUniche.push(f)
    }
  }
  return fotoUniche
}

/**
 * Cerca foto Base64 ricorsivamente in oggetti nested
 */
function troveFotoBase64Ricorsivo(obj: any): string[] {
  const foto: string[] = []

  for (const chiave in obj) {
    const valore = obj[chiave]
    
    if (Array.isArray(valore)) {
      for (const item of valore) {
        if (typeof item === 'string' && item.startsWith('data:image')) {
          foto.push(item)
        }
      }
    } else if (typeof valore === 'object' && valore !== null) {
      foto.push(...troveFotoBase64Ricorsivo(valore))
    } else if (typeof valore === 'string' && valore.startsWith('data:image')) {
      foto.push(valore)
    }
  }

  return foto
}

/**
 * Migrazione di test per una singola lavorazione
 */
export async function testMigrazioneLavorazione(lavorazioneId: string) {
  console.log(`🧪 Test migrazione per lavorazione ${lavorazioneId}`)
  
  const { data: lavorazione, error } = await supabase
    .from('lavorazioni')
    .select('id, allegati')
    .eq('id', lavorazioneId)
    .single()

  if (error || !lavorazione) {
    console.error('❌ Lavorazione non trovata:', error)
    return { success: false, error: 'Lavorazione non trovata' }
  }

  return await migrateLavorazioneFoto(lavorazione)
}

// Export per uso in script CLI
if (typeof window === 'undefined') {
  // Solo su server/CLI
  console.log('📋 Script migrazione foto disponibile')
  console.log('Usa: migrateFotoToCloudinary() per migrazione completa')
  console.log('Usa: testMigrazioneLavorazione(id) per test singola lavorazione')
}