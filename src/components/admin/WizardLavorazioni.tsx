'use client'

import { useState, useEffect } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

interface Condominio {
  id: string
  nome: string
  indirizzo: string
}

interface User {
  id: string
  username: string
  nome: string
  cognome: string
  role: 'admin' | 'sopralluoghista'
  attivo: boolean
}

interface TipologiaLavorazione {
  id: string
  nome: string
  descrizione: string
}

interface NuovaLavorazione {
  condominio_id: string
  tipologia: string
  tipologia_verifica_id?: string // ID della tipologia di verifica specifica
  descrizione: string
  priorita: 'bassa' | 'media' | 'alta' | 'urgente'
  assegnato_a?: string
  data_scadenza?: string
  note?: string
}

interface WizardLavorazioniProps {
  onClose: () => void
  onComplete: (lavorazione: NuovaLavorazione) => void
}

const tipologieLavorazioni = [
  { id: 'manutenzione', nome: 'Manutenzione Ordinaria', descrizione: 'Interventi di manutenzione preventiva e programmata' },
  { id: 'riparazione', nome: 'Riparazione Urgente', descrizione: 'Interventi correttivi su guasti o malfunzionamenti' },
  { id: 'verifica', nome: 'Verifica Tecnica', descrizione: 'Controlli e verifiche periodiche obbligatorie' },
  { id: 'sicurezza', nome: 'Sicurezza e Conformità', descrizione: 'Interventi per sicurezza e adeguamento normativo' },
  { id: 'pulizia', nome: 'Pulizia Straordinaria', descrizione: 'Interventi di pulizia e sanificazione' },
  { id: 'altro', nome: 'Altro', descrizione: 'Altre tipologie di lavorazione' }
]

export default function WizardLavorazioni({ onClose, onComplete }: WizardLavorazioniProps) {
  const [step, setStep] = useState(1)
  const [condomini, setCondomini] = useState<Condominio[]>([])
  const [sopralluoghisti, setSopralluoghisti] = useState<User[]>([])
  const [tipologieVerifiche, setTipologieVerifiche] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<NuovaLavorazione>({
    condominio_id: '',
    tipologia: '',
    descrizione: '',
    priorita: 'media'
  })

  useEffect(() => {
    caricaDati()
  }, [])

  const caricaDati = async () => {
    setLoading(true)
    try {
      // Carica condomini
      const condResponse = await fetch('/api/condomini')
      if (condResponse.ok) {
        const condResult = await condResponse.json()
        setCondomini(condResult.data || [])
      }

      // Carica sopralluoghisti
      const userResponse = await fetch('/api/users')
      if (userResponse.ok) {
        const userResult = await userResponse.json()
        setSopralluoghisti(
          userResult.data?.filter((u: User) => u.role === 'sopralluoghista' && u.attivo) || []
        )
      }

      // Carica tipologie di verifiche
      const tipResponse = await fetch('/api/tipologie')
      if (tipResponse.ok) {
        const tipResult = await tipResponse.json()
        setTipologieVerifiche(tipResult.data || [])
      }
    } catch (error) {
      console.error('Errore caricamento dati:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTotalSteps = () => {
    // Se è una verifica tecnica, aggiungiamo un step per selezionare la tipologia specifica
    return formData.tipologia === 'verifica' ? 4 : 3
  }

  const nextStep = () => {
    if (step < getTotalSteps()) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = () => {
    onComplete(formData)
  }

  const canProceedStep1 = formData.condominio_id && formData.tipologia
  const canProceedStep2 = formData.tipologia === 'verifica' ? 
    formData.tipologia_verifica_id !== undefined : true
  const canProceedStep3 = formData.descrizione.trim() !== ''
  const canSubmit = canProceedStep1 && canProceedStep2 && canProceedStep3

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-xl">
          <h2 className="text-2xl font-bold">Crea Nuova Lavorazione</h2>
          <div className="mt-4 flex justify-between items-center">
            <div className="flex space-x-2">
              {Array.from({ length: getTotalSteps() }, (_, i) => i + 1).map((i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    i <= step ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'
                  }`}
                >
                  {i}
                </div>
              ))}
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Selezione Condominio e Tipologia */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Seleziona Condominio e Tipologia
                </h3>
                
                {/* Selezione Condominio */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condominio *
                  </label>
                  <select
                    value={formData.condominio_id}
                    onChange={(e) => setFormData({ ...formData, condominio_id: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    aria-label="Seleziona condominio"
                  >
                    <option value="">Seleziona un condominio...</option>
                    {condomini.map((cond) => (
                      <option key={cond.id} value={cond.id}>
                        {cond.nome} {cond.indirizzo && `- ${cond.indirizzo}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selezione Tipologia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipologia Lavorazione *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tipologieLavorazioni.map((tipo) => (
                      <div
                        key={tipo.id}
                        onClick={() => setFormData({ 
                          ...formData, 
                          tipologia: tipo.id,
                          tipologia_verifica_id: undefined // Reset quando cambiamo tipologia
                        })}
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          formData.tipologia === tipo.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <h4 className="font-medium text-gray-800">{tipo.nome}</h4>
                        <p className="text-sm text-gray-600 mt-1">{tipo.descrizione}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Selezione Tipologia Verifica (solo per verifiche tecniche) */}
          {step === 2 && formData.tipologia === 'verifica' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Seleziona Tipologia di Verifica
              </h3>
              
              <p className="text-gray-600 mb-4">
                Scegli quale tipo specifico di verifica tecnica deve essere eseguita:
              </p>

              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                {tipologieVerifiche
                  .filter(tip => tip.attiva)
                  .map((tipologia) => (
                  <div
                    key={tipologia.id}
                    onClick={() => setFormData({ ...formData, tipologia_verifica_id: tipologia.id })}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      formData.tipologia_verifica_id === tipologia.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{tipologia.nome}</h4>
                        <p className="text-sm text-gray-600 mt-1">{tipologia.descrizione}</p>
                        {tipologia.campi_richiesti && tipologia.campi_richiesti.length > 0 && (
                          <p className="text-xs text-blue-600 mt-2">
                            {tipologia.campi_richiesti.length} campi da compilare
                          </p>
                        )}
                      </div>
                      {formData.tipologia_verifica_id === tipologia.id && (
                        <div className="text-blue-500 ml-2">✓</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {tipologieVerifiche.filter(t => t.attiva).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📋</div>
                  <p>Nessuna tipologia di verifica attiva trovata.</p>
                  <p className="text-sm">Crea delle tipologie di verifica prima di procedere.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2/3: Dettagli Lavorazione */}
          {((step === 2 && formData.tipologia !== 'verifica') || (step === 3 && formData.tipologia === 'verifica')) && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Dettagli della Lavorazione
              </h3>

              {/* Descrizione */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrizione *
                </label>
                <textarea
                  value={formData.descrizione}
                  onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                  placeholder="Descrivi dettagliatamente la lavorazione da eseguire..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Priorità */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priorità
                </label>
                <div className="flex space-x-3">
                  {[
                    { value: 'bassa', label: 'Bassa', color: 'green' },
                    { value: 'media', label: 'Media', color: 'yellow' },
                    { value: 'alta', label: 'Alta', color: 'orange' },
                    { value: 'urgente', label: 'Urgente', color: 'red' }
                  ].map((priorita) => (
                    <button
                      key={priorita.value}
                      onClick={() => setFormData({ ...formData, priorita: priorita.value as any })}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        formData.priorita === priorita.value
                          ? `bg-${priorita.color}-500 text-white`
                          : `bg-${priorita.color}-100 text-${priorita.color}-700 hover:bg-${priorita.color}-200`
                      }`}
                    >
                      {priorita.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Scadenza */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Scadenza (opzionale)
                </label>
                <input
                  type="date"
                  value={formData.data_scadenza || ''}
                  onChange={(e) => setFormData({ ...formData, data_scadenza: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  aria-label="Data scadenza lavorazione"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note aggiuntive (opzionale)
                </label>
                <textarea
                  value={formData.note || ''}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Note, istruzioni specifiche, contatti..."
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Step 3/4: Assegnazione */}
          {((step === 3 && formData.tipologia !== 'verifica') || (step === 4 && formData.tipologia === 'verifica')) && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Assegnazione Sopralluoghista
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assegna a (opzionale)
                </label>
                <select
                  value={formData.assegnato_a || ''}
                  onChange={(e) => setFormData({ ...formData, assegnato_a: e.target.value || undefined })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  aria-label="Assegna sopralluoghista"
                >
                  <option value="">Non assegnato (da assegnare dopo)</option>
                  {sopralluoghisti.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nome} {user.cognome} ({user.username})
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Puoi lasciare non assegnato e assegnare in seguito dalla lista lavorazioni
                </p>
              </div>

              {/* Riepilogo */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Riepilogo Lavorazione</h4>
                <div className="text-sm space-y-1">
                  <p><strong>Condominio:</strong> {condomini.find(c => c.id === formData.condominio_id)?.nome}</p>
                  <p><strong>Tipologia:</strong> {tipologieLavorazioni.find(t => t.id === formData.tipologia)?.nome}</p>
                  {formData.tipologia === 'verifica' && formData.tipologia_verifica_id && (
                    <p><strong>Verifica specifica:</strong> {tipologieVerifiche.find(t => t.id === formData.tipologia_verifica_id)?.nome}</p>
                  )}
                  <p><strong>Priorità:</strong> {formData.priorita}</p>
                  {formData.assegnato_a && (
                    <p><strong>Assegnato a:</strong> {sopralluoghisti.find(u => u.id === formData.assegnato_a)?.nome} {sopralluoghisti.find(u => u.id === formData.assegnato_a)?.cognome}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={prevStep}
              disabled={step === 1}
              className="flex items-center px-4 py-2 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              Indietro
            </button>

            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-600 hover:text-gray-800"
              >
                Annulla
              </button>
              
              {step < getTotalSteps() ? (
                <button
                  onClick={nextStep}
                  disabled={
                    (step === 1 && !canProceedStep1) ||
                    (step === 2 && !canProceedStep2) ||
                    (step === 3 && !canProceedStep3)
                  }
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Avanti
                  <ChevronRightIcon className="h-5 w-5 ml-1" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Crea Lavorazione
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}