-- ============================================
-- AGGIUNGE STATO "riaperta" ALLE LAVORAZIONI
-- ============================================
-- Esegui questo script su Supabase SQL Editor
-- per permettere la riapertura delle lavorazioni completate

-- 1. Rimuovi il vecchio constraint sullo stato
ALTER TABLE lavorazioni 
DROP CONSTRAINT IF EXISTS lavorazioni_stato_check;

-- 2. Aggiungi nuovo constraint con stato "riaperta"
ALTER TABLE lavorazioni
ADD CONSTRAINT lavorazioni_stato_check 
CHECK (stato IN ('aperta', 'in_corso', 'completata', 'archiviata', 'riaperta'));

-- 3. Aggiungi colonne per gestire la riapertura
ALTER TABLE lavorazioni
ADD COLUMN IF NOT EXISTS data_riapertura TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS riaperta_da UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS campi_da_ricompilare JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS campi_nuovi JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS motivo_riapertura TEXT;

-- 4. Crea indice per query veloci sulle lavorazioni riaperte
CREATE INDEX IF NOT EXISTS idx_lavorazioni_riaperte 
ON lavorazioni(stato) 
WHERE stato = 'riaperta';

-- 5. Verifica il risultato
SELECT 
  constraint_name, 
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'lavorazioni_stato_check';

-- ============================================
-- ISTRUZIONI
-- ============================================
-- Questo script:
-- 1. Rimuove il vecchio constraint CHECK sullo stato
-- 2. Aggiunge nuovo constraint con stato "riaperta"
-- 3. Aggiunge campi per gestire la riapertura:
--    - data_riapertura: quando è stata riaperta
--    - riaperta_da: chi l'ha riaperta (admin)
--    - campi_da_ricompilare: array campi da far ricompilare
--    - campi_nuovi: array nuovi campi da aggiungere
--    - motivo_riapertura: perché è stata riaperta
--
-- Dopo aver eseguito questo script:
-- - Potrai riaprire lavorazioni completate
-- - Il sistema gestirà quali campi modificare
-- - Gli admin possono scegliere cosa far ricompilare
-- ============================================
