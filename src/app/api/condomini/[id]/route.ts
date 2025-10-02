import { NextRequest, NextResponse } from 'next/server'
import { Condominio } from '@/lib/types'
import { executeQuerySingle, executeQuery, toCamelCase, currentMySQLTimestamp } from '@/lib/mysql'

// GET - Ottieni condominio per ID o Token
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Cerca per ID o per Token nel database MySQL
    const row = await executeQuerySingle(
      'SELECT id, nome, token, data_inserimento, data_ultima_modifica FROM condomini WHERE id = ? OR token = ?',
      [id, id]
    )

    if (!row) {
      return NextResponse.json(
        { success: false, error: 'Condominio non trovato' },
        { status: 404 }
      )
    }

    const condominio = toCamelCase(row) as Condominio

    return NextResponse.json({
      success: true,
      data: condominio
    })

  } catch (error) {
    console.error('Errore GET condominio:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nel recupero del condominio' },
      { status: 500 }
    )
  }
}

// PUT - Aggiorna condominio
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { nome } = body

    if (!nome || nome.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Il nome del condominio è obbligatorio' },
        { status: 400 }
      )
    }

    const now = currentMySQLTimestamp()
    
    // Aggiorna nel database MySQL
    const result = await executeQuery(
      'UPDATE condomini SET nome = ?, data_ultima_modifica = ? WHERE id = ? OR token = ?',
      [nome.trim(), now, id, id]
    )

    // Verifica se la riga è stata aggiornata
    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Condominio non trovato' },
        { status: 404 }
      )
    }

    // Recupera il condominio aggiornato
    const updatedRow = await executeQuerySingle(
      'SELECT id, nome, token, data_inserimento, data_ultima_modifica FROM condomini WHERE id = ? OR token = ?',
      [id, id]
    )

    const condominioAggiornato = toCamelCase(updatedRow) as Condominio

    return NextResponse.json({
      success: true,
      data: condominioAggiornato,
      message: 'Condominio aggiornato con successo'
    })

  } catch (error) {
    console.error('Errore PUT condominio:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nell\'aggiornamento del condominio' },
      { status: 500 }
    )
  }
}

// DELETE - Elimina condominio
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Verifica che non ci siano verifiche associate prima di eliminare
    const verificheAssociate = await executeQuerySingle(
      'SELECT COUNT(*) as count FROM verifiche WHERE condominio_id = (SELECT id FROM condomini WHERE id = ? OR token = ?)',
      [id, id]
    )

    if (verificheAssociate && (verificheAssociate as any).count > 0) {
      return NextResponse.json(
        { success: false, error: 'Impossibile eliminare il condominio: sono presenti verifiche associate' },
        { status: 409 }
      )
    }
    
    // Elimina dal database MySQL
    const result = await executeQuery(
      'DELETE FROM condomini WHERE id = ? OR token = ?',
      [id, id]
    )

    // Verifica se la riga è stata eliminata
    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Condominio non trovato' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Condominio eliminato con successo'
    })

  } catch (error) {
    console.error('Errore DELETE condominio:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nell\'eliminazione del condominio' },
      { status: 500 }
    )
  }
}