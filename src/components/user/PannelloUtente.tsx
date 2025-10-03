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
        // L'API con parametro ?utente= già filtra per user_id, 
        // quindi tutti i dati restituiti sono per l'utente corrente
        console.log('Lavorazioni ricevute dall\'API:', result.data.length)
        console.log('User ID corrente:', user.id)
        console.log('Prima lavorazione (sample):', result.data[0])
        
        setLavorazioni(result.data)
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
      case 'aperta':
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
      case 'archiviata':
        return { 
          icon: '📁', 
          color: 'bg-gray-100 text-gray-800',
          label: 'ARCHIVIATA',
          description: 'Verifica archiviata'
        }
      default:
        return { 
          icon: '📄', 
          color: 'bg-gray-100 text-gray-800',
          label: 'ALTRO',
          description: 'Lavorazione generica'
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

  // Filtri per le lavorazioni
  const lavorazioniDaFare = lavorazioni.filter(l => 
    l.stato === 'aperta' || l.stato === 'in_corso' || l.stato === 'riaperta'
  )
  const lavorazioniCompletate = lavorazioni.filter(l => l.stato === 'completata')

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

      {/* Sezione: Lavorazioni da Fare */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            🔧 Le mie lavorazioni ({lavorazioniDaFare.length})
          </h3>
          
          {lavorazioniDaFare.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">📋</div>
              <h3 className="text-lg font-medium mb-2">Nessuna lavorazione da completare</h3>
              <p>Al momento non hai verifiche in sospeso.</p>
              <p className="text-sm mt-2">Le nuove lavorazioni appariranno qui quando verranno assegnate dall&apos;amministratore.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lavorazioniDaFare.map((lavorazione) => {
                const statoInfo = getStatoInfo(lavorazione.stato)
                
                return (
                  <div
                    key={lavorazione.id}
                    className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => iniziaLavorazione(lavorazione)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Header con stato */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">{statoInfo.icon}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statoInfo.color}`}>
                              {statoInfo.label}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {lavorazione.id.substring(0, 8)}...
                          </div>
                        </div>

                        {/* Titolo/Descrizione */}
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          {lavorazione.titolo || lavorazione.descrizione}
                        </h4>
                        
                        {lavorazione.titolo && lavorazione.descrizione && lavorazione.titolo !== lavorazione.descrizione && (
                          <p className="text-sm text-gray-600 mb-3">
                            {lavorazione.descrizione}
                          </p>
                        )}

                        {/* Dati del condominio */}
                        {lavorazione.condomini && (
                          <div className="bg-blue-50 p-2 rounded mb-3">
                            <strong>🏢 Condominio:</strong> {lavorazione.condomini.nome}
                            {lavorazione.condomini.indirizzo && (
                              <div className="text-sm text-gray-600 mt-1">
                                📍 {lavorazione.condomini.indirizzo}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Assegnato a */}
                        {lavorazione.users && (
                          <div className="bg-green-50 p-2 rounded mb-3">
                            <strong>👤 Assegnato a:</strong> {lavorazione.users.nome} {lavorazione.users.cognome}
                            <div className="text-sm text-gray-600">
                              📧 {lavorazione.users.email}
                            </div>
                          </div>
                        )}

                        {/* Tipologia lavorazione */}
                        {lavorazione.allegati && (
                          <div className="bg-yellow-50 p-2 rounded mb-3">
                            <strong>🔧 Tipo:</strong> {
                              (() => {
                                try {
                                  const metadata = JSON.parse(lavorazione.allegati)
                                  if (metadata.tipologia === 'manutenzione') return 'Manutenzione Ordinaria'
                                  if (metadata.tipologia === 'riparazione') return 'Riparazione Urgente'
                                  if (metadata.tipologia === 'verifica') return 'Verifica Tecnica'
                                  if (metadata.tipologia === 'sicurezza') return 'Sicurezza e Conformità'
                                  if (metadata.tipologia === 'pulizia') return 'Pulizia Straordinaria'
                                  return metadata.tipologia || 'Altro'
                                } catch {
                                  return 'Altro'
                                }
                              })()
                            }
                          </div>
                        )}

                        {/* Date */}
                        <div className="text-sm text-gray-600 space-y-1 mb-3">
                          <div><strong>📅 Aperta:</strong> {formatDate(lavorazione.data_apertura)}</div>
                          {lavorazione.data_scadenza && (
                            <div><strong>⏰ Scadenza:</strong> {formatDate(lavorazione.data_scadenza)}</div>
                          )}
                          <div><strong>Assegnata:</strong> {
                            lavorazione.data_assegnazione 
                              ? formatDate(lavorazione.data_assegnazione)
                              : formatDate(lavorazione.data_apertura)
                          }</div>
                        </div>

                        {/* Note */}
                        {lavorazione.note && (
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

                        {/* Footer con azione */}
                        <div className="pt-4 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-600">
                              {lavorazione.stato === 'completata' 
                                ? '👁️ Visualizza dettagli' 
                                : lavorazione.stato === 'in_corso'
                                  ? '🔄 Continua lavorazione'
                                  : '▶️ Inizia lavorazione'
                              }
                            </span>
                            <span className="text-blue-500 text-lg">→</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sezione: Lavorazioni Completate */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            ✅ Lavorazioni completate ({lavorazioniCompletate.length})
          </h3>
          
          {lavorazioniCompletate.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">✅</div>
              <h3 className="text-lg font-medium mb-2">Nessuna lavorazione completata</h3>
              <p>Le lavorazioni completate appariranno qui.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lavorazioniCompletate.map((lavorazione) => {
                const statoInfo = getStatoInfo(lavorazione.stato)
                
                return (
                  <div
                    key={lavorazione.id}
                    className="bg-green-50 border border-green-200 rounded-lg p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Header con stato */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">{statoInfo.icon}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statoInfo.color}`}>
                              {statoInfo.label}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {lavorazione.id.substring(0, 8)}...
                          </div>
                        </div>

                        {/* Titolo/Descrizione */}
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          {lavorazione.titolo || lavorazione.descrizione}
                        </h4>
                        
                        {lavorazione.titolo && lavorazione.descrizione && lavorazione.titolo !== lavorazione.descrizione && (
                          <p className="text-sm text-gray-600 mb-3">
                            {lavorazione.descrizione}
                          </p>
                        )}

                        {/* Dati del condominio */}
                        {lavorazione.condomini && (
                          <div className="bg-white p-2 rounded mb-3">
                            <strong>🏢 Condominio:</strong> {lavorazione.condomini.nome}
                            {lavorazione.condomini.indirizzo && (
                              <div className="text-sm text-gray-600 mt-1">
                                📍 {lavorazione.condomini.indirizzo}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Note e data completamento */}
                        {lavorazione.note && (
                          <div className="bg-white p-2 rounded mb-3">
                            <strong>📝 Note:</strong>
                            <div className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                              {lavorazione.note}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          {lavorazione.data_apertura && (
                            <div>📅 Aperta: {formatDate(lavorazione.data_apertura)}</div>
                          )}
                          <div>✅ Completata</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}