# 🔄 Sistema di Riapertura Lavorazioni

## 📋 Panoramica

Sistema completo per riaprire lavorazioni completate, permettendo di:
- ✅ Mantenere campi già compilati correttamente
- 🔄 Far ricompilare campi che necessitano modifiche (con dati vecchi precompilati)
- ➕ Aggiungere nuovi campi mancanti

## 🎯 Workflow Completo

### 1. Admin Riapre Lavorazione

**Pannello Admin** → Lavorazione completata → Click **"Riapri"**

→ Si apre **Wizard Riapertura** in 3 step:

#### **STEP 1: Motivo Riapertura**
```
📝 Perché stai riaprendo questa lavorazione?

[textarea grande]
Es: "Manca verifica estintori piano terra"
    "Foto ascensore da rifare (sfocate)"
    "Dati GPL da correggere"

[Avanti →]
```

#### **STEP 2: Analisi Campi Esistenti**
```
📊 Seleziona cosa fare con ogni campo compilato:

┌─────────────────────────────────────────────────────┐
│ ✅ MANTENERE (ok come sono)                         │
├─────────────────────────────────────────────────────┤
│ □ Descrizione: "Verifica impianto elettrico..."    │
│ □ Data sopralluogo: "15/03/2025"                   │
│ □ Esito generale: "Conforme"                       │
│ □ Foto verifica 1: [thumbnail]                     │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ 🔄 FAR RICOMPILARE (con dati vecchi modificabili)  │
├─────────────────────────────────────────────────────┤
│ □ Note tecniche: "Impianto a norma"  ← dati vecchi │
│ □ Foto estintori: [thumbnail]        ← da rifare   │
│ □ Certificato: "cert_123.pdf"        ← da caricare │
└─────────────────────────────────────────────────────┘

[← Indietro] [Avanti →]
```

#### **STEP 3: Aggiungi Nuovi Campi**
```
➕ Aggiungi campi mancanti:

[+ Aggiungi Campo Testo]
[+ Aggiungi Campo Data]
[+ Aggiungi Campo File]
[+ Aggiungi Nuova Verifica]

Campi aggiunti:
┌─────────────────────────────────────────────────────┐
│ 📝 Note GPL                                         │
│ Tipo: Textarea                                      │
│ Obbligatorio: ☑ Sì                                  │
│ Descrizione: "Inserire note su impianto GPL"       │
│ [Rimuovi]                                           │
├─────────────────────────────────────────────────────┤
│ 📸 Foto GPL                                         │
│ Tipo: File (immagine)                               │
│ Obbligatorio: ☑ Sì                                  │
│ [Rimuovi]                                           │
└─────────────────────────────────────────────────────┘

[← Indietro] [Salva e Riapri]
```

### 2. Salvataggio Riapertura

Al click su **"Salva e Riapri"**:

```typescript
POST /api/lavorazioni/{id}/riapri

{
  motivo: "Manca verifica GPL e foto da rifare",
  campi_mantenuti: [
    "descrizione",
    "data_sopralluogo",
    "esito_generale",
    "foto_verifica_1"
  ],
  campi_ricompilare: [
    {
      nome: "note_tecniche",
      valore_precedente: "Impianto a norma",
      label: "Note tecniche",
      tipo: "textarea"
    },
    {
      nome: "foto_estintori",
      valore_precedente: "https://...",
      label: "Foto estintori",
      tipo: "file"
    }
  ],
  campi_nuovi: [
    {
      nome: "note_gpl",
      label: "Note GPL",
      tipo: "textarea",
      required: true,
      descrizione: "Inserire note su impianto GPL"
    },
    {
      nome: "foto_gpl",
      label: "Foto GPL",
      tipo: "file",
      required: true
    }
  ]
}
```

**Risposta:**
```json
{
  "success": true,
  "lavorazione": {
    "id": "abc-123",
    "stato": "riaperta",
    "data_riapertura": "2025-10-05T14:30:00Z",
    "riaperta_da": "admin-id-123",
    "motivo_riapertura": "Manca verifica GPL e foto da rifare",
    "campi_da_ricompilare": ["note_tecniche", "foto_estintori"],
    "campi_nuovi": ["note_gpl", "foto_gpl"]
  }
}
```

### 3. Sopralluoghista Vede Lavorazione Riaperta

**Pannello Utente** → Mostra badge **🔄 RIAPERTA**

Al click:

```
┌──────────────────────────────────────────────────────┐
│ 🔄 LAVORAZIONE RIAPERTA                              │
├──────────────────────────────────────────────────────┤
│ Riaperta da: Admin Kamia                             │
│ Data riapertura: 5 ottobre 2025, 14:30              │
│                                                      │
│ 📝 Motivo:                                           │
│ "Manca verifica GPL e foto da rifare"                │
│                                                      │
│ ℹ️ Cosa devi fare:                                   │
│ • Ricontrolla e modifica i campi evidenziati        │
│ • Completa i nuovi campi richiesti                   │
│ • Tutti gli altri dati sono stati mantenuti          │
│                                                      │
│ [Inizia Integrazione]                                │
└──────────────────────────────────────────────────────┘
```

Click **"Inizia Integrazione"** → Wizard Integrazione:

```
┌──────────────────────────────────────────────────────┐
│ STEP 1/2: Campi da Ricompilare                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│ 🔄 Note tecniche                                     │
│ [Impianto a norma]  ← valore precedente precompilato│
│                                                      │
│ 🔄 Foto estintori                                    │
│ [foto attuale: thumbnail]                            │
│ [📸 Scatta Nuova Foto] [📁 Carica File]             │
│                                                      │
│ [Avanti →]                                           │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ STEP 2/2: Nuovi Campi                                │
├──────────────────────────────────────────────────────┤
│                                                      │
│ ➕ Note GPL *                                        │
│ [textarea vuoto]                                     │
│ ℹ️ Inserire note su impianto GPL                    │
│                                                      │
│ ➕ Foto GPL *                                        │
│ [📸 Scatta Foto] [📁 Carica File]                   │
│                                                      │
│ [← Indietro] [Completa Integrazione]                │
└──────────────────────────────────────────────────────┘
```

### 4. Salvataggio Finale

Al click **"Completa Integrazione"**:

```typescript
PUT /api/lavorazioni/{id}/completa-integrazione

{
  campi_ricompilati: {
    note_tecniche: "Impianto a norma - Certificato rinnovato",
    foto_estintori: "base64..." // nuova foto
  },
  campi_nuovi: {
    note_gpl: "Impianto GPL conforme - Ultima verifica 01/10/2025",
    foto_gpl: "base64..." // foto nuova
  }
}
```

**Backend:**
1. Aggiorna solo i campi modificati/nuovi
2. Mantiene tutti i campi non toccati
3. Cambia stato da `riaperta` → `completata`
4. Aggiorna `data_completamento`
5. Invia notifica all'admin: "Lavorazione integrata"

## 🗂️ Struttura Dati Database

### Tabella `lavorazioni`

```sql
-- Campi per riapertura
data_riapertura TIMESTAMP,              -- Quando riaperta
riaperta_da UUID REFERENCES users(id),  -- Chi ha riaperto
campi_da_ricompilare JSONB DEFAULT '[]', -- ["note_tecniche", "foto_estintori"]
campi_nuovi JSONB DEFAULT '[]',         -- ["note_gpl", "foto_gpl"]
motivo_riapertura TEXT,                 -- Perché riaperta

-- Stato incluso "riaperta"
stato CHECK (stato IN ('aperta', 'in_corso', 'completata', 'archiviata', 'riaperta'))
```

## 📁 File da Creare

### 1. Backend

```
src/app/api/lavorazioni/
  └── [id]/
      ├── riapri/
      │   └── route.ts              # POST - Riapre lavorazione
      └── completa-integrazione/
          └── route.ts              # PUT - Completa integrazione
```

### 2. Frontend

```
src/components/admin/
  └── WizardRiapertura.tsx         # Wizard 3 step per admin

src/components/user/
  └── WizardIntegrazione.tsx       # Wizard 2 step per sopralluoghista
```

## 🔧 API Endpoints

### POST `/api/lavorazioni/{id}/riapri`

**Request:**
```typescript
{
  motivo: string
  campi_mantenuti: string[]
  campi_ricompilare: CampoRiapertura[]
  campi_nuovi: CampoRiapertura[]
}
```

**Response:**
```typescript
{
  success: boolean
  lavorazione: Lavorazione  // con stato "riaperta"
}
```

### PUT `/api/lavorazioni/{id}/completa-integrazione`

**Request:**
```typescript
{
  campi_ricompilati: Record<string, any>
  campi_nuovi: Record<string, any>
}
```

**Response:**
```typescript
{
  success: boolean
  lavorazione: Lavorazione  // con stato "completata"
}
```

## 🎨 UI Components

### Admin - Badge Stato

```tsx
{lavorazione.stato === 'completata' && (
  <button 
    onClick={() => openWizardRiapertura(lavorazione)}
    className="btn-warning"
  >
    🔄 Riapri
  </button>
)}

{lavorazione.stato === 'riaperta' && (
  <span className="badge badge-warning">
    🔄 RIAPERTA
  </span>
)}
```

### Sopralluoghista - Alert Riapertura

```tsx
{lavorazione.stato === 'riaperta' && (
  <div className="alert alert-warning">
    <h3>🔄 Lavorazione Riaperta</h3>
    <p><strong>Riaperta da:</strong> {admin.nome}</p>
    <p><strong>Data:</strong> {lavorazione.data_riapertura}</p>
    <p><strong>Motivo:</strong> {lavorazione.motivo_riapertura}</p>
    
    <button onClick={() => openWizardIntegrazione()}>
      Inizia Integrazione
    </button>
  </div>
)}
```

## 📊 Filtri Pannello Admin

```tsx
<select value={filtroStato} onChange={(e) => setFiltroStato(e.target.value)}>
  <option value="tutte">Tutte</option>
  <option value="aperta">Aperte</option>
  <option value="in_corso">In Corso</option>
  <option value="completata">Completate</option>
  <option value="riaperta">🔄 Riaperte</option>
  <option value="archiviata">Archiviate</option>
</select>
```

## 🔔 Notifiche

### Quando Admin Riapre:
```typescript
{
  tipo: 'lavorazione_riaperta',
  titolo: 'Lavorazione Riaperta',
  messaggio: 'La lavorazione "Verifica Cond. X" necessita integrazione',
  utente_id: sopralluoghista_id,
  priorita: 'alta',
  azioni: [
    { label: 'Visualizza', url: `/lavorazioni/${id}` },
    { label: 'Inizia', url: `/lavorazioni/${id}/integra` }
  ]
}
```

### Quando Sopralluoghista Completa:
```typescript
{
  tipo: 'integrazione_completata',
  titolo: 'Integrazione Completata',
  messaggio: 'La lavorazione "Verifica Cond. X" è stata integrata',
  utente_id: admin_id,
  priorita: 'normale'
}
```

## ✅ Checklist Implementazione

### Setup Database:
- [ ] Eseguire `ADD_STATO_RIAPERTA.sql` su Supabase
- [ ] Verificare constraint aggiornato
- [ ] Testare inserimento con stato "riaperta"

### Backend:
- [ ] API `POST /api/lavorazioni/{id}/riapri`
- [ ] API `PUT /api/lavorazioni/{id}/completa-integrazione`
- [ ] Validazione campi
- [ ] Gestione notifiche

### Frontend Admin:
- [ ] WizardRiapertura Step 1 (motivo)
- [ ] WizardRiapertura Step 2 (analisi campi)
- [ ] WizardRiapertura Step 3 (nuovi campi)
- [ ] Pulsante "Riapri" su lavorazioni completate
- [ ] Filtro "Riaperte" in tabella

### Frontend Sopralluoghista:
- [ ] Badge "🔄 RIAPERTA" su lavorazioni
- [ ] Alert informativo motivo riapertura
- [ ] WizardIntegrazione Step 1 (ricompila)
- [ ] WizardIntegrazione Step 2 (nuovi campi)
- [ ] Salvataggio integrazione

### Testing:
- [ ] Test flow completo admin → sopralluoghista
- [ ] Test con campi solo da ricompilare
- [ ] Test con campi solo nuovi
- [ ] Test con mix campi
- [ ] Test notifiche
- [ ] Test su tablet

## 🎯 Vantaggi Sistema

1. **Flessibilità Totale**: Admin decide esattamente cosa modificare
2. **Efficienza**: Sopralluoghista vede solo campi necessari
3. **Storico**: Mantiene versione precedente
4. **Tracciabilità**: Chi, quando, perché ha riaperto
5. **UX Ottimale**: Wizard guidati per entrambi
6. **Scalabilità**: Sistema estendibile per nuovi tipi di campo

## 📝 Note Implementazione

- Usare JSONB per `campi_da_ricompilare` e `campi_nuovi` (flessibile)
- Validare che campi richiesti siano compilati
- Mantenere storico modifiche (audit log)
- Notifiche real-time con SSE
- Mobile-friendly (usato su tablet)

---

**Prossimo Step:** Implementare API e Wizard!
