import { useState, useRef } from 'react'
import Image from 'next/image'

export interface FotoVercel {
  url: string
  pathname: string
}

interface FotoUploadVercelProps {
  value: string[] // Array di URL (compatibile con database)
  onChange: (foto: string[]) => void
  lavorazioneId: string
  maxFoto?: number
  required?: boolean
  nome?: string
}

export default function FotoUploadVercel({
  value = [],
  onChange,
  lavorazioneId,
  maxFoto = 5,
  required = false,
  nome = 'Foto'
}: FotoUploadVercelProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    if (files.length === 0) return

    // Validazione numero foto
    if (value.length + files.length > maxFoto) {
      setError(`Puoi caricare massimo ${maxFoto} foto`)
      return
    }

    // Validazione tipo file
    const invalidFiles = files.filter(f => !f.type.startsWith('image/'))
    if (invalidFiles.length > 0) {
      setError('Sono ammessi solo file immagine')
      return
    }

    // Validazione dimensione (10 MB max)
    const oversizedFiles = files.filter(f => f.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      setError('Le foto devono essere inferiori a 10 MB')
      return
    }

    setError(null)
    setUploading(true)

    try {
      // Converti file in base64
      const base64Promises = files.map(file => 
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            const result = reader.result as string
            // Ridimensiona se necessario
            resizeImage(result, 1920).then(resolve).catch(reject)
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
      )

      const fotoBase64 = await Promise.all(base64Promises)

      console.log('📤 Uploading foto to Vercel Blob...', { 
        lavorazioneId, 
        count: fotoBase64.length 
      })

      // Upload su Vercel Blob
      const response = await fetch('/api/upload-foto-vercel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foto: fotoBase64,
          lavorazioneId
        })
      })

      if (!response.ok) {
        throw new Error('Errore durante upload foto')
      }

      const data = await response.json()

      if (data.success) {
        console.log('✅ Foto uploaded successfully to Vercel Blob:', data.foto)
        
        // Estrai solo gli URL dalle foto (compatibilità con database)
        const fotoUrls = data.foto.map((f: FotoVercel) => f.url)
        onChange([...value, ...fotoUrls])
        
        if (data.errori && data.errori.length > 0) {
          setError(`${data.errori.length} foto non caricate correttamente`)
        }
      } else {
        throw new Error(data.error || 'Errore upload')
      }

    } catch (err) {
      console.error('❌ Errore upload foto:', err)
      setError(err instanceof Error ? err.message : 'Errore durante upload')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const resizeImage = (base64: string, maxWidth: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = document.createElement('img')
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
        resolve(canvas.toDataURL('image/jpeg', 0.9))
      }
      img.src = base64
    })
  }

  const handleRemove = (index: number) => {
    const newValue = value.filter((_, i) => i !== index)
    onChange(newValue)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {nome} {required && <span className="text-red-500">*</span>}
          <span className="text-gray-500 ml-2">
            ({value.length}/{maxFoto})
          </span>
        </label>
        
        {value.length < maxFoto && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {uploading ? '⏳ Caricamento...' : '📷 Aggiungi Foto'}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        aria-label="Seleziona foto da caricare"
      />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {value.map((fotoUrl, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square relative rounded-lg overflow-hidden border-2 border-gray-200">
                <Image
                  src={fotoUrl}
                  alt={`Foto ${index + 1}`}
                  fill
                  className="object-cover"
                />
                <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  </svg>
                  Vercel
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                title="Rimuovi foto"
                aria-label="Rimuovi foto"
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length === 0 && !uploading && (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            Clicca per caricare foto
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Massimo {maxFoto} foto, fino a 10 MB ciascuna
          </p>
        </div>
      )}
    </div>
  )
}
