-- ==========================================
-- SCRIPT RIPRISTINO DATABASE - VERSIONE SICURA
-- Gestisce errori e situazioni esistenti
-- ==========================================

-- Wrapper per gestire errori
DO $$
BEGIN
    -- 1. CREA TABELLA USERS se non esiste
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        CREATE TABLE public.users (
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
        RAISE NOTICE 'Tabella users creata';
    ELSE
        RAISE NOTICE 'Tabella users già esistente';
    END IF;

    -- 2. CREA TABELLA CONDOMINI se non esiste
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'condomini' AND table_schema = 'public') THEN
        CREATE TABLE public.condomini (
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
        RAISE NOTICE 'Tabella condomini creata';
    ELSE
        RAISE NOTICE 'Tabella condomini già esistente';
    END IF;

    -- 3. CREA TABELLA TIPOLOGIE_VERIFICHE se non esiste
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tipologie_verifiche' AND table_schema = 'public') THEN
        CREATE TABLE public.tipologie_verifiche (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            nome text NOT NULL,
            descrizione text,
            campi_richiesti jsonb DEFAULT '[]'::jsonb,
            attiva boolean DEFAULT true,
            data_creazione timestamp with time zone DEFAULT now(),
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now()
        );
        RAISE NOTICE 'Tabella tipologie_verifiche creata';
    ELSE
        RAISE NOTICE 'Tabella tipologie_verifiche già esistente';
    END IF;

    -- 4. CREA TABELLA VERIFICHE se non esiste
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'verifiche' AND table_schema = 'public') THEN
        CREATE TABLE public.verifiche (
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
        RAISE NOTICE 'Tabella verifiche creata';
    ELSE
        RAISE NOTICE 'Tabella verifiche già esistente';
    END IF;

    -- 5. CREA TABELLA LAVORAZIONI se non esiste
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'lavorazioni' AND table_schema = 'public') THEN
        CREATE TABLE public.lavorazioni (
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
        RAISE NOTICE 'Tabella lavorazioni creata';
    ELSE
        RAISE NOTICE 'Tabella lavorazioni già esistente';
    END IF;

END $$;

-- Crea indici (sicuri con IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_attivo ON public.users(attivo);

CREATE INDEX IF NOT EXISTS idx_condomini_nome ON public.condomini(nome);
CREATE INDEX IF NOT EXISTS idx_condomini_assigned_to ON public.condomini(assigned_to);
CREATE INDEX IF NOT EXISTS idx_condomini_token ON public.condomini(token);

CREATE INDEX IF NOT EXISTS idx_tipologie_nome ON public.tipologie_verifiche(nome);
CREATE INDEX IF NOT EXISTS idx_tipologie_attiva ON public.tipologie_verifiche(attiva);

-- Abilita RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condomini ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipologie_verifiche ENABLE ROW LEVEL SECURITY;

-- Gestione policy con controllo errori
DO $$
BEGIN
    -- Policy per users
    BEGIN
        DROP POLICY IF EXISTS "Allow all operations on users" ON public.users;
        CREATE POLICY "Allow all operations on users" ON public.users FOR ALL USING (true) WITH CHECK (true);
        RAISE NOTICE 'Policy users creata';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Errore creazione policy users: %', SQLERRM;
    END;

    -- Policy per condomini
    BEGIN
        DROP POLICY IF EXISTS "Allow all operations on condomini" ON public.condomini;
        CREATE POLICY "Allow all operations on condomini" ON public.condomini FOR ALL USING (true) WITH CHECK (true);
        RAISE NOTICE 'Policy condomini creata';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Errore creazione policy condomini: %', SQLERRM;
    END;

    -- Policy per tipologie_verifiche
    BEGIN
        DROP POLICY IF EXISTS "Allow all operations on tipologie_verifiche" ON public.tipologie_verifiche;
        CREATE POLICY "Allow all operations on tipologie_verifiche" ON public.tipologie_verifiche FOR ALL USING (true) WITH CHECK (true);
        RAISE NOTICE 'Policy tipologie_verifiche creata';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Errore creazione policy tipologie_verifiche: %', SQLERRM;
    END;
END $$;

-- Inserisci dati di base solo se non esistono
INSERT INTO public.users (id, username, email, password_hash, role, nome, cognome, attivo, approved_at) 
VALUES (
    'a0000000-0000-0000-0000-000000000000',
    'admin',
    'admin@condomini.local', 
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'admin',
    'Administrator',
    'System',
    true,
    now()
) ON CONFLICT (username) DO NOTHING;

-- Tipologie di base
INSERT INTO public.tipologie_verifiche (nome, descrizione, campi_richiesti) VALUES
('Verifica Impianto Elettrico', 'Controllo sicurezza impianto elettrico', '["quadro_elettrico", "messa_a_terra", "certificazioni"]'),
('Verifica Antincendio', 'Controllo sistemi antincendio', '["estintori", "uscite_sicurezza", "illuminazione_emergenza"]'),
('Verifica Ascensore', 'Controllo funzionalità ascensore', '["certificazione", "ultima_manutenzione", "funzionamento"]'),
('Verifica Impianto Idrico', 'Controllo impianto idrico', '["pressione", "perdite", "qualita_acqua"]')
ON CONFLICT (nome) DO NOTHING;

-- Verifica finale
SELECT 'Database ripristinato con successo!' as status;

SELECT 
    table_name,
    COUNT(*) as numero_colonne
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'condomini', 'tipologie_verifiche', 'verifiche', 'lavorazioni')
GROUP BY table_name
ORDER BY table_name;