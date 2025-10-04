# 📱 GUIDA TEST FUNZIONALITÀ MOBILE PWA

## 🚀 Setup Iniziale

1. **Server avviato**: http://localhost:3000 ✅
2. **Browser consigliato**: Chrome/Safari (per Web Speech API e GPS)
3. **Permessi richiesti**: 
   - 🎤 Microfono (per voice-to-text)
   - 📍 Geolocalizzazione (per GPS foto)

---

## ✅ TEST 1: FIRMA DIGITALE ✍️

### Come testare:
1. Apri: http://localhost:3000
2. Accedi come **utente sopralluoghista** (non admin)
3. Clicca su **"Nuova Verifica"** nel menu utente
4. Completa **Step 1**: Seleziona condominio + tipologia verifica
5. Completa **Step 2**: Compila campi obbligatori
6. Clicca **"Avanti"** → arrivi a **Step 3: Riepilogo**
7. Scorri verso il basso fino alla sezione **"✍️ Firma Digitale"**
8. Clicca sul box tratteggiato **"Aggiungi Firma Digitale"**

### Cosa aspettarsi:
- ✅ Si apre un canvas bianco per firmare
- ✅ Puoi disegnare con mouse o touch
- ✅ Pulsanti: **🗑️ Pulisci** | **❌ Annulla** | **✅ Salva Firma**
- ✅ Dopo salvataggio vedi preview della firma
- ✅ Pulsante **"Rifirma"** per cambiare

### Verifica backend:
```javascript
// Console browser (F12) dopo click "✅ Completa Verifica":
// Dovresti vedere:
✍️ Firma caricata: https://[...].vercel-storage.com/firme/[...]
```

---

## ✅ TEST 2: VOICE-TO-TEXT 🎤

### Come testare:
1. Sempre nello **Step 3** del wizard
2. Guarda la sezione **"Note Aggiuntive 🎤"**
3. Clicca sul pulsante **🎤 rosso** accanto alla textarea

### Cosa aspettarsi:
- ✅ Browser chiede permesso microfono (concedi)
- ✅ Pulsante diventa **rosso pulsante** (sta ascoltando)
- ✅ Parla in italiano: "Questa è una prova di trascrizione vocale"
- ✅ Il testo appare automaticamente nella textarea
- ✅ Clicca di nuovo sul microfono per fermare

### Verifica:
```javascript
// Console browser (F12):
🎤 Speech recognition started
🎤 Transcript: questa è una prova di trascrizione vocale
```

---

## ✅ TEST 3: GPS FOTO-LOCALIZZATE 📍

### Come testare:
1. Nello **Step 2** del wizard
2. Cerca un campo di tipo **"Foto Multiple"** (es. "Foto Impianto")
3. Clicca su **"📷 Scatta/Carica Foto"**
4. Browser chiede permesso GPS (concedi)
5. Seleziona una foto dal dispositivo

### Cosa aspettarsi:
- ✅ Console mostra: `📍 GPS catturato: lat=XX.XXXX, lon=YY.YYYY`
- ✅ Foto viene caricata normalmente
- ✅ GPS metadata salvato insieme alla foto

### Verifica backend:
```javascript
// Console browser (F12) durante upload:
📍 GPS catturato: { latitude: 45.xxxx, longitude: 9.xxxx, accuracy: 20 }
📸 Foto caricata con GPS: https://[...].vercel-storage.com/[...]
```

### 🚨 Note:
- GPS funziona solo su **HTTPS** o **localhost**
- Serve **permesso geolocalizzazione** attivo
- Timeout: 10 secondi (se fallisce, foto caricata comunque)

---

## ✅ TEST 4: OFFLINE SYNC 📴

### Come testare (modalità simulata):
1. Apri **Console Browser** (F12)
2. Importa il manager offline:
```javascript
// Copia-incolla nella console:
import('/src/lib/offline.ts').then(({ OfflineManager }) => {
  window.offlineManager = new OfflineManager()
})
```

3. Testa salvataggio offline:
```javascript
// Salva una lavorazione offline
await offlineManager.saveLavorazione({
  id: 'test-123',
  condominio_id: 'cond-456',
  tipologia_id: 'tip-789',
  dati_verifica: { test: 'valore' },
  timestamp: Date.now()
})

// Conta elementi non sincronizzati
const counts = await offlineManager.countUnsynced()
console.log('📴 Offline:', counts) // { lavorazioni: 1, foto: 0 }
```

4. Testa sincronizzazione:
```javascript
// Sincronizza con server
await offlineManager.sync()
console.log('✅ Sincronizzazione completata')
```

### Verifica IndexedDB:
1. **Chrome DevTools** → **Application** → **Storage** → **IndexedDB**
2. Dovresti vedere database: **`verifiche_offline_db`**
3. Object Stores:
   - `lavorazioni_offline`
   - `foto_offline`
   - `sync_queue`

---

## 🔄 TEST COMPLETO END-TO-END

### Scenario: Verifica completa con tutte le features

1. **Accedi** come sopralluoghista
2. **Nuova Verifica** → Seleziona condominio/tipologia
3. **Step 2**: 
   - Compila campi
   - **Carica foto** → GPS catturato automaticamente 📍
4. **Step 3**:
   - **Scrivi note** manualmente
   - **Clicca 🎤** → detta note a voce 🎤
   - **Aggiungi firma** → disegna nel canvas ✍️
5. **Completa Verifica** ✅

### Risultato atteso:
```javascript
// Console browser mostra:
📍 GPS catturato: { latitude: ..., longitude: ... }
📸 Foto caricata con GPS
🎤 Transcript: [tua trascrizione vocale]
✍️ Firma caricata: https://[...].vercel-storage.com/firme/[...]
✅ Verifica completata con successo
```

---

## 🛠️ DEBUG E TROUBLESHOOTING

### GPS non funziona:
```javascript
// Verifica permessi:
navigator.permissions.query({ name: 'geolocation' }).then(result => {
  console.log('GPS permission:', result.state) // 'granted', 'denied', 'prompt'
})
```

### Voice-to-text non funziona:
```javascript
// Verifica supporto browser:
const supporto = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
console.log('Voice support:', supporto) // true/false
```

### Firma non salva:
```javascript
// Verifica Vercel Blob configurato:
// .env.local deve contenere:
// BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx
```

### IndexedDB offline:
```javascript
// Test apertura database:
const request = indexedDB.open('verifiche_offline_db', 1)
request.onsuccess = () => console.log('✅ IndexedDB funziona')
request.onerror = () => console.error('❌ IndexedDB errore')
```

---

## 📊 METRICHE DI SUCCESSO

Tutte le features funzionano se:

- [x] ✍️ **Firma digitale**: Canvas disegna, salva PNG, mostra preview
- [x] 🎤 **Voice-to-text**: Microfono rosso pulsante, trascrizione italiana appare
- [x] 📍 **GPS foto**: Console mostra coordinate, metadata salvato
- [x] 📴 **Offline sync**: IndexedDB crea database, salva/query dati

---

## 🚀 PROSSIMI PASSI (UI POLISH)

Dopo test OK, aggiungiamo:

1. **Badge GPS** su foto mostrate (📍 + coordinate)
2. **Indicator offline** in header (🔴/🟢 + count unsynced)
3. **Pulsante sync** manuale
4. **Firma nel PDF** finale
5. **Mappa GPS nel PDF**

---

## 💡 TIPS

- Usa **Chrome DevTools Device Mode** per simulare tablet
- Per test GPS desktop: usa **Sensors panel** (fake coordinates)
- Voice-to-text funziona meglio con **microfono esterno**
- iPad Safari supporta tutto tranne Background Sync API

---

**Happy Testing!** 🎉
