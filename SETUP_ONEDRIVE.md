# 🔷 Setup OneDrive per Foto Lavorazioni

## 🎯 Panoramica

Implementazione completa per salvare le foto delle lavorazioni su **OneDrive** usando Microsoft Graph API.

**Vantaggi**:
- ✅ **1 TB** storage incluso (Microsoft 365 Family)
- ✅ CDN Microsoft globale
- ✅ Thumbnail automatici
- ✅ Sync automatico su tutti i dispositivi
- ✅ Backup integrato Microsoft
- ✅ Zero costi aggiuntivi

---

## 📋 Prerequisiti

- Account Microsoft 365 (hai già Family)
- Accesso ad Azure Portal
- 15 minuti per setup iniziale

---

## 🚀 Setup Passo-Passo

### 1️⃣ Registra App su Azure Portal

1. **Vai su [Azure Portal](https://portal.azure.com/)**
   - Accedi con il tuo account Microsoft 365

2. **Azure Active Directory** → **App registrations** → **New registration**

3. **Compila il form**:
   ```
   Nome: Condomini Verifiche App
   Account types: Single tenant
   Redirect URI: (lascia vuoto per ora)
   ```

4. **Clicca "Register"**

5. **Copia questi valori** dalla pagina Overview:
   ```
   Application (client) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   Directory (tenant) ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

### 2️⃣ Crea Client Secret

1. Nel menu laterale: **Certificates & secrets** → **Client secrets** → **New client secret**

2. **Compila**:
   ```
   Description: Condomini App Secret
   Expires: 24 months (o 12 mesi)
   ```

3. **Clicca "Add"**

4. **IMPORTANTE**: Copia subito il **Value** (segreto)
   ```
   Secret Value: ABC123...xyz (lunga stringa)
   ```
   ⚠️ **Non potrai più vederlo dopo!** Salvalo in un posto sicuro.

### 3️⃣ Configura Permessi API

1. Nel menu laterale: **API permissions** → **Add a permission**

2. **Seleziona**: **Microsoft Graph** → **Application permissions**

3. **Aggiungi questi permessi**:
   ```
   ✅ Files.ReadWrite.All
   ✅ User.Read.All
   ```

4. **Clicca "Add permissions"**

5. **IMPORTANTE**: Clicca **"Grant admin consent"** (conferma con admin)
   - Stato deve diventare ✅ verde "Granted"

### 4️⃣ Configura .env.local

Apri `/Users/akirayouky/Desktop/Siti/Condomini/.env.local` e aggiungi:

```bash
# Microsoft OneDrive Configuration
MICROSOFT_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx     ← Directory (tenant) ID
MICROSOFT_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx     ← Application (client) ID
MICROSOFT_CLIENT_SECRET=ABC123...xyz                          ← Client Secret Value
```

**Sostituisci con i TUOI valori reali!**

### 5️⃣ Riavvia Server

```bash
# Ferma server (Ctrl+C)
# Riavvia
npm run dev
```

### 6️⃣ Testa Connessione

Apri nel browser:
```
http://localhost:3000/api/test-onedrive
```

Dovresti vedere:
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

Se vedi `"success": true`, sei a posto! 🎉

---

## 🔧 Aggiorna Wizard per Usare OneDrive

Ora che OneDrive è configurato, aggiorna il wizard:

**File**: `src/components/verifiche/WizardSteps.tsx`

```typescript
// Sostituisci import
- import FotoUploadCloud from '@/components/ui/FotoUploadCloud'
+ import FotoUploadOneDrive from '@/components/ui/FotoUploadOneDrive'

// Nel case 'foto':
- <FotoUploadCloud
+ <FotoUploadOneDrive
    value={value || []}
    onChange={(foto) => handleFieldChange(campo, foto)}
    lavorazioneId={lavorazioneId || `temp-${Date.now()}`}
    maxFoto={campo.maxFoto || 5}
    required={campo.obbligatorio}
    nome={campo.nome}
  />
```

---

## 📁 Struttura OneDrive

Le foto vengono organizzate così:

```
OneDrive/
└── Apps/
    └── CondominieApp/
        └── lavorazioni/
            ├── abc-123-def-456/          ← ID lavorazione
            │   ├── foto-0-1696435200000.jpg
            │   ├── foto-1-1696435201000.jpg
            │   └── foto-2-1696435202000.jpg
            └── xyz-789-ghi-012/
                ├── foto-0-1696435300000.jpg
                └── foto-1-1696435301000.jpg
```

**Percorso**: `OneDrive/Apps/CondominieApp/lavorazioni/{lavorazione-id}/`

---

## 🧪 Test Completo

### Test 1: Upload Foto

1. Apri wizard verifica/lavorazione
2. Vai allo step foto
3. Carica 2-3 foto
4. **Verifica console browser** (F12):
   ```
   📤 Uploading foto to OneDrive... {lavorazioneId: "...", count: 3}
   📁 Creando cartella lavorazione su OneDrive...
   📤 Uploading foto to OneDrive: {...}
   ✅ Foto uploaded to OneDrive: file-id-123
   ✅ Foto uploaded successfully to OneDrive: [...]
   ```

### Test 2: Verifica OneDrive

1. Apri **[OneDrive Web](https://onedrive.live.com/)**
2. Naviga: **Apps** → **CondominieApp** → **lavorazioni**
3. Dovresti vedere le cartelle con ID lavorazione
4. Dentro: le foto caricate

### Test 3: PDF con Foto

1. Completa lavorazione
2. Genera PDF
3. Le foto dovrebbero essere visibili (scaricate da OneDrive)

---

## 🔍 Troubleshooting

### Errore: "AADSTS7000215: Invalid client secret"
**Soluzione**: Client Secret sbagliato o scaduto
- Genera nuovo secret in Azure Portal
- Aggiorna `.env.local`
- Riavvia server

### Errore: "Forbidden" o "Access denied"
**Soluzione**: Permessi non granted
- Vai su Azure Portal → API permissions
- Clicca "Grant admin consent for [tenant]"
- Aspetta 5 minuti che si propaghino

### Errore: "The specified path does not exist"
**Soluzione**: Cartella non creata
- L'app crea automaticamente la cartella
- Verifica che l'account abbia OneDrive attivo

### Upload lento
**Soluzione**: OneDrive API può essere più lento di Cloudinary
- Considera di ridurre dimensione foto (già fatto: max 1920px)
- Upload avviene in background, non blocca UI

---

## 📊 Limiti OneDrive

| Limite | Valore | Note |
|--------|--------|------|
| Storage totale | 1 TB | Con Microsoft 365 Family |
| File size max | 250 GB | Più che sufficiente per foto |
| Upload rate | ~4 MB/s | Dipende da connessione |
| API calls | 100.000/ora | Ampiamente sufficiente |

---

## 🔒 Sicurezza

**Link di condivisione**:
- Tipo: `view` (solo visualizzazione)
- Scope: `anonymous` (no login richiesto)
- Link univoco e difficile da indovinare
- Puoi revocare accesso da OneDrive

**Client Secret**:
- ⚠️ **MAI** committare in Git
- Conserva in `.env.local` (già in `.gitignore`)
- Ruota ogni 12-24 mesi

**Permessi App**:
- Solo `Files.ReadWrite.All` (necessario per upload)
- `User.Read.All` (solo per info utente)

---

## 🔄 Backup e Sync

**Vantaggi OneDrive**:
- ✅ Sync automatico su PC/Mac/Mobile
- ✅ Versioning file (recupero versioni precedenti)
- ✅ Cestino (recupero file eliminati per 30 giorni)
- ✅ Backup integrato Microsoft
- ✅ Accesso offline (OneDrive sync client)

**Nessuna configurazione extra necessaria!**

---

## 📝 Confronto Cloudinary vs OneDrive

| Aspetto | Cloudinary | OneDrive |
|---------|-----------|----------|
| **Storage** | 25 GB gratis | 1 TB incluso |
| **Setup** | API Keys semplici | Azure App Registration |
| **Upload speed** | Molto veloce | Buono (4 MB/s) |
| **CDN** | Globale ottimizzato | Microsoft CDN |
| **Thumbnails** | Automatici + transformations | Automatici |
| **Costo** | Gratis fino a 25 GB | Incluso in M365 |
| **Sync** | No | Si (tutti dispositivi) |
| **Backup** | Si (cloud) | Si (Microsoft) |

**Conclusione**: OneDrive è perfetto per il tuo caso! 🎯

---

## ✅ Checklist Finale

- [ ] App registrata su Azure Portal
- [ ] Client ID, Tenant ID, Client Secret copiati
- [ ] Permessi API configurati e granted
- [ ] `.env.local` aggiornato con credenziali reali
- [ ] Server riavviato
- [ ] Test connessione: `/api/test-onedrive` ritorna success
- [ ] WizardSteps aggiornato con `FotoUploadOneDrive`
- [ ] Test upload foto funzionante
- [ ] Foto visibili su OneDrive Web
- [ ] PDF genera correttamente con foto

---

## 🚀 Prossimi Passi

Dopo il setup:

1. **Testa upload** - Carica alcune foto di test
2. **Verifica OneDrive** - Controlla che le cartelle si creino
3. **Genera PDF** - Verifica che le foto siano visibili
4. **Migra dati vecchi** (opzionale) - Script per migrare foto da Cloudinary/Base64

---

**Hai tutto! Segui i passi e in 15 minuti OneDrive è operativo!** 🎉

*Se hai problemi durante il setup, fammi sapere!*
