import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    console.log('🧹 Inizio pulizia dati tabella notifiche...');

    // 1. Prima verifichiamo i dati problematici
    const { data: problematicRecords, error: checkError } = await supabase
      .from('notifiche')
      .select('id, tipo, titolo, priorita, letta, data_creazione')
      .not('priorita', 'in', '(bassa,media,alta,urgente)');

    console.log('🔍 Record problematici trovati:', problematicRecords?.length || 0);

    if (checkError) {
      console.error('❌ Errore controllo dati:', checkError);
      return NextResponse.json({ 
        success: false, 
        error: 'Errore nel controllo dati: ' + checkError.message 
      }, { status: 500 });
    }

    // 2. Puliamo i dati usando SQL diretto
    const cleanupSQL = `
      -- Correggi i valori di priorita non validi
      UPDATE notifiche 
      SET priorita = 'media',
          letta = CASE 
              WHEN priorita = 'non_letta' THEN false
              WHEN priorita = 'letta' THEN true
              ELSE COALESCE(letta, false)
          END
      WHERE priorita NOT IN ('bassa', 'media', 'alta', 'urgente') 
         OR priorita IS NULL;
         
      -- Assicurati che letta sia sempre boolean
      UPDATE notifiche 
      SET letta = false 
      WHERE letta IS NULL;
    `;

    // 3. Esegui la pulizia usando rpc (dovremmo creare una function nel DB)
    // Per ora facciamo manualmente record per record
    let updatedCount = 0;
    
    if (problematicRecords && problematicRecords.length > 0) {
      for (const record of problematicRecords) {
        const newPriorita = 'media';
        const newLetta = record.priorita === 'non_letta' ? false : 
                        record.priorita === 'letta' ? true : 
                        record.letta || false;

        const { error: updateError } = await supabase
          .from('notifiche')
          .update({ 
            priorita: newPriorita, 
            letta: newLetta 
          })
          .eq('id', record.id);

        if (updateError) {
          console.error('❌ Errore update record:', record.id, updateError);
        } else {
          updatedCount++;
          console.log('✅ Corretto record:', record.id);
        }
      }
    }

    // 4. Verifica finale
    const { data: finalCheck, error: finalError } = await supabase
      .from('notifiche')
      .select('priorita')
      .not('priorita', 'in', '(bassa,media,alta,urgente)');

    return NextResponse.json({
      success: true,
      cleanup: {
        problematic_records_found: problematicRecords?.length || 0,
        records_updated: updatedCount,
        remaining_problems: finalCheck?.length || 0,
        cleanup_sql: cleanupSQL
      }
    });

  } catch (error) {
    console.error('❌ Errore durante pulizia:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    }, { status: 500 });
  }
}