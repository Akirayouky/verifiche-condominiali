# 🚀 DEPLOY GUIDA RAPIDA

## OPZIONE 1: Vercel Deploy (5 minuti)

### 1. Installa Vercel CLI
```bash
npm i -g vercel
```

### 2. Login Vercel
```bash
vercel login
```

### 3. Deploy
```bash
vercel --prod
```

## OPZIONE 2: GitHub + Vercel Auto-Deploy

### 1. Push su GitHub
```bash
git add .
git commit -m "✨ Sistema notifiche completo + PWA ready"
git push origin main
```

### 2. Vai su vercel.com
- Collega repository GitHub
- Auto-deploy attivo

## OPZIONE 3: Build Locale + Upload

### 1. Build produzione
```bash
npm run build
npm run export  # Se configurato
```

### 2. Upload su hosting (Netlify, Vercel, etc.)

## ⚠️ IMPORTANTE PRIMA DEL DEPLOY

### Variabili Ambiente (.env.production)
```env
NEXT_PUBLIC_SUPABASE_URL=https://ygvlcikgzkoaxlrmwsnv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlndmxjaWtnemtvYXhscm13c252Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzOTgzMzgsImV4cCI6MjA3NDk3NDMzOH0.Zc6eihyJiTZy6WicV6MyIgZ1Oq7GwzRYR01zovQHFPs
```

## 🎯 URL FINALE
Dopo deploy avrai: `https://tuo-progetto.vercel.app`

## 📱 TEST PWA SU TABLET
1. Apri URL produzione su tablet
2. Chrome → Menu → "Installa app"
3. Prova tutte le funzioni!

Preferisci quale metodo?