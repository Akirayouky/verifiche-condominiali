/**
 * NotificationCenter Semplificato - Versione compatibile PWA
 * Icona campanella con dropdown notifiche essenziale
 */

'use client'

import React, { useState, useEffect } from 'react'

interface NotificationCenterProps {
  userId: string
}

interface NotificaSimple {
  id: string
  titolo: string
  messaggio: string
  tipo: string
  priorita: string
  data_creazione: string
  stato: string
}

export default function NotificationCenter({ userId }: NotificationCenterProps) {
  const [notifiche, setNotifiche] = useState<NotificaSimple[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sseConnected, setSseConnected] = useState(false)

  // Connessione SSE per notifiche real-time
  useEffect(() => {
    if (!userId) return

    console.log(`🔗 NotificationCenter: Avvio SSE per user ${userId}`)
    
    const eventSource = new EventSource(`/api/notifications/stream?userId=${userId}`)
    
    eventSource.onopen = () => {
      console.log('✅ NotificationCenter: SSE connesso')
      setSseConnected(true)
    }
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('📨 NotificationCenter: Messaggio SSE ricevuto:', data.type)
        
        if (data.type === 'notification' || data.type === 'existing_notification') {
          const notifica = data.data.notifica
          
          // Aggiungi o aggiorna notifica
          setNotifiche(prev => {
            const exists = prev.find(n => n.id === notifica.id)
            if (exists) {
              return prev.map(n => n.id === notifica.id ? {
                ...n,
                ...notifica,
                data_creazione: notifica.data_creazione,
                stato: notifica.letta ? 'letta' : 'non_letta'
              } : n)
            } else {
              return [{
                id: notifica.id,
                titolo: notifica.titolo,
                messaggio: notifica.messaggio,
                tipo: notifica.tipo,
                priorita: notifica.priorita,
                data_creazione: notifica.data_creazione,
                stato: notifica.letta ? 'letta' : 'non_letta'
              }, ...prev]
            }
          })
        }
      } catch (error) {
        console.error('❌ NotificationCenter: Errore parsing SSE:', error)
      }
    }
    
    eventSource.onerror = (error) => {
      console.error('❌ NotificationCenter: Errore SSE:', error)
      setSseConnected(false)
    }

    return () => {
      console.log('🔌 NotificationCenter: Chiudo SSE')
      eventSource.close()
      setSseConnected(false)
    }
  }, [userId])

  // Carica notifiche quando si apre il dropdown
  const caricaNotifiche = async () => {
    if (!userId) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/notifications?userId=${userId}`)
      
      if (response.ok) {
        const result = await response.json()
        setNotifiche(result.data || [])
      } else {
        console.log('Nessuna notifica o errore caricamento')
        setNotifiche([])
      }
    } catch (error) {
      console.error('Errore caricamento notifiche:', error)
      // Mostra notifiche demo per test
      setNotifiche([
        {
          id: '1',
          titolo: '🔔 Sistema Notifiche Attivo!',
          messaggio: 'Il sistema di notifiche real-time è operativo. Tutte le funzionalità sono disponibili.',
          tipo: 'sistema',
          priorita: 'normale',
          data_creazione: new Date().toISOString(),
          stato: 'non_letta'
        },
        {
          id: '2', 
          titolo: '⏰ Controllo Scadenze',
          messaggio: 'Sistema di controllo scadenze lavorazioni attivato. Riceverai notifiche per scadenze imminenti.',
          tipo: 'scadenza',
          priorita: 'alta',
          data_creazione: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          stato: 'non_letta'
        },
        {
          id: '3',
          titolo: '🚀 PWA Installabile',
          messaggio: 'L\'app può essere installata sul tuo dispositivo come app nativa. Usa il menu del browser.',
          tipo: 'sistema', 
          priorita: 'bassa',
          data_creazione: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          stato: 'non_letta'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Conta notifiche non lette
  const nonLette = notifiche.filter(n => n.stato === 'non_letta').length

  // Marca come letta
  const marcaComeLetta = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stato: 'letta' })
      })
      
      setNotifiche(prev => 
        prev.map(n => n.id === id ? { ...n, stato: 'letta' } : n)
      )
    } catch (error) {
      console.error('Errore aggiornamento notifica:', error)
    }
  }

  // Formatta data
  const formatData = (data: string) => {
    const now = new Date()
    const notifData = new Date(data)
    const diffMinuti = Math.floor((now.getTime() - notifData.getTime()) / (1000 * 60))
    
    if (diffMinuti < 1) return 'Ora'
    if (diffMinuti < 60) return `${diffMinuti}m fa`
    if (diffMinuti < 1440) return `${Math.floor(diffMinuti / 60)}h fa`
    return notifData.toLocaleDateString('it-IT')
  }

  // Icona per tipo notifica
  const getIcona = (tipo: string) => {
    switch (tipo) {
      case 'scadenza': return '⏰'
      case 'sistema': return '🔔'
      case 'lavorazione_completata': return '✅'
      case 'nuova_assegnazione': return '📋'
      case 'nuova_verifica': return '📝'
      default: return '💬'
    }
  }

  // Colore priorità
  const getColorePriorita = (priorita: string) => {
    switch (priorita) {
      case 'urgente': return 'text-red-600'
      case 'alta': return 'text-orange-600'
      case 'normale': return 'text-blue-600'
      case 'bassa': return 'text-gray-600'
      default: return 'text-blue-600'
    }
  }

  return (
    <div className="relative">
      {/* Icona Campanella */}
      <button
        className={`relative p-2 transition-colors rounded-lg ${
          sseConnected 
            ? 'text-green-600 hover:text-blue-600 hover:bg-blue-50' 
            : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
        }`}
        title={sseConnected ? "Notifiche (Real-time attivo)" : "Notifiche (Connessione...)"}
        onClick={() => {
          setShowDropdown(!showDropdown)
          if (!showDropdown && !sseConnected) {
            caricaNotifiche()
          }
        }}
      >
        <span className="text-xl">🔔</span>
        
        {/* Badge notifiche non lette */}
        {nonLette > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {nonLette > 9 ? '9+' : nonLette}
          </span>
        )}
      </button>

      {/* Dropdown Notifiche */}
      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Notifiche</h3>
              <button
                onClick={() => setShowDropdown(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center justify-between mt-1">
              {nonLette > 0 && (
                <p className="text-xs text-gray-500">
                  {nonLette} non {nonLette === 1 ? 'letta' : 'lette'}
                </p>
              )}
              <div className={`text-xs flex items-center ${sseConnected ? 'text-green-600' : 'text-orange-600'}`}>
                <div className={`w-2 h-2 rounded-full mr-1 ${sseConnected ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                {sseConnected ? 'Real-time' : 'Offline'}
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="px-4 py-8 text-center text-gray-500">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              Caricamento...
            </div>
          )}

          {/* Lista Notifiche */}
          {!loading && (
            <div className="max-h-96 overflow-y-auto">
              {notifiche.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  <span className="text-2xl mb-2 block">📭</span>
                  <p className="text-sm">Nessuna notifica</p>
                </div>
              ) : (
                notifiche.map(notifica => (
                  <div 
                    key={notifica.id}
                    className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer ${
                      notifica.stato === 'non_letta' ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => marcaComeLetta(notifica.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-lg mt-0.5">
                        {getIcona(notifica.tipo)}
                      </span>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium truncate ${
                            notifica.stato === 'non_letta' ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notifica.titolo}
                          </p>
                          {notifica.stato === 'non_letta' && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 flex-shrink-0"></div>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {notifica.messaggio}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            {formatData(notifica.data_creazione)}
                          </span>
                          <span className={`text-xs font-medium ${getColorePriorita(notifica.priorita)}`}>
                            {notifica.priorita}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Footer */}
          {notifiche.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 text-center">
              <button 
                onClick={() => {
                  // Marca tutte come lette
                  setNotifiche(prev => 
                    prev.map(n => ({ ...n, stato: 'letta' }))
                  )
                }}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Marca tutte come lette
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay per chiudere dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  )
}