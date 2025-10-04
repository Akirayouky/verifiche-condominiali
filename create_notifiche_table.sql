-- Crea tabella notifiche se non esiste
CREATE TABLE IF NOT EXISTS notifiche (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('scadenza_imminente', 'nuova_assegnazione', 'lavorazione_completata', 'reminder_personalizzato', 'urgente', 'nuova_verifica')),
    titolo VARCHAR(255) NOT NULL,
    messaggio TEXT NOT NULL,
    utente_id VARCHAR(255) NOT NULL,
    lavorazione_id UUID,
    condominio_id UUID,
    priorita VARCHAR(20) DEFAULT 'media' CHECK (priorita IN ('bassa', 'media', 'alta', 'urgente')),
    letta BOOLEAN DEFAULT FALSE,
    data_creazione TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_scadenza TIMESTAMP WITH TIME ZONE
);

-- Crea indici per performance
CREATE INDEX IF NOT EXISTS idx_notifiche_utente_id ON notifiche(utente_id);
CREATE INDEX IF NOT EXISTS idx_notifiche_letta ON notifiche(letta);
CREATE INDEX IF NOT EXISTS idx_notifiche_data_creazione ON notifiche(data_creazione);

-- Verifica tabella creata
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifiche' 
ORDER BY ordinal_position;

-- Test inserimento notifica
INSERT INTO notifiche (tipo, titolo, messaggio, utente_id, priorita) 
VALUES ('nuova_assegnazione', 'Test Notifica', 'Test per verificare funzionamento', 'test-user', 'media');

-- Verifica inserimento
SELECT COUNT(*) as total_notifiche FROM notifiche;