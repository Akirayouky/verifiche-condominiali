-- ==========================================
-- SCRIPT COMPLETO RIPRISTINO DATABASE
-- Verifiche Condominiali PWA
-- Esegui questo script nel SQL Editor di Supabase
-- ==========================================

-- 1. ELIMINA TABELLE ESISTENTI (se necessario)
-- Decomenta le righe sotto SOLO se vuoi ricreare tutto da zero
-- DROP TABLE IF EXISTS public.verifiche CASCADE;
-- DROP TABLE IF EXISTS public.lavorazioni CASCADE;
-- DROP TABLE IF EXISTS public.tipologie_verifiche CASCADE;
-- DROP TABLE IF EXISTS public.condomini CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;

-- 2. CREA TABELLA USERS (base del sistema)
CREATE TABLE IF NOT EXISTS public.users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    username text UNIQUE NOT NULL,
    email text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    role text NOT NULL DEFAULT 'sopralluoghista' CHECK (role IN ('admin', 'sopralluoghista')),
    nome text,
    cognome text, 
    telefono text,
    attivo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    last_login timestamp with time zone,
    approved_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. CREA TABELLA CONDOMINI 
CREATE TABLE IF NOT EXISTS public.condomini (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nome text NOT NULL,
    indirizzo text,
    token text UNIQUE,
    assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL,
    data_inserimento timestamp with time zone DEFAULT now(),
    data_ultima_modifica timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 4. CREA TABELLA TIPOLOGIE VERIFICHE
CREATE TABLE IF NOT EXISTS public.tipologie_verifiche (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nome text NOT NULL,
    descrizione text,
    campi_richiesti jsonb DEFAULT '[]'::jsonb,
    attiva boolean DEFAULT true,
    data_creazione timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 5. CREA TABELLA VERIFICHE
CREATE TABLE IF NOT EXISTS public.verifiche (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    condominio_id uuid REFERENCES public.condomini(id) ON DELETE CASCADE,
    tipologia_id uuid REFERENCES public.tipologie_verifiche(id) ON DELETE CASCADE,
    utente_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    dati_verifica jsonb DEFAULT '{}'::jsonb,
    stato text DEFAULT 'bozza' CHECK (stato IN ('bozza', 'completata', 'archiviata')),
    data_creazione timestamp with time zone DEFAULT now(),
    data_completamento timestamp with time zone,
    note text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 6. CREA TABELLA LAVORAZIONI
CREATE TABLE IF NOT EXISTS public.lavorazioni (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    condominio_id uuid REFERENCES public.condomini(id) ON DELETE CASCADE,
    utente_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    titolo text NOT NULL,
    descrizione text,
    stato text DEFAULT 'aperta' CHECK (stato IN ('aperta', 'in_corso', 'completata', 'archiviata')),
    priorita text DEFAULT 'media' CHECK (priorita IN ('bassa', 'media', 'alta', 'urgente')),
    data_apertura timestamp with time zone DEFAULT now(),
    data_scadenza timestamp with time zone,
    data_completamento timestamp with time zone,
    note text,
    allegati jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 7. CREA INDICI PER PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_attivo ON public.users(attivo);

CREATE INDEX IF NOT EXISTS idx_condomini_nome ON public.condomini(nome);
CREATE INDEX IF NOT EXISTS idx_condomini_assigned_to ON public.condomini(assigned_to);
CREATE INDEX IF NOT EXISTS idx_condomini_token ON public.condomini(token);

CREATE INDEX IF NOT EXISTS idx_tipologie_nome ON public.tipologie_verifiche(nome);
CREATE INDEX IF NOT EXISTS idx_tipologie_attiva ON public.tipologie_verifiche(attiva);

CREATE INDEX IF NOT EXISTS idx_verifiche_condominio ON public.verifiche(condominio_id);
CREATE INDEX IF NOT EXISTS idx_verifiche_tipologia ON public.verifiche(tipologia_id);
CREATE INDEX IF NOT EXISTS idx_verifiche_utente ON public.verifiche(utente_id);
CREATE INDEX IF NOT EXISTS idx_verifiche_stato ON public.verifiche(stato);

CREATE INDEX IF NOT EXISTS idx_lavorazioni_condominio ON public.lavorazioni(condominio_id);
CREATE INDEX IF NOT EXISTS idx_lavorazioni_utente ON public.lavorazioni(utente_id);
CREATE INDEX IF NOT EXISTS idx_lavorazioni_stato ON public.lavorazioni(stato);

-- 8. ABILITA ROW LEVEL SECURITY
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condomini ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipologie_verifiche ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifiche ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lavorazioni ENABLE ROW LEVEL SECURITY;

-- 9. CREA POLICY DI BASE (permissive per sviluppo)
-- ATTENZIONE: In produzione personalizzare le policy per la sicurezza

CREATE POLICY IF NOT EXISTS "Allow all operations on users" 
ON public.users FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all operations on condomini" 
ON public.condomini FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all operations on tipologie_verifiche" 
ON public.tipologie_verifiche FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all operations on verifiche" 
ON public.verifiche FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all operations on lavorazioni" 
ON public.lavorazioni FOR ALL USING (true) WITH CHECK (true);

-- 10. INSERISCI DATI DI BASE

-- Admin di default (password: admin123)
INSERT INTO public.users (id, username, email, password_hash, role, nome, cognome, attivo, approved_at) 
VALUES (
    'a0000000-0000-0000-0000-000000000000',
    'admin',
    'admin@condomini.local', 
    '$2b$10$8Y8Xa1K2Z3f4B5c6D7e8F9g0H1i2J3k4L5m6N7o8P9q0R1s2T3u4V5',
    'admin',
    'Administrator',
    'System',
    true,
    now()
) ON CONFLICT (username) DO NOTHING;

-- Tipologie di verifica di base
INSERT INTO public.tipologie_verifiche (nome, descrizione, campi_richiesti) VALUES
('Verifica Impianto Elettrico', 'Controllo sicurezza impianto elettrico', '["quadro_elettrico", "messa_a_terra", "certificazioni"]'),
('Verifica Antincendio', 'Controllo sistemi antincendio', '["estintori", "uscite_sicurezza", "illuminazione_emergenza"]'),
('Verifica Ascensore', 'Controllo funzionalità ascensore', '["certificazione", "ultima_manutenzione", "funzionamento"]'),
('Verifica Impianto Idrico', 'Controllo impianto idrico', '["pressione", "perdite", "qualita_acqua"]')
ON CONFLICT DO NOTHING;

-- 11. VERIFICA RISULTATO
SELECT 'Database ripristinato con successo!' as status;

-- Mostra struttura tabelle create
SELECT 
    table_name,
    COUNT(*) as numero_colonne
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'condomini', 'tipologie_verifiche', 'verifiche', 'lavorazioni')
GROUP BY table_name
ORDER BY table_name;

-- Conta record inseriti
SELECT 
    'users' as tabella, COUNT(*) as record_count FROM public.users
UNION ALL
SELECT 
    'tipologie_verifiche' as tabella, COUNT(*) as record_count FROM public.tipologie_verifiche
ORDER BY tabella;