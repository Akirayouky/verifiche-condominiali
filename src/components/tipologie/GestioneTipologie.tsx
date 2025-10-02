'use client'

import { useState, useEffect } from 'react'
import { useTipologie } from '@/hooks/useTipologie'
import { TipologiaVerifica, CreateTipologiaRequest, UpdateTipologiaRequest } from '@/lib/types'
import TipologiaForm from './TipologiaForm'
import TipologiaTable from './TipologiaTable'

export default function GestioneTipologie() {
  const { 
    tipologie, 
    loading, 
    error, 
    createTipologia, 
    updateTipologia, 
    deleteTipologia,
    clearError 
  } = useTipologie()

  const [showForm, setShowForm] = useState(false)
  const [editingTipologia, setEditingTipologia] = useState<TipologiaVerifica | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 8000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  const handleCreateTipologia = async (data: CreateTipologiaRequest): Promise<boolean> => {
    setFormLoading(true)
    const success = await createTipologia(data)
    setFormLoading(false)

    if (success) {
      setShowForm(false)
      setSuccessMessage('Tipologia creata con successo!')
    }

    return success
  }

  const handleUpdateTipologia = async (data: CreateTipologiaRequest): Promise<boolean> => {
    if (!editingTipologia) return false

    const updateData: UpdateTipologiaRequest = {
      ...data,
      attiva: editingTipologia.attiva
    }

    setFormLoading(true)
    const success = await updateTipologia(editingTipologia.id, updateData)
    setFormLoading(false)

    if (success) {
      setEditingTipologia(null)
      setSuccessMessage('Tipologia aggiornata con successo!')
    }

    return success
  }

  const handleEditTipologia = (tipologia: TipologiaVerifica) => {
    setEditingTipologia(tipologia)
    setShowForm(false)
  }

  const handleDeleteTipologia = async (id: string): Promise<boolean> => {
    const success = await deleteTipologia(id)
    
    if (success) {
      setSuccessMessage('Tipologia eliminata con successo!')
    }

    return success
  }

  const handleToggleActive = async (id: string, attiva: boolean): Promise<boolean> => {
    const tipologia = tipologie.find(t => t.id === id)
    if (!tipologia) return false

    const updateData: UpdateTipologiaRequest = {
      nome: tipologia.nome,
      descrizione: tipologia.descrizione,
      campi_personalizzati: tipologia.campi_personalizzati,
      attiva
    }

    const success = await updateTipologia(id, updateData)
    
    if (success) {
      setSuccessMessage(`Tipologia ${attiva ? 'attivata' : 'disattivata'} con successo!`)
    }

    return success
  }

  const handleCancelEdit = () => {
    setEditingTipologia(null)
  }

  const handleNewTipologia = () => {
    setShowForm(true)
    setEditingTipologia(null)
  }

  const stats = {
    totale: tipologie.length,
    attive: tipologie.filter(t => t.attiva).length,
    conCampi: tipologie.filter(t => t.campi_personalizzati.length > 0).length
  }

  return (
    <div className="space-y-6">
      {/* Header con statistiche */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Tipologie Verifiche</h2>
          <p className="text-gray-600 mt-1">
            Configura le diverse tipologie di verifiche e i relativi campi personalizzati
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-purple-50 px-4 py-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.totale}</div>
            <div className="text-sm text-purple-800">Totale</div>
          </div>
          <div className="bg-green-50 px-4 py-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{stats.attive}</div>
            <div className="text-sm text-green-800">Attive</div>
          </div>
          <div className="bg-blue-50 px-4 py-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.conCampi}</div>
            <div className="text-sm text-blue-800">Con Campi</div>
          </div>
        </div>
      </div>

      {/* Messaggi di stato */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center">
            <span className="text-red-400 mr-3">❌</span>
            <div>
              <h4 className="text-red-800 font-medium">Errore</h4>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
            <button 
              onClick={clearError}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center">
            <span className="text-green-400 mr-3">✅</span>
            <div>
              <h4 className="text-green-800 font-medium">Successo</h4>
              <p className="text-green-700 text-sm mt-1">{successMessage}</p>
            </div>
            <button 
              onClick={() => setSuccessMessage(null)}
              className="ml-auto text-green-400 hover:text-green-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Pulsanti azioni */}
      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          <button
            onClick={handleNewTipologia}
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <span>➕</span>
            Nuova Tipologia
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <span>🔄</span>
            Ricarica
          </button>
        </div>

        <div className="text-sm text-gray-500">
          💡 Le tipologie disattive non appariranno nel wizard verifiche
        </div>
      </div>

      {/* Form di creazione */}
      {showForm && (
        <TipologiaForm
          onSubmit={handleCreateTipologia}
          onCancel={() => setShowForm(false)}
          loading={formLoading}
        />
      )}

      {/* Form di modifica */}
      {editingTipologia && (
        <TipologiaForm
          onSubmit={handleUpdateTipologia}
          onCancel={handleCancelEdit}
          loading={formLoading}
          initialData={{
            nome: editingTipologia.nome,
            descrizione: editingTipologia.descrizione,
            campi_personalizzati: editingTipologia.campi_personalizzati,
            attiva: editingTipologia.attiva
          }}
          isEdit={true}
        />
      )}

      {/* Tabella tipologie */}
      <TipologiaTable
        tipologie={tipologie}
        loading={loading}
        onEdit={handleEditTipologia}
        onDelete={handleDeleteTipologia}
        onToggleActive={handleToggleActive}
      />
    </div>
  )
}