'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, AuthState } from '@/lib/types'

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  loginAsAdmin: (password: string) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

// Password hardcoded per admin
const ADMIN_PASSWORD = 'admin123verifiche'

// Database utenti simulato (in produzione andrebbe su DB)
const USERS_DB: User[] = [
  {
    id: 'admin-001',
    username: 'admin',
    role: 'admin',
    nome: 'Amministratore',
    cognome: 'Sistema',
    email: 'admin@verifiche.com',
    attivo: true,
    data_creazione: new Date().toISOString()
  },
  {
    id: 'user-001', 
    username: 'marco.rossi',
    role: 'user',
    nome: 'Marco',
    cognome: 'Rossi',
    email: 'marco.rossi@verifiche.com',
    attivo: true,
    data_creazione: new Date().toISOString()
  },
  {
    id: 'user-002',
    username: 'luca.bianchi', 
    role: 'user',
    nome: 'Luca',
    cognome: 'Bianchi',
    email: 'luca.bianchi@verifiche.com',
    attivo: true,
    data_creazione: new Date().toISOString()
  }
]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    role: null
  })

  // Carica stato auth dal localStorage al mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('verifiche_auth')
    if (savedAuth) {
      try {
        const parsed = JSON.parse(savedAuth)
        setAuthState(parsed)
      } catch (err) {
        console.error('Errore nel parsing auth:', err)
        localStorage.removeItem('verifiche_auth')
      }
    }
  }, [])

  // Salva stato auth nel localStorage quando cambia
  useEffect(() => {
    if (authState.isAuthenticated) {
      localStorage.setItem('verifiche_auth', JSON.stringify(authState))
    } else {
      localStorage.removeItem('verifiche_auth')
    }
  }, [authState])

  const login = async (username: string, password: string): Promise<boolean> => {
    // Cerca utente nel database
    const user = USERS_DB.find(u => u.username === username && u.attivo)
    
    if (!user) {
      return false
    }

    // Per gli utenti normali, password = username (semplificato)
    // In produzione useresti hash/salt
    if (user.role === 'user' && password === username) {
      setAuthState({
        isAuthenticated: true,
        user,
        role: user.role
      })
      return true
    }

    // Per admin, controlla password hardcoded
    if (user.role === 'admin' && password === ADMIN_PASSWORD) {
      setAuthState({
        isAuthenticated: true,
        user,
        role: user.role
      })
      return true
    }

    return false
  }

  const loginAsAdmin = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      const adminUser = USERS_DB.find(u => u.role === 'admin')
      if (adminUser) {
        setAuthState({
          isAuthenticated: true,
          user: adminUser,
          role: 'admin'
        })
        return true
      }
    }
    return false
  }

  const logout = () => {
    setAuthState({
      isAuthenticated: false,
      user: null,
      role: null
    })
  }

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    loginAsAdmin
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

// Hook per ottenere lista utenti (solo per admin)
export function useUsers() {
  const { role } = useAuth()
  
  const getUsers = () => {
    if (role !== 'admin') return []
    return USERS_DB.filter(u => u.attivo)
  }

  const getUserById = (id: string) => {
    if (role !== 'admin') return null
    return USERS_DB.find(u => u.id === id && u.attivo) || null
  }

  return {
    users: getUsers(),
    getUserById
  }
}