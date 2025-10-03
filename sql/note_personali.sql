-- Creazione tabella note_personali
-- Ogni sopralluoghista può creare note personali non legate a lavorazioni specifiche

CREATE TABLE IF NOT EXISTS public.note_personali (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    utente_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    titolo VARCHAR(255) NOT NULL,
    contenuto TEXT NOT NULL,
    data_creazione TIMESTAMPTZ DEFAULT NOW(),
    data_modifica TIMESTAMPTZ DEFAULT NOW()
);

-- Indici per migliorare le performance
CREATE INDEX IF NOT EXISTS idx_note_personali_utente_id ON public.note_personali(utente_id);
CREATE INDEX IF NOT EXISTS idx_note_personali_data_creazione ON public.note_personali(data_creazione);

-- Politiche RLS (Row Level Security) - solo l'utente proprietario può vedere le proprie note
ALTER TABLE public.note_personali ENABLE ROW LEVEL SECURITY;

-- Policy: Utenti possono vedere solo le proprie note
CREATE POLICY "Utenti possono vedere solo le proprie note" ON public.note_personali
    FOR SELECT USING (auth.uid()::text = utente_id::text);

-- Policy: Utenti possono creare solo le proprie note  
CREATE POLICY "Utenti possono creare solo le proprie note" ON public.note_personali
    FOR INSERT WITH CHECK (auth.uid()::text = utente_id::text);

-- Policy: Utenti possono modificare solo le proprie note
CREATE POLICY "Utenti possono modificare solo le proprie note" ON public.note_personali
    FOR UPDATE USING (auth.uid()::text = utente_id::text);

-- Policy: Utenti possono eliminare solo le proprie note
CREATE POLICY "Utenti possono eliminare solo le proprie note" ON public.note_personali
    FOR DELETE USING (auth.uid()::text = utente_id::text);

-- Inserimento note di esempio per test
INSERT INTO public.note_personali (utente_id, titolo, contenuto) VALUES 
(
    'e1017f5d-83e1-4da3-ac81-4924a0dfd010', -- ID del sopralluoghista di test
    'Promemoria importante',
    'Ricordare di portare l''attrezzatura per le verifiche gas nei condomini di Via Roma'
),
(
    'e1017f5d-83e1-4da3-ac81-4924a0dfd010',
    'Orari disponibilità',
    'Da lunedì a venerdì 9:00-17:00, sabato mattina 9:00-12:00 solo per emergenze'
);

-- Verifica creazione tabella
SELECT 'Tabella note_personali creata con successo!' as messaggio;