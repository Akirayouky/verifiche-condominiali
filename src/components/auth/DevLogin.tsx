'use client'

import { useState } from 'react'

interface DevLoginProps {
  onLoginSuccess: () => void
}

export default function DevLogin({ onLoginSuccess }: DevLoginProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        // Salva auth nel localStorage
        localStorage.setItem('dev_auth', JSON.stringify({
          authenticated: true,
          username: formData.username,
          timestamp: new Date().toISOString()
        }))
        onLoginSuccess()
      } else {
        setError(data.message || 'Credenziali non valide')
      }
    } catch (err) {
      setError('Errore durante l&apos;autenticazione')
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-purple-100 border-4 border-purple-300">
            <span className="text-3xl">⚙️</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Pannello Sviluppatore
          </h2>
          <p className="mt-2 text-center text-sm text-purple-200">
            Accesso riservato agli sviluppatori
          </p>
        </div>

        <form className="mt-8 space-y-6 bg-white rounded-lg shadow-xl p-8" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleInputChange}
                className="relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Inserisci username"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Inserisci password"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded p-4">
              <div className="flex items-center">
                <span className="text-red-500 mr-2">⚠️</span>
                <div className="text-red-700 text-sm">{error}</div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Verifica in corso...
                </div>
              ) : (
                <span className="flex items-center">
                  🔐 Accedi al Pannello Dev
                </span>
              )}
            </button>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500 text-center">
              🔒 Area riservata agli sviluppatori autorizzati
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
