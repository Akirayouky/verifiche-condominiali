'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, AuthState } from '@/lib/types'

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

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
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()

      if (data.success && data.user) {
        setAuthState({
          isAuthenticated: true,
          user: data.user,
          role: data.user.role
        })
        return true
      }

      return false
    } catch (error) {
      console.error('Errore durante il login:', error)
      return false
    }
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
    logout
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