import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { dbQuery } from '@/lib/supabase'
import { LoginRequest, User } from '@/lib/types'

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

    // Cerca l'utente nel database
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