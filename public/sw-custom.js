/**
 * Custom Service Worker for Push Notifications
 * 
 * Questo SW estende il default di next-pwa con handler per push notifications
 */

// Import the default next-pwa service worker
importScripts('/sw.js')

/**
 * Handler per evento 'push' - Riceve notifiche push dal server
 */
self.addEventListener('push', function(event) {
  console.log('🔔 Push notification ricevuta:', event)
  
  if (!event.data) {
    console.warn('⚠️ Push senza dati ricevuta')
    return
  }

  try {
    const data = event.data.json()
    console.log('📩 Dati push:', data)
    
    const title = data.title || 'Nuova Notifica'
    const options = {
      body: data.body || data.message || '',
      icon: data.icon || '/icon-192x192.png',
      badge: '/icon-96x96.png',
      tag: data.tag || 'notifica-' + Date.now(),
      data: {
        url: data.url || '/',
        notificaId: data.notificaId,
        lavorazioneId: data.lavorazioneId,
        condominioId: data.condominioId
      },
      actions: [
        {
          action: 'open',
          title: 'Apri',
          icon: '/icon-96x96.png'
        },
        {
          action: 'close',
          title: 'Chiudi'
        }
      ],
      requireInteraction: data.priorita === 'alta', // Notifiche urgenti richiedono azione
      vibrate: data.priorita === 'alta' ? [200, 100, 200] : [100],
      silent: false
    }

    event.waitUntil(
      self.registration.showNotification(title, options)
    )
  } catch (error) {
    console.error('❌ Errore parsing dati push:', error)
    
    // Fallback: mostra notifica generica
    event.waitUntil(
      self.registration.showNotification('Nuova Notifica', {
        body: 'Hai ricevuto una nuova notifica',
        icon: '/icon-192x192.png'
      })
    )
  }
})

/**
 * Handler per click su notifica
 */
self.addEventListener('notificationclick', function(event) {
  console.log('👆 Click su notifica:', event)
  
  event.notification.close()
  
  // Determina URL da aprire
  let targetUrl = '/'
  
  if (event.action === 'close') {
    return
  }
  
  if (event.action === 'open' || !event.action) {
    if (event.notification.data && event.notification.data.url) {
      targetUrl = event.notification.data.url
    } else if (event.notification.data && event.notification.data.lavorazioneId) {
      // Se c'è una lavorazione, vai alla dashboard
      targetUrl = '/'
    }
  }
  
  // Apri o focalizza finestra esistente
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      // Cerca finestra già aperta con l'app
      for (let client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus().then(function() {
            // Naviga alla URL target
            if (targetUrl !== '/') {
              return client.navigate(targetUrl)
            }
            return client
          })
        }
      }
      
      // Se nessuna finestra aperta, aprine una nuova
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})

/**
 * Handler per chiusura notifica
 */
self.addEventListener('notificationclose', function(event) {
  console.log('❌ Notifica chiusa:', event.notification.tag)
  
  // Opzionale: invia analytics o log al server
  // fetch('/api/analytics/notification-closed', {
  //   method: 'POST',
  //   body: JSON.stringify({ tag: event.notification.tag })
  // })
})

console.log('✅ Custom Service Worker con Push Notifications caricato')
