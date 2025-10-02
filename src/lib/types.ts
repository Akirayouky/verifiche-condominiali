export interface Condominio {
  id: string
  nome: string
  token: string
  data_inserimento: string
  data_ultima_modifica: string
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
  nome: string
}

export interface TipologiaVerifica {
  id: string
  nome: string
  descrizione: string
  campi_personalizzati: CampoPersonalizzato[]
  attiva: boolean
  data_creazione: string
  data_ultima_modifica: string
}

export interface CampoPersonalizzato {
  id: string
  nome: string
  tipo: 'testo' | 'numero' | 'data' | 'checkbox' | 'select' | 'textarea'
  obbligatorio: boolean
  opzioni?: string[] // Per campi select
  placeholder?: string
}

export interface CreateTipologiaRequest {
  nome: string
  descrizione: string
  campi_personalizzati: Omit<CampoPersonalizzato, 'id'>[]
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
  verifica_id: string
  stato: 'aperta' | 'chiusa' | 'riaperta'
  descrizione: string
  note: string[]
  data_apertura: string
  data_chiusura?: string
  data_riapertura?: string
}