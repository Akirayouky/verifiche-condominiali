#!/bin/bash

# 🚀 Script di installazione automatico per produzione
# Eseguire dopo aver caricato i file sul server

echo "🏢 Gestione Verifiche Condominiali - Setup Produzione"
echo "=================================================="

# Verifica Node.js
echo "📋 Controllo prerequisiti..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js non trovato. Installalo prima di continuare."
    exit 1
fi

echo "✅ Node.js $(node --version) trovato"

# Verifica npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm non trovato. Installalo prima di continuare."
    exit 1
fi

echo "✅ npm $(npm --version) trovato"

# Installazione dipendenze
echo ""
echo "📦 Installazione dipendenze..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dipendenze installate con successo"
else
    echo "❌ Errore nell'installazione delle dipendenze"
    exit 1
fi

# Build produzione
echo ""
echo "🔨 Build per produzione..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completata con successo"
else
    echo "❌ Errore durante il build"
    exit 1
fi

# Controllo file di configurazione
echo ""
echo "⚙️ Controllo configurazione..."
if [ ! -f ".env.local" ]; then
    echo "⚠️  File .env.local non trovato"
    echo "📝 Copia .env.production in .env.local e configura le credenziali MySQL"
    echo "   cp .env.production .env.local"
    echo "   nano .env.local"
fi

# Controllo database setup
echo ""
echo "🗄️ Setup Database..."
echo "📋 Ricorda di:"
echo "   1. Accedere a phpMyAdmin"
echo "   2. Creare il database 'verifiche_condominiali'"
echo "   3. Eseguire lo script database_setup.sql"
echo "   4. Verificare che le 4 tabelle siano create"

echo ""
echo "🎉 Setup completato!"
echo ""
echo "🚀 Per avviare l'applicazione:"
echo "   npm start"
echo ""
echo "🌐 L'applicazione sarà disponibile su:"
echo "   http://localhost:3000"
echo ""
echo "📖 Per maggiori dettagli consulta DEPLOYMENT.md"