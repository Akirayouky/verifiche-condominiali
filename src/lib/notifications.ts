/**
 * Sistema di gestione notifiche real-time
 * Gestisce creazione, invio e persistenza delle notifiche
 */

import { supabase } from '@/lib/supabase'
import { Notifica, ReminderConfig, NotificaAzione } from '@/lib/types'

/**
 * Classe per gestione notifiche centralizzata
 */
export class NotificationManager {
  private static instance: NotificationManager
  private subscribers: Map<string, (notification: Notifica) => void> = new Map()

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager()
    }
    return NotificationManager.instance
  }

  /**
   * Crea una nuova notifica nel database
   */
  async creaNotifica(datiNotifica: Omit<Notifica, 'id' | 'data_creazione' | 'letta'>): Promise<Notifica | null> {
    try {
      const nuovaNotifica: Partial<Notifica> = {
        ...datiNotifica,
        letta: false,
        data_creazione: new Date().toISOString(),
      }

      console.log('📢 Creando notifica:', nuovaNotifica)

      const { data, error } = await supabase
        .from('notifiche')
        .insert([nuovaNotifica])
        .select()
        .single()

      if (error) {
        console.error('❌ Errore creazione notifica:', error)
        return null
      }

      const notifica = data as Notifica
      console.log('✅ Notifica creata:', notifica.id)

      // Invia notifica real-time ai subscriber
      this.inviaNotificaRealTime(notifica)

      return notifica

    } catch (error) {
      console.error('❌ Errore critico creazione notifica:', error)
      return null
    }
  }

  /**
   * Notifica per scadenza lavorazione imminente
   */
  async notificaScadenzaImminente(lavorazione: any, giorniAnticipo: number): Promise<Notifica | null> {
    const dataScadenza = new Date(lavorazione.data_scadenza)
    const dataNotifica = new Date()
    dataNotifica.setDate(dataNotifica.getDate() + giorniAnticipo)

    return await this.creaNotifica({
      tipo: 'scadenza_imminente',
      titolo: `⏰ Scadenza lavorazione tra ${giorniAnticipo} giorni`,
      messaggio: `La lavorazione "${lavorazione.titolo}" nel condominio scade il ${dataScadenza.toLocaleDateString('it-IT')}`,
      utente_id: lavorazione.user_id,
      lavorazione_id: lavorazione.id,
      condominio_id: lavorazione.condominio_id,
      priorita: giorniAnticipo <= 1 ? 'urgente' : giorniAnticipo <= 3 ? 'alta' : 'media',
      data_scadenza: lavorazione.data_scadenza
    })
  }

  /**
   * Notifica per nuova assegnazione sopralluoghista
   */
  async notificaNuovaAssegnazione(lavorazione: any, utenteAssegnato: string): Promise<Notifica | null> {
    return await this.creaNotifica({
      tipo: 'nuova_assegnazione',
      titolo: '📋 Nuova lavorazione assegnata',
      messaggio: `Ti è stata assegnata la lavorazione "${lavorazione.titolo}" con priorità ${lavorazione.priorita}`,
      utente_id: utenteAssegnato,
      lavorazione_id: lavorazione.id,
      condominio_id: lavorazione.condominio_id,
      priorita: lavorazione.priorita === 'urgente' ? 'urgente' : 'alta'
    })
  }

  /**
   * Notifica per lavorazione completata (per admin)
   */
  async notificaLavorazioneCompletata(lavorazione: any, adminUsers: string[]): Promise<Notifica[]> {
    const notifiche: Notifica[] = []

    for (const adminId of adminUsers) {
      const notifica = await this.creaNotifica({
        tipo: 'lavorazione_completata',
        titolo: '✅ Lavorazione completata',
        messaggio: `La lavorazione "${lavorazione.titolo}" è stata completata dal sopralluoghista`,
        utente_id: adminId,
        lavorazione_id: lavorazione.id,
        condominio_id: lavorazione.condominio_id,
        priorita: 'media'
      })

      if (notifica) notifiche.push(notifica)
    }

    return notifiche
  }

  /**
   * Crea reminder personalizzato
   */
  async creaReminderPersonalizzato(config: ReminderConfig, messaggio: string): Promise<Notifica | null> {
    return await this.creaNotifica({
      tipo: 'reminder_personalizzato',
      titolo: `🔔 ${config.nome}`,
      messaggio,
      utente_id: config.utente_id,
      priorita: 'media'
    })
  }

  /**
   * Recupera notifiche non lette per utente
   */
  async getNotificheNonLette(utenteId: string): Promise<Notifica[]> {
    try {
      const { data, error } = await supabase
        .from('notifiche')
        .select('*')
        .eq('utente_id', utenteId)
        .eq('letta', false)
        .order('data_creazione', { ascending: false })
        .limit(50)

      if (error) {
        console.error('❌ Errore recupero notifiche:', error)
        return []
      }

      return (data as Notifica[]) || []

    } catch (error) {
      console.error('❌ Errore critico recupero notifiche:', error)
      return []
    }
  }

  /**
   * Marca notifica come letta
   */
  async marcaComeLetta(notificaId: string): Promise<boolean> {
    try {
      console.log(`📝 Marcando notifica come letta: ${notificaId}`)
      
      const { data, error } = await supabase
        .from('notifiche')
        .update({ 
          letta: true,
          data_aggiornamento: new Date().toISOString()
        })
        .eq('id', notificaId)
        .select()

      if (error) {
        console.error('❌ Errore DB marca come letta:', error)
        return false
      }

      console.log(`✅ Notifica ${notificaId} aggiornata:`, data)
      return true
    } catch (error) {
      console.error('❌ Errore critico marca come letta:', error)
      return false
    }
  }

  /**
   * Marca tutte le notifiche come lette per un utente
   */
  async marcaTutteComeLette(utenteId: string): Promise<boolean> {
    try {
      console.log(`📝 Marcando tutte le notifiche come lette per utente: ${utenteId}`)
      
      const { data, error } = await supabase
        .from('notifiche')
        .update({ 
          letta: true,
          data_aggiornamento: new Date().toISOString()
        })
        .eq('utente_id', utenteId)
        .eq('letta', false)
        .select()

      if (error) {
        console.error('❌ Errore DB marca tutte come lette:', error)
        return false
      }

      console.log(`✅ ${data?.length || 0} notifiche marcate come lette per utente ${utenteId}`)
      return true
    } catch (error) {
      console.error('❌ Errore critico marca tutte come lette:', error)
      return false
    }
  }

  /**
   * Sottoscrivi a notifiche real-time per un utente
   */
  subscribe(utenteId: string, callback: (notification: Notifica) => void): () => void {
    this.subscribers.set(utenteId, callback)

    // Ritorna funzione di unsubscribe
    return () => {
      this.subscribers.delete(utenteId)
    }
  }

  /**
   * Invia notifica real-time ai subscriber
   */
  private inviaNotificaRealTime(notifica: Notifica): void {
    const callback = this.subscribers.get(notifica.utente_id)
    if (callback) {
      callback(notifica)
    }
  }
}

/**
 * Utility per controllo scadenze lavorazioni
 */
export async function controllaScadenzeLavorazioni(): Promise<void> {
  console.log('🔍 Controllo scadenze lavorazioni...')

  try {
    const notificationManager = NotificationManager.getInstance()

    // Query lavorazioni attive con scadenza nei prossimi giorni
    const dataOggi = new Date()
    const tra7Giorni = new Date()
    tra7Giorni.setDate(dataOggi.getDate() + 7)

    const { data: lavorazioni, error } = await supabase
      .from('lavorazioni')
      .select(`
        id, titolo, data_scadenza, user_id, condominio_id, priorita,
        condomini!inner(nome)
      `)
      .in('stato', ['da_eseguire', 'in_corso', 'riaperta'])
      .gte('data_scadenza', dataOggi.toISOString())
      .lte('data_scadenza', tra7Giorni.toISOString())

    if (error) {
      console.error('❌ Errore query scadenze:', error)
      return
    }

    if (!lavorazioni || lavorazioni.length === 0) {
      console.log('✅ Nessuna scadenza imminente')
      return
    }

    console.log(`⏰ Trovate ${lavorazioni.length} lavorazioni in scadenza`)

    // Crea notifiche per ogni lavorazione
    for (const lavorazione of lavorazioni) {
      const dataScadenza = new Date(lavorazione.data_scadenza)
      const giorniRimanenti = Math.ceil((dataScadenza.getTime() - dataOggi.getTime()) / (1000 * 60 * 60 * 24))

      // Notifica a 7, 3, 1 giorni e il giorno stesso
      if ([7, 3, 1, 0].includes(giorniRimanenti)) {
        await notificationManager.notificaScadenzaImminente(lavorazione, giorniRimanenti)
      }
    }

  } catch (error) {
    console.error('❌ Errore critico controllo scadenze:', error)
  }
}

/**
 * Utility per ottenere admin users
 */
export async function getAdminUsers(): Promise<string[]> {
  try {
    const { data: admins, error } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .eq('attivo', true)

    if (error) {
      console.error('❌ Errore recupero admin:', error)
      return []
    }

    return admins?.map(admin => admin.id) || []
  } catch (error) {
    console.error('❌ Errore critico recupero admin:', error)
    return []
  }
}

export default NotificationManager