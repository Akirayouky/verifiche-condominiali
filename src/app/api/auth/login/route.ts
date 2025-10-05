import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { dbQuery } from '@/lib/supabase'
import { LoginRequest, User } from '@/lib/types'

// Credenziali hardcoded per Admin
const HARDCODED_ADMIN = {
  username: 'Kamia',
  password: 'Amministrazione2025!',
  user: {
    id: 'hardcoded-admin',
    username: 'Kamia',
    email: 'admin@sistema.local',
    nome: 'Amministratore',
    cognome: 'Sistema',
    role: 'admin' as const,
    attivo: true,
    approved_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString()
  }
}

// POST - Login utente
export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username e password sono obbligatori' },
        { status: 400 }
      )
    }

    // 🔐 CHECK 1: Verifica se è l'admin hardcoded
    if (username === HARDCODED_ADMIN.username && password === HARDCODED_ADMIN.password) {
      return NextResponse.json({
        success: true,
        user: HARDCODED_ADMIN.user,
        message: 'Login amministratore effettuato con successo'
      })
    }

    // 🔍 CHECK 2: Cerca l'utente nel database (sopralluoghisti)
    const { data: user, error } = await dbQuery.users.getByUsername(username)

    if (error || !user) {
      return NextResponse.json(
        { success: false, message: 'Credenziali non valide' },
        { status: 401 }
      )
    }

    // Verifica la password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Credenziali non valide' },
        { status: 401 }
      )
    }

    // Controlla se l'utente è attivo
    if (!user.attivo) {
      return NextResponse.json(
        { success: false, message: 'Account disabilitato. Contatta l\'amministratore.' },
        { status: 403 }
      )
    }

    // Se è un sopralluoghista, controlla se è approvato
    if (user.role === 'sopralluoghista' && !user.approved_at) {
      return NextResponse.json(
        { success: false, message: 'Account in attesa di approvazione dell\'amministratore' },
        { status: 403 }
      )
    }

    // Aggiorna last_login
    await dbQuery.users.updateLastLogin(user.id)

    // Rimuovi la password_hash dalla risposta
    const { password_hash, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      message: 'Login effettuato con successo'
    })

  } catch (error) {
    console.error('Errore login:', error)
    return NextResponse.json(
      { success: false, message: 'Errore interno del server' },
      { status: 500 }
    )
  }
}