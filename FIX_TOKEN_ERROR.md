# 🔧 Fix Errore Colonna Token - Scripts SQL Aggiornati

## ❌ **Errore Incontrato**
```
ERROR: 42703: column "token" does not exist
```

## ✅ **Soluzione: Script SQL Aggiornati**

### Opzione 1: Script Semplice (Raccomandato)
Esegui nel SQL Editor di Supabase:

```sql
-- Script sicuro per tabella condomini esistente
-- File: sql/update_condomini_columns.sql

ALTER TABLE condomini 
ADD COLUMN IF NOT EXISTS nome text;

ALTER TABLE condomini 
ADD COLUMN IF NOT EXISTS token text;

ALTER TABLE condomini 
ADD COLUMN IF NOT EXISTS data_inserimento timestamp with time zone DEFAULT now();

ALTER TABLE condomini 
ADD COLUMN IF NOT EXISTS data_ultima_modifica timestamp with time zone DEFAULT now();

ALTER TABLE condomini 
ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES users(id) ON DELETE SET NULL;

-- Popola token per record esistenti
UPDATE condomini 
SET token = 'cond_' || substr(gen_random_uuid()::text, 1, 12) 
WHERE token IS NULL OR token = '';

-- Crea indici
CREATE INDEX IF NOT EXISTS idx_condomini_assigned_to ON condomini(assigned_to);
CREATE INDEX IF NOT EXISTS idx_condomini_token ON condomini(token);
```

### Opzione 2: Script Completo con Gestione Errori
File: `sql/create_condomini_table.sql` (aggiornato)

## 🎯 **Dopo l'SQL**

### Test API Condomini:
```bash
# Test creazione condominio
curl -X POST http://localhost:3003/api/condomini \
  -H "Content-Type: application/json" \
  -d '{"nome": "Test Condominio"}'

# Dovrebbe rispondere:
{"success": true, "data": {...}, "message": "Condominio creato con successo"}
```

### Test Interfaccia:
1. http://localhost:3003 → Login admin
2. Pannello Admin → Tab "🏢 Assegnazioni Condomini"  
3. Dovresti vedere condomini e statistiche

## 📋 **Files Aggiornati**
- ✅ `sql/update_condomini_columns.sql` - Script semplice e sicuro
- ✅ `sql/create_condomini_table.sql` - Script completo con gestione errori
- ✅ Entrambi gestiscono tabelle esistenti senza errori

## 🚀 **Risultato Finale**
Dopo l'SQL avrai il sistema completo:
- ✅ Reset password funzionante (già testato)
- ✅ Assegnazioni condomini operative  
- ✅ Statistiche carico lavoro sopralluoghisti
- ✅ Interfaccia admin completa