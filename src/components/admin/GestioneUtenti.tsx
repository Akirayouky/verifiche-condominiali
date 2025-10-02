'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  username: string
  email: string
  nome: string | null
  cognome: string | null
  role: string
  attivo: boolean
  created_at: string
  approved_at: string | null
}

export default function GestioneUtenti() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const caricaUtenti = async () => {
    try {
      const response = await fetch('/api/users')
      const result = await response.json()
      
      if (result.success) {
        setUsers(result.data)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Errore nel caricamento degli utenti')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    caricaUtenti()
  }, [])

  const approvaUtente = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          azione: 'approve'
        })
      })

      const result = await response.json()
      
      if (result.success) {
        await caricaUtenti() // Ricarica la lista
        alert('Utente approvato con successo!')
      } else {
        alert('Errore nell\'approvazione: ' + result.error)
      }
    } catch (err) {
      alert('Errore nell\'approvazione dell\'utente')
    }
  }

  const disattivaUtente = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          azione: 'deactivate'
        })
      })

      const result = await response.json()
      
      if (result.success) {
        await caricaUtenti()
        alert('Utente disattivato')
      } else {
        alert('Errore nella disattivazione: ' + result.error)
      }
    } catch (err) {
      alert('Errore nella disattivazione dell\'utente')
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

  const utentiDaApprovare = users.filter(user => !user.approved_at && user.role === 'sopralluoghista')
  const utentiApprovati = users.filter(user => user.approved_at || user.role === 'admin')

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-600">Caricamento utenti...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">👥 Gestione Utenti</h2>
        <p className="text-gray-600">Approva nuovi sopralluoghisti e gestisci gli account</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-600">❌ {error}</div>
        </div>
      )}

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-600">{utentiDaApprovare.length}</div>
              <div className="text-yellow-800 text-sm">Da Approvare</div>
            </div>
            <div className="text-yellow-400 text-2xl">⏳</div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">{utentiApprovati.length}</div>
              <div className="text-green-800 text-sm">Approvati</div>
            </div>
            <div className="text-green-400 text-2xl">✅</div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">{users.length}</div>
              <div className="text-blue-800 text-sm">Totali</div>
            </div>
            <div className="text-blue-400 text-2xl">👥</div>
          </div>
        </div>
      </div>

      {/* Utenti da Approvare */}
      {utentiDaApprovare.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">
            ⏳ Utenti in Attesa di Approvazione ({utentiDaApprovare.length})
          </h3>
          
          <div className="space-y-4">
            {utentiDaApprovare.map((user) => (
              <div key={user.id} className="bg-white p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {user.nome} {user.cognome}
                    </div>
                    <div className="text-sm text-gray-600">@{user.username}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="text-xs text-gray-400">
                      Registrato: {formatDate(user.created_at)}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => approvaUtente(user.id)}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm"
                    >
                      ✅ Approva
                    </button>
                    <button
                      onClick={() => disattivaUtente(user.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                    >
                      ❌ Rifiuta
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tutti gli Utenti */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Tutti gli Utenti</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {users.map((user) => (
            <div key={user.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-gray-600 font-medium">
                      {user.nome ? user.nome.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  <div>
                    <div className="font-medium text-gray-900">
                      {user.nome} {user.cognome} 
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">@{user.username} • {user.email}</div>
                    <div className="text-xs text-gray-500">
                      {user.approved_at ? 
                        `Approvato: ${formatDate(user.approved_at)}` : 
                        'In attesa di approvazione'
                      }
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    user.attivo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.attivo ? 'Attivo' : 'Disattivo'}
                  </span>
                  
                  {user.approved_at ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      ✅ Approvato
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                      ⏳ Pending
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}