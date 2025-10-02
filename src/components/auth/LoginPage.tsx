'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import RegisterForm from './RegisterForm'

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const success = await login(formData.username, formData.password)

      if (!success) {
        setError('Credenziali non valide. Controlla username e password.')
      }
    } catch (err) {
      setError('Errore durante il login')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setError('')
  }

  // Mostra form di registrazione
  if (showRegister) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <RegisterForm 
          onBack={() => setShowRegister(false)}
          onSuccess={() => {
            setRegistrationSuccess(true)
            setShowRegister(false)
          }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <span className="text-2xl">🏢</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verifiche Condominiali
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Accedi al sistema di gestione verifiche
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleInputChange}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Username"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          {/* Messaggio di successo registrazione */}
          {registrationSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <div className="text-green-600 text-sm">
                ✅ Registrazione completata! Il tuo account è in attesa di approvazione.
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="text-red-600 text-sm">⚠️ {error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Accesso...
                </div>
              ) : (
                <> Accedi</>
              )}
            </button>
          </div>

          {/* Registrazione link */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowRegister(!showRegister)}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {showRegister ? 'Torna al login' : 'Non hai un account? Registrati'}
            </button>
          </div>

          {/* Info credenziali per test */}
          <div className="bg-gray-50 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Credenziali Test:
            </h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p>� <strong>Admin:</strong> <code className="bg-gray-200 px-1 rounded">admin</code> / <code className="bg-gray-200 px-1 rounded">admin123</code></p>
              <p className="text-gray-500 mt-1">Gli altri account devono essere registrati</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}