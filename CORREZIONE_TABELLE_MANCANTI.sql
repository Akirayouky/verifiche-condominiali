-- =====================================================
-- SCRIPT CORREZIONE TABELLE MANCANTI
-- Data: 3 Ottobre 2025
-- Scopo: Aggiungere tabella note_personali e colonna password_changed_at
-- =====================================================

-- 1. CREAZIONE TABELLA NOTE PERSONALI
-- =====================================
CREATE TABLE IF NOT EXISTS public.note_personali (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    utente_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    titolo VARCHAR(255) NOT NULL,
    contenuto TEXT NOT NULL,
    data_creazione TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_modifica TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_note_personali_utente_id ON public.note_personali(utente_id);
CREATE INDEX IF NOT EXISTS idx_note_personali_data_creazione ON public.note_personali(data_creazione DESC);

-- RLS (Row Level Security) per privacy note
ALTER TABLE public.note_personali ENABLE ROW LEVEL SECURITY;

-- Rimuovi policy esistenti se ci sono
DROP POLICY IF EXISTS "Users can view own notes only" ON public.note_personali;
DROP POLICY IF EXISTS "Users can insert own notes only" ON public.note_personali;
DROP POLICY IF EXISTS "Users can update own notes only" ON public.note_personali;
DROP POLICY IF EXISTS "Users can delete own notes only" ON public.note_personali;
DROP POLICY IF EXISTS "Enable all for service role" ON public.note_personali;

-- Policy: permette tutte le operazioni per il service role (API Next.js)
CREATE POLICY "Enable all for service role" ON public.note_personali
    FOR ALL USING (true);

-- 2. AGGIUNTA COLONNA PASSWORD_CHANGED_AT ALLA TABELLA USERS
-- ===========================================================
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP WITH TIME ZONE;

-- Imposta data iniziale per utenti esistenti
UPDATE public.users 
SET password_changed_at = created_at 
WHERE password_changed_at IS NULL;

-- 3. TRIGGER PER AGGIORNAMENTO AUTOMATICO TIMESTAMP
-- =================================================

-- Funzione trigger per updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per note_personali
DROP TRIGGER IF EXISTS update_note_personali_updated_at ON public.note_personali;
CREATE TRIGGER update_note_personali_updated_at 
    BEFORE UPDATE ON public.note_personali 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. INSERIMENTI DI TEST (OPZIONALE)
-- ===================================
/*
-- Esempio di nota di test (decommentare se necessario)
INSERT INTO public.note_personali (utente_id, titolo, contenuto) 
VALUES (
    (SELECT id FROM public.users WHERE username = 'sopralluoghista1' LIMIT 1),
    'Nota di Test',
    'Questa è una nota di test per verificare il funzionamento del sistema.'
) ON CONFLICT DO NOTHING;
*/

-- 5. VERIFICA CREAZIONE TABELLE
-- ==============================
DO $$
BEGIN
    -- Verifica tabella note_personali
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'note_personali') THEN
        RAISE NOTICE '✅ Tabella note_personali creata con successo';
    ELSE
        RAISE EXCEPTION '❌ Errore: Tabella note_personali non creata';
    END IF;
    
    -- Verifica colonna password_changed_at
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_changed_at') THEN
        RAISE NOTICE '✅ Colonna password_changed_at aggiunta con successo';
    ELSE
        RAISE EXCEPTION '❌ Errore: Colonna password_changed_at non aggiunta';
    END IF;
    
    RAISE NOTICE '🎉 SCRIPT COMPLETATO CON SUCCESSO!';
END $$;