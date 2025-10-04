'use client';

import { useState } from 'react';

interface TestLavorazioneData {
  condominio_id: string;
  tipologia_id: string;
  descrizione: string;
  sopralluoghista_id: string;
  data_scadenza: string;
  note?: string;
}

export default function TestLavorazioniNotifichePage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [formData, setFormData] = useState<TestLavorazioneData>({
    condominio_id: '00000000-1111-2222-3333-444444444444', // Condominio test fisso
    tipologia_id: crypto.randomUUID(),
    descrizione: 'Test lavorazione per notifica sopralluoghista',
    sopralluoghista_id: '0a534c3a-daf0-41a2-8821-9aa003c9e423', // Monica Canavese
    data_scadenza: '2025-10-15',
    note: 'Test automatico per verificare notifiche'
  });

  const testCreateLavorazione = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-lavorazioni', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        const nomeUtente = formData.sopralluoghista_id === '0a534c3a-daf0-41a2-8821-9aa003c9e423' ? 'Monica Canavese' :
                          formData.sopralluoghista_id === 'e1017f5d-83e1-4da3-ac81-4924a0dfd010' ? 'Diego Marruchi' : 'Utente Test';
        
        setResults(prev => [{
          success: true,
          message: `✅ Lavorazione creata! Notifica inviata a: ${nomeUtente}. Verifica nel NotificationCenter dell'app.`,
          data: result,
          timestamp: new Date().toISOString()
        }, ...prev]);
      } else {
        setResults(prev => [{
          success: false,
          message: `❌ Errore creazione lavorazione: ${result.error || 'Errore sconosciuto'}`,
          data: result,
          timestamp: new Date().toISOString()
        }, ...prev]);
      }
    } catch (error) {
      setResults(prev => [{
        success: false,
        message: `❌ Errore rete: ${error instanceof Error ? error.message : 'Sconosciuto'}`,
        timestamp: new Date().toISOString()
      }, ...prev]);
    }
    setLoading(false);
  };

  const testNotificationApi = async () => {
    setLoading(true);
    try {
      const testNotifica = {
        tipo: 'nuova_assegnazione',
        titolo: 'Test API Notifica',
        messaggio: 'Test diretto API notifiche',
        utente_id: formData.sopralluoghista_id,
        priorita: 'alta'
      };

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testNotifica)
      });

      const result = await response.json();

      if (response.ok) {
        setResults(prev => [{
          success: true,
          message: '✅ Notifica creata direttamente tramite API',
          data: result,
          timestamp: new Date().toISOString()
        }, ...prev]);
      } else {
        setResults(prev => [{
          success: false,
          message: `❌ Errore API notifica: ${result.error || 'Errore sconosciuto'}`,
          data: result,
          timestamp: new Date().toISOString()
        }, ...prev]);
      }
    } catch (error) {
      setResults(prev => [{
        success: false,
        message: `❌ Errore API: ${error instanceof Error ? error.message : 'Sconosciuto'}`,
        timestamp: new Date().toISOString()
      }, ...prev]);
    }
    setLoading(false);
  };

  const generateNewIds = () => {
    setFormData(prev => ({
      ...prev,
      condominio_id: crypto.randomUUID(),
      tipologia_id: crypto.randomUUID(),
      sopralluoghista_id: crypto.randomUUID()
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            🔄 Test Integrazione Lavorazioni → Notifiche
          </h1>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Form per test lavorazione */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">📋 Dati Test Lavorazione</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sopralluoghista (riceverà la notifica)
                  </label>
                  <select
                    value={formData.sopralluoghista_id}
                    onChange={(e) => setFormData(prev => ({...prev, sopralluoghista_id: e.target.value}))}
                    title="Seleziona sopralluoghista per il test"
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="0a534c3a-daf0-41a2-8821-9aa003c9e423">Monica Canavese</option>
                    <option value="e1017f5d-83e1-4da3-ac81-4924a0dfd010">Diego Marruchi</option>
                    <option value={crypto.randomUUID()}>UUID Casuale (per test)</option>
                  </select>
                  <div className="mt-1 text-xs text-gray-500">
                    ID selezionato: {formData.sopralluoghista_id}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrizione
                  </label>
                  <input
                    type="text"
                    value={formData.descrizione}
                    onChange={(e) => setFormData(prev => ({...prev, descrizione: e.target.value}))}
                    placeholder="Descrizione della lavorazione"
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Scadenza
                  </label>
                  <input
                    type="date"
                    value={formData.data_scadenza}
                    onChange={(e) => setFormData(prev => ({...prev, data_scadenza: e.target.value}))}
                    title="Data di scadenza della lavorazione"
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>

                <button
                  onClick={generateNewIds}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded text-sm"
                >
                  🎲 Genera Nuovi ID
                </button>
              </div>
            </div>

            {/* Pulsanti di test */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">🚀 Test Operazioni</h2>
              
              <button
                onClick={testCreateLavorazione}
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded font-medium disabled:opacity-50"
              >
                📝 Test Lavorazione (API semplificata)
              </button>
              
              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    const response = await fetch('/api/lavorazioni', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(formData)
                    });
                    const result = await response.json();
                    setResults(prev => [{
                      success: response.ok,
                      message: response.ok ? '✅ Lavorazione API normale creata!' : `❌ Errore API normale: ${result.error}`,
                      data: result,
                      timestamp: new Date().toISOString()
                    }, ...prev]);
                  } catch (error) {
                    setResults(prev => [{
                      success: false,
                      message: `❌ Errore API normale: ${error instanceof Error ? error.message : 'Sconosciuto'}`,
                      timestamp: new Date().toISOString()
                    }, ...prev]);
                  }
                  setLoading(false);
                }}
                disabled={loading}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded font-medium disabled:opacity-50"
              >
                📋 Test API Lavorazioni Normale
              </button>
              
              <button
                onClick={testNotificationApi}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded font-medium disabled:opacity-50"
              >
                🔔 Test API Notifiche Diretto
              </button>

              <button
                onClick={() => setResults([])}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded disabled:opacity-50"
              >
                🗑️ Pulisci Risultati
              </button>

              {loading && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4">
                  <p className="text-yellow-700">⏳ Test in corso...</p>
                </div>
              )}
            </div>
          </div>

          {/* Risultati */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">📊 Risultati Test</h3>
            
            {results.length === 0 && (
              <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
                Nessun test eseguito ancora. Clicca sui pulsanti sopra per iniziare.
              </div>
            )}

            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`border-l-4 p-4 rounded ${
                    result.success 
                      ? 'bg-green-100 border-green-500' 
                      : 'bg-red-100 border-red-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className={`font-medium ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                      {result.message}
                    </p>
                    <span className="text-xs text-gray-500">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {result.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                        📋 Mostra dettagli risposta
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}