# 📋 TEST PLAN - Sistema Riapertura Lavorazioni

**Data Test:** 5 Ottobre 2025  
**Versione:** 1.0.0  
**Tester:** Manual Testing Required  
**URL:** http://localhost:3000

---

## 🎯 Obiettivo
Verificare il funzionamento end-to-end del Sistema Riapertura che permette all'amministratore di riaprire lavorazioni completate richiedendo integrazione di dati al sopralluoghista.

---

## ✅ PRE-REQUISITI

### Database Setup
- [ ] Eseguire `SETUP_QR_CODE_AUTO.sql` su Supabase (se non già fatto)
- [ ] Verificare colonna `stato` accetti valore `'riaperta'`
- [ ] Verificare colonne JSONB: `campi_da_ricompilare`, `campi_nuovi`, `motivo_riapertura`, `data_riapertura`

### Utenti di Test
- [ ] **Admin:** email `admin@example.com` (userId: verificare in localStorage)
- [ ] **Sopralluoghista:** email `user@example.com` (userId: verificare in localStorage)

### Dati Iniziali
- [ ] Almeno 1 condominio esistente con QR code
- [ ] Almeno 1 lavorazione con stato `completata` (con campi compilati)

---

## 🧪 TEST SUITE

---

### TEST 1: Workflow Completo - Scenario Base
**Obiettivo:** Testare il flusso completo da riapertura a completamento integrazione

#### Fase A - Riapertura (Admin)
1. [ ] **Login come Admin**
   - Aprire `http://localhost:3000/admin`
   - Verificare accesso al Pannello Admin

2. [ ] **Identificare Lavorazione da Riaprire**
   - Trovare una lavorazione con stato `COMPLETATA`
   - Badge verde visibile
   - Espandere card lavorazione

3. [ ] **Aprire Wizard Riapertura**
   - Click su bottone azioni (⚙️)
   - Click su "🔄 Riapri"
   - Verificare apertura modal `WizardRiapertura`
   - Verificare titolo: "Riapertura Lavorazione"

4. [ ] **Step 1 - Motivo Riapertura**
   - Textarea "Motivo della riapertura" visibile
   - Counter caratteri "0 / 500" presente
   - Click "Avanti" con campo vuoto → Errore: "Il motivo è obbligatorio"
   - Inserire motivo: "Dati foto impianto incompleti, necessarie misure aggiuntive ascensore"
   - Counter aggiornato: "XX / 500"
   - Click "Avanti" → Passaggio a Step 2

5. [ ] **Step 2 - Seleziona Campi**
   - Vedere lista campi compilati della lavorazione
   - Per ogni campo: checkbox "Ricompila" e radio "Mantieni/Ricompila"
   - Selezionare almeno 2 campi per ricompilazione:
     - [ ] es. "Data sopralluogo" → Ricompila
     - [ ] es. "Note impianto" → Ricompila
   - Selezionare almeno 1 campo da mantenere:
     - [ ] es. "Numero ascensori" → Mantieni
   - Click "Avanti" → Passaggio a Step 3

6. [ ] **Step 3 - Aggiungi Nuovi Campi**
   - Form per aggiungere nuovi campi visibile
   - Campi: Nome, Tipo, Descrizione, Obbligatorio
   - Aggiungere 2 nuovi campi:
     
     **Campo 1:**
     - Nome: "Foto quadro elettrico"
     - Tipo: file
     - Descrizione: "Caricare foto frontale del quadro elettrico ascensore"
     - Obbligatorio: ✅ Sì
     - Click "➕ Aggiungi Campo"
     - Verificare comparsa nella lista sotto
     
     **Campo 2:**
     - Nome: "Data ultima manutenzione"
     - Tipo: date
     - Descrizione: "Indicare data ultimo intervento manutentivo"
     - Obbligatorio: ✅ Sì
     - Click "➕ Aggiungi Campo"
     - Verificare comparsa nella lista

7. [ ] **Conferma Riapertura**
   - Click bottone "✅ Conferma Riapertura"
   - Vedere spinner loading
   - Attendere risposta API
   - Verificare alert successo: "Lavorazione riaperta con successo"
   - Modal si chiude automaticamente
   - Lista lavorazioni si aggiorna

8. [ ] **Verifica Stato Aggiornato**
   - Trovare la lavorazione appena riaperta
   - Verificare badge **ARANCIONE** con "🔄 RIAPERTA"
   - Stato visibile nella card
   - Filtro "Riaperte" funzionante

#### Fase B - Integrazione (Sopralluoghista)

9. [ ] **Login come Sopralluoghista**
   - Aprire `http://localhost:3000/user` (o logout + login)
   - Verificare accesso al Pannello Utente

10. [ ] **Verificare Notifica Riapertura**
    - Controllare campana notifiche 🔔
    - Vedere notifica: "Lavorazione riaperta - Integrazione richiesta"
    - Click sulla notifica → Lavorazione evidenziata

11. [ ] **Identificare Alert Riapertura**
    - Trovare lavorazione con badge "🔄 RIAPERTA"
    - Verificare **alert arancione** visibile nella card:
      - Titolo: "🔄 INTEGRAZIONE RICHIESTA"
      - Motivo visibile: "Dati foto impianto incompleti..."
      - Data riapertura presente
      - Bottone "✏️ Inizia Integrazione" presente

12. [ ] **Aprire Wizard Integrazione**
    - Click su "✏️ Inizia Integrazione"
    - Verificare apertura modal `WizardIntegrazione`
    - Verificare titolo: "Integrazione Lavorazione"
    - Alert motivo sempre visibile in alto

13. [ ] **Step 1 - Ricompila Campi**
    - Vedere solo i campi selezionati dall'admin per ricompilazione
    - Per ogni campo:
      - Label nome campo
      - Input appropriate per tipo
      - **Valore precedente** visibile sotto in grigio
      - es. "Data sopralluogo" → input date con valore vecchio sotto
      - es. "Note impianto" → textarea con testo vecchio sotto
    
    - Ricompilare i campi:
      - [ ] "Data sopralluogo" → Scegliere nuova data (es. oggi)
      - [ ] "Note impianto" → Aggiungere testo: "Aggiunte misure dettagliate cabina ascensore"
    
    - Click "Avanti" con campi vuoti → Errore validazione
    - Compilare tutti i campi obbligatori
    - Click "Avanti" → Passaggio a Step 2

14. [ ] **Step 2 - Compila Nuovi Campi**
    - Vedere solo i nuovi campi aggiunti dall'admin
    - Badge "NUOVO" visibile su ogni campo
    - Descrizioni admin visibili
    
    - Compilare nuovi campi:
      - [ ] "Foto quadro elettrico" → Upload immagine
        - Click "Scegli file"
        - Selezionare immagine dal device
        - Verificare nome file visualizzato
      
      - [ ] "Data ultima manutenzione" → Inserire data
        - Selezionare data dal picker
    
    - Click "Completa Integrazione" con campi vuoti → Errore
    - Compilare tutti i campi obbligatori
    - Click "✅ Completa Integrazione"

15. [ ] **Conferma Completamento**
    - Vedere spinner loading
    - Attendere risposta API
    - Verificare alert successo: "Integrazione completata con successo"
    - Modal si chiude automaticamente
    - Lista lavorazioni si aggiorna

16. [ ] **Verifica Stato Finale**
    - Lavorazione **non più presente** in "Da Fare"
    - Lavorazione presente in "Completate"
    - Badge **VERDE** "✅ COMPLETATA"
    - Alert arancione **non più visibile**

#### Fase C - Verifica Admin

17. [ ] **Ritorno Admin**
    - Tornare a `http://localhost:3000/admin`
    - Verificare notifica: "Integrazione completata"
    - Click notifica → Lavorazione evidenziata

18. [ ] **Verifica Dati Aggiornati**
    - Aprire dettaglio lavorazione integrata
    - Verificare campi ricompilati aggiornati:
      - [ ] "Data sopralluogo" → Nuova data visibile
      - [ ] "Note impianto" → Nuovo testo presente
    
    - Verificare nuovi campi aggiunti:
      - [ ] "Foto quadro elettrico" → File caricato visibile
      - [ ] "Data ultima manutenzione" → Data presente
    
    - Stato finale: `COMPLETATA` ✅

---

### TEST 2: Edge Case - Solo Ricompilazione
**Scenario:** Admin riapre lavorazione richiedendo solo ricompilazione campi esistenti, senza nuovi campi.

19. [ ] **Riaprire Lavorazione (Admin)**
    - Step 1: Inserire motivo
    - Step 2: Selezionare 2-3 campi per ricompilazione
    - Step 3: **NON aggiungere nuovi campi**
    - Click "Conferma Riapertura"
    - Verificare successo

20. [ ] **Integrare (Sopralluoghista)**
    - Aprire wizard integrazione
    - Step 1: Ricompilare campi richiesti
    - **Verificare Step 2 non mostrato** (o messaggio "Nessun nuovo campo")
    - Click "Completa" dovrebbe funzionare direttamente dopo Step 1
    - Verificare completamento

---

### TEST 3: Edge Case - Solo Nuovi Campi
**Scenario:** Admin riapre richiedendo solo nuovi campi, senza ricompilare esistenti.

21. [ ] **Riaprire Lavorazione (Admin)**
    - Step 1: Inserire motivo
    - Step 2: **Selezionare tutti campi come "Mantieni"**
    - Step 3: Aggiungere 1-2 nuovi campi
    - Click "Conferma Riapertura"
    - Verificare successo

22. [ ] **Integrare (Sopralluoghista)**
    - Aprire wizard integrazione
    - **Verificare Step 1 skippato** o mostra "Nessun campo da ricompilare"
    - Step 2: Compilare nuovi campi
    - Click "Completa Integrazione"
    - Verificare completamento

---

### TEST 4: Edge Case - Tutti Mantenuti
**Scenario:** Admin apre wizard ma poi decide di mantenere tutti i campi esistenti e non aggiunge nuovi.

23. [ ] **Tentativo Riapertura (Admin)**
    - Step 1: Inserire motivo
    - Step 2: Selezionare **tutti campi come "Mantieni"**
    - Click "Avanti"
    - Step 3: **NON aggiungere nuovi campi**
    - Click "Conferma Riapertura"
    - **Verificare errore:** "Devi selezionare almeno un campo da ricompilare o aggiungere un nuovo campo"
    - Wizard non permette submit senza modifiche

---

### TEST 5: Validazione Campi

24. [ ] **Validazione Motivo (Admin)**
    - [ ] Campo vuoto → Errore
    - [ ] Solo spazi → Errore
    - [ ] Oltre 500 caratteri → Errore o troncamento
    - [ ] Caratteri speciali permessi → OK

25. [ ] **Validazione Nuovi Campi (Admin)**
    - [ ] Nome campo vuoto → Errore
    - [ ] Tipo non selezionato → Errore
    - [ ] Descrizione vuota → Warning (dovrebbe essere optional)
    - [ ] Duplicazione nome campo → Warning

26. [ ] **Validazione Integrazione (Sopralluoghista)**
    - [ ] Campo obbligatorio vuoto → Errore con messaggio
    - [ ] Campo date invalido → Errore
    - [ ] Campo number non numerico → Errore
    - [ ] File troppo grande → Errore (verificare limite)
    - [ ] File tipo non permesso → Errore

---

### TEST 6: Gestione Errori API

27. [ ] **Errore Rete durante Riapertura**
    - Disconnettere internet o bloccare API
    - Tentare riapertura
    - Verificare messaggio errore chiaro
    - Verificare dati non persi (se possibile)

28. [ ] **Errore Rete durante Integrazione**
    - Disconnettere durante submit integrazione
    - Verificare messaggio errore
    - Verificare possibilità retry
    - Verificare dati form non persi

29. [ ] **Lavorazione Non Trovata**
    - Simulare ID non esistente (modificare URL)
    - Verificare errore 404
    - Verificare messaggio user-friendly

---

### TEST 7: UI/UX Details

30. [ ] **Responsive Design**
    - [ ] Testare su tablet (viewport 768px)
    - [ ] Modal full-screen su mobile
    - [ ] Scroll interno funzionante
    - [ ] Bottoni accessibili su touch

31. [ ] **Loading States**
    - [ ] Spinner visibile durante chiamate API
    - [ ] Bottoni disabilitati durante loading
    - [ ] Nessun double-submit possibile

32. [ ] **Accessibilità**
    - [ ] Tab navigation funzionante
    - [ ] Labels associate agli input
    - [ ] Aria-labels presenti
    - [ ] Focus indicators visibili

33. [ ] **Colori e Badge**
    - [ ] Badge RIAPERTA arancione (bg-orange-100)
    - [ ] Alert inline arancione distintivo
    - [ ] Wizard admin giallo vs blu utente distinguibili
    - [ ] Icone emoji corrette (🔄 per riaperta)

---

### TEST 8: Database Persistence

34. [ ] **Verifica JSONB Fields**
    - Aprire Supabase SQL Editor
    - Query: `SELECT id, stato, motivo_riapertura, campi_da_ricompilare, campi_nuovi FROM lavorazioni WHERE stato = 'riaperta';`
    - Verificare:
      - [ ] `motivo_riapertura` contiene testo inserito
      - [ ] `campi_da_ricompilare` è array JSON con nomi campi
      - [ ] `campi_nuovi` è array JSON con definizioni campi
      - [ ] `data_riapertura` timestamp presente

35. [ ] **Verifica Merge Campi dopo Integrazione**
    - Dopo completamento integrazione
    - Query: `SELECT campi_originali FROM lavorazioni WHERE id = 'XXX';`
    - Verificare:
      - [ ] Campi mantenuti invariati
      - [ ] Campi ricompilati aggiornati
      - [ ] Nuovi campi aggiunti alla struttura
      - [ ] Nessun dato perso

---

### TEST 9: Notifiche

36. [ ] **Notifica Riapertura**
    - Dopo admin riapre lavorazione
    - Query: `SELECT * FROM notifiche WHERE tipo = 'lavorazione_riaperta' ORDER BY data_inserimento DESC LIMIT 1;`
    - Verificare:
      - [ ] Notifica creata
      - [ ] `destinatario_id` = sopralluoghista
      - [ ] `lavorazione_id` corretto
      - [ ] `messaggio` contiene motivo
      - [ ] `letta = false`

37. [ ] **Notifica Completamento Integrazione**
    - Dopo sopralluoghista completa
    - Query: `SELECT * FROM notifiche WHERE tipo = 'integrazione_completata' ORDER BY data_inserimento DESC LIMIT 1;`
    - Verificare:
      - [ ] Notifica creata
      - [ ] `destinatario_id` = admin originale
      - [ ] `lavorazione_id` corretto
      - [ ] `letta = false`

38. [ ] **Contatore Badge Notifiche**
    - Verificare badge rosso con numero notifiche non lette
    - Click notifica → Badge decrementa
    - Numero corretto dopo refresh pagina

---

### TEST 10: Sicurezza

39. [ ] **Autorizzazione Admin**
    - Login come sopralluoghista
    - Tentare accesso diretto API: `POST /api/lavorazioni/[id]/riapri`
    - Verificare: **403 Forbidden** o **401 Unauthorized**

40. [ ] **Autorizzazione Sopralluoghista**
    - Login come admin
    - Tentare accesso API: `PUT /api/lavorazioni/[id]/completa-integrazione`
    - Verificare: **403 Forbidden** (solo sopralluoghista assegnato può integrare)

41. [ ] **Validazione Server-Side**
    - Inviare payload malformato via Postman/curl
    - Verificare validazione server (non solo client)
    - Verificare messaggi errore appropriati

---

## 📊 RISULTATI

### Statistiche Test
- **Totale Test Cases:** 41
- **Passati:** ___
- **Falliti:** ___
- **Bloccanti:** ___
- **Note:** ___

### Bug Trovati
| ID | Severità | Descrizione | Steps to Reproduce | Status |
|----|----------|-------------|-------------------|--------|
| 1  |          |             |                   |        |
| 2  |          |             |                   |        |

### Miglioramenti UX Suggeriti
- 
- 
- 

---

## ✅ CHECKLIST FINALE

- [ ] Tutti i test critici passati (TEST 1, 2, 3)
- [ ] Nessun bug bloccante
- [ ] Database aggiornato correttamente
- [ ] Notifiche funzionanti
- [ ] UI responsive e accessibile
- [ ] Performance accettabile (< 2s per operazione)
- [ ] **Sistema pronto per produzione** ✅

---

## 📝 NOTE TESTER
_Inserire qui osservazioni, dubbi, o comportamenti inaspettati durante il test_

```
Data: __________
Tester: __________
Ambiente: Development / Staging / Production
Browser: __________
Device: __________

Note:




```

---

**Fine Test Plan**
