'use client'

import { useState, useEffect } from 'react'
import { TipologiaVerifica, CreateTipologiaRequest, UpdateTipologiaRequest } from '@/lib/types'

// API client per tipologie
class TipologiaAPI {
  private static readonly API_BASE = '/api/tipologie'

  static async getAll() {
    try {
      const response = await fetch(this.API_BASE)
      return await response.json()
    } catch (error) {
      return { success: false, error: 'Errore di connessione' }
    }
  }

  static async getById(id: string) {
    try {
      const response = await fetch(`${this.API_BASE}/${id}`)
      return await response.json()
    } catch (error) {
      return { success: false, error: 'Errore di connessione' }
    }
  }

  static async create(data: CreateTipologiaRequest) {
    try {
      const response = await fetch(this.API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      return await response.json()
    } catch (error) {
      return { success: false, error: 'Errore di connessione' }
    }
  }

  static async update(id: string, data: UpdateTipologiaRequest) {
    try {
      const response = await fetch(`${this.API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      return await response.json()
    } catch (error) {
      return { success: false, error: 'Errore di connessione' }
    }
  }

  static async delete(id: string) {
    try {
      const response = await fetch(`${this.API_BASE}/${id}`, {
        method: 'DELETE'
      })
      return await response.json()
    } catch (error) {
      return { success: false, error: 'Errore di connessione' }
    }
  }

  static validate(data: CreateTipologiaRequest | UpdateTipologiaRequest): string[] {
    const errors: string[] = []
    
    if (!data.nome || data.nome.trim() === '') {
      errors.push('Il nome della tipologia è obbligatorio')
    }
    
    if (data.nome && data.nome.length < 2) {
      errors.push('Il nome deve essere di almeno 2 caratteri')
    }
    
    return errors
  }
}

export function useTipologie() {
  const [tipologie, setTipologie] = useState<TipologiaVerifica[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTipologie = async () => {
    setLoading(true)
    setError(null)
    
    const response = await TipologiaAPI.getAll()
    
    if (response.success && response.data) {
      setTipologie(response.data)
    } else {
      setError(response.error || 'Errore nel caricamento delle tipologie')
    }
    
    setLoading(false)
  }

  const createTipologia = async (data: CreateTipologiaRequest): Promise<boolean> => {
    const errors = TipologiaAPI.validate(data)
    if (errors.length > 0) {
      setError(errors.join(', '))
      return false
    }

    const response = await TipologiaAPI.create(data)
    
    if (response.success && response.data) {
      setTipologie(prev => [...prev, response.data!])
      setError(null)
      return true
    } else {
      setError(response.error || 'Errore nella creazione della tipologia')
      return false
    }
  }

  const updateTipologia = async (id: string, data: UpdateTipologiaRequest): Promise<boolean> => {
    const errors = TipologiaAPI.validate(data)
    if (errors.length > 0) {
      setError(errors.join(', '))
      return false
    }

    const response = await TipologiaAPI.update(id, data)
    
    if (response.success && response.data) {
      setTipologie(prev => prev.map(t => 
        t.id === id ? response.data! : t
      ))
      setError(null)
      return true
    } else {
      setError(response.error || 'Errore nell\'aggiornamento della tipologia')
      return false
    }
  }

  const deleteTipologia = async (id: string): Promise<boolean> => {
    const response = await TipologiaAPI.delete(id)
    
    if (response.success) {
      setTipologie(prev => prev.filter(t => t.id !== id))
      setError(null)
      return true
    } else {
      setError(response.error || 'Errore nell\'eliminazione della tipologia')
      return false
    }
  }

  const getTipologia = (id: string): TipologiaVerifica | undefined => {
    return tipologie.find(t => t.id === id)
  }

  const getTipologieAttive = (): TipologiaVerifica[] => {
    return tipologie.filter(t => t.attiva)
  }

  useEffect(() => {
    loadTipologie()
  }, [])

  return {
    tipologie,
    loading,
    error,
    loadTipologie,
    createTipologia,
    updateTipologia,
    deleteTipologia,
    getTipologia,
    getTipologieAttive,
    clearError: () => setError(null)
  }
}