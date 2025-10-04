-- Script per pulire e correggere dati esistenti nella tabella notifiche

-- 1. Prima vediamo che problemi abbiamo
SELECT 'DATI PROBLEMATICI' as status;

-- Mostra record con priorita non valida
SELECT id, tipo, titolo, priorita, letta, data_creazione 
FROM notifiche 
WHERE priorita NOT IN ('bassa', 'media', 'alta', 'urgente') 
   OR priorita IS NULL;

-- 2. Correggiamo i dati problematici
SELECT 'CORREZIONE DATI' as status;

-- Se priorita contiene 'non_letta', probabilmente i campi sono scambiati
UPDATE notifiche 
SET priorita = 'media',  -- Impostiamo un valore di default valido
    letta = CASE 
        WHEN priorita = 'non_letta' THEN false
        WHEN priorita = 'letta' THEN true
        ELSE COALESCE(letta, false)
    END
WHERE priorita NOT IN ('bassa', 'media', 'alta', 'urgente') 
   OR priorita IS NULL;

-- 3. Assicuriamoci che letta sia boolean
UPDATE notifiche 
SET letta = false 
WHERE letta IS NULL;

-- 4. Verifica dopo la correzione
SELECT 'VERIFICA POST CORREZIONE' as status;

SELECT DISTINCT priorita, COUNT(*) as count
FROM notifiche 
GROUP BY priorita;

SELECT DISTINCT letta, COUNT(*) as count  
FROM notifiche
GROUP BY letta;

-- 5. Mostra alcuni record corretti
SELECT id, tipo, titolo, priorita, letta, data_creazione
FROM notifiche 
ORDER BY data_creazione DESC
LIMIT 5;