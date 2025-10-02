-- Aggiungi colonne mancanti alla tabella users
-- Questo script aggiunge nome, cognome, telefono e altri campi necessari

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS nome VARCHAR(100),
ADD COLUMN IF NOT EXISTS cognome VARCHAR(100),
ADD COLUMN IF NOT EXISTS telefono VARCHAR(20),
ADD COLUMN IF NOT EXISTS attivo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Aggiorna l'utente admin esistente per avere un nome e cognome
UPDATE users 
SET nome = 'Admin', cognome = 'Sistema', attivo = true, approved_at = NOW()
WHERE username = 'admin' AND role = 'admin';

-- Commento: Questo script aggiunge i campi necessari per la registrazione completa degli utenti