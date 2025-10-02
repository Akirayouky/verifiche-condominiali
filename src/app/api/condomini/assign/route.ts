import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/supabase'
import { AssignCondominioRequest } from '@/lib/types'

// PUT - Assegna/riassegna condominio a sopralluoghista
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { condominio_id, sopralluoghista_id }: AssignCondominioRequest = body

    if (!condominio_id) {
      return NextResponse.json(
        { success: false, error: 'ID condominio è obbligatorio' },
        { status: 400 }
      )
    }

    // Verifica che il condominio esista
    const { data: condominio, error: condominioError } = await dbQuery.condomini.getById(condominio_id)
    
    if (condominioError || !condominio) {
      return NextResponse.json(
        { success: false, error: 'Condominio non trovato' },
        { status: 404 }
      )
    }

    // Se sopralluoghista_id è fornito, verifica che esista e sia un sopralluoghista
    if (sopralluoghista_id) {
      const { data: sopralluoghista, error: userError } = await dbQuery.users.getById(sopralluoghista_id)
      
      if (userError || !sopralluoghista) {
        return NextResponse.json(
          { success: false, error: 'Sopralluoghista non trovato' },
          { status: 404 }
        )
      }

      if (sopralluoghista.role !== 'sopralluoghista') {
        return NextResponse.json(
          { success: false, error: 'L\'utente deve essere un sopralluoghista' },
          { status: 400 }
        )
      }
    }

    // Aggiorna l'assegnazione
    const { data, error } = await dbQuery.condomini.update(condominio_id, {
      assigned_to: sopralluoghista_id
    })

    if (error) {
      console.error('Errore Supabase UPDATE assignment:', error)
      return NextResponse.json(
        { success: false, error: 'Errore nell\'assegnazione del condominio' },
        { status: 500 }
      )
    }

    const message = sopralluoghista_id 
      ? `Condominio "${condominio.nome}" assegnato con successo`
      : `Assegnazione rimossa dal condominio "${condominio.nome}"`

    return NextResponse.json({
      success: true,
      data: data,
      message: message
    })

  } catch (error) {
    console.error('Errore PUT assignment:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nell\'assegnazione del condominio' },
      { status: 500 }
    )
  }
}

// POST - Assegnazione batch (multipli condomini a un sopralluoghista)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { condomini_ids, sopralluoghista_id } = body

    if (!Array.isArray(condomini_ids) || condomini_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lista di condomini è obbligatoria' },
        { status: 400 }
      )
    }

    // Verifica sopralluoghista se fornito
    if (sopralluoghista_id) {
      const { data: sopralluoghista, error: userError } = await dbQuery.users.getById(sopralluoghista_id)
      
      if (userError || !sopralluoghista || sopralluoghista.role !== 'sopralluoghista') {
        return NextResponse.json(
          { success: false, error: 'Sopralluoghista non valido' },
          { status: 400 }
        )
      }
    }

    // Assegnazione batch
    const results = []
    let successCount = 0
    let errorCount = 0

    for (const condominioId of condomini_ids) {
      try {
        const { data, error } = await dbQuery.condomini.update(condominioId, {
          assigned_to: sopralluoghista_id || null
        })

        if (error) {
          results.push({ id: condominioId, success: false, error: error.message })
          errorCount++
        } else {
          results.push({ id: condominioId, success: true, data })
          successCount++
        }
      } catch (err) {
        results.push({ id: condominioId, success: false, error: String(err) })
        errorCount++
      }
    }

    const message = sopralluoghista_id 
      ? `${successCount} condomini assegnati con successo${errorCount > 0 ? `, ${errorCount} errori` : ''}`
      : `${successCount} assegnazioni rimosse con successo${errorCount > 0 ? `, ${errorCount} errori` : ''}`

    return NextResponse.json({
      success: errorCount === 0,
      message: message,
      results: results,
      summary: {
        total: condomini_ids.length,
        success: successCount,
        errors: errorCount
      }
    })

  } catch (error) {
    console.error('Errore POST batch assignment:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nell\'assegnazione batch' },
      { status: 500 }
    )
  }
}