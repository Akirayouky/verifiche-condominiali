'use client'

import { useState } from 'react'
import { FotoCloud } from '@/lib/types'

interface FotoViewerCloudProps {
  foto: FotoCloud[]
  titolo?: string
  className?: string
}

export default function FotoViewerCloud({ 
  foto, 
  titolo = 'Foto', 
  className = '' 
}: FotoViewerCloudProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (!foto || foto.length === 0) {
    return (
      <div className={`bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center ${className}`}>
        <div className="text-gray-500 mb-2">📷</div>
        <div className="text-sm text-gray-500">Nessuna foto disponibile per {titolo.toLowerCase()}</div>
      </div>
    )
  }

  const openModal = (index: number) => {
    setSelectedIndex(index)
  }

  const closeModal = () => {
    setSelectedIndex(null)
  }

  const nextPhoto = () => {
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % foto.length)
    }
  }

  const prevPhoto = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === 0 ? foto.length - 1 : selectedIndex - 1)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') nextPhoto()
    if (e.key === 'ArrowLeft') prevPhoto()
    if (e.key === 'Escape') closeModal()
  }

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        {titolo} ({foto.length})
      </h3>

      {/* Grid foto */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {foto.map((fotoItem, index) => (
          <div
            key={fotoItem.publicId}
            className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
            onClick={() => openModal(index)}
          >
            <img
              src={fotoItem.thumbnailUrl || fotoItem.url}
              alt={`${titolo} ${index + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
            
            {/* Overlay con numero */}
            <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
              {index + 1}
            </div>

            {/* Overlay hover con icona */}
            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <div className="text-white text-2xl">🔍</div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal a schermo intero */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div className="relative max-w-6xl max-h-full">
            {/* Foto principale */}
            <img
              src={foto[selectedIndex].url}
              alt={`${titolo} ${selectedIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Contatore */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded">
              {selectedIndex + 1} di {foto.length}
            </div>

            {/* Bottone chiudi */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 bg-black bg-opacity-70 text-white w-10 h-10 rounded-full hover:bg-opacity-90 transition-all"
              title="Chiudi (Esc)"
            >
              ✕
            </button>

            {/* Navigazione */}
            {foto.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    prevPhoto()
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 text-white w-12 h-12 rounded-full hover:bg-opacity-90 transition-all"
                  title="Foto precedente (←)"
                >
                  ←
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    nextPhoto()
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 text-white w-12 h-12 rounded-full hover:bg-opacity-90 transition-all"
                  title="Foto successiva (→)"
                >
                  →
                </button>
              </>
            )}

            {/* Info foto */}
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-70 text-white p-3 rounded">
              <div className="text-sm">
                <div className="font-medium">{titolo} - Foto {selectedIndex + 1}</div>
                {foto[selectedIndex].createdAt && (
                  <div className="text-gray-300 text-xs mt-1">
                    Caricata: {new Date(foto[selectedIndex].createdAt!).toLocaleString('it-IT')}
                  </div>
                )}
                <div className="text-gray-300 text-xs">
                  Premi Esc per chiudere • Usa ← → per navigare
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}