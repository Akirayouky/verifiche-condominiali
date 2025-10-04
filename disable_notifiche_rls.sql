-- Script alternativo: Disabilita completamente RLS per tabella notifiche
-- Usa questo solo se le policy continuano a dare problemi

-- 1. Rimuovi tutte le policy
DROP POLICY IF EXISTS "Users can view own notifications" ON notifiche;
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifiche;  
DROP POLICY IF EXISTS "Users can update own notifications" ON notifiche;
DROP POLICY IF EXISTS "Admin can view all notifications" ON notifiche;
DROP POLICY IF EXISTS "Enable read access for all users" ON notifiche;
DROP POLICY IF EXISTS "Enable insert for all users" ON notifiche;
DROP POLICY IF EXISTS "Enable update for all users" ON notifiche;
DROP POLICY IF EXISTS "Enable delete for all users" ON notifiche;

-- 2. Disabilita completamente RLS
ALTER TABLE notifiche DISABLE ROW LEVEL SECURITY;

-- 3. Test accesso
SELECT COUNT(*) as total_notifiche FROM notifiche;

-- 4. Test inserimento
INSERT INTO notifiche (tipo, titolo, messaggio, utente_id, priorita, letta) 
VALUES ('nuova_assegnazione', 'Test No RLS', 'Test senza RLS', gen_random_uuid(), 'media', false)
ON CONFLICT DO NOTHING;

-- 5. Mostra struttura tabella
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifiche' 
ORDER BY ordinal_position;