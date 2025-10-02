'use client'

import { useState, useEffect, useCallback } from 'react'
import { Lavorazione } from '@/lib/types'

export default function PannelloAdmin() {
  const [lavorazioni, setLavorazioni] = useState<Lavorazione[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroStato, setFiltroStato] = useState<string>('tutte')
  const [lavorazioneSelezionata, setLavorazioneSelezionata] = useState<Lavorazione | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [nuovaNota, setNuovaNota] = useState('')
  const [azione, setAzione] = useState<string>('')

  const caricaLavorazioni = useCallback(async () => {
    setLoading(true)
    try {
      const url = filtroStato !== 'tutte' ? 
        `/api/lavorazioni?stato=${filtroStato}` : 
        '/api/lavorazioni'
      
      const response = await fetch(url)
      const result = await response.json()

      if (result.success) {
        setLavorazioni(result.data)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Errore nel caricamento delle lavorazioni')
    }
    setLoading(false)
  }, [filtroStato])

  useEffect(() => {
    caricaLavorazioni()
  }, [caricaLavorazioni])

  const eseguiAzione = async (lavorazioneId: string, tipoAzione: string, nota?: string) => {
    try {
      const response = await fetch(`/api/lavorazioni/${lavorazioneId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          azione: tipoAzione,
          nota: nota
        })
      })

      const result = await response.json()

      if (result.success) {
        caricaLavorazioni()
        setShowModal(false)
        setNuovaNota('')
        setLavorazioneSelezionata(null)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Errore nell\'esecuzione dell\'azione')
    }
  }

  const handleAzione = (lavorazione: Lavorazione, tipoAzione: string) => {
    setLavorazioneSelezionata(lavorazione)
    setAzione(tipoAzione)
    setShowModal(true)
  }

  const confermaAzione = () => {
    if (lavorazioneSelezionata) {
      eseguiAzione(lavorazioneSelezionata.id, azione, nuovaNota)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatoColor = (stato: string) => {
    switch (stato) {
      case 'aperta': return 'bg-yellow-100 text-yellow-800'
      case 'chiusa': return 'bg-green-100 text-green-800'
      case 'riaperta': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatoIcon = (stato: string) => {
    switch (stato) {
      case 'aperta': return '📂'
      case 'chiusa': return '✅'
      case 'riaperta': return '🔄'
      default: return '❓'
    }
  }

  const stats = {
    totali: lavorazioni.length,
    aperte: lavorazioni.filter(l => l.stato === 'aperta').length,
    chiuse: lavorazioni.filter(l => l.stato === 'chiusa').length,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Pannello Amministratore</h2>
        <p className="text-gray-600">
          Gestisci lavorazioni, riapri verifiche chiuse e aggiungi note
        </p>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.totali}</div>
              <div className="text-blue-800 text-sm">Totali</div>
            </div>
            <div className="text-blue-400 text-2xl">📊</div>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-600">{stats.aperte}</div>
              <div className="text-yellow-800 text-sm">Aperte</div>
            </div>
            <div className="text-yellow-400 text-2xl">📂</div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.chiuse}</div>
              <div className="text-green-800 text-sm">Chiuse</div>
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

      {/* Filtri */}
      <div className="flex gap-4 items-center">
        <label className="text-sm font-medium text-gray-700">Filtra per stato:</label>
        <select
          value={filtroStato}
          onChange={(e) => setFiltroStato(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Filtra lavorazioni per stato"
        >
          <option value="tutte">Tutte le lavorazioni</option>
          <option value="aperta">Solo aperte</option>
          <option value="chiusa">Solo chiuse</option>
          <option value="riaperta">Solo riaperte</option>
        </select>
        
        <button
          onClick={caricaLavorazioni}
          className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
        >
          <span>🔄</span>
          Ricarica
        </button>
      </div>

      {/* Lista Lavorazioni */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-600">❌ {error}</div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border">
        {lavorazioni.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-2">📋</div>
            <h3 className="text-lg font-medium mb-2">Nessuna lavorazione trovata</h3>
            <p>Non ci sono lavorazioni che corrispondono ai filtri selezionati</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {lavorazioni.map((lavorazione) => (
              <div key={lavorazione.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getStatoIcon(lavorazione.stato)}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatoColor(lavorazione.stato)}`}>
                        {lavorazione.stato.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">
                        ID: {lavorazione.id}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {lavorazione.descrizione}
                    </h3>
                    
                    <div className="text-sm text-gray-600 space-y-1 mb-3">
                      <div><strong>Aperta:</strong> {formatDate(lavorazione.data_apertura)}</div>
                      {lavorazione.data_chiusura && (
                        <div><strong>Chiusa:</strong> {formatDate(lavorazione.data_chiusura)}</div>
                      )}
                      {lavorazione.data_riapertura && (
                        <div><strong>Riaperta:</strong> {formatDate(lavorazione.data_riapertura)}</div>
                      )}
                    </div>
                    
                    {lavorazione.note.length > 0 && (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          Note ({lavorazione.note.length}):
                        </div>
                        <div className="space-y-2">
                          {lavorazione.note.map((nota, index) => (
                            <div key={index} className="text-sm text-gray-600 flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              {nota}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 flex flex-col gap-2">
                    <button
                      onClick={() => handleAzione(lavorazione, 'aggiungi_nota')}
                      className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 border border-blue-200 rounded"
                    >
                      📝 Aggiungi Nota
                    </button>
                    
                    {lavorazione.stato === 'aperta' && (
                      <button
                        onClick={() => handleAzione(lavorazione, 'chiudi')}
                        className="text-green-600 hover:text-green-800 text-sm px-3 py-1 border border-green-200 rounded"
                      >
                        ✅ Chiudi
                      </button>
                    )}
                    
                    {lavorazione.stato === 'chiusa' && (
                      <button
                        onClick={() => handleAzione(lavorazione, 'riapri')}
                        className="text-orange-600 hover:text-orange-800 text-sm px-3 py-1 border border-orange-200 rounded"
                      >
                        🔄 Riapri
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal per azioni */}
      {showModal && lavorazioneSelezionata && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {azione === 'chiudi' && 'Chiudi Lavorazione'}
              {azione === 'riapri' && 'Riapri Lavorazione'}
              {azione === 'aggiungi_nota' && 'Aggiungi Nota'}
            </h3>
            
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">
                <strong>Lavorazione:</strong> {lavorazioneSelezionata.descrizione}
              </div>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {azione === 'aggiungi_nota' ? 'Nuova nota:' : 'Nota (opzionale):'}
              </label>
              <textarea
                value={nuovaNota}
                onChange={(e) => setNuovaNota(e.target.value)}
                placeholder="Inserisci una nota..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={confermaAzione}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Conferma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}