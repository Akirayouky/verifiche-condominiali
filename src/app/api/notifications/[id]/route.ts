import { NextRequest, NextResponse } from 'next/server';
import { NotificationManager } from '@/lib/notifications';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    console.log(`📝 Aggiornamento notifica ${id}:`, body);

    const notificationManager = NotificationManager.getInstance();
    
    if (body.letta !== undefined) {
      const success = await notificationManager.marcaComeLetta(id);
      
      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Errore aggiornamento notifica' },
          { status: 500 }
        );
      }
      
      console.log(`✅ Notifica ${id} marcata come letta`);
      
      return NextResponse.json({
        success: true,
        message: 'Notifica aggiornata con successo'
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Campo letta richiesto' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Errore aggiornamento notifica:', error);
    return NextResponse.json(
      { success: false, error: 'Errore interno server' },
      { status: 500 }
    );
  }
}