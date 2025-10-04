-- Tabella per salvare le Push Subscriptions degli utenti
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  utente_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL, -- { p256dh: string, auth: string }
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice per velocizzare query per utente
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_utente_id ON push_subscriptions(utente_id);

-- Indice per endpoint
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- RLS Policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Admin e service_role possono fare tutto
CREATE POLICY "Admin e service role full access" ON push_subscriptions
  FOR ALL
  USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Policy: Utenti possono gestire le proprie subscriptions
CREATE POLICY "Users manage own subscriptions" ON push_subscriptions
  FOR ALL
  USING (auth.uid() = utente_id);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_push_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_push_subscription_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscription_updated_at();

-- Commenti
COMMENT ON TABLE push_subscriptions IS 'Salva le Push Subscriptions degli utenti per notifiche Web Push';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'Endpoint univoco della push subscription';
COMMENT ON COLUMN push_subscriptions.keys IS 'Chiavi crittografiche per push (p256dh, auth)';
COMMENT ON COLUMN push_subscriptions.user_agent IS 'User agent del browser/dispositivo';
