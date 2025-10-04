/**
 * API Route per Server-Sent Events (SSE) - Notifiche Real-Time
 * GET /api/notifications/stream
 */

import { NextRequest } from 'next/server'
import { NotificationManager } from '@/lib/notifications'

export async function GET(request: NextRequest) {
  // Estrai user ID dai parametri
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return new Response('User ID required', { status: 400 })
  }

  console.log(`🔗 SSE Connection opened for user: ${userId}`)

  // Crea stream per Server-Sent Events
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    start(controller) {
      // Invia heartbeat iniziale
      const heartbeat = `data: ${JSON.stringify({
        type: 'heartbeat',
        data: {
          timestamp: new Date().toISOString(),
          message: 'Connected to notification stream',
          utente_id: userId
        }
      })}\n\n`
      
      controller.enqueue(encoder.encode(heartbeat))

      // Setup heartbeat ogni 30 secondi per mantenere connessione
      const heartbeatInterval = setInterval(() => {
        try {
          const heartbeat = `data: ${JSON.stringify({
            type: 'heartbeat',
            data: {
              timestamp: new Date().toISOString(),
              utente_id: userId
            }
          })}\n\n`
          
          controller.enqueue(encoder.encode(heartbeat))
        } catch (error) {
          console.log(`❌ Heartbeat failed for user ${userId}, closing connection`)
          clearInterval(heartbeatInterval)
          controller.close()
        }
      }, 30000)

      // Sottoscrivi alle notifiche per questo utente
      const notificationManager = NotificationManager.getInstance()
      
      const unsubscribe = notificationManager.subscribe(userId, (notification) => {
        try {
          console.log(`📤 Sending notification to user ${userId}:`, notification.titolo)
          
          const eventData = `data: ${JSON.stringify({
            type: 'notification',
            data: {
              notifica: notification,
              timestamp: new Date().toISOString(),
              utente_id: userId
            }
          })}\n\n`
          
          controller.enqueue(encoder.encode(eventData))
        } catch (error) {
          console.error(`❌ Error sending notification to user ${userId}:`, error)
        }
      })

      // Invia notifiche non lette esistenti al connect
      notificationManager.getNotificheNonLette(userId).then(notifiche => {
        for (const notifica of notifiche) {
          const eventData = `data: ${JSON.stringify({
            type: 'existing_notification',
            data: {
              notifica,
              timestamp: new Date().toISOString(),
              utente_id: userId
            }
          })}\n\n`
          
          controller.enqueue(encoder.encode(eventData))
        }
        
        console.log(`📋 Sent ${notifiche.length} existing notifications to user ${userId}`)
      }).catch(error => {
        console.error(`❌ Error loading existing notifications for user ${userId}:`, error)
      })

      // Cleanup quando la connessione si chiude
      request.signal?.addEventListener('abort', () => {
        console.log(`🔌 SSE Connection closed for user: ${userId}`)
        clearInterval(heartbeatInterval)
        unsubscribe()
        controller.close()
      })
    },

    cancel() {
      console.log(`🔌 SSE Stream cancelled for user: ${userId}`)
    }
  })

  // Headers per Server-Sent Events
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
}