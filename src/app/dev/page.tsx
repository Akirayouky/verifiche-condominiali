'use client'

import { useState } from 'react'

export default function PannelloSviluppatore() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🔧 Pannello Sviluppatore</h1>
        <p className="text-gray-600">Test rapido lavorazione con foto, GPS e firma digitale</p>
      </div>
      
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
    </div>
  )
}
