-- Script per creare la tabella condomini base
-- Esegui questo nel SQL Editor di Supabase se la tabella non esiste

-- Verifica se la tabella esiste
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'condomini';

-- Se la query sopra non restituisce risultati, esegui il CREATE TABLE:

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

-- Aggiungi indici per performance
CREATE INDEX IF NOT EXISTS idx_condomini_nome ON public.condomini(nome);
CREATE INDEX IF NOT EXISTS idx_condomini_assigned_to ON public.condomini(assigned_to);
CREATE INDEX IF NOT EXISTS idx_condomini_token ON public.condomini(token);

-- Abilita RLS (Row Level Security) se necessario
ALTER TABLE public.condomini ENABLE ROW LEVEL SECURITY;

-- Policy di base per permettere tutto (modificare secondo necessità)
CREATE POLICY IF NOT EXISTS "Allow all operations on condomini" 
ON public.condomini FOR ALL USING (true) WITH CHECK (true);

-- Verifica che la tabella sia stata creata
SELECT 
    table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'condomini' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Tabella condomini creata con successo!' as status;