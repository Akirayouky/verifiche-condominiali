'use client'

import { useCondomini } from '@/hooks/useCondomini'

export default function Dashboard() {
  const { condomini, loading } = useCondomini()

  const stats = {
    condomininiAttivi: condomini.length,
    verificheCompletate: 85, // Mock per ora
    inCorso: 7, // Mock per ora
    scadute: 3 // Mock per ora
  }

  // Calcola condomini recenti (ultimi 7 giorni)
  const condomininiRecenti = condomini.filter(c => {
    const created = new Date(c.data_inserimento)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return created >= weekAgo
  }).length

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
                {loading ? '...' : stats.condomininiAttivi}
              </p>
            </div>
            <div className="text-blue-400 text-3xl">🏢</div>
          </div>
        </div>
        
        <div className="bg-green-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-800">Verifiche Completate</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.verificheCompletate}</p>
            </div>
            <div className="text-green-400 text-3xl">✅</div>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">In Corso</h3>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.inCorso}</p>
            </div>
            <div className="text-yellow-400 text-3xl">⏳</div>
          </div>
        </div>
        
        <div className="bg-red-50 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-red-800">Scadute</h3>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.scadute}</p>
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
              {condomininiRecenti}
            </span>
          </h3>
          
          {loading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          ) : condomini.length > 0 ? (
            <div className="space-y-3">
              {condomini.slice(-5).reverse().map((condominio) => (
                <div key={condominio.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-medium text-sm">
                        {condominio.nome.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{condominio.nome}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(condominio.data_inserimento).toLocaleDateString('it-IT')}
                      </div>
                    </div>
                  </div>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {condominio.token.slice(0, 12)}...
                  </code>
                </div>
              ))}
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
            <button className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🏢</span>
                <div>
                  <div className="font-medium text-gray-900">Nuovo Condominio</div>
                  <div className="text-sm text-gray-600">Aggiungi un nuovo condominio al sistema</div>
                </div>
              </div>
            </button>
            
            <button className="w-full text-left p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <div className="flex items-center">
                <span className="text-2xl mr-3">✅</span>
                <div>
                  <div className="font-medium text-gray-900">Nuova Verifica</div>
                  <div className="text-sm text-gray-600">Avvia il wizard per una nuova verifica</div>
                </div>
              </div>
            </button>
            
            <button className="w-full text-left p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📋</span>
                <div>
                  <div className="font-medium text-gray-900">Tipologie Verifiche</div>
                  <div className="text-sm text-gray-600">Gestisci le tipologie di verifica</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}