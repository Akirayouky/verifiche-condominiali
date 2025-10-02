# 🚀 DEPLOYMENT - Gestione Verifiche Condominiali

## 📦 Files Necessari per il Server

### **1. Codice Applicazione**
Carica tutti i file del progetto sul server mantenendo la struttura:

```
/
├── src/                    # Codice sorgente React/Next.js
├── public/                 # Assets statici
├── package.json           # Dipendenze Node.js
├── next.config.js         # Configurazione Next.js
├── tailwind.config.js     # Configurazione CSS
├── tsconfig.json          # Configurazione TypeScript
└── database_setup.sql     # Script database MySQL
```

### **2. Configurazione Database**
Sul server, crea il file `.env.local` con le credenziali MySQL:

```env
# Database MySQL - Configurazione Produzione
DB_HOST=localhost
DB_PORT=3306
DB_USER=tuo_user_mysql
DB_PASSWORD=tua_password_mysql  
DB_NAME=verifiche_condominiali

# Configurazione Produzione
NEXT_PUBLIC_API_URL=https://tuo-dominio.com/api
NODE_ENV=production
```

### **3. Setup Database MySQL**
1. Accedi a **phpMyAdmin** sul server
2. Crea database: `verifiche_condominiali`
3. Esegui lo script: `database_setup.sql`
4. Verifica che le 4 tabelle siano create

### **4. Installazione sul Server**

#### **Via SSH:**
```bash
# 1. Naviga nella directory web
cd /public_html/

# 2. Installa dipendenze
npm install

# 3. Build per produzione
npm run build

# 4. Avvia applicazione
npm start
```

#### **Via cPanel (se supportato):**
1. Carica tutti i files via File Manager
2. Usa Terminal cPanel per eseguire `npm install` e `npm run build`
3. Configura Node.js app nel pannello di controllo

---

## ⚙️ **Configurazioni Server**

### **Requisiti Minimi:**
- **Node.js** 18.0+ 
- **MySQL** 5.7+ o MariaDB 10.3+
- **Memory** 512MB RAM minimo
- **Storage** 100MB per l'app + database

### **Port Configuration:**
- L'app Next.js usa di default la porta **3000**
- Configura il reverse proxy (Apache/Nginx) se necessario

### **File .htaccess (se necessario):**
```apache
RewriteEngine On
RewriteRule ^(.*)$ http://localhost:3000/$1 [P,L]
```

---

## 🔧 **Verifica Post-Deployment**

### **1. Test Connessione Database**
URL: `https://tuo-dominio.com/api/condomini`
Risposta attesa: `{"success": true, "data": [...], "total": 0}`

### **2. Test Interfaccia**
URL: `https://tuo-dominio.com`
- Dashboard dovrebbe caricarsi
- Menu di navigazione funzionante
- Sezioni: Condomini, Tipologie, Verifiche, Admin

### **3. Test CRUD Completo**
1. **Condomini**: Aggiungi/Modifica/Elimina
2. **Tipologie**: Crea tipologia con campi personalizzati
3. **Verifiche**: Esegui wizard completo
4. **Admin**: Gestisci lavorazioni

---

## 📱 **PWA su Produzione**

### **HTTPS Requirement:**
Per il funzionamento completo della PWA, è necessario **HTTPS**. 
La PWA funzionerà automaticamente con:
- Service Worker per cache offline
- Installazione come app nativa su mobile
- Notifiche push (se configurate)

### **Test PWA:**
1. Apri sito su smartphone
2. Browser mostrerà "Aggiungi a schermata Home"
3. L'app si comporterà come nativa

---

## 🛠 **Troubleshooting Comune**

### **Errore 500 - Database:**
- Verifica credenziali in `.env.local`
- Controlla che MySQL sia attivo
- Verifica che le tabelle esistano

### **Errore Build:**
```bash
# Pulisci cache e rebuilda
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

### **Performance:**
- L'app è ottimizzata per tablet Android
- Supporta connessioni lente
- Cache intelligente per dati frequenti

---

## 📊 **Monitoraggio**

### **Log Errors:**
L'applicazione logga errori MySQL nel console del server.

### **Performance:**
- **Primo caricamento**: ~1-2 secondi
- **Navigazione**: Istantanea (SPA)
- **API Calls**: <100ms su server locale

---

🎯 **L'applicazione è pronta per il deployment in produzione!**

Dopo il caricamento, testa semplicemente l'URL principale e dovrebbe funzionare immediatamente con il database MySQL configurato.