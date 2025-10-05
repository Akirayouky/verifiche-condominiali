# Sistema QR Code per Condomini

## 📋 Panoramica

Il sistema QR code permette di identificare rapidamente i condomini tramite scansione con fotocamera durante:
- Creazione di nuove verifiche
- Apertura verifiche da parte dei sopralluoghisti
- Gestione anagrafica condomini

## 🔧 Setup Iniziale

### 1. Esegui lo script SQL su Supabase

```bash
# Apri Supabase Dashboard → SQL Editor
# Copia e incolla il contenuto di SETUP_QR_CODE_AUTO.sql
# Esegui lo script
```

Lo script esegue:
- ✅ Aggiunge colonna `qr_code` alla tabella `condomini`
- ✅ Genera QR code per tutti i condomini esistenti
- ✅ Crea trigger automatico per nuovi condomini
- ✅ Crea indice per ottimizzare le ricerche

### 2. Verifica il Setup

Dopo aver eseguito lo script, verifica che funzioni:

```sql
-- Controlla che tutti i condomini abbiano un QR code
SELECT 
  COUNT(*) as totale,
  COUNT(qr_code) as con_qr,
  COUNT(*) - COUNT(qr_code) as senza_qr
FROM condomini;

-- Dovrebbe mostrare: totale = con_qr (tutti hanno QR code)
```

## 🚀 Come Funziona

### Creazione Automatica

Quando crei un nuovo condominio, il QR code viene generato automaticamente in 2 modi:

**1. Via API (Next.js)**
```typescript
// src/app/api/condomini/route.ts
const qrCode = `COND-${crypto.randomUUID()}`
const condominioData = {
  nome: nome.trim(),
  qr_code: qrCode  // ← Generato automaticamente
}
```

**2. Via Database Trigger (Supabase)**
```sql
-- Se l'API non fornisce il QR code, il trigger lo genera
CREATE TRIGGER trigger_generate_qr_code
  BEFORE INSERT ON condomini
  FOR EACH ROW
  EXECUTE FUNCTION generate_qr_code_for_condominio();
```

**Risultato:** Ogni condominio ha sempre un QR code univoco!

### Utilizzo nel Codice

**1. Visualizzazione QR Code (Admin)**
```typescript
// src/components/condomini/CondominioTable.tsx
{condominio.qr_code && (
  <button onClick={() => setShowQrModal(condominio)}>
    📷 {/* Mostra QR code */}
  </button>
)}

// Modal con QR code stampabile
<QrCodeGenerator 
  value={condominio.qr_code}
  label={condominio.nome}
/>
```

**2. Scansione QR Code (Sopralluoghista)**
```typescript
// src/components/user/PannelloUtente.tsx
<QrScanner 
  onScan={async (qrCode) => {
    // Trova condominio dal QR code
    const condominio = condomini.find(c => c.qr_code === qrCode)
    if (condominio) {
      // Apri verifica per questo condominio
      openVerificaForCondominio(condominio)
    }
  }}
/>
```

**3. Selezione Rapida (Wizard Verifiche)**
```typescript
// src/components/verifiche/WizardSteps.tsx
<QrScanner 
  onScan={(qrCode) => {
    const condominio = condominioAttivi.find(c => c.qr_code === qrCode)
    if (condominio) {
      setSelectedCondominio(condominio)
      setShowQrScanner(false)
    }
  }}
/>
```

## 📱 Workflow Utente

### Admin - Stampa QR Code

1. Login come **Kamia** (Admin)
2. Vai su **Condomini**
3. Clicca **📷** su un condominio
4. Appare modal con QR code
5. Clicca **📄 Stampa** o **💾 Scarica**
6. Attacca QR code stampato all'ingresso del condominio

### Sopralluoghista - Scansiona QR Code

1. Login come **Sopralluoghista**
2. Dashboard → **📷 Scansiona QR**
3. Inquadra QR code del condominio
4. Si apre automaticamente l'ultima verifica
5. Compila e invia

### Admin - Crea Verifica con QR

1. Login come **Kamia** (Admin)
2. Vai su **Nuova Verifica**
3. Step 1: Clicca **📷 Scansiona QR Code**
4. Inquadra QR code del condominio
5. Condominio selezionato automaticamente
6. Prosegui con wizard

## 🔄 Reset Database

**Problema Risolto:** Dopo il reset del database, i QR code venivano persi.

**Soluzione:** Con il trigger automatico, ogni condominio ricreato ha subito il suo QR code.

```typescript
// src/app/api/dev/reset-database/route.ts
// Quando resetti i condomini:
await supabase.from('condomini').delete()

// E poi ne crei di nuovi:
await supabase.from('condomini').insert([
  { nome: 'Condominio Test 1' }  // ← QR code generato dal trigger!
])
```

## 🛠️ Troubleshooting

### Problema: QR code mancanti

```sql
-- Controlla quanti condomini non hanno QR code
SELECT COUNT(*) FROM condomini WHERE qr_code IS NULL;

-- Se ci sono condomini senza QR code, generali:
UPDATE condomini 
SET qr_code = 'COND-' || gen_random_uuid()::text 
WHERE qr_code IS NULL;
```

### Problema: QR code duplicati

```sql
-- Verifica unicità (dovrebbe essere 0)
SELECT qr_code, COUNT(*) 
FROM condomini 
WHERE qr_code IS NOT NULL
GROUP BY qr_code 
HAVING COUNT(*) > 1;

-- Se ci sono duplicati, rigenera:
UPDATE condomini 
SET qr_code = 'COND-' || gen_random_uuid()::text 
WHERE id IN (
  SELECT id FROM condomini 
  WHERE qr_code IN (
    SELECT qr_code FROM condomini 
    WHERE qr_code IS NOT NULL
    GROUP BY qr_code HAVING COUNT(*) > 1
  )
);
```

### Problema: Trigger non funziona

```sql
-- Verifica che il trigger esista
SELECT * FROM pg_trigger WHERE tgname = 'trigger_generate_qr_code';

-- Se non esiste, esegui nuovamente SETUP_QR_CODE_AUTO.sql
```

## 📊 Statistiche QR Code

```sql
-- Condomini con QR code
SELECT 
  COUNT(*) as totale_condomini,
  COUNT(qr_code) as con_qr_code,
  ROUND(COUNT(qr_code)::numeric / COUNT(*)::numeric * 100, 2) as percentuale
FROM condomini;

-- QR code più recenti
SELECT 
  nome,
  qr_code,
  data_inserimento,
  AGE(NOW(), data_inserimento) as eta
FROM condomini
WHERE qr_code IS NOT NULL
ORDER BY data_inserimento DESC
LIMIT 10;
```

## 🎯 Best Practices

1. **Esegui setup iniziale:** Prima di usare il sistema, esegui `SETUP_QR_CODE_AUTO.sql` su Supabase
2. **Non modificare QR code manualmente:** Lascia che il sistema li generi automaticamente
3. **Stampa QR code in PDF:** Usa il pulsante "Stampa" per avere QR code ad alta qualità
4. **Test prima del deploy:** Dopo il setup, crea un condominio di test e verifica che abbia QR code
5. **Backup:** I QR code sono nel database, quindi il backup Supabase li include automaticamente

## 📝 Formato QR Code

```
Formato: COND-{UUID}
Esempio: COND-550e8400-e29b-41d4-a716-446655440000

Caratteristiche:
- Prefisso: COND-
- Identificatore: UUID v4 (36 caratteri)
- Lunghezza totale: 41 caratteri
- Univoco: Garantito da UUID + vincolo UNIQUE nel database
- Leggibile: Prefisso COND- facilita debug
```

## 🔐 Sicurezza

- ✅ QR code sono pubblici (non contengono dati sensibili)
- ✅ Servono solo per identificazione rapida
- ✅ L'autenticazione rimane separata (login necessario)
- ✅ Non è possibile accedere ai dati solo con QR code
- ✅ Vincolo UNIQUE previene duplicati

## 🚀 Future Enhancements

Possibili miglioramenti futuri:

1. **Analytics:** Traccia quante volte un QR code viene scansionato
2. **Scadenza:** QR code temporanei con data di scadenza
3. **Batch Print:** Stampa tutti i QR code in un unico PDF
4. **Mobile App:** App dedicata per scansione più veloce
5. **NFC:** Aggiungi supporto per tag NFC come alternativa ai QR code

## 📞 Supporto

Se hai problemi con i QR code:

1. Verifica che `SETUP_QR_CODE_AUTO.sql` sia stato eseguito
2. Controlla i log del browser (Console → Network)
3. Verifica permessi fotocamera (HTTPS richiesto)
4. Testa con un QR code stampato (non da schermo)
5. Usa il pannello Dev per reset database se necessario

---

**Ultimo aggiornamento:** 5 ottobre 2025
**Versione:** 1.0.0
**Autore:** Sistema Verifiche Condominiali
