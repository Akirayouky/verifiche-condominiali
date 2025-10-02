import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { dbQuery } from '@/lib/supabase'
import { CreateUserRequest } from '@/lib/types'

// POST - Registrazione nuovo sopralluoghista
export async function POST(request: NextRequest) {
  try {
    const body: CreateUserRequest = await request.json()
    const { username, email, password, nome, cognome, telefono } = body

    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Username, email e password sono obbligatori' },
        { status: 400 }
      )
    }

    // Validazione password (minimo 6 caratteri)
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'La password deve essere di almeno 6 caratteri' },
        { status: 400 }
      )
    }

    // Controlla se username esiste già
    const { data: existingUsername } = await dbQuery.users.getByUsername(username)
    if (existingUsername) {
      return NextResponse.json(
        { success: false, message: 'Username già esistente' },
        { status: 409 }
      )
    }

    // Controlla se email esiste già
    const { data: existingEmail } = await dbQuery.users.getByEmail(email)
    if (existingEmail) {
      return NextResponse.json(
        { success: false, message: 'Email già registrata' },
        { status: 409 }
      )
    }

    // Hash della password
    const password_hash = await bcrypt.hash(password, 12)

    // Crea il nuovo utente
    const userData = {
      username,
      email,
      password_hash,
      role: 'sopralluoghista',
      nome: nome || null,
      cognome: cognome || null,
      telefono: telefono || null,
      attivo: true
      // approved_at sarà null fino all'approvazione dell'admin
    }

    const { data: newUser, error } = await dbQuery.users.create(userData)

    if (error) {
      console.error('Errore creazione utente:', error)
      return NextResponse.json(
        { success: false, message: 'Errore nella registrazione' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Registrazione completata. Il tuo account è in attesa di approvazione da parte dell\'amministratore.',
      user: newUser
    }, { status: 201 })

  } catch (error) {
    console.error('Errore registrazione:', error)
    return NextResponse.json(
      { success: false, message: 'Errore interno del server' },
      { status: 500 }
    )
  }
}