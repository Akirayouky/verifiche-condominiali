import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/supabase'

// Utility per generare token unici
async function generateUniqueToken(): Promise<string> {
  let token: string
  let exists: boolean
  
  do {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    token = 'cond_'
    for (let i = 0; i < 16; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    // Verifica se il token esiste già nel database Supabase
    const { data: existing } = await dbQuery.condomini.getAll()
    exists = existing?.some(c => c.token === token) || false
  } while (exists)
  
  return token
}

// GET - Ottieni tutti i condomini (con filtri opzionali)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const assignedTo = searchParams.get('assigned_to') // Filtra per sopralluoghista
    const unassignedOnly = searchParams.get('unassigned') === 'true' // Solo non assegnati
    
    let { data, error } = await dbQuery.condomini.getAll()
    
    if (error) {
      console.error('Errore Supabase GET:', error)
      return NextResponse.json(
        { success: false, error: 'Errore nel recupero dei condomini' },
        { status: 500 }
      )
    }

    // Applica filtri se richiesti
    if (data && (assignedTo || unassignedOnly)) {
      data = data.filter(condominio => {
        if (unassignedOnly) {
          return !condominio.assigned_to // Solo condomini non assegnati
        }
        if (assignedTo) {
          return condominio.assigned_to === assignedTo // Solo del sopralluoghista specificato
        }
        return true
      })
    }
    
    return NextResponse.json({
      success: true,
      data: data || [],
      total: data?.length || 0
    })
  } catch (error) {
    console.error('Errore GET condomini:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Errore nel recupero dei condomini' 
      },
      { status: 500 }
    )
  }
}

// POST - Crea nuovo condominio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, assigned_to } = body

    if (!nome || nome.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Il nome del condominio è obbligatorio' },
        { status: 400 }
      )
    }

    // Genera token unico per il condominio
    const token = await generateUniqueToken()

    const condominioData = {
      nome: nome.trim(),
      token,
      assigned_to: assigned_to || null // Assegnazione opzionale durante creazione
    }

    const { data, error } = await dbQuery.condomini.create(condominioData)
    
    if (error) {
      console.error('Errore Supabase create:', error)
      return NextResponse.json(
        { success: false, error: 'Errore nella creazione del condominio' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: assigned_to 
        ? 'Condominio creato e assegnato con successo' 
        : 'Condominio creato con successo'
    }, { status: 201 })

  } catch (error) {
    console.error('Errore POST condominio:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nella creazione del condominio' },
      { status: 500 }
    )
  }
}