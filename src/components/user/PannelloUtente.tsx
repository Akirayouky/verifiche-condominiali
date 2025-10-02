'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Lavorazione, Condominio, TipologiaVerifica } from '@/lib/types'
import WizardVerifiche from '@/components/verifiche/WizardVerifiche'

export default function PannelloUtente() {
  const { user } = useAuth()
  const [lavorazioni, setLavorazioni] = useState<Lavorazione[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLavorazione, setSelectedLavorazione] = useState<Lavorazione | null>(null)
  const [showWizard, setShowWizard] = useState(false)

  const caricaLavorazioni = useCallback(async () => {
    if (!user?.id) return
    
    setLoading(true)
    try {
      // In produzione, filtrare per utente assegnato
      const response = await fetch(`/api/lavorazioni?utente=${user.id}`)
      const result = await response.json()
      
      if (result.success) {
        // Filtra solo lavorazioni assegnate all'utente corrente
        const lavorazioniUtente = result.data.filter((l: Lavorazione) => 
          l.utente_assegnato === user.id || 
          l.stato === 'da_eseguire' || 
          l.stato === 'riaperta'
        )
        setLavorazioni(lavorazioniUtente)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Errore nel caricamento delle lavorazioni')
    }
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    caricaLavorazioni()
  }, [caricaLavorazioni])

  const iniziaLavorazione = (lavorazione: Lavorazione) => {
    setSelectedLavorazione(lavorazione)
    setShowWizard(true)
  }

  const getStatoInfo = (stato: string) => {
    switch (stato) {
      case 'da_eseguire':
        return { 
          icon: '📋', 
          color: 'bg-blue-100 text-blue-800',
          label: 'DA ESEGUIRE',
          description: 'Nuova verifica da completare'
        }
      case 'in_corso':
        return { 
          icon: '⏳', 
          color: 'bg-yellow-100 text-yellow-800',
          label: 'IN CORSO',
          description: 'Verifica in fase di esecuzione'
        }
      case 'riaperta':
        return { 
          icon: '🔄', 
          color: 'bg-orange-100 text-orange-800',
          label: 'RIAPERTA',
          description: 'Verifica da ricontrollare'
        }
      case 'completata':
        return { 
          icon: '✅', 
          color: 'bg-green-100 text-green-800',
          label: 'COMPLETATA',
          description: 'Verifica terminata con successo'
        }
      default:
        return { 
          icon: '❓', 
          color: 'bg-gray-100 text-gray-800',
          label: 'SCONOSCIUTO',
          description: 'Stato non definito'
        }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Statistiche per l'utente
  const stats = {
    totali: lavorazioni.length,
    da_eseguire: lavorazioni.filter(l => l.stato === 'da_eseguire').length,
    in_corso: lavorazioni.filter(l => l.stato === 'in_corso').length,
    completate: lavorazioni.filter(l => l.stato === 'completata').length,
    riaperte: lavorazioni.filter(l => l.stato === 'riaperta').length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-600">Caricamento lavorazioni...</span>
      </div>
    )
  }

  if (showWizard && selectedLavorazione) {
    // TODO: Importare e mostrare il WizardVerifiche preconfigurato
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">
            Verifica: {selectedLavorazione.descrizione}
          </h2>
          <button
            onClick={() => {
              setShowWizard(false)
              setSelectedLavorazione(null)
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md"
          >
            ← Torna alle lavorazioni
          </button>
        </div>
        
        {/* Wizard Verifiche preconfigurato */}
        <WizardVerifiche 
          lavorazione={selectedLavorazione}
          onLavorazioneComplete={(lavorazioneId) => {
            // Ricarica le lavorazioni e torna alla lista
            caricaLavorazioni()
            setSelectedLavorazione(null)
            setShowWizard(false)
          }}
          onBack={() => {
            setSelectedLavorazione(null)
            setShowWizard(false)
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          👷 Pannello Sopralluoghista
        </h2>
        <p className="text-gray-600">
          Benvenuto <strong>{user?.nome} {user?.cognome}</strong>! 
          Qui trovi tutte le verifiche assegnate da completare.
        </p>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.totali}</div>
              <div className="text-blue-800 text-sm">Totali</div>
            </div>
            <div className="text-blue-400 text-2xl">📊</div>
          </div>
        </div>
        
        <div className="bg-indigo-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-indigo-600">{stats.da_eseguire}</div>
              <div className="text-indigo-800 text-sm">Da Eseguire</div>
            </div>
            <div className="text-indigo-400 text-2xl">📋</div>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-600">{stats.in_corso}</div>
              <div className="text-yellow-800 text-sm">In Corso</div>
            </div>
            <div className="text-yellow-400 text-2xl">⏳</div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.completate}</div>
              <div className="text-green-800 text-sm">Completate</div>
            </div>
            <div className="text-green-400 text-2xl">✅</div>
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-orange-600">{stats.riaperte}</div>
              <div className="text-orange-800 text-sm">Riaperte</div>
            </div>
            <div className="text-orange-400 text-2xl">🔄</div>
          </div>
        </div>
      </div>

      {/* Errori */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-600">❌ {error}</div>
        </div>
      )}

      {/* Lista Lavorazioni */}
      <div className="bg-white rounded-lg shadow-sm border">
        {lavorazioni.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">📋</div>
            <h3 className="text-lg font-medium mb-2">Nessuna lavorazione assegnata</h3>
            <p>Al momento non hai verifiche da completare.</p>
            <p className="text-sm mt-2">Le nuove lavorazioni appariranno qui quando verranno assegnate dall&apos;amministratore.</p>
          </div>
        ) : (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Le tue Verifiche ({lavorazioni.length})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lavorazioni.map((lavorazione) => {
                const statoInfo = getStatoInfo(lavorazione.stato)
                
                return (
                  <div
                    key={lavorazione.id}
                    className="border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => iniziaLavorazione(lavorazione)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <span className="text-3xl mr-3">{statoInfo.icon}</span>
                        <div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statoInfo.color}`}>
                            {statoInfo.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {lavorazione.descrizione}
                    </h4>
                    
                    <p className="text-sm text-gray-600 mb-4">
                      {statoInfo.description}
                    </p>
                    
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>
                        <strong>Assegnata:</strong> {
                          lavorazione.data_assegnazione 
                            ? formatDate(lavorazione.data_assegnazione)
                            : formatDate(lavorazione.data_apertura)
                        }
                      </div>
                      <div>
                        <strong>ID:</strong> {lavorazione.id.substring(0, 8)}...
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Clicca per {lavorazione.stato === 'completata' ? 'visualizzare' : 'iniziare'}
                        </span>
                        <span className="text-blue-500">→</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}