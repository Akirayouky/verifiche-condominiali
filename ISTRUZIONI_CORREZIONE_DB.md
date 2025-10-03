# 🚨 ISTRUZIONI URGENTI - CORREZIONE DATABASE

## PROBLEMI RILEVATI:
1. ❌ **Tabella `note_personali` non esiste** - Errore creazione note
2. ❌ **Colonna `password_changed_at` mancante** - Errore cambio password  
3. ✅ **Icone DA ESEGUIRE corrette** - Fix applicato al codice

## 📋 AZIONI RICHIESTE:

### STEP 1: Accesso Supabase
1. Apri [supabase.com](https://supabase.com)
2. Accedi al tuo progetto: `ygvlcikgzkoaxlrmwsnv`
3. Vai su **SQL Editor** nella sidebar sinistra

### STEP 2: Esecuzione Script
1. Copia **TUTTO il contenuto** del file `CORREZIONE_TABELLE_MANCANTI.sql`
2. Incolla nell'editor SQL di Supabase
3. Clicca **RUN** per eseguire

### STEP 3: Verifica Successo
Se tutto va bene vedrai questi messaggi:
```
✅ Tabella note_personali creata con successo
✅ Colonna password_changed_at aggiunta con successo  
🎉 SCRIPT COMPLETATO CON SUCCESSO!
```

### STEP 4: Test Applicazione
1. Ricarica l'app: http://localhost:3000
2. Accedi come sopralluoghista
3. Prova a:
   - ✅ Creare una nota in "Note Personali" 
   - ✅ Cambiare password in "Impostazioni"
   - ✅ Verificare icone 🔴 invece di ❓

## 🔧 COSA FA LO SCRIPT:

### Tabella Note Personali
- Crea tabella `note_personali` con tutti i campi necessari
- Imposta relazioni e indici per performance
- Configura Row Level Security per privacy
- Solo l'utente proprietario può vedere/modificare le sue note

### Fix Cambio Password
- Aggiunge colonna `password_changed_at` alla tabella `users`
- Imposta trigger automatici per timestamp
- Inizializza date esistenti

### Sicurezza
- Policies RLS complete
- Trigger automatici per `updated_at`
- Relazioni foreign key corrette

## ⚠️ IMPORTANTE:
- Lo script è **SICURO** (usa `IF NOT EXISTS`)
- Non cancella dati esistenti  
- Puoi eseguirlo più volte senza problemi
- Tutte le operazioni sono reversibili

---

**Una volta eseguito lo script, riprova le funzionalità che davano errore!** 🎯