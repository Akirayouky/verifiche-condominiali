'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface User {
  id: string
  username: string
  email: string
  role: string
  nome: string
  cognome: string
  telefono: string
  attivo: boolean
  created_at: string
  last_login?: string
}

interface ModalCambioPasswordProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function ModalCambioPassword({ isOpen, onClose, onSuccess }: ModalCambioPasswordProps) {
  const [passwords, setPasswords] = useState({
    vecchiaPassword: '',
    nuovaPassword: '',
    confermaPassword: ''
  })
  const [salvando, setSalvando] = useState(false)
  const [errori, setErrori] = useState<string[]>([])
  const { user } = useAuth()

  const resetForm = () => {
    setPasswords({
      vecchiaPassword: '',
      nuovaPassword: '',
      confermaPassword: ''
    })
    setErrori([])
  }

  const validaPassword = (password: string): string[] => {
    const errori = []
    if (password.length < 8) {
      errori.push('La password deve essere di almeno 8 caratteri')
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errori.push('Deve contenere almeno una lettera minuscola')
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errori.push('Deve contenere almeno una lettera maiuscola')
    }
    if (!/(?=.*\d)/.test(password)) {
      errori.push('Deve contenere almeno un numero')
    }
    return errori
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const erroriValidazione = []
    
    // Validazioni
    if (!passwords.vecchiaPassword) {
      erroriValidazione.push('La password attuale è obbligatoria')
    }
    
    if (!passwords.nuovaPassword) {
      erroriValidazione.push('La nuova password è obbligatoria')
    } else {
      erroriValidazione.push(...validaPassword(passwords.nuovaPassword))
    }
    
    if (passwords.nuovaPassword !== passwords.confermaPassword) {
      erroriValidazione.push('Le password non corrispondono')
    }
    
    if (passwords.vecchiaPassword === passwords.nuovaPassword) {
      erroriValidazione.push('La nuova password deve essere diversa da quella attuale')
    }

    if (erroriValidazione.length > 0) {
      setErrori(erroriValidazione)
      return
    }

    setSalvando(true)
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          vecchiaPassword: passwords.vecchiaPassword,
          nuovaPassword: passwords.nuovaPassword
        })
      })

      const result = await response.json()
      
      if (result.success) {
        resetForm()
        onSuccess()
        onClose()
      } else {
        setErrori([result.error || 'Errore nel cambio password'])
      }
    } catch (error) {
      console.error('Errore cambio password:', error)
      setErrori(['Errore di connessione'])
    } finally {
      setSalvando(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center">
              <span className="mr-2">🔐</span>
              Cambia Password
            </h2>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {errori.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-800 text-sm">
                <ul className="list-disc list-inside space-y-1">
                  {errori.map((errore, index) => (
                    <li key={index}>{errore}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Password Attuale */}
            <div>
              <label htmlFor="vecchia-password" className="block text-sm font-medium text-gray-700 mb-2">
                Password Attuale *
              </label>
              <input
                id="vecchia-password"
                type="password"
                value={passwords.vecchiaPassword}
                onChange={(e) => setPasswords(prev => ({ ...prev, vecchiaPassword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Inserisci la password attuale"
                aria-describedby="vecchia-password-help"
                title="Inserisci la tua password attuale"
              />
            </div>

            {/* Nuova Password */}
            <div>
              <label htmlFor="nuova-password" className="block text-sm font-medium text-gray-700 mb-2">
                Nuova Password *
              </label>
              <input
                id="nuova-password"
                type="password"
                value={passwords.nuovaPassword}
                onChange={(e) => setPasswords(prev => ({ ...prev, nuovaPassword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Inserisci la nuova password"
                aria-describedby="nuova-password-help"
                title="Inserisci la nuova password (min 8 caratteri, maiuscole, minuscole e numeri)"
              />
              <div id="nuova-password-help" className="text-xs text-gray-500 mt-1">
                Min 8 caratteri, maiuscole, minuscole e numeri
              </div>
            </div>

            {/* Conferma Password */}
            <div>
              <label htmlFor="conferma-password" className="block text-sm font-medium text-gray-700 mb-2">
                Conferma Nuova Password *
              </label>
              <input
                id="conferma-password"
                type="password"
                value={passwords.confermaPassword}
                onChange={(e) => setPasswords(prev => ({ ...prev, confermaPassword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Conferma la nuova password"
                title="Conferma inserendo nuovamente la nuova password"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {salvando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Aggiornando...
                </>
              ) : (
                <>🔐 Aggiorna Password</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Helper per formattazione date consistente tra server e client
const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return 'Data non disponibile'
  
  try {
    const date = new Date(dateString)
    // Usa formato fisso per consistenza tra server e client
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    return `${day}/${month}/${year}`
  } catch {
    return 'Data non valida'
  }
}

const formatDateTimeForDisplay = (dateString: string): string => {
  if (!dateString) return 'Data non disponibile'
  
  try {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${day}/${month}/${year} ${hours}:${minutes}`
  } catch {
    return 'Data non valida'
  }
}

export default function ImpostazioniUtente() {
  const { user } = useAuth()
  const [userData, setUserData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalPassword, setModalPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [mounted, setMounted] = useState(false)

  // Assicura che il componente sia montato lato client
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && user?.id) {
      caricaDatiUtente()
    }
  }, [mounted, user?.id])

  const caricaDatiUtente = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/users/${user.id}`)
      const result = await response.json()
      
      if (result.success) {
        setUserData(result.data)
      } else {
        console.error('Errore caricamento utente:', result.error)
      }
    } catch (error) {
      console.error('Errore caricamento utente:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSuccess = () => {
    setSuccessMessage('Password aggiornata con successo!')
    setTimeout(() => setSuccessMessage(''), 5000)
  }

  // Prevent hydration mismatch - mostra loading fino a mount completo
  if (!mounted || loading || !userData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Caricamento impostazioni...</p>
        </div>
      </div>
    )
  }

  // Verifica extra per evitare errori di hydration su oggetti vuoti
  if (!userData.id || !userData.username || !userData.email) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-8 text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <p className="text-gray-500">Errore nel caricamento dei dati utente</p>
        </div>
      </div>
    )
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin': return 'Amministratore'
      case 'sopralluoghista': return 'Sopralluoghista'
      default: return role
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="mr-3">⚙️</span>
              Impostazioni Account
            </h2>
            <p className="text-gray-600 mt-1">
              Gestisci le informazioni del tuo profilo
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="m-6 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-green-800 text-sm flex items-center">
            <span className="mr-2">✅</span>
            {successMessage}
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informazioni Personali */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Informazioni Personali
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="user-nome" className="block text-sm font-medium text-gray-700 mb-2">
                      Nome
                    </label>
                    <input
                      id="user-nome"
                      type="text"
                      value={userData.nome || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      title="Nome dell'utente (sola lettura)"
                      placeholder="Nome non disponibile"
                    />
                  </div>
                  <div>
                    <label htmlFor="user-cognome" className="block text-sm font-medium text-gray-700 mb-2">
                      Cognome
                    </label>
                    <input
                      id="user-cognome"
                      type="text"
                      value={userData.cognome || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      title="Cognome dell'utente (sola lettura)"
                      placeholder="Cognome non disponibile"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="user-email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    id="user-email"
                    type="email"
                    value={userData.email || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    title="Indirizzo email dell'utente (sola lettura)"
                    placeholder="Email non disponibile"
                  />
                </div>

                <div>
                  <label htmlFor="user-telefono" className="block text-sm font-medium text-gray-700 mb-2">
                    Telefono
                  </label>
                  <input
                    id="user-telefono"
                    type="tel"
                    value={userData.telefono || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    title="Numero di telefono dell'utente (sola lettura)"
                    placeholder="Telefono non disponibile"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Informazioni Account */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Informazioni Account
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="user-username" className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    id="user-username"
                    type="text"
                    value={userData.username || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    title="Nome utente (sola lettura)"
                    placeholder="Username non disponibile"
                  />
                </div>

                <div>
                  <label htmlFor="user-ruolo" className="block text-sm font-medium text-gray-700 mb-2">
                    Ruolo
                  </label>
                  <input
                    id="user-ruolo"
                    type="text"
                    value={getRoleName(userData.role || '')}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    title="Ruolo dell'utente nel sistema (sola lettura)"
                    placeholder="Ruolo non disponibile"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stato Account
                  </label>
                  <div className="flex items-center">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      userData.attivo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {userData.attivo ? '🟢 Attivo' : '🔴 Disattivato'}
                    </span>
                  </div>
                </div>

                <div>
                  <label htmlFor="user-created" className="block text-sm font-medium text-gray-700 mb-2">
                    Registrato il
                  </label>
                  <input
                    id="user-created"
                    type="text"
                    value={formatDateForDisplay(userData.created_at || '')}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    title="Data di registrazione dell'account (sola lettura)"
                    placeholder="Data non disponibile"
                  />
                </div>

                {userData.last_login && (
                  <div>
                    <label htmlFor="user-last-login" className="block text-sm font-medium text-gray-700 mb-2">
                      Ultimo accesso
                    </label>
                    <input
                      id="user-last-login"
                      type="text"
                      value={formatDateTimeForDisplay(userData.last_login)}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      title="Data e ora dell'ultimo accesso (sola lettura)"
                      placeholder="Ultimo accesso non disponibile"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sezione Sicurezza */}
        <div className="border-t border-gray-200 pt-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Sicurezza
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Password</h4>
                <p className="text-sm text-gray-600">
                  Cambia la password del tuo account per mantenere sicuro l&apos;accesso
                </p>
              </div>
              <button
                onClick={() => setModalPassword(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <span className="mr-2">🔐</span>
                Cambia Password
              </button>
            </div>
          </div>
        </div>

        {/* Note informative */}
        <div className="border-t border-gray-200 pt-6 mt-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-2xl">ℹ️</span>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900">
                  Informazioni sui dati
                </h4>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>I dati personali possono essere modificati solo dall&apos;amministratore</li>
                    <li>È possibile cambiare autonomamente solo la password</li>
                    <li>Per modifiche ai dati personali, contatta l&apos;amministratore</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Cambio Password */}
      <ModalCambioPassword
        isOpen={modalPassword}
        onClose={() => setModalPassword(false)}
        onSuccess={handlePasswordSuccess}
      />
    </div>
  )
}