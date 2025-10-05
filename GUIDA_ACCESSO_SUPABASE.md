# 🔐 GUIDA ACCESSO SUPABASE - Soluzioni Alternative

## ❌ Problema
Login con GitHub problematico: codice 2FA arriva in ritardo e rimanda a GitHub invece di Supabase.

---

## ✅ **SOLUZIONE 1: Login con Email/Password** (Consigliato - 2 minuti)

### Se hai già un account Supabase:

1. **Vai su**: https://supabase.com
2. **Click su**: "Sign In" (in alto a destra)
3. **NON cliccare** su "Continue with GitHub"
4. **Invece, cerca** il link piccolo: **"Sign in with email"** o **"Use email instead"**
5. Inserisci **email e password**
6. Se non ricordi la password → Click **"Forgot password?"**
7. Ricevi email istantanea per reset password
8. Imposta nuova password
9. Accedi → SQL Editor → Esegui `SETUP_STATO_RIAPERTA.sql`

**✅ Fatto!**

---

## ✅ **SOLUZIONE 2: Crea Nuovo Account con Email** (3 minuti)

Se non ricordi email/password dell'account esistente:

### Step 1: Nuovo Account
1. Vai su https://supabase.com
2. Click **"Start your project"**
3. **NON usare** "Continue with GitHub"
4. Scegli **"Sign up with email"**
5. Inserisci email e password
6. Conferma email
7. Accedi

### Step 2: Accedi al Progetto Esistente
1. L'URL del tuo progetto è: `https://ygvlcikgzkoaxlrmwsnv.supabase.co`
2. Il progetto potrebbe essere sotto un altro account
3. **OPZIONE A**: Se sei "Owner" ma non vedi il progetto:
   - Contatta supporto Supabase con l'URL del progetto
   
4. **OPZIONE B**: Crea nuovo progetto e migra dati (vedi Soluzione 3)

---

## ✅ **SOLUZIONE 3: Crea Nuovo Progetto Supabase** (10 minuti)

Se non riesci ad accedere al progetto esistente, creane uno nuovo:

### Step 1: Nuovo Progetto
1. Login su Supabase (con email, non GitHub)
2. Click **"New Project"**
3. Nome progetto: `verifiche-condominiali-new`
4. Password database: (salvala!)
5. Region: Europe (più vicina)
6. Piano: Free
7. Click **"Create new project"**
8. Attendi 2 minuti (setup automatico)

### Step 2: Esegui Script di Setup
Esegui questi script in ordine nel SQL Editor:

```sql
-- 1. SETUP_QR_CODE_AUTO.sql (per QR code automatici)
-- 2. Eventuali altri script che hai già eseguito prima
-- 3. SETUP_STATO_RIAPERTA.sql (per sistema riapertura)
```

### Step 3: Aggiorna Credenziali
1. Nel nuovo progetto, vai su **Settings → API**
2. Copia:
   - Project URL
   - anon public key

3. Aggiorna `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://[TUO-NUOVO-PROGETTO].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[TUA-NUOVA-KEY]
```

4. Riavvia server: `npm run dev`

**✅ Sistema funzionante con nuovo database!**

---

## ✅ **SOLUZIONE 4: Usa Supabase CLI** (Avanzato - 5 minuti)

Se hai accesso al progetto ma non riesci a loggarti via web:

### Installa CLI
```bash
npm install -g supabase
```

### Login
```bash
# Questo usa email/password, NON GitHub
supabase login
```

### Connetti al Progetto
```bash
supabase link --project-ref ygvlcikgzkoaxlrmwsnv
```

### Esegui Script SQL
```bash
supabase db push --file SETUP_STATO_RIAPERTA.sql
```

**✅ Fatto!**

---

## 🎯 **CONSIGLIO IMMEDIATO**

**Prova Soluzione 1** per prima:
1. https://supabase.com
2. Click "Sign In"
3. Cerca link **"Sign in with email"** (di solito sotto il bottone GitHub)
4. Inserisci email
5. Se non ricordi password → "Forgot password?" (email istantanea)

**Se non funziona entro 5 minuti → Vai a Soluzione 3** (nuovo progetto, più veloce)

---

## 📧 Recupero Email Account

Se non ricordi quale email hai usato, controlla:
- Email personale principale
- Email di lavoro  
- Email GitHub (guarda su https://github.com/settings/emails)
- Cerca "Supabase" nella tua casella email per trovare email di conferma vecchie

---

## 🆘 SUPPORTO SUPABASE

Se niente funziona:
- Twitter: @supabase (risposta veloce)
- Discord: https://discord.supabase.com
- Email: support@supabase.com

Fornisci:
- URL progetto: `https://ygvlcikgzkoaxlrmwsnv.supabase.co`
- Problema: "Cannot access project, GitHub login redirects to GitHub"

---

## 🚀 ALTERNATIVA RAPIDA

**Se hai fretta di testare**, posso creare un **workaround temporaneo** che:
- Disabilita la funzione "Riapri" nel frontend
- Permette di testare tutto il resto
- Riattivi la funzione dopo aver sistemato Supabase

Vuoi che lo faccia? (5 minuti)

---

**Quale soluzione vuoi provare?**
1. Login email Supabase
2. Nuovo progetto Supabase  
3. Supabase CLI
4. Workaround temporaneo

Dimmi e ti guido! 🚀
