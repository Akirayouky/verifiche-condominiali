-- Script per creare dati di test nel database (versione semplificata)

-- 1. Crea un condominio di test con solo campi base
INSERT INTO condomini (id, nome, indirizzo)
VALUES (
  'test-condo-123',
  'Condominio Test',
  'Via Test 123, Test City'
) ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  indirizzo = EXCLUDED.indirizzo;

-- 2. Crea una tipologia di test (se la tabella esiste)
INSERT INTO tipologie_verifiche (id, nome, descrizione)
VALUES (
  'test-tipo-123',
  'Test Tipologia',
  'Tipologia per test automatici'
) ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  descrizione = EXCLUDED.descrizione;

-- 3. Crea un utente sopralluoghista di test con campi base
INSERT INTO users (id, username, email, nome, cognome, role)
VALUES (
  'test-sopralluoghi-456',
  'test.sopralluoghista',
  'test.sopralluoghista@test.com',
  'Test',
  'Sopralluoghista', 
  'sopralluoghista'
) ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  cognome = EXCLUDED.cognome,
  email = EXCLUDED.email;

-- 4. Verifica che i record siano stati creati
SELECT 'CONDOMINI TEST' as tabella, COUNT(*) as records FROM condomini WHERE id = 'test-condo-123'
UNION ALL
SELECT 'TIPOLOGIE TEST' as tabella, COUNT(*) as records FROM tipologie_verifiche WHERE id = 'test-tipo-123'  
UNION ALL
SELECT 'USERS TEST' as tabella, COUNT(*) as records FROM users WHERE id = 'test-sopralluoghi-456';

-- 5. Mostra i dati creati
SELECT 'Condominio:', nome, indirizzo FROM condomini WHERE id = 'test-condo-123';
SELECT 'Tipologia:', nome, descrizione FROM tipologie_verifiche WHERE id = 'test-tipo-123';
SELECT 'Utente:', nome, cognome, email, role FROM users WHERE id = 'test-sopralluoghi-456';