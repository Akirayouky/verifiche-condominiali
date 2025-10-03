'use client'

import { useState, useEffect, useCallback } from 'react'
import { Lavorazione } from '@/lib/types'
import FotoViewer from '@/components/ui/FotoViewer'
import GestioneUtenti from './GestioneUtenti'
import GestioneAssegnazioni from './GestioneAssegnazioni'
import WizardLavorazioni from './WizardLavorazioni'

// Hook per evitare hydration errors
function useIsClient() {
  const [isClient, setIsClient] = useState(false)
  useEffect(() => {
    setIsClient(true)
  }, [])
  return isClient
}

export default function PannelloAdmin() {
  const isClient = useIsClient()
  const [activeTab, setActiveTab] = useState('lavorazioni')
  const [lavorazioni, setLavorazioni] = useState<Lavorazione[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroStato, setFiltroStato] = useState<string>('tutte')
  const [lavorazioneSelezionata, setLavorazioneSelezionata] = useState<Lavorazione | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [nuovaNota, setNuovaNota] = useState('')
  const [azione, setAzione] = useState<string>('')
  const [showWizardLavorazioni, setShowWizardLavorazioni] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [lavorazioneCreata, setLavorazioneCreata] = useState<any>(null)

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

  const handleNuovaLavorazione = async (lavorazione: any) => {
    try {
      console.log('Creando lavorazione:', lavorazione)
      
      // Prepara i dati per l'API
      const lavorazioneData = {
        condominio_id: lavorazione.condominio_id,
        tipologia: lavorazione.tipologia,
        tipologia_verifica_id: lavorazione.tipologia_verifica_id,
        descrizione: lavorazione.descrizione,
        priorita: lavorazione.priorita,
        assegnato_a: lavorazione.assegnato_a,
        data_scadenza: lavorazione.data_scadenza,
        note: lavorazione.note
      }

      const response = await fetch('/api/lavorazioni', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(lavorazioneData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore nella creazione della lavorazione')
      }

      const result = await response.json()
      
      if (result.success) {
        console.log('Lavorazione creata con successo:', result.data)
        
        // Arricchisce i dati con i nomi per la modale di successo
        setLavorazioneCreata({
          ...result.data,
          ...lavorazioneData // Include tutti i dati del form per il riepilogo
        })
        setShowWizardLavorazioni(false)
        setShowSuccessModal(true)
        
        // Ricarica la lista delle lavorazioni
        await caricaLavorazioni()
      } else {
        throw new Error(result.error || 'Errore nella creazione della lavorazione')
      }
      
    } catch (error) {
      console.error('Errore creazione lavorazione:', error)
      alert(`Errore nella creazione della lavorazione: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
    }
  }

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
          dati: {
            nota: nota,
            motivo: nota // Per riaperture
          }
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
    try {
      const date = new Date(dateString)
      // Formato sicuro per evitare hydration errors
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      
      return `${day}/${month}/${year} ${hours}:${minutes}`
    } catch (error) {
      return dateString
    }
  }

  const getStatoColor = (stato: string) => {
    switch (stato) {
      case 'da_eseguire': return 'bg-blue-100 text-blue-800'
      case 'in_corso': return 'bg-yellow-100 text-yellow-800'
      case 'completata': return 'bg-green-100 text-green-800'
      case 'riaperta': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatoIcon = (stato: string) => {
    switch (stato) {
      case 'da_eseguire': return '�'
      case 'in_corso': return '⏳'
      case 'completata': return '✅'
      case 'riaperta': return '🔄'
      default: return '📄'
    }
  }

  const handleModifica = (lavorazione: Lavorazione) => {
    // Per ora mostriamo un alert, poi implementeremo un modal di modifica
    alert(`Modifica lavorazione: ${lavorazione.descrizione}\nID: ${lavorazione.id}`)
    // TODO: Implementare modal di modifica
  }

  const handleCancella = (lavorazione: Lavorazione) => {
    setLavorazioneSelezionata(lavorazione)
    setAzione('elimina')
    setShowModal(true)
  }

  const confermaEliminazione = async () => {
    if (!lavorazioneSelezionata) return
    
    try {
      const response = await fetch(`/api/lavorazioni/${lavorazioneSelezionata.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Errore nella cancellazione')
      }

      const result = await response.json()
      
      if (result.success) {
        setShowModal(false)
        setLavorazioneSelezionata(null)
        await caricaLavorazioni() // Ricarica la lista
        alert('Lavorazione eliminata con successo!')
      } else {
        throw new Error(result.error || 'Errore nella cancellazione')
      }
      
    } catch (error) {
      console.error('Errore cancellazione lavorazione:', error)
      alert(`Errore nella cancellazione: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`)
    }
  }

  const stats = {
    totali: lavorazioni.length,
    da_eseguire: lavorazioni.filter(l => l.stato === 'da_eseguire').length,
    in_corso: lavorazioni.filter(l => l.stato === 'in_corso').length,
    completata: lavorazioni.filter(l => l.stato === 'completata').length,
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
          Gestisci lavorazioni, utenti e configurazioni del sistema
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('lavorazioni')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'lavorazioni'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🔧 Lavorazioni
          </button>
          <button
            onClick={() => setActiveTab('utenti')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'utenti'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            👥 Utenti
          </button>
          <button
            onClick={() => setActiveTab('assegnazioni')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'assegnazioni'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            🏢 Assegnazioni Condomini
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'utenti' && <GestioneUtenti />}
      {activeTab === 'assegnazioni' && <GestioneAssegnazioni />}
      
      {activeTab === 'lavorazioni' && (
        <div className="space-y-6">

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
              <div className="text-2xl font-bold text-yellow-600">{stats.da_eseguire}</div>
              <div className="text-yellow-800 text-sm">Da Eseguire</div>
            </div>
            <div className="text-yellow-400 text-2xl">⏳</div>
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.in_corso}</div>
              <div className="text-blue-800 text-sm">In Corso</div>
            </div>
            <div className="text-blue-400 text-2xl">🔄</div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.completata}</div>
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
        
        <button
          onClick={() => setShowWizardLavorazioni(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 ml-auto"
        >
          <span>✨</span>
          Nuova Lavorazione
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
            {lavorazioni.map((lavorazione) => {
              if (!lavorazione || !lavorazione.id) return null
              
              return (
                <div key={lavorazione.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getStatoIcon(lavorazione.stato)}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatoColor(lavorazione.stato)}`}>
                        {lavorazione.stato.toUpperCase()}
                      </span>
                      {isClient && (lavorazione as any)?.priorita && (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          (lavorazione as any).priorita === 'alta' ? 'bg-red-100 text-red-800' :
                          (lavorazione as any).priorita === 'media' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {(lavorazione as any).priorita === 'alta' ? '🔴 ALTA' :
                           (lavorazione as any).priorita === 'media' ? '🟡 MEDIA' :
                           '⚪ BASSA'}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {lavorazione.descrizione}
                    </h3>
                    
                    {isClient ? (
                      <div className="text-sm text-gray-600 space-y-1 mb-3">
                        {/* Informazioni principali con controlli sicuri */}
                        {(lavorazione as any).condomini?.nome && (
                          <div className="bg-blue-50 p-2 rounded">
                            <strong>🏢 Condominio:</strong> {(lavorazione as any).condomini.nome}
                            {(lavorazione as any).condomini?.indirizzo && (
                              <div className="text-xs text-gray-500 mt-1">
                                📍 {(lavorazione as any).condomini.indirizzo}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {(lavorazione as any).users?.nome && (
                          <div className="bg-green-50 p-2 rounded">
                            <strong>👤 Assegnato a:</strong> {(lavorazione as any).users.nome} {(lavorazione as any).users.cognome || ''}
                            {(lavorazione as any).users?.username && (
                              <div className="text-xs text-gray-500">
                                @{(lavorazione as any).users.username}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {(lavorazione as any).tipologia && (
                          <div className="bg-yellow-50 p-2 rounded">
                            <strong>🔧 Tipo:</strong> {
                              (lavorazione as any).tipologia === 'manutenzione' ? 'Manutenzione Ordinaria' :
                              (lavorazione as any).tipologia === 'riparazione' ? 'Riparazione Urgente' :
                              (lavorazione as any).tipologia === 'verifica' ? 'Verifica Tecnica' :
                              (lavorazione as any).tipologia === 'sicurezza' ? 'Sicurezza e Conformità' :
                              (lavorazione as any).tipologia === 'pulizia' ? 'Pulizia Straordinaria' :
                              'Altro'
                            }
                          </div>
                        )}
                        
                        <div><strong>📅 Aperta:</strong> {formatDate(lavorazione.data_apertura)}</div>
                        {lavorazione.data_chiusura && (
                          <div><strong>✅ Chiusa:</strong> {formatDate(lavorazione.data_chiusura)}</div>
                        )}
                        {lavorazione.data_riapertura && (
                          <div><strong>🔄 Riaperta:</strong> {formatDate(lavorazione.data_riapertura)}</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600 space-y-1 mb-3">
                        <div><strong>📅 Aperta:</strong> {lavorazione.data_apertura}</div>
                        <div className="text-gray-500">Caricamento dettagli...</div>
                      </div>
                    )}
                    
                    {isClient && lavorazione.note && (
                      <div className="bg-gray-50 p-3 rounded-md mb-3">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          Note:
                        </div>
                        <div className="text-sm text-gray-600">
                          {typeof lavorazione.note === 'string' 
                            ? lavorazione.note 
                            : Array.isArray(lavorazione.note) 
                              ? (lavorazione.note as string[]).map((nota: string, index: number) => (
                                  <div key={index} className="flex items-start mb-1">
                                    <span className="text-blue-500 mr-2">•</span>
                                    {nota}
                                  </div>
                                ))
                              : 'Nessuna nota disponibile'
                          }
                        </div>
                      </div>
                    )}
                    
                    {/* Visualizzazione foto */}
                    {lavorazione.verifica?.dati_verifica && 
                      Object.entries(lavorazione.verifica.dati_verifica).some(([_, value]) => 
                        Array.isArray(value) && value.length > 0 && typeof value[0] === 'string' && value[0].startsWith('data:image')
                      ) && (
                        <div className="bg-blue-50 p-3 rounded-md">
                          <div className="text-sm font-medium text-gray-700 mb-3">
                            📷 Foto Allegate
                          </div>
                          <div className="space-y-4">
                            {Object.entries(lavorazione.verifica.dati_verifica)
                              .filter(([_, value]) => 
                                Array.isArray(value) && value.length > 0 && typeof value[0] === 'string' && value[0].startsWith('data:image')
                              )
                              .map(([nome, foto]) => (
                                <FotoViewer
                                  key={nome}
                                  foto={foto as string[]}
                                  nome={nome}
                                />
                              ))
                            }
                          </div>
                        </div>
                      )
                    }
                  </div>
                  
                  <div className="ml-4 flex flex-col gap-2">
                    <button
                      onClick={() => handleAzione(lavorazione, 'aggiungi_nota')}
                      className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 border border-blue-200 rounded"
                    >
                      📝 Aggiungi Nota
                    </button>
                    
                    {(lavorazione.stato === 'da_eseguire' || lavorazione.stato === 'in_corso') && (
                      <button
                        onClick={() => handleAzione(lavorazione, 'completa')}
                        className="text-green-600 hover:text-green-800 text-sm px-3 py-1 border border-green-200 rounded"
                      >
                        ✅ Completa
                      </button>
                    )}
                    
                    {lavorazione.stato === 'completata' && (
                      <button
                        onClick={() => handleAzione(lavorazione, 'riapri')}
                        className="text-orange-600 hover:text-orange-800 text-sm px-3 py-1 border border-orange-200 rounded"
                      >
                        🔄 Riapri
                      </button>
                    )}
                    
                    {/* Pulsanti CRUD */}
                    <button
                      onClick={() => handleModifica(lavorazione)}
                      className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 border border-blue-200 rounded"
                    >
                      ✏️ Modifica
                    </button>
                    
                    <button
                      onClick={() => handleCancella(lavorazione)}
                      className="text-red-600 hover:text-red-800 text-sm px-3 py-1 border border-red-200 rounded"
                    >
                      🗑️ Elimina
                    </button>
                  </div>
                </div>
              </div>
              )
            })}
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
              {azione === 'elimina' && '🗑️ Elimina Lavorazione'}
            </h3>
            
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">
                <strong>Lavorazione:</strong> {lavorazioneSelezionata.descrizione}
              </div>
              
              {azione === 'elimina' ? (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-800 text-sm">
                    ⚠️ <strong>Attenzione:</strong> Questa azione eliminerà definitivamente la lavorazione e non può essere annullata.
                  </p>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={azione === 'elimina' ? confermaEliminazione : confermaAzione}
                className={`px-4 py-2 text-white rounded-md transition-colors ${
                  azione === 'elimina' 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {azione === 'elimina' ? '🗑️ Elimina' : 'Conferma'}
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      )}

      {/* Wizard Nuova Lavorazione */}
      {showWizardLavorazioni && (
        <WizardLavorazioni
          onClose={() => setShowWizardLavorazioni(false)}
          onComplete={handleNuovaLavorazione}
        />
      )}

      {/* Modal di Successo Creazione Lavorazione */}
      {showSuccessModal && lavorazioneCreata && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center">
                <div className="text-3xl mr-3">✅</div>
                <h2 className="text-xl font-bold">Lavorazione Creata con Successo!</h2>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3">Dettagli Lavorazione:</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Condominio:</span>
                      <span className="font-medium">{
                        // Cerca il nome del condominio dalla lista caricata
                        lavorazioni.length > 0 
                          ? lavorazioni.find(l => l.condomini)?.condomini?.nome || lavorazioneCreata.condominio_id
                          : lavorazioneCreata.condominio_id
                      }</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipologia:</span>
                      <span className="font-medium">{
                        // Mappa la tipologia con il nome user-friendly
                        lavorazioneCreata.tipologia === 'manutenzione' ? 'Manutenzione Ordinaria' :
                        lavorazioneCreata.tipologia === 'riparazione' ? 'Riparazione Urgente' :
                        lavorazioneCreata.tipologia === 'verifica' ? 'Verifica Tecnica' :
                        lavorazioneCreata.tipologia === 'sicurezza' ? 'Sicurezza e Conformità' :
                        lavorazioneCreata.tipologia === 'pulizia' ? 'Pulizia Straordinaria' :
                        lavorazioneCreata.tipologia || 'Altro'
                      }</span>
                    </div>
                    {lavorazioneCreata.tipologia_verifica_nome && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Verifica Specifica:</span>
                        <span className="font-medium text-blue-600">{lavorazioneCreata.tipologia_verifica_nome}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Priorità:</span>
                      <span className={`font-medium px-2 py-1 rounded text-xs ${
                        lavorazioneCreata.priorita === 'urgente' ? 'bg-red-100 text-red-800' :
                        lavorazioneCreata.priorita === 'alta' ? 'bg-orange-100 text-orange-800' :
                        lavorazioneCreata.priorita === 'media' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {lavorazioneCreata.priorita}
                      </span>
                    </div>
                    {lavorazioneCreata.assegnato_a && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Assegnato a:</span>
                        <span className="font-medium text-blue-600">{lavorazioneCreata.assegnato_a}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                  <div className="flex items-start">
                    <div className="text-blue-400 mr-2">ℹ️</div>
                    <div>
                      <p className="text-sm text-blue-800 font-medium">Prossimi passi:</p>
                      <p className="text-sm text-blue-700 mt-1">
                        {lavorazioneCreata.assegnato_a 
                          ? "Il sopralluoghista riceverà una notifica e potrà iniziare la lavorazione."
                          : "Assegna la lavorazione a un sopralluoghista dalla lista lavorazioni."
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowSuccessModal(false)
                    setLavorazioneCreata(null)
                  }}
                  className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Chiudi
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false)
                    setLavorazioneCreata(null)
                    setShowWizardLavorazioni(true)
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crea Altra
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}