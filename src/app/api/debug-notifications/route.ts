/**
 * API di debug per testare notifiche
 * GET /api/debug-notifications - Testa sistema notifiche
 */
import { NextRequest, NextResponse } from 'next/server'
import { NotificationManager } from '@/lib/notifications'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Test debug notifiche...')
    
    // Test 1: Verifica connessione database
    const { data: tableExists, error: tableError } = await supabase
      .from('notifiche')
      .select('count')
      .limit(1)
    
    if (tableError) {
      return NextResponse.json({
        success: false,
        error: 'Tabella notifiche non esistente',
        details: tableError.message
      })
    }
    
    // Test 2: Crea notifica di test
    const notificationManager = new NotificationManager()
    const testNotifica = await notificationManager.creaNotifica({
      tipo: 'nuova_assegnazione',
      titolo: '🧪 Test Debug Notifica',
      messaggio: 'Questa è una notifica di test per verificare il funzionamento',
      utente_id: 'debug-test',
      priorita: 'media',
      condominio_id: undefined,
      lavorazione_id: undefined,
      data_scadenza: undefined
    })
    
    // Test 3: Recupera notifiche create
    const { data: notifiche, error: selectError } = await supabase
      .from('notifiche')
      .select('*')
      .eq('utente_id', 'debug-test')
      .order('data_creazione', { ascending: false })
      .limit(5)
    
    return NextResponse.json({
      success: true,
      tests: {
        database_connection: tableError ? 'FAILED' : 'OK',
        notification_creation: testNotifica ? 'OK' : 'FAILED',
        notification_retrieval: selectError ? 'FAILED' : 'OK'
      },
      data: {
        created_notification: testNotifica,
        retrieved_notifications: notifiche,
        errors: {
          table_error: tableError ? (tableError as any).message : null,
          select_error: selectError ? (selectError as any).message : null
        }
      }
    })
    
  } catch (error) {
    console.error('❌ Errore test notifiche:', error)
    return NextResponse.json({
      success: false,
      error: 'Errore nel test notifiche',
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 })
  }
}

// POST per pulire notifiche di test
export async function POST(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('notifiche')
      .delete()
      .eq('utente_id', 'debug-test')
    
    return NextResponse.json({
      success: true,
      message: 'Notifiche di test eliminate'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Errore eliminazione notifiche test'
    }, { status: 500 })
  }
}