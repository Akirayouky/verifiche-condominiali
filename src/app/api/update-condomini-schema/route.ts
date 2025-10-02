import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Aggiunta campo assigned_to alla tabella condomini...')
    
    // Prima controlliamo se la colonna esiste già facendo una query di test
    const { error: testError } = await supabase
      .from('condomini')
      .select('assigned_to')
      .limit(1)
    
    if (!testError) {
      return NextResponse.json({
        success: true,
        message: 'Campo assigned_to già esistente'
      })
    }

    // Se arriva qui, la colonna non esiste. Proviamo ad aggiungerla
    // In Supabase dovremmo fare questo tramite SQL Editor nel dashboard
    // Per ora restituiamo le istruzioni SQL
    
    const sqlInstructions = `
-- Esegui questo SQL nel dashboard Supabase:

ALTER TABLE condomini 
ADD COLUMN assigned_to uuid REFERENCES users(id) ON DELETE SET NULL;

COMMENT ON COLUMN condomini.assigned_to IS 'ID del sopralluoghista assegnato per questo condominio';

CREATE INDEX idx_condomini_assigned_to ON condomini(assigned_to);
    `

    console.log('📝 SQL da eseguire:', sqlInstructions)

    return NextResponse.json({
      success: false,
      message: 'Colonna non presente. Eseguire SQL manualmente nel dashboard Supabase.',
      sql: sqlInstructions,
      instructions: [
        '1. Vai al dashboard Supabase',
        '2. Apri SQL Editor', 
        '3. Esegui il comando SQL fornito',
        '4. Richiama questa API per verificare'
      ]
    })

  } catch (error) {
    console.error('Errore generale:', error)
    return NextResponse.json(
      { success: false, error: 'Errore del server: ' + String(error) },
      { status: 500 }
    )
  }
}