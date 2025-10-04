-- Script per verificare e correggere struttura tabella notifiche

-- 0. PRIMA: Rimuovi tutti i constraint problematici per evitare errori
ALTER TABLE notifiche DROP CONSTRAINT IF EXISTS notifiche_priorita_check;
ALTER TABLE notifiche DROP CONSTRAINT IF EXISTS notifiche_tipo_check;

-- 1. Verifica struttura esistente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notifiche' 
ORDER BY ordinal_position;

ALTER TABLE notifiche 
ADD COLUMN IF NOT EXISTS letta BOOLEAN DEFAULT FALSE;

ALTER TABLE notifiche 
ADD COLUMN IF NOT EXISTS priorita VARCHAR(20) DEFAULT 'media';

ALTER TABLE notifiche 
ADD COLUMN IF NOT EXISTS data_scadenza TIMESTAMP WITH TIME ZONE;

ALTER TABLE notifiche 
ADD COLUMN IF NOT EXISTS lavorazione_id UUID;

ALTER TABLE notifiche 
ADD COLUMN IF NOT EXISTS condominio_id UUID;

-- 3. PULIZIA DATI: Correggi dati mal formattati DOPO aver aggiunto le colonne
UPDATE notifiche 
SET priorita = 'media',
    letta = CASE 
        WHEN priorita = 'non_letta' THEN false
        WHEN priorita = 'letta' THEN true
        ELSE COALESCE(letta, false)
    END
WHERE priorita NOT IN ('bassa', 'media', 'alta', 'urgente') 
   OR priorita IS NULL;

-- Assicurati che letta sia sempre boolean
UPDATE notifiche 
SET letta = COALESCE(letta, false) 
WHERE letta IS NULL;

DO $$ 
BEGIN
    ALTER TABLE notifiche ADD CONSTRAINT notifiche_priorita_check 
    CHECK (priorita IN ('bassa', 'media', 'alta', 'urgente'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE notifiche DROP CONSTRAINT IF EXISTS notifiche_tipo_check;
ALTER TABLE notifiche ADD CONSTRAINT notifiche_tipo_check 
CHECK (tipo IN ('scadenza_imminente', 'nuova_assegnazione', 'lavorazione_completata', 'reminder_personalizzato', 'urgente', 'nuova_verifica'));

CREATE INDEX IF NOT EXISTS idx_notifiche_utente_id ON notifiche(utente_id);
CREATE INDEX IF NOT EXISTS idx_notifiche_letta ON notifiche(letta);
CREATE INDEX IF NOT EXISTS idx_notifiche_data_creazione ON notifiche(data_creazione);

SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notifiche' 
ORDER BY ordinal_position;

INSERT INTO notifiche (tipo, titolo, messaggio, utente_id, priorita, letta) 
VALUES ('nuova_assegnazione', 'Test Fix Schema', 'Test dopo correzione schema', gen_random_uuid(), 'media', false)
ON CONFLICT DO NOTHING;

-- 9. Conta record totali
SELECT COUNT(*) as total_notifiche FROM notifiche;