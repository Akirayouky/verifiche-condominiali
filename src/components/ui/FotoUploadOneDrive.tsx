/**
 * Componente Upload Foto OneDrive
 * Carica foto su OneDrive invece di Cloudinary
 */

'use client'

import { useState, useRef } from 'react'
import { FotoCloud, FotoUploadCloudProps } from '@/lib/types'

export default function FotoUploadOneDrive({ 
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

      console.log('📤 Uploading foto to OneDrive...', { lavorazioneId, count: fotoBase64Array.length })

      // Upload su OneDrive tramite API
      const response = await fetch('/api/upload-foto-onedrive', {
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

      console.log('✅ Foto uploaded successfully to OneDrive:', result.data)

      // Aggiungi le nuove foto alle esistenti
      const nuoveFoto: FotoCloud[] = result.data.foto.map((foto: any) => ({
        url: foto.url,
        publicId: foto.id, // Usa ID OneDrive come publicId
        thumbnailUrl: foto.thumbnailUrl || foto.url,
        createdAt: new Date().toISOString()
      }))

      onChange([...value, ...nuoveFoto])

      // Mostra eventuali errori parziali
      if (result.data.errori && result.data.errori.length > 0) {
        console.warn('⚠️ Alcuni upload hanno avuto errori:', result.data.errori)
        setError(`Alcune foto non sono state caricate correttamente`)
      }

    } catch (error) {
      console.error('❌ Errore upload foto OneDrive:', error)
      setError(error instanceof Error ? error.message : 'Errore durante l\'upload')
    } finally {
      setUploading(false)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveFoto = (index: number) => {
    const newValue = value.filter((_, i) => i !== index)
    onChange(newValue)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {nome || 'Foto'} {required && <span className="text-red-500">*</span>}
        </label>
        <span className="text-xs text-gray-500">
          {value.length}/{maxFoto} foto
        </span>
      </div>

      {/* Upload Area */}
      {value.length < maxFoto && (
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id={`foto-upload-${nome}`}
          />
          <label
            htmlFor={`foto-upload-${nome}`}
            className={`
              flex flex-col items-center justify-center
              border-2 border-dashed rounded-lg p-6
              cursor-pointer transition-colors
              ${uploading ? 'bg-gray-100 border-gray-300 cursor-wait' : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'}
            `}
          >
            {uploading ? (
              <>
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-sm text-gray-600">Caricamento su OneDrive...</p>
              </>
            ) : (
              <>
                <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-sm text-gray-600">Clicca per caricare foto</p>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG fino a 10MB</p>
              </>
            )}
          </label>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Preview Foto */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {value.map((foto, index) => (
            <div key={index} className="relative group">
              <img
                src={foto.thumbnailUrl || foto.url}
                alt={`Foto ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
              />
              <button
                type="button"
                onClick={() => handleRemoveFoto(index)}
                title="Rimuovi foto"
                aria-label="Rimuovi foto"
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                📁 OneDrive
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info OneDrive */}
      <div className="flex items-center space-x-2 text-xs text-gray-500">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
        </svg>
        <span>Le foto vengono salvate sul tuo OneDrive</span>
      </div>
    </div>
  )
}

// Utility functions
function convertToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}

async function resizeImage(base64: string, maxWidth: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = base64
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0, width, height)

      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
  })
}
