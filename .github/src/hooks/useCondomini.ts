'use client'

import { useState, useEffect } from 'react'
import { Condominio, CreateCondominioRequest, UpdateCondominioRequest } from '@/lib/types'
import { CondominioAPI } from '@/lib/api'

export function useCondomini() {
  const [condomini, setCondomini] = useState<Condominio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carica tutti i condomini
  const loadCondomini = async () => {
    setLoading(true)
    setError(null)
    
    const response = await CondominioAPI.getAll()
    
    if (response.success && response.data) {
      setCondomini(response.data)
    } else {
      setError(response.error || 'Errore nel caricamento dei condomini')
    }
    
    setLoading(false)
  }

  // Crea un nuovo condominio
  const createCondominio = async (data: CreateCondominioRequest): Promise<boolean> => {
    const errors = CondominioAPI.validateCondominio(data)
    if (errors.length > 0) {
      setError(errors.join(', '))
      return false
    }

    const response = await CondominioAPI.create(data)
    
    if (response.success && response.data) {
      setCondomini(prev => [...prev, response.data!])
      setError(null)
      return true
    } else {
      setError(response.error || 'Errore nella creazione del condominio')
      return false
    }
  }

  // Aggiorna un condominio esistente
  const updateCondominio = async (id: string, data: UpdateCondominioRequest): Promise<boolean> => {
    const errors = CondominioAPI.validateCondominio(data)
    if (errors.length > 0) {
      setError(errors.join(', '))
      return false
    }

    const response = await CondominioAPI.update(id, data)
    
    if (response.success && response.data) {
      setCondomini(prev => prev.map(c => 
        c.id === id ? response.data! : c
      ))
      setError(null)
      return true
    } else {
      setError(response.error || 'Errore nell\'aggiornamento del condominio')
      return false
    }
  }

  // Elimina un condominio
  const deleteCondominio = async (id: string): Promise<boolean> => {
    const response = await CondominioAPI.delete(id)
    
    if (response.success) {
      setCondomini(prev => prev.filter(c => c.id !== id))
      setError(null)
      return true
    } else {
      setError(response.error || 'Errore nell\'eliminazione del condominio')
      return false
    }
  }

  // Ottieni un condominio per ID o Token
  const getCondominio = (id: string): Condominio | undefined => {
    return condomini.find(c => c.id === id || c.token === id)
  }

  // Carica i condomini all'avvio
  useEffect(() => {
    loadCondomini()
  }, [])

  return {
    condomini,
    loading,
    error,
    loadCondomini,
    createCondominio,
    updateCondominio,
    deleteCondominio,
    getCondominio,
    clearError: () => setError(null)
  }
}