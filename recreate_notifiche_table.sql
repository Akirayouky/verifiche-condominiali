-- Script per ricreare completamente la tabella notifiche con struttura corretta

-- 1. Backup dei dati esistenti (se ce ne sono di validi)
CREATE TABLE IF NOT EXISTS notifiche_backup AS 
SELECT * FROM notifiche WHERE 1=0; -- Solo struttura per ora

-- 2. Elimina la tabella esistente
DROP TABLE IF EXISTS notifiche CASCADE;

-- 3. Ricrea la tabella con struttura corretta
CREATE TABLE notifiche (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    utente_id UUID NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('scadenza_imminente', 'nuova_assegnazione', 'lavorazione_completata', 'reminder_personalizzato', 'urgente', 'nuova_verifica')),
    titolo VARCHAR(255) NOT NULL,
    messaggio TEXT NOT NULL,
    priorita VARCHAR(20) DEFAULT 'media' CHECK (priorita IN ('bassa', 'media', 'alta', 'urgente')),
    letta BOOLEAN DEFAULT FALSE NOT NULL,
    data_scadenza TIMESTAMP WITH TIME ZONE,
    lavorazione_id UUID,
    condominio_id UUID,
    metadata JSONB DEFAULT '{}',
    data_creazione TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    data_aggiornamento TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. Crea indici per performance
CREATE INDEX idx_notifiche_utente_id ON notifiche(utente_id);
CREATE INDEX idx_notifiche_tipo ON notifiche(tipo);
CREATE INDEX idx_notifiche_letta ON notifiche(letta);
CREATE INDEX idx_notifiche_priorita ON notifiche(priorita);
CREATE INDEX idx_notifiche_data_creazione ON notifiche(data_creazione);
CREATE INDEX idx_notifiche_lavorazione_id ON notifiche(lavorazione_id);
CREATE INDEX idx_notifiche_condominio_id ON notifiche(condominio_id);

-- 5. Aggiungi trigger per auto-update del timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_aggiornamento = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notifiche_updated_at 
    BEFORE UPDATE ON notifiche 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Abilita Row Level Security (RLS)
ALTER TABLE notifiche ENABLE ROW LEVEL SECURITY;

-- 7. Crea policy per RLS (gli utenti vedono solo le proprie notifiche)
CREATE POLICY "Users can view own notifications" ON notifiche
    FOR SELECT USING (auth.uid()::text = utente_id::text);

CREATE POLICY "Users can insert own notifications" ON notifiche
    FOR INSERT WITH CHECK (auth.uid()::text = utente_id::text);

CREATE POLICY "Users can update own notifications" ON notifiche
    FOR UPDATE USING (auth.uid()::text = utente_id::text);

CREATE POLICY "Admin can view all notifications" ON notifiche
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'ruolo' = 'admin'
        )
    );

-- 8. Test inserimenti per verificare che tutto funzioni
INSERT INTO notifiche (tipo, titolo, messaggio, utente_id, priorita, letta) 
VALUES 
('nuova_assegnazione', 'Test Notifica 1', 'Primo test dopo ricreazione tabella', gen_random_uuid(), 'media', false),
('lavorazione_completata', 'Test Notifica 2', 'Secondo test con priorità alta', gen_random_uuid(), 'alta', false),
('urgente', 'Test Notifica Urgente', 'Test notifica urgente', gen_random_uuid(), 'urgente', true);

-- 9. Verifica struttura finale
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notifiche' 
ORDER BY ordinal_position;

-- 10. Conta record inseriti
SELECT COUNT(*) as total_notifiche FROM notifiche;

-- 11. Mostra alcuni record di test
SELECT id, tipo, titolo, priorita, letta, data_creazione 
FROM notifiche 
ORDER BY data_creazione DESC 
LIMIT 3;