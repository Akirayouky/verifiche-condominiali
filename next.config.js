/** @type {import('next').NextConfig} */
const nextConfig = {
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