-- ==========================================
-- FIX PASSWORD ADMIN - Quick Fix
-- Aggiorna solo l'hash password dell'admin
-- ==========================================

-- Aggiorna la password dell'utente admin
UPDATE public.users 
SET password_hash = '$2b$10$wMwKq5puhRkKYcjnFFWVv./gqfpRhey3Z835MY2xraqhFrZp5C54m'
WHERE username = 'admin';

-- Verifica il risultato
SELECT 
    username, 
    email, 
    role,
    substring(password_hash, 1, 10) || '...' as password_hash_preview
FROM public.users 
WHERE username = 'admin';

SELECT '✅ Password admin aggiornata! Ora puoi usare admin/admin123' as status;