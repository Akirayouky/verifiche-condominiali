/** @type {import('next').NextConfig} */
const nextConfig = {
  // Variabili d'ambiente pubbliche per Supabase
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ygvlcikgzkoaxlrmwsnv.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlndmxjaWtnemtvYXhscm13c252Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzOTgzMzgsImV4cCI6MjA3NDk3NDMzOH0.Zc6eihyJiTZy6WicV6MyIgZ1Oq7GwzRYR01zovQHFPs'
  },
  
  // Ottimizzazioni per produzione (ottimizeCss disabilitato per compatibilità)
  
  // Configurazione normale per Node.js hosting
  
  // Compressione per migliorare le performance
  compress: true,
  
  // Headers di sicurezza per produzione
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
  
  // Configurazione per supportare deployment su subdirectory se necessario
  trailingSlash: false,
  
  // Ottimizzazioni immagini
  images: {
    formats: ['image/webp', 'image/avif'],
  },
};

// Configurazione PWA (riabilitare quando il server supporta service workers)
// const withPWA = require('next-pwa')({
//   dest: 'public',
//   register: true,
//   skipWaiting: true,
//   disable: process.env.NODE_ENV === 'development',
// });

// module.exports = withPWA(nextConfig);
module.exports = nextConfig;