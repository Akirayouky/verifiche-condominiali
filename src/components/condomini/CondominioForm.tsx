'use client'

import { useState } from 'react'
import { CreateCondominioRequest } from '@/lib/types'

interface CondominioFormProps {
  onSubmit: (data: CreateCondominioRequest) => Promise<boolean>
  onCancel?: () => void
  loading?: boolean
  initialData?: CreateCondominioRequest
  isEdit?: boolean
}

export default function CondominioForm({ 
  onSubmit, 
  onCancel, 
  loading = false, 
  initialData,
  isEdit = false 
}: CondominioFormProps) {
  const [formData, setFormData] = useState<CreateCondominioRequest>({
    nome: initialData?.nome || ''
  })
  const [errors, setErrors] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])

    // Validazione client-side
    const newErrors: string[] = []
    
    if (!formData.nome.trim()) {
      newErrors.push('Il nome del condominio è obbligatorio')
    } else if (formData.nome.length < 2) {
      newErrors.push('Il nome deve essere di almeno 2 caratteri')
    } else if (formData.nome.length > 100) {
      newErrors.push('Il nome non può superare i 100 caratteri')
    }

    if (newErrors.length > 0) {
      setErrors(newErrors)
      return
    }

    const success = await onSubmit(formData)
    if (success && !isEdit) {
      // Reset form solo se è un nuovo inserimento
      setFormData({ nome: '' })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Rimuovi errori quando l'utente inizia a digitare
    if (errors.length > 0) {
      setErrors([])
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {isEdit ? 'Modifica Condominio' : 'Nuovo Condominio'}
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
            Nome Condominio *
          </label>
          <input
            type="text"
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleInputChange}
            placeholder="Es: Condominio Via Roma 123"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
            maxLength={100}
          />
          <div className="mt-1 text-xs text-gray-500">
            {formData.nome.length}/100 caratteri
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
              isEdit ? 'Aggiorna Condominio' : 'Crea Condominio'
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