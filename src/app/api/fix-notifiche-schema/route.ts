/**
 * API per testare schema tabella notifiche
 * GET /api/fix-notifiche-schema - Testa se lo schema è corretto
 */
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Test schema tabella notifiche...')
    
    // 1. Test query base
    const { data: testQuery, error: testError } = await supabase
      .from('notifiche')
      .select('*')
      .limit(1)
    
    // 2. Test inserimento con tutti i campi usando UUID
    const testUUID = crypto.randomUUID()
    const { data: testInsert, error: insertError } = await supabase
      .from('notifiche')
      .insert({
        tipo: 'nuova_assegnazione',
        titolo: '🔧 Test Schema',
        messaggio: 'Test schema tabella notifiche',
        utente_id: testUUID,
        priorita: 'media',
        letta: false,
        lavorazione_id: null,
        condominio_id: null,
        data_scadenza: null
      })
      .select()
    
    if (insertError) {
      return NextResponse.json({
        success: false,
        error: 'Schema tabella incompleto',
        missing_fields: insertError.message,
        solution: 'Eseguire manualmente fix_notifiche_schema.sql nel database'
      })
    }
    
    // 3. Pulisci il record di test
    await supabase
      .from('notifiche')
      .delete()
      .eq('utente_id', testUUID)
    
    return NextResponse.json({
      success: true,
      message: 'Schema notifiche corretto e funzionante!',
      test_result: {
        table_exists: !testError,
        insert_works: !insertError,
        test_data: testInsert
      }
    })
    
  } catch (error) {
    console.error('❌ Errore test schema notifiche:', error)
    return NextResponse.json({
      success: false,
      error: 'Errore nel test dello schema',
      details: error instanceof Error ? error.message : 'Errore sconosciuto',
      solution: 'Controllare che la tabella notifiche esista e abbia tutti i campi necessari'
    }, { status: 500 })
  }
}

// POST per pulire dati di test
export async function POST(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('notifiche')
      .delete()
      .in('utente_id', ['test-user', 'debug-test', 'schema-fix-test'])
    
    return NextResponse.json({
      success: true,
      message: 'Dati di test puliti'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Errore pulizia dati test'
    }, { status: 500 })
  }
}