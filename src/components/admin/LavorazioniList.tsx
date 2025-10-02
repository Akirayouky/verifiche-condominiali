import { useState } from 'react'
import { Lavorazione } from '@/lib/types'

interface Props {
  lavorazioni: Lavorazione[]
  onLavorazioneChange: () => void
}

export default function LavorazioniList({ lavorazioni, onLavorazioneChange }: Props) {
  const [lavorazioneSelezionata, setLavorazioneSelezionata] = useState<Lavorazione | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

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

  const visualizzaDettagli = (lavorazione: Lavorazione) => {
    setLavorazioneSelezionata(lavorazione)
    setShowDetailModal(true)
  }

  const eseguiAzione = async (lavorazioneId: string, azione: string, nota?: string) => {
    try {
      const response = await fetch(`/api/lavorazioni/${lavorazioneId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          azione: azione,
          nota: nota
        })
      })

      const result = await response.json()
      
      if (result.success) {
        onLavorazioneChange()
        setShowDetailModal(false)
        setLavorazioneSelezionata(null)
      } else {
        console.error('Errore nell\'azione:', result.error)
      }
    } catch (err) {
      console.error('Errore nella richiesta:', err)
    }
  }

  return (
    <>
      {lavorazioni.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
          <div className="text-4xl mb-2">📋</div>
          <h3 className="text-lg font-medium mb-2">Nessuna lavorazione trovata</h3>
          <p>Non ci sono lavorazioni che corrispondono ai filtri selezionati</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border divide-y divide-gray-200">
          {lavorazioni.map((lavorazione) => (
            <div key={lavorazione.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">{getStatoIcon(lavorazione.stato)}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatoColor(lavorazione.stato)}`}>
                      {lavorazione.stato.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      ID: {lavorazione.id.substring(0, 8)}...
                    </span>
                  </div>
                  
                  <h3 className="text-base font-medium text-gray-900 mb-1">
                    {lavorazione.descrizione}
                  </h3>
                  
                  <div className="text-xs text-gray-600">
                    Aperta: {formatDate(lavorazione.dataApertura)}
                    {lavorazione.dataChiusura && (
                      <span> • Chiusa: {formatDate(lavorazione.dataChiusura)}</span>
                    )}
                    {lavorazione.note.length > 0 && (
                      <span> • {lavorazione.note.length} nota/e</span>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => visualizzaDettagli(lavorazione)}
                  className="text-blue-600 hover:text-blue-800 text-xs px-3 py-1 border border-blue-200 rounded"
                >
                  📋 Dettagli
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dettagli */}
      {showDetailModal && lavorazioneSelezionata && (
        <DettaglioLavorazioneModal
          lavorazione={lavorazioneSelezionata}
          onClose={() => setShowDetailModal(false)}
          onAzione={eseguiAzione}
        />
      )}
    </>
  )
}

interface ModalProps {
  lavorazione: Lavorazione
  onClose: () => void
  onAzione: (id: string, azione: string, nota?: string) => void
}

function DettaglioLavorazioneModal({ lavorazione, onClose, onAzione }: ModalProps) {
  const [nuovaNota, setNuovaNota] = useState('')
  const [azioneSelezionata, setAzioneSelezionata] = useState<string | null>(null)

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

  const confermaAzione = () => {
    if (azioneSelezionata) {
      onAzione(lavorazione.id, azioneSelezionata, nuovaNota || undefined)
      setNuovaNota('')
      setAzioneSelezionata(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                {getStatoIcon(lavorazione.stato)}
                Dettaglio Lavorazione
              </h3>
              <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${getStatoColor(lavorazione.stato)}`}>
                {lavorazione.stato.toUpperCase()}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Info Lavorazione */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-sm font-medium text-gray-700">ID Lavorazione</label>
              <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded font-mono">
                {lavorazione.id}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Descrizione</label>
              <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {lavorazione.descrizione}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Data Apertura</label>
                <div className="text-sm text-gray-900">
                  {formatDate(lavorazione.dataApertura)}
                </div>
              </div>

              {lavorazione.dataChiusura && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Data Chiusura</label>
                  <div className="text-sm text-gray-900">
                    {formatDate(lavorazione.dataChiusura)}
                  </div>
                </div>
              )}

              {lavorazione.dataRiapertura && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Data Riapertura</label>
                  <div className="text-sm text-gray-900">
                    {formatDate(lavorazione.dataRiapertura)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Note */}
          <div className="mb-6">
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              Note ({lavorazione.note.length})
            </label>
            
            {lavorazione.note.length > 0 ? (
              <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                <div className="space-y-2">
                  {lavorazione.note.map((nota, index) => (
                    <div key={index} className="flex items-start text-sm">
                      <span className="text-blue-500 mr-2 mt-0.5">•</span>
                      <span className="text-gray-700">{nota}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">Nessuna nota presente</div>
            )}
          </div>

          {/* Azioni */}
          <div className="border-t pt-6">
            <div className="flex flex-wrap gap-3 mb-4">
              <button
                onClick={() => setAzioneSelezionata('aggiungi_nota')}
                className="text-blue-600 hover:text-blue-800 px-4 py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
              >
                <span>📝</span>
                Aggiungi Nota
              </button>

              {lavorazione.stato === 'aperta' && (
                <button
                  onClick={() => setAzioneSelezionata('chiudi')}
                  className="text-green-600 hover:text-green-800 px-4 py-2 border border-green-200 rounded-lg hover:bg-green-50 transition-colors flex items-center gap-2"
                >
                  <span>✅</span>
                  Chiudi Lavorazione
                </button>
              )}

              {lavorazione.stato === 'chiusa' && (
                <button
                  onClick={() => setAzioneSelezionata('riapri')}
                  className="text-orange-600 hover:text-orange-800 px-4 py-2 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors flex items-center gap-2"
                >
                  <span>🔄</span>
                  Riapri Lavorazione
                </button>
              )}
            </div>

            {/* Form Azione */}
            {azioneSelezionata && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  {azioneSelezionata === 'aggiungi_nota' && 'Aggiungi Nota'}
                  {azioneSelezionata === 'chiudi' && 'Chiudi Lavorazione'}
                  {azioneSelezionata === 'riapri' && 'Riapri Lavorazione'}
                </h4>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {azioneSelezionata === 'aggiungi_nota' ? 'Testo della nota:' : 'Nota (opzionale):'}
                  </label>
                  <textarea
                    value={nuovaNota}
                    onChange={(e) => setNuovaNota(e.target.value)}
                    placeholder="Inserisci il testo..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setAzioneSelezionata(null)
                      setNuovaNota('')
                    }}
                    className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={confermaAzione}
                    disabled={azioneSelezionata === 'aggiungi_nota' && !nuovaNota.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Conferma
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}