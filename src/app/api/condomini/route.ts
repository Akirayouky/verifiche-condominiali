import { NextRequest, NextResponse } from 'next/server'
import { Condominio } from '@/lib/types'
import { executeQuery, executeQuerySingle, generateUUID, toCamelCase, currentMySQLTimestamp } from '@/lib/mysql'

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
    
    // Verifica se il token esiste già nel database
    const existing = await executeQuerySingle(
      'SELECT id FROM condomini WHERE token = ?',
      [token]
    )
    exists = !!existing
  } while (exists)
  
  return token
}

// GET - Ottieni tutti i condomini
export async function GET() {
  try {
    const rows = await executeQuery(
      'SELECT id, nome, token, data_inserimento, data_ultima_modifica FROM condomini ORDER BY data_inserimento DESC'
    )
    
    const condomini = toCamelCase(rows) as Condominio[]
    
    return NextResponse.json({
      success: true,
      data: condomini,
      total: condomini.length
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

    // Genera token e ID unici per il condominio
    const token = await generateUniqueToken()
    const id = generateUUID()
    const now = currentMySQLTimestamp()

    // Inserisci nel database MySQL
    await executeQuery(
      'INSERT INTO condomini (id, nome, token, data_inserimento, data_ultima_modifica) VALUES (?, ?, ?, ?, ?)',
      [id, nome.trim(), token, now, now]
    )

    const nuovoCondominio: Condominio = {
      id,
      nome: nome.trim(),
      token,
      dataInserimento: now,
      dataUltimaModifica: now
    }

    return NextResponse.json({
      success: true,
      data: nuovoCondominio,
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