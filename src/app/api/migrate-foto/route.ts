/**
 * API Route per migrazione foto Base64 → Cloudinary
 * POST /api/migrate-foto
 * 
 * ATTENZIONE: Usa solo in sviluppo con backup database!
 */

import { NextRequest, NextResponse } from 'next/server'
import { migrateFotoToCloudinary, testMigrazioneLavorazione } from '@/scripts/migrate-foto-cloudinary'

export async function POST(request: NextRequest) {
  try {
    // Security check - solo in sviluppo
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Migrazione disponibile solo in sviluppo per sicurezza' 
        },
        { status: 403 }
      )
    }

    const { action, lavorazioneId } = await request.json()

    console.log('🔄 API Migrazione foto - Action:', action)

    switch (action) {
      case 'migrate-all':
        console.log('🚀 Avvio migrazione completa...')
        const risultato = await migrateFotoToCloudinary()
        
        return NextResponse.json({
          success: true,
          message: 'Migrazione completata',
          data: risultato
        })

      case 'test-single':
        if (!lavorazioneId) {
          return NextResponse.json(
            { success: false, error: 'lavorazioneId richiesto per test' },
            { status: 400 }
          )
        }

        console.log(`🧪 Test migrazione singola lavorazione: ${lavorazioneId}`)
        const risultatoTest = await testMigrazioneLavorazione(lavorazioneId)
        
        return NextResponse.json({
          success: true,
          message: 'Test migrazione completato',
          data: risultatoTest
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Action non valida. Usa: migrate-all o test-single' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ Errore API migrazione:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Errore interno durante migrazione',
        details: error instanceof Error ? error.message : 'Errore sconosciuto'
      },
      { status: 500 }
    )
  }
}

// GET per info migrazione
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API Migrazione Foto Base64 → Cloudinary',
    endpoints: {
      'POST /api/migrate-foto': {
        description: 'Esegui migrazione foto',
        actions: {
          'migrate-all': 'Migra tutte le lavorazioni con foto Base64',
          'test-single': 'Test migrazione singola lavorazione (richiede lavorazioneId)'
        },
        example: {
          'migrate-all': '{ "action": "migrate-all" }',
          'test-single': '{ "action": "test-single", "lavorazioneId": "uuid" }'
        }
      }
    },
    warning: 'Disponibile solo in sviluppo. Fai sempre backup prima della migrazione!'
  })
}