import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/supabase'
import { NotificationManager, getAdminUsers } from '@/lib/notifications'

// GET - Ottieni lavorazione per ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data, error } = await dbQuery.lavorazioni.getById(id)

    if (error) {
      console.error('Errore Supabase GET lavorazione:', error)
      return NextResponse.json(
        { success: false, error: 'Errore nel recupero della lavorazione' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Lavorazione non trovata' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('Errore GET lavorazione:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nel recupero della lavorazione' },
      { status: 500 }
    )
  }
}

// PUT - Aggiorna lavorazione
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { azione, dati } = body

    // Ottieni la lavorazione esistente
    const { data: lavorazioneEsistente, error: getError } = await dbQuery.lavorazioni.getById(id)

    if (getError) {
      console.error('Errore Supabase GET lavorazione esistente:', getError)
      return NextResponse.json(
        { success: false, error: 'Errore nel recupero della lavorazione' },
        { status: 500 }
      )
    }

    if (!lavorazioneEsistente) {
      return NextResponse.json(
        { success: false, error: 'Lavorazione non trovata' },
        { status: 404 }
      )
    }

    const now = new Date().toISOString()
    let updateData: any = {}

    switch (azione) {
      case 'completa':
        if (lavorazioneEsistente.stato === 'completata') {
          return NextResponse.json(
            { success: false, error: 'La lavorazione è già completata' },
            { status: 400 }
          )
        }

        updateData = {
          stato: 'completata'
          // Rimosso data_chiusura perché non esiste nella tabella
        }
        
        // Aggiungi note se presenti
        if (dati && dati.note) {
          const noteEsistenti = lavorazioneEsistente.note || ''
          updateData.note = noteEsistenti ? `${noteEsistenti}\n${dati.note}` : dati.note
        }
        
        // Salva dati verifica nei metadati se presenti
        if (dati && dati.dati_verifica) {
          try {
            const metadataEsistenti = lavorazioneEsistente.allegati ? 
              JSON.parse(lavorazioneEsistente.allegati) : {}
            
            updateData.allegati = JSON.stringify({
              ...metadataEsistenti,
              dati_verifica_completamento: dati.dati_verifica,
              data_completamento: now
            })
          } catch (e) {
            // Se i metadati esistenti non sono JSON valido, crea nuovi
            updateData.allegati = JSON.stringify({
              dati_verifica_completamento: dati.dati_verifica,
              data_completamento: now
            })
          }
        }
        
        // Crea notifica per completamento lavorazione (per tutti gli admin)
        try {
          const { data: condominio } = await dbQuery.condomini.getById(lavorazioneEsistente.condominio_id)
          const notificationManager = new NotificationManager()
          
          // Ottieni lista admin
          const adminUsers = await getAdminUsers()
          console.log('📧 Inviando notifica di completamento a', adminUsers.length, 'admin')
          
          // Crea notifiche per tutti gli admin
          if (adminUsers.length > 0) {
            const notifiche = await notificationManager.notificaLavorazioneCompletata(
              {
                id: lavorazioneEsistente.id,
                titolo: lavorazioneEsistente.titolo || lavorazioneEsistente.descrizione,
                condominio_id: lavorazioneEsistente.condominio_id
              },
              adminUsers
            )
            console.log('✅ Notifiche completamento create:', notifiche.length)
          } else {
            console.warn('⚠️ Nessun admin trovato per notifica completamento')
          }
        } catch (notifError) {
          console.error('⚠️ Errore nella creazione della notifica di completamento:', notifError)
        }
        
        break

      case 'inizia':
        if (lavorazioneEsistente.stato !== 'aperta') {
          return NextResponse.json(
            { success: false, error: 'Solo le lavorazioni aperte possono essere iniziate' },
            { status: 400 }
          )
        }

        updateData = {
          stato: 'in_corso'
          // Rimosso data_inizio perché non esiste nella tabella
        }
        
        if (dati && dati.nota) {
          const noteEsistenti = lavorazioneEsistente.note || ''
          updateData.note = noteEsistenti ? `${noteEsistenti}\n${dati.nota}` : dati.nota
        }
        break

      case 'riapri':
        console.log('🔄 API Riapertura - Stato attuale:', lavorazioneEsistente.stato)
        
        if (lavorazioneEsistente.stato !== 'completata') {
          console.log('❌ Errore riapertura: stato non è completata')
          return NextResponse.json(
            { success: false, error: 'Solo le lavorazioni completate possono essere riaperte' },
            { status: 400 }
          )
        }

        updateData = {
          stato: 'riaperta'
          // Rimosso data_riapertura perché non esiste nella tabella
        }
        
        console.log('📝 Motivo riapertura:', dati?.motivo)
        
        // Aggiungi nota di riapertura se presente motivo
        if (dati && dati.motivo) {
          const noteEsistenti = lavorazioneEsistente.note || ''
          updateData.note = noteEsistenti ? `${noteEsistenti}\nRiapertura: ${dati.motivo}` : `Riapertura: ${dati.motivo}`
          console.log('✅ Note aggiornate:', updateData.note)
        }
        
        console.log('🔄 UpdateData riapertura:', updateData)
        break

      case 'assegna':
        if (!dati || !dati.utenteAssegnato) {
          return NextResponse.json(
            { success: false, error: 'Utente assegnato obbligatorio per questa azione' },
            { status: 400 }
          )
        }
        updateData = {
          // Compatibilità con nuovo schema (user_id) e vecchio (utente_assegnato)
          user_id: dati.utenteAssegnato,
          utente_assegnato: dati.utenteAssegnato // Retrocompatibilità
          // Rimosso data_assegnazione perché non esiste nella tabella
        }
        break

      case 'aggiungi_nota':
        if (!dati || !dati.nota) {
          return NextResponse.json(
            { success: false, error: 'Nota obbligatoria per questa azione' },
            { status: 400 }
          )
        }
        updateData = {
          note: typeof lavorazioneEsistente.note === 'string'
            ? (lavorazioneEsistente.note + '\n' + dati.nota)
            : [...(lavorazioneEsistente.note || []), dati.nota].join('\n')
        }
        break

      case 'aggiorna':
        updateData = {
          ...dati
          // Rimosso data_ultima_modifica perché non esiste nella tabella
        }
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Azione non valida' },
          { status: 400 }
        )
    }

    console.log('Tentativo di aggiornamento lavorazione ID:', id)
    console.log('Dati di aggiornamento:', JSON.stringify(updateData, null, 2))
    
    const { data: updatedData, error: updateError } = await dbQuery.lavorazioni.update(id, updateData)

    if (updateError) {
      console.error('Errore Supabase UPDATE lavorazione:', updateError)
      console.error('Dettagli errore:', JSON.stringify(updateError, null, 2))
      return NextResponse.json(
        { success: false, error: `Errore nell'aggiornamento della lavorazione: ${updateError.message}` },
        { status: 500 }
      )
    }
    
    console.log('Aggiornamento completato con successo:', updatedData)

    return NextResponse.json({
      success: true,
      data: updatedData,
      message: 'Lavorazione aggiornata con successo'
    })

  } catch (error) {
    console.error('Errore PUT lavorazione:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nell\'aggiornamento della lavorazione' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina lavorazione
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { error } = await dbQuery.lavorazioni.delete(id)

    if (error) {
      console.error('Errore Supabase DELETE lavorazione:', error)
      return NextResponse.json(
        { success: false, error: 'Errore nell\'eliminazione della lavorazione' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Lavorazione eliminata con successo'
    })

  } catch (error) {
    console.error('Errore DELETE lavorazione:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nell\'eliminazione della lavorazione' },
      { status: 500 }
    )
  }
}