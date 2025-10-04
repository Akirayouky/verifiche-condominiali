'use client'

import { useState, useEffect, useRef } from 'react'
import { Notifica, NotificationEvent } from '@/lib/types'

interface NotificationCenterProps {
  userId: string
  className?: string
}

export default function NotificationCenter({ userId, className = '' }: NotificationCenterProps) {
  const [notifiche, setNotifiche] = useState<Notifica[]>([])
  const [nonLette, setNonLette] = useState<number>(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const eventSourceRef = useRef<EventSource | null>(null)

  // Inizializza connessione SSE
  useEffect(() => {
    if (!userId) return

    console.log('🔗 Connecting to notifications stream for user:', userId)

    // Crea connessione EventSource per SSE
    const eventSource = new EventSource(`/api/notifications/stream?userId=${userId}`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      console.log('✅ Notifications stream connected')
      setIsConnected(true)
      setLoading(false)
    }

    eventSource.onmessage = (event) => {
      try {
        const eventData: NotificationEvent = JSON.parse(event.data)
        
        switch (eventData.type) {
          case 'heartbeat':
            // Heartbeat per mantenere connessione
            break
            
          case 'notification':
            console.log('📢 New notification received:', eventData.data.notifica?.titolo)
            if (eventData.data.notifica) {
              setNotifiche(prev => [eventData.data.notifica!, ...prev.slice(0, 49)]) // Keep max 50
              setNonLette(prev => prev + 1)
              
              // Mostra notifica browser se supportato
              if (Notification.permission === 'granted') {
                new Notification(eventData.data.notifica.titolo, {
                  body: eventData.data.notifica.messaggio,
                  icon: '/icon-192x192.png'
                })
              }
            }
            break
            
          case 'existing_notification':
            if (eventData.data.notifica) {
              setNotifiche(prev => {
                const exists = prev.find(n => n.id === eventData.data.notifica!.id)
                if (!exists) {
                  return [...prev, eventData.data.notifica!]
                }
                return prev
              })
              
              if (!eventData.data.notifica.letta) {
                setNonLette(prev => prev + 1)
              }
            }
            break
        }
      } catch (error) {
        console.error('❌ Error parsing notification event:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('❌ Notifications stream error:', error)
      setIsConnected(false)
      
      // Riconnetti dopo 5 secondi
      setTimeout(() => {
        if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
          console.log('🔄 Reconnecting to notifications stream...')
          // Ricrea connessione
        }
      }, 5000)
    }

    // Richiedi permesso notifiche browser
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Cleanup
    return () => {
      console.log('🔌 Closing notifications stream')
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [userId])

  // Marca notifica come letta
  const marcaComeLetta = async (notificaId: string) => {
    try {
      const response = await fetch('/api/notifications?action=mark-read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: notificaId })
      })

      if (response.ok) {
        setNotifiche(prev =>
          prev.map(n => n.id === notificaId ? { ...n, letta: true } : n)
        )
        setNonLette(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('❌ Errore marca come letta:', error)
    }
  }

  // Marca tutte come lette
  const marcaTutteComeLette = async () => {
    try {
      const response = await fetch(`/api/notifications?action=mark-all-read&userId=${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      if (response.ok) {
        setNotifiche(prev => prev.map(n => ({ ...n, letta: true })))
        setNonLette(0)
      }
    } catch (error) {
      console.error('❌ Errore marca tutte come lette:', error)
    }
  }



  const getPriorityIcon = (priorita: string) => {
    switch (priorita) {
      case 'urgente': return '🚨'
      case 'alta': return '⚠️'
      case 'media': return 'ℹ️'
      case 'bassa': return '💬'
      default: return 'ℹ️'
    }
  }

  const getPriorityColor = (priorita: string) => {
    switch (priorita) {
      case 'urgente': return 'border-red-500 bg-red-50'
      case 'alta': return 'border-orange-500 bg-orange-50'
      case 'media': return 'border-blue-500 bg-blue-50'
      case 'bassa': return 'border-gray-500 bg-gray-50'
      default: return 'border-gray-500 bg-gray-50'
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Bell Icon con Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
        title="Notifiche"
      >
        <div className="relative">
          🔔
          
          {/* Badge conteggio non lette */}
          {nonLette > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {nonLette > 99 ? '99+' : nonLette}
            </span>
          )}
          
          {/* Indicatore connessione */}
          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} title={isConnected ? 'Connesso' : 'Non connesso'} />
        </div>
      </button>

      {/* Pannello Notifiche */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Notifiche {nonLette > 0 && `(${nonLette} non lette)`}
              </h3>
              
              <div className="flex items-center gap-2">
                {nonLette > 0 && (
                  <button
                    onClick={marcaTutteComeLette}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Marca tutte come lette
                  </button>
                )}
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          {/* Lista Notifiche */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                Caricamento notifiche...
              </div>
            ) : notifiche.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                🎉 Nessuna notifica!
              </div>
            ) : (
              notifiche.map((notifica) => (
                <div
                  key={notifica.id}
                  className={`p-4 border-b border-gray-100 ${
                    !notifica.letta ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  } hover:bg-gray-50 transition-colors`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-lg">
                      {getPriorityIcon(notifica.priorita)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {notifica.titolo}
                        </h4>
                        
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {new Date(notifica.data_creazione).toLocaleString('it-IT', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-2">
                        {notifica.messaggio}
                      </p>
                      
                      {/* Marca come letta */}
                      {!notifica.letta && (
                        <button
                          onClick={() => marcaComeLetta(notifica.id)}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                        >
                          Marca come letta
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}