-- Aggiorna lo schema users con i nuovi campi per gestione avanzata
-- Data: 2025-10-02
-- Descrizione: Aggiunge campi per reset password e tracciamento rifiuti

-- Aggiungi campo per tracciare rifiuti utenti
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ DEFAULT NULL;

-- Aggiungi campi per reset password
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_reset_required BOOLEAN DEFAULT FALSE;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_reset_at TIMESTAMPTZ DEFAULT NULL;

-- Aggiorna commenti per documentazione
COMMENT ON COLUMN users.rejected_at IS 'Timestamp quando utente è stato rifiutato dall''admin';
COMMENT ON COLUMN users.password_reset_required IS 'Flag che indica se utente deve cambiare password al prossimo login';  
COMMENT ON COLUMN users.password_reset_at IS 'Timestamp ultimo reset password effettuato dall''admin';

-- Verifica colonne aggiunte (query SQL standard invece di \d)
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
  AND column_name IN ('rejected_at', 'password_reset_required', 'password_reset_at')
ORDER BY column_name;