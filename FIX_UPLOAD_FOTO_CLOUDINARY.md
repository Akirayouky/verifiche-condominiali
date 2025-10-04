# 🔧 Fix Errore Upload Foto - Configurazione Cloudinary

## ❌ Problema
**Errore**: "Alcune foto non sono state caricate correttamente"

**Causa**: Le credenziali Cloudinary nel file `.env.local` sono placeholder e non funzionano:
```bash
CLOUDINARY_API_KEY=your-api-key-here          ← ❌ PLACEHOLDER
CLOUDINARY_API_SECRET=your-api-secret-here    ← ❌ PLACEHOLDER
```

---

## ✅ Soluzione: Configura Cloudinary

### Passo 1: Ottieni le Credenziali

1. **Vai su Cloudinary**:
   - Se hai già un account: [cloudinary.com/console](https://cloudinary.com/console)
   - Se non ce l'hai: [Registrati gratis](https://cloudinary.com/users/register/free) (25 GB gratuiti)

2. **Dashboard → Programmable Media → API Keys**:
   ```
   Cloud Name: condomini-app (o il tuo)
   API Key: 123456789012345 (numero lungo)
   API Secret: AbCdEfGhIjKlMnOpQrStUvWxYz (stringa alfanumerica)
   ```

3. **Copia le credenziali**

### Passo 2: Aggiorna .env.local

Apri `/Users/akirayouky/Desktop/Siti/Condomini/.env.local` e sostituisci:

```bash
# Cloudinary Configuration per gestione foto
CLOUDINARY_CLOUD_NAME=condomini-app                    ← Tuo Cloud Name
CLOUDINARY_API_KEY=123456789012345                     ← Tua API Key reale
CLOUDINARY_API_SECRET=AbCdEfGhIjKlMnOpQrStUvWxYz       ← Tuo API Secret reale
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=condomini-app       ← Tuo Cloud Name
```

**Importante**: Usa le TUE credenziali reali di Cloudinary!

### Passo 3: Riavvia il Server

```bash
# Ferma il server (Ctrl+C)
# Riavvia
npm run dev
```

Le nuove variabili d'ambiente verranno caricate.

### Passo 4: Testa Upload

1. Apri il wizard verifica/lavorazione
2. Carica una foto
3. **Verifica console browser** (F12):
   ```
   📤 API Upload foto - Start
   📷 Uploading 1 foto per lavorazione temp-...
   📤 Uploading foto to Cloudinary: {...}
   ✅ Foto uploaded successfully: https://res.cloudinary.com/...
   ```

Se vedi `✅ Foto uploaded successfully`, funziona! 🎉

---

## 🔍 Debugging

### Controlla Configurazione

Aggiungi questo endpoint temporaneo per verificare la config:

**`src/app/api/test-cloudinary/route.ts`**:
```typescript
import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

export async function GET() {
  return NextResponse.json({
    configured: {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'MISSING',
      api_key: process.env.CLOUDINARY_API_KEY ? '✅ SET' : '❌ MISSING',
      api_secret: process.env.CLOUDINARY_API_SECRET ? '✅ SET' : '❌ MISSING',
    }
  })
}
```

Poi testa:
```bash
curl http://localhost:3000/api/test-cloudinary
```

Dovresti vedere:
```json
{
  "configured": {
    "cloud_name": "condomini-app",
    "api_key": "✅ SET",
    "api_secret": "✅ SET"
  }
}
```

### Errori Comuni

**1. "Missing required parameter - file"**
- Problema: Base64 non valido
- Soluzione: Verifica che inizi con `data:image/jpeg;base64,`

**2. "Invalid API Key"**
- Problema: API Key sbagliata
- Soluzione: Ri-copia dalla dashboard Cloudinary

**3. "Upload preset not found"**
- Problema: Non serve upload preset (usiamo authenticated)
- Soluzione: Le credenziali API_KEY e API_SECRET sono sufficienti

---

## 🚀 Piano B: Storage Locale Temporaneo

Se Cloudinary ti da problemi, posso implementare uno storage locale temporaneo:

```typescript
// Salva foto in public/uploads/{lavorazioneId}/
// URL: http://localhost:3000/uploads/{id}/foto-0.jpg
```

**Pro**: Funziona subito
**Contro**: Non scalabile, foto non su CDN, occupano spazio server

Vuoi che implementi questa soluzione alternativa?

---

## 📊 Verifica Account Cloudinary

Dopo aver configurato, controlla:

1. **Dashboard Cloudinary** → **Media Library**
2. Dovresti vedere cartella: `condomini-app/lavorazioni/`
3. Dentro ogni lavorazione: le foto caricate

Se vedi le foto lì, significa che funziona! ✅

---

## ⚠️ Sicurezza

**IMPORTANTE**: Non committare mai le credenziali Cloudinary!

Il file `.env.local` è già in `.gitignore`, ma verifica:

```bash
# Verifica che .env.local NON sia tracciato
git status

# Se appare .env.local, aggiungilo a .gitignore
echo ".env.local" >> .gitignore
git add .gitignore
git commit -m "🔒 Ignora credenziali .env.local"
```

---

## ✅ Checklist Risoluzione

- [ ] Registrato/loggato su Cloudinary
- [ ] Copiato Cloud Name, API Key, API Secret
- [ ] Aggiornato `.env.local` con credenziali reali
- [ ] Riavviato server Next.js (`npm run dev`)
- [ ] Testato upload foto
- [ ] Verificato foto su Cloudinary Dashboard
- [ ] Verificato che `.env.local` sia in `.gitignore`

---

*Se continui ad avere problemi dopo aver configurato le credenziali, fammi vedere l'errore esatto dalla console!*
