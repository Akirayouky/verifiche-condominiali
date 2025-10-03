'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface NotaPersonale {
  id: string
  utente_id: string
  titolo: string
  contenuto: string
  data_creazione: string
  data_modifica: string
}

interface ModalNoteProps {
  nota?: NotaPersonale
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  mode: 'create' | 'edit' | 'view'
}

function ModalNote({ nota, isOpen, onClose, onSave, mode }: ModalNoteProps) {
  const [titolo, setTitolo] = useState('')
  const [contenuto, setContenuto] = useState('')
  const [salvando, setSalvando] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (nota && (mode === 'edit' || mode === 'view')) {
      setTitolo(nota.titolo)
      setContenuto(nota.contenuto)
    } else if (mode === 'create') {
      setTitolo('')
      setContenuto('')
    }
  }, [nota, mode, isOpen])

  const handleSave = async () => {
    if (!titolo.trim() || !contenuto.trim()) {
      alert('Titolo e contenuto sono obbligatori')
      return
    }

    setSalvando(true)
    try {
      const url = mode === 'create' ? '/api/note' : `/api/note/${nota?.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utente_id: user?.id,
          titolo: titolo.trim(),
          contenuto: contenuto.trim()
        })
      })

      const result = await response.json()
      
      if (result.success) {
        onSave()
        onClose()
      } else {
        alert(result.error || 'Errore nel salvataggio della nota')
      }
    } catch (error) {
      console.error('Errore salvataggio nota:', error)
      alert('Errore nel salvataggio della nota')
    } finally {
      setSalvando(false)
    }
  }

  if (!isOpen) return null

  const isViewMode = mode === 'view'
  const isCreateMode = mode === 'create'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center">
              <span className="mr-2">📝</span>
              {isCreateMode ? 'Nuova Nota' : isViewMode ? 'Visualizza Nota' : 'Modifica Nota'}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Titolo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titolo *
              </label>
              <input
                type="text"
                value={titolo}
                onChange={(e) => setTitolo(e.target.value)}
                disabled={isViewMode}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isViewMode ? 'bg-gray-50' : ''
                }`}
                placeholder="Inserisci un titolo per la nota..."
                maxLength={255}
              />
            </div>

            {/* Contenuto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contenuto *
              </label>
              <textarea
                value={contenuto}
                onChange={(e) => setContenuto(e.target.value)}
                disabled={isViewMode}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isViewMode ? 'bg-gray-50' : ''
                }`}
                rows={8}
                placeholder="Scrivi qui il contenuto della nota..."
              />
            </div>

            {/* Info metadata */}
            {nota && (
              <div className="text-sm text-gray-500 border-t pt-4">
                <p><strong>Creata:</strong> {new Date(nota.data_creazione).toLocaleString()}</p>
                {nota.data_modifica !== nota.data_creazione && (
                  <p><strong>Modificata:</strong> {new Date(nota.data_modifica).toLocaleString()}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            {isViewMode ? 'Chiudi' : 'Annulla'}
          </button>
          
          {!isViewMode && (
            <button
              onClick={handleSave}
              disabled={salvando}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {salvando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvataggio...
                </>
              ) : (
                <>💾 Salva</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function NotePersonali() {
  const { user } = useAuth()
  const [note, setNote] = useState<NotaPersonale[]>([])
  const [loading, setLoading] = useState(true)
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    nota?: NotaPersonale
    mode: 'create' | 'edit' | 'view'
  }>({
    isOpen: false,
    mode: 'create'
  })

  useEffect(() => {
    if (user?.id) {
      caricaNote()
    }
  }, [user?.id])

  const caricaNote = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/note?utente_id=${user.id}`)
      const result = await response.json()
      
      if (result.success) {
        setNote(result.data || [])
      } else {
        console.error('Errore caricamento note:', result.error)
      }
    } catch (error) {
      console.error('Errore caricamento note:', error)
    } finally {
      setLoading(false)
    }
  }

  const eliminaNota = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa nota?')) return

    try {
      const response = await fetch(`/api/note/${id}?utente_id=${user?.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (result.success) {
        await caricaNote() // Ricarica la lista
      } else {
        alert(result.error || 'Errore nell\'eliminazione della nota')
      }
    } catch (error) {
      console.error('Errore eliminazione nota:', error)
      alert('Errore nell\'eliminazione della nota')
    }
  }

  const apriModal = (mode: 'create' | 'edit' | 'view', nota?: NotaPersonale) => {
    setModalState({ isOpen: true, mode, nota })
  }

  const chiudiModal = () => {
    setModalState({ isOpen: false, mode: 'create' })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Caricamento note...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="mr-3">📝</span>
              Note Personali
            </h2>
            <p className="text-gray-600 mt-1">
              Gestisci le tue note personali e promemoria
            </p>
          </div>
          <button
            onClick={() => apriModal('create')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <span className="mr-2">+</span>
            Nuova Nota
          </button>
        </div>
      </div>

      {/* Lista Note */}
      <div className="p-6">
        {note.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nessuna nota personale
            </h3>
            <p className="text-gray-500 mb-6">
              Inizia creando la tua prima nota per tenere traccia di promemoria e informazioni importanti.
            </p>
            <button
              onClick={() => apriModal('create')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Crea Prima Nota
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {note.map((nota) => (
              <div
                key={nota.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {nota.titolo}
                    </h3>
                    <p className="text-gray-600 mb-3 line-clamp-3">
                      {nota.contenuto.length > 150 
                        ? `${nota.contenuto.substring(0, 150)}...` 
                        : nota.contenuto
                      }
                    </p>
                    <div className="flex items-center text-sm text-gray-500">
                      <span>📅 {new Date(nota.data_creazione).toLocaleDateString()}</span>
                      {nota.data_modifica !== nota.data_creazione && (
                        <span className="ml-4">✏️ Modificata {new Date(nota.data_modifica).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => apriModal('view', nota)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      title="Visualizza"
                    >
                      👁️
                    </button>
                    <button
                      onClick={() => apriModal('edit', nota)}
                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded"
                      title="Modifica"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => eliminaNota(nota.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Elimina"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <ModalNote
        nota={modalState.nota}
        isOpen={modalState.isOpen}
        onClose={chiudiModal}
        onSave={caricaNote}
        mode={modalState.mode}
      />
    </div>
  )
}