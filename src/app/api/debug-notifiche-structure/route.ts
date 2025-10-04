import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🔍 Debugging struttura tabella notifiche...');

    // 1. Verifica struttura tabella
    const { data: columns, error: structError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, column_default, is_nullable')
      .eq('table_name', 'notifiche')
      .order('ordinal_position');

    if (structError) {
      console.error('❌ Errore nel recuperare struttura:', structError);
    }

    // 2. Controlla i dati esistenti
    const { data: records, error: dataError } = await supabase
      .from('notifiche')
      .select('id, tipo, titolo, priorita, letta, data_creazione')
      .limit(10);

    if (dataError) {
      console.error('❌ Errore nel recuperare dati:', dataError);
    }

    // 3. Controlla valori distinti di priorita
    const { data: prioritaValues, error: prioritaError } = await supabase
      .rpc('get_distinct_priorita');

    // 4. Controlla i constraint esistenti
    const { data: constraints, error: constraintError } = await supabase
      .from('information_schema.check_constraints')
      .select('constraint_name, check_clause')
      .eq('table_name', 'notifiche');

    return NextResponse.json({
      success: true,
      debug: {
        structure: columns || [],
        sample_records: records || [],
        priorita_values: prioritaValues || [],
        constraints: constraints || [],
        errors: {
          structure: structError?.message,
          data: dataError?.message,
          priorita: prioritaError?.message,
          constraints: constraintError?.message
        }
      }
    });

  } catch (error) {
    console.error('❌ Errore durante debug:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Errore sconosciuto',
      debug: null
    }, { status: 500 });
  }
}