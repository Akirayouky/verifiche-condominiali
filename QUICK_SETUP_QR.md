# 🚀 Setup Rapido QR Code

## ⚡ Setup in 2 Minuti

### 1️⃣ Apri Supabase

```
https://supabase.com/dashboard
→ Il tuo progetto
→ SQL Editor
→ New Query
```

### 2️⃣ Copia e Incolla

Copia **tutto** il contenuto di `SETUP_QR_CODE_AUTO.sql` e incollalo nell'editor SQL.

### 3️⃣ Esegui

Clicca **Run** (o premi `Ctrl+Enter` / `Cmd+Enter`)

### 4️⃣ Verifica

Dovresti vedere un output simile a:

```
✅ Colonna qr_code aggiunta
✅ Indice creato
✅ X condomini aggiornati con QR code
✅ Funzione creata
✅ Trigger creato
```

E una tabella con i primi 10 condomini che ora hanno il QR code.

## ✅ Fatto!

Ora:
- ✅ Tutti i condomini esistenti hanno un QR code
- ✅ Ogni nuovo condominio avrà automaticamente un QR code
- ✅ Anche dopo reset database, i QR code vengono generati automaticamente
- ✅ Puoi stampare/scansionare QR code dal pannello admin

## 🧪 Test Rapido

1. Login come **Kamia** (Admin)
2. Vai su **Condomini**
3. Clicca **📷** su un condominio
4. Dovresti vedere il QR code!

Se non vedi il pulsante 📷, ripeti il setup.

## 📚 Documentazione Completa

Per maggiori dettagli, leggi `DOCS_QR_CODE_SYSTEM.md`

---

**Tempo totale:** ~2 minuti ⚡
