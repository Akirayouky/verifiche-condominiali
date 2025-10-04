import { NextResponse } from 'next/server'
import { testVercelBlobConnection } from '@/lib/vercel-blob'

/**
 * Test endpoint per verificare configurazione Vercel Blob
 * GET /api/test-vercel-blob
 */
export async function GET() {
  try {
    console.log('🧪 Testing Vercel Blob connection...')
    
    const result = await testVercelBlobConnection()
    
    if (result.success) {
      console.log('✅ Vercel Blob connection OK')
      return NextResponse.json({
        success: true,
        message: '✅ Vercel Blob configurato correttamente!',
        info: 'Vercel Blob è attivo e funzionante',
        timestamp: new Date().toISOString()
      })
    } else {
      console.error('❌ Vercel Blob connection failed:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error,
        message: '❌ Errore connessione Vercel Blob'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Test Vercel Blob failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: '❌ Errore imprevisto durante test Vercel Blob'
    }, { status: 500 })
  }
}
