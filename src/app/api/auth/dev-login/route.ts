import { NextRequest, NextResponse } from 'next/server'

// Credenziali hardcoded per Dev
const HARDCODED_DEV = {
  username: 'Akirayouky',
  password: 'Criogenia2025!'
}

// POST - Login sviluppatore
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username e password sono obbligatori' },
        { status: 400 }
      )
    }

    // Verifica credenziali hardcoded
    if (username === HARDCODED_DEV.username && password === HARDCODED_DEV.password) {
      return NextResponse.json({
        success: true,
        message: 'Accesso sviluppatore autorizzato',
        user: {
          username: HARDCODED_DEV.username,
          role: 'developer'
        }
      })
    }

    // Credenziali non valide
    return NextResponse.json(
      { success: false, message: 'Credenziali non valide' },
      { status: 401 }
    )

  } catch (error) {
    console.error('Errore dev login:', error)
    return NextResponse.json(
      { success: false, message: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
