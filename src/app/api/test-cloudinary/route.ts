/**
 * Endpoint di test per verificare configurazione Cloudinary
 * GET /api/test-cloudinary
 */

import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

export async function GET() {
  try {
    // Verifica configurazione
    const config = {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || null,
      api_key: process.env.CLOUDINARY_API_KEY || null,
      api_secret: process.env.CLOUDINARY_API_SECRET || null,
    }

    const isConfigured = config.cloud_name && config.api_key && config.api_secret

    // Test di connessione (ping)
    let pingSuccess = false
    let pingError = null

    if (isConfigured) {
      try {
        cloudinary.config({
          cloud_name: config.cloud_name as string,
          api_key: config.api_key as string,
          api_secret: config.api_secret as string,
        })

        // Test API - ottieni info account
        const result = await cloudinary.api.ping()
        pingSuccess = result.status === 'ok'
      } catch (error) {
        pingError = error instanceof Error ? error.message : 'Errore ping Cloudinary'
      }
    }

    return NextResponse.json({
      success: isConfigured && pingSuccess,
      configuration: {
        cloud_name: config.cloud_name ? `✅ ${config.cloud_name}` : '❌ MISSING',
        api_key: config.api_key ? `✅ ${config.api_key.substring(0, 6)}...` : '❌ MISSING',
        api_secret: config.api_secret ? '✅ SET (hidden)' : '❌ MISSING',
      },
      connection: {
        configured: isConfigured,
        ping_success: pingSuccess,
        error: pingError
      },
      message: isConfigured 
        ? (pingSuccess ? '✅ Cloudinary configurato e funzionante!' : `⚠️ Configurato ma errore connessione: ${pingError}`)
        : '❌ Cloudinary NON configurato - Aggiungi credenziali in .env.local'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Errore test Cloudinary',
      message: '❌ Errore durante il test di Cloudinary'
    }, { status: 500 })
  }
}
