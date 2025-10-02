import { Condominio, ApiResponse, CreateCondominioRequest, UpdateCondominioRequest } from './types'

// Base URL per le API
const API_BASE = '/api'

// Classe per gestire le chiamate API ai condomini
export class CondominioAPI {
  
  // GET /api/condomini - Ottieni tutti i condomini
  static async getAll(): Promise<ApiResponse<Condominio[]>> {
    try {
      const response = await fetch(`${API_BASE}/condomini`)
      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: 'Errore di connessione'
      }
    }
  }

  // GET /api/condomini/[id] - Ottieni condominio per ID o Token
  static async getById(id: string): Promise<ApiResponse<Condominio>> {
    try {
      const response = await fetch(`${API_BASE}/condomini/${id}`)
      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: 'Errore di connessione'
      }
    }
  }

  // POST /api/condomini - Crea nuovo condominio
  static async create(data: CreateCondominioRequest): Promise<ApiResponse<Condominio>> {
    try {
      const response = await fetch(`${API_BASE}/condomini`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: 'Errore di connessione'
      }
    }
  }

  // PUT /api/condomini/[id] - Aggiorna condominio
  static async update(id: string, data: UpdateCondominioRequest): Promise<ApiResponse<Condominio>> {
    try {
      const response = await fetch(`${API_BASE}/condomini/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: 'Errore di connessione'
      }
    }
  }

  // DELETE /api/condomini/[id] - Elimina condominio
  static async delete(id: string): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(`${API_BASE}/condomini/${id}`, {
        method: 'DELETE'
      })
      return await response.json()
    } catch (error) {
      return {
        success: false,
        error: 'Errore di connessione'
      }
    }
  }

  // Utility per validare i dati del condominio
  static validateCondominio(data: CreateCondominioRequest | UpdateCondominioRequest): string[] {
    const errors: string[] = []
    
    if (!data.nome || data.nome.trim() === '') {
      errors.push('Il nome del condominio è obbligatorio')
    }
    
    if (data.nome && data.nome.length < 2) {
      errors.push('Il nome deve essere di almeno 2 caratteri')
    }
    
    if (data.nome && data.nome.length > 100) {
      errors.push('Il nome non può superare i 100 caratteri')
    }
    
    return errors
  }
}