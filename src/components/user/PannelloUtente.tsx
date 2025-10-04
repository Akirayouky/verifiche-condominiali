'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Lavorazione, Condominio, TipologiaVerifica } from '@/lib/types'
import WizardVerifiche from '@/components/verifiche/WizardVerifiche'
import { PDFGenerator, LavorazionePDF } from '@/lib/pdfGenerator'
import dynamic from 'next/dynamic'

// Carica QrScanner solo lato client
const QrScanner = dynamic(() => import('@/components/ui/QrScanner'), { ssr: false })

interface ModalDettaglioProps {
  lavorazione: Lavorazione
  onClose: () => void
}

function ModalDettaglioLavorazione({ lavorazione, onClose }: ModalDettaglioProps) {
  const generaPDF = () => {
    const pdfGenerator = new PDFGenerator()
    
    // Converti la lavorazione nel formato richiesto
    const lavorazionePDF: LavorazionePDF = {
      id: lavorazione.id,
      titolo: lavorazione.titolo || lavorazione.descrizione,
      descrizione: lavorazione.descrizione,
      stato: lavorazione.stato,
      priorita: lavorazione.priorita || 'media',
      data_apertura: lavorazione.data_apertura,
      data_completamento: (lavorazione as any).data_completamento || undefined,
      condominio: lavorazione.condomini ? {
        nome: lavorazione.condomini.nome,
        indirizzo: lavorazione.condomini.indirizzo || undefined
      } : undefined,
      utente: lavorazione.users ? {
        nome: lavorazione.users.nome,
        cognome: lavorazione.users.cognome,
        email: lavorazione.users.email
      } : undefined,
      note: typeof lavorazione.note === 'string' ? lavorazione.note : 
             Array.isArray(lavorazione.note) ? lavorazione.note.join('\n') : undefined,
      allegati: lavorazione.allegati || undefined
    }
    
    // Scarica il PDF
    pdfGenerator.downloadPDF(lavorazionePDF)
  }

  const getStatoInfo = (stato: string) => {
    switch (stato) {
      case 'aperta':
      case 'da_eseguire':
        return { 
          icon: '🔴', 
          color: 'bg-red-100 text-red-800',
          label: 'DA ESEGUIRE',
          description: 'Verifica da iniziare'
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
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const statoInfo = getStatoInfo(lavorazione.stato)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-3xl mr-4">{statoInfo.icon}</span>
              <div>
                <h2 className="text-2xl font-bold">
                  {lavorazione.titolo || lavorazione.descrizione}
                </h2>
                <div className="flex items-center mt-2">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${statoInfo.color.replace('text-', 'text-white bg-').replace('bg-', 'bg-white/20 text-')}`}>
                    {statoInfo.label}
                  </span>
                  <span className="ml-3 text-blue-100">ID: {lavorazione.id.substring(0, 8)}...</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl p-2"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informazioni Principali */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Informazioni Principali</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-gray-700">Descrizione:</span>
                    <div className="text-right max-w-sm">
                      <span className="text-gray-900">{lavorazione.descrizione}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Stato:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statoInfo.color}`}>
                      {statoInfo.description}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Priorità:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      lavorazione.priorita === 'alta' ? 'bg-red-100 text-red-800' :
                      lavorazione.priorita === 'media' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {(lavorazione.priorita || 'media').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Condominio */}
              {lavorazione.condomini && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🏢 Condominio</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="font-semibold text-blue-900">{lavorazione.condomini.nome}</div>
                    {lavorazione.condomini.indirizzo && (
                      <div className="text-blue-700 text-sm mt-1">📍 {lavorazione.condomini.indirizzo}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Assegnazione */}
              {lavorazione.users && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">👤 Assegnazione</h3>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="font-semibold text-green-900">
                      {lavorazione.users.nome} {lavorazione.users.cognome}
                    </div>
                    <div className="text-green-700 text-sm mt-1">📧 {lavorazione.users.email}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Date e Timeline */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Timeline</h3>
                <div className="space-y-3">
                  {lavorazione.data_apertura && (
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div>
                        <div className="font-medium">Creazione</div>
                        <div className="text-sm text-gray-600">{formatDate(lavorazione.data_apertura)}</div>
                      </div>
                    </div>
                  )}
                  
                  {lavorazione.data_assegnazione && (
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div>
                        <div className="font-medium">Assegnazione</div>
                        <div className="text-sm text-gray-600">{formatDate(lavorazione.data_assegnazione)}</div>
                      </div>
                    </div>
                  )}
                  
                  {lavorazione.stato === 'completata' && (
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="font-medium">Completamento</div>
                        <div className="text-sm text-gray-600">Completata</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tipologia Lavorazione */}
              {lavorazione.allegati && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 Tipologia</h3>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="font-semibold text-yellow-900">
                      {
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
                            return 'Tipo non specificato'
                          }
                        })()
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Note */}
          {lavorazione.note && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Note</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-gray-800 whitespace-pre-wrap">
                  {typeof lavorazione.note === 'string' 
                    ? lavorazione.note 
                    : Array.isArray(lavorazione.note) 
                      ? (lavorazione.note as string[]).join('\n• ')
                      : 'Nessuna nota disponibile'
                  }
                </div>
              </div>
            </div>
          )}

          {/* Placeholder per PDF Report */}
          {lavorazione.stato === 'completata' && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📄 Report</h3>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 text-center">
                <div className="text-4xl mb-4">📋</div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Report PDF Dettagliato</h4>
                <p className="text-gray-600 mb-4">Il report PDF con tutti i dettagli della verifica completata</p>
                <button 
                  onClick={generaPDF}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  📥 Scarica Report PDF
                </button>
                <div className="text-xs text-gray-500 mt-2">
                  Report automatico con tutti i dettagli della verifica
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PannelloUtente() {
  const { user } = useAuth()
  const [lavorazioni, setLavorazioni] = useState<Lavorazione[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLavorazione, setSelectedLavorazione] = useState<Lavorazione | null>(null)
  const [showWizard, setShowWizard] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailLavorazione, setDetailLavorazione] = useState<Lavorazione | null>(null)
  const [showQrScanner, setShowQrScanner] = useState(false)
  const [showLavorazioniModal, setShowLavorazioniModal] = useState(false)
  const [lavorazioniCondominio, setLavorazioniCondominio] = useState<Lavorazione[]>([])
  const [condominioSelezionato, setCondominioSelezionato] = useState<Condominio | null>(null)

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

  const handleQrScan = async (qrCode: string) => {
    try {
      // Trova il condominio dal QR code
      const condominioResponse = await fetch(`/api/condomini`)
      const condominioResult = await condominioResponse.json()
      
      if (!condominioResult.success) {
        alert('❌ Errore nel caricamento dei condomini')
        return
      }
      
      const condominio = condominioResult.data.find((c: Condominio) => c.qr_code === qrCode)
      
      if (!condominio) {
        alert('❌ QR Code non riconosciuto. Assicurati di scansionare un QR code valido.')
        return
      }
      
      // Trova TUTTE le lavorazioni aperte per questo condominio e questo utente
      const lavorazioniAperte = lavorazioni.filter(l => 
        l.condominio_id === condominio.id && 
        (l.stato === 'aperta' || l.stato === 'in_corso' || l.stato === 'riaperta')
      )
      
      if (lavorazioniAperte.length === 0) {
        alert(`❌ Nessuna lavorazione aperta trovata per il condominio "${condominio.nome}".\n\nVerifica che ti sia stata assegnata una lavorazione per questo condominio.`)
        return
      }
      
      // Chiudi lo scanner
      setShowQrScanner(false)
      
      // Se c'è UNA SOLA lavorazione, apri direttamente il wizard
      if (lavorazioniAperte.length === 1) {
        iniziaLavorazione(lavorazioniAperte[0])
      } else {
        // Se ci sono MULTIPLE lavorazioni, mostra il modal di selezione
        setCondominioSelezionato(condominio)
        setLavorazioniCondominio(lavorazioniAperte)
        setShowLavorazioniModal(true)
      }
      
    } catch (error) {
      console.error('Errore durante la ricerca della lavorazione:', error)
      alert('❌ Errore durante la ricerca della lavorazione')
    }
  }

  const mostraDettaglio = (lavorazione: Lavorazione) => {
    setDetailLavorazione(lavorazione)
    setShowDetailModal(true)
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
      {/* QR Scanner Modal */}
      {showQrScanner && (
        <QrScanner
          onScan={handleQrScan}
          onClose={() => setShowQrScanner(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            👷 Pannello Sopralluoghista
          </h2>
          <p className="text-gray-600">
            Benvenuto <strong>{user?.nome} {user?.cognome}</strong>! 
            Qui trovi tutte le verifiche assegnate da completare.
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowQrScanner(true)}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-6 py-2 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
            title="Scansiona QR Code per aprire verifica"
          >
            📷 Scansiona QR
          </button>
          
          <button
            onClick={async () => {
              if (window.confirm('Sei sicuro di voler pulire tutte le notifiche lette? Questa azione non può essere annullata.')) {
                try {
                  const response = await fetch(`/api/notifications/cleanup?userId=${user?.id}`, {
                    method: 'POST'
                  })
                  
                  if (response.ok) {
                    alert('✅ Notifiche pulite con successo!')
                    // Ricarica la pagina per aggiornare il contatore notifiche
                    window.location.reload()
                  } else {
                    throw new Error('Errore durante la pulizia')
                  }
                } catch (error) {
                  console.error('Errore pulizia notifiche:', error)
                  alert('❌ Errore durante la pulizia delle notifiche')
                }
              }
            }}
            className="bg-orange-100 hover:bg-orange-200 text-orange-800 px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
            title="Elimina tutte le notifiche lette"
          >
            🧹 Pulisci Notifiche
          </button>
        </div>
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
                    className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow"
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

                        {/* Footer con azioni */}
                        <div className="pt-4 border-t border-gray-100">
                          <div className="flex items-center justify-between space-x-3">
                            <button
                              onClick={() => mostraDettaglio(lavorazione)}
                              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                            >
                              👁️ Dettagli
                            </button>
                            <button
                              onClick={() => iniziaLavorazione(lavorazione)}
                              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              {lavorazione.stato === 'in_corso' 
                                ? '🔄 Continua' 
                                : '▶️ Inizia'
                              }
                            </button>
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

                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                          {lavorazione.data_apertura && (
                            <div>📅 Aperta: {formatDate(lavorazione.data_apertura)}</div>
                          )}
                          <div>✅ Completata</div>
                        </div>

                        {/* Pulsante dettagli per completate */}
                        <div className="pt-3 border-t border-green-200">
                          <button
                            onClick={() => mostraDettaglio(lavorazione)}
                            className="w-full px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                          >
                            👁️ Visualizza Dettagli Completi
                          </button>
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

      {/* Modal Dettaglio Lavorazione */}
      {showDetailModal && detailLavorazione && (
        <ModalDettaglioLavorazione
          lavorazione={detailLavorazione}
          onClose={() => {
            setShowDetailModal(false)
            setDetailLavorazione(null)
          }}
        />
      )}

      {/* Modal Selezione Lavorazioni per Condominio */}
      {showLavorazioniModal && condominioSelezionato && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6 rounded-t-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold mb-2">
                    🏢 {condominioSelezionato.nome}
                  </h3>
                  <p className="text-purple-100 text-sm">
                    {condominioSelezionato.indirizzo || 'Indirizzo non specificato'}
                  </p>
                  <p className="text-white mt-3 font-medium">
                    📋 {lavorazioniCondominio.length} lavorazion{lavorazioniCondominio.length === 1 ? 'e' : 'i'} aperte
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowLavorazioniModal(false)
                    setLavorazioniCondominio([])
                    setCondominioSelezionato(null)
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                >
                  <span className="text-2xl leading-none">×</span>
                </button>
              </div>
            </div>

            {/* Lista Lavorazioni */}
            <div className="p-6 space-y-4">
              <p className="text-gray-600 mb-4">
                Seleziona la lavorazione da iniziare:
              </p>
              
              {lavorazioniCondominio.map((lavorazione) => {
                const statoInfo = getStatoInfo(lavorazione.stato)
                
                return (
                  <div
                    key={lavorazione.id}
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => {
                      setShowLavorazioniModal(false)
                      setLavorazioniCondominio([])
                      setCondominioSelezionato(null)
                      iniziaLavorazione(lavorazione)
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statoInfo.color}`}>
                            {statoInfo.icon} {statoInfo.label}
                          </span>
                          {lavorazione.priorita && (
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              lavorazione.priorita === 'alta' ? 'bg-red-100 text-red-700' :
                              lavorazione.priorita === 'media' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {lavorazione.priorita === 'alta' ? '🔴 Alta' :
                               lavorazione.priorita === 'media' ? '🟡 Media' :
                               '⚪ Bassa'}
                            </span>
                          )}
                        </div>
                        
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {lavorazione.titolo || lavorazione.descrizione}
                        </h4>
                        
                        {lavorazione.descrizione && lavorazione.titolo !== lavorazione.descrizione && (
                          <p className="text-sm text-gray-600 mb-2">
                            {lavorazione.descrizione}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      {lavorazione.data_apertura && (
                        <div className="flex items-center gap-1">
                          <span>📅</span>
                          <span>Aperta: {formatDate(lavorazione.data_apertura)}</span>
                        </div>
                      )}
                      {lavorazione.data_scadenza && (
                        <div className="flex items-center gap-1">
                          <span>⏰</span>
                          <span>Scadenza: {new Date(lavorazione.data_scadenza).toLocaleDateString('it-IT')}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <button className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1">
                        ▶️ Inizia Verifica
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
              <button
                onClick={() => {
                  setShowLavorazioniModal(false)
                  setLavorazioniCondominio([])
                  setCondominioSelezionato(null)
                }}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wizard Lavorazione */}
      {showWizard && selectedLavorazione && (
        <WizardVerifiche
          lavorazione={selectedLavorazione}
          onBack={() => {
            setShowWizard(false)
            setSelectedLavorazione(null)
          }}
          onLavorazioneComplete={() => {
            setShowWizard(false)
            setSelectedLavorazione(null)
            caricaLavorazioni()
          }}
        />
      )}
    </div>
  )
}