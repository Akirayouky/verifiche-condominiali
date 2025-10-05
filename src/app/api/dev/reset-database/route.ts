import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Password hardcoded per reset database (stesso del login dev)
const DEV_PASSWORD = 'Criogenia2025!'

export async function POST(request: Request) {
  try {
    const { type, password } = await request.json()

    if (!type || !password) {
      return NextResponse.json(
        { success: false, error: 'Type e password richiesti' },
        { status: 400 }
      )
    }

    // Verifica password sviluppatore hardcoded
    if (password !== DEV_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'Password sviluppatore errata' },
        { status: 401 }
      )
    }

    let deletedCount = 0
    let message = ''

    switch (type) {
      case 'all':
        // Reset completo - elimina tutto in ordine corretto (prima dipendenze, poi tabelle principali)
        
        // 1. Elimina notifiche (dipendono da lavorazioni/users)
        const { data: delNotifiche } = await supabase
          .from('notifiche')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')
          .select()

        // 2. Elimina lavorazioni (dipendono da tipologie/condomini/users)
        const { data: delLavorazioni } = await supabase
          .from('lavorazioni')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')
          .select()

        // 3. Elimina users (indipendenti)
        const { data: delUsers } = await supabase
          .from('users')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')
          .select()

        // 4. Elimina condomini (indipendenti)
        const { data: delCondomini } = await supabase
          .from('condomini')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')
          .select()

        // 5. Elimina tipologie (ora che non ci sono più lavorazioni)
        const { data: delTipologie } = await supabase
          .from('tipologie')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')
          .select()

        const totalDeleted = 
          (delNotifiche?.length || 0) + 
          (delLavorazioni?.length || 0) + 
          (delUsers?.length || 0) + 
          (delCondomini?.length || 0) + 
          (delTipologie?.length || 0)

        message = `✅ Reset completo! ${totalDeleted} record eliminati (${delLavorazioni?.length || 0} lavorazioni, ${delUsers?.length || 0} utenti, ${delCondomini?.length || 0} condomini, ${delTipologie?.length || 0} tipologie, ${delNotifiche?.length || 0} notifiche)`
        deletedCount = totalDeleted
        break

      case 'lavorazioni':
        const { data: deletedLavorazioni, error: errLav } = await supabase
          .from('lavorazioni')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')
          .select()

        if (errLav) throw errLav
        deletedCount = deletedLavorazioni?.length || 0
        message = `✅ ${deletedCount} lavorazioni eliminate`
        break

      case 'users':
        const { data: deletedUsersOnly, error: errUsers } = await supabase
          .from('users')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')
          .select()

        if (errUsers) throw errUsers
        deletedCount = deletedUsersOnly?.length || 0
        message = `✅ ${deletedCount} utenti eliminati`
        break

      case 'condomini':
        const { data: deletedCondomini, error: errCond } = await supabase
          .from('condomini')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')
          .select()

        if (errCond) throw errCond
        deletedCount = deletedCondomini?.length || 0
        message = `✅ ${deletedCount} condomini eliminati`
        break

      case 'tipologie':
        const { data: deletedTipologie, error: errTip } = await supabase
          .from('tipologie')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')
          .select()

        if (errTip) throw errTip
        deletedCount = deletedTipologie?.length || 0
        message = `✅ ${deletedCount} tipologie eliminate`
        break

      case 'notifiche':
        const { data: deletedNotifiche, error: errNot } = await supabase
          .from('notifiche')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')
          .select()

        if (errNot) throw errNot
        deletedCount = deletedNotifiche?.length || 0
        message = `✅ ${deletedCount} notifiche eliminate`
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Tipo di reset non valido' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message,
      deletedCount,
      type
    })
  } catch (error) {
    console.error('❌ Errore reset database:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Errore durante il reset'
      },
      { status: 500 }
    )
  }
}
