# 🔧 GUIDA COMPLETA RIPRISTINO DATABASE

## Problema Identificato
- Il server Next.js va in crash quando riceve richieste API
- Errore: "Unable to find your table with ID 17433"
- Causa: La tabella `condomini` non esiste nel database Supabase

## Soluzione: Ripristino Completo Database

### 📋 STEP 1: Verifica Stato Attuale
1. Vai al dashboard Supabase: https://supabase.com/dashboard
2. Seleziona il progetto: `ygvlcikgzkoaxlrmwsnv`
3. Vai su **SQL Editor**
4. Esegui lo script: `sql/verifica_stato_database.sql`

### 🔨 STEP 2: Ripristino Database
1. Nel **SQL Editor** di Supabase
2. Esegui lo script completo: `sql/ripristino_completo_database.sql`
3. Questo script:
   - ✅ Crea tutte le tabelle necessarie
   - ✅ Aggiunge indici per performance  
   - ✅ Configura Row Level Security
   - ✅ Inserisce dati di base (admin + tipologie)

### 🧪 STEP 3: Test Funzionalità
Dopo aver eseguito lo script SQL:

```bash
# 1. Avvia il server di sviluppo
npm run dev

# 2. Testa API di base
curl -s http://localhost:3000/api/status

# 3. Testa creazione condominio
curl -X POST http://localhost:3000/api/condomini \
  -H "Content-Type: application/json" \
  -d '{"nome":"Test Condominio","indirizzo":"Via Test 123"}'

# 4. Testa login admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 📊 STEP 4: Verifica Risultati
Il database dovrebbe avere:
- ✅ **users**: tabella utenti con admin creato
- ✅ **condomini**: tabella condomini vuota ma funzionale
- ✅ **tipologie_verifiche**: 4 tipologie di base inserite
- ✅ **verifiche**: tabella verifiche pronta per l'uso
- ✅ **lavorazioni**: tabella lavorazioni configurata

### 🔐 Credenziali Default
- **Username**: `admin`
- **Password**: `admin123`
- **Email**: `admin@condomini.local`

## 📁 File Creati
- `sql/ripristino_completo_database.sql` - Script principale
- `sql/verifica_stato_database.sql` - Controllo stato database
- `sql/create_condomini_base.sql` - Script backup singola tabella

## 🚨 Note Importanti
1. **Backup**: Lo script è sicuro e usa `IF NOT EXISTS`
2. **Policy**: Le policy RLS sono permissive per sviluppo
3. **Password**: L'hash della password admin è pre-calcolato
4. **Produzione**: Personalizzare le policy per sicurezza maggiore

## 🔄 Se Qualcosa Va Storto
Se vuoi ricominciare da zero, decomenta le righe `DROP TABLE` nello script di ripristino.

---
**Importante**: Esegui sempre prima `verifica_stato_database.sql` per capire cosa c'è nel database!