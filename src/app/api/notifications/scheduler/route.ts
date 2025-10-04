/**
 * API Route per gestione reminder automatici e controllo scadenze
 * POST /api/notifications/scheduler
 */

import { NextRequest, NextResponse } from 'next/server'
import { controllaScadenzeLavorazioni, NotificationManager, getAdminUsers } from '@/lib/notifications'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    console.log('🔄 Scheduler notifiche - Action:', action)

    switch (action) {
      case 'check-scadenze':
        console.log('⏰ Controllo scadenze lavorazioni...')
        await controllaScadenzeLavorazioni()
        
        return NextResponse.json({
          success: true,
          message: 'Controllo scadenze completato'
        })

      case 'send-daily-reminders':
        console.log('📅 Invio reminder giornalieri...')
        const risultatoReminder = await inviaReminderGiornalieri()
        
        return NextResponse.json({
          success: true,
          data: risultatoReminder,
          message: 'Reminder giornalieri inviati'
        })

      case 'process-notifications':
        console.log('🔄 Processamento notifiche in coda...')
        await processaNotificheInCoda()
        
        return NextResponse.json({
          success: true,
          message: 'Processamento notifiche completato'
        })

      case 'cleanup':
        console.log('🧹 Cleanup notifiche vecchie...')
        await cleanupNotificheVecchie()
        
        return NextResponse.json({
          success: true,
          message: 'Cleanup completato'
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Action non valida' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ Errore scheduler notifiche:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Errore interno scheduler',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}

/**
 * Invia reminder giornalieri configurati
 */
async function inviaReminderGiornalieri() {
  console.log('📅 Invio reminder giornalieri configurati')

  try {
    // Query reminder attivi per oggi
    const oggi = new Date()
    const oraAttuale = oggi.toTimeString().slice(0, 5) // HH:MM
    const giornoSettimana = oggi.getDay() // 0=domenica, 1=lunedì, etc.

    const { data: reminders, error } = await supabase
      .from('reminder_configs')
      .select(`
        *, 
        users!inner(id, nome, cognome, email, role)
      `)
      .eq('attivo', true)
      .contains('giorni_settimana', [giornoSettimana])
      .lte('ora_invio', oraAttuale)
      .or(`ultima_esecuzione.is.null,ultima_esecuzione.lt.${oggi.toISOString().slice(0, 10)}T00:00:00`)

    if (error) {
      throw error
    }

    if (!reminders || reminders.length === 0) {
      console.log('✅ Nessun reminder da inviare oggi')
      return { reminderInviati: 0 }
    }

    console.log(`📬 Elaborazione di ${reminders.length} reminder`)

    const notificationManager = NotificationManager.getInstance()
    let reminderInviati = 0

    for (const reminder of reminders) {
      try {
        let messaggio = ''
        
        switch (reminder.tipo) {
          case 'scadenza_lavorazioni':
            messaggio = await generaMessaggioScadenzeLavorazioni(reminder.utente_id, reminder.giorni_anticipo || 1)
            break
            
          case 'controllo_giornaliero':
            messaggio = await generaMessaggioControlloGiornaliero(reminder.utente_id)
            break
            
          case 'report_settimanale':
            messaggio = await generaMessaggioReportSettimanale(reminder.utente_id)
            break
            
          case 'personalizzato':
            messaggio = reminder.descrizione || 'Reminder personalizzato'
            break
        }

        if (messaggio) {
          await notificationManager.creaReminderPersonalizzato(reminder, messaggio)
          
          // Aggiorna ultima_esecuzione
          await supabase
            .from('reminder_configs')
            .update({ 
              ultima_esecuzione: new Date().toISOString(),
              prossima_esecuzione: calcolaProssimaEsecuzione(reminder)
            })
            .eq('id', reminder.id)

          reminderInviati++
          console.log(`✅ Reminder inviato: ${reminder.nome} -> ${reminder.users.nome}`)
        }

      } catch (error) {
        console.error(`❌ Errore reminder ${reminder.id}:`, error)
      }
    }

    console.log(`🎉 Reminder giornalieri completati: ${reminderInviati}/${reminders.length}`)
    
    return { reminderInviati, totaliConfigurati: reminders.length }

  } catch (error) {
    console.error('❌ Errore invio reminder giornalieri:', error)
    throw error
  }
}

/**
 * Genera messaggio per scadenze lavorazioni
 */
async function generaMessaggioScadenzeLavorazioni(utenteId: string, giorniAnticipo: number): Promise<string> {
  const dataInizio = new Date()
  const dataFine = new Date()
  dataFine.setDate(dataInizio.getDate() + giorniAnticipo)

  const { data: lavorazioni, error } = await supabase
    .from('lavorazioni')
    .select(`
      id, titolo, data_scadenza, priorita,
      condomini!inner(nome)
    `)
    .eq('user_id', utenteId)
    .in('stato', ['da_eseguire', 'in_corso', 'riaperta'])
    .gte('data_scadenza', dataInizio.toISOString())
    .lte('data_scadenza', dataFine.toISOString())

  if (error || !lavorazioni || lavorazioni.length === 0) {
    return '' // Non inviare reminder se non ci sono scadenze
  }

  const lavorazioniUrgenti = lavorazioni.filter(l => l.priorita === 'urgente').length
  const lavorazioniAlte = lavorazioni.filter(l => l.priorita === 'alta').length

  let messaggio = `Hai ${lavorazioni.length} lavorazioni in scadenza nei prossimi ${giorniAnticipo} giorni`
  
  if (lavorazioniUrgenti > 0) {
    messaggio += ` (${lavorazioniUrgenti} urgenti)`
  }
  
  if (lavorazioniAlte > 0) {
    messaggio += ` (${lavorazioniAlte} priorità alta)`
  }

  messaggio += '.\n\nLavorazioni in scadenza:'
  
  lavorazioni.slice(0, 5).forEach((lav, idx) => {
    const scadenza = new Date(lav.data_scadenza).toLocaleDateString('it-IT')
    const nomeCondominio = (lav.condomini as any)?.nome || 'N/A'
    messaggio += `\n${idx + 1}. ${lav.titolo} - ${nomeCondominio} (${scadenza})`
  })

  if (lavorazioni.length > 5) {
    messaggio += `\n... e altre ${lavorazioni.length - 5} lavorazioni`
  }

  return messaggio
}

/**
 * Genera messaggio controllo giornaliero
 */
async function generaMessaggioControlloGiornaliero(utenteId: string): Promise<string> {
  const { data: stats, error } = await supabase
    .from('lavorazioni')
    .select('stato, priorita')
    .eq('user_id', utenteId)

  if (error || !stats) {
    return 'Controllo giornaliero: impossibile recuperare statistiche'
  }

  const totali = stats.length
  const daEseguire = stats.filter(s => s.stato === 'da_eseguire').length
  const inCorso = stats.filter(s => s.stato === 'in_corso').length
  const urgenti = stats.filter(s => s.priorita === 'urgente' && ['da_eseguire', 'in_corso'].includes(s.stato)).length

  return `📊 Controllo giornaliero:
• ${totali} lavorazioni totali
• ${daEseguire} da eseguire
• ${inCorso} in corso
• ${urgenti} urgenti attive

${urgenti > 0 ? '⚠️ Priorità alle lavorazioni urgenti!' : '✅ Nessuna urgenza in corso'}`
}

/**
 * Genera messaggio report settimanale
 */
async function generaMessaggioReportSettimanale(utenteId: string): Promise<string> {
  const settimanaFa = new Date()
  settimanaFa.setDate(settimanaFa.getDate() - 7)

  const { data: completate, error } = await supabase
    .from('lavorazioni')
    .select('id, titolo, data_completamento')
    .eq('user_id', utenteId)
    .eq('stato', 'completata')
    .gte('data_completamento', settimanaFa.toISOString())

  const numeroCompletate = completate?.length || 0

  return `📈 Report settimanale:
• ${numeroCompletate} lavorazioni completate
• Periodo: ${settimanaFa.toLocaleDateString('it-IT')} - ${new Date().toLocaleDateString('it-IT')}

${numeroCompletate > 0 ? '🎉 Ottimo lavoro questa settimana!' : '💪 Continua così per la prossima settimana!'}`
}

/**
 * Calcola prossima esecuzione reminder
 */
function calcolaProssimaEsecuzione(reminder: any): string {
  const prossima = new Date()
  
  switch (reminder.frequenza) {
    case 'giornaliera':
      prossima.setDate(prossima.getDate() + 1)
      break
    case 'settimanale':
      prossima.setDate(prossima.getDate() + 7)
      break
    case 'mensile':
      prossima.setMonth(prossima.getMonth() + 1)
      break
    default:
      prossima.setDate(prossima.getDate() + 1)
  }

  // Imposta ora di invio
  const [ore, minuti] = reminder.ora_invio.split(':')
  prossima.setHours(parseInt(ore), parseInt(minuti), 0, 0)

  return prossima.toISOString()
}

/**
 * Processa notifiche in coda per invio email/SMS
 */
async function processaNotificheInCoda() {
  // TODO: Implementare invio email/SMS per notifiche urgenti
  console.log('📧 Processamento notifiche per email/SMS (TODO)')
}

/**
 * Cleanup notifiche vecchie
 */
async function cleanupNotificheVecchie() {
  const { error } = await supabase.rpc('cleanup_old_notifications')
  
  if (error) {
    console.error('❌ Errore cleanup:', error)
    throw error
  }
  
  console.log('✅ Cleanup notifiche completato')
}

// GET per info scheduler
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Scheduler Notifiche API',
    endpoints: {
      'POST /api/notifications/scheduler': {
        actions: {
          'check-scadenze': 'Controlla scadenze lavorazioni imminenti',
          'send-daily-reminders': 'Invia reminder giornalieri configurati',
          'process-notifications': 'Processa notifiche per email/SMS',
          'cleanup': 'Rimuovi notifiche vecchie'
        }
      }
    },
    info: 'Configurare cron job per esecuzione automatica'
  })
}