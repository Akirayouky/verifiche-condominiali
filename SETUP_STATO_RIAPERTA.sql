-- ============================================
-- SETUP STATO RIAPERTA E CAMPI JSONB
-- ============================================
-- Esegui questo script su Supabase SQL Editor
-- per configurare il sistema di riapertura lavorazioni

-- 1. Aggiungi colonne JSONB per riapertura (se non esistono)
ALTER TABLE lavorazioni 
ADD COLUMN IF NOT EXISTS campi_da_ricompilare JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS campi_nuovi JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS motivo_riapertura TEXT,
ADD COLUMN IF NOT EXISTS data_riapertura TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS riaperta_da UUID REFERENCES users(id);

-- 2. Crea indici per migliorare performance query
CREATE INDEX IF NOT EXISTS idx_lavorazioni_riaperta_da 
ON lavorazioni(riaperta_da);

CREATE INDEX IF NOT EXISTS idx_lavorazioni_data_riapertura 
ON lavorazioni(data_riapertura DESC);

-- 3. Modifica constraint stato per includere 'riaperta' (se non già presente)
-- Prima rimuovi il constraint esistente se presente
ALTER TABLE lavorazioni 
DROP CONSTRAINT IF EXISTS lavorazioni_stato_check;

-- Poi ricrealo con tutti gli stati incluso 'riaperta'
ALTER TABLE lavorazioni 
ADD CONSTRAINT lavorazioni_stato_check 
CHECK (stato IN ('in_corso', 'completata', 'riaperta'));

-- 4. Verifica la configurazione
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'lavorazioni' 
  AND column_name IN (
    'stato',
    'campi_da_ricompilare', 
    'campi_nuovi', 
    'motivo_riapertura',
    'data_riapertura',
    'riaperta_da'
  )
ORDER BY column_name;

-- 5. Verifica constraint stato
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'lavorazioni_stato_check';

-- 6. Test: Seleziona tutte le lavorazioni riaperte (se esistono)
SELECT 
  id,
  titolo,
  stato,
  data_riapertura,
  motivo_riapertura,
  jsonb_array_length(campi_da_ricompilare) as num_campi_ricompilare,
  jsonb_array_length(campi_nuovi) as num_campi_nuovi
FROM lavorazioni 
WHERE stato = 'riaperta'
ORDER BY data_riapertura DESC
LIMIT 10;

-- ============================================
-- ISTRUZIONI
-- ============================================
-- Questo script:
-- 1. Aggiunge le colonne JSONB necessarie (campi_da_ricompilare, campi_nuovi)
-- 2. Aggiunge campi metadata (motivo_riapertura, data_riapertura, riaperta_da)
-- 3. Modifica il constraint dello stato per includere 'riaperta'
-- 4. Crea indici per migliorare le performance
-- 5. Verifica la configurazione finale
--
-- Dopo aver eseguito questo script:
-- - La tabella lavorazioni supporterà lo stato 'riaperta'
-- - I campi JSONB saranno disponibili per memorizzare le configurazioni
-- - Il sistema di riapertura funzionerà correttamente
-- ============================================

-- IMPORTANTE: Se ricevi errori sul constraint stato, potrebbe essere che
-- il constraint si chiama diversamente. In tal caso:
-- 1. Trova il nome esatto con:
SELECT constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'lavorazioni' AND constraint_type = 'CHECK';

-- 2. Poi esegui DROP e ADD con il nome corretto
