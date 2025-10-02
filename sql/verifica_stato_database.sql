-- ==========================================
-- SCRIPT VERIFICA STATO DATABASE
-- Esegui per controllare lo stato attuale
-- ==========================================

-- 1. VERIFICA ESISTENZA TABELLE
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'condomini', 'tipologie_verifiche', 'verifiche', 'lavorazioni')
ORDER BY table_name;

-- 2. VERIFICA COLONNE TABELLE PRINCIPALI
SELECT 
    table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'condomini', 'tipologie_verifiche', 'verifiche', 'lavorazioni')
ORDER BY table_name, ordinal_position;

-- 3. CONTA RECORD IN OGNI TABELLA
DO $$
DECLARE
    table_record record;
    sql_query text;
    record_count integer;
BEGIN
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN ('users', 'condomini', 'tipologie_verifiche', 'verifiche', 'lavorazioni')
    LOOP
        sql_query := 'SELECT COUNT(*) FROM public.' || table_record.table_name;
        EXECUTE sql_query INTO record_count;
        RAISE NOTICE 'Tabella %: % record', table_record.table_name, record_count;
    END LOOP;
END $$;

-- 4. VERIFICA INDICI ESISTENTI
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'condomini', 'tipologie_verifiche', 'verifiche', 'lavorazioni')
ORDER BY tablename, indexname;

-- 5. VERIFICA POLICY RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'condomini', 'tipologie_verifiche', 'verifiche', 'lavorazioni')
ORDER BY tablename, policyname;