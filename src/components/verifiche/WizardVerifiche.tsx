'use client'

import { useState, useEffect } from 'react'
import { Condominio, TipologiaVerifica, CreateVerificaRequest, Lavorazione } from '@/lib/types'
import { Step1, Step2, Step3 } from './WizardSteps'

interface WizardVerificheProps {
  // Modalità normale: wizard completo
  // Modalità lavorazione: wizard preconfigurato per una lavorazione esistente
  lavorazione?: Lavorazione
  onLavorazioneComplete?: (lavorazioneId: string) => void
  onBack?: () => void
}

export default function WizardVerifiche({ 
  lavorazione, 
  onLavorazioneComplete, 
  onBack 
}: WizardVerificheProps) {
  const isLavorazioneMode = !!lavorazione
  const [currentStep, setCurrentStep] = useState(isLavorazioneMode ? 2 : 1) // Salta Step 1 se è una lavorazione
  const [selectedCondominio, setSelectedCondominio] = useState<Condominio | null>(null)
  const [selectedTipologia, setSelectedTipologia] = useState<TipologiaVerifica | null>(null)
  const [datiVerifica, setDatiVerifica] = useState<Record<string, any>>({})
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [completata, setCompletata] = useState(false)

  // Carica i dati preconfigurati dalla lavorazione
  useEffect(() => {
    const caricaDatiLavorazione = async () => {
      if (lavorazione && lavorazione.verifica) {
        const verifica = lavorazione.verifica
        setLoading(true)
        
        try {
          // Carica condominio
          if (verifica.condominio_id) {
            const condominioResponse = await fetch(`/api/condomini/${verifica.condominio_id}`)
            if (condominioResponse.ok) {
              const condominioResult = await condominioResponse.json()
              if (condominioResult.success) {
                setSelectedCondominio(condominioResult.data)
              }
            }
          }

          // Carica tipologia
          if (verifica.tipologia_id) {
            const tipologiaResponse = await fetch(`/api/tipologie/${verifica.tipologia_id}`)
            if (tipologiaResponse.ok) {
              const tipologiaResult = await tipologiaResponse.json()
              if (tipologiaResult.success) {
                setSelectedTipologia(tipologiaResult.data)
              }
            }
          }

          // Carica dati esistenti se presenti
          if (verifica.dati_verifica) {
            setDatiVerifica(verifica.dati_verifica)
          }
          if (verifica.note) {
            setNote(verifica.note)
          }
        } catch (error) {
          console.error('Errore nel caricamento dei dati della lavorazione:', error)
        } finally {
          setLoading(false)
        }
      }
    }

    caricaDatiLavorazione()
  }, [lavorazione])

  const handleStep1Next = () => {
    if (selectedCondominio && selectedTipologia) {
      setCurrentStep(2)
    }
  }

  const handleStep2Next = async () => {
    // Se siamo in modalità lavorazione e la lavorazione è "da_eseguire", iniziala
    if (isLavorazioneMode && lavorazione && lavorazione.stato === 'da_eseguire') {
      try {
        await fetch(`/api/lavorazioni/${lavorazione.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            azione: 'inizia',
            nota: 'Verifica iniziata dal sopralluoghista'
          })
        })
      } catch (error) {
        console.error('Errore nell\'iniziare la lavorazione:', error)
      }
    }
    
    setCurrentStep(3)
  }

  const handlePrevious = () => {
    if (isLavorazioneMode && currentStep === 2) {
      // In modalità lavorazione, dal step 2 torna alla lista
      if (onBack) {
        onBack()
      }
      return
    }
    setCurrentStep(prev => prev - 1)
  }

  const handleComplete = async () => {
    if (!selectedCondominio || !selectedTipologia) return

    setLoading(true)

    try {
      if (isLavorazioneMode && lavorazione) {
        // Modalità lavorazione: aggiorna la lavorazione esistente
        const response = await fetch(`/api/lavorazioni/${lavorazione.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            azione: 'completa',
            dati_verifica: datiVerifica,
            nota: note
          })
        })

        const result = await response.json()

        if (result.success) {
          setCompletata(true)
          // Notifica al componente genitore
          setTimeout(() => {
            if (onLavorazioneComplete) {
              onLavorazioneComplete(lavorazione.id)
            }
          }, 2000)
        } else {
          alert('Errore nel completamento della lavorazione: ' + result.error)
        }
      } else {
        // Modalità normale: crea nuova verifica
        const verificaData: CreateVerificaRequest = {
          condominio_id: selectedCondominio.id,
          tipologia_id: selectedTipologia.id,
          dati_verifica: datiVerifica,
          note
        }

        const response = await fetch('/api/verifiche', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(verificaData)
        })

        const result = await response.json()

        if (result.success) {
          setCompletata(true)
          // Simula invio email
          setTimeout(() => {
            // Reset wizard dopo successo
            setCurrentStep(isLavorazioneMode ? 2 : 1)
            setSelectedCondominio(null)
            setSelectedTipologia(null)
            setDatiVerifica({})
            setNote('')
            setCompletata(false)
          }, 3000)
        } else {
          alert('Errore nel completamento della verifica: ' + result.error)
        }
      }
    } catch (error) {
      alert('Errore di connessione')
    }

    setLoading(false)
  }

  const handleReset = () => {
    setCurrentStep(1)
    setSelectedCondominio(null)
    setSelectedTipologia(null)
    setDatiVerifica({})
    setNote('')
    setCompletata(false)
  }

  const canProceedStep1 = !!(selectedCondominio && selectedTipologia)
  const canProceedStep2 = selectedTipologia ? 
    selectedTipologia.campi_personalizzati
      .filter(c => c.obbligatorio)
      .every(c => datiVerifica[c.nome] && datiVerifica[c.nome] !== '') 
    : true

  if (completata) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <div className="text-center">
            <div className="text-green-500 text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {isLavorazioneMode ? 'Lavorazione Completata!' : 'Verifica Completata con Successo!'}
            </h2>
            <div className="space-y-2 text-gray-600 mb-6">
              <p><strong>Condominio:</strong> {selectedCondominio?.nome}</p>
              <p><strong>Tipologia:</strong> {selectedTipologia?.nome}</p>
              <p><strong>Data:</strong> {new Date().toLocaleDateString('it-IT')}</p>
              {isLavorazioneMode && lavorazione && (
                <p><strong>Lavorazione:</strong> #{lavorazione.id}</p>
              )}
            </div>
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <div className="flex items-center justify-center text-green-700">
                <span className="mr-2">
                  {isLavorazioneMode ? '✅' : '📧'}
                </span>
                {isLavorazioneMode 
                  ? 'Lavorazione aggiornata e notificata all\'amministratore' 
                  : 'Email di notifica inviata con successo'
                }
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Reindirizzamento automatico in corso...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header con progress */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          {isLavorazioneMode ? 'Completa Lavorazione' : 'Wizard Verifiche'}
        </h2>
        {isLavorazioneMode && lavorazione && (
          <p className="text-gray-600 mb-4">
            <strong>Lavorazione #{lavorazione.id}:</strong> {lavorazione.descrizione}
          </p>
        )}
        
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-6">
          {(isLavorazioneMode ? [2, 3] : [1, 2, 3]).map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                step < currentStep 
                  ? 'bg-green-500 text-white' 
                  : step === currentStep 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
              }`}>
                {step < currentStep ? '✓' : step}
              </div>
              
              {index < (isLavorazioneMode ? [2, 3] : [1, 2, 3]).length - 1 && (
                <div className={`w-16 md:w-32 h-1 mx-2 ${
                  step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`}></div>
              )}
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className={`flex justify-between text-sm text-gray-600 ${isLavorazioneMode ? 'justify-around' : ''}`}>
          {!isLavorazioneMode && (
            <span className={currentStep === 1 ? 'font-medium text-blue-600' : ''}>
              Selezione
            </span>
          )}
          <span className={currentStep === 2 ? 'font-medium text-blue-600' : ''}>
            Compilazione
          </span>
          <span className={currentStep === 3 ? 'font-medium text-blue-600' : ''}>
            Riepilogo
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {currentStep === 1 && !isLavorazioneMode && (
          <Step1
            selectedCondominio={selectedCondominio}
            selectedTipologia={selectedTipologia}
            onCondominioChange={setSelectedCondominio}
            onTipologiaChange={setSelectedTipologia}
            onNext={handleStep1Next}
            canProceed={canProceedStep1}
          />
        )}

        {currentStep === 2 && selectedTipologia && (
          <Step2
            tipologia={selectedTipologia}
            datiVerifica={datiVerifica}
            onDatiChange={setDatiVerifica}
            onNext={handleStep2Next}
            onPrevious={handlePrevious}
            canProceed={canProceedStep2}
          />
        )}

        {currentStep === 3 && selectedCondominio && selectedTipologia && (
          <Step3
            condominio={selectedCondominio}
            tipologia={selectedTipologia}
            datiVerifica={datiVerifica}
            note={note}
            onNoteChange={setNote}
            onComplete={handleComplete}
            onPrevious={handlePrevious}
            loading={loading}
          />
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={handleReset}
          className="text-gray-600 hover:text-gray-800 text-sm flex items-center gap-1"
        >
          <span>🔄</span>
          Ricomincia
        </button>
        
        <div className="text-sm text-gray-500">
          💡 I dati vengono salvati automaticamente ad ogni passaggio
        </div>
      </div>
    </div>
  )
}