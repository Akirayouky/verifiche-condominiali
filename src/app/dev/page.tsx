'use client'

import { useState } from 'react'

export default function PannelloSviluppatore() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const authenticate = () => {
    if (password === 'Akirayouky Criogenia2025!?') {
      setIsAuthenticated(true)
    } else {
      alert('❌ Password non corretta!')
    }
  }

  const testAPI = async (endpoint: string, method: string = 'GET', body?: any) => {
    setLoading(true)
    try {
      const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' }
      }
      
      if (body) {
        options.body = JSON.stringify(body)
      }

      const response = await fetch(endpoint, options)
      const data = await response.json()
      
      setResults({
        endpoint,
        method,
        status: response.status,
        data,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      setResults({
        endpoint,
        method,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              🔧 Pannello Sviluppatore
            </h1>
            <p className="text-gray-600 text-sm">
              Accesso riservato agli sviluppatori
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Sviluppatore
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && authenticate()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Inserisci la password..."
              />
            </div>
            
            <button
              onClick={authenticate}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              🔓 Accedi
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🔧 Pannello Sviluppatore
          </h1>
          <p className="text-gray-600">
            Suite di test e debugging per il sistema di verifiche condominiali
          </p>
        </div>
        
        <button
          onClick={() => {
            setIsAuthenticated(false)
            setPassword('')
            setResults(null)
          }}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
        >
          🚪 Logout
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Test Database */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🗄️ Test Database
          </h2>
          
          <div className="space-y-3">
            <button
              onClick={() => testAPI('/api/debug-notifiche')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-left"
            >
              📊 Verifica Notifiche Database
            </button>
            
            <button
              onClick={() => testAPI('/api/debug-notifiche', 'POST')}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-left"
            >
              🧪 Crea Notifica Test
            </button>
            
            <button
              onClick={() => testAPI('/api/debug-db')}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors text-left"
            >
              🔍 Debug Strutture Database
            </button>
          </div>
        </div>

        {/* Test Notifiche Real-Time */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🔔 Test Notifiche Real-Time
          </h2>
          
          <div className="space-y-3">
            <button
              onClick={() => testAPI('/api/notifications/stream?userId=e1017f5d-83e1-4da3-ac81-4924a0dfd010')}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition-colors text-left"
            >
              🔗 Test SSE Connection
            </button>
            
            <button
              onClick={() => testAPI('/api/test-lavorazioni', 'POST', {
                userId: 'e1017f5d-83e1-4da3-ac81-4924a0dfd010',
                condominioId: '00000000-1111-2222-3333-444444444444'
              })}
              className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 transition-colors text-left"
            >
              📋 Test Lavorazione + Notifica
            </button>
            
            <button
              onClick={() => testAPI('/api/notifications/cleanup?userId=e1017f5d-83e1-4da3-ac81-4924a0dfd010', 'POST')}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors text-left"
            >
              🧹 Test Cleanup Notifiche
            </button>
          </div>
        </div>

        {/* Test Scheduler */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            ⏰ Test Scheduler
          </h2>
          
          <div className="space-y-3">
            <button
              onClick={() => testAPI('/api/notifications/scheduler', 'POST', { action: 'check-scadenze' })}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-left"
            >
              🔍 Controlla Scadenze
            </button>
            
            <button
              onClick={() => testAPI('/api/notifications/scheduler', 'POST', { action: 'send-daily-reminders' })}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors text-left"
            >
              📅 Test Reminder
            </button>
            
            <button
              onClick={() => testAPI('/api/notifications/scheduler', 'POST', { action: 'cleanup' })}
              className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition-colors text-left"
            >
              🧹 Cleanup Scheduler
            </button>
          </div>
        </div>

        {/* Test Cloudinary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            ☁️ Test Cloudinary
          </h2>
          
          <div className="space-y-3">
            <button
              onClick={() => testAPI('/api/migrate-foto')}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors text-left"
            >
              📸 Verifica Migrazione Foto
            </button>
            
            <button
              onClick={() => testAPI('/api/status')}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors text-left"
            >
              📊 Status Sistema
            </button>
            
            <button
              onClick={() => testAPI('/api/upload-foto', 'POST', { test: true })}
              className="w-full bg-cyan-600 text-white py-2 px-4 rounded-md hover:bg-cyan-700 transition-colors text-left"
            >
              🔧 Test Upload API
            </button>
          </div>
        </div>
      </div>

      {/* Risultati Test */}
      {results && (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              📊 Risultati Test
            </h2>
            <button
              onClick={() => setResults(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕ Chiudi
            </button>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-4 mb-4 text-sm">
              <span className="font-medium">Endpoint:</span>
              <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {results.method} {results.endpoint}
              </code>
              
              {results.status && (
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  results.status < 400 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {results.status}
                </span>
              )}
              
              <span className="text-gray-500 text-xs">
                {new Date(results.timestamp).toLocaleTimeString()}
              </span>
            </div>
            
            <pre className="text-sm overflow-auto bg-white p-4 rounded border max-h-96">
              {JSON.stringify(results.data || results.error, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="text-gray-700">Esecuzione test...</span>
            </div>
          </div>
        </div>
      )}

      {/* Info System */}
      <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">
          📋 Sistema Overview
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">🔔 Notifiche</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• SSE Real-time attivo</li>
              <li>• Badge count corretto</li>
              <li>• Cleanup automatico</li>
              <li>• Scheduler funzionante</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800 mb-2">☁️ Cloudinary</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• 25GB storage gratuito</li>
              <li>• CDN globale</li>
              <li>• Auto-optimization</li>
              <li>• PDF leggibili</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-800 mb-2">📱 PWA</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Installabile</li>
              <li>• Service Worker</li>
              <li>• Offline ready</li>
              <li>• Mobile optimized</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}