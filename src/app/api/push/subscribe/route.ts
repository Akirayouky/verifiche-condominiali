/**
 * API per gestione Push Subscriptions
 * 
 * POST /api/push/subscribe - Salva nuova subscription
 * DELETE /api/push/subscribe - Rimuove subscription
 * GET /api/push/subscribe - Ottieni subscriptions utente
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { subscription, utenteId } = body

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { success: false, error: 'Subscription mancante o non valida' },
        { status: 400 }
      )
    }

    if (!utenteId) {
      return NextResponse.json(
        { success: false, error: 'utenteId mancante' },
        { status: 400 }
      )
    }

    // Estrai keys dalla subscription
    const keys = subscription.keys || {}
    
    // User agent per tracking
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    // Controlla se subscription già esistente
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('endpoint', subscription.endpoint)
      .single()

    if (existing) {
      // Aggiorna last_used_at
      const { error: updateError } = await supabase
        .from('push_subscriptions')
        .update({ 
          last_used_at: new Date().toISOString(),
          user_agent: userAgent 
        })
        .eq('endpoint', subscription.endpoint)

      if (updateError) {
        console.error('❌ Errore aggiornamento subscription:', updateError)
        return NextResponse.json(
          { success: false, error: 'Errore aggiornamento subscription' },
          { status: 500 }
        )
      }

      console.log('✅ Subscription aggiornata:', subscription.endpoint.substring(0, 50))
      return NextResponse.json({ success: true, updated: true })
    }

    // Crea nuova subscription
    const { data, error } = await supabase
      .from('push_subscriptions')
      .insert({
        utente_id: utenteId,
        endpoint: subscription.endpoint,
        keys: keys,
        user_agent: userAgent
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Errore creazione subscription:', error)
      return NextResponse.json(
        { success: false, error: 'Errore salvataggio subscription' },
        { status: 500 }
      )
    }

    console.log('✅ Subscription salvata:', data.id)
    return NextResponse.json({ 
      success: true, 
      subscriptionId: data.id 
    })

  } catch (error) {
    console.error('❌ Errore POST /api/push/subscribe:', error)
    return NextResponse.json(
      { success: false, error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: 'endpoint mancante' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)

    if (error) {
      console.error('❌ Errore rimozione subscription:', error)
      return NextResponse.json(
        { success: false, error: 'Errore rimozione subscription' },
        { status: 500 }
      )
    }

    console.log('🗑️ Subscription rimossa:', endpoint.substring(0, 50))
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ Errore DELETE /api/push/subscribe:', error)
    return NextResponse.json(
      { success: false, error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const utenteId = request.nextUrl.searchParams.get('utenteId')

    if (!utenteId) {
      return NextResponse.json(
        { success: false, error: 'utenteId mancante' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('utente_id', utenteId)

    if (error) {
      console.error('❌ Errore query subscriptions:', error)
      return NextResponse.json(
        { success: false, error: 'Errore recupero subscriptions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      subscriptions: data 
    })

  } catch (error) {
    console.error('❌ Errore GET /api/push/subscribe:', error)
    return NextResponse.json(
      { success: false, error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
