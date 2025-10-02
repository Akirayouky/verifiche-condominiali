import { NextRequest, NextResponse } from 'next/server'
import { dbQuery, supabase } from '@/lib/supabase'

// Utility per generare token unici (versione semplificata)
function generateUniqueToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let token = 'cond_'
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  // Aggiungi timestamp per unicità
  token += Date.now().toString(36)
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

// POST - Crea nuovo condominio (versione semplificata)
export async function POST(request: NextRequest) {
  try {
    console.log('🏢 POST condomini - Start')
    
    const body = await request.json()
    console.log('📝 Request body:', body)
    
    const { nome } = body

    if (!nome || nome.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Il nome del condominio è obbligatorio' },
        { status: 400 }
      )
    }

    // Crea condominio con solo i campi base
    const condominioData = {
      nome: nome.trim()
    }

    console.log('💾 Creating condominio with data:', condominioData)

    // Usa la chiamata Supabase diretta per maggior controllo
    const { data, error } = await supabase
      .from('condomini')
      .insert([condominioData])
      .select()
      .single()
    
    if (error) {
      console.error('❌ Errore Supabase create:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Errore nella creazione del condominio',
          details: error.message 
        },
        { status: 500 }
      )
    }

    console.log('✅ Condominio creato:', data)

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Condominio creato con successo'
    }, { status: 201 })

  } catch (error) {
    console.error('💥 Errore POST condominio:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Errore nella creazione del condominio',
        details: String(error) 
      },
      { status: 500 }
    )
  }
}