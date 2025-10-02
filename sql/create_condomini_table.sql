-- Script per creare la tabella condomini con la struttura completa
-- Da eseguire nel SQL Editor di Supabase

-- Crea la tabella condomini se non esiste
CREATE TABLE IF NOT EXISTS condomini (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nome text NOT NULL,
    token text UNIQUE NOT NULL,
    data_inserimento timestamp with time zone DEFAULT now(),
    data_ultima_modifica timestamp with time zone DEFAULT now(),
    assigned_to uuid REFERENCES users(id) ON DELETE SET NULL
);

-- Aggiungi le colonne mancanti se la tabella esiste già ma non ha tutte le colonne
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

-- Aggiungi constraint UNIQUE per token se non esiste
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'condomini_token_key' 
        AND table_name = 'condomini'
    ) THEN
        ALTER TABLE condomini ADD CONSTRAINT condomini_token_key UNIQUE (token);
    END IF;
END $$;

-- Aggiungi constraint NOT NULL per nome se non esiste
ALTER TABLE condomini ALTER COLUMN nome SET NOT NULL;

-- Aggiungi commenti per documentazione
COMMENT ON TABLE condomini IS 'Tabella dei condomini gestiti dal sistema';
COMMENT ON COLUMN condomini.id IS 'ID univoco del condominio';
COMMENT ON COLUMN condomini.nome IS 'Nome del condominio';
COMMENT ON COLUMN condomini.token IS 'Token univoco per identificazione condominio';
COMMENT ON COLUMN condomini.data_inserimento IS 'Data di creazione del record';
COMMENT ON COLUMN condomini.data_ultima_modifica IS 'Data ultima modifica';
COMMENT ON COLUMN condomini.assigned_to IS 'ID del sopralluoghista assegnato per questo condominio';

-- Crea indici per performance
CREATE INDEX IF NOT EXISTS idx_condomini_assigned_to ON condomini(assigned_to);
CREATE INDEX IF NOT EXISTS idx_condomini_token ON condomini(token);
CREATE INDEX IF NOT EXISTS idx_condomini_nome ON condomini(nome);

-- Trigger per aggiornare automaticamente data_ultima_modifica
CREATE OR REPLACE FUNCTION update_modified_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_ultima_modifica = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_condomini_modtime 
    BEFORE UPDATE ON condomini 
    FOR EACH ROW 
    EXECUTE FUNCTION update_modified_time();

-- Genera token casuali per record esistenti se necessario
UPDATE condomini SET token = 'cond_' || substr(gen_random_uuid()::text, 1, 8) 
WHERE token IS NULL OR token = '';

-- Inserisci alcuni condomini di esempio per testare
INSERT INTO condomini (nome, token) 
VALUES 
    ('Condominio Bellavista', 'cond_bellavista2025'),
    ('Residence Le Palme', 'cond_lepalme2025'),
    ('Palazzo Aurora', 'cond_aurora2025')
ON CONFLICT (token) DO NOTHING;

-- Verifica che tutto sia stato creato correttamente
SELECT 'Tabella condomini creata con successo!' as status;
SELECT count(*) as "Numero condomini" FROM condomini;