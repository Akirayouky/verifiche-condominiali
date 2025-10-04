-- Aggiorna vincolo per includere il nuovo tipo 'nuova_verifica'
ALTER TABLE notifiche DROP CONSTRAINT IF EXISTS notifiche_tipo_check;
ALTER TABLE notifiche ADD CONSTRAINT notifiche_tipo_check 
CHECK (tipo IN ('scadenza_imminente', 'nuova_assegnazione', 'lavorazione_completata', 'reminder_personalizzato', 'urgente', 'nuova_verifica'));

-- Verifica che il vincolo sia stato aggiunto correttamente
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE table_name = 'notifiche' AND constraint_name = 'notifiche_tipo_check';

-- Test inserimento nuovo tipo
INSERT INTO notifiche (id, tipo, titolo, messaggio, utente_id, priorita, letta) 
VALUES (gen_random_uuid(), 'nuova_verifica', 'Test', 'Test nuova_verifica', '', 'media', false);

-- Verifica inserimento
SELECT id, tipo, titolo FROM notifiche WHERE tipo = 'nuova_verifica' ORDER BY data_creazione DESC LIMIT 1;

-- Cancella record di test
DELETE FROM notifiche WHERE tipo = 'nuova_verifica' AND titolo = 'Test';