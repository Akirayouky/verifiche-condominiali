'use client'

import { useState } from 'react'
import { Condominio, TipologiaVerifica, CreateVerificaRequest } from '@/lib/types'
import { Step1, Step2, Step3 } from './WizardSteps'

export default function WizardVerifiche() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedCondominio, setSelectedCondominio] = useState<Condominio | null>(null)
  const [selectedTipologia, setSelectedTipologia] = useState<TipologiaVerifica | null>(null)
  const [datiVerifica, setDatiVerifica] = useState<Record<string, any>>({})
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [completata, setCompletata] = useState(false)

  const handleStep1Next = () => {
    if (selectedCondominio && selectedTipologia) {
      setCurrentStep(2)
    }
  }

  const handleStep2Next = () => {
    setCurrentStep(3)
  }

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleComplete = async () => {
    if (!selectedCondominio || !selectedTipologia) return

    setLoading(true)

    try {
      const verificaData: CreateVerificaRequest = {
        condominioId: selectedCondominio.id,
        tipologiaId: selectedTipologia.id,
        datiVerifica,
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
          setCurrentStep(1)
          setSelectedCondominio(null)
          setSelectedTipologia(null)
          setDatiVerifica({})
          setNote('')
          setCompletata(false)
        }, 3000)
      } else {
        alert('Errore nel completamento della verifica: ' + result.error)
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
    selectedTipologia.campiPersonalizzati
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
              Verifica Completata con Successo!
            </h2>
            <div className="space-y-2 text-gray-600 mb-6">
              <p><strong>Condominio:</strong> {selectedCondominio?.nome}</p>
              <p><strong>Tipologia:</strong> {selectedTipologia?.nome}</p>
              <p><strong>Data:</strong> {new Date().toLocaleDateString('it-IT')}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <div className="flex items-center justify-center text-green-700">
                <span className="mr-2">📧</span>
                Email di notifica inviata con successo
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
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Wizard Verifiche</h2>
        
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((step) => (
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
              
              {step < 3 && (
                <div className={`w-16 md:w-32 h-1 mx-2 ${
                  step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`}></div>
              )}
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className="flex justify-between text-sm text-gray-600">
          <span className={currentStep === 1 ? 'font-medium text-blue-600' : ''}>
            Selezione
          </span>
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
        {currentStep === 1 && (
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