'use client'

import { useState, useEffect } from 'react'

interface DashboardProps {
  onNavigate?: (section: string) => void
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState({
    condomini: { totali: 0, attivi: 0, inattivi: 0 },
    tipologie: { totali: 0, attive: 0, inattive: 0 },
    verifiche: {
      totali: 0,
      verificheCompletate: 0,
      inCorso: 0,
      scadute: 0
    },
    lavorazioni: {
      totali: 0,
      da_eseguire: 0,
      in_corso: 0,
      completate: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now())

  // Funzione per ricaricare le statistiche
  const loadStats = async (showLoading = false) => {
    if (showLoading) setLoading(true)
    
    try {
      // Aggiungi timestamp per evitare cache
      const response = await fetch(`/api/dashboard/stats?t=${Date.now()}`)
      const result = await response.json()
      
      if (result.success) {
        setStats({
          condomini: { 
            totali: result.data.totali.condomini, 
            attivi: result.data.totali.condomini, 
            inattivi: 0 
          },
          tipologie: { 
            totali: result.data.totali.tipologie, 
            attive: result.data.totali.tipologie, 
            inattive: 0 
          },
          verifiche: {
            totali: result.data.totali.verifiche,
            verificheCompletate: result.data.lavorazioni.completate || 0,
            inCorso: result.data.lavorazioni.in_corso || 0,
            scadute: 0
          },
          lavorazioni: {
            totali: result.data.lavorazioni.totali,
            da_eseguire: result.data.lavorazioni.da_eseguire,
            in_corso: result.data.lavorazioni.in_corso,
            completate: result.data.lavorazioni.completate
          }
        })
        setLastUpdate(Date.now())
      }
    } catch (error) {
      console.error('Errore nel caricamento delle statistiche:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Caricamento iniziale
    loadStats(true)

    // Auto-refresh ogni 30 secondi
    const interval = setInterval(() => {
      loadStats(false)
    }, 30000)

    // Listener per eventi personalizzati di refresh stats
    const handleRefreshStats = () => {
      console.log('🔄 Dashboard: Refresh statistiche richiesto')
      loadStats(false)
    }

    // Aggiungi listener per eventi globali
    window.addEventListener('refreshStats', handleRefreshStats)
    window.addEventListener('focus', handleRefreshStats) // Refresh quando torna la finestra

    return () => {
      clearInterval(interval)
      window.removeEventListener('refreshStats', handleRefreshStats)
      window.removeEventListener('focus', handleRefreshStats)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        <span className="ml-3 text-gray-600">Caricamento statistiche...</span>
      </div>
    )
  }

  // Calcola condomini recenti (ultimi 7 giorni) - rimosso per ora dato che condomini non è definito
  const condomininiRecenti = 0

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h2>
      
      {/* Statistiche principali */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-800">Condomini Attivi</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {loading ? '...' : stats.condomini.attivi}
              </p>
            </div>
            <div className="text-blue-400 text-3xl">🏢</div>
          </div>
        </div>
        
        <div className="bg-green-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-800">Verifiche Completate</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.verifiche.verificheCompletate}</p>
            </div>
            <div className="text-green-400 text-3xl">✅</div>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">In Corso</h3>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.verifiche.inCorso}</p>
            </div>
            <div className="text-yellow-400 text-3xl">⏳</div>
          </div>
        </div>
        
        <div className="bg-red-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-red-800">Scadute</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.verifiche.scadute}</p>
            </div>
            <div className="text-red-400 text-3xl">⚠️</div>
          </div>
        </div>
      </div>

      {/* Attività recenti */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Condomini recenti */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Condomini Recenti
            <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {stats.condomini.totali}
            </span>
          </h3>
          
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          ) : stats.condomini.totali > 0 ? (
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.condomini.totali}</div>
              <div className="text-sm text-gray-500">condomini registrati</div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              Nessun condominio presente
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Azioni Rapide</h3>
          <div className="space-y-3">
            <button 
              onClick={() => onNavigate?.('condomini')}
              className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">🏢</span>
                <div>
                  <div className="font-medium text-gray-900">Nuovo Condominio</div>
                  <div className="text-sm text-gray-600">Aggiungi un nuovo condominio al sistema</div>
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => onNavigate?.('verifiche')}
              className="w-full text-left p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">✅</span>
                <div>
                  <div className="font-medium text-gray-900">Nuova Verifica</div>
                  <div className="text-sm text-gray-600">Avvia il wizard per una nuova verifica</div>
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => onNavigate?.('tipologie')}
              className="w-full text-left p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">📋</span>
                <div>
                  <div className="font-medium text-gray-900">Tipologie Verifiche</div>
                  <div className="text-sm text-gray-600">Gestisci le tipologie di verifica</div>
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => onNavigate?.('admin')}
              className="w-full text-left p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">⚙️</span>
                <div>
                  <div className="font-medium text-gray-900">Pannello Admin</div>
                  <div className="text-sm text-gray-600">Gestisci lavorazioni e riapri verifiche</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}