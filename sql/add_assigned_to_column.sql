-- SQL per aggiungere campo assigned_to alla tabella condomini
-- Questo permette di assegnare i condomini a specifici sopralluoghisti per la divisione del carico di lavoro

-- Aggiungi colonna assigned_to (nullable) che fa riferimento all'ID dell'utente sopralluoghista
ALTER TABLE condomini 
ADD COLUMN assigned_to uuid REFERENCES users(id) ON DELETE SET NULL;

-- Aggiungi commento per documentare il campo
COMMENT ON COLUMN condomini.assigned_to IS 'ID del sopralluoghista a cui è assegnato questo condominio. NULL = non assegnato';

-- Indice per migliorare le performance delle query filtrate per sopralluoghista
CREATE INDEX idx_condomini_assigned_to ON condomini(assigned_to);