import { NextResponse } from 'next/server'
import { testOneDriveConnection } from '@/lib/onedrive'

/**
 * Test endpoint per verificare configurazione OneDrive
 * GET /api/test-onedrive
 */
export async function GET() {
  try {
    console.log('🧪 Testing OneDrive connection...')
    
    // Verifica che le variabili d'ambiente siano configurate
    const tenantId = process.env.MICROSOFT_TENANT_ID
    const clientId = process.env.MICROSOFT_CLIENT_ID
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET
    
    if (!tenantId || !clientId || !clientSecret) {
      console.error('❌ Microsoft credentials non configurate')
      return NextResponse.json({
        success: false,
        error: 'Credenziali Microsoft mancanti',
        details: {
          hasTenantId: !!tenantId,
          hasClientId: !!clientId,
          hasClientSecret: !!clientSecret,
        },
        message: 'Configura MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET in .env.local'
      }, { status: 500 })
    }
    
    // Testa la connessione
    const result = await testOneDriveConnection()
    
    if (result.success) {
      console.log('✅ OneDrive connection OK:', result.user)
      return NextResponse.json({
        success: true,
        message: '✅ OneDrive configurato correttamente!',
        user: result.user,
        timestamp: new Date().toISOString()
      })
    } else {
      console.error('❌ OneDrive connection failed:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error,
        message: '❌ Errore connessione OneDrive. Verifica le credenziali in .env.local'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Test OneDrive failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: '❌ Errore imprevisto. Controlla i log del server.'
    }, { status: 500 })
  }
}
