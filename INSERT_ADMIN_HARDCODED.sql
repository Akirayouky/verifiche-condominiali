-- ============================================
-- INSERT ADMIN HARDCODED NEL DATABASE
-- ============================================
-- Esegui questo script su Supabase SQL Editor
-- per creare l'utente admin hardcoded con UUID valido

-- Inserisci l'utente admin se non esiste già
INSERT INTO users (
  id,
  username,
  email,
  nome,
  cognome,
  role,
  password_hash,
  attivo,
  approved_at,
  created_at,
  last_login
)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Kamia',
  'admin@sistema.local',
  'Amministratore',
  'Sistema',
  'admin',
  '$2a$10$dummyhashfordev', -- Hash placeholder (login usa logica hardcoded)
  true,
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  nome = EXCLUDED.nome,
  cognome = EXCLUDED.cognome,
  role = EXCLUDED.role,
  attivo = EXCLUDED.attivo,
  last_login = NOW();

-- Verifica inserimento
SELECT 
  id,
  username,
  email,
  nome,
  cognome,
  role,
  attivo
FROM users
WHERE id = 'a0000000-0000-0000-0000-000000000001';
