/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Debug hydration mismatch
  experimental: {
    // Mostra dettagli errore hydration
    scrollRestoration: true,
  },
  // Logging per debug
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  // Configurazione per Image component con Vercel Blob
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig