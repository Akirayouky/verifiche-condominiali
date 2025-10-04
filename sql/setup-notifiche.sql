-- Script SQL per creazione tabelle notifiche e reminder
-- Eseguire su Supabase SQL Editor

-- Tabella notifiche
CREATE TABLE IF NOT EXISTS public.notifiche (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('scadenza_imminente', 'nuova_assegnazione', 'lavorazione_completata', 'reminder_personalizzato', 'urgente')),
    titolo VARCHAR(255) NOT NULL,
    messaggio TEXT NOT NULL,
    utente_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    lavorazione_id UUID REFERENCES public.lavorazioni(id) ON DELETE SET NULL,
    condominio_id UUID REFERENCES public.condomini(id) ON DELETE SET NULL,
    priorita VARCHAR(20) NOT NULL DEFAULT 'media' CHECK (priorita IN ('bassa', 'media', 'alta', 'urgente')),
    letta BOOLEAN NOT NULL DEFAULT false,
    data_creazione TIMESTAMPTZ NOT NULL DEFAULT now(),
    data_scadenza TIMESTAMPTZ,
    azioni JSONB, -- Array di azioni disponibili per la notifica
    metadati JSONB DEFAULT '{}', -- Dati extra specifici per tipo
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabella configurazioni reminder personalizzati
CREATE TABLE IF NOT EXISTS public.reminder_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    utente_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descrizione TEXT,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('scadenza_lavorazioni', 'controllo_giornaliero', 'report_settimanale', 'personalizzato')),
    frequenza VARCHAR(20) NOT NULL CHECK (frequenza IN ('giornaliera', 'settimanale', 'mensile', 'custom')),
    giorni_anticipo INTEGER DEFAULT 1 CHECK (giorni_anticipo >= 0),
    ora_invio TIME NOT NULL DEFAULT '09:00',
    giorni_settimana INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- Lunedì-Venerdì di default
    attivo BOOLEAN NOT NULL DEFAULT true,
    ultima_esecuzione TIMESTAMPTZ,
    prossima_esecuzione TIMESTAMPTZ,
    canali TEXT[] DEFAULT ARRAY['app'], -- app, email, sms
    configurazione JSONB DEFAULT '{}', -- Config specifica per tipo
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_notifiche_utente_data ON public.notifiche(utente_id, data_creazione DESC);
CREATE INDEX IF NOT EXISTS idx_notifiche_non_lette ON public.notifiche(utente_id, letta, data_creazione DESC) WHERE letta = false;
CREATE INDEX IF NOT EXISTS idx_notifiche_tipo_priorita ON public.notifiche(tipo, priorita, data_creazione DESC);
CREATE INDEX IF NOT EXISTS idx_notifiche_lavorazione ON public.notifiche(lavorazione_id) WHERE lavorazione_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reminder_configs_utente ON public.reminder_configs(utente_id, attivo);
CREATE INDEX IF NOT EXISTS idx_reminder_configs_esecuzione ON public.reminder_configs(prossima_esecuzione, attivo) WHERE attivo = true;

-- Trigger per updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_notifiche_updated_at 
    BEFORE UPDATE ON public.notifiche 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_reminder_configs_updated_at 
    BEFORE UPDATE ON public.reminder_configs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) per sicurezza
ALTER TABLE public.notifiche ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_configs ENABLE ROW LEVEL SECURITY;

-- Policy: utenti possono vedere solo le loro notifiche
CREATE POLICY "Users can view own notifications" ON public.notifiche
    FOR SELECT USING (utente_id = auth.uid()::uuid);

CREATE POLICY "Users can update own notifications" ON public.notifiche
    FOR UPDATE USING (utente_id = auth.uid()::uuid);

-- Policy: admin possono creare notifiche per tutti
CREATE POLICY "Admins can create notifications" ON public.notifiche
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid()::uuid 
            AND role = 'admin' 
            AND attivo = true
        )
    );

-- Policy: reminder configs - utenti gestiscono i propri
CREATE POLICY "Users can manage own reminder configs" ON public.reminder_configs
    FOR ALL USING (utente_id = auth.uid()::uuid);

-- Funzione per cleanup notifiche vecchie (eseguire periodicamente)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    -- Elimina notifiche lette più vecchie di 30 giorni
    DELETE FROM public.notifiche 
    WHERE letta = true 
    AND data_creazione < now() - interval '30 days';
    
    -- Elimina notifiche non lette più vecchie di 90 giorni
    DELETE FROM public.notifiche 
    WHERE letta = false 
    AND data_creazione < now() - interval '90 days';
    
    RAISE NOTICE 'Cleanup notifiche completato';
END;
$$ LANGUAGE plpgsql;

-- Inserimento dati di test (opzionale)
INSERT INTO public.notifiche (tipo, titolo, messaggio, utente_id, priorita) 
SELECT 
    'reminder_personalizzato',
    'Benvenuto nel sistema notifiche! 🎉',
    'Il sistema di notifiche real-time è ora attivo. Riceverai aggiornamenti automatici per scadenze, nuove assegnazioni e promemoria personalizzati.',
    id,
    'media'
FROM public.users 
WHERE attivo = true
ON CONFLICT DO NOTHING;

-- Esempio configurazione reminder di default
INSERT INTO public.reminder_configs (utente_id, nome, descrizione, tipo, frequenza, ora_invio)
SELECT 
    id,
    'Controllo Scadenze Giornaliero',
    'Promemoria automatico per verificare lavorazioni in scadenza',
    'scadenza_lavorazioni',
    'giornaliera',
    '09:00'
FROM public.users 
WHERE role = 'sopralluoghista' 
AND attivo = true
ON CONFLICT DO NOTHING;