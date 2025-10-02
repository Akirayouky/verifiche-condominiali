import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/supabase'

// Funzione per generare password temporanea
function generateTempPassword(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  
  let password = ''
  
  // 3 lettere maiuscole
  for (let i = 0; i < 3; i++) {
    password += letters.charAt(Math.floor(Math.random() * letters.length))
  }
  
  // 3 numeri
  for (let i = 0; i < 3; i++) {
    password += numbers.charAt(Math.floor(Math.random() * numbers.length))
  }
  
  return password
}

// GET - Ottieni utente per ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data, error } = await dbQuery.users.getById(id)

    if (error) {
      console.error('Errore Supabase GET user:', error)
      return NextResponse.json(
        { success: false, error: 'Errore nel recupero dell\'utente' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Utente non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('Errore GET user:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nel recupero dell\'utente' },
      { status: 500 }
    )
  }
}

// PUT - Aggiorna utente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { azione, ...updateData } = body

    // Ottieni l'utente esistente
    const { data: existingUser, error: getError } = await dbQuery.users.getById(id)

    if (getError) {
      console.error('Errore Supabase GET user esistente:', getError)
      return NextResponse.json(
        { success: false, error: 'Errore nel recupero dell\'utente' },
        { status: 500 }
      )
    }

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Utente non trovato' },
        { status: 404 }
      )
    }

    const now = new Date().toISOString()
    let finalUpdateData: any = {}
    let tempPasswordGenerated: string | null = null

    switch (azione) {
      case 'approve':
        // Approva sopralluoghista
        if (existingUser.role !== 'sopralluoghista') {
          return NextResponse.json(
            { success: false, error: 'Solo i sopralluoghisti possono essere approvati' },
            { status: 400 }
          )
        }
        finalUpdateData = {
          approved_at: now,
          // approved_by dovrebbe essere l'ID dell'admin che fa l'approvazione
        }
        break

      case 'deactivate':
        finalUpdateData = { attivo: false }
        break

      case 'activate':
        finalUpdateData = { attivo: true }
        break

      case 'reject':
        // Rifiuta utente: lo disattiva e rimuove approved_at per nasconderlo dalla lista attesa
        finalUpdateData = { 
          attivo: false,
          approved_at: null,
          // rejected_at: now  // Campo da aggiungere al DB schema
        }
        break

      case 'reset_password':
        // Genera password temporanea (6 caratteri: 3 lettere + 3 numeri)
        const tempPassword = generateTempPassword()
        
        // Hash della password temporanea
        const bcrypt = require('bcryptjs')
        const hashedTempPassword = await bcrypt.hash(tempPassword, 10)
        
        finalUpdateData = { 
          password: hashedTempPassword,
          last_login: null, // Forza re-login
          // Impostiamo un flag per indicare che è una password temporanea
          // Useremo un campo esistente per ora
          created_at: existingUser.created_at, // Mantieni originale
        }
        
        // Aggiungiamo la password temporanea al risultato per mostrarla all'admin
        tempPasswordGenerated = tempPassword
        break

      case 'update':
        // Aggiorna dati generici
        finalUpdateData = updateData
        // Rimuovi azione dai dati da aggiornare
        delete finalUpdateData.azione
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Azione non valida' },
          { status: 400 }
        )
    }

    const { data: updatedData, error: updateError } = await dbQuery.users.update(id, finalUpdateData)

    if (updateError) {
      console.error('Errore Supabase UPDATE user:', updateError)
      return NextResponse.json(
        { success: false, error: 'Errore nell\'aggiornamento dell\'utente' },
        { status: 500 }
      )
    }

    const response: any = {
      success: true,
      data: updatedData,
      message: 'Utente aggiornato con successo'
    }

    // Aggiungi password temporanea e username se è stato fatto reset password
    if (tempPasswordGenerated && existingUser) {
      response.tempPassword = tempPasswordGenerated
      response.username = existingUser.username
      response.message = 'Password resettata con successo'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Errore PUT user:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nell\'aggiornamento dell\'utente' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina utente
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { error } = await dbQuery.users.delete(id)

    if (error) {
      console.error('Errore Supabase DELETE user:', error)
      return NextResponse.json(
        { success: false, error: 'Errore nell\'eliminazione dell\'utente' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Utente eliminato con successo'
    })

  } catch (error) {
    console.error('Errore DELETE user:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nell\'eliminazione dell\'utente' },
      { status: 500 }
    )
  }
}