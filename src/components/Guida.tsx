'use client'

export default function Guida() {
  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📖 Guida Utente</h1>
        <p className="text-gray-600">Guida completa per utilizzare il sistema di Verifiche Condominiali</p>
      </div>

      <div className="space-y-8">
        {/* Sezione 1: Introduzione */}
        <section className="border-l-4 border-blue-500 pl-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">👋 Benvenuto</h2>
          <p className="text-gray-700 mb-4">
            Questo sistema ti permette di gestire le verifiche tecniche condominiali in modo semplice ed efficace.
            Come <strong>Amministratore</strong>, puoi creare lavorazioni, assegnarle ai sopralluoghisti e monitorare lo stato di avanzamento.
          </p>
        </section>

        {/* Sezione 2: Dashboard */}
        <section className="border-l-4 border-green-500 pl-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">🏠 Dashboard</h2>
          <p className="text-gray-700 mb-3">La Dashboard ti mostra una panoramica completa:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li><strong>Statistiche lavorazioni:</strong> Numero totale, da eseguire, in corso e completate</li>
            <li><strong>Attività recenti:</strong> Ultime 5 lavorazioni modificate</li>
            <li><strong>Accessi rapidi:</strong> Pulsanti per le azioni più comuni</li>
          </ul>
        </section>

        {/* Sezione 3: Gestione Condomini */}
        <section className="border-l-4 border-purple-500 pl-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">🏢 Gestione Condomini</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Creare un nuovo condominio:</h3>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>Clicca su <strong>&quot;Condomini&quot;</strong> nel menu laterale</li>
                <li>Clicca sul pulsante <strong>&quot;+ Nuovo Condominio&quot;</strong></li>
                <li>Compila i campi: Nome, Indirizzo, Città, CAP, etc.</li>
                <li>Clicca <strong>&quot;Salva&quot;</strong></li>
              </ol>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Suggerimento:</strong> Inserisci tutte le informazioni disponibili per avere dati completi nei report PDF
              </p>
            </div>
          </div>
        </section>

        {/* Sezione 4: Tipologie di Verifica */}
        <section className="border-l-4 border-yellow-500 pl-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">📋 Tipologie di Verifica</h2>
          <div className="space-y-4">
            <p className="text-gray-700">
              Le tipologie definiscono il tipo di verifica da eseguire (es: Verifica Impianto Elettrico, Verifica Ascensore, etc.)
            </p>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Creare una nuova tipologia:</h3>
              <ol className="list-decimal pl-6 space-y-2 text-gray-700">
                <li>Vai su <strong>&quot;Tipologie&quot;</strong></li>
                <li>Clicca <strong>&quot;+ Nuova Tipologia&quot;</strong></li>
                <li>Inserisci nome, descrizione e campi personalizzati</li>
                <li>Salva la tipologia</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Sezione 5: Creare una Verifica */}
        <section className="border-l-4 border-red-500 pl-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">✅ Creare una Nuova Verifica</h2>
          <div className="space-y-4">
            <p className="text-gray-700">Il modo più veloce per creare una lavorazione:</p>
            <ol className="list-decimal pl-6 space-y-3 text-gray-700">
              <li><strong>Seleziona Condominio:</strong> Scegli il condominio dall&apos;elenco</li>
              <li><strong>Scegli Tipologia:</strong> Seleziona il tipo di verifica (es: Verifica Elettrica)</li>
              <li><strong>Assegna Sopralluoghista:</strong> Scegli chi dovrà eseguire la verifica</li>
              <li><strong>Imposta Priorità:</strong> Bassa, Media, Alta o Urgente</li>
              <li><strong>Aggiungi Descrizione:</strong> (Opzionale) Note aggiuntive</li>
              <li><strong>Crea Lavorazione:</strong> Clicca sul pulsante per finalizzare</li>
            </ol>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-800">
                ✓ Il sopralluoghista riceverà automaticamente una notifica della nuova assegnazione
              </p>
            </div>
          </div>
        </section>

        {/* Sezione 6: Gestione Lavorazioni */}
        <section className="border-l-4 border-indigo-500 pl-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">⚙️ Gestione Lavorazioni</h2>
          <div className="space-y-4">
            <p className="text-gray-700">Il pannello completo per monitorare tutte le lavorazioni:</p>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Funzionalità disponibili:</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Filtrare per stato:</strong> Visualizza solo lavorazioni specifiche (tutte, da eseguire, in corso, completate, riaperte)</li>
                <li><strong>Statistiche in tempo reale:</strong> Contatori aggiornati automaticamente</li>
                <li><strong>Visualizzare dettagli:</strong> Clicca sull&apos;icona 👁️ per vedere tutti i dettagli</li>
                <li><strong>Scaricare PDF:</strong> Per lavorazioni completate, scarica il report con foto e firma</li>
                <li><strong>Riaprire lavorazioni:</strong> Clicca su 🔄 per riaprire una lavorazione completata</li>
                <li><strong>Eliminare:</strong> Rimuovi lavorazioni non più necessarie</li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Attenzione:</strong> L&apos;eliminazione di una lavorazione è permanente
              </p>
            </div>
          </div>
        </section>

        {/* Sezione 7: Report PDF */}
        <section className="border-l-4 border-pink-500 pl-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">📄 Report PDF</h2>
          <div className="space-y-4">
            <p className="text-gray-700">
              Per ogni lavorazione completata, il sistema genera automaticamente un report PDF professionale che include:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Dati del condominio e sopralluoghista</li>
              <li>Dettagli della verifica eseguita</li>
              <li><strong>Foto</strong> scattate durante il sopralluogo</li>
              <li><strong>Coordinate GPS</strong> di ogni foto</li>
              <li><strong>Firma digitale</strong> del sopralluoghista</li>
              <li>Note e osservazioni</li>
            </ul>
            <div className="bg-indigo-50 p-4 rounded-lg mt-4">
              <h4 className="font-semibold text-indigo-900 mb-2">Come scaricare il PDF:</h4>
              <ol className="list-decimal pl-6 space-y-1 text-sm text-indigo-800">
                <li>Vai in &quot;Gestione Lavorazioni&quot;</li>
                <li>Clicca su 👁️ per vedere i dettagli di una lavorazione completata</li>
                <li>Scorri fino alla sezione &quot;Report&quot;</li>
                <li>Clicca su <strong>&quot;📥 Scarica Report PDF&quot;</strong></li>
              </ol>
            </div>
          </div>
        </section>

        {/* Sezione 8: Utenti e Permessi */}
        <section className="border-l-4 border-teal-500 pl-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">👥 Gestione Utenti</h2>
          <div className="space-y-4">
            <p className="text-gray-700">Sistema di ruoli:</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">👨‍💼 Amministratore</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Gestione completa del sistema</li>
                  <li>• Crea lavorazioni e assegna verifiche</li>
                  <li>• Visualizza statistiche e report</li>
                  <li>• Gestisce utenti e condomini</li>
                </ul>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">👷 Sopralluoghista</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Visualizza lavorazioni assegnate</li>
                  <li>• Esegue verifiche con wizard guidato</li>
                  <li>• Acquisisce foto e firma digitale</li>
                  <li>• Completa lavorazioni</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Sezione 9: Notifiche */}
        <section className="border-l-4 border-orange-500 pl-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">🔔 Sistema Notifiche</h2>
          <div className="space-y-4">
            <p className="text-gray-700">
              Il sistema invia notifiche automatiche in tempo reale per:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Nuova assegnazione:</strong> Quando un sopralluoghista riceve una nuova lavorazione</li>
              <li><strong>Lavorazione completata:</strong> Quando un sopralluoghista completa una verifica</li>
              <li><strong>Scadenze imminenti:</strong> Promemoria automatici</li>
            </ul>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-800">
                💡 Le notifiche appaiono nell&apos;icona 🔔 nell&apos;header. Clicca per visualizzarle tutte.
              </p>
            </div>
          </div>
        </section>

        {/* Sezione 10: Suggerimenti */}
        <section className="border-l-4 border-gray-500 pl-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">💡 Suggerimenti Utili</h2>
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-gray-700"><strong>✓ Usa priorità:</strong> Imposta correttamente la priorità per gestire meglio il carico di lavoro</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-gray-700"><strong>✓ Descrizioni chiare:</strong> Aggiungi note dettagliate per facilitare il lavoro del sopralluoghista</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-gray-700"><strong>✓ Controlla regolarmente:</strong> Monitora la Dashboard per avere sempre sotto controllo lo stato delle verifiche</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-gray-700"><strong>✓ PDF sempre disponibili:</strong> I report PDF rimangono accessibili anche dopo mesi</p>
            </div>
          </div>
        </section>

        {/* Sezione 11: Supporto */}
        <section className="border-l-4 border-blue-500 pl-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">🆘 Bisogno di Aiuto?</h2>
          <div className="bg-blue-50 p-6 rounded-lg">
            <p className="text-gray-700 mb-4">
              Se hai domande o riscontri problemi, contatta il supporto tecnico:
            </p>
            <div className="space-y-2 text-gray-700">
              <p>📧 <strong>Email:</strong> supporto@verifiche-condominiali.it</p>
              <p>📞 <strong>Telefono:</strong> +39 XXX XXX XXXX</p>
              <p>⏰ <strong>Orari:</strong> Lun-Ven 9:00-18:00</p>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-500">
          📖 Guida Utente - Verifiche Condominiali v1.0
        </p>
      </div>
    </div>
  )
}
