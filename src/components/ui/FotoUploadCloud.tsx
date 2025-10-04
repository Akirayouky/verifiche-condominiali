'use client'

import { useState, useRef } from 'react'
import { FotoCloud, FotoUploadCloudProps } from '@/lib/types'

export default function FotoUploadCloud({ 
  value = [], 
  onChange, 
  lavorazioneId,
  maxFoto = 5, 
  required = false, 
  nome 
}: FotoUploadCloudProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    // Verifica se possiamo aggiungere altre foto
    if (value.length + files.length > maxFoto) {
      setError(`Puoi caricare al massimo ${maxFoto} foto`)
      return
    }

    setError(null)
    setUploading(true)

    try {
      // Converti file in Base64 per upload
      const fotoBase64Array: string[] = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Validazione tipo file
        if (!file.type.startsWith('image/')) {
          setError('Puoi caricare solo immagini')
          setUploading(false)
          return
        }

        // Validazione dimensione (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          setError('Le foto non possono superare 10MB')
          setUploading(false)
          return
        }

        // Converti in base64
        const base64 = await convertToBase64(file)
        
        // Resize per ottimizzazione
        const resized = await resizeImage(base64, 1920)
        fotoBase64Array.push(resized)
      }

      console.log('📤 Uploading foto to Cloudinary...', { lavorazioneId, count: fotoBase64Array.length })

      // Upload su Cloudinary tramite API
      const response = await fetch('/api/upload-foto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foto: fotoBase64Array,
          lavorazioneId: lavorazioneId
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Errore durante upload')
      }

      console.log('✅ Foto uploaded successfully:', result.data)

      // Aggiungi le nuove foto alle esistenti
      const nuoveFoto: FotoCloud[] = result.data.foto.map((foto: any) => ({
        url: foto.url,
        publicId: foto.publicId,
        thumbnailUrl: foto.url.replace('/upload/', '/upload/w_150,h_150,c_thumb/'),
        createdAt: new Date().toISOString()
      }))

      onChange([...value, ...nuoveFoto])

      // Mostra eventuali errori parziali
      if (result.data.errori && result.data.errori.length > 0) {
        console.warn('⚠️ Alcuni upload hanno avuto errori:', result.data.errori)
        setError(`Alcune foto non sono state caricate correttamente`)
      }

    } catch (error) {
      console.error('❌ Errore upload foto:', error)
      setError(error instanceof Error ? error.message : 'Errore durante l\'upload')
    } finally {
      setUploading(false)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const resizeImage = (base64: string, maxWidth: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        
        // Calcola nuove dimensioni mantenendo le proporzioni
        let { width, height } = img
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        
        // Disegna e comprimi
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = base64
    })
  }

  const removeFoto = async (index: number) => {
    const fotoToRemove = value[index]
    
    try {
      // Rimuovi da Cloudinary (opzionale - le foto potrebbero essere utili per history)
      console.log('🗑️ Removing foto:', fotoToRemove.publicId)
      
      // Rimuovi dall'array locale
      const newFoto = value.filter((_, i) => i !== index)
      onChange(newFoto)
      
    } catch (error) {
      console.error('❌ Errore rimozione foto:', error)
      // Rimuovi comunque dall'array locale
      const newFoto = value.filter((_, i) => i !== index)
      onChange(newFoto)
    }
  }

  const openFullscreen = (foto: FotoCloud) => {
    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Foto - ${nome}</title>
            <style>
              body { margin: 0; background: #000; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
              img { max-width: 100%; max-height: 100%; object-fit: contain; }
            </style>
          </head>
          <body>
            <img src="${foto.url}" alt="Foto ${nome}" />
          </body>
        </html>
      `)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {nome} {required && <span className="text-red-500">*</span>}
          <span className="text-gray-500 ml-1">({value.length}/{maxFoto})</span>
        </label>
        
        {value.length < maxFoto && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            {uploading ? '📤 Caricamento...' : '📷 Aggiungi foto'}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        title="Seleziona foto da caricare"
        aria-label="Seleziona foto da caricare"
      />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}

      {/* Grid foto caricate */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {value.map((foto, index) => (
            <div key={foto.publicId} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={foto.thumbnailUrl || foto.url}
                  alt={`${nome} ${index + 1}`}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => openFullscreen(foto)}
                />
              </div>
              
              {/* Overlay con azioni */}
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center space-x-2">
                <button
                  type="button"
                  onClick={() => openFullscreen(foto)}
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                  title="Visualizza a schermo intero"
                >
                  🔍
                </button>
                <button
                  type="button"
                  onClick={() => removeFoto(index)}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                  title="Rimuovi foto"
                >
                  🗑️
                </button>
              </div>

              {/* Numero foto */}
              <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stato vuoto */}
      {value.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <div className="text-gray-500 mb-2">📷</div>
          <div className="text-sm text-gray-500 mb-3">
            Nessuna foto caricata per {nome.toLowerCase()}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 text-sm"
          >
            {uploading ? '📤 Caricamento...' : '📷 Carica prima foto'}
          </button>
        </div>
      )}

      {/* Info caricamento */}
      {uploading && (
        <div className="flex items-center space-x-2 text-sm text-blue-600">
          <div className="animate-spin">⏳</div>
          <span>Caricamento in corso su Cloudinary...</span>
        </div>
      )}
    </div>
  )
}