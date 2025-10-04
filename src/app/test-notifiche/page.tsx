'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
}

export default function TestNotifichePage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (result: TestResult) => {
    setResults(prev => [result, ...prev]);
  };

  const testDatabaseConnection = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifiche')
        .select('count')
        .limit(1);

      if (error) {
        addResult({
          success: false,
          message: `❌ Errore connessione DB: ${error.message}`
        });
      } else {
        addResult({
          success: true,
          message: '✅ Connessione database OK'
        });
      }
    } catch (err) {
      addResult({
        success: false,
        message: `❌ Errore: ${err instanceof Error ? err.message : 'Sconosciuto'}`
      });
    }
    setLoading(false);
  };

  const testCreateNotification = async () => {
    setLoading(true);
    try {
      const testNotifica = {
        tipo: 'nuova_assegnazione',
        titolo: 'Test Notifica da UI',
        messaggio: 'Test creazione notifica dall\'interfaccia',
        utente_id: crypto.randomUUID(),
        priorita: 'media',
        letta: false
      };

      const { data, error } = await supabase
        .from('notifiche')
        .insert(testNotifica)
        .select()
        .single();

      if (error) {
        addResult({
          success: false,
          message: `❌ Errore creazione notifica: ${error.message}`
        });
      } else {
        addResult({
          success: true,
          message: '✅ Notifica creata con successo',
          data: { id: data.id, tipo: data.tipo, titolo: data.titolo }
        });
      }
    } catch (err) {
      addResult({
        success: false,
        message: `❌ Errore: ${err instanceof Error ? err.message : 'Sconosciuto'}`
      });
    }
    setLoading(false);
  };

  const testReadNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifiche')
        .select('id, tipo, titolo, priorita, letta, data_creazione')
        .order('data_creazione', { ascending: false })
        .limit(5);

      if (error) {
        addResult({
          success: false,
          message: `❌ Errore lettura notifiche: ${error.message}`
        });
      } else {
        addResult({
          success: true,
          message: `✅ Lette ${data.length} notifiche`,
          data: data
        });
      }
    } catch (err) {
      addResult({
        success: false,
        message: `❌ Errore: ${err instanceof Error ? err.message : 'Sconosciuto'}`
      });
    }
    setLoading(false);
  };

  const testUpdateNotification = async () => {
    setLoading(true);
    try {
      // Prima trova una notifica non letta
      const { data: notifiche, error: findError } = await supabase
        .from('notifiche')
        .select('id')
        .eq('letta', false)
        .limit(1);

      if (findError || !notifiche || notifiche.length === 0) {
        addResult({
          success: false,
          message: '❌ Nessuna notifica non letta trovata per il test update'
        });
        setLoading(false);
        return;
      }

      // Poi aggiorna
      const { data, error } = await supabase
        .from('notifiche')
        .update({ letta: true })
        .eq('id', notifiche[0].id)
        .select()
        .single();

      if (error) {
        addResult({
          success: false,
          message: `❌ Errore update notifica: ${error.message}`
        });
      } else {
        addResult({
          success: true,
          message: '✅ Notifica marcata come letta',
          data: { id: data.id, letta: data.letta }
        });
      }
    } catch (err) {
      addResult({
        success: false,
        message: `❌ Errore: ${err instanceof Error ? err.message : 'Sconosciuto'}`
      });
    }
    setLoading(false);
  };

  const testAllOperations = async () => {
    setResults([]);
    await testDatabaseConnection();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testCreateNotification();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testReadNotifications();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testUpdateNotification();
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            🧪 Test Sistema Notifiche
          </h1>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <button
              onClick={testDatabaseConnection}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              🔌 Test DB
            </button>
            
            <button
              onClick={testCreateNotification}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              ➕ Crea Notifica
            </button>
            
            <button
              onClick={testReadNotifications}
              disabled={loading}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              📖 Leggi Notifiche
            </button>
            
            <button
              onClick={testUpdateNotification}
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              ✏️ Update Notifica
            </button>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={testAllOperations}
              disabled={loading}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded font-medium disabled:opacity-50"
            >
              🚀 Test Completo
            </button>
            
            <button
              onClick={clearResults}
              disabled={loading}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded disabled:opacity-50"
            >
              🗑️ Pulisci Risultati
            </button>
          </div>

          {loading && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
              <p className="text-yellow-700">⏳ Test in corso...</p>
            </div>
          )}

          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className={`border-l-4 p-4 ${
                  result.success 
                    ? 'bg-green-100 border-green-500' 
                    : 'bg-red-100 border-red-500'
                }`}
              >
                <p className={result.success ? 'text-green-700' : 'text-red-700'}>
                  {result.message}
                </p>
                {result.data && (
                  <pre className="mt-2 text-sm bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>

          {results.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              Clicca sui pulsanti per testare il sistema notifiche
            </div>
          )}
        </div>
      </div>
    </div>
  );
}