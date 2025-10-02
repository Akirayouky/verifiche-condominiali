'use client'

import { useState } from 'react'

interface FotoViewerProps {
  foto: string[]
  nome: string
}

export default function FotoViewer({ foto, nome }: FotoViewerProps) {
  const [selectedFoto, setSelectedFoto] = useState<number | null>(null)

  if (!foto || foto.length === 0) {
    return null
  }

  const openGallery = (index: number) => {
    setSelectedFoto(index)
  }

  const closeGallery = () => {
    setSelectedFoto(null)
  }

  const nextFoto = () => {
    if (selectedFoto !== null && selectedFoto < foto.length - 1) {
      setSelectedFoto(selectedFoto + 1)
    }
  }

  const prevFoto = () => {
    if (selectedFoto !== null && selectedFoto > 0) {
      setSelectedFoto(selectedFoto - 1)
    }
  }

  const downloadFoto = (index: number) => {
    const link = document.createElement('a')
    link.href = foto[index]
    link.download = `${nome}_foto_${index + 1}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-medium text-gray-700">
            📷 {nome} ({foto.length} foto)
          </h5>
        </div>
        
        {/* Griglia miniature */}
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {foto.map((fotoBase64, index) => (
            <div key={index} className="relative group cursor-pointer">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors">
                <img
                  src={fotoBase64}
                  alt={`Foto ${index + 1} - ${nome}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                  onClick={() => openGallery(index)}
                />
              </div>
              
              {/* Overlay con azioni */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex space-x-2">
                  <button
                    onClick={() => openGallery(index)}
                    className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                    title="Visualizza"
                  >
                    👁️
                  </button>
                  <button
                    onClick={() => downloadFoto(index)}
                    className="p-2 bg-blue-500 bg-opacity-90 text-white rounded-full hover:bg-opacity-100 transition-all"
                    title="Scarica"
                  >
                    💾
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

      {/* Modal galleria a schermo intero */}
      {selectedFoto !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Foto principale */}
            <img
              src={foto[selectedFoto]}
              alt={`Foto ${selectedFoto + 1} - ${nome}`}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Controlli */}
            <div className="absolute top-4 left-4 text-white">
              <div className="bg-black bg-opacity-75 px-4 py-2 rounded-lg">
                <div className="font-medium">{nome}</div>
                <div className="text-sm text-gray-300">
                  Foto {selectedFoto + 1} di {foto.length}
                </div>
              </div>
            </div>
            
            {/* Pulsanti navigazione */}
            {selectedFoto > 0 && (
              <button
                onClick={prevFoto}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-75 text-white p-4 rounded-full hover:bg-opacity-90 transition-all"
                title="Foto precedente"
              >
                ⬅️
              </button>
            )}
            
            {selectedFoto < foto.length - 1 && (
              <button
                onClick={nextFoto}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-75 text-white p-4 rounded-full hover:bg-opacity-90 transition-all"
                title="Foto successiva"
              >
                ➡️
              </button>
            )}
            
            {/* Pulsanti azioni */}
            <div className="absolute bottom-4 right-4 flex space-x-3">
              <button
                onClick={() => downloadFoto(selectedFoto)}
                className="bg-blue-500 bg-opacity-90 text-white px-4 py-2 rounded-lg hover:bg-opacity-100 transition-all"
                title="Scarica foto"
              >
                💾 Scarica
              </button>
              <button
                onClick={closeGallery}
                className="bg-red-500 bg-opacity-90 text-white px-4 py-2 rounded-lg hover:bg-opacity-100 transition-all"
                title="Chiudi"
              >
                ❌ Chiudi
              </button>
            </div>

            {/* Miniature di navigazione */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-black bg-opacity-75 p-3 rounded-lg max-w-xs overflow-x-auto">
              {foto.map((fotoThumb, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedFoto(index)}
                  className={`cursor-pointer w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                    selectedFoto === index ? 'border-blue-400' : 'border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <img
                    src={fotoThumb}
                    alt={`Miniatura ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}