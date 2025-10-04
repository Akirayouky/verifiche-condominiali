import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    console.log('🧪 Test completo sistema notifiche dopo ricreazione...');

    // 1. Verifica che la tabella esista e abbia la struttura corretta
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, column_default')
      .eq('table_name', 'notifiche')
      .order('ordinal_position');

    if (tableError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Errore nel verificare struttura tabella: ' + tableError.message 
      });
    }

    // 2. Test inserimento notifica
    const testNotifica = {
      tipo: 'nuova_assegnazione',
      titolo: 'Test API Notifica',
      messaggio: 'Test inserimento tramite API dopo ricreazione tabella',
      utente_id: crypto.randomUUID(),
      priorita: 'media',
      letta: false
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('notifiche')
      .insert(testNotifica)
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Errore inserimento: ' + insertError.message 
      });
    }

    // 3. Test lettura notifiche
    const { data: notifications, error: readError } = await supabase
      .from('notifiche')
      .select('*')
      .order('data_creazione', { ascending: false })
      .limit(5);

    if (readError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Errore lettura: ' + readError.message 
      });
    }

    // 4. Test update (marca come letta)
    const { data: updateResult, error: updateError } = await supabase
      .from('notifiche')
      .update({ letta: true })
      .eq('id', insertResult.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Errore update: ' + updateError.message 
      });
    }

    // 5. Conta totale notifiche
    const { count, error: countError } = await supabase
      .from('notifiche')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      test_results: {
        table_structure: tableInfo || [],
        insert_test: insertResult,
        read_test: notifications || [],
        update_test: updateResult,
        total_notifications: count || 0
      },
      message: '✅ Tutti i test passati! Sistema notifiche funzionante.'
    });

  } catch (error) {
    console.error('❌ Errore durante test:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 });
  }
}