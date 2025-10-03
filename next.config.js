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
}

module.exports = nextConfig