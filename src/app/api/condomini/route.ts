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

// GET - Ottieni tutti i condomini
export async function GET() {
  try {
    const { data, error } = await dbQuery.condomini.getAll()
    
    if (error) {
      console.error('Errore Supabase GET:', error)
      return NextResponse.json(
        { success: false, error: 'Errore nel recupero dei condomini' },
        { status: 500 }
      )
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
    const { nome } = body

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
      token
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
      message: 'Condominio creato con successo'
    }, { status: 201 })

  } catch (error) {
    console.error('Errore POST condominio:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nella creazione del condominio' },
      { status: 500 }
    )
  }
}