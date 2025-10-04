-- ===================================================
-- SETUP SISTEMA NOTIFICHE - SCHEMA COMPLETO SUPABASE
-- ===================================================
-- Eseguire tutto questo codice nel Supabase SQL Editor
-- Tempo esecuzione: ~30 secondi

-- 1. TABELLA NOTIFICHE PRINCIPALE
-- ================================
CREATE TABLE IF NOT EXISTS notifiche (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  utente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('scadenza', 'nuova_assegnazione', 'sistema', 'lavorazione_completata', 'reminder')),
  titolo VARCHAR(255) NOT NULL,
  messaggio TEXT NOT NULL,
  stato VARCHAR(20) DEFAULT 'non_letta' CHECK (stato IN ('non_letta', 'letta', 'archiviata')),
  priorita VARCHAR(20) DEFAULT 'normale' CHECK (priorita IN ('bassa', 'normale', 'alta', 'urgente')),
  lavorazione_id UUID,
  condominio_id UUID,
  actions JSONB DEFAULT '[]'::jsonb,
  metadati JSONB DEFAULT '{}'::jsonb,
  data_creazione TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_lettura TIMESTAMP WITH TIME ZONE,
  data_scadenza TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELLA CONFIGURAZIONE REMINDER
-- ==================================
CREATE TABLE IF NOT EXISTS reminder_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  utente_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descrizione TEXT,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('scadenza_lavorazioni', 'controllo_giornaliero', 'report_settimanale', 'personalizzato')),
  frequenza VARCHAR(20) NOT NULL CHECK (frequenza IN ('giornaliera', 'settimanale', 'mensile')),
  ora_invio TIME NOT NULL DEFAULT '09:00',
  giorni_settimana INTEGER[] DEFAULT '{1,2,3,4,5}',
  giorni_anticipo INTEGER DEFAULT 1,
  attivo BOOLEAN DEFAULT true,
  ultima_esecuzione TIMESTAMP WITH TIME ZONE,
  prossima_esecuzione TIMESTAMP WITH TIME ZONE,
  configurazione JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. INDICI PER PERFORMANCE
-- =========================
CREATE INDEX IF NOT EXISTS idx_notifiche_utente_stato ON notifiche(utente_id, stato);
CREATE INDEX IF NOT EXISTS idx_notifiche_tipo_priorita ON notifiche(tipo, priorita);
CREATE INDEX IF NOT EXISTS idx_notifiche_data_creazione ON notifiche(data_creazione DESC);
CREATE INDEX IF NOT EXISTS idx_notifiche_lavorazione ON notifiche(lavorazione_id) WHERE lavorazione_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reminder_configs_utente ON reminder_configs(utente_id);
CREATE INDEX IF NOT EXISTS idx_reminder_configs_attivo ON reminder_configs(attivo) WHERE attivo = true;
CREATE INDEX IF NOT EXISTS idx_reminder_configs_prossima ON reminder_configs(prossima_esecuzione) WHERE attivo = true;

-- 4. ABILITAZIONE ROW LEVEL SECURITY
-- ==================================
ALTER TABLE notifiche ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_configs ENABLE ROW LEVEL SECURITY;

-- 5. POLICY DI SICUREZZA
-- ======================

-- Policy per notifiche
DROP POLICY IF EXISTS "Users can view own notifications" ON notifiche;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifiche;
DROP POLICY IF EXISTS "System can insert notifications" ON notifiche;

CREATE POLICY "Users can view own notifications" ON notifiche 
  FOR SELECT USING (auth.uid() = utente_id);

CREATE POLICY "Users can update own notifications" ON notifiche 
  FOR UPDATE USING (auth.uid() = utente_id);

CREATE POLICY "System can insert notifications" ON notifiche 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete own notifications" ON notifiche 
  FOR DELETE USING (auth.uid() = utente_id);

-- Policy per reminder_configs
DROP POLICY IF EXISTS "Users can manage own reminders" ON reminder_configs;

CREATE POLICY "Users can manage own reminders" ON reminder_configs 
  FOR ALL USING (auth.uid() = utente_id);

-- 6. TRIGGER PER UPDATED_AT AUTOMATICO
-- ====================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_notifiche_updated_at ON notifiche;
CREATE TRIGGER update_notifiche_updated_at 
  BEFORE UPDATE ON notifiche 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reminder_configs_updated_at ON reminder_configs;
CREATE TRIGGER update_reminder_configs_updated_at 
  BEFORE UPDATE ON reminder_configs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. FUNZIONE DI CLEANUP AUTOMATICO
-- =================================
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
    -- Archivia notifiche lette vecchie di 30 giorni
    UPDATE notifiche 
    SET stato = 'archiviata' 
    WHERE stato = 'letta' 
      AND data_lettura < NOW() - INTERVAL '30 days';
    
    -- Elimina notifiche archiviate vecchie di 90 giorni
    DELETE FROM notifiche 
    WHERE stato = 'archiviata' 
      AND updated_at < NOW() - INTERVAL '90 days';
      
    RAISE NOTICE 'Cleanup notifiche completato';
END;
$$ LANGUAGE plpgsql;

-- 8. FUNZIONE PER STATISTICHE NOTIFICHE
-- =====================================
CREATE OR REPLACE FUNCTION get_notification_stats(user_id UUID)
RETURNS TABLE (
    totali BIGINT,
    non_lette BIGINT,
    urgenti BIGINT,
    scadenze BIGINT,
    oggi BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as totali,
        COUNT(*) FILTER (WHERE stato = 'non_letta') as non_lette,
        COUNT(*) FILTER (WHERE priorita = 'urgente') as urgenti,
        COUNT(*) FILTER (WHERE tipo = 'scadenza') as scadenze,
        COUNT(*) FILTER (WHERE DATE(data_creazione) = CURRENT_DATE) as oggi
    FROM notifiche 
    WHERE utente_id = user_id;
END;
$$ LANGUAGE plpgsql;

-- 9. INSERIMENTO DATI DI TEST (OPZIONALE)
-- =======================================
-- Decommenta per inserire notifica di test
-- INSERT INTO notifiche (utente_id, tipo, titolo, messaggio, priorita) 
-- VALUES (
--     (SELECT id FROM auth.users LIMIT 1),
--     'sistema',
--     '🎉 Sistema Notifiche Attivo!',
--     'Il sistema di notifiche real-time è stato configurato correttamente. Tutte le funzionalità sono operative.',
--     'normale'
-- );

-- ===================================================
-- SETUP COMPLETATO!
-- ===================================================
-- ✅ Tabelle create: notifiche, reminder_configs
-- ✅ Indici per performance
-- ✅ Row Level Security attivato
-- ✅ Policy di sicurezza configurate
-- ✅ Trigger per updated_at automatico
-- ✅ Funzioni di cleanup e statistiche
-- 
-- 🚀 Il sistema è pronto per l'uso!
-- ===================================================