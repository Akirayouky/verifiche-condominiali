import { Condominio } from './types'

// Classe per gestire il database locale (localStorage)
export class LocalDatabase {
  private static readonly CONDOMINI_KEY = 'condomini'

  // Inizializza il database con dati di esempio se vuoto
  static init(): void {
    if (typeof window === 'undefined') return
    
    const existing = localStorage.getItem(this.CONDOMINI_KEY)
    if (!existing) {
      const sampleData: Condominio[] = [
        {
          id: '1',
          nome: 'Condominio Rossi',
          token: 'cond_abc123def456',
          dataInserimento: '2024-01-15T10:30:00Z',
          dataUltimaModifica: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          nome: 'Condominio Verde',
          token: 'cond_xyz789uvw012',
          dataInserimento: '2024-02-20T14:15:00Z',
          dataUltimaModifica: '2024-02-25T09:45:00Z'
        }
      ]
      this.saveCondomini(sampleData)
    }
  }

  // CRUD Operations per Condomini
  static getCondomini(): Condominio[] {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(this.CONDOMINI_KEY)
    return stored ? JSON.parse(stored) : []
  }

  static saveCondomini(condomini: Condominio[]): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.CONDOMINI_KEY, JSON.stringify(condomini))
  }

  static getCondominioById(id: string): Condominio | null {
    const condomini = this.getCondomini()
    return condomini.find(c => c.id === id) || null
  }

  static getCondominioByToken(token: string): Condominio | null {
    const condomini = this.getCondomini()
    return condomini.find(c => c.token === token) || null
  }

  static addCondominio(condominio: Condominio): void {
    const condomini = this.getCondomini()
    condomini.push(condominio)
    this.saveCondomini(condomini)
  }

  static updateCondominio(id: string, updates: Partial<Condominio>): boolean {
    const condomini = this.getCondomini()
    const index = condomini.findIndex(c => c.id === id)
    
    if (index === -1) return false
    
    condomini[index] = {
      ...condomini[index],
      ...updates,
      dataUltimaModifica: new Date().toISOString()
    }
    
    this.saveCondomini(condomini)
    return true
  }

  static deleteCondominio(id: string): boolean {
    const condomini = this.getCondomini()
    const filtered = condomini.filter(c => c.id !== id)
    
    if (filtered.length === condomini.length) return false
    
    this.saveCondomini(filtered)
    return true
  }

  // Utility per generare token unici
  static generateToken(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let token = 'cond_'
    for (let i = 0; i < 16; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return token
  }

  // Verifica se un token è già in uso
  static isTokenUnique(token: string): boolean {
    const condomini = this.getCondomini()
    return !condomini.some(c => c.token === token)
  }
}