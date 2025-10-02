-- =====================================================
-- DATABASE VERIFICHE CONDOMINIALI - SETUP COMPLETO
-- Per phpMyAdmin - Creazione tabelle MySQL
-- =====================================================

-- Usa il database esistente
-- USE nome_database_condominiali;

-- =====================================================
-- 1. TABELLA CONDOMINI
-- =====================================================
CREATE TABLE `condomini` (
  `id` VARCHAR(36) PRIMARY KEY,
  `nome` VARCHAR(255) NOT NULL,
  `token` VARCHAR(255) UNIQUE NOT NULL,
  `data_inserimento` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `data_ultima_modifica` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_condomini_token` (`token`),
  INDEX `idx_condomini_nome` (`nome`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. TABELLA TIPOLOGIE VERIFICHE
-- =====================================================
CREATE TABLE `tipologie_verifiche` (
  `id` VARCHAR(36) PRIMARY KEY,
  `nome` VARCHAR(255) NOT NULL,
  `descrizione` TEXT,
  `campi_personalizzati` JSON,
  `attiva` BOOLEAN NOT NULL DEFAULT TRUE,
  `data_creazione` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `data_ultima_modifica` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX `idx_tipologie_nome` (`nome`),
  INDEX `idx_tipologie_attiva` (`attiva`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. TABELLA VERIFICHE
-- =====================================================
CREATE TABLE `verifiche` (
  `id` VARCHAR(36) PRIMARY KEY,
  `condominio_id` VARCHAR(36) NOT NULL,
  `tipologia_id` VARCHAR(36) NOT NULL,
  `stato` ENUM('bozza', 'in_corso', 'completata', 'archiviata') NOT NULL DEFAULT 'bozza',
  `dati_verifica` JSON,
  `note` TEXT,
  `email_inviata` BOOLEAN NOT NULL DEFAULT FALSE,
  `data_creazione` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `data_completamento` DATETIME NULL,
  `data_ultima_modifica` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`condominio_id`) REFERENCES `condomini`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tipologia_id`) REFERENCES `tipologie_verifiche`(`id`) ON DELETE RESTRICT,
  
  INDEX `idx_verifiche_condominio` (`condominio_id`),
  INDEX `idx_verifiche_tipologia` (`tipologia_id`),
  INDEX `idx_verifiche_stato` (`stato`),
  INDEX `idx_verifiche_data_creazione` (`data_creazione`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. TABELLA LAVORAZIONI (PANNELLO ADMIN)
-- =====================================================
CREATE TABLE `lavorazioni` (
  `id` VARCHAR(36) PRIMARY KEY,
  `verifica_id` VARCHAR(36) NOT NULL,
  `stato` ENUM('aperta', 'chiusa', 'riaperta') NOT NULL DEFAULT 'aperta',
  `descrizione` TEXT NOT NULL,
  `note` JSON, -- Array di note
  `data_apertura` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `data_chiusura` DATETIME NULL,
  `data_riapertura` DATETIME NULL,
  
  FOREIGN KEY (`verifica_id`) REFERENCES `verifiche`(`id`) ON DELETE CASCADE,
  
  INDEX `idx_lavorazioni_verifica` (`verifica_id`),
  INDEX `idx_lavorazioni_stato` (`stato`),
  INDEX `idx_lavorazioni_data_apertura` (`data_apertura`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DATI ESEMPIO PER TEST
-- =====================================================

-- Condominio di esempio
INSERT INTO `condomini` (`id`, `nome`, `token`) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Condominio Via Roma 123', 'COND001ABC');

-- Tipologia di verifica di esempio
INSERT INTO `tipologie_verifiche` (`id`, `nome`, `descrizione`, `campi_personalizzati`, `attiva`) VALUES 
('550e8400-e29b-41d4-a716-446655440002', 
 'Verifica Impianti Elettrici', 
 'Controllo generale degli impianti elettrici condominiali',
 '[
    {
      "id": "campo1",
      "nome": "Stato Quadro Elettrico",
      "tipo": "select",
      "obbligatorio": true,
      "opzioni": ["Ottimo", "Buono", "Sufficiente", "Insufficiente"]
    },
    {
      "id": "campo2", 
      "nome": "Note Aggiuntive",
      "tipo": "textarea",
      "obbligatorio": false,
      "placeholder": "Inserisci eventuali note..."
    }
 ]',
 TRUE);

-- Verifica di esempio
INSERT INTO `verifiche` (`id`, `condominio_id`, `tipologia_id`, `stato`, `dati_verifica`, `note`, `email_inviata`) VALUES 
('550e8400-e29b-41d4-a716-446655440003',
 '550e8400-e29b-41d4-a716-446655440001',
 '550e8400-e29b-41d4-a716-446655440002', 
 'completata',
 '{"campo1": "Buono", "campo2": "Tutti gli impianti funzionanti correttamente"}',
 'Verifica completata senza anomalie',
 TRUE);

-- Lavorazione di esempio
INSERT INTO `lavorazioni` (`id`, `verifica_id`, `stato`, `descrizione`, `note`) VALUES 
('550e8400-e29b-41d4-a716-446655440004',
 '550e8400-e29b-41d4-a716-446655440003',
 'chiusa',
 'Manutenzione programmata impianti elettrici',
 '["Lavorazione completata", "Tutti gli impianti verificati e funzionanti"]');

-- =====================================================
-- QUERY UTILI PER VERIFICARE I DATI
-- =====================================================

-- Visualizza tutti i condomini
-- SELECT * FROM condomini;

-- Visualizza tutte le tipologie attive
-- SELECT * FROM tipologie_verifiche WHERE attiva = TRUE;

-- Visualizza verifiche complete con dettagli condominio e tipologia
-- SELECT 
--     v.id as verifica_id,
--     c.nome as condominio,
--     t.nome as tipologia,
--     v.stato,
--     v.data_creazione,
--     v.data_completamento
-- FROM verifiche v
-- JOIN condomini c ON v.condominio_id = c.id
-- JOIN tipologie_verifiche t ON v.tipologia_id = t.id
-- ORDER BY v.data_creazione DESC;

-- Visualizza lavorazioni con dettagli verifica
-- SELECT 
--     l.id as lavorazione_id,
--     l.descrizione,
--     l.stato as stato_lavorazione,
--     v.stato as stato_verifica,
--     c.nome as condominio,
--     l.data_apertura,
--     l.data_chiusura
-- FROM lavorazioni l
-- JOIN verifiche v ON l.verifica_id = v.id
-- JOIN condomini c ON v.condominio_id = c.id
-- ORDER BY l.data_apertura DESC;

-- =====================================================
-- NOTE IMPLEMENTAZIONE:
-- =====================================================
-- 1. Utilizzare UUID v4 per tutti gli ID (es. crypto.randomUUID())
-- 2. JSON supportato nativamente in MySQL 5.7+
-- 3. ENUM per stati garantisce consistenza dati
-- 4. Foreign Keys con CASCADE/RESTRICT per integrità referenziale
-- 5. Indici su campi di ricerca frequente per performance
-- 6. Charset utf8mb4 per supporto completo Unicode
-- =====================================================