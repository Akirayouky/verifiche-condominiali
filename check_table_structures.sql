-- Script per verificare le strutture delle tabelle

-- 1. Verifica struttura tabella condomini
SELECT 'STRUTTURA CONDOMINI:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'condomini' 
ORDER BY ordinal_position;

-- 2. Verifica struttura tabella tipologie_verifiche  
SELECT 'STRUTTURA TIPOLOGIE_VERIFICHE:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'tipologie_verifiche' 
ORDER BY ordinal_position;

-- 3. Verifica struttura tabella users
SELECT 'STRUTTURA USERS:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 4. Verifica struttura tabella lavorazioni
SELECT 'STRUTTURA LAVORAZIONI:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'lavorazioni' 
ORDER BY ordinal_position;

-- 5. Mostra alcuni record esistenti per capire i valori
SELECT 'SAMPLE CONDOMINI:' as info;
SELECT * FROM condomini LIMIT 3;

SELECT 'SAMPLE USERS:' as info;
SELECT id, username, nome, cognome, email, role FROM users LIMIT 3;