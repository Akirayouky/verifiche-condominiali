import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🔍 Debug: Checking notifiche in database...');
    
    // 1. Conta tutte le notifiche
    const { data: countData, error: countError } = await supabase
      .from('notifiche')
      .select('*', { count: 'exact' });
    
    if (countError) {
      console.error('❌ Error counting notifiche:', countError);
      return NextResponse.json({ error: 'Error counting notifiche', details: countError }, { status: 500 });
    }

    // 2. Ultime 10 notifiche
    const { data: recentNotifiche, error: recentError } = await supabase
      .from('notifiche')
      .select(`
        id,
        tipo,
        titolo,
        messaggio,
        utente_id,
        letta,
        data_creazione,
        data_scadenza
      `)
      .order('data_creazione', { ascending: false })
      .limit(10);

    if (recentError) {
      console.error('❌ Error fetching recent notifiche:', recentError);
      return NextResponse.json({ error: 'Error fetching recent notifiche', details: recentError }, { status: 500 });
    }

    // 3. Notifiche per Diego Marruchi
    const { data: diegoNotifiche, error: diegoError } = await supabase
      .from('notifiche')
      .select(`
        id,
        tipo,
        titolo,
        messaggio,
        letta,
        data_creazione,
        utenti (
          nome,
          email
        )
      `)
      .eq('utente_id', 'e1017f5d-83e1-4da3-ac81-4924a0dfd010')
      .order('data_creazione', { ascending: false });

    if (diegoError) {
      console.error('❌ Error fetching Diego notifiche:', diegoError);
      return NextResponse.json({ error: 'Error fetching Diego notifiche', details: diegoError }, { status: 500 });
    }

    // 4. Test diretto lettura notifiche (senza RLS)
    const { data: directTest, error: directError } = await supabase
      .rpc('check_notifiche_count');

    console.log('📊 Database check results:', {
      totalCount: countData?.length || 0,
      recentCount: recentNotifiche?.length || 0,
      diegoCount: diegoNotifiche?.length || 0,
      directTest
    });

    return NextResponse.json({
      success: true,
      data: {
        totalNotifiche: countData?.length || 0,
        recentNotifiche: recentNotifiche || [],
        diegoNotifiche: diegoNotifiche || [],
        directTest: directTest || 'Function not available'
      },
      message: 'Database check completed'
    });

  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log('🧪 Creating test notification directly...');
    
    // Crea una notifica di test direttamente
    const testNotifica = {
      tipo: 'urgente',
      titolo: 'Test Notifica Diretta',
      messaggio: 'Questa è una notifica di test creata direttamente nell\'API debug',
      utente_id: 'e1017f5d-83e1-4da3-ac81-4924a0dfd010', // Diego Marruchi
      priorita: 'alta',
      letta: false,
      data_scadenza: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 giorni
    };

    const { data, error } = await supabase
      .from('notifiche')
      .insert([testNotifica])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating test notification:', error);
      return NextResponse.json({ error: 'Error creating test notification', details: error }, { status: 500 });
    }

    console.log('✅ Test notification created:', data);

    return NextResponse.json({
      success: true,
      data,
      message: 'Test notification created successfully'
    });

  } catch (error) {
    console.error('❌ Test notification creation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}