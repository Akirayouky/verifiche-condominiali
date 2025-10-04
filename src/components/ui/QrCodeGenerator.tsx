'use client'

import { QRCodeSVG } from 'qrcode.react'

interface QrCodeGeneratorProps {
  value: string
  size?: number
  level?: 'L' | 'M' | 'Q' | 'H'
  includeMargin?: boolean
  label?: string
}

export default function QrCodeGenerator({ 
  value, 
  size = 200, 
  level = 'M',
  includeMargin = true,
  label 
}: QrCodeGeneratorProps) {
  
  const downloadQR = () => {
    const svg = document.getElementById('qr-code-svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      canvas.width = size + 40
      canvas.height = size + 40
      
      if (ctx) {
        // Sfondo bianco
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // QR code centrato
        ctx.drawImage(img, 20, 20, size, size)
      }

      // Download
      const pngFile = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.download = `QR-${value}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  const printQR = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${label || value}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .qr-container {
              text-align: center;
              padding: 20px;
              border: 2px solid #ddd;
              border-radius: 8px;
            }
            h2 { margin: 0 0 20px 0; color: #333; }
            .code { 
              font-family: monospace; 
              color: #666; 
              margin-top: 10px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h2>${label || 'QR Code Condominio'}</h2>
            ${document.getElementById('qr-code-container')?.innerHTML || ''}
            <p class="code">${value}</p>
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {label && (
        <h3 className="text-lg font-semibold text-gray-800">{label}</h3>
      )}
      
      {/* QR Code */}
      <div 
        id="qr-code-container"
        className="p-4 bg-white rounded-lg border-2 border-gray-200 shadow-sm"
      >
        <QRCodeSVG
          id="qr-code-svg"
          value={value}
          size={size}
          level={level}
          includeMargin={includeMargin}
        />
      </div>

      {/* Codice */}
      <p className="text-sm font-mono text-gray-600 bg-gray-50 px-3 py-2 rounded">
        {value}
      </p>

      {/* Azioni */}
      <div className="flex gap-2">
        <button
          onClick={downloadQR}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Scarica PNG
        </button>

        <button
          onClick={printQR}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Stampa
        </button>
      </div>
    </div>
  )
}
