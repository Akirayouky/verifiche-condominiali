import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

// POST - Cambia password utente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, vecchiaPassword, nuovaPassword } = body

    console.log('🔐 POST /api/auth/change-password - Cambio password per utente:', userId)

    if (!userId || !vecchiaPassword || !nuovaPassword) {
      return NextResponse.json({
        success: false,
        error: 'Tutti i campi sono richiesti'
      }, { status: 400 })
    }

    // Validazione password
    if (nuovaPassword.length < 8) {
      return NextResponse.json({
        success: false,
        error: 'La nuova password deve essere di almeno 8 caratteri'
      }, { status: 400 })
    }

    // Recupera utente corrente
    const { data: user, error: userError } = await dbQuery.users.getByIdFull(userId)
    
    if (userError || !user) {
      console.error('Errore recupero utente:', userError)
      return NextResponse.json({
        success: false,
        error: 'Utente non trovato'
      }, { status: 404 })
    }

    // Verifica password attuale
    const passwordValida = await bcrypt.compare(vecchiaPassword, user.password_hash)
    
    if (!passwordValida) {
      return NextResponse.json({
        success: false,
        error: 'Password attuale non corretta'
      }, { status: 401 })
    }

    // Hash nuova password
    const saltRounds = 12
    const nuovoHash = await bcrypt.hash(nuovaPassword, saltRounds)

    // Aggiorna password nel database
    const { error: updateError } = await dbQuery.users.update(userId, {
      password_hash: nuovoHash,
      password_changed_at: new Date().toISOString()
    })

    if (updateError) {
      console.error('Errore aggiornamento password:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Errore nell\'aggiornamento della password'
      }, { status: 500 })
    }

    console.log('✅ Password aggiornata per utente:', userId)

    return NextResponse.json({
      success: true,
      message: 'Password aggiornata con successo'
    })
  } catch (error) {
    console.error('❌ Errore cambio password:', error)
    return NextResponse.json({
      success: false,
      error: 'Errore interno del server'
    }, { status: 500 })
  }
}