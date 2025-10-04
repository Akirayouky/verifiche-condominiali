'use client'

import { useState } from 'react'

export default function DebugNotifichePage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const checkNotifiche = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug-notifiche')
      const data = await response.json()
      setResults(data)
    } catch (error) {
      setResults({ error: 'Errore connessione', details: error })
    } finally {
      setLoading(false)
    }
  }

  const createTestNotifica = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug-notifiche', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      setResults({ ...results, testCreation: data })
    } catch (error) {
      setResults({ ...results, testCreation: { error: 'Errore creazione test', details: error }})
    } finally {
      setLoading(false)
    }
  }

  const testSSE = () => {
    const userId = 'e1017f5d-83e1-4da3-ac81-4924a0dfd010' // Diego Marruchi
    const eventSource = new EventSource(`/api/notifications/stream?userId=${userId}`)
    
    console.log('🔗 Apertura connessione SSE...')
    
    eventSource.onopen = () => {
      console.log('✅ Connessione SSE aperta')
      setResults((prev: any) => ({ ...prev, sse: { status: 'connected', time: new Date().toISOString() }}))
    }
    
    eventSource.onmessage = (event) => {
      console.log('📨 Messaggio SSE ricevuto:', event.data)
      const data = JSON.parse(event.data)
      setResults((prev: any) => ({ 
        ...prev, 
        sse: { 
          ...prev?.sse,
          lastMessage: data,
          messagesCount: (prev?.sse?.messagesCount || 0) + 1
        }
      }))
    }
    
    eventSource.onerror = (error) => {
      console.error('❌ Errore SSE:', error)
      setResults((prev: any) => ({ ...prev, sse: { ...prev?.sse, error: 'Connection error' }}))
    }

    // Chiudi dopo 10 secondi
    setTimeout(() => {
      eventSource.close()
      console.log('🔌 Connessione SSE chiusa dopo test')
    }, 10000)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔍 Debug Sistema Notifiche</h1>
      
      <div className="space-y-4 mb-6">
        <button
          onClick={checkNotifiche}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Caricamento...' : '📊 Verifica Notifiche Database'}
        </button>
        
        <button
          onClick={createTestNotifica}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Creando...' : '🧪 Crea Notifica Test'}
        </button>
        
        <button
          onClick={testSSE}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          🔗 Test Connessione SSE (10s)
        </button>
      </div>

      {results && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">📋 Risultati Debug</h2>
          <pre className="text-sm overflow-auto bg-white p-3 rounded border">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">📝 Checklist Debug</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>1. ✅ Le notifiche vengono salvate nel database?</li>
          <li>2. ✅ L&apos;endpoint SSE funziona e invia messaggi?</li>
          <li>3. ❓ Il NotificationCenter riceve i messaggi SSE?</li>
          <li>4. ❓ Le notifiche appaiono nell&apos;interfaccia?</li>
        </ul>
      </div>
    </div>
  )
}