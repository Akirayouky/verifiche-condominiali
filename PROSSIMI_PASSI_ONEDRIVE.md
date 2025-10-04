# 🎯 PROSSIMI PASSI - Setup OneDrive

## ✅ Completato

1. **Installazione SDK**: ✅ Microsoft Graph Client + Azure Identity
2. **Libreria OneDrive**: ✅ `src/lib/onedrive.ts` con 7 funzioni
3. **API Endpoint**: ✅ `/api/upload-foto-onedrive` + `/api/test-onedrive`
4. **Componente React**: ✅ `FotoUploadOneDrive.tsx` completo
5. **Integrazione Wizard**: ✅ WizardSteps aggiornato con OneDrive
6. **Documentazione**: ✅ `SETUP_ONEDRIVE.md` guida completa
7. **Template .env**: ✅ Aggiornato con variabili Microsoft

---

## 🚀 DA FARE ADESSO (15 minuti)

### 1. Registra App su Azure Portal

🔗 **Vai su**: https://portal.azure.com

**Passi**:
1. Login con account Microsoft 365
2. **Azure Active Directory** → **App registrations** → **New registration**
3. Nome: `Condomini Verifiche App`
4. Account types: `Single tenant`
5. Clicca **Register**
6. **COPIA** dalla pagina Overview:
   - `Application (client) ID`
   - `Directory (tenant) ID`

### 2. Crea Client Secret

**Passi**:
1. Menu laterale: **Certificates & secrets**
2. **Client secrets** → **New client secret**
3. Description: `Condomini App Secret`
4. Expires: `24 months`
5. Clicca **Add**
6. **⚠️ COPIA SUBITO** il **Value** (non potrai più vederlo!)

### 3. Configura Permessi API

**Passi**:
1. Menu laterale: **API permissions**
2. **Add a permission** → **Microsoft Graph** → **Application permissions**
3. Aggiungi:
   - ✅ `Files.ReadWrite.All`
   - ✅ `User.Read.All`
4. Clicca **Add permissions**
5. **⚠️ IMPORTANTE**: Clicca **"Grant admin consent for [tenant]"**
6. Verifica che lo stato sia ✅ verde "Granted"

### 4. Aggiorna .env.local

Apri `.env.local` e **sostituisci** con i TUOI valori:

```bash
# Microsoft OneDrive Configuration
MICROSOFT_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx     ← Directory (tenant) ID
MICROSOFT_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx     ← Application (client) ID
MICROSOFT_CLIENT_SECRET=ABC123...xyz                          ← Client Secret Value
```

### 5. Riavvia Server

```bash
# Ferma server (Ctrl+C nel terminale)
# Riavvia
npm run dev
```

### 6. Testa Connessione

Apri nel browser:
```
http://localhost:3000/api/test-onedrive
```

**Output atteso**:
```json
{
  "success": true,
  "message": "✅ OneDrive configurato correttamente!",
  "user": {
    "displayName": "Tuo Nome",
    "email": "tuo@email.com"
  }
}
```

Se vedi `"success": true`, **CE L'HAI FATTA!** 🎉

---

## 🧪 Test Upload Foto

1. Vai sul wizard verifica/lavorazione
2. Step foto → Carica 2-3 foto
3. **Controlla console browser** (F12):
   ```
   📤 Uploading foto to OneDrive...
   ✅ Foto uploaded successfully to OneDrive
   ```
4. Vai su [OneDrive Web](https://onedrive.live.com/)
5. Naviga: **Apps** → **CondominieApp** → **lavorazioni**
6. Verifica che ci siano le foto!

---

## 🐛 Troubleshooting

### Errore: "Invalid client secret"
❌ **Problema**: Client Secret sbagliato
✅ **Soluzione**: 
- Genera nuovo secret in Azure Portal
- Aggiorna `.env.local`
- Riavvia server

### Errore: "Access denied"
❌ **Problema**: Permessi non granted
✅ **Soluzione**:
- Azure Portal → API permissions
- Clicca "Grant admin consent"
- Aspetta 5 minuti

### Errore: "MICROSOFT_TENANT_ID not found"
❌ **Problema**: `.env.local` non configurato
✅ **Soluzione**:
- Verifica che `.env.local` abbia i 3 valori
- Verifica che non ci sia `.env.local.example`
- Riavvia server

---

## 📖 Documentazione Completa

Per maggiori dettagli, leggi:
- **SETUP_ONEDRIVE.md** - Guida completa setup
- **README.md** - Documentazione progetto

---

## ✅ Checklist Finale

Prima di considerare il setup completo:

- [ ] App registrata su Azure Portal
- [ ] Client ID, Tenant ID, Client Secret copiati
- [ ] Permessi API configurati e granted (✅ verde)
- [ ] `.env.local` aggiornato con credenziali REALI
- [ ] Server riavviato (`npm run dev`)
- [ ] Test endpoint ritorna `"success": true`
- [ ] Upload foto funzionante nel wizard
- [ ] Foto visibili su OneDrive Web
- [ ] PDF genera correttamente con foto

---

**Tempo stimato**: 15 minuti ⏱️

**Hai tutto ciò che serve! Segui i passi e OneDrive sarà operativo!** 🚀

*In caso di problemi, fammi sapere quale errore ottieni!*
