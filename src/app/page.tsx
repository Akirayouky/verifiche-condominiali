'use client'

import { useState } from 'react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import LoginPage from '@/components/auth/LoginPage'
import GestioneCondomini from '@/components/condomini/GestioneCondomini'
import GestioneTipologie from '@/components/tipologie/GestioneTipologie'
import WizardVerifiche from '@/components/verifiche/WizardVerifiche'
import PannelloAdmin from '@/components/admin/PannelloAdmin'
import PannelloUtente from '@/components/user/PannelloUtente'
import NotePersonali from '@/components/user/NotePersonali'
import ImpostazioniUtente from '@/components/user/ImpostazioniUtente'
import Dashboard from '@/components/Dashboard'
import NotificationCenter from '@/components/notifications/NotificationCenterSimple'
import Link from 'next/link'

function MainApp() {
  const { isAuthenticated, user, role, logout } = useAuth()
  const [activeSection, setActiveSection] = useState(role === 'admin' ? 'dashboard' : 'lavorazioni')

  // Sezioni diverse in base al ruolo
  const adminSections = [
    { id: 'dashboard', name: 'Dashboard', icon: '🏠' },
    { id: 'condomini', name: 'Condomini', icon: '🏢' },
    { id: 'tipologie', name: 'Tipologie', icon: '📋' },
    { id: 'verifiche', name: 'Nuova Verifica', icon: '✅' },
    { id: 'admin', name: 'Gestione Lavorazioni', icon: '⚙️' },
    { id: 'test-notifiche', name: 'Test Notifiche', icon: '🧪' },
    { id: 'test-lavorazioni', name: 'Test Integrazione', icon: '🔄' },
  ]

  const userSections = [
    { id: 'lavorazioni', name: 'Le Mie Lavorazioni', icon: '📋' },
    { id: 'note', name: 'Note Personali', icon: '📝' },
    { id: 'impostazioni', name: 'Impostazioni', icon: '⚙️' },
  ]

  const sections = role === 'admin' ? adminSections : userSections

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Navigation */}
      <nav className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Verifiche Condominiali
          </h1>
        </div>
        <ul className="mt-6">
          {sections.map((section) => (
            <li key={section.id}>
              <button
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center px-6 py-3 text-left hover:bg-blue-50 transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-100 border-r-4 border-blue-500 text-blue-700'
                    : 'text-gray-600'
                }`}
              >
                <span className="text-2xl mr-3">{section.icon}</span>
                {section.name}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header con info utente */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {sections.find(s => s.id === activeSection)?.name}
              </h2>
              <p className="text-sm text-gray-500">
                {role === 'admin' ? 'Pannello Amministratore' : 'Pannello Sopralluoghista'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-700">
                  {user?.nome} {user?.cognome}
                </div>
                <div className="text-xs text-gray-500">
                  {role === 'admin' ? '👑 Amministratore' : '👷 Sopralluoghista'}
                </div>
              </div>
              
              {/* Icona Notifiche */}
              <NotificationCenter userId={user?.id || ''} />

              <button
                onClick={logout}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-800 border border-red-300 rounded hover:bg-red-50 transition-colors"
                title="Disconnetti"
              >
                🚪 Esci
              </button>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Sezioni Admin */}
          {role === 'admin' && (
            <>
              {activeSection === 'dashboard' && <Dashboard onNavigate={setActiveSection} />}
              {activeSection === 'condomini' && <GestioneCondomini />}
              {activeSection === 'tipologie' && <GestioneTipologie />}
              {activeSection === 'verifiche' && <WizardVerifiche />}
              {activeSection === 'admin' && <PannelloAdmin />}
              {activeSection === 'test-notifiche' && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-bold mb-4">🧪 Test Sistema Notifiche</h3>
                  <p className="text-gray-600 mb-6">
                    Strumenti per testare il funzionamento del sistema di notifiche
                  </p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <Link 
                      href="/test-notifiche"
                      className="block bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg text-center transition-colors"
                    >
                      <div className="text-2xl mb-2">🔌</div>
                      <h4 className="font-semibold">Test Database</h4>
                      <p className="text-sm opacity-90">Test CRUD notifiche</p>
                    </Link>
                    <Link 
                      href="/test-lavorazioni-notifiche"
                      className="block bg-green-500 hover:bg-green-600 text-white p-4 rounded-lg text-center transition-colors"
                    >
                      <div className="text-2xl mb-2">🔄</div>
                      <h4 className="font-semibold">Test Integrazione</h4>
                      <p className="text-sm opacity-90">Lavorazioni → Notifiche</p>
                    </Link>
                  </div>
                </div>
              )}
              {activeSection === 'test-lavorazioni' && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-bold mb-4">🔄 Test Integrazione Completa</h3>
                  <p className="text-gray-600 mb-6">
                    Test del flusso completo: Lavorazioni → Notifiche → Sopralluoghisti
                  </p>
                  <Link 
                    href="/test-lavorazioni-notifiche"
                    className="inline-block bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    🚀 Avvia Test Completo
                  </Link>
                </div>
              )}
            </>
          )}

          {/* Sezioni Utente */}
          {role === 'sopralluoghista' && (
            <>
              {activeSection === 'lavorazioni' && <PannelloUtente />}
              {activeSection === 'note' && <NotePersonali />}
              {activeSection === 'impostazioni' && <ImpostazioniUtente />}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  )
}