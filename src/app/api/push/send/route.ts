/**
 * API per inviare Push Notifications
 * 
 * POST /api/push/send - Invia push notification a specifici utenti
 */

import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { supabase } from '@/lib/supabase'

// Configura VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@condomini-app.it',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    process.env.VAPID_PRIVATE_KEY
  )
} else {
  console.warn('⚠️ VAPID keys non configurate - Push notifications disabilitate')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      utenteIds, 
      title, 
      message, 
      url, 
      priorita = 'media',
      notificaId,
      lavorazioneId,
      condominioId 
    } = body

    if (!utenteIds || !Array.isArray(utenteIds) || utenteIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'utenteIds array richiesto' },
        { status: 400 }
      )
    }

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: 'title e message richiesti' },
        { status: 400 }
      )
    }

    // Verifica VAPID keys
    if (!process.env.VAPID_PRIVATE_KEY) {
      return NextResponse.json(
        { success: false, error: 'Push notifications non configurate' },
        { status: 500 }
      )
    }

    // Query subscriptions per gli utenti target
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('utente_id', utenteIds)

    if (error) {
      console.error('❌ Errore query subscriptions:', error)
      return NextResponse.json(
        { success: false, error: 'Errore recupero subscriptions' },
        { status: 500 }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('⚠️ Nessuna subscription trovata per utenti:', utenteIds)
      return NextResponse.json({ 
        success: true, 
        sent: 0,
        message: 'Nessuna subscription trovata' 
      })
    }

    console.log(`📤 Invio push a ${subscriptions.length} subscriptions per ${utenteIds.length} utenti`)

    // Payload della notifica
    const payload = JSON.stringify({
      title,
      body: message,
      message, // Backup
      icon: '/icon-192x192.png',
      badge: '/icon-96x96.png',
      url: url || '/',
      priorita,
      notificaId,
      lavorazioneId,
      condominioId,
      timestamp: Date.now()
    })

    // Invia push a tutte le subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: sub.keys
          }

          await webpush.sendNotification(pushSubscription, payload)
          
          // Aggiorna last_used_at
          await supabase
            .from('push_subscriptions')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', sub.id)

          return { success: true, subscriptionId: sub.id }
        } catch (error: any) {
          console.error(`❌ Errore invio push a subscription ${sub.id}:`, error)

          // Se subscription non più valida (410 Gone), rimuovila
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`🗑️ Rimozione subscription non valida: ${sub.id}`)
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('id', sub.id)
          }

          return { 
            success: false, 
            subscriptionId: sub.id, 
            error: error.message 
          }
        }
      })
    )

    // Conta successi e fallimenti
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.length - successful

    console.log(`✅ Push inviati: ${successful}/${results.length} (${failed} falliti)`)

    return NextResponse.json({
      success: true,
      sent: successful,
      failed: failed,
      total: results.length,
      results: results.map(r => 
        r.status === 'fulfilled' ? r.value : { success: false, error: 'Promise rejected' }
      )
    })

  } catch (error) {
    console.error('❌ Errore POST /api/push/send:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Errore interno del server' 
      },
      { status: 500 }
    )
  }
}
