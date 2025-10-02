-- Script semplificato per aggiungere solo le colonne mancanti alla tabella condomini esistente
-- Esegui questo se la tabella condomini esiste già ma mancano alcune colonne

-- Aggiungi colonne mancanti (sicuro, non da errore se esistono già)
ALTER TABLE condomini 
ADD COLUMN IF NOT EXISTS nome text;

ALTER TABLE condomini 
ADD COLUMN IF NOT EXISTS token text;

ALTER TABLE condomini 
ADD COLUMN IF NOT EXISTS data_inserimento timestamp with time zone DEFAULT now();

ALTER TABLE condomini 
ADD COLUMN IF NOT EXISTS data_ultima_modifica timestamp with time zone DEFAULT now();

ALTER TABLE condomini 
ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES users(id) ON DELETE SET NULL;

-- Popola data_inserimento per record esistenti se è NULL
UPDATE condomini SET data_inserimento = now() WHERE data_inserimento IS NULL;

-- Popola data_ultima_modifica per record esistenti se è NULL  
UPDATE condomini SET data_ultima_modifica = now() WHERE data_ultima_modifica IS NULL;

-- Genera token per record esistenti che non ne hanno
UPDATE condomini 
SET token = 'cond_' || substr(gen_random_uuid()::text, 1, 12) 
WHERE token IS NULL OR token = '';

-- Aggiungi constraint se non esistono (ignora errori se già esistenti)
DO $$
BEGIN
    -- Prova ad aggiungere UNIQUE constraint per token
    BEGIN
        ALTER TABLE condomini ADD CONSTRAINT condomini_token_unique UNIQUE (token);
    EXCEPTION 
        WHEN duplicate_object THEN NULL;
    END;
    
    -- Prova ad aggiungere NOT NULL constraint per nome se tutti i record hanno nome
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM condomini WHERE nome IS NULL) THEN
            ALTER TABLE condomini ALTER COLUMN nome SET NOT NULL;
        END IF;
    EXCEPTION 
        WHEN others THEN NULL;
    END;
END $$;

-- Crea indici per performance
CREATE INDEX IF NOT EXISTS idx_condomini_assigned_to ON condomini(assigned_to);
CREATE INDEX IF NOT EXISTS idx_condomini_token ON condomini(token);
CREATE INDEX IF NOT EXISTS idx_condomini_nome ON condomini(nome);

-- Verifica risultato
SELECT 'Tabella condomini aggiornata con successo!' as status;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'condomini' 
ORDER BY ordinal_position;