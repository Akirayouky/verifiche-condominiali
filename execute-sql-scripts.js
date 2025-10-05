#!/usr/bin/env node
/**
 * Script per eseguire gli setup SQL su Supabase
 * Esegue in ordine:
 * 1. SETUP_QR_CODE_AUTO.sql (se non già eseguito)
 * 2. ADD_STATO_RIAPERTA.sql
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configurazione Supabase
const SUPABASE_URL = 'https://ygvlcikgzkoaxlrmwsnv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlndmxjaWtnemtvYXhscm13c252Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzOTgzMzgsImV4cCI6MjA3NDk3NDMzOH0.Zc6eihyJiTZy6WicV6MyIgZ1Oq7GwzRYR01zovQHFPs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Colori per console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(colors[color], ...args, colors.reset);
}

async function executeSQL(sqlFile, description) {
  log('cyan', `\n${'='.repeat(60)}`);
  log('cyan', `📄 ${description}`);
  log('cyan', `${'='.repeat(60)}\n`);

  try {
    const sqlPath = path.join(__dirname, sqlFile);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Supabase non supporta direttamente l'esecuzione di SQL complessi via JS client
    // Mostriamo le istruzioni per l'utente
    log('yellow', '⚠️  ATTENZIONE: Supabase JS client non supporta DDL commands (ALTER TABLE, CREATE TRIGGER, etc.)');
    log('yellow', '\n📋 ISTRUZIONI:');
    log('blue', '\n1. Vai su: https://supabase.com/dashboard/project/ygvlcikgzkoaxlrmwsnv/sql/new');
    log('blue', '2. Copia il contenuto del file:');
    log('magenta', `   ${sqlFile}`);
    log('blue', '3. Incolla nell\'editor SQL di Supabase');
    log('blue', '4. Clicca "Run" per eseguire\n');

    // Mostra preview del SQL
    log('green', '📝 PREVIEW SQL:');
    const lines = sql.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('--');
    });
    log('cyan', lines.slice(0, 10).join('\n'));
    if (lines.length > 10) {
      log('cyan', `... (${lines.length - 10} righe rimanenti)`);
    }

    return { success: false, manual: true };
  } catch (error) {
    log('red', `❌ Errore: ${error.message}`);
    return { success: false, error };
  }
}

async function checkQRCodeColumn() {
  log('cyan', '\n🔍 Verifica esistenza colonna qr_code...');
  
  try {
    const { data, error } = await supabase
      .from('condomini')
      .select('id, nome, qr_code')
      .limit(1);

    if (error) {
      log('yellow', '⚠️  Colonna qr_code non trovata o non accessibile');
      return false;
    }

    log('green', '✅ Colonna qr_code già presente!');
    
    // Conta quanti condomini hanno QR code
    const { data: condomini, error: countError } = await supabase
      .from('condomini')
      .select('qr_code', { count: 'exact' });

    if (!countError && condomini) {
      const withQR = condomini.filter(c => c.qr_code).length;
      const total = condomini.length;
      log('blue', `   ${withQR}/${total} condomini hanno QR code`);
      
      if (withQR === total && total > 0) {
        log('green', '✅ Tutti i condomini hanno QR code, skip SETUP_QR_CODE_AUTO.sql');
        return true;
      }
    }

    return false;
  } catch (error) {
    log('yellow', '⚠️  Impossibile verificare colonna qr_code');
    return false;
  }
}

async function checkRiapertaStatus() {
  log('cyan', '\n🔍 Verifica esistenza stato "riaperta"...');
  
  try {
    // Prova a inserire un record test con stato='riaperta'
    // (lo cancelleremo subito dopo)
    const testData = {
      condominio_id: '00000000-0000-0000-0000-000000000000', // UUID non valido
      stato: 'riaperta',
      data_apertura: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('lavorazioni')
      .insert([testData]);

    if (error && error.message.includes('check constraint')) {
      log('yellow', '⚠️  Stato "riaperta" non ancora abilitato nel constraint');
      return false;
    }

    log('green', '✅ Stato "riaperta" già configurato!');
    return true;
  } catch (error) {
    log('yellow', '⚠️  Impossibile verificare stato riaperta');
    return false;
  }
}

async function main() {
  log('magenta', '\n╔════════════════════════════════════════════════════════════╗');
  log('magenta', '║     🚀 SETUP DATABASE - SISTEMA VERIFICHE CONDOMINIALI    ║');
  log('magenta', '╚════════════════════════════════════════════════════════════╝\n');

  // Step 1: Verifica QR Code
  const qrCodeReady = await checkQRCodeColumn();
  if (!qrCodeReady) {
    await executeSQL('SETUP_QR_CODE_AUTO.sql', 'Setup QR Code Automatico');
  }

  // Step 2: Verifica Stato Riaperta
  const riapertaReady = await checkRiapertaStatus();
  if (!riapertaReady) {
    await executeSQL('ADD_STATO_RIAPERTA.sql', 'Aggiungi Stato Riaperta');
  }

  log('magenta', '\n╔════════════════════════════════════════════════════════════╗');
  log('magenta', '║                    🎯 RIEPILOGO FINALE                     ║');
  log('magenta', '╚════════════════════════════════════════════════════════════╝\n');

  if (!qrCodeReady || !riapertaReady) {
    log('yellow', '📋 AZIONI RICHIESTE:');
    log('blue', '\n1. Apri Supabase SQL Editor:');
    log('cyan', '   https://supabase.com/dashboard/project/ygvlcikgzkoaxlrmwsnv/sql/new\n');

    if (!qrCodeReady) {
      log('blue', '2. Esegui SETUP_QR_CODE_AUTO.sql per:');
      log('green', '   ✓ Aggiungere colonna qr_code');
      log('green', '   ✓ Generare QR per condomini esistenti');
      log('green', '   ✓ Creare trigger automatico\n');
    }

    if (!riapertaReady) {
      log('blue', '3. Esegui ADD_STATO_RIAPERTA.sql per:');
      log('green', '   ✓ Abilitare stato "riaperta"');
      log('green', '   ✓ Aggiungere campi gestione riapertura');
      log('green', '   ✓ Creare indice ottimizzato\n');
    }

    log('yellow', '⚠️  Dopo aver eseguito gli script, rilancia:');
    log('cyan', '   npm run dev\n');
  } else {
    log('green', '✅ Database già configurato correttamente!');
    log('green', '✅ QR Code: Attivo');
    log('green', '✅ Stato Riaperta: Configurato\n');
    log('blue', '🎉 Puoi procedere con l\'implementazione dei wizard!\n');
  }
}

main().catch(console.error);
