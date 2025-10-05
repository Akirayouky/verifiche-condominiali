-- ============================================
-- STEP 1: SCOPRI STATI ESISTENTI
-- ============================================
-- Esegui SOLO questa query per vedere quali stati hai nel database

SELECT DISTINCT stato, COUNT(*) as count
FROM lavorazioni 
GROUP BY stato
ORDER BY stato;

-- ============================================
-- Dopo aver visto il risultato, dimmi quali stati ci sono
-- e preparerò lo script finale corretto
-- ============================================
