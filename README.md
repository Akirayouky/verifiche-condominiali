# 🏢 Gestione Verifiche Condominiali - PWA

Una Progressive Web App moderna per la gestione delle verifiche condominiali, ottimizzata per tablet Android e utilizzabile su qualsiasi dispositivo.

## ✨ Funzionalità Principali

### 🏠 **Dashboard**
- Panoramica generale con statistiche in tempo reale
- Monitoraggio condomini attivi, verifiche completate, in corso e scadute
- Interfaccia intuitiva e responsive

### 🏢 **Gestione Condomini**
- Inserimento e gestione condomini tramite API
- Anagrafica completa dei condomini
- Integrazione con sistemi esterni

### 📋 **Tipologie Verifiche**
- Definizione di diverse tipologie di verifiche
- Configurazione parametri specifici per ogni tipologia
- Template personalizzabili

### ✅ **Wizard Verifiche**
- Processo guidato step-by-step per eseguire verifiche
- Salvataggio progressivo dei dati
- Gestione email e notifiche
- Raccolta esiti e documentazione

### ⚙️ **Pannello Amministratore**
- Visualizzazione lavorazioni chiuse
- Riapertura e modifica lavorazioni
- Sistema avanzato di note e commenti
- Gestione utenti e permessi

## 🚀 Stack Tecnologico

- **Frontend**: Next.js 14 con App Router
- **UI Framework**: React 18 con TypeScript
- **Styling**: Tailwind CSS
- **PWA**: Service Worker con funzionalità offline
- **Database**: Supabase (PostgreSQL)
- **Storage Foto**: Microsoft OneDrive (1TB via Microsoft 365)
- **Notifiche**: Web Push API (Android/Desktop)
- **PDF Generation**: jsPDF con foto cloud
- **API Integration**: Microsoft Graph API per OneDrive

## 🛠️ Installazione e Avvio

### Prerequisiti
- Node.js 18+ 
- npm o yarn

### Setup del progetto

```bash
# Installa le dipendenze
npm install

# Avvia in modalità sviluppo
npm run dev

# Build per produzione
npm run build

# Avvia in produzione
npm run start
```

L'applicazione sarà disponibile su `http://localhost:3000`

### Configurazione OneDrive per Foto

Le foto delle lavorazioni vengono salvate su **OneDrive** (1TB incluso con Microsoft 365 Family).

**Setup completo**:
1. Segui la guida dettagliata in **[SETUP_ONEDRIVE.md](./SETUP_ONEDRIVE.md)**
2. Registra un'app su Azure Portal (15 minuti)
3. Configura credenziali in `.env.local`
4. Testa connessione: `http://localhost:3000/api/test-onedrive`

**Vantaggi OneDrive**:
- ✅ 1 TB storage incluso (vs 25 GB Cloudinary gratis)
- ✅ Sync automatico su tutti i dispositivi
- ✅ Backup integrato Microsoft
- ✅ CDN globale per velocità
- ✅ Zero costi aggiuntivi

## 📱 Funzionalità PWA

### Installazione su dispositivo
- **Desktop**: Chrome/Edge mostrerà l'icona di installazione nella barra degli indirizzi
- **Android**: "Aggiungi alla schermata Home" dal menu del browser
- **iOS**: "Aggiungi alla schermata Home" da Safari

### Caratteristiche PWA
- ✅ Funzionamento offline
- ✅ Installabile come app nativa
- ✅ Aggiornamenti automatici
- ✅ Notifiche push (future)
- ✅ Ottimizzata per tablet

## 🎯 Roadmap

### Fase 1 - Base ✅
- [x] Setup progetto Next.js PWA
- [x] Interfaccia base responsive
- [x] Configurazione PWA

### Fase 2 - Funzionalità Core ✅
- [x] Sistema di autenticazione
- [x] Gestione condomini con API
- [x] Database Supabase (PostgreSQL)
- [x] CRUD tipologie verifiche

### Fase 3 - Wizard e Lavorazioni ✅
- [x] Wizard verifiche multi-step
- [x] Sistema email e notifiche
- [x] Pannello amministratore
- [x] Gestione note e commenti
- [x] Upload foto su OneDrive
- [x] Generazione PDF con foto

### Fase 4 - Ottimizzazioni ✅
- [x] Notifiche push Android/Desktop
- [x] Storage foto cloud (OneDrive)
- [x] Sistema backup integrato
- [ ] Sincronizzazione offline avanzata
- [ ] Report e analytics
- [ ] Esportazione dati Excel

## 🤝 Contribuire

1. Fork del repository
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add AmazingFeature'`)
4. Push del branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è sotto licenza MIT - vedi il file [LICENSE](LICENSE) per i dettagli.

---

**Sviluppato per la gestione efficiente delle verifiche condominiali** 🏠✨