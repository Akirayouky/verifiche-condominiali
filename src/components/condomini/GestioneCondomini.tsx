'use client'

import { useState, useEffect } from 'react'
import { useCondomini } from '@/hooks/useCondomini'
import { Condominio, CreateCondominioRequest } from '@/lib/types'
import CondominioForm from './CondominioForm'
import CondominioTable from './CondominioTable'
import { refreshStatsAfterDelay } from '@/lib/refreshStats'

export default function GestioneCondomini() {
  const { 
    condomini, 
    loading, 
    error, 
    createCondominio, 
    updateCondominio, 
    deleteCondominio, 
    clearError 
  } = useCondomini()

  const [showForm, setShowForm] = useState(false)
  const [editingCondominio, setEditingCondominio] = useState<Condominio | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Auto-hide success message dopo 5 secondi
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Auto-hide error message dopo 8 secondi
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 8000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  const handleCreateCondominio = async (data: CreateCondominioRequest): Promise<boolean> => {
    setFormLoading(true)
    const success = await createCondominio(data)
    setFormLoading(false)

    if (success) {
      setShowForm(false)
      setSuccessMessage('Condominio creato con successo!')
    }

    return success
  }

  const handleUpdateCondominio = async (data: CreateCondominioRequest): Promise<boolean> => {
    if (!editingCondominio) return false

    setFormLoading(true)
    const success = await updateCondominio(editingCondominio.id, data)
    setFormLoading(false)

    if (success) {
      setEditingCondominio(null)
      setSuccessMessage('Condominio aggiornato con successo!')
    }

    return success
  }

  const handleEditCondominio = (condominio: Condominio) => {
    setEditingCondominio(condominio)
    setShowForm(false) // Chiudi il form di creazione se aperto
  }

  const handleDeleteCondominio = async (id: string): Promise<boolean> => {
    const success = await deleteCondominio(id)
    
    if (success) {
      setSuccessMessage('Condominio eliminato con successo!')
      
      // 🔄 Refresh delle statistiche del dashboard
      refreshStatsAfterDelay(1000)
    }

    return success
  }

  const handleCancelEdit = () => {
    setEditingCondominio(null)
  }

  const handleNewCondominio = () => {
    setShowForm(true)
    setEditingCondominio(null) // Chiudi la modifica se aperta
  }

  const stats = {
    totale: condomini.length,
    recenti: condomini.filter(c => {
      const created = new Date(c.data_inserimento)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return created >= weekAgo
    }).length
  }

  return (
    <div className="space-y-6">
      {/* Header con statistiche */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Gestione Condomini</h2>
          <p className="text-gray-600 mt-1">
            Gestisci l&apos;anagrafica dei condomini e i relativi token di accesso
          </p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-blue-50 px-4 py-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totale}</div>
            <div className="text-sm text-blue-800">Totale</div>
          </div>
          <div className="bg-green-50 px-4 py-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{stats.recenti}</div>
            <div className="text-sm text-green-800">Ultimi 7gg</div>
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

      {/* Pulsante nuovo condominio */}
      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          <button
            onClick={handleNewCondominio}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <span>➕</span>
            Nuovo Condominio
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <span>🔄</span>
            Ricarica
          </button>
        </div>
      </div>

      {/* Form di creazione nuovo condominio */}
      {showForm && (
        <CondominioForm
          onSubmit={handleCreateCondominio}
          onCancel={() => setShowForm(false)}
          loading={formLoading}
        />
      )}

      {/* Form di modifica condominio esistente */}
      {editingCondominio && (
        <CondominioForm
          onSubmit={handleUpdateCondominio}
          onCancel={handleCancelEdit}
          loading={formLoading}
          initialData={{ nome: editingCondominio.nome }}
          isEdit={true}
        />
      )}

      {/* Tabella condomini */}
      <CondominioTable
        condomini={condomini}
        loading={loading}
        onEdit={handleEditCondominio}
        onDelete={handleDeleteCondominio}
      />
    </div>
  )
}