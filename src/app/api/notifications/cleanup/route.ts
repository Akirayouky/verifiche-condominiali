import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    console.log(`🧹 Pulizia notifiche per user: ${userId}`);

    // Elimina solo le notifiche lette per l'utente specifico
    const { data, error } = await supabase
      .from('notifiche')
      .delete()
      .eq('utente_id', userId)
      .eq('letta', true);

    if (error) {
      console.error('❌ Errore eliminazione notifiche:', error);
      return NextResponse.json({ 
        error: 'Errore durante l\'eliminazione delle notifiche', 
        details: error 
      }, { status: 500 });
    }

    console.log(`✅ Notifiche lette eliminate per user: ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Notifiche lette eliminate con successo'
    });

  } catch (error) {
    console.error('❌ Errore cleanup notifiche:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}