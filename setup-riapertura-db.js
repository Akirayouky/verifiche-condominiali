#!/usr/bin/env node

/**
 * 🔧 SETUP DATABASE RIAPERTURA - Automatico via Script Node.js
 * 
 * Questo script esegue le modifiche al database Supabase senza bisogno
 * di accedere al pannello web. Usa le API Supabase direttamente.
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Leggi .env.local manualmente
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env.local')
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && !key.startsWith('#')) {
        const value = valueParts.join('=').trim()
        process.env[key.trim()] = value
      }
    })
  } catch (err) {
    console.error('⚠️  Impossibile leggere .env.local:', err.message)
  }
}

loadEnv()

// Colori per output console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

const log = (color, message) => {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

const banner = () => {
  log('cyan', '\n╔══════════════════════════════════════════════════════════╗')
  log('cyan', '║     🔧 SETUP DATABASE - SISTEMA RIAPERTURA              ║')
  log('cyan', '║     Esecuzione automatica via Node.js                   ║')
  log('cyan', '╚══════════════════════════════════════════════════════════╝\n')
}

async function setupDatabase() {
  banner()

  // 1. Verifica variabili ambiente
  log('blue', '📋 Step 1: Verifica configurazione...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    log('red', '❌ ERRORE: Variabili ambiente mancanti!')
    log('yellow', '   Verifica che .env.local contenga:')
    log('yellow', '   - NEXT_PUBLIC_SUPABASE_URL')
    log('yellow', '   - NEXT_PUBLIC_SUPABASE_ANON_KEY')
    process.exit(1)
  }

  log('green', `✅ URL Supabase: ${supabaseUrl}`)
  log('green', `✅ API Key configurata\n`)

  // 2. Connessione Supabase
  log('blue', '🔌 Step 2: Connessione a Supabase...')
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Test connessione
  try {
    const { data, error } = await supabase.from('lavorazioni').select('id').limit(1)
    if (error) {
      log('red', `❌ Errore connessione: ${error.message}`)
      process.exit(1)
    }
    log('green', '✅ Connessione riuscita\n')
  } catch (err) {
    log('red', `❌ Errore: ${err.message}`)
    process.exit(1)
  }

  // 3. Verifica colonne esistenti
  log('blue', '🔍 Step 3: Verifica colonne esistenti...')
  
  try {
    // Tenta una query con le nuove colonne per vedere se esistono
    const { data, error } = await supabase
      .from('lavorazioni')
      .select('campi_da_ricompilare, campi_nuovi, motivo_riapertura')
      .limit(1)
    
    if (!error) {
      log('yellow', '⚠️  Le colonne esistono già!')
      log('cyan', '   Nessuna modifica necessaria.\n')
      
      // Verifica constraint stato
      const { data: testRiaperta, error: statoError } = await supabase
        .from('lavorazioni')
        .select('id')
        .eq('stato', 'riaperta')
        .limit(1)
      
      if (statoError && statoError.message.includes('invalid input value')) {
        log('yellow', '⚠️  Constraint stato NON include "riaperta"')
        log('red', '   Questo richiede accesso SQL diretto (non possibile via API)')
        log('cyan', '\n📝 Soluzione alternativa:')
        log('cyan', '   1. Recupera accesso a Supabase web (password reset)')
        log('cyan', '   2. Oppure contatta il proprietario del progetto')
        log('cyan', '   3. Esegui manualmente: SETUP_STATO_RIAPERTA.sql\n')
      } else {
        log('green', '✅ Constraint stato include "riaperta"')
      }
      
      log('green', '\n✅ Database già configurato correttamente!')
      return
    }
    
    // Se arriviamo qui, le colonne non esistono
    log('yellow', '⚠️  Colonne JSONB non trovate')
    log('red', '\n❌ PROBLEMA: Le colonne non possono essere create via API')
    log('cyan', '\nℹ️  Supabase richiede SQL diretto per ALTER TABLE')
    log('cyan', '   Operazioni necessarie:')
    log('yellow', '   - ALTER TABLE lavorazioni ADD COLUMN campi_da_ricompilare JSONB')
    log('yellow', '   - ALTER TABLE lavorazioni ADD COLUMN campi_nuovi JSONB')
    log('yellow', '   - ALTER TABLE lavorazioni ADD COLUMN motivo_riapertura TEXT')
    log('yellow', '   - ALTER TABLE lavorazioni ADD COLUMN data_riapertura TIMESTAMP')
    log('yellow', '   - ALTER TABLE lavorazioni ADD COLUMN riaperta_da UUID')
    log('yellow', '   - ALTER TABLE lavorazioni DROP CONSTRAINT stato_check')
    log('yellow', '   - ALTER TABLE lavorazioni ADD CONSTRAINT stato_check ...')
    
    log('cyan', '\n📝 SOLUZIONI DISPONIBILI:\n')
    
    log('bright', '1️⃣  RECUPERA ACCESSO SUPABASE (Consigliato)')
    log('cyan', '   a. Vai su https://supabase.com')
    log('cyan', '   b. Click "Forgot password?"')
    log('cyan', '   c. Usa email registrata per reset password')
    log('cyan', '   d. Una volta dentro, vai su SQL Editor')
    log('cyan', '   e. Esegui il file: SETUP_STATO_RIAPERTA.sql')
    
    log('bright', '\n2️⃣  CONTATTA IL PROPRIETARIO DEL PROGETTO')
    log('cyan', '   - Se non sei owner, chiedi a chi ha creato il progetto')
    log('cyan', '   - Deve eseguire SETUP_STATO_RIAPERTA.sql per te')
    
    log('bright', '\n3️⃣  USA SUPABASE CLI (Avanzato)')
    log('cyan', '   $ npm install -g supabase')
    log('cyan', '   $ supabase login')
    log('cyan', '   $ supabase db push')
    
    log('bright', '\n4️⃣  CREA NUOVO PROGETTO SUPABASE')
    log('cyan', '   - Se il progetto attuale è inaccessibile')
    log('cyan', '   - Crea nuovo progetto e importa il database')
    log('cyan', '   - Aggiorna .env.local con nuove credenziali')
    
  } catch (err) {
    log('red', `❌ Errore imprevisto: ${err.message}`)
    log('cyan', '\n🔍 Stack trace:')
    console.error(err)
  }

  log('cyan', '\n════════════════════════════════════════════════════════════')
  log('yellow', '⚠️  Setup non completato - richiede accesso SQL diretto')
  log('cyan', '════════════════════════════════════════════════════════════\n')
}

// Esegui
setupDatabase().catch(err => {
  log('red', `\n❌ ERRORE FATALE: ${err.message}\n`)
  process.exit(1)
})
