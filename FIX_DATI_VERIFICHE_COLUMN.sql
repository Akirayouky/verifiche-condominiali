-- ============================================
-- FIX COLONNA DATI_VERIFICHE
-- ============================================
-- Aggiunge la colonna dati_verifiche necessaria per il sistema di riapertura

-- 1. Aggiungi colonna dati_verifiche (se non esiste)
ALTER TABLE lavorazioni 
ADD COLUMN IF NOT EXISTS dati_verifiche JSONB DEFAULT '{}'::jsonb;

-- 2. Crea indice GIN per query efficienti su JSONB
CREATE INDEX IF NOT EXISTS idx_lavorazioni_dati_verifiche 
ON lavorazioni USING GIN (dati_verifiche);

-- 3. Migra dati esistenti da verifiche_svolte a dati_verifiche (se la colonna verifiche_svolte esiste)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name='lavorazioni' 
    AND column_name='verifiche_svolte'
  ) THEN
    UPDATE lavorazioni
    SET dati_verifiche = verifiche_svolte
    WHERE dati_verifiche = '{}'::jsonb 
    AND verifiche_svolte IS NOT NULL 
    AND verifiche_svolte != '{}'::jsonb;
    
    RAISE NOTICE 'Migrated data from verifiche_svolte to dati_verifiche';
  END IF;
END $$;

-- 4. Verifica configurazione
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'lavorazioni'
AND column_name IN ('dati_verifiche', 'campi_da_ricompilare', 'campi_nuovi')
ORDER BY column_name;

-- 5. Test query
SELECT 
  id,
  stato,
  COALESCE(jsonb_typeof(dati_verifiche), 'null') as dati_verifiche_type,
  COALESCE(jsonb_typeof(campi_da_ricompilare), 'null') as campi_da_ricompilare_type,
  COALESCE(jsonb_typeof(campi_nuovi), 'null') as campi_nuovi_type
FROM lavorazioni
LIMIT 5;

-- 6. Mostra esempio di lavorazione con dati
SELECT 
  id,
  titolo,
  stato,
  dati_verifiche,
  campi_da_ricompilare,
  campi_nuovi,
  motivo_riapertura
FROM lavorazioni
WHERE stato = 'riaperta'
LIMIT 1;
