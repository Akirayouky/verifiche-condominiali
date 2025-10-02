import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/supabase'

// GET - Ottieni tutti gli utenti (solo admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const attivo = searchParams.get('attivo')
    const pending = searchParams.get('pending') // utenti in attesa di approvazione

    let query = dbQuery.users.getAll()

    const { data, error } = await query

    if (error) {
      console.error('Errore Supabase GET users:', error)
      return NextResponse.json(
        { success: false, error: 'Errore nel recupero degli utenti' },
        { status: 500 }
      )
    }

    let filteredUsers = data || []

    // Applica filtri
    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role)
    }

    if (attivo !== null) {
      const isActive = attivo === 'true'
      filteredUsers = filteredUsers.filter(user => user.attivo === isActive)
    }

    if (pending === 'true') {
      filteredUsers = filteredUsers.filter(user => 
        user.role === 'sopralluoghista' && !user.approved_at
      )
    }

    return NextResponse.json({
      success: true,
      data: filteredUsers,
      total: filteredUsers.length
    })

  } catch (error) {
    console.error('Errore GET users:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nel recupero degli utenti' },
      { status: 500 }
    )
  }
}

// POST - Crea nuovo utente (solo admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, password, role, nome, cognome, telefono } = body

    if (!username || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'Username, email, password e ruolo sono obbligatori' },
        { status: 400 }
      )
    }

    // Controlla se username esiste già
    const { data: existingUsername } = await dbQuery.users.getByUsername(username)
    if (existingUsername) {
      return NextResponse.json(
        { success: false, error: 'Username già esistente' },
        { status: 409 }
      )
    }

    // Hash della password
    const bcrypt = require('bcryptjs')
    const password_hash = await bcrypt.hash(password, 12)

    const userData = {
      username,
      email,
      password_hash,
      role,
      nome,
      cognome,
      telefono,
      attivo: true,
      approved_at: new Date().toISOString() // Gli utenti creati dall'admin sono già approvati
    }

    const { data, error } = await dbQuery.users.create(userData)

    if (error) {
      console.error('Errore Supabase CREATE user:', error)
      return NextResponse.json(
        { success: false, error: 'Errore nella creazione dell\'utente' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Utente creato con successo'
    }, { status: 201 })

  } catch (error) {
    console.error('Errore POST user:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nella creazione dell\'utente' },
      { status: 500 }
    )
  }
}