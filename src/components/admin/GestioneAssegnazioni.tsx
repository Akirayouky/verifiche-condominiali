'use client'

import { useState, useEffect, useCallback } from 'react'
import { Condominio, User } from '@/lib/types'

interface AssegnamentoStats {
  totaleCondomini: number
  assegnati: number
  nonAssegnati: number
  sopralluoghisti: {
    id: string
    nome: string
    cognome: string
    condominiumCount: number
  }[]
}

export default function GestioneAssegnazioni() {
  const [condomini, setCondomini] = useState<Condominio[]>([])
  const [sopralluoghisti, setSopralluoghisti] = useState<User[]>([])
  const [stats, setStats] = useState<AssegnamentoStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCondomini, setSelectedCondomini] = useState<Set<string>>(new Set())
  const [filtroAssegnazione, setFiltroAssegnazione] = useState<'tutti' | 'assegnati' | 'non-assegnati'>('tutti')
  const [sopralluoghistaSelezionato, setSopralluoghistaSelezionato] = useState<string>('')

  // Carica dati iniziali
  useEffect(() => {
    Promise.all([
      caricaCondomini(),
      caricaSopralluoghisti()
    ]).finally(() => setLoading(false))
  }, [])

  const caricaCondomini = async () => {
    try {
      const response = await fetch('/api/condomini')
      const result = await response.json()
      
      if (result.success) {
        setCondomini(result.data)
      } else {
        alert('Errore nel caricamento condomini: ' + result.error)
      }
    } catch (error) {
      alert('Errore nel caricamento condomini')
    }
  }

  const caricaSopralluoghisti = async () => {
    try {
      const response = await fetch('/api/users')
      const result = await response.json()
      
      if (result.success) {
        // Filtra solo sopralluoghisti attivi e approvati
        const sopralluoghistiAttivi = result.data.filter(
          (user: User) => user.role === 'sopralluoghista' && user.attivo && user.approved_at
        )
        setSopralluoghisti(sopralluoghistiAttivi)
      } else {
        alert('Errore nel caricamento sopralluoghisti: ' + result.error)
      }
    } catch (error) {
      alert('Errore nel caricamento sopralluoghisti')
    }
  }

  const calcolaStats = useCallback(() => {
    const assegnati = condomini.filter(c => c.assigned_to).length
    const nonAssegnati = condomini.length - assegnati
    
    const sopralluoghistiStats = sopralluoghisti.map(s => ({
      id: s.id,
      nome: s.nome || s.username,
      cognome: s.cognome || '',
      condominiumCount: condomini.filter(c => c.assigned_to === s.id).length
    }))

    setStats({
      totaleCondomini: condomini.length,
      assegnati,
      nonAssegnati,
      sopralluoghisti: sopralluoghistiStats
    })
  }, [condomini, sopralluoghisti])

  // Calcola statistiche quando cambiano i dati
  useEffect(() => {
    if (condomini.length > 0 && sopralluoghisti.length > 0) {
      calcolaStats()
    }
  }, [condomini, sopralluoghisti, calcolaStats])

  const condominiFiltrati = condomini.filter(condominio => {
    if (filtroAssegnazione === 'assegnati') return condominio.assigned_to
    if (filtroAssegnazione === 'non-assegnati') return !condominio.assigned_to
    return true
  })

  const toggleSelezioneCondominio = (id: string) => {
    const newSelection = new Set(selectedCondomini)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedCondomini(newSelection)
  }

  const selezionaTutti = () => {
    setSelectedCondomini(new Set(condominiFiltrati.map(c => c.id)))
  }

  const deselezionaTutti = () => {
    setSelectedCondomini(new Set())
  }

  const assegnaBatch = async () => {
    if (selectedCondomini.size === 0) {
      alert('Seleziona almeno un condominio')
      return
    }

    if (!sopralluoghistaSelezionato && !confirm('Vuoi rimuovere tutte le assegnazioni selezionate?')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/condomini/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          condomini_ids: Array.from(selectedCondomini),
          sopralluoghista_id: sopralluoghistaSelezionato || null
        })
      })

      const result = await response.json()
      
      if (result.success || result.summary?.success > 0) {
        alert(result.message)
        setSelectedCondomini(new Set())
        await caricaCondomini() // Ricarica per vedere i cambiamenti
      } else {
        alert('Errore nell\'assegnazione: ' + result.error)
      }
    } catch (error) {
      alert('Errore nell\'assegnazione batch')
    } finally {
      setLoading(false)
    }
  }

  const assegnaSingolo = async (condominioId: string, sopralluoghistaId: string | null) => {
    try {
      const response = await fetch('/api/condomini/assign', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          condominio_id: condominioId,
          sopralluoghista_id: sopralluoghistaId
        })
      })

      const result = await response.json()
      
      if (result.success) {
        await caricaCondomini() // Ricarica per vedere i cambiamenti
      } else {
        alert('Errore nell\'assegnazione: ' + result.error)
      }
    } catch (error) {
      alert('Errore nell\'assegnazione')
    }
  }

  const getSopralluoghistaName = (id: string) => {
    const sopralluoghista = sopralluoghisti.find(s => s.id === id)
    if (!sopralluoghista) return 'Utente non trovato'
    return `${sopralluoghista.nome || sopralluoghista.username} ${sopralluoghista.cognome || ''}`.trim()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-lg">Caricamento assegnazioni...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header e Statistiche */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">🏢 Gestione Assegnazioni Condomini</h2>
        
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.totaleCondomini}</div>
              <div className="text-sm text-gray-600">Totale Condomini</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.assegnati}</div>
              <div className="text-sm text-gray-600">Assegnati</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{stats.nonAssegnati}</div>
              <div className="text-sm text-gray-600">Non Assegnati</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{sopralluoghisti.length}</div>
              <div className="text-sm text-gray-600">Sopralluoghisti</div>
            </div>
          </div>
        )}

        {/* Statistiche per Sopralluoghista */}
        {stats?.sopralluoghisti && stats.sopralluoghisti.length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium mb-3">Carico di lavoro per sopralluoghista:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {stats.sopralluoghisti.map(s => (
                <div key={s.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{s.nome} {s.cognome}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    s.condominiumCount === 0 ? 'bg-gray-200' :
                    s.condominiumCount <= 3 ? 'bg-green-100 text-green-700' :
                    s.condominiumCount <= 6 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {s.condominiumCount} condomini
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controlli Batch */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold mb-4">Assegnazione Batch</h3>
        
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sopralluoghista per assegnazione
            </label>
            <select
              value={sopralluoghistaSelezionato}
              onChange={(e) => setSopralluoghistaSelezionato(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Seleziona sopralluoghista per assegnazione"
            >
              <option value="">-- Rimuovi assegnazione --</option>
              {sopralluoghisti.map(s => (
                <option key={s.id} value={s.id}>
                  {getSopralluoghistaName(s.id)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={selezionaTutti}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Seleziona Tutti
            </button>
            <button
              onClick={deselezionaTutti}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Deseleziona
            </button>
            <button
              onClick={assegnaBatch}
              disabled={selectedCondomini.size === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Assegna ({selectedCondomini.size})
            </button>
          </div>
        </div>
      </div>

      {/* Lista Condomini */}
      <div className="bg-white rounded-lg shadow">
        {/* Filtri */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="filtroAssegnazione"
                  value="tutti"
                  checked={filtroAssegnazione === 'tutti'}
                  onChange={(e) => setFiltroAssegnazione(e.target.value as any)}
                  className="mr-2"
                />
                Tutti ({condomini.length})
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="filtroAssegnazione"
                  value="assegnati"
                  checked={filtroAssegnazione === 'assegnati'}
                  onChange={(e) => setFiltroAssegnazione(e.target.value as any)}
                  className="mr-2"
                />
                Assegnati ({stats?.assegnati || 0})
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="filtroAssegnazione"
                  value="non-assegnati"
                  checked={filtroAssegnazione === 'non-assegnati'}
                  onChange={(e) => setFiltroAssegnazione(e.target.value as any)}
                  className="mr-2"
                />
                Non Assegnati ({stats?.nonAssegnati || 0})
              </label>
            </div>
            
            <div className="text-sm text-gray-600">
              {selectedCondomini.size} selezionati
            </div>
          </div>
        </div>

        {/* Tabella */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    onChange={(e) => e.target.checked ? selezionaTutti() : deselezionaTutti()}
                    checked={selectedCondomini.size === condominiFiltrati.length && condominiFiltrati.length > 0}
                    aria-label="Seleziona tutti i condomini"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Condominio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sopralluoghista Assegnato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {condominiFiltrati.map((condominio) => (
                <tr key={condominio.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedCondomini.has(condominio.id)}
                      onChange={() => toggleSelezioneCondominio(condominio.id)}
                      aria-label={`Seleziona ${condominio.nome}`}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{condominio.nome}</div>
                    <div className="text-sm text-gray-500">Token: {condominio.token}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {condominio.assigned_to ? (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        {getSopralluoghistaName(condominio.assigned_to)}
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                        Non assegnato
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <select
                      value={condominio.assigned_to || ''}
                      onChange={(e) => assegnaSingolo(condominio.id, e.target.value || null)}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      aria-label={`Assegna ${condominio.nome}`}
                    >
                      <option value="">-- Non assegnato --</option>
                      {sopralluoghisti.map(s => (
                        <option key={s.id} value={s.id}>
                          {getSopralluoghistaName(s.id)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {condominiFiltrati.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nessun condominio trovato con i filtri selezionati
            </div>
          )}
        </div>
      </div>
    </div>
  )
}