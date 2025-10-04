/**
 * Hook per gestione Push Notifications
 * 
 * Gestisce:
 * - Richiesta permessi
 * - Registrazione subscription
 * - Salvataggio su DB
 * - Stato permessi
 */

import { useState, useEffect, useCallback } from 'react'

export interface PushNotificationState {
  supported: boolean // Browser supporta Push API
  permission: NotificationPermission | null // 'default', 'granted', 'denied'
  subscription: PushSubscription | null // Subscription attiva
  loading: boolean
  error: string | null
}

export function usePushNotifications(utenteId?: string) {
  const [state, setState] = useState<PushNotificationState>({
    supported: false,
    permission: null,
    subscription: null,
    loading: false,
    error: null
  })

  // Verifica supporto Push API
  useEffect(() => {
    const checkSupport = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setState(prev => ({
          ...prev,
          supported: false,
          error: 'Push notifications non supportate in questo browser'
        }))
        return
      }

      setState(prev => ({ ...prev, supported: true }))

      // Ottieni permesso corrente
      if ('Notification' in window) {
        setState(prev => ({ ...prev, permission: Notification.permission }))
      }

      // Controlla se già abbiamo una subscription
      try {
        const registration = await navigator.serviceWorker.ready
        const existingSubscription = await registration.pushManager.getSubscription()
        
        if (existingSubscription) {
          setState(prev => ({ 
            ...prev, 
            subscription: existingSubscription,
            permission: Notification.permission 
          }))
        }
      } catch (error) {
        console.error('❌ Errore verifica subscription esistente:', error)
      }
    }

    checkSupport()
  }, [])

  /**
   * Richiedi permessi e registra subscription
   */
  const requestPermission = useCallback(async () => {
    console.log('🔔 Avvio richiesta permessi push...')
    
    if (!state.supported) {
      setState(prev => ({ 
        ...prev, 
        error: 'Push notifications non supportate' 
      }))
      return false
    }

    if (!utenteId) {
      setState(prev => ({ 
        ...prev, 
        error: 'utenteId richiesto per registrazione' 
      }))
      return false
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      console.log('📱 Richiesta permesso notifiche...')
      
      // Richiedi permesso
      const permission = await Notification.requestPermission()
      
      console.log('✅ Permesso ricevuto:', permission)
      setState(prev => ({ ...prev, permission }))

      if (permission !== 'granted') {
        setState(prev => ({ 
          ...prev, 
          loading: false,
          error: 'Permesso negato dall\'utente' 
        }))
        return false
      }

      console.log('🔧 Registrazione Service Worker...')
      
      // Registra Service Worker
      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      console.log('✅ Service Worker registrato')

      // Ottieni VAPID public key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      console.log('🔑 VAPID Key presente:', !!vapidPublicKey)
      
      if (!vapidPublicKey) {
        throw new Error('VAPID public key non configurata - controlla variabili ambiente su Vercel')
      }

      // Converti VAPID key in Uint8Array
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey)

      console.log('📝 Creazione subscription...')

      // Crea subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as BufferSource
      })

      console.log('✅ Push subscription creata:', subscription.endpoint)

      // Salva subscription su DB
      console.log('💾 Salvataggio subscription su DB...')
      
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          utenteId
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Errore salvataggio subscription: ${errorData.error || response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ Subscription salvata su DB:', result)

      setState(prev => ({ 
        ...prev, 
        subscription,
        loading: false,
        permission: 'granted'
      }))

      return true

    } catch (error) {
      console.error('❌ Errore registrazione push notification:', error)
      setState(prev => ({ 
        ...prev, 
        loading: false,
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      }))
      return false
    }
  }, [state.supported, utenteId])

  /**
   * Disabilita push notifications
   */
  const unsubscribe = useCallback(async () => {
    if (!state.subscription) {
      return true
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Rimuovi subscription dal browser
      await state.subscription.unsubscribe()

      // Rimuovi da DB
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: state.subscription.endpoint
        })
      })

      setState(prev => ({ 
        ...prev, 
        subscription: null,
        loading: false
      }))

      console.log('🗑️ Push subscription rimossa')
      return true

    } catch (error) {
      console.error('❌ Errore rimozione subscription:', error)
      setState(prev => ({ 
        ...prev, 
        loading: false,
        error: error instanceof Error ? error.message : 'Errore rimozione'
      }))
      return false
    }
  }, [state.subscription])

  return {
    ...state,
    requestPermission,
    unsubscribe,
    isSubscribed: !!state.subscription && state.permission === 'granted'
  }
}

/**
 * Utility: Converte VAPID key da base64 a Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}
