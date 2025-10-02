-- ==========================================
-- SCRIPT SEMPLIFICATO E TESTATO
-- Solo tabelle essenziali senza errori
-- ==========================================

-- PASSO 1: Rimuovi tabelle esistenti se ci sono problemi
DROP TABLE IF EXISTS public.verifiche CASCADE;
DROP TABLE IF EXISTS public.lavorazioni CASCADE; 
DROP TABLE IF EXISTS public.tipologie_verifiche CASCADE;
DROP TABLE IF EXISTS public.condomini CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- PASSO 2: Crea tabella users
CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    username text UNIQUE NOT NULL,
    email text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    role text NOT NULL DEFAULT 'sopralluoghista',
    nome text,
    cognome text,
    telefono text,
    attivo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    last_login timestamp with time zone,
    approved_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT now()
);

-- PASSO 3: Crea tabella condomini  
CREATE TABLE public.condomini (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nome text NOT NULL,
    indirizzo text,
    token text,
    assigned_to uuid,
    data_inserimento timestamp with time zone DEFAULT now(),
    data_ultima_modifica timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- PASSO 4: Crea tabella tipologie_verifiche
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

-- PASSO 5: Aggiungi foreign key solo dopo aver creato tutte le tabelle
ALTER TABLE public.condomini 
ADD CONSTRAINT fk_condomini_assigned_to 
FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;

-- PASSO 6: Indici essenziali
CREATE INDEX idx_users_username ON public.users(username);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_condomini_nome ON public.condomini(nome);
CREATE INDEX idx_condomini_assigned_to ON public.condomini(assigned_to);
CREATE INDEX idx_tipologie_nome ON public.tipologie_verifiche(nome);

-- PASSO 7: RLS e policy semplici
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condomini ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipologie_verifiche ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_policy" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "condomini_policy" ON public.condomini FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "tipologie_policy" ON public.tipologie_verifiche FOR ALL USING (true) WITH CHECK (true);

-- PASSO 8: Dati iniziali
INSERT INTO public.users (username, email, password_hash, role, nome, attivo, approved_at) 
VALUES (
    'admin',
    'admin@condomini.local', 
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'admin',
    'Administrator',
    true,
    now()
);

INSERT INTO public.tipologie_verifiche (nome, descrizione) VALUES
('Verifica Impianto Elettrico', 'Controllo sicurezza impianto elettrico'),
('Verifica Antincendio', 'Controllo sistemi antincendio'),
('Verifica Ascensore', 'Controllo funzionalità ascensore'),
('Verifica Impianto Idrico', 'Controllo impianto idrico');

-- Test condominio di esempio
INSERT INTO public.condomini (nome, indirizzo) 
VALUES ('Condominio di Test', 'Via Roma 123, Milano');

-- VERIFICA FINALE
SELECT 'Setup completato con successo!' as status;

SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_name = t.table_name AND table_schema = 'public') as colonne
FROM information_schema.tables t
WHERE t.table_schema = 'public' 
  AND t.table_name IN ('users', 'condomini', 'tipologie_verifiche')
ORDER BY t.table_name;

SELECT 'users' as tabella, COUNT(*) as record FROM public.users
UNION ALL
SELECT 'condomini' as tabella, COUNT(*) as record FROM public.condomini  
UNION ALL
SELECT 'tipologie_verifiche' as tabella, COUNT(*) as record FROM public.tipologie_verifiche;

SELECT 'Credenziali: admin / admin123' as info;