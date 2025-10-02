import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    // 1. Aggiungi campo attivo se non esiste
    console.log('Adding attivo field...')
    
    // 2. Attiva l'admin
    const { data, error } = await supabase
      .from('users')
      .update({ 
        attivo: true,
        approved: true 
      })
      .eq('username', 'admin')
      .select()
    
    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Errore attivazione admin',
        error
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Admin attivato con successo!',
      data
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Errore',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}