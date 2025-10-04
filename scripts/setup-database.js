/**
 * Script per setup automatico database notifiche
 */

import { supabase } from '../dist/lib/supabase.js'
import fs from 'fs'
import path from 'path'

console.log('🔧 Inizializzazione schema notifiche...')

async function setupDatabase() {
  try {
    console.log('1. Creazione tabella notifiche...')
    
    // Crea tabella notifiche
    const { error: notificheError } = await supabase.rpc('exec_sql', {
      sql_command: `
        CREATE TABLE IF NOT EXISTS notifiche (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          utente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('scadenza', 'nuova_assegnazione', 'sistema', 'reminder')),
          titolo VARCHAR(255) NOT NULL,
          messaggio TEXT NOT NULL,
          actions JSONB DEFAULT '[]'::jsonb,
          metadati JSONB DEFAULT '{}'::jsonb,
          stato VARCHAR(20) DEFAULT 'non_letta' CHECK (stato IN ('non_letta', 'letta', 'archiviata')),
          priorita VARCHAR(20) DEFAULT 'normale' CHECK (priorita IN ('bassa', 'normale', 'alta', 'urgente')),
          data_creazione TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          data_lettura TIMESTAMP WITH TIME ZONE,
          data_scadenza TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (notificheError) {
      console.error('❌ Errore creazione tabella notifiche:', notificheError.message)
    } else {
      console.log('✅ Tabella notifiche creata')
    }

    console.log('2. Creazione tabella reminder_configs...')
    
    // Crea tabella reminder_configs
    const { error: reminderError } = await supabase.rpc('exec_sql', {
      sql_command: `
        CREATE TABLE IF NOT EXISTS reminder_configs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          utente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          nome VARCHAR(255) NOT NULL,
          descrizione TEXT,
          tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('scadenza_lavorazioni', 'controllo_giornaliero', 'report_settimanale', 'personalizzato')),
          frequenza VARCHAR(20) NOT NULL CHECK (frequenza IN ('giornaliera', 'settimanale', 'mensile')),
          ora_invio TIME NOT NULL DEFAULT '09:00',
          giorni_settimana INTEGER[] DEFAULT '{1,2,3,4,5}',
          giorni_anticipo INTEGER DEFAULT 1,
          attivo BOOLEAN DEFAULT true,
          ultima_esecuzione TIMESTAMP WITH TIME ZONE,
          prossima_esecuzione TIMESTAMP WITH TIME ZONE,
          configurazione JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (reminderError) {
      console.error('❌ Errore creazione tabella reminder_configs:', reminderError.message)
    } else {
      console.log('✅ Tabella reminder_configs creata')
    }

    console.log('3. Creazione indici...')
    
    // Crea indici
    const indices = [
      'CREATE INDEX IF NOT EXISTS idx_notifiche_utente_stato ON notifiche(utente_id, stato);',
      'CREATE INDEX IF NOT EXISTS idx_notifiche_tipo_priorita ON notifiche(tipo, priorita);',
      'CREATE INDEX IF NOT EXISTS idx_notifiche_data_creazione ON notifiche(data_creazione DESC);',
      'CREATE INDEX IF NOT EXISTS idx_reminder_configs_utente ON reminder_configs(utente_id);',
      'CREATE INDEX IF NOT EXISTS idx_reminder_configs_attivo ON reminder_configs(attivo) WHERE attivo = true;'
    ]

    for (const indexSql of indices) {
      const { error } = await supabase.rpc('exec_sql', { sql_command: indexSql })
      if (error) {
        console.error('❌ Errore indice:', error.message)
      }
    }
    
    console.log('✅ Indici creati')

    console.log('4. Configurazione RLS...')
    
    // Abilita RLS
    const rlsPolicies = [
      'ALTER TABLE notifiche ENABLE ROW LEVEL SECURITY;',
      'ALTER TABLE reminder_configs ENABLE ROW LEVEL SECURITY;',
      `CREATE POLICY "Utenti possono vedere le proprie notifiche" ON notifiche FOR SELECT USING (auth.uid() = utente_id);`,
      `CREATE POLICY "Utenti possono aggiornare le proprie notifiche" ON notifiche FOR UPDATE USING (auth.uid() = utente_id);`,
      `CREATE POLICY "Sistema può inserire notifiche" ON notifiche FOR INSERT WITH CHECK (true);`,
      `CREATE POLICY "Utenti possono gestire i propri reminder" ON reminder_configs FOR ALL USING (auth.uid() = utente_id);`
    ]

    for (const policySql of rlsPolicies) {
      const { error } = await supabase.rpc('exec_sql', { sql_command: policySql })
      if (error && !error.message.includes('already exists')) {
        console.error('❌ Errore RLS:', error.message)
      }
    }
    
    console.log('✅ RLS configurato')

    console.log('🎉 Setup database completato con successo!')
    
    // Test connessione
    console.log('5. Test connessione...')
    const { data, error: testError } = await supabase
      .from('notifiche')
      .select('count(*)')
      .limit(1)
      
    if (testError) {
      console.error('❌ Errore test:', testError.message)
    } else {
      console.log('✅ Test connessione riuscito')
    }

  } catch (error) {
    console.error('❌ Errore generale setup:', error)
    process.exit(1)
  }
}

// Esegui setup
setupDatabase()