-- ============================================
-- SETUP SISTEMA INTEGRAZIONE
-- ============================================
-- Questo script configura il sistema di integrazione:
-- - Lavorazioni di tipo "integrazione" separate dalle originali
-- - Collegamento tramite lavorazione_originale_id
-- - PDF e dati separati

-- 1. Aggiungi colonna per collegare integrazione a lavorazione originale
ALTER TABLE lavorazioni 
ADD COLUMN IF NOT EXISTS lavorazione_originale_id UUID REFERENCES lavorazioni(id) ON DELETE SET NULL;

-- 2. Aggiungi colonna per motivo integrazione
ALTER TABLE lavorazioni 
ADD COLUMN IF NOT EXISTS motivo_integrazione TEXT;

-- 3. Modifica constraint stato per includere 'integrazione'
ALTER TABLE lavorazioni 
DROP CONSTRAINT IF EXISTS lavorazioni_stato_check;

ALTER TABLE lavorazioni 
ADD CONSTRAINT lavorazioni_stato_check 
CHECK (stato IN (
  'in_corso', 
  'completata', 
  'integrazione',  -- NUOVO: lavorazione è un'integrazione in corso
  'riaperta',      -- vecchio sistema, manteniamo per retrocompatibilità
  'aperta',
  'in_attesa',
  'annullata',
  'sospesa',
  'da_fare'
));

-- 4. Crea indici per query efficienti
CREATE INDEX IF NOT EXISTS idx_lavorazioni_originale 
ON lavorazioni(lavorazione_originale_id) 
WHERE lavorazione_originale_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lavorazioni_stato_integrazione 
ON lavorazioni(stato) 
WHERE stato = 'integrazione';

CREATE INDEX IF NOT EXISTS idx_lavorazioni_motivo_integrazione 
ON lavorazioni(motivo_integrazione) 
WHERE motivo_integrazione IS NOT NULL;

-- 5. Commenti per documentazione
COMMENT ON COLUMN lavorazioni.lavorazione_originale_id IS 
'ID della lavorazione originale se questa è un''integrazione';

COMMENT ON COLUMN lavorazioni.motivo_integrazione IS 
'Motivo per cui è stata richiesta l''integrazione dall''admin';

-- 6. Verifica configurazione
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'lavorazioni'
AND column_name IN ('lavorazione_originale_id', 'motivo_integrazione', 'dati_verifiche')
ORDER BY column_name;

-- 7. Test query: trova tutte le integrazioni
SELECT 
  l.id,
  l.titolo AS integrazione_titolo,
  l.stato,
  l.motivo_integrazione,
  l.created_at AS data_integrazione,
  orig.id AS lavorazione_originale_id,
  orig.titolo AS lavorazione_originale_titolo,
  orig.created_at AS data_originale
FROM lavorazioni l
LEFT JOIN lavorazioni orig ON l.lavorazione_originale_id = orig.id
WHERE l.lavorazione_originale_id IS NOT NULL
ORDER BY l.created_at DESC
LIMIT 10;

-- 8. Test query: trova lavorazione con sue integrazioni
SELECT 
  l.id,
  l.titolo,
  l.stato,
  COUNT(integ.id) AS numero_integrazioni,
  array_agg(integ.id ORDER BY integ.created_at) FILTER (WHERE integ.id IS NOT NULL) AS integrazioni_ids
FROM lavorazioni l
LEFT JOIN lavorazioni integ ON integ.lavorazione_originale_id = l.id
WHERE l.lavorazione_originale_id IS NULL  -- solo lavorazioni principali
GROUP BY l.id, l.titolo, l.stato
HAVING COUNT(integ.id) > 0
ORDER BY l.created_at DESC
LIMIT 10;
