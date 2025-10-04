export interface Condominio {
  id: string
  nome: string
  token: string
  data_inserimento: string
  data_ultima_modifica: string
  assigned_to?: string | null // ID del sopralluoghista assegnato (opzionale/nullable)
}

export interface User {
  id: string
  username: string
  email: string
  password_hash?: string // Non incluso nelle risposte API per sicurezza
  role: 'admin' | 'sopralluoghista'
  nome?: string
  cognome?: string
  telefono?: string
  attivo: boolean
  created_at: string
  last_login?: string
  approved_by?: string
  approved_at?: string
}

export interface CreateUserRequest {
  username: string
  email: string
  password: string
  role: 'admin' | 'sopralluoghista'
  nome?: string
  cognome?: string
  telefono?: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  success: boolean
  user?: Omit<User, 'password_hash'>
  token?: string
  message?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  total?: number
}

export interface CreateCondominioRequest {
  nome: string
}

export interface UpdateCondominioRequest {
  nome?: string
  assigned_to?: string | null // Per assegnare/rimuovere sopralluoghista
}

export interface AssignCondominioRequest {
  condominio_id: string
  sopralluoghista_id: string | null // null per rimuovere assegnazione
}

export interface TipologiaVerifica {
  id: string
  nome: string
  descrizione: string
  campi_richiesti: CampoPersonalizzato[]
  attiva: boolean
  data_creazione: string
  data_ultima_modifica: string
}

export interface CampoPersonalizzato {
  id: string
  nome: string
  tipo: 'testo' | 'numero' | 'data' | 'checkbox' | 'select' | 'textarea' | 'foto'
  obbligatorio: boolean
  opzioni?: string[] // Per campi select
  maxFoto?: number // Per limitare il numero di foto (default 5)
  placeholder?: string
}

export interface CreateTipologiaRequest {
  nome: string
  descrizione: string
  campi_richiesti: Omit<CampoPersonalizzato, 'id'>[]
}

export interface UpdateTipologiaRequest extends CreateTipologiaRequest {
  attiva: boolean
}

export interface Verifica {
  id: string
  condominio_id: string
  tipologia_id: string
  stato: 'bozza' | 'in_corso' | 'completata' | 'archiviata'
  dati_verifica: Record<string, any>
  note: string
  email_inviata: boolean
  data_creazione: string
  data_completamento?: string
  data_ultima_modifica: string
}

export interface CreateVerificaRequest {
  condominio_id: string
  tipologia_id: string
  dati_verifica: Record<string, any>
  note?: string
}

export interface Lavorazione {
  id: string
  // Nuovo schema database
  user_id: string                    // ID utente assegnato (sostituisce utente_assegnato)
  condominio_id: string             // ID condominio
  titolo: string                    // Titolo automatico
  descrizione: string               // Descrizione della lavorazione
  stato: 'aperta' | 'in_corso' | 'completata' | 'archiviata' | 'da_eseguire' | 'riaperta'  // Stati unificati (nuovo + legacy)
  priorita: 'bassa' | 'media' | 'alta' | 'critica'            // Priorità
  data_apertura: string             // Data apertura
  data_scadenza?: string            // Data scadenza (opzionale)
  data_assegnazione?: string        // Data assegnazione (per compatibilità UI)
  note?: string | string[]          // Note generali (string o array per compatibilità)
  allegati?: string                 // Metadata JSON (tipologia, etc)
  
  // Relazioni (quando popolate dall'API)
  condomini?: {
    id: string
    nome: string
    indirizzo: string
  }
  users?: {
    id: string
    username: string
    nome: string
    cognome: string
    email: string
  }
  
  // Retrocompatibilità (per codice esistente)
  verifica_id?: string              // Legacy
  utente_assegnato?: string         // Legacy - ora user_id
  data_chiusura?: string            // Legacy
  data_riapertura?: string          // Legacy
  verifica?: Verifica              // Legacy relation
}

// Sistema di autenticazione
export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  role: 'admin' | 'sopralluoghista' | null
}

// Gestione foto cloud (Cloudinary)
export interface FotoCloud {
  url: string          // URL pubblico Cloudinary
  publicId: string     // ID interno Cloudinary per gestione
  thumbnailUrl?: string // URL thumbnail ottimizzato
  createdAt?: string   // Timestamp creazione
}

// Interfaccia per componente FotoUpload aggiornato
export interface FotoUploadCloudProps {
  value: FotoCloud[]   // Array di foto cloud invece di Base64
  onChange: (foto: FotoCloud[]) => void
  lavorazioneId: string // Necessario per organizzazione Cloudinary
  maxFoto?: number
  required?: boolean
  nome: string
}

// Sistema Notifiche Real-Time
export interface Notifica {
  id: string
  tipo: 'scadenza_imminente' | 'nuova_assegnazione' | 'lavorazione_completata' | 'reminder_personalizzato' | 'urgente'
  titolo: string
  messaggio: string
  utente_id: string
  lavorazione_id?: string
  condominio_id?: string
  priorita: 'bassa' | 'media' | 'alta' | 'urgente'
  letta: boolean
  data_creazione: string
  data_scadenza?: string
  azioni?: NotificaAzione[]
}

export interface NotificaAzione {
  id: string
  label: string
  action: string
  tipo: 'primary' | 'secondary' | 'danger'
  url?: string
}

// Configurazione Reminder Personalizzabili
export interface ReminderConfig {
  id: string
  utente_id: string
  nome: string
  descrizione: string
  tipo: 'scadenza_lavorazioni' | 'controllo_giornaliero' | 'report_settimanale' | 'personalizzato'
  frequenza: 'giornaliera' | 'settimanale' | 'mensile' | 'custom'
  giorni_anticipo?: number
  ora_invio: string // HH:MM format
  giorni_settimana?: number[] // 0=domenica, 1=lunedì, etc.
  attivo: boolean
  ultima_esecuzione?: string
  prossima_esecuzione?: string
  canali: ('app' | 'email' | 'sms')[]
}

// Event Types per Server-Sent Events
export interface NotificationEvent {
  type: 'notification' | 'reminder' | 'scadenza' | 'heartbeat' | 'existing_notification'
  data: {
    notifica?: Notifica
    timestamp: string
    utente_id: string
    message?: string
  }
}