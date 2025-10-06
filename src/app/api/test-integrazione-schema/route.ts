import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test 1: Verifica colonne esistenti
    const { data: columns, error: schemaError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'lavorazioni'
          AND column_name IN ('lavorazione_originale_id', 'motivo_integrazione', 'id_cartella', 'dati_verifiche')
          ORDER BY column_name
        `
      })

    // Test 2: Verifica constraint stato
    const { data: constraints, error: constraintError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT conname, consrc
          FROM pg_constraint
          WHERE conrelid = 'lavorazioni'::regclass
          AND conname LIKE '%stato%'
        `
      })

    // Test 3: Prova inserimento test
    const testIntegrazione = {
      condominio_id: '00000000-0000-0000-0000-000000000000',
      tipologia_id: '00000000-0000-0000-0000-000000000000',
      utente_assegnato_id: '00000000-0000-0000-0000-000000000000',
      titolo: 'TEST INTEGRAZIONE',
      descrizione: 'Test',
      stato: 'integrazione',
      lavorazione_originale_id: '00000000-0000-0000-0000-000000000000',
      motivo_integrazione: 'Test motivo',
      id_cartella: 'test-cartella',
      campi_nuovi: [{ nome: 'test', tipo: 'text' }],
      dati_verifiche: {}
    }

    const { error: insertError } = await supabase
      .from('lavorazioni')
      .insert(testIntegrazione)
      .select()
    
    // Elimina subito il test (se inserito)
    if (!insertError) {
      await supabase
        .from('lavorazioni')
        .delete()
        .eq('titolo', 'TEST INTEGRAZIONE')
    }

    return NextResponse.json({
      schema_check: {
        columns: columns || 'N/A (RPC not available)',
        columns_error: schemaError?.message,
        constraints: constraints || 'N/A (RPC not available)',
        constraints_error: constraintError?.message
      },
      insert_test: {
        success: !insertError,
        error: insertError?.message,
        error_code: insertError?.code,
        error_details: insertError?.details,
        error_hint: insertError?.hint
      },
      recommendation: insertError 
        ? '❌ Le colonne integrazione non esistono. ESEGUI SETUP_INTEGRAZIONE.sql su Supabase!'
        : '✅ Schema database corretto per integrazioni'
    })

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
