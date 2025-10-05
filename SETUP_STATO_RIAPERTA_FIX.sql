-- ============================================
-- SETUP STATO RIAPERTA E CAMPI JSONB - VERSIONE CORRETTA
-- ============================================
-- Questo script gestisce anche stati esistenti nel database

-- 1. Prima, vediamo quali stati esistono attualmente
SELECT DISTINCT stato, COUNT(*) as count
FROM lavorazioni 
GROUP BY stato
ORDER BY stato;

-- 2. Aggiungi colonne JSONB per riapertura (se non esistono)
ALTER TABLE lavorazioni 
ADD COLUMN IF NOT EXISTS campi_da_ricompilare JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS campi_nuovi JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS motivo_riapertura TEXT,
ADD COLUMN IF NOT EXISTS data_riapertura TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS riaperta_da UUID REFERENCES users(id);

-- 3. Crea indici per migliorare performance query
CREATE INDEX IF NOT EXISTS idx_lavorazioni_riaperta_da 
ON lavorazioni(riaperta_da);

CREATE INDEX IF NOT EXISTS idx_lavorazioni_data_riapertura 
ON lavorazioni(data_riapertura DESC);

-- 4. Modifica constraint stato per includere 'riaperta'
-- Prima rimuovi il constraint esistente
ALTER TABLE lavorazioni 
DROP CONSTRAINT IF EXISTS lavorazioni_stato_check;

-- Poi ricrealo con TUTTI gli stati possibili (inclusi quelli esistenti + 'riaperta')
-- Aggiungiamo tutti gli stati che potrebbero esistere
ALTER TABLE lavorazioni 
ADD CONSTRAINT lavorazioni_stato_check 
CHECK (stato IN (
  'in_corso', 
  'completata', 
  'riaperta',
  'aperta',           -- potrebbe esistere
  'in_attesa',        -- potrebbe esistere
  'annullata',        -- potrebbe esistere
  'sospesa',          -- potrebbe esistere
  'da_fare'           -- potrebbe esistere
));

-- 5. Verifica la configurazione
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

-- 6. Verifica constraint stato
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'lavorazioni_stato_check';

-- 7. Controlla di nuovo gli stati dopo il constraint
SELECT DISTINCT stato, COUNT(*) as count
FROM lavorazioni 
GROUP BY stato
ORDER BY stato;

-- 8. Test: Seleziona tutte le lavorazioni riaperte (se esistono)
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
-- SUCCESSO!
-- ============================================
-- Se arrivi qui senza errori, il database è configurato correttamente
-- per il Sistema Riapertura Lavorazioni.
-- ============================================
