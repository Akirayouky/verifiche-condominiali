export interface Condominio {
  id: string
  nome: string
  token: string
  dataInserimento: string
  dataUltimaModifica: string
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
  campiPersonalizzati: CampoPersonalizzato[]
  attiva: boolean
  dataCreazione: string
  dataUltimaModifica: string
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
  campiPersonalizzati: Omit<CampoPersonalizzato, 'id'>[]
}

export interface UpdateTipologiaRequest extends CreateTipologiaRequest {
  attiva: boolean
}

export interface Verifica {
  id: string
  condominioId: string
  tipologiaId: string
  stato: 'bozza' | 'in_corso' | 'completata' | 'archiviata'
  datiVerifica: Record<string, any>
  note: string
  emailInviata: boolean
  dataCreazione: string
  dataCompletamento?: string
  dataUltimaModifica: string
}

export interface CreateVerificaRequest {
  condominioId: string
  tipologiaId: string
  datiVerifica: Record<string, any>
  note?: string
}

export interface Lavorazione {
  id: string
  verificaId: string
  stato: 'aperta' | 'chiusa' | 'riaperta'
  descrizione: string
  note: string[]
  dataApertura: string
  dataChiusura?: string
  dataRiapertura?: string
}