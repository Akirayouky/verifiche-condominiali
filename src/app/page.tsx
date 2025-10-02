'use client'

import { useState } from 'react'
import GestioneCondomini from '@/components/condomini/GestioneCondomini'
import GestioneTipologie from '@/components/tipologie/GestioneTipologie'
import WizardVerifiche from '@/components/verifiche/WizardVerifiche'
import PannelloAdmin from '@/components/admin/PannelloAdmin'
import Dashboard from '@/components/Dashboard'

export default function Home() {
  const [activeSection, setActiveSection] = useState('dashboard')

  const sections = [
    { id: 'dashboard', name: 'Dashboard', icon: '🏠' },
    { id: 'condomini', name: 'Condomini', icon: '🏢' },
    { id: 'tipologie', name: 'Tipologie', icon: '📋' },
    { id: 'verifiche', name: 'Verifiche', icon: '✅' },
    { id: 'admin', name: 'Admin', icon: '⚙️' },
  ]

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
      <main className="flex-1 p-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {activeSection === 'dashboard' && <Dashboard onNavigate={setActiveSection} />}

          {activeSection === 'condomini' && <GestioneCondomini />}

          {activeSection === 'tipologie' && <GestioneTipologie />}

          {activeSection === 'verifiche' && <WizardVerifiche />}

          {activeSection === 'admin' && <PannelloAdmin />}
        </div>
      </main>
    </div>
  )
}