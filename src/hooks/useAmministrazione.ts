'use client'

import { useState, useEffect } from 'react'
import { Lavorazione } from '@/lib/types'

export default function useAmministrazione() {
  const [lavorazioni, setLavorazioni] = useState<Lavorazione[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const caricaLavorazioni = async (stato?: string) => {
    setLoading(true)
    setError(null)

    try {
      const url = stato && stato !== 'tutte' 
        ? `/api/lavorazioni?stato=${stato}` 
        : '/api/lavorazioni'
      
      const response = await fetch(url)
      const result = await response.json()

      if (result.success) {
        setLavorazioni(result.data)
      } else {
        setError(result.error || 'Errore nel caricamento delle lavorazioni')
      }
    } catch (err) {
      setError('Errore di connessione durante il caricamento delle lavorazioni')
    }

    setLoading(false)
  }

  const creaLavorazione = async (lavorazioneData: {
    verificaId: string
    descrizione: string
  }) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/lavorazioni', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(lavorazioneData)
      })

      const result = await response.json()

      if (result.success) {
        setLavorazioni(prev => [...prev, result.data])
        return { success: true, data: result.data }
      } else {
        setError(result.error || 'Errore nella creazione della lavorazione')
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorMsg = 'Errore di connessione durante la creazione della lavorazione'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  const aggiornaLavorazione = async (
    lavorazioneId: string, 
    azione: string, 
    nota?: string
  ) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/lavorazioni/${lavorazioneId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ azione, nota })
      })

      const result = await response.json()

      if (result.success) {
        setLavorazioni(prev => 
          prev.map(lav => 
            lav.id === lavorazioneId ? result.data : lav
          )
        )
        return { success: true, data: result.data }
      } else {
        setError(result.error || 'Errore nell\'aggiornamento della lavorazione')
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorMsg = 'Errore di connessione durante l\'aggiornamento della lavorazione'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  const eliminaLavorazione = async (lavorazioneId: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/lavorazioni/${lavorazioneId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        setLavorazioni(prev => prev.filter(lav => lav.id !== lavorazioneId))
        return { success: true }
      } else {
        setError(result.error || 'Errore nell\'eliminazione della lavorazione')
        return { success: false, error: result.error }
      }
    } catch (err) {
      const errorMsg = 'Errore di connessione durante l\'eliminazione della lavorazione'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }

  const getLavorazioniPerStato = (stato: string) => {
    return lavorazioni.filter(lav => lav.stato === stato)
  }

  const getStatistiche = () => {
    return {
      totali: lavorazioni.length,
      aperte: lavorazioni.filter(l => l.stato === 'aperta').length,
      chiuse: lavorazioni.filter(l => l.stato === 'chiusa').length,
      riaperte: lavorazioni.filter(l => l.stato === 'riaperta').length
    }
  }

  return {
    lavorazioni,
    loading,
    error,
    caricaLavorazioni,
    creaLavorazione,
    aggiornaLavorazione,
    eliminaLavorazione,
    getLavorazioniPerStato,
    getStatistiche,
    clearError: () => setError(null)
  }
}