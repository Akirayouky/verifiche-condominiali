-- Script per verificare condomini esistenti e creare uno di test se necessario

-- 1. Verifica condomini esistenti
SELECT 'CONDOMINI ESISTENTI:' as info;
SELECT id, nome, indirizzo FROM condomini LIMIT 5;

-- 2. Crea un condominio di test se non esiste (usando UUID valido)
INSERT INTO condomini (id, nome, indirizzo, data_inserimento)
VALUES (
  '00000000-1111-2222-3333-444444444444',
  'Condominio Test Notifiche',
  'Via Test Notifiche 123, Test City',
  CURRENT_TIMESTAMP
) ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  indirizzo = EXCLUDED.indirizzo;

-- 3. Verifica che sia stato creato
SELECT 'CONDOMINIO TEST CREATO:' as info;
SELECT id, nome, indirizzo FROM condomini WHERE id = '00000000-1111-2222-3333-444444444444';

-- 4. Se non funziona, mostra la struttura della tabella condomini
SELECT 'STRUTTURA CONDOMINI:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'condomini' 
ORDER BY ordinal_position;