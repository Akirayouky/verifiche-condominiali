import type { Metadata, Viewport } from 'next'
import './globals.css'
import DebugPanel from '@/components/ui/DebugPanel'

const APP_NAME = 'Verifiche Condominiali'
const APP_DESCRIPTION = 'App PWA per gestione verifiche condominiali'

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <head>
        {/* Eruda Console per debug mobile - attivabile con ?debug=1 nell'URL */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get('debug') === '1') {
                  var script = document.createElement('script');
                  script.src = 'https://cdn.jsdelivr.net/npm/eruda';
                  script.onload = function() { eruda.init(); };
                  document.head.appendChild(script);
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-gray-50">
        {children}
        <DebugPanel />
      </body>
    </html>
  )
}