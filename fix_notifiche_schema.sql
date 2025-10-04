-- Script per verificare e correggere struttura tabella notifiche

-- 1. Verifica struttura esistente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notifiche' 
ORDER BY ordinal_position;

-- 2. Aggiungi colonne mancanti se non esistono
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

-- 3. Aggiungi constraint per priorita se non esiste
DO $$ 
BEGIN
    ALTER TABLE notifiche ADD CONSTRAINT notifiche_priorita_check 
    CHECK (priorita IN ('bassa', 'media', 'alta', 'urgente'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 4. Aggiungi constraint per tipo se non esiste (aggiornato)
ALTER TABLE notifiche DROP CONSTRAINT IF EXISTS notifiche_tipo_check;
ALTER TABLE notifiche ADD CONSTRAINT notifiche_tipo_check 
CHECK (tipo IN ('scadenza_imminente', 'nuova_assegnazione', 'lavorazione_completata', 'reminder_personalizzato', 'urgente', 'nuova_verifica'));

-- 5. Crea indici se non esistono
CREATE INDEX IF NOT EXISTS idx_notifiche_utente_id ON notifiche(utente_id);
CREATE INDEX IF NOT EXISTS idx_notifiche_letta ON notifiche(letta);
CREATE INDEX IF NOT EXISTS idx_notifiche_data_creazione ON notifiche(data_creazione);

-- 6. Verifica struttura finale
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notifiche' 
ORDER BY ordinal_position;

-- 7. Test inserimento per verificare tutto funzioni
INSERT INTO notifiche (tipo, titolo, messaggio, utente_id, priorita, letta) 
VALUES ('nuova_assegnazione', 'Test Fix Schema', 'Test dopo correzione schema', gen_random_uuid(), 'media', false)
ON CONFLICT DO NOTHING;

-- 8. Conta record totali
SELECT COUNT(*) as total_notifiche FROM notifiche;