/**
 * API Route per gestione notifiche
 * GET /api/notifications - Lista notifiche utente
 * POST /api/notifications - Crea nuova notifica  
 * PATCH /api/notifications/[id] - Marca come letta
 */

import { NextRequest, NextResponse } from 'next/server'
import { NotificationManager } from '@/lib/notifications'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const onlyUnread = searchParams.get('onlyUnread') === 'true'

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID richiesto' },
        { status: 400 }
      )
    }

    console.log(`📋 Recupero notifiche per utente ${userId} (solo non lette: ${onlyUnread})`)

    const notificationManager = NotificationManager.getInstance()

    if (onlyUnread) {
      const notifiche = await notificationManager.getNotificheNonLette(userId)
      
      return NextResponse.json({
        success: true,
        data: notifiche,
        count: notifiche.length
      })
    } else {
      // Recupera notifiche specifiche per l'utente + notifiche generali (utente_id vuoto)
      const { data: notifiche, error } = await supabase
        .from('notifiche')
        .select('*')
        .or(`utente_id.eq.${userId},utente_id.eq.`)
        .order('data_creazione', { ascending: false })
        .limit(100)

      if (error) {
        throw error
      }

      return NextResponse.json({
        success: true,
        data: notifiche || [],
        count: notifiche?.length || 0
      })
    }

  } catch (error) {
    console.error('❌ Errore recupero notifiche:', error)
    return NextResponse.json(
      { success: false, error: 'Errore recupero notifiche' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tipo, titolo, messaggio, utente_id, priorita = 'media', ...altriDati } = body

    if (!tipo || !titolo || !messaggio || !utente_id) {
      return NextResponse.json(
        { success: false, error: 'Campi obbligatori: tipo, titolo, messaggio, utente_id' },
        { status: 400 }
      )
    }

    console.log(`📤 Creazione notifica per utente ${utente_id}:`, titolo)

    const notificationManager = NotificationManager.getInstance()
    
    const notifica = await notificationManager.creaNotifica({
      tipo,
      titolo,
      messaggio,
      utente_id,
      priorita,
      ...altriDati
    })

    if (!notifica) {
      return NextResponse.json(
        { success: false, error: 'Errore creazione notifica' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: notifica,
      message: 'Notifica creata con successo'
    })

  } catch (error) {
    console.error('❌ Errore creazione notifica:', error)
    return NextResponse.json(
      { success: false, error: 'Errore interno server' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')
    
    const body = await request.json()
    
    const notificationManager = NotificationManager.getInstance()

    switch (action) {
      case 'mark-read':
        const { notificationId } = body
        if (!notificationId) {
          return NextResponse.json(
            { success: false, error: 'Notification ID richiesto' },
            { status: 400 }
          )
        }

        const success = await notificationManager.marcaComeLetta(notificationId)
        
        return NextResponse.json({
          success,
          message: success ? 'Notifica marcata come letta' : 'Errore aggiornamento notifica'
        })

      case 'mark-all-read':
        if (!userId) {
          return NextResponse.json(
            { success: false, error: 'User ID richiesto' },
            { status: 400 }
          )
        }

        const allSuccess = await notificationManager.marcaTutteComeLette(userId)
        
        return NextResponse.json({
          success: allSuccess,
          message: allSuccess ? 'Tutte le notifiche marcate come lette' : 'Errore aggiornamento notifiche'
        })

      default:
        return NextResponse.json(
          { success: false, error: 'Action non valida' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ Errore aggiornamento notifiche:', error)
    return NextResponse.json(
      { success: false, error: 'Errore interno server' },
      { status: 500 }
    )
  }
}