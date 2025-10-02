'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const [loginType, setLoginType] = useState<'user' | 'admin'>('user')
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login, loginAsAdmin } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let success = false

      if (loginType === 'admin') {
        success = loginAsAdmin(formData.password)
      } else {
        success = await login(formData.username, formData.password)
      }

      if (!success) {
        setError(loginType === 'admin' 
          ? 'Password amministratore non corretta' 
          : 'Credenziali non valide'
        )
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
    setError('') // Reset errore quando l'utente digita
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

        {/* Switcher tipo login */}
        <div className="flex rounded-md shadow-sm">
          <button
            type="button"
            onClick={() => setLoginType('user')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-l-md border ${
              loginType === 'user' 
                ? 'bg-blue-500 text-white border-blue-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            👷 Sopralluoghista
          </button>
          <button
            type="button"
            onClick={() => setLoginType('admin')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
              loginType === 'admin' 
                ? 'bg-red-500 text-white border-red-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            ⚙️ Amministratore
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {loginType === 'user' && (
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
                  placeholder="Username (es: marco.rossi)"
                />
              </div>
            )}
            
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className={`relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 ${
                  loginType === 'user' ? 'rounded-b-md' : 'rounded-md'
                } focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                placeholder={loginType === 'admin' ? 'Password amministratore' : 'Password'}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="text-red-600 text-sm">⚠️ {error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                loginType === 'admin' 
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Accesso...
                </div>
              ) : (
                <>
                  {loginType === 'admin' ? '🔐' : '🚀'} Accedi
                </>
              )}
            </button>
          </div>

          {/* Info credenziali per test */}
          <div className="bg-gray-50 rounded-md p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              {loginType === 'admin' ? 'Credenziali Admin:' : 'Credenziali Test:'}
            </h4>
            {loginType === 'admin' ? (
              <div className="text-xs text-gray-600">
                <p>Password: <code className="bg-gray-200 px-1 rounded">admin123verifiche</code></p>
              </div>
            ) : (
              <div className="text-xs text-gray-600 space-y-1">
                <p>👤 <code className="bg-gray-200 px-1 rounded">marco.rossi</code> / <code className="bg-gray-200 px-1 rounded">marco.rossi</code></p>
                <p>👤 <code className="bg-gray-200 px-1 rounded">luca.bianchi</code> / <code className="bg-gray-200 px-1 rounded">luca.bianchi</code></p>
                <p className="text-gray-500 mt-1">Password = Username</p>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}