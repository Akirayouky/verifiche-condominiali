# 🔥 RESET COMPLETO DATABASE - ISTRUZIONI

## ⚠️ ATTENZIONE
Questo script **CANCELLA TUTTO** il database e lo ricrea da zero. Usare solo in sviluppo!

## 📋 Procedura Reset Completo

### 1. Vai su Supabase Dashboard
- Apri [supabase.com](https://supabase.com/dashboard)
- Seleziona il progetto: **ygvlcikgzkoaxlrmwsnv**
- Vai su **SQL Editor**

### 2. Esegui lo Script
- Apri il file `sql/reset_completo_database.sql`
- **Copia TUTTO** il contenuto (214 righe)
- **Incolla** nel SQL Editor di Supabase
- Clicca **RUN** ▶️

### 3. Verifica Risultato
Lo script mostrerà:
```
🎉 DATABASE COMPLETAMENTE RIPRISTINATO!
TABELLE CREATE: 5
Users: 1
Condomini: 3  
Tipologie Verifiche: 6
```

## 🎯 Cosa Include

### Tabelle Create:
- ✅ **users** - Sistema autenticazione
- ✅ **condomini** - Gestione condomini
- ✅ **tipologie_verifiche** - Tipi di controllo
- ✅ **verifiche** - Controlli eseguiti
- ✅ **lavorazioni** - Gestione interventi

### Dati Iniziali:
- 👤 **Admin**: admin / admin123
- 🏢 **3 Condomini** di esempio
- 📋 **6 Tipologie** verifiche standard

### Ottimizzazioni:
- 🚀 **Indici** per performance
- 🔒 **RLS Policy** permissive
- 🔗 **Foreign Key** e vincoli

## 🚀 Test Funzionalità

Dopo l'esecuzione, testa:

1. **Avvia il server**:
   ```bash
   npm run dev
   ```

2. **Login Admin**:
   - Username: `admin`
   - Password: `admin123`

3. **Test API**:
   ```bash
   curl -X POST http://localhost:3000/api/condomini \
     -H "Content-Type: application/json" \
     -d '{"nome":"Test Reset","indirizzo":"Via Test"}'
   ```

## 🔧 In Caso di Problemi

Se lo script fallisce:
1. **Riprova** - A volte ci sono timeout temporanei
2. **Controlla log** - Supabase mostra errori specifici  
3. **Usa alternative** - Prova `sql/setup_minimal.sql` per test rapido

## ✅ Risultato Atteso

Dopo il reset:
- ❌ Server Next.js NON crasha più
- ✅ API condomini/tipologie funzionanti
- ✅ Login admin operativo  
- ✅ Dashboard mostra dati reali
- ✅ Creazione condomini senza errori

Il messaggio "Unable to find your table with ID 17433" sparirà definitivamente!