'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface QrScannerProps {
  onScan: (qrCode: string) => void
  onError?: (error: string) => void
  onClose: () => void
}

export default function QrScanner({ onScan, onError, onClose }: QrScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const qrCodeRegionId = "qr-reader"

  useEffect(() => {
    startScanner()

    return () => {
      stopScanner()
    }
  }, [])

  const startScanner = async () => {
    try {
      setError(null)
      setIsScanning(true)

      // Inizializza scanner
      const html5QrCode = new Html5Qrcode(qrCodeRegionId)
      scannerRef.current = html5QrCode

      // Avvia scansione con fotocamera posteriore
      await html5QrCode.start(
        { facingMode: "environment" }, // Fotocamera posteriore
        {
          fps: 10, // Frame per secondo
          qrbox: { width: 250, height: 250 }, // Area di scansione
        },
        (decodedText) => {
          // QR code rilevato
          console.log('📷 QR Code scansionato:', decodedText)
          onScan(decodedText)
          stopScanner()
        },
        (errorMessage) => {
          // Errore di scansione (normale, continua a scansionare)
          // Non loggiamo per evitare spam console
        }
      )

      console.log('✅ Scanner QR attivato')

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Impossibile accedere alla fotocamera'
      console.error('❌ Errore avvio scanner:', err)
      setError(errorMsg)
      setIsScanning(false)
      if (onError) onError(errorMsg)
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
        console.log('🛑 Scanner QR fermato')
      } catch (err) {
        console.error('Errore stop scanner:', err)
      }
    }
    setIsScanning(false)
  }

  const handleClose = async () => {
    await stopScanner()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">📷 Scansiona QR Code</h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Chiudi scanner"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scanner Area */}
        <div className="p-4">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-700 mb-3">{error}</p>
              <button
                onClick={startScanner}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Riprova
              </button>
            </div>
          ) : (
            <div>
              {/* Area di scansione */}
              <div id={qrCodeRegionId} className="rounded-lg overflow-hidden" />

              {/* Istruzioni */}
              {isScanning && (
                <div className="mt-4 text-center text-sm text-gray-600">
                  <p className="mb-2">📱 Inquadra il QR code del condominio</p>
                  <p className="text-xs text-gray-500">
                    Assicurati che ci sia abbastanza luce
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
