-- Script per verificare se le notifiche vengono create nel database

-- 1. Conta tutte le notifiche
SELECT 'TOTALE NOTIFICHE:' as info, COUNT(*) as count FROM notifiche;

-- 2. Mostra le ultime 10 notifiche create
SELECT 'ULTIME 10 NOTIFICHE:' as info;
SELECT 
  id,
  tipo,
  titolo,
  messaggio,
  utente_id,
  letta,
  created_at,
  data_scadenza
FROM notifiche 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Controlla se ci sono notifiche per Diego Marruchi (utente dei test)
SELECT 'NOTIFICHE DIEGO MARRUCHI:' as info;
SELECT 
  n.id,
  n.tipo,
  n.titolo,
  n.messaggio,
  n.letta,
  n.created_at,
  u.nome,
  u.email
FROM notifiche n
LEFT JOIN utenti u ON n.utente_id = u.id
WHERE n.utente_id = 'e1017f5d-83e1-4da3-ac81-4924a0dfd010'
ORDER BY n.created_at DESC;

-- 4. Verifica struttura tabella notifiche
SELECT 'STRUTTURA NOTIFICHE:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'notifiche' 
ORDER BY ordinal_position;

-- 5. Verifica politiche RLS
SELECT 'POLITICHE RLS NOTIFICHE:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'notifiche';