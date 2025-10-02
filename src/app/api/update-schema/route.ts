import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('🔧 Aggiornamento schema database...')
    
    // Aggiungi le colonne mancanti alla tabella users
    const alterQueries = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS nome VARCHAR(100)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS cognome VARCHAR(100)', 
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS telefono VARCHAR(20)',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS attivo BOOLEAN DEFAULT true',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ'
    ]

    // Esegui ogni query
    for (const query of alterQueries) {
      console.log(`Eseguendo: ${query}`)
      const { error } = await supabase.rpc('exec_sql', { sql_query: query })
      if (error) {
        console.error(`Errore query "${query}":`, error)
      } else {
        console.log(`✅ Query eseguita: ${query}`)
      }
    }

    // Aggiorna l'utente admin esistente
    const { data: adminUpdate, error: adminError } = await supabase
      .from('users')
      .update({
        nome: 'Admin',
        cognome: 'Sistema', 
        attivo: true,
        approved_at: new Date().toISOString()
      })
      .eq('username', 'admin')
      .eq('role', 'admin')
      .select()

    if (adminError) {
      console.error('Errore aggiornamento admin:', adminError)
    } else {
      console.log('✅ Admin aggiornato:', adminUpdate)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database schema aggiornato con successo',
      adminUpdate
    })

  } catch (error: any) {
    console.error('❌ Errore aggiornamento schema:', error)
    return NextResponse.json(
      { success: false, message: 'Errore interno del server', error: error.message },
      { status: 500 }
    )
  }
}