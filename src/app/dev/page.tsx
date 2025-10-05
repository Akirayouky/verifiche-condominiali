'use client'

import { useState } from 'react'

export default function PannelloSviluppatore() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  
  // Stati per reset database
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetType, setResetType] = useState<'all' | 'lavorazioni' | 'users' | 'condomini' | 'tipologie' | 'notifiche'>('all')
  const [password, setPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetResult, setResetResult] = useState<any>(null)

  const createQuickTest = async () => {
    setLoading(true)
    setStatus('📸 Generazione foto e firma...')
    try {
      // Genera foto e firma fake PICCOLE per evitare 405 (payload troppo grande)
      const createBase64 = (width: number, height: number, text: string): string => {
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        
        // Sfondo semplice senza gradient per ridurre dimensioni
        ctx.fillStyle = '#4F46E5'
        ctx.fillRect(0, 0, width, height)
        
        ctx.fillStyle = 'white'
        ctx.font = 'bold 14px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(text, width / 2, height / 2)
        
        // JPEG con qualità bassa per ridurre dimensioni
        return canvas.toDataURL('image/jpeg', 0.3)
      }

      // Immagini MOLTO piccole (50KB invece di 400KB)
      const foto1Base64 = createBase64(200, 150, 'FOTO 1')
      const foto2Base64 = createBase64(200, 150, 'FOTO 2')
      const firmaBase64 = createBase64(200, 80, 'FIRMA TEST')

      // GPS fake (Milano)
      const fotoGeo = [
        { url: foto1Base64, gps: { latitude: 45.4642, longitude: 9.1900, timestamp: new Date().toISOString() } },
        { url: foto2Base64, gps: { latitude: 45.4650, longitude: 9.1910, timestamp: new Date().toISOString() } }
      ]

      setStatus('📝 Creazione lavorazione...')
      // Step 1: Crea lavorazione
      const resLavorazione = await fetch('/api/lavorazioni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          condominio_id: '00000000-1111-2222-3333-444444444444',
          tipologia_id: '11111111-2222-3333-4444-555555555555',
          descrizione: 'Test Lavorazione - ' + new Date().toLocaleString('it-IT'),
          assegnato_a: 'e1017f5d-83e1-4da3-ac81-4924a0dfd010',
          tipologia: 'verifica',
          priorita: 'media'
        })
      })

      if (!resLavorazione.ok) throw new Error(`Creazione fallita: ${resLavorazione.status}`)

      const lavorazioneResponse = await resLavorazione.json()
      const lavorazioneId = lavorazioneResponse.data?.id

      if (!lavorazioneId) {
        throw new Error('ID lavorazione non trovato nella risposta')
      }

      setStatus('✅ Completamento lavorazione...')
      // Step 2: Completa con wizard (base64 come fa il wizard normale) - USA PUT con azione completa
      const resCompleta = await fetch(`/api/lavorazioni/${lavorazioneId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          azione: 'completa',
          dati: {
            dati_verifica: { test: true, timestamp: new Date().toISOString() },
            foto: [foto1Base64, foto2Base64],
            foto_geo: fotoGeo,
            firma: firmaBase64,
            note: 'Lavorazione di test con firma e GPS'
          }
        })
      })

      if (!resCompleta.ok) {
        const errorText = await resCompleta.text()
        throw new Error(`Completamento fallito: ${resCompleta.status} - ${errorText}`)
      }

      const completaResponse = await resCompleta.json()

      setStatus('')
      setResults({
        success: true,
        lavorazione_id: lavorazioneId,
        creazione: lavorazioneResponse,
        completamento: completaResponse,
        message: '✅ Lavorazione creata e completata con foto, GPS e firma!'
      })
    } catch (error) {
      setStatus('')
      setResults({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setLoading(false)
    }
  }

  const openResetModal = (type: 'all' | 'lavorazioni' | 'users' | 'condomini' | 'tipologie' | 'notifiche') => {
    setResetType(type)
    setPassword('')
    setResetResult(null)
    setShowResetModal(true)
  }

  const handleReset = async () => {
    if (!password) {
      setResetResult({ success: false, error: 'Inserisci la password' })
      return
    }

    setResetLoading(true)
    setResetResult(null)

    try {
      const response = await fetch('/api/dev/reset-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: resetType, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante il reset')
      }

      setResetResult(data)
      
      // Chiudi modal dopo 3 secondi se successo
      if (data.success) {
        setTimeout(() => {
          setShowResetModal(false)
          setPassword('')
        }, 3000)
      }
    } catch (error) {
      setResetResult({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setResetLoading(false)
    }
  }

  const getResetLabel = (type: string) => {
    const labels = {
      all: '🔥 Reset Completo Database',
      lavorazioni: '📋 Reset Lavorazioni',
      users: '👥 Reset Utenti',
      condomini: '🏢 Reset Condomini',
      tipologie: '📝 Reset Tipologie',
      notifiche: '🔔 Reset Notifiche'
    }
    return labels[type as keyof typeof labels] || 'Reset'
  }

  const getResetDescription = (type: string) => {
    const descriptions = {
      all: 'Elimina TUTTI i dati: lavorazioni, utenti (eccetto admin), condomini, tipologie, notifiche. Reset totale del sistema.',
      lavorazioni: 'Elimina solo le lavorazioni e i relativi allegati (foto, firma, note).',
      users: 'Elimina tutti gli utenti tranne l\'amministratore principale.',
      condomini: 'Elimina tutti i condomini dal sistema.',
      tipologie: 'Elimina tutte le tipologie di verifica.',
      notifiche: 'Elimina tutte le notifiche dal sistema.'
    }
    return descriptions[type as keyof typeof descriptions] || ''
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🔧 Pannello Sviluppatore</h1>
        <p className="text-gray-600">Test rapido e gestione database di sviluppo</p>
      </div>
      
      {/* Sezione Quick Test */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">🧪 Quick Test Lavorazione</h2>
        <p className="text-sm text-gray-600 mb-4">
          Crea una lavorazione completa con 2 foto fake, coordinate GPS (Milano) e firma digitale
        </p>
        
        <button
          onClick={createQuickTest}
          disabled={loading}
          className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-bold rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
        >
          {loading ? (status || 'Caricamento...') : '🚀 Crea Lavorazione Test Completa'}
        </button>
      </div>

      {/* Sezione Reset Database */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-red-600 mb-4">⚠️ Reset Database</h2>
        <p className="text-sm text-gray-600 mb-6">
          <strong className="text-red-600">ATTENZIONE:</strong> Queste operazioni eliminano i dati in modo permanente. Protette da password.
        </p>

        {/* Reset Completo */}
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
          <h3 className="font-bold text-red-800 mb-2">🔥 Reset Completo</h3>
          <p className="text-sm text-red-700 mb-3">Elimina TUTTI i dati dal database (lavorazioni, utenti, condomini, tipologie, notifiche)</p>
          <button
            onClick={() => openResetModal('all')}
            className="w-full px-4 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
          >
            🔥 Reset Database Completo
          </button>
        </div>

        {/* Reset Singoli */}
        <div className="grid md:grid-cols-2 gap-4">
          <button
            onClick={() => openResetModal('lavorazioni')}
            className="p-4 bg-orange-50 border border-orange-300 rounded-lg hover:bg-orange-100 transition-colors text-left"
          >
            <div className="font-bold text-orange-800 mb-1">📋 Reset Lavorazioni</div>
            <div className="text-xs text-orange-700">Elimina solo le lavorazioni</div>
          </button>

          <button
            onClick={() => openResetModal('users')}
            className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg hover:bg-yellow-100 transition-colors text-left"
          >
            <div className="font-bold text-yellow-800 mb-1">👥 Reset Utenti</div>
            <div className="text-xs text-yellow-700">Elimina utenti (tranne admin)</div>
          </button>

          <button
            onClick={() => openResetModal('condomini')}
            className="p-4 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors text-left"
          >
            <div className="font-bold text-blue-800 mb-1">🏢 Reset Condomini</div>
            <div className="text-xs text-blue-700">Elimina tutti i condomini</div>
          </button>

          <button
            onClick={() => openResetModal('tipologie')}
            className="p-4 bg-purple-50 border border-purple-300 rounded-lg hover:bg-purple-100 transition-colors text-left"
          >
            <div className="font-bold text-purple-800 mb-1">📝 Reset Tipologie</div>
            <div className="text-xs text-purple-700">Elimina tutte le tipologie</div>
          </button>

          <button
            onClick={() => openResetModal('notifiche')}
            className="p-4 bg-pink-50 border border-pink-300 rounded-lg hover:bg-pink-100 transition-colors text-left"
          >
            <div className="font-bold text-pink-800 mb-1">🔔 Reset Notifiche</div>
            <div className="text-xs text-pink-700">Elimina tutte le notifiche</div>
          </button>
        </div>
      </div>

      {/* Risultati Quick Test */}
      {results && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {results.success ? '✅ Risultato Test' : '❌ Errore'}
            </h2>
            <button
              onClick={() => setResults(null)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ✕ Chiudi
            </button>
          </div>
          
          {results.success && results.lavorazione_id && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-medium text-green-800 mb-2">🎉 {results.message}</p>
              <p className="text-sm text-green-700">
                <strong>ID Lavorazione:</strong> <code className="bg-white px-2 py-1 rounded">{results.lavorazione_id}</code>
              </p>
              <p className="text-sm text-green-700 mt-2">
                👉 Vai al <strong>Pannello Admin → Lavorazioni</strong> per vedere la lavorazione e generare il PDF
              </p>
            </div>
          )}
          
          <pre className="text-xs overflow-auto bg-gray-50 p-4 rounded border max-h-96">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}

      {/* Modal Reset Database */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-red-600 mb-4">
              {getResetLabel(resetType)}
            </h3>
            
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>⚠️ ATTENZIONE:</strong> {getResetDescription(resetType)}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password di conferma:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReset()}
                placeholder="Inserisci password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Inserisci la password admin per confermare l'operazione
              </p>
            </div>

            {resetResult && (
              <div className={`mb-4 p-3 rounded-lg ${resetResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                {resetResult.success ? (
                  <div>
                    <p className="text-sm font-medium text-green-800 mb-2">✅ {resetResult.message}</p>
                    {resetResult.deletedCount !== undefined && (
                      <p className="text-xs text-green-700">Elementi eliminati: {resetResult.deletedCount}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-red-800">❌ {resetResult.error}</p>
                )}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowResetModal(false)
                  setPassword('')
                  setResetResult(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={resetLoading}
              >
                Annulla
              </button>
              <button
                onClick={handleReset}
                disabled={resetLoading || !password}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold"
              >
                {resetLoading ? '⏳ Eliminazione...' : '🗑️ Conferma Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
