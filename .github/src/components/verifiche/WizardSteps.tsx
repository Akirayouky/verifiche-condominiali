'use client'

import { useState, useEffect } from 'react'
import { useCondomini } from '@/hooks/useCondomini'
import { useTipologie } from '@/hooks/useTipologie'
import { Condominio, TipologiaVerifica, CampoPersonalizzato } from '@/lib/types'

interface Step1Props {
  selectedCondominio: Condominio | null
  selectedTipologia: TipologiaVerifica | null
  onCondominioChange: (condominio: Condominio) => void
  onTipologiaChange: (tipologia: TipologiaVerifica) => void
  onNext: () => void
  canProceed: boolean
}

export function Step1({ 
  selectedCondominio, 
  selectedTipologia, 
  onCondominioChange, 
  onTipologiaChange, 
  onNext,
  canProceed 
}: Step1Props) {
  const { condomini, loading: loadingCondomini } = useCondomini()
  const { tipologie, loading: loadingTipologie } = useTipologie()

  const condominioAttivi = condomini
  const tipologieAttive = tipologie.filter(t => t.attiva)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Step 1: Selezione Condominio e Tipologia
        </h3>
        <p className="text-gray-600 mb-6">
          Seleziona il condominio da verificare e il tipo di verifica da eseguire
        </p>
      </div>

      {/* Selezione Condominio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Seleziona Condominio *
        </label>
        {loadingCondomini ? (
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded-md"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {condominioAttivi.map((condominio) => (
              <button
                key={condominio.id}
                onClick={() => onCondominioChange(condominio)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  selectedCondominio?.id === condominio.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-medium">
                      {condominio.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{condominio.nome}</div>
                    <div className="text-sm text-gray-500">Token: {condominio.token}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        
        {!loadingCondomini && condominioAttivi.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-4xl mb-2">🏢</div>
            <p>Nessun condominio disponibile</p>
            <p className="text-sm">Aggiungi prima un condominio nella sezione apposita</p>
          </div>
        )}
      </div>

      {/* Selezione Tipologia */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Seleziona Tipologia Verifica *
        </label>
        {loadingTipologie ? (
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded-md"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {tipologieAttive.map((tipologia) => (
              <button
                key={tipologia.id}
                onClick={() => onTipologiaChange(tipologia)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  selectedTipologia?.id === tipologia.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3 mt-1">
                      <span className="text-green-600 font-medium">
                        {tipologia.nome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{tipologia.nome}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {tipologia.descrizione}
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        {tipologia.campiPersonalizzati.length} campi configurati
                      </div>
                    </div>
                  </div>
                  {selectedTipologia?.id === tipologia.id && (
                    <div className="text-green-500 text-xl">✓</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
        
        {!loadingTipologie && tipologieAttive.length === 0 && (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-4xl mb-2">📋</div>
            <p>Nessuna tipologia di verifica attiva</p>
            <p className="text-sm">Configura prima le tipologie nella sezione apposita</p>
          </div>
        )}
      </div>

      {/* Riepilogo selezioni */}
      {selectedCondominio && selectedTipologia && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Riepilogo Selezioni:</h4>
          <div className="space-y-1 text-sm">
            <div><strong>Condominio:</strong> {selectedCondominio.nome}</div>
            <div><strong>Tipologia:</strong> {selectedTipologia.nome}</div>
            <div><strong>Campi da compilare:</strong> {selectedTipologia.campiPersonalizzati.length}</div>
          </div>
        </div>
      )}

      {/* Pulsante Next */}
      <div className="flex justify-end pt-4">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Continua
          <span>→</span>
        </button>
      </div>
    </div>
  )
}

interface Step2Props {
  tipologia: TipologiaVerifica
  datiVerifica: Record<string, any>
  onDatiChange: (dati: Record<string, any>) => void
  onNext: () => void
  onPrevious: () => void
  canProceed: boolean
}

export function Step2({ 
  tipologia, 
  datiVerifica, 
  onDatiChange, 
  onNext, 
  onPrevious,
  canProceed 
}: Step2Props) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleFieldChange = (campo: CampoPersonalizzato, value: any) => {
    const newDati = { ...datiVerifica, [campo.nome]: value }
    onDatiChange(newDati)
    
    // Rimuovi errore se presente
    if (errors[campo.nome]) {
      const newErrors = { ...errors }
      delete newErrors[campo.nome]
      setErrors(newErrors)
    }
  }

  const validateFields = () => {
    const newErrors: Record<string, string> = {}
    
    tipologia.campiPersonalizzati.forEach(campo => {
      if (campo.obbligatorio) {
        const value = datiVerifica[campo.nome]
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          newErrors[campo.nome] = 'Questo campo è obbligatorio'
        }
      }
    })
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateFields()) {
      onNext()
    }
  }

  const renderField = (campo: CampoPersonalizzato) => {
    const value = datiVerifica[campo.nome] || ''
    const hasError = errors[campo.nome]

    switch (campo.tipo) {
      case 'testo':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(campo, e.target.value)}
            placeholder={campo.placeholder}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              hasError ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        )

      case 'numero':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(campo, parseFloat(e.target.value) || '')}
            placeholder={campo.placeholder}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              hasError ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        )

      case 'data':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(campo, e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              hasError ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        )

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={value === true}
              onChange={(e) => handleFieldChange(campo, e.target.checked)}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">
              {campo.placeholder || 'Seleziona se applicabile'}
            </span>
          </div>
        )

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(campo, e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              hasError ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Seleziona...</option>
            {campo.opzioni?.map((opzione, index) => (
              <option key={index} value={opzione}>
                {opzione}
              </option>
            ))}
          </select>
        )

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(campo, e.target.value)}
            placeholder={campo.placeholder}
            rows={4}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              hasError ? 'border-red-500' : 'border-gray-300'
            }`}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Step 2: Compilazione Dati Verifica
        </h3>
        <p className="text-gray-600 mb-4">
          Compila i campi richiesti per la verifica: <strong>{tipologia.nome}</strong>
        </p>
        <div className="text-sm text-gray-500">
          Campi obbligatori contrassegnati con *
        </div>
      </div>

      <div className="space-y-6">
        {tipologia.campiPersonalizzati.map((campo) => (
          <div key={campo.id}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {campo.nome}
              {campo.obbligatorio && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {renderField(campo)}
            
            {errors[campo.nome] && (
              <div className="text-red-500 text-sm mt-1">
                {errors[campo.nome]}
              </div>
            )}
          </div>
        ))}

        {tipologia.campiPersonalizzati.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📝</div>
            <p>Nessun campo configurato per questa tipologia</p>
            <p className="text-sm">Puoi procedere direttamente al passo successivo</p>
          </div>
        )}
      </div>

      {/* Pulsanti navigazione */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onPrevious}
          className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
        >
          <span>←</span>
          Indietro
        </button>
        
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          Continua
          <span>→</span>
        </button>
      </div>
    </div>
  )
}

interface Step3Props {
  condominio: Condominio
  tipologia: TipologiaVerifica
  datiVerifica: Record<string, any>
  note: string
  onNoteChange: (note: string) => void
  onComplete: () => void
  onPrevious: () => void
  loading?: boolean
}

export function Step3({ 
  condominio, 
  tipologia, 
  datiVerifica, 
  note,
  onNoteChange, 
  onComplete, 
  onPrevious,
  loading = false 
}: Step3Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Step 3: Riepilogo e Completamento
        </h3>
        <p className="text-gray-600 mb-6">
          Verifica i dati inseriti e completa la verifica
        </p>
      </div>

      {/* Riepilogo */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-4">Riepilogo Verifica</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-gray-700 mb-2">Informazioni Generali</h5>
            <div className="space-y-2 text-sm">
              <div><strong>Condominio:</strong> {condominio.nome}</div>
              <div><strong>Tipologia:</strong> {tipologia.nome}</div>
              <div><strong>Data:</strong> {new Date().toLocaleDateString('it-IT')}</div>
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-700 mb-2">Dati Raccolti</h5>
            <div className="space-y-2 text-sm">
              {Object.entries(datiVerifica).map(([campo, valore]) => (
                <div key={campo}>
                  <strong>{campo}:</strong> {
                    typeof valore === 'boolean' 
                      ? (valore ? 'Sì' : 'No')
                      : String(valore)
                  }
                </div>
              ))}
              {Object.keys(datiVerifica).length === 0 && (
                <div className="text-gray-500 italic">Nessun dato raccolto</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Note aggiuntive */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Note Aggiuntive
        </label>
        <textarea
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="Inserisci eventuali note, osservazioni o commenti sulla verifica..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
      </div>

      {/* Opzioni finali */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h5 className="font-medium text-blue-800 mb-2">Opzioni di Completamento</h5>
        <div className="space-y-2 text-sm text-blue-700">
          <div className="flex items-center">
            <span className="mr-2">📧</span>
            Email di notifica sarà inviata automaticamente
          </div>
          <div className="flex items-center">
            <span className="mr-2">💾</span>
            I dati verranno salvati nel sistema
          </div>
          <div className="flex items-center">
            <span className="mr-2">📋</span>
            La verifica sarà disponibile nel pannello amministratore
          </div>
        </div>
      </div>

      {/* Pulsanti navigazione */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onPrevious}
          disabled={loading}
          className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <span>←</span>
          Indietro
        </button>
        
        <button
          onClick={onComplete}
          disabled={loading}
          className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
              Completamento...
            </div>
          ) : (
            <>
              ✓ Completa Verifica
            </>
          )}
        </button>
      </div>
    </div>
  )
}