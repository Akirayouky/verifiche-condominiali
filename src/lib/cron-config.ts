/**
 * Cron Job Configuration per automazione notifiche
 * Script per Vercel Cron Jobs o esecuzione locale
 */

import { supabase } from '@/lib/supabase'

// Configurazione cron jobs
export const cronJobs = {
  // Ogni 15 minuti - controllo scadenze urgenti
  '*/15 * * * *': async () => {
    console.log('🔄 Cron: Controllo scadenze urgenti')
    await fetch('/api/notifications/scheduler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'check-scadenze' })
    })
  },

  // Ogni giorno alle 8:00 - reminder giornalieri
  '0 8 * * *': async () => {
    console.log('📅 Cron: Reminder giornalieri')
    await fetch('/api/notifications/scheduler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send-daily-reminders' })
    })
  },

  // Ogni giorno alle 23:00 - cleanup notifiche vecchie
  '0 23 * * *': async () => {
    console.log('🧹 Cron: Cleanup notifiche')
    await fetch('/api/notifications/scheduler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cleanup' })
    })
  },

  // Ogni 30 minuti - processamento code email/SMS
  '*/30 * * * *': async () => {
    console.log('📧 Cron: Processamento notifiche')
    await fetch('/api/notifications/scheduler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'process-notifications' })
    })
  }
}

/**
 * Funzione per test manuale dei cron jobs
 */
export async function testCronJobs() {
  console.log('🧪 Test manuale cron jobs')
  
  try {
    // Test controllo scadenze
    console.log('1. Test controllo scadenze...')
    const scadenzeResponse = await fetch('http://localhost:3000/api/notifications/scheduler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'check-scadenze' })
    })
    const scadenzeResult = await scadenzeResponse.json()
    console.log('   Risultato:', scadenzeResult)

    // Test reminder giornalieri
    console.log('2. Test reminder giornalieri...')
    const reminderResponse = await fetch('http://localhost:3000/api/notifications/scheduler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'send-daily-reminders' })
    })
    const reminderResult = await reminderResponse.json()
    console.log('   Risultato:', reminderResult)

    // Test cleanup
    console.log('3. Test cleanup...')
    const cleanupResponse = await fetch('http://localhost:3000/api/notifications/scheduler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cleanup' })
    })
    const cleanupResult = await cleanupResponse.json()
    console.log('   Risultato:', cleanupResult)

    console.log('✅ Test cron jobs completato')

  } catch (error) {
    console.error('❌ Errore test cron jobs:', error)
  }
}

/**
 * Configurazione per Vercel Cron Jobs
 * File: vercel.json
 */
export const vercelCronConfig = {
  "crons": [
    {
      "path": "/api/notifications/scheduler",
      "schedule": "*/15 * * * *"
    }
  ]
}

/**
 * Setup reminder di base per nuovo utente
 */
export async function setupDefaultReminders(userId: string) {
  console.log('🔧 Setup reminder default per utente:', userId)

  const defaultReminders = [
    {
      nome: 'Controllo scadenze giornaliero',
      descrizione: 'Verifica giornaliera delle lavorazioni in scadenza',
      tipo: 'scadenza_lavorazioni',
      frequenza: 'giornaliera',
      ora_invio: '08:00',
      giorni_settimana: [1, 2, 3, 4, 5], // Lunedì-Venerdì
      giorni_anticipo: 3,
      attivo: true,
      utente_id: userId
    },
    {
      nome: 'Report settimanale',
      descrizione: 'Riassunto settimanale delle attività',
      tipo: 'report_settimanale',
      frequenza: 'settimanale',
      ora_invio: '09:00',
      giorni_settimana: [1], // Solo Lunedì
      attivo: true,
      utente_id: userId
    }
  ]

  try {
    const { data, error } = await supabase
      .from('reminder_configs')
      .insert(defaultReminders)

    if (error) {
      throw error
    }

    console.log('✅ Reminder default creati')
    return data

  } catch (error) {
    console.error('❌ Errore creazione reminder default:', error)
    throw error
  }
}

/**
 * Statistiche sistema notifiche
 */
export async function getNotificationStats() {
  try {
    // Conteggio notifiche per stato
    const { data: notifiche, error: notificheError } = await supabase
      .from('notifiche')
      .select('stato, tipo, priorita')

    if (notificheError) throw notificheError

    // Conteggio reminder attivi
    const { data: reminders, error: remindersError } = await supabase
      .from('reminder_configs')
      .select('tipo, attivo, frequenza')

    if (remindersError) throw remindersError

    const stats = {
      notifiche: {
        totali: notifiche?.length || 0,
        nonLette: notifiche?.filter(n => n.stato === 'non_letta').length || 0,
        urgenti: notifiche?.filter(n => n.priorita === 'urgente').length || 0,
        scadenze: notifiche?.filter(n => n.tipo === 'scadenza').length || 0,
        assegnazioni: notifiche?.filter(n => n.tipo === 'nuova_assegnazione').length || 0
      },
      reminders: {
        totali: reminders?.length || 0,
        attivi: reminders?.filter(r => r.attivo).length || 0,
        giornalieri: reminders?.filter(r => r.frequenza === 'giornaliera').length || 0,
        settimanali: reminders?.filter(r => r.frequenza === 'settimanale').length || 0
      },
      sistema: {
        ultimoControllo: new Date().toISOString(),
        schedulerAttivo: true
      }
    }

    return stats

  } catch (error) {
    console.error('❌ Errore recupero statistiche:', error)
    throw error
  }
}

// Export per uso esterno
if (typeof window === 'undefined') {
  // Solo server-side
  module.exports = {
    cronJobs,
    testCronJobs,
    setupDefaultReminders,
    getNotificationStats
  }
}