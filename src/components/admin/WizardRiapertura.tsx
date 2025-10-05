'use client'

import { useState, useEffect } from 'react'
import { Lavorazione, CampoRiapertura, CampoEsistente } from '@/lib/types'

interface WizardRiaperturaProps {
  lavorazione: Lavorazione
  onClose: () => void
  onSuccess: () => void
  adminId: string
}

type Step = 1 | 2 | 3

export default function WizardRiapertura({
  lavorazione,
  onClose,
  onSuccess,
  adminId
}: WizardRiaperturaProps) {
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1: Motivo riapertura
  const [motivo, setMotivo] = useState('')

  // Step 2: Analisi campi esistenti
  const [campiEsistenti, setCampiEsistenti] = useState<CampoEsistente[]>([])
  const [campiMantenere, setCampiMantenere] = useState<Set<string>>(new Set())
  const [campiRicompilare, setCampiRicompilare] = useState<Set<string>>(new Set())

  // Step 3: Nuovi campi
  const [campiNuovi, setCampiNuovi] = useState<CampoRiapertura[]>([])
  const [nuovoCampo, setNuovoCampo] = useState<CampoRiapertura>({
    nome: '',
    tipo: 'text',
    label: '',
    required: false,
    descrizione: '',
    opzioni: []
  })

  // Carica campi esistenti dalla lavorazione
  useEffect(() => {
    // Per ora usiamo campi hardcoded o caricati dinamicamente
    // In futuro si potrebbero caricare da una tipologia o da allegati JSONB
    const campiBase: CampoEsistente[] = [
      { nome: 'descrizione', label: 'Descrizione', tipo: 'textarea', valore: lavorazione.descrizione || '', obbligatorio: true },
      { nome: 'note', label: 'Note', tipo: 'textarea', valore: lavorazione.note || '', obbligatorio: false },
      { nome: 'priorita', label: 'Priorità', tipo: 'select', valore: lavorazione.priorita, obbligatorio: true },
      { nome: 'data_scadenza', label: 'Data Scadenza', tipo: 'date', valore: lavorazione.data_scadenza || '', obbligatorio: false },
    ]
    
    // Se ci sono allegati JSON, prova a parsarli
    if (lavorazione.allegati) {
      try {
        const allegatiObj = typeof lavorazione.allegati === 'string' 
          ? JSON.parse(lavorazione.allegati) 
          : lavorazione.allegati
        
        if (allegatiObj && typeof allegatiObj === 'object') {
          Object.entries(allegatiObj).forEach(([nome, valore]) => {
            if (nome !== 'tipologia' && nome !== 'metadata') {
              campiBase.push({
                nome,
                label: formatLabel(nome),
                tipo: inferTipo(valore),
                valore,
                obbligatorio: false
              })
            }
          })
        }
      } catch (e) {
        console.warn('Errore parsing allegati:', e)
      }
    }
    
    setCampiEsistenti(campiBase)
    // Default: mantieni tutti i campi
    setCampiMantenere(new Set(campiBase.map(c => c.nome)))
  }, [lavorazione])

  const formatLabel = (nome: string): string => {
    return nome
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }

  const inferTipo = (valore: any): CampoRiapertura['tipo'] => {
    if (typeof valore === 'number') return 'number'
    if (typeof valore === 'boolean') return 'checkbox'
    if (Array.isArray(valore)) return 'file'
    if (typeof valore === 'string') {
      if (valore.match(/^\d{4}-\d{2}-\d{2}/)) return 'date'
      if (valore.length > 100) return 'textarea'
    }
    return 'text'
  }

  const handleNext = () => {
    if (step === 1) {
      if (motivo.trim().length < 10) {
        setError('Il motivo deve essere di almeno 10 caratteri')
        return
      }
      setError(null)
      setStep(2)
    } else if (step === 2) {
      setError(null)
      setStep(3)
    }
  }

  const handleBack = () => {
    setError(null)
    if (step > 1) setStep((step - 1) as Step)
  }

  const toggleMantieni = (nomeCampo: string) => {
    const nuoviMantenere = new Set(campiMantenere)
    const nuoviRicompilare = new Set(campiRicompilare)

    if (nuoviMantenere.has(nomeCampo)) {
      nuoviMantenere.delete(nomeCampo)
      nuoviRicompilare.add(nomeCampo)
    } else if (nuoviRicompilare.has(nomeCampo)) {
      nuoviRicompilare.delete(nomeCampo)
      nuoviMantenere.add(nomeCampo)
    } else {
      nuoviMantenere.add(nomeCampo)
    }

    setCampiMantenere(nuoviMantenere)
    setCampiRicompilare(nuoviRicompilare)
  }

  const aggiungiCampo = () => {
    if (!nuovoCampo.nome || !nuovoCampo.label) {
      setError('Nome e etichetta sono obbligatori')
      return
    }

    if (campiNuovi.some(c => c.nome === nuovoCampo.nome)) {
      setError('Esiste già un campo con questo nome')
      return
    }

    setCampiNuovi([...campiNuovi, { ...nuovoCampo }])
    setNuovoCampo({
      nome: '',
      tipo: 'text',
      label: '',
      required: false,
      descrizione: '',
      opzioni: []
    })
    setError(null)
  }

  const rimuoviCampo = (index: number) => {
    setCampiNuovi(campiNuovi.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      // Prepara i campi da ricompilare
      const campiDaRicompilare = campiEsistenti
        .filter(c => campiRicompilare.has(c.nome))
        .map(c => ({
          nome: c.nome,
          tipo: c.tipo,
          label: c.label,
          valore_precedente: c.valore
        }))

      const payload = {
        motivo: motivo.trim(),
        riaperta_da: adminId,
        campi_da_ricompilare: campiDaRicompilare,
        campi_nuovi: campiNuovi
      }

      const response = await fetch(`/api/lavorazioni/${lavorazione.id}/riapri`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Errore durante la riapertura')
      }

      console.log('✅ Lavorazione riaperta:', data)
      onSuccess()
    } catch (err) {
      console.error('❌ Errore riapertura:', err)
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-6">
          <h2 className="text-2xl font-bold">Riapri Lavorazione</h2>
          <p className="text-yellow-100 mt-1">
            {lavorazione.titolo || 'Lavorazione'}
          </p>
          
          {/* Progress indicator */}
          <div className="flex items-center mt-4 space-x-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`h-2 flex-1 rounded-full transition-all ${
                    s <= step ? 'bg-white' : 'bg-yellow-300'
                  }`}
                />
                {s < 3 && <div className="w-2" />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className={step === 1 ? 'font-bold' : 'opacity-75'}>1. Motivo</span>
            <span className={step === 2 ? 'font-bold' : 'opacity-75'}>2. Analisi Campi</span>
            <span className={step === 3 ? 'font-bold' : 'opacity-75'}>3. Nuovi Campi</span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
              <p className="font-bold">Errore</p>
              <p>{error}</p>
            </div>
          )}

          {/* Step 1: Motivo */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Perché stai riaprendo questa lavorazione?
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Spiega dettagliatamente il motivo della riapertura. Questo aiuterà il
                  sopralluoghista a comprendere cosa modificare. (Minimo 10 caratteri)
                </p>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Es: Le foto delle fessure sul muro nord non sono abbastanza dettagliate. Servono foto più ravvicinate con metro di riferimento..."
                  className="w-full h-32 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                  maxLength={500}
                />
                <div className="text-right text-sm text-gray-500 mt-1">
                  {motivo.length}/500 caratteri
                  {motivo.length >= 10 && <span className="text-green-600 ml-2">✓</span>}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Analisi Campi */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Gestisci i campi esistenti
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Decidi quali campi mantenere (✓) e quali far ricompilare al sopralluoghista (🔄)
                </p>
              </div>

              {campiEsistenti.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  Nessun campo disponibile in questa lavorazione
                </div>
              ) : (
                <div className="space-y-2">
                  {campiEsistenti.map((campo) => {
                    const mantieni = campiMantenere.has(campo.nome)
                    const ricompila = campiRicompilare.has(campo.nome)

                    return (
                      <div
                        key={campo.nome}
                        onClick={() => toggleMantieni(campo.nome)}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          mantieni
                            ? 'border-green-500 bg-green-50'
                            : ricompila
                            ? 'border-yellow-500 bg-yellow-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">
                                {mantieni ? '✓' : ricompila ? '🔄' : '○'}
                              </span>
                              <h4 className="font-semibold text-gray-800">
                                {campo.label}
                              </h4>
                              <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                                {campo.tipo}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1 ml-8">
                              Valore attuale:{' '}
                              <span className="font-mono bg-white px-2 py-0.5 rounded border">
                                {String(campo.valore).slice(0, 100)}
                                {String(campo.valore).length > 100 && '...'}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-sm text-blue-700">
                  <strong>Riepilogo:</strong>{' '}
                  {campiMantenere.size} campo/i da mantenere,{' '}
                  {campiRicompilare.size} campo/i da far ricompilare
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Nuovi Campi */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Aggiungi nuovi campi (opzionale)
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Crea nuovi campi che il sopralluoghista dovrà compilare
                </p>
              </div>

              {/* Form nuovo campo */}
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold text-gray-700 mb-3">Nuovo Campo</h4>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Nome campo (es: foto_dettaglio)"
                    value={nuovoCampo.nome}
                    onChange={(e) =>
                      setNuovoCampo({ ...nuovoCampo, nome: e.target.value })
                    }
                    className="border border-gray-300 rounded px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="Etichetta (es: Foto Dettaglio)"
                    value={nuovoCampo.label}
                    onChange={(e) =>
                      setNuovoCampo({ ...nuovoCampo, label: e.target.value })
                    }
                    className="border border-gray-300 rounded px-3 py-2"
                  />
                  <select
                    value={nuovoCampo.tipo}
                    onChange={(e) =>
                      setNuovoCampo({
                        ...nuovoCampo,
                        tipo: e.target.value as CampoRiapertura['tipo']
                      })
                    }
                    className="border border-gray-300 rounded px-3 py-2"
                    aria-label="Tipo di campo"
                  >
                    <option value="text">Testo</option>
                    <option value="textarea">Area Testo</option>
                    <option value="number">Numero</option>
                    <option value="date">Data</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="select">Select</option>
                    <option value="file">File/Foto</option>
                  </select>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={nuovoCampo.required}
                      onChange={(e) =>
                        setNuovoCampo({ ...nuovoCampo, required: e.target.checked })
                      }
                      className="rounded"
                    />
                    <span className="text-sm">Obbligatorio</span>
                  </label>
                  <textarea
                    placeholder="Descrizione/istruzioni per il sopralluoghista"
                    value={nuovoCampo.descrizione}
                    onChange={(e) =>
                      setNuovoCampo({ ...nuovoCampo, descrizione: e.target.value })
                    }
                    className="col-span-2 border border-gray-300 rounded px-3 py-2 h-20 resize-none"
                  />
                </div>
                <button
                  onClick={aggiungiCampo}
                  className="mt-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  + Aggiungi Campo
                </button>
              </div>

              {/* Lista campi aggiunti */}
              {campiNuovi.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-gray-700">
                    Campi da Aggiungere ({campiNuovi.length})
                  </h4>
                  {campiNuovi.map((campo, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between border border-green-300 bg-green-50 rounded-lg p-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{campo.label}</span>
                          <span className="text-xs bg-green-200 px-2 py-0.5 rounded">
                            {campo.tipo}
                          </span>
                          {campo.required && (
                            <span className="text-xs bg-red-200 text-red-700 px-2 py-0.5 rounded">
                              Obbligatorio
                            </span>
                          )}
                        </div>
                        {campo.descrizione && (
                          <p className="text-sm text-gray-600 mt-1">
                            {campo.descrizione}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => rimuoviCampo(index)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Riepilogo finale */}
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <p className="text-sm text-yellow-800 font-semibold mb-2">
                  Riepilogo Riapertura
                </p>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Motivo: {motivo.slice(0, 50)}...</li>
                  <li>• Campi da mantenere: {campiMantenere.size}</li>
                  <li>• Campi da far ricompilare: {campiRicompilare.size}</li>
                  <li>• Nuovi campi da compilare: {campiNuovi.length}</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex justify-between">
          <button
            onClick={step === 1 ? onClose : handleBack}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            {step === 1 ? 'Annulla' : 'Indietro'}
          </button>
          <button
            onClick={step === 3 ? handleSubmit : handleNext}
            disabled={loading || (step === 1 && motivo.trim().length < 10)}
            className="px-6 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading && (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            <span>{step === 3 ? (loading ? 'Riapertura...' : 'Riapri Lavorazione') : 'Avanti'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
