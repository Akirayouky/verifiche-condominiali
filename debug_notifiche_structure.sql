-- Script per diagnosticare la struttura attuale della tabella notifiche

-- 1. Verifica struttura completa della tabella
\d notifiche;

-- 2. Mostra tutti i record per vedere come sono strutturati
SELECT id, tipo, titolo, priorita, letta, data_creazione 
FROM notifiche 
LIMIT 5;

-- 3. Verifica che valori abbiamo nel campo priorita
SELECT DISTINCT priorita, COUNT(*) as count
FROM notifiche 
GROUP BY priorita;

-- 4. Verifica che valori abbiamo nel campo letta (se esiste)
SELECT DISTINCT letta, COUNT(*) as count
FROM notifiche 
GROUP BY letta;

-- 5. Mostra i constraint attuali
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE table_name = 'notifiche';

-- 6. Verifica il record che sta causando il problema
SELECT * FROM notifiche 
WHERE priorita = 'non_letta' OR priorita NOT IN ('bassa', 'media', 'alta', 'urgente');