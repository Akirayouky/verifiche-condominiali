
-- Aggiorna vincolo per includere nuovo tipo notifica
ALTER TABLE notifiche DROP CONSTRAINT IF EXISTS notifiche_tipo_check;
ALTER TABLE notifiche ADD CONSTRAINT notifiche_tipo_check 
CHECK (tipo IN ('scadenza_imminente', 'nuova_assegnazione', 'lavorazione_completata', 'reminder_personalizzato', 'urgente', 'nuova_verifica'));

-- Verifica la struttura aggiornata  
SELECT constraint_name, check_clause FROM information_schema.check_constraints 
WHERE table_name = 'notifiche' AND constraint_name = 'notifiche_tipo_check';

