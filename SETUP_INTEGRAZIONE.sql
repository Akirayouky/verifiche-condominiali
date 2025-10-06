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

-- 3. Aggiungi colonna per ID cartella Blob (separazione foto)
ALTER TABLE lavorazioni 
ADD COLUMN IF NOT EXISTS id_cartella TEXT;

-- 4. Aggiungi colonna per campi nuovi da compilare (JSON)
ALTER TABLE lavorazioni 
ADD COLUMN IF NOT EXISTS campi_nuovi JSONB DEFAULT '[]'::jsonb;

-- 5. Aggiungi colonna per dati verifiche (JSON)
ALTER TABLE lavorazioni 
ADD COLUMN IF NOT EXISTS dati_verifiche JSONB DEFAULT '{}'::jsonb;

-- 6. Aggiungi colonna per data integrazione
ALTER TABLE lavorazioni 
ADD COLUMN IF NOT EXISTS data_integrazione TIMESTAMP WITH TIME ZONE;

-- 7. Modifica constraint stato per includere 'integrazione'
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

-- 8. Crea indici per query efficienti
CREATE INDEX IF NOT EXISTS idx_lavorazioni_originale 
ON lavorazioni(lavorazione_originale_id) 
WHERE lavorazione_originale_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lavorazioni_stato_integrazione 
ON lavorazioni(stato) 
WHERE stato = 'integrazione';

CREATE INDEX IF NOT EXISTS idx_lavorazioni_motivo_integrazione 
ON lavorazioni(motivo_integrazione) 
WHERE motivo_integrazione IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lavorazioni_id_cartella 
ON lavorazioni(id_cartella) 
WHERE id_cartella IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lavorazioni_campi_nuovi 
ON lavorazioni USING GIN (campi_nuovi) 
WHERE campi_nuovi IS NOT NULL;

-- 9. Commenti per documentazione
COMMENT ON COLUMN lavorazioni.lavorazione_originale_id IS 
'ID della lavorazione originale se questa è un''integrazione';

COMMENT ON COLUMN lavorazioni.motivo_integrazione IS 
'Motivo per cui è stata richiesta l''integrazione dall''admin';

COMMENT ON COLUMN lavorazioni.id_cartella IS 
'ID univoco della cartella Vercel Blob per separare le foto di ogni lavorazione/integrazione';

COMMENT ON COLUMN lavorazioni.campi_nuovi IS 
'Array dei nuovi campi da compilare per l''integrazione';

COMMENT ON COLUMN lavorazioni.dati_verifiche IS 
'Dati compilati dall''utente per l''integrazione (campi_nuovi)';

COMMENT ON COLUMN lavorazioni.data_integrazione IS 
'Data di completamento dell''integrazione';

-- 10. Verifica configurazione
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'lavorazioni'
AND column_name IN ('lavorazione_originale_id', 'motivo_integrazione', 'campi_nuovi', 'dati_verifiche', 'id_cartella', 'data_integrazione')
ORDER BY column_name;

-- 11. Test query: trova tutte le integrazioni
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

-- 12. Test query: trova lavorazione con sue integrazioni
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
