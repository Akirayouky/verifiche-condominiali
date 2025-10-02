'use client'

import { useState, useRef } from 'react'

interface FotoUploadProps {
  value: string[] // Array di foto in formato base64
  onChange: (foto: string[]) => void
  maxFoto?: number
  required?: boolean
  nome: string
}

export default function FotoUpload({ 
  value = [], 
  onChange, 
  maxFoto = 5, 
  required = false, 
  nome 
}: FotoUploadProps) {
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

    setUploading(true)
    setError(null)

    try {
      const newFoto: string[] = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Verifica che sia un'immagine
        if (!file.type.startsWith('image/')) {
          setError('Sono accettati solo file immagine')
          continue
        }

        // Verifica dimensione (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setError('Le immagini non possono superare i 5MB')
          continue
        }

        // Converti in base64
        const base64 = await convertToBase64(file)
        
        // Ridimensiona se necessario (max 1920px)
        const resized = await resizeImage(base64, 1920)
        newFoto.push(resized)
      }

      if (newFoto.length > 0) {
        onChange([...value, ...newFoto])
      }
    } catch (err) {
      setError('Errore durante il caricamento delle foto')
      console.error('Error uploading photos:', err)
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

  const removeFoto = (index: number) => {
    const newFoto = value.filter((_, i) => i !== index)
    onChange(newFoto)
  }

  const openFullscreen = (index: number) => {
    const newWindow = window.open('', '_blank')
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head><title>Foto ${index + 1} - ${nome}</title></head>
          <body style="margin:0;background:#000;display:flex;justify-content:center;align-items:center;height:100vh;">
            <img src="${value[index]}" style="max-width:100%;max-height:100%;object-fit:contain;" />
          </body>
        </html>
      `)
      newWindow.document.close()
    }
  }

  return (
    <div className="space-y-4">
      {/* Area di upload */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id={`foto-upload-${nome}`}
        />
        
        <div className="space-y-3">
          {uploading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="text-gray-600">Caricamento...</span>
            </div>
          ) : (
            <>
              <div className="text-4xl text-gray-400">📷</div>
              <div>
                <label
                  htmlFor={`foto-upload-${nome}`}
                  className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  📁 Seleziona Foto
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  Clicca per selezionare o trascina le foto qui
                  <br />
                  <span className="text-xs">
                    Massimo {maxFoto} foto • JPG, PNG • Max 5MB ciascuna
                  </span>
                </p>
              </div>
              
              {value.length < maxFoto && (
                <div className="text-xs text-gray-400">
                  {value.length}/{maxFoto} foto caricate
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Errori */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="text-red-600 text-sm">⚠️ {error}</div>
        </div>
      )}

      {/* Preview delle foto */}
      {value.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">
            Foto caricate ({value.length})
            {required && value.length === 0 && <span className="text-red-500 ml-1">*</span>}
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {value.map((foto, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
                  <img
                    src={foto}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => openFullscreen(index)}
                  />
                </div>
                
                {/* Overlay con azioni */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openFullscreen(index)}
                      className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                      title="Visualizza a schermo intero"
                    >
                      👁️
                    </button>
                    <button
                      onClick={() => removeFoto(index)}
                      className="p-2 bg-red-500 bg-opacity-90 text-white rounded-full hover:bg-opacity-100 transition-all"
                      title="Rimuovi foto"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                {/* Numero foto */}
                <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validazione per campi obbligatori */}
      {required && value.length === 0 && (
        <div className="text-red-600 text-sm">
          Almeno una foto è richiesta per questo campo
        </div>
      )}
    </div>
  )
}