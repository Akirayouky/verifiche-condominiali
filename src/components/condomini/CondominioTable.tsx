'use client'

import { useState } from 'react'
import { Condominio } from '@/lib/types'

interface CondominioTableProps {
  condomini: Condominio[]
  loading?: boolean
  onEdit: (condominio: Condominio) => void
  onDelete: (id: string) => Promise<boolean>
  onView?: (condominio: Condominio) => void
}

export default function CondominioTable({ 
  condomini, 
  loading = false, 
  onEdit, 
  onDelete,
  onView 
}: CondominioTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const success = await onDelete(id)
    setDeletingId(null)
    if (success) {
      setShowDeleteModal(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Qui potresti aggiungere un toast di conferma
    } catch (err) {
      console.error('Errore nel copiare il token:', err)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="ml-3 text-gray-600">Caricamento condomini...</span>
        </div>
      </div>
    )
  }

  if (condomini.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">🏢</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun condominio trovato</h3>
          <p className="text-gray-500">Inizia creando il tuo primo condominio</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            Condomini ({condomini.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome Condominio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Creazione
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ultima Modifica
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {condomini.map((condominio) => (
                <tr key={condominio.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {condominio.nome.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {condominio.nome}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {condominio.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(condominio.data_inserimento)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(condominio.data_ultima_modifica)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {onView && (
                        <button
                          onClick={() => onView(condominio)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Visualizza dettagli"
                        >
                          👁️
                        </button>
                      )}
                      <button
                        onClick={() => copyToClipboard(condominio.token)}
                        className="text-green-600 hover:text-green-900 transition-colors"
                        title="Copia Token"
                      >
                        🔑
                      </button>
                      <button
                        onClick={() => onEdit(condominio)}
                        className="text-indigo-600 hover:text-indigo-900 transition-colors"
                        title="Modifica"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setShowDeleteModal(condominio.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Elimina"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal di conferma eliminazione */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Conferma eliminazione
            </h3>
            <p className="text-gray-600 mb-6">
              Sei sicuro di voler eliminare questo condominio? Questa azione non può essere annullata.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(null)}
                disabled={deletingId === showDeleteModal}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                onClick={() => handleDelete(showDeleteModal)}
                disabled={deletingId === showDeleteModal}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed"
              >
                {deletingId === showDeleteModal ? (
                  <div className="flex items-center">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Eliminazione...
                  </div>
                ) : (
                  'Elimina'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}