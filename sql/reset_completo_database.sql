-- ==========================================
-- RESET COMPLETO DATABASE - TABULA RASA
-- Cancella TUTTO e ricrea da zero
-- ==========================================

-- ⚠️  ATTENZIONE: Questo script cancella TUTTI i dati!
-- Usare solo per sviluppo o reset completo

-- STEP 1: ELIMINA TUTTE LE TABELLE ESISTENTI
-- Forza eliminazione di tutte le tabelle correlate al progetto

DROP TABLE IF EXISTS public.verifiche CASCADE;
DROP TABLE IF EXISTS public.lavorazioni CASCADE;
DROP TABLE IF EXISTS public.tipologie_verifiche CASCADE;
DROP TABLE IF EXISTS public.condomini CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Elimina eventuali altre tabelle di sistema che potrebbero esistere
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.audit_log CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;

-- STEP 2: ELIMINA TUTTE LE POLICY RLS ESISTENTI
-- Non serve specificare nome tabella perché le tabelle sono già cancellate

-- STEP 3: CREA TUTTE LE TABELLE DA ZERO

-- Tabella USERS (base di tutto)
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
    created_at timestamptz DEFAULT now(),
    last_login timestamptz,
    approved_at timestamptz,
    updated_at timestamptz DEFAULT now()
);

-- Tabella CONDOMINI
CREATE TABLE public.condomini (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nome text NOT NULL,
    indirizzo text,
    token text UNIQUE,
    assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL,
    data_inserimento timestamptz DEFAULT now(),
    data_ultima_modifica timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabella TIPOLOGIE VERIFICHE
CREATE TABLE public.tipologie_verifiche (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nome text UNIQUE NOT NULL,
    descrizione text,
    campi_richiesti jsonb DEFAULT '[]'::jsonb,
    attiva boolean DEFAULT true,
    data_creazione timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabella VERIFICHE
CREATE TABLE public.verifiche (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    condominio_id uuid NOT NULL REFERENCES public.condomini(id) ON DELETE CASCADE,
    tipologia_id uuid NOT NULL REFERENCES public.tipologie_verifiche(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    dati_verifica jsonb DEFAULT '{}'::jsonb,
    stato text DEFAULT 'bozza' CHECK (stato IN ('bozza', 'completata', 'archiviata')),
    data_creazione timestamptz DEFAULT now(),
    data_completamento timestamptz,
    note text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Tabella LAVORAZIONI
CREATE TABLE public.lavorazioni (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    condominio_id uuid NOT NULL REFERENCES public.condomini(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    titolo text NOT NULL,
    descrizione text,
    stato text DEFAULT 'aperta' CHECK (stato IN ('aperta', 'in_corso', 'completata', 'archiviata')),
    priorita text DEFAULT 'media' CHECK (priorita IN ('bassa', 'media', 'alta', 'urgente')),
    data_apertura timestamptz DEFAULT now(),
    data_scadenza timestamptz,
    data_completamento timestamptz,
    note text,
    allegati jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- STEP 4: CREA TUTTI GLI INDICI
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_attivo ON public.users(attivo);
CREATE INDEX idx_users_approved_at ON public.users(approved_at);

CREATE INDEX idx_condomini_nome ON public.condomini(nome);
CREATE INDEX idx_condomini_assigned_to ON public.condomini(assigned_to);
CREATE INDEX idx_condomini_token ON public.condomini(token);

CREATE INDEX idx_tipologie_nome ON public.tipologie_verifiche(nome);
CREATE INDEX idx_tipologie_attiva ON public.tipologie_verifiche(attiva);

CREATE INDEX idx_verifiche_condominio_id ON public.verifiche(condominio_id);
CREATE INDEX idx_verifiche_tipologia_id ON public.verifiche(tipologia_id);
CREATE INDEX idx_verifiche_user_id ON public.verifiche(user_id);
CREATE INDEX idx_verifiche_stato ON public.verifiche(stato);

CREATE INDEX idx_lavorazioni_condominio_id ON public.lavorazioni(condominio_id);
CREATE INDEX idx_lavorazioni_user_id ON public.lavorazioni(user_id);
CREATE INDEX idx_lavorazioni_stato ON public.lavorazioni(stato);
CREATE INDEX idx_lavorazioni_priorita ON public.lavorazioni(priorita);

-- STEP 5: ABILITA ROW LEVEL SECURITY
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condomini ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipologie_verifiche ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifiche ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lavorazioni ENABLE ROW LEVEL SECURITY;

-- STEP 6: CREA POLICY PERMISSIVE (per sviluppo)
CREATE POLICY "allow_all_users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_condomini" ON public.condomini FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_tipologie" ON public.tipologie_verifiche FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_verifiche" ON public.verifiche FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_lavorazioni" ON public.lavorazioni FOR ALL USING (true) WITH CHECK (true);

-- STEP 7: INSERISCI DATI INIZIALI

-- Admin principale (password: admin123)
INSERT INTO public.users (
    id, 
    username, 
    email, 
    password_hash, 
    role, 
    nome, 
    cognome, 
    attivo, 
    approved_at
) VALUES (
    'a0000000-0000-0000-0000-000000000000',
    'admin',
    'admin@condomini.local',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- admin123
    'admin',
    'Administrator',
    'System',
    true,
    now()
);

-- Tipologie di verifica standard
INSERT INTO public.tipologie_verifiche (nome, descrizione, campi_richiesti) VALUES
('Verifica Impianto Elettrico', 'Controllo sicurezza impianto elettrico', '["quadro_elettrico", "messa_a_terra", "certificazioni"]'),
('Verifica Antincendio', 'Controllo sistemi antincendio', '["estintori", "uscite_sicurezza", "illuminazione_emergenza"]'),
('Verifica Ascensore', 'Controllo funzionalità ascensore', '["certificazione", "ultima_manutenzione", "funzionamento"]'),
('Verifica Impianto Idrico', 'Controllo impianto idrico', '["pressione", "perdite", "qualita_acqua"]'),
('Verifica Caldaia', 'Controllo impianto termico', '["efficienza", "sicurezza", "emissioni"]'),
('Verifica Balconi', 'Controllo strutturale balconi', '["stato_conservazione", "sicurezza_ringhiere", "impermeabilizzazione"]');

-- Condomini di esempio per test
INSERT INTO public.condomini (nome, indirizzo, token) VALUES
('Condominio Villa Rosa', 'Via Roma 15, Milano', 'cond_villa_rosa_2024'),
('Residence Le Palme', 'Corso Italia 88, Roma', 'cond_le_palme_2024'),
('Condominio Bellavista', 'Via Garibaldi 42, Torino', 'cond_bellavista_2024');

-- STEP 8: VERIFICA FINALE
SELECT '🎉 DATABASE COMPLETAMENTE RIPRISTINATO!' as status;

-- Statistiche finali
SELECT 
    'TABELLE CREATE' as info,
    COUNT(*) as totale
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'condomini', 'tipologie_verifiche', 'verifiche', 'lavorazioni');

SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as colonne
FROM information_schema.tables t
WHERE t.table_schema = 'public' 
  AND t.table_name IN ('users', 'condomini', 'tipologie_verifiche', 'verifiche', 'lavorazioni')
ORDER BY t.table_name;

-- Conta dati inseriti
SELECT 'DATI INSERITI' as info, '' as dettaglio
UNION ALL
SELECT 'Users', CAST(COUNT(*) as text) FROM public.users
UNION ALL  
SELECT 'Condomini', CAST(COUNT(*) as text) FROM public.condomini
UNION ALL
SELECT 'Tipologie Verifiche', CAST(COUNT(*) as text) FROM public.tipologie_verifiche;

SELECT '🔑 CREDENZIALI ADMIN' as info;
SELECT 'Username: admin' as credenziali;
SELECT 'Password: admin123' as password;
SELECT '📧 Email: admin@condomini.local' as email;

SELECT '✅ Tutto pronto! Il server Next.js dovrebbe funzionare ora.' as finale;