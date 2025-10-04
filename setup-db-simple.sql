-- Schema SQL semplificato per notifiche
-- Eseguire manualmente su Supabase SQL Editor

-- 1. Tabella notifiche
CREATE TABLE IF NOT EXISTS notifiche (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  utente_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  titolo VARCHAR(255) NOT NULL,
  messaggio TEXT NOT NULL,
  stato VARCHAR(20) DEFAULT 'non_letta',
  priorita VARCHAR(20) DEFAULT 'normale',
  lavorazione_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Abilita RLS
ALTER TABLE notifiche ENABLE ROW LEVEL SECURITY;

-- 3. Policy base
CREATE POLICY "Users can view own notifications" ON notifiche 
  FOR SELECT USING (auth.uid() = utente_id);

-- 4. Indice per performance
CREATE INDEX idx_notifiche_utente ON notifiche(utente_id, created_at DESC);

-- Fine setup base