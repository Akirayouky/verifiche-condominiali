-- Setup completo database Supabase per Verifiche Condominiali
-- Data: 2 ottobre 2025

-- 1. Tabella USERS (già creata, ma ricreamo per sicurezza)
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'sopralluoghista' CHECK (role IN ('admin', 'sopralluoghista')),
    approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabella CONDOMINI
DROP TABLE IF EXISTS condomini CASCADE;
CREATE TABLE condomini (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    denominazione VARCHAR(255) NOT NULL,
    indirizzo VARCHAR(255) NOT NULL,
    citta VARCHAR(100) NOT NULL,
    cap VARCHAR(10),
    provincia VARCHAR(5),
    codice_fiscale VARCHAR(16),
    partita_iva VARCHAR(11),
    telefono VARCHAR(20),
    email VARCHAR(100),
    amministratore VARCHAR(255),
    telefono_amministratore VARCHAR(20),
    email_amministratore VARCHAR(100),
    note TEXT,
    data_inserimento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_modifica TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    attivo BOOLEAN DEFAULT true
);

-- 3. Tabella TIPOLOGIE VERIFICHE
DROP TABLE IF EXISTS tipologie_verifiche CASCADE;
CREATE TABLE tipologie_verifiche (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descrizione TEXT,
    categoria VARCHAR(100),
    normativa VARCHAR(255),
    frequenza_mesi INTEGER,
    obbligatoria BOOLEAN DEFAULT false,
    attiva BOOLEAN DEFAULT true,
    data_creazione TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_modifica TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabella VERIFICHE
DROP TABLE IF EXISTS verifiche CASCADE;
CREATE TABLE verifiche (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    condominio_id UUID REFERENCES condomini(id) ON DELETE CASCADE,
    tipologia_id UUID REFERENCES tipologie_verifiche(id) ON DELETE CASCADE,
    data_programmata DATE,
    data_esecuzione DATE,
    stato VARCHAR(20) DEFAULT 'programmata' CHECK (stato IN ('programmata', 'in_corso', 'completata', 'annullata')),
    tecnico_responsabile VARCHAR(255),
    risultato VARCHAR(20) CHECK (risultato IN ('conforme', 'non_conforme', 'da_verificare')),
    note TEXT,
    documenti_allegati JSONB DEFAULT '[]',
    data_creazione TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_modifica TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabella LAVORAZIONI (principale)
DROP TABLE IF EXISTS lavorazioni CASCADE;
CREATE TABLE lavorazioni (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    condominio_id UUID REFERENCES condomini(id) ON DELETE CASCADE,
    tipologia_verifica_id UUID REFERENCES tipologie_verifiche(id) ON DELETE CASCADE,
    sopralluoghista_id UUID REFERENCES users(id) ON DELETE SET NULL,
    stato VARCHAR(20) DEFAULT 'aperta' CHECK (stato IN ('aperta', 'in_corso', 'completata', 'chiusa')),
    data_apertura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_chiusura TIMESTAMP WITH TIME ZONE,
    data_sopralluogo DATE,
    risultato VARCHAR(20) CHECK (risultato IN ('conforme', 'non_conforme', 'da_verificare')),
    note TEXT,
    report JSONB DEFAULT '{}',
    documenti JSONB DEFAULT '[]',
    email_inviata BOOLEAN DEFAULT false,
    data_modifica TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INSERIMENTO DATI DI BASE

-- 1. Utente Amministratore (password: admin123)
INSERT INTO users (username, email, password_hash, role, approved) 
VALUES ('admin', 'admin@verifiche.com', '$2b$12$8J4L1xGQ2jHfPn0K9mVg.eeZ8kXHqVvWzJ2vN3vGfOlM5qRnPcDeK', 'admin', true)
ON CONFLICT (username) DO NOTHING;

-- 2. Condomini di esempio
INSERT INTO condomini (denominazione, indirizzo, citta, cap, provincia, email, amministratore) VALUES
('Condominio Rossi', 'Via Roma 123', 'Milano', '20100', 'MI', 'amministratore@condominiorossi.it', 'Mario Rossi'),
('Condominio Verdi', 'Via Garibaldi 45', 'Roma', '00100', 'RM', 'info@condominioverdi.it', 'Giuseppe Verdi'),
('Residence Bianchi', 'Corso Italia 78', 'Torino', '10100', 'TO', 'gestione@residencebianchi.it', 'Anna Bianchi')
ON CONFLICT DO NOTHING;

-- 3. Tipologie di verifica standard
INSERT INTO tipologie_verifiche (nome, descrizione, categoria, frequenza_mesi, obbligatoria) VALUES
('Ascensori', 'Verifica semestrale degli impianti di sollevamento', 'Sicurezza', 6, true),
('Antincendio', 'Controllo sistemi di prevenzione incendi', 'Sicurezza', 12, true),
('Caldaie e Termici', 'Manutenzione impianti di riscaldamento', 'Energia', 12, true),
('Elettrici', 'Verifica impianti elettrici condominiali', 'Sicurezza', 24, true),
('Idraulici', 'Controllo impianti idrici e scarichi', 'Manutenzione', 12, false),
('Strutturali', 'Ispezione strutture e facciate', 'Sicurezza', 36, false)
ON CONFLICT DO NOTHING;

-- CONFIGURAZIONE RLS (Row Level Security)

-- Abilita RLS su tutte le tabelle
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE condomini ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipologie_verifiche ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifiche ENABLE ROW LEVEL SECURITY;
ALTER TABLE lavorazioni ENABLE ROW LEVEL SECURITY;

-- Policy per USERS (solo admin può vedere tutti, sopralluoghisti solo se stessi)
DROP POLICY IF EXISTS "Users full access for admin" ON users;
CREATE POLICY "Users full access for admin" ON users FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = auth.uid() AND u.role = 'admin' AND u.approved = true
    )
);

DROP POLICY IF EXISTS "Users can view self" ON users;
CREATE POLICY "Users can view self" ON users FOR SELECT
USING (id = auth.uid() OR role = 'admin');

-- Policy per CONDOMINI (lettura per tutti gli utenti approvati)
DROP POLICY IF EXISTS "Condomini read for approved users" ON condomini;
CREATE POLICY "Condomini read for approved users" ON condomini FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = auth.uid() AND u.approved = true
    )
);

DROP POLICY IF EXISTS "Condomini write for admin" ON condomini;
CREATE POLICY "Condomini write for admin" ON condomini FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = auth.uid() AND u.role = 'admin' AND u.approved = true
    )
);

-- Policy per TIPOLOGIE_VERIFICHE (lettura tutti, scrittura admin)
DROP POLICY IF EXISTS "Tipologie read all approved" ON tipologie_verifiche;
CREATE POLICY "Tipologie read all approved" ON tipologie_verifiche FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = auth.uid() AND u.approved = true
    )
);

DROP POLICY IF EXISTS "Tipologie write admin" ON tipologie_verifiche;
CREATE POLICY "Tipologie write admin" ON tipologie_verifiche FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = auth.uid() AND u.role = 'admin' AND u.approved = true
    )
);

-- Policy per VERIFICHE (lettura tutti approvati, scrittura proprie lavorazioni)
DROP POLICY IF EXISTS "Verifiche read approved" ON verifiche;
CREATE POLICY "Verifiche read approved" ON verifiche FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = auth.uid() AND u.approved = true
    )
);

DROP POLICY IF EXISTS "Verifiche write own or admin" ON verifiche;
CREATE POLICY "Verifiche write own or admin" ON verifiche FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = auth.uid() AND (
            u.role = 'admin' OR 
            id IN (SELECT sopralluoghista_id FROM lavorazioni WHERE id = verifiche.id)
        ) AND u.approved = true
    )
);

-- Policy per LAVORAZIONI (lettura tutti approvati, scrittura proprie o admin)
DROP POLICY IF EXISTS "Lavorazioni read approved" ON lavorazioni;
CREATE POLICY "Lavorazioni read approved" ON lavorazioni FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = auth.uid() AND u.approved = true
    )
);

DROP POLICY IF EXISTS "Lavorazioni write own or admin" ON lavorazioni;
CREATE POLICY "Lavorazioni write own or admin" ON lavorazioni FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = auth.uid() AND (
            u.role = 'admin' OR 
            u.id = sopralluoghista_id
        ) AND u.approved = true
    )
);

-- FUNZIONI DI UTILITÀ

-- Funzione per aggiornare data_modifica automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_modifica = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per aggiornamento automatico data_modifica
DROP TRIGGER IF EXISTS update_condomini_updated_at ON condomini;
CREATE TRIGGER update_condomini_updated_at BEFORE UPDATE ON condomini FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_tipologie_updated_at ON tipologie_verifiche;
CREATE TRIGGER update_tipologie_updated_at BEFORE UPDATE ON tipologie_verifiche FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_verifiche_updated_at ON verifiche;
CREATE TRIGGER update_verifiche_updated_at BEFORE UPDATE ON verifiche FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_lavorazioni_updated_at ON lavorazioni;
CREATE TRIGGER update_lavorazioni_updated_at BEFORE UPDATE ON lavorazioni FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- STATISTICHE E VISTE UTILI

-- Vista per statistiche dashboard
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM condomini WHERE attivo = true) as condomini_attivi,
    (SELECT COUNT(*) FROM lavorazioni WHERE stato = 'aperta') as lavorazioni_aperte,
    (SELECT COUNT(*) FROM lavorazioni WHERE stato = 'completata') as lavorazioni_completate,
    (SELECT COUNT(*) FROM users WHERE role = 'sopralluoghista' AND approved = true) as sopralluoghisti_attivi,
    (SELECT COUNT(*) FROM tipologie_verifiche WHERE attiva = true) as tipologie_attive;

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_lavorazioni_stato ON lavorazioni(stato);
CREATE INDEX IF NOT EXISTS idx_lavorazioni_condominio ON lavorazioni(condominio_id);
CREATE INDEX IF NOT EXISTS idx_lavorazioni_sopralluoghista ON lavorazioni(sopralluoghista_id);
CREATE INDEX IF NOT EXISTS idx_verifiche_condominio ON verifiche(condominio_id);
CREATE INDEX IF NOT EXISTS idx_condomini_attivo ON condomini(attivo);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role, approved);

-- Setup completato!
SELECT 'Database Supabase configurato con successo!' as messaggio;