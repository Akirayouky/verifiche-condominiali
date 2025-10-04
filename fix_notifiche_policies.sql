-- Script per correggere le policy RLS della tabella notifiche

-- 1. Rimuovi tutte le policy esistenti
DROP POLICY IF EXISTS "Users can view own notifications" ON notifiche;
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifiche;  
DROP POLICY IF EXISTS "Users can update own notifications" ON notifiche;
DROP POLICY IF EXISTS "Admin can view all notifications" ON notifiche;

-- 2. Disabilita temporaneamente RLS per permettere accesso service key
ALTER TABLE notifiche DISABLE ROW LEVEL SECURITY;

-- 3. Crea policy più permissive che funzionino con service key
ALTER TABLE notifiche ENABLE ROW LEVEL SECURITY;

-- Policy per permettere lettura (anche con service key)
CREATE POLICY "Enable read access for all users" ON notifiche
    FOR SELECT USING (true);

-- Policy per permettere inserimento (anche con service key)  
CREATE POLICY "Enable insert for all users" ON notifiche
    FOR INSERT WITH CHECK (true);

-- Policy per permettere update (anche con service key)
CREATE POLICY "Enable update for all users" ON notifiche
    FOR UPDATE USING (true);

-- Policy per permettere delete (anche con service key)
CREATE POLICY "Enable delete for all users" ON notifiche
    FOR DELETE USING (true);

-- 4. Verifica che le policy siano attive
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'notifiche';

-- 5. Test per verificare accesso
SELECT COUNT(*) as total_notifiche FROM notifiche;

-- 6. Test inserimento
INSERT INTO notifiche (tipo, titolo, messaggio, utente_id, priorita, letta) 
VALUES ('nuova_assegnazione', 'Test Policy Fix', 'Test dopo correzione policy', gen_random_uuid(), 'media', false)
ON CONFLICT DO NOTHING;