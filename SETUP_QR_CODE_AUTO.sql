-- ============================================
-- SETUP AUTOMATICO QR CODE PER CONDOMINI
-- ============================================
-- Esegui questo script UNA VOLTA su Supabase SQL Editor
-- per configurare la generazione automatica dei QR code

-- 1. Aggiungi colonna qr_code se non esiste
ALTER TABLE condomini 
ADD COLUMN IF NOT EXISTS qr_code TEXT UNIQUE;

-- 2. Crea indice per velocizzare lookup
CREATE INDEX IF NOT EXISTS idx_condomini_qr_code ON condomini(qr_code);

-- 3. Genera QR code per condomini esistenti che non ce l'hanno
UPDATE condomini 
SET qr_code = 'COND-' || gen_random_uuid()::text 
WHERE qr_code IS NULL;

-- 4. Crea funzione per generare QR code automaticamente
CREATE OR REPLACE FUNCTION generate_qr_code_for_condominio()
RETURNS TRIGGER AS $$
BEGIN
  -- Se il QR code non è stato fornito, generalo automaticamente
  IF NEW.qr_code IS NULL THEN
    NEW.qr_code := 'COND-' || gen_random_uuid()::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Crea trigger che si attiva PRIMA dell'inserimento
DROP TRIGGER IF EXISTS trigger_generate_qr_code ON condomini;
CREATE TRIGGER trigger_generate_qr_code
  BEFORE INSERT ON condomini
  FOR EACH ROW
  EXECUTE FUNCTION generate_qr_code_for_condominio();

-- 6. Verifica il risultato
SELECT 
  id, 
  nome, 
  qr_code,
  CASE 
    WHEN qr_code IS NOT NULL THEN '✅ QR presente'
    ELSE '❌ QR mancante'
  END as status
FROM condomini 
ORDER BY data_inserimento DESC
LIMIT 10;

-- ============================================
-- ISTRUZIONI
-- ============================================
-- Questo script:
-- 1. Aggiunge la colonna qr_code alla tabella condomini
-- 2. Genera QR code per tutti i condomini esistenti
-- 3. Crea un trigger che genera automaticamente il QR code
--    per ogni nuovo condominio inserito
--
-- Dopo aver eseguito questo script:
-- - Tutti i condomini esistenti avranno un QR code
-- - Ogni nuovo condominio avrà automaticamente un QR code
-- - Non è più necessario eseguire migrazioni manuali
-- - Anche dopo il reset del database, i nuovi condomini
--   avranno subito il loro QR code
-- ============================================
