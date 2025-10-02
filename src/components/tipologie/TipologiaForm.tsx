'use client'

import { useState } from 'react'
import { CreateTipologiaRequest, CampoPersonalizzato } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

interface TipologiaFormProps {
  onSubmit: (data: CreateTipologiaRequest) => Promise<boolean>
  onCancel?: () => void
  loading?: boolean
  initialData?: CreateTipologiaRequest & { attiva?: boolean }
  isEdit?: boolean
}

export default function TipologiaForm({ 
  onSubmit, 
  onCancel, 
  loading = false, 
  initialData,
  isEdit = false 
}: TipologiaFormProps) {
  const [formData, setFormData] = useState<CreateTipologiaRequest>({
    nome: initialData?.nome || '',
    descrizione: initialData?.descrizione || '',
    campi_richiesti: initialData?.campi_richiesti || []
  })
  const [errors, setErrors] = useState<string[]>([])

  const tipiCampo = [
    { value: 'testo', label: 'Testo' },
    { value: 'numero', label: 'Numero' },
    { value: 'data', label: 'Data' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'select', label: 'Lista selezione' },
    { value: 'textarea', label: 'Testo lungo' },
    { value: 'foto', label: '📷 Caricamento Foto' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])

    const newErrors: string[] = []
    
    if (!formData.nome.trim()) {
      newErrors.push('Il nome della tipologia è obbligatorio')
    }

    if (newErrors.length > 0) {
      setErrors(newErrors)
      return
    }

    const success = await onSubmit(formData)
    if (success && !isEdit) {
      setFormData({
        nome: '',
        descrizione: '',
        campi_richiesti: []
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors.length > 0) setErrors([])
  }

  const aggiungiCampo = () => {
    const nuovoCampo: Omit<CampoPersonalizzato, 'id'> = {
      nome: '',
      tipo: 'testo',
      obbligatorio: false
    }
    setFormData(prev => ({
      ...prev,
      campi_richiesti: [...prev.campi_richiesti, nuovoCampo]
    }))
  }

  const rimuoviCampo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      campi_richiesti: prev.campi_richiesti.filter((_, i) => i !== index)
    }))
  }

  const updateCampo = (index: number, campo: Partial<Omit<CampoPersonalizzato, 'id'>>) => {
    setFormData(prev => ({
      ...prev,
      campi_richiesti: prev.campi_richiesti.map((c, i) => 
        i === index ? { ...c, ...campo } : c
      )
    }))
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {isEdit ? 'Modifica Tipologia' : 'Nuova Tipologia'}
        </h3>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-600 text-sm">
            {errors.map((error, index) => (
              <div key={index}>• {error}</div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informazioni base */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Tipologia *
            </label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleInputChange}
              placeholder="Es: Verifica Antincendio"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrizione
            </label>
            <textarea
              name="descrizione"
              value={formData.descrizione}
              onChange={handleInputChange}
              placeholder="Descrivi brevemente questa tipologia di verifica..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
        </div>

        {/* Campi personalizzati */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-medium text-gray-800">Campi Personalizzati</h4>
            <button
              type="button"
              onClick={aggiungiCampo}
              disabled={loading}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
            >
              + Aggiungi Campo
            </button>
          </div>

          <div className="space-y-4">
            {formData.campi_richiesti.map((campo, index) => (
              <div key={index} className="border border-gray-200 p-4 rounded-md">
                <div className="flex justify-between items-start mb-3">
                  <h5 className="font-medium text-gray-700">Campo #{index + 1}</h5>
                  <button
                    type="button"
                    onClick={() => rimuoviCampo(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    🗑️
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Nome Campo</label>
                    <input
                      type="text"
                      value={campo.nome}
                      onChange={(e) => updateCampo(index, { nome: e.target.value })}
                      placeholder="Es: Numero estintori"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Tipo</label>
                    <select
                      value={campo.tipo}
                      onChange={(e) => updateCampo(index, { tipo: e.target.value as any })}
                      title="Tipo di campo"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      {tipiCampo.map(tipo => (
                        <option key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Placeholder</label>
                    <input
                      type="text"
                      value={campo.placeholder || ''}
                      onChange={(e) => updateCampo(index, { placeholder: e.target.value })}
                      placeholder="Testo di aiuto..."
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={campo.obbligatorio}
                        onChange={(e) => updateCampo(index, { obbligatorio: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">Campo obbligatorio</span>
                    </label>
                  </div>

                  {campo.tipo === 'select' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-600 mb-1">Opzioni (una per riga)</label>
                      <textarea
                        value={campo.opzioni?.join('\n') || ''}
                        onChange={(e) => updateCampo(index, { 
                          opzioni: e.target.value.split('\n').filter(opt => opt.trim() !== '') 
                        })}
                        placeholder="Opzione 1\nOpzione 2\nOpzione 3"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  )}

                  {campo.tipo === 'foto' && (
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Massimo foto consentite</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={campo.maxFoto || 5}
                        onChange={(e) => updateCampo(index, { maxFoto: parseInt(e.target.value) || 5 })}
                        placeholder="5"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Numero massimo di foto che gli utenti possono caricare (1-10)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {formData.campi_richiesti.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📝</div>
                <p>Nessun campo personalizzato configurato</p>
                <p className="text-sm">                <p>Clicca su &quot;Aggiungi Campo&quot; per iniziare</p></p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading || !formData.nome.trim()}
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                {isEdit ? 'Aggiornamento...' : 'Creazione...'}
              </div>
            ) : (
              isEdit ? 'Aggiorna Tipologia' : 'Crea Tipologia'
            )}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Annulla
            </button>
          )}
        </div>
      </form>
    </div>
  )
}