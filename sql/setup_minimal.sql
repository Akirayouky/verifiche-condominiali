-- ==========================================
-- SCRIPT MINIMAL - SOLO TABELLE ESSENZIALI
-- Per test veloce e risoluzione immediata
-- ==========================================

-- 1. Solo tabella users e condomini (essenziali)
CREATE TABLE IF NOT EXISTS public.users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    username text UNIQUE NOT NULL,
    email text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    role text NOT NULL DEFAULT 'sopralluoghista',
    nome text,
    cognome text,
    attivo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    last_login timestamp with time zone,
    approved_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.condomini (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nome text NOT NULL,
    indirizzo text,
    token text,
    assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL,
    data_inserimento timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

-- 2. RLS semplice
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condomini ENABLE ROW LEVEL SECURITY;

-- 3. Policy permissive
DROP POLICY IF EXISTS "Allow all on users" ON public.users;
DROP POLICY IF EXISTS "Allow all on condomini" ON public.condomini;

CREATE POLICY "Allow all on users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on condomini" ON public.condomini FOR ALL USING (true) WITH CHECK (true);

-- 4. Admin di base (password: admin123)
INSERT INTO public.users (username, email, password_hash, role, nome, attivo, approved_at) 
VALUES (
    'admin',
    'admin@condomini.local', 
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'admin',
    'Administrator',
    true,
    now()
) ON CONFLICT (username) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    approved_at = EXCLUDED.approved_at;

-- 5. Test condominio
INSERT INTO public.condomini (nome, indirizzo) 
VALUES ('Condominio Test', 'Via Test 123')
ON CONFLICT DO NOTHING;

-- Verifica
SELECT 'Setup minimal completato!' as status;
SELECT COUNT(*) as users_count FROM public.users;
SELECT COUNT(*) as condomini_count FROM public.condomini;