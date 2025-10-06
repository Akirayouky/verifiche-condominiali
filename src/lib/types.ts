export interface Condominio {
  id: string
  nome: string
  token: string
  data_inserimento: string
  data_ultima_modifica: string
  assigned_to?: string | null // ID del sopralluoghista assegnato (opzionale/nullable)
  qr_code?: string | null // Codice QR univoco per identificazione rapida
  indirizzo?: string | null // Indirizzo del condominio
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
  firma?: string  // URL firma digitale
  note?: string
}

export interface Lavorazione {
  id: string
  // Nuovo schema database
  user_id: string                    // ID utente assegnato (sostituisce utente_assegnato)
  condominio_id: string             // ID condominio
  titolo: string                    // Titolo automatico
  descrizione: string               // Descrizione della lavorazione
  stato: 'aperta' | 'in_corso' | 'completata' | 'archiviata' | 'da_eseguire' | 'riaperta' | 'integrazione'  // Stati unificati (nuovo + legacy + integrazione)
  priorita: 'bassa' | 'media' | 'alta' | 'critica'            // Priorità
  data_apertura: string             // Data apertura
  data_scadenza?: string            // Data scadenza (opzionale)
  data_assegnazione?: string        // Data assegnazione (per compatibilità UI)
  data_completamento?: string       // Data completamento
  note?: string | string[]          // Note generali (string o array per compatibilità)
  allegati?: string                 // Metadata JSON (tipologia, etc)
  
  // Campi per riapertura (legacy - mantenuto per retrocompatibilità)
  data_riapertura?: string          // Quando è stata riaperta
  riaperta_da?: string              // ID admin che ha riaperto
  campi_da_ricompilare?: any[]      // Array campi da far ricompilare
  campi_nuovi?: any[]               // Array nuovi campi da aggiungere
  motivo_riapertura?: string        // Perché è stata riaperta
  
  // Campi per integrazione (nuovo sistema)
  lavorazione_originale_id?: string // ID lavorazione madre se questa è un'integrazione
  motivo_integrazione?: string      // Motivo della richiesta di integrazione
  data_integrazione?: string        // Quando è stata creata l'integrazione
  dati_verifiche?: Record<string, any>  // Dati compilati dal sopralluoghista
  id_cartella?: string              // ID cartella per organizzazione blob storage
  
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
  tipo: 'scadenza_imminente' | 'nuova_assegnazione' | 'lavorazione_completata' | 'reminder_personalizzato' | 'urgente' | 'nuova_verifica' | 'lavorazione_riaperta' | 'integrazione_completata'
  titolo: string
  messaggio: string
  utente_id: string
  lavorazione_id?: string
  condominio_id?: string
  priorita: 'bassa' | 'media' | 'alta' | 'urgente'
  letta: boolean
  data_creazione: string
  data_scadenza?: string
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

// Interfaccia per Riapertura Lavorazioni
export interface RiaperturaLavorazione {
  lavorazione_id: string
  motivo: string
  campi_da_ricompilare: CampoRiapertura[]
  campi_nuovi: CampoRiapertura[]
  riaperta_da: string  // ID admin
}

export interface CampoRiapertura {
  nome: string
  tipo: "text" | "number" | "date" | "select" | "textarea" | "checkbox" | "file" | "verifica"
  label: string
  required: boolean
  valore_precedente?: any  // Valore da pre-compilare se è da ricompilare
  opzioni?: string[]  // Per select
  descrizione?: string  // Aiuto per il sopralluoghista
}

export interface WizardRiaperturaStep {
  step: 1 | 2 | 3
  lavorazione: Lavorazione
  campiEsistenti: CampoEsistente[]
  campiSelezionati: {
    mantenere: string[]
    ricompilare: string[]
    nuovi: CampoRiapertura[]
  }
}

export interface CampoEsistente {
  nome: string
  label: string
  tipo: string
  valore: any
  obbligatorio: boolean
}

