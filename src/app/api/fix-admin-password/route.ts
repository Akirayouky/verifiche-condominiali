import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    // Hash corretto per "admin123"
    const correctHash = '$2b$12$7vvupPHIDj.lfiQNbfT9U.mj.oMSThuF2T9Gs4JCAWuiH7cqRnTiu'
    
    const { data, error } = await supabase
      .from('users')
      .update({ password_hash: correctHash })
      .eq('username', 'admin')
      .select()
    
    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Errore aggiornamento password',
        error
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Password admin aggiornata con successo!',
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