'use client'

import { useState } from 'react'

/**
 * Pulsante per creare rapidamente una lavorazione test completa
 * Include: foto, GPS, firma digitale
 */
export default function QuickTestButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const generaFirmaFake = (): string => {
    // Genera una firma PNG base64 fake (rettangolo blu con testo)
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 150
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      // Sfondo bianco
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, 400, 150)
      
      // Bordo
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2
      ctx.strokeRect(5, 5, 390, 140)
      
      // Testo firma fake
      ctx.fillStyle = '#1e40af'
      ctx.font = 'italic 32px "Brush Script MT", cursive'
      ctx.fillText('Diego Marruchi', 50, 70)
      
      // Data
      ctx.font = '14px Arial'
      ctx.fillStyle = '#666'
      ctx.fillText(new Date().toLocaleString('it-IT'), 50, 120)
    }
    
    return canvas.toDataURL('image/png')
  }

  const generaFotoFake = (index: number): string => {
    // Genera una foto PNG base64 fake (rettangolo colorato con numero)
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 300
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      // Sfondo gradiente
      const gradient = ctx.createLinearGradient(0, 0, 400, 300)
      gradient.addColorStop(0, '#3b82f6')
      gradient.addColorStop(1, '#1e40af')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 400, 300)
      
      // Testo
      ctx.fillStyle = 'white'
      ctx.font = 'bold 80px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`FOTO ${index}`, 200, 150)
      
      // Info
      ctx.font = '20px Arial'
      ctx.fillText('Test Image', 200, 200)
      ctx.font = '14px Arial'
      ctx.fillText(new Date().toLocaleTimeString('it-IT'), 200, 230)
    }
    
    return canvas.toDataURL('image/png')
  }

  const creaLavorazioneTest = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      console.log('🧪 Inizio creazione lavorazione test...')
      
      // 1. Crea lavorazione
      console.log('1️⃣ Creazione lavorazione...')
      const creaResponse = await fetch('/api/lavorazioni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          condominio_id: '19b16df3-303e-44dd-94c3-d6f5048c343e', // Via Volpiano 1
          user_id: 'e1017f5d-83e1-4da3-ac81-4924a0dfd010', // Diego
          titolo: `Test Rapido ${new Date().toLocaleTimeString('it-IT')}`,
          descrizione: 'Lavorazione test generata automaticamente',
          priorita: 'media'
        })
      })
      
      const creaData = await creaResponse.json()
      if (!creaData.success) throw new Error('Errore creazione lavorazione')
      
      const lavorazioneId = creaData.data.id
      console.log('✅ Lavorazione creata:', lavorazioneId)
      
      // 2. Genera e carica 2 foto fake
      console.log('2️⃣ Upload foto fake...')
      const fotoUrls: string[] = []
      const gpsData: Array<{fotoUrl: string, latitude: number, longitude: number, accuracy: number}> = []
      
      for (let i = 1; i <= 2; i++) {
        const fotoBase64 = generaFotoFake(i)
        const blob = await fetch(fotoBase64).then(r => r.blob())
        
        const formData = new FormData()
        formData.append('file', blob, `test-foto-${i}-${Date.now()}.png`)
        formData.append('condominio_id', '19b16df3-303e-44dd-94c3-d6f5048c343e')
        
        const uploadResponse = await fetch('/api/upload-foto-vercel', {
          method: 'POST',
          body: formData
        })
        
        const uploadData = await uploadResponse.json()
        if (!uploadData.success) throw new Error(`Errore upload foto ${i}`)
        
        const fotoUrl = uploadData.data.url
        fotoUrls.push(fotoUrl)
        
        // GPS fake (Milano centro con variazione)
        gpsData.push({
          fotoUrl: fotoUrl,
          latitude: 45.4642 + (Math.random() * 0.01 - 0.005),
          longitude: 9.1900 + (Math.random() * 0.01 - 0.005),
          accuracy: Math.floor(Math.random() * 20) + 5
        })
        
        console.log(`✅ Foto ${i} caricata:`, fotoUrl)
      }
      
      // 3. Genera e carica firma fake
      console.log('3️⃣ Upload firma fake...')
      const firmaBase64 = generaFirmaFake()
      const firmaBlob = await fetch(firmaBase64).then(r => r.blob())
      
      const firmaFormData = new FormData()
      firmaFormData.append('file', firmaBlob, `test-firma-${Date.now()}.png`)
      
      const firmaResponse = await fetch('/api/upload-firma-vercel', {
        method: 'POST',
        body: firmaFormData
      })
      
      const firmaData = await firmaResponse.json()
      if (!firmaData.success) throw new Error('Errore upload firma')
      
      const firmaUrl = firmaData.data.url
      console.log('✅ Firma caricata:', firmaUrl)
      
      // 4. Completa lavorazione con wizard
      console.log('4️⃣ Completamento lavorazione...')
      const completaResponse = await fetch(`/api/lavorazioni/${lavorazioneId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          azione: 'completa',
          dati: {
            dati_verifica: {
              'domanda_1': 'Si',
              'domanda_2': 'No'
            },
            foto: {
              'Sezione Test': fotoUrls
            },
            foto_geo: gpsData,
            firma: firmaUrl,
            note: 'Lavorazione test generata automaticamente con foto, GPS e firma'
          }
        })
      })
      
      const completaData = await completaResponse.json()
      if (!completaData.success) throw new Error('Errore completamento lavorazione')
      
      console.log('✅ Lavorazione completata!')
      
      setResult(`✅ Lavorazione test creata con successo!
ID: ${lavorazioneId}
Foto: ${fotoUrls.length}
GPS: ${gpsData.length} posizioni
Firma: ✓

Vai al Pannello Admin per generare il PDF e testare!`)
      
    } catch (error) {
      console.error('❌ Errore creazione test:', error)
      setResult(`❌ Errore: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-20 left-4 z-50">
      <button
        onClick={creaLavorazioneTest}
        disabled={loading}
        className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg shadow-lg font-semibold flex items-center gap-2 transition-all"
        title="Crea lavorazione test con foto, GPS e firma"
      >
        {loading ? (
          <>
            <span className="animate-spin">⏳</span>
            <span>Creazione...</span>
          </>
        ) : (
          <>
            <span>🧪</span>
            <span>Test Rapido</span>
          </>
        )}
      </button>
      
      {result && (
        <div className={`mt-2 p-4 rounded-lg shadow-lg max-w-sm ${
          result.startsWith('✅') ? 'bg-green-50 border-2 border-green-500' : 'bg-red-50 border-2 border-red-500'
        }`}>
          <pre className="text-sm whitespace-pre-wrap font-mono">
            {result}
          </pre>
          <button
            onClick={() => setResult(null)}
            className="mt-2 text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Chiudi
          </button>
        </div>
      )}
    </div>
  )
}
