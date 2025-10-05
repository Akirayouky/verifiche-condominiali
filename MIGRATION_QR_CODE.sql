-- ⚠️ DEPRECATO - USA INVECE SETUP_QR_CODE_AUTO.sql
-- Questo file è stato sostituito da SETUP_QR_CODE_AUTO.sql
-- che include anche un trigger automatico per i nuovi condomini

-- Aggiunge campo qr_code alla tabella condomini
-- Esegui questo su Supabase SQL Editor

-- 1. Aggiungi colonna qr_code (UUID unico per ogni condominio)
ALTER TABLE condomini 
ADD COLUMN IF NOT EXISTS qr_code TEXT UNIQUE;

-- 2. Genera QR code per condomini esistenti (usando loro ID)
UPDATE condomini 
SET qr_code = 'COND-' || id 
WHERE qr_code IS NULL;

-- 3. Crea indice per velocizzare lookup
CREATE INDEX IF NOT EXISTS idx_condomini_qr_code ON condomini(qr_code);

-- 4. Verifica
SELECT id, nome, qr_code FROM condomini LIMIT 5;

-- ⚠️ NOTA: Questo script non include il trigger automatico.
-- Per una soluzione completa, usa SETUP_QR_CODE_AUTO.sql
