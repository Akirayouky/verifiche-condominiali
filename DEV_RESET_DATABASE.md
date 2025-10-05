# 🔧 Pannello Sviluppatore - Reset Database

## Funzionalità

Il pannello sviluppatore (`/dev`) include strumenti per il reset del database durante lo sviluppo e i test.

## Reset Database

### Protezione
- **Password obbligatoria**: Ogni reset richiede la password admin
- **Doppia conferma**: Modal di conferma prima di ogni operazione
- **Nessun click accidentale**: Sistema sicuro contro azioni involontarie

### Tipologie di Reset

#### 🔥 Reset Completo
Elimina TUTTI i dati:
- ✅ Lavorazioni (e relativi allegati: foto, firma, GPS, note)
- ✅ Utenti (tranne admin principale)
- ✅ Condomini
- ✅ Tipologie di verifica
- ✅ Notifiche

#### 📋 Reset Lavorazioni
Elimina solo:
- Tutte le lavorazioni
- Allegati associati (foto, firma, dati verifica)
- Mantiene: utenti, condomini, tipologie

#### 👥 Reset Utenti
Elimina solo:
- Tutti gli utenti
- **PRESERVA**: admin@condomini.it
- Mantiene: lavorazioni, condomini, tipologie

#### 🏢 Reset Condomini
Elimina solo:
- Tutti i condomini
- Mantiene: utenti, lavorazioni, tipologie

#### 📝 Reset Tipologie
Elimina solo:
- Tutte le tipologie di verifica
- Mantiene: utenti, condomini, lavorazioni

#### 🔔 Reset Notifiche
Elimina solo:
- Tutte le notifiche
- Mantiene: tutto il resto

## Come Usare

1. **Accedi al Pannello Dev**
   - Vai su `/dev` (link nell'header in development mode)

2. **Scegli il tipo di reset**
   - Clicca sul pulsante corrispondente

3. **Inserisci password**
   - Inserisci la password dell'admin
   - Conferma l'operazione

4. **Verifica risultato**
   - Il sistema mostra il numero di elementi eliminati
   - Conferma operazione completata

## Password Admin

La password admin è quella dell'utente `admin@condomini.it` nel database.

## Sicurezza

- ✅ Solo in modalità development
- ✅ Richiede autenticazione admin
- ✅ Password verificata con bcrypt
- ✅ Log delle operazioni
- ✅ Conferma obbligatoria

## Note

- ⚠️ Le operazioni sono **irreversibili**
- 💡 Ideale per test e sviluppo
- 🔒 Non disponibile in produzione
- 🎯 Permette di ripartire da zero velocemente
