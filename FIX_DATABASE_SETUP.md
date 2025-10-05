# 🔧 FIX ERRORE: Colonne Database Mancanti

## ❌ Problema
```
Error: Could not find the 'campi_da_ricompilare' column of 'lavorazioni' in the schema cache
```

**Causa:** Le colonne JSONB per il sistema riapertura non sono state create nel database Supabase.

---

## ✅ Soluzione Immediata

### Step 1: Accedi a Supabase
1. Vai su https://supabase.com
2. Seleziona il tuo progetto
3. Vai su **SQL Editor** (nel menu laterale)

### Step 2: Esegui lo Script
1. Apri il file: `SETUP_STATO_RIAPERTA.sql`
2. Copia **tutto il contenuto**
3. Incolla nell'editor SQL di Supabase
4. Click su **"Run"** (o Ctrl+Enter)

### Step 3: Verifica Successo
Dovresti vedere l'output della query di verifica che mostra:
- ✅ `campi_da_ricompilare` (tipo: jsonb)
- ✅ `campi_nuovi` (tipo: jsonb)
- ✅ `motivo_riapertura` (tipo: text)
- ✅ `data_riapertura` (tipo: timestamp)
- ✅ `riaperta_da` (tipo: uuid)

---

## 🔄 Dopo l'Esecuzione

1. **Refresh della pagina**: Ricarica `http://localhost:3000`
2. **Riprova il test**: Clicca di nuovo su "Riapri lavorazione"
3. **Dovrebbe funzionare**: Nessun errore 500, wizard si completa

---

## 📋 Cosa fa lo Script

```sql
-- Aggiunge 5 colonne alla tabella lavorazioni:
campi_da_ricompilare  → JSONB array (campi da far ricompilare)
campi_nuovi          → JSONB array (nuovi campi da aggiungere)
motivo_riapertura    → TEXT (motivo inserito dall'admin)
data_riapertura      → TIMESTAMP (quando è stata riaperta)
riaperta_da          → UUID (ID dell'admin che ha riaperto)

-- Modifica constraint stato:
stato CHECK ('in_corso', 'completata', 'riaperta')  ← aggiunge 'riaperta'

-- Crea indici per performance
```

---

## 🚨 Troubleshooting

### Errore: "constraint lavorazioni_stato_check already exists"
**Soluzione:** Il constraint esiste già ma non include 'riaperta'.
```sql
-- Esegui solo questa parte dello script:
ALTER TABLE lavorazioni DROP CONSTRAINT IF EXISTS lavorazioni_stato_check;
ALTER TABLE lavorazioni ADD CONSTRAINT lavorazioni_stato_check 
CHECK (stato IN ('in_corso', 'completata', 'riaperta'));
```

### Errore: "column already exists"
**Soluzione:** Alcune colonne esistono già. È normale, lo script usa `IF NOT EXISTS`.
Continua comunque, il resto dello script si eseguirà.

### Errore: "permission denied"
**Soluzione:** Devi essere owner del progetto Supabase o avere permessi di ALTER TABLE.
Contatta l'admin del progetto.

---

## ✅ Verifica Finale

Dopo aver eseguito lo script, verifica con questa query:

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'lavorazioni' 
  AND column_name LIKE '%riap%' OR column_name LIKE '%campi%'
ORDER BY column_name;
```

**Output atteso:**
```
campi_da_ricompilare  | jsonb     | YES
campi_nuovi          | jsonb     | YES
data_riapertura      | timestamp | YES
motivo_riapertura    | text      | YES
riaperta_da          | uuid      | YES
```

Se vedi queste 5 righe → **✅ TUTTO OK!**

---

## 🔄 Prossimi Passi

1. ✅ Esegui `SETUP_STATO_RIAPERTA.sql` su Supabase
2. 🔄 Ricarica la pagina
3. 🧪 Riprova il test di riapertura
4. 🎉 Dovrebbe funzionare!

---

## 📝 Note per il Futuro

**Perché è successo questo?**
Durante lo sviluppo abbiamo creato le API e i componenti, ma non abbiamo eseguito la migrazione database. In produzione, questo script va eseguito **prima** del deploy del codice.

**Come evitarlo in futuro:**
1. Creare script SQL di migrazione insieme al codice
2. Eseguirli su Supabase prima di testare
3. Includere nel README le istruzioni di setup database
4. Usare un sistema di migrazione versionate (es. Prisma Migrate)

---

**Ultimo aggiornamento:** 5 Ottobre 2025
