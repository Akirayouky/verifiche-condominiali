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
        // Reset completo - elimina tutto tranne admin
        const { error: errorNotifiche } = await supabase
          .from('notifiche')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')

        const { error: errorLavorazioni } = await supabase
          .from('lavorazioni')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')

        const { data: deletedUsers, error: errorUsers } = await supabase
          .from('users')
          .delete()
          .neq('email', 'admin@condomini.it')
          .select()

        const { error: errorCondomini } = await supabase
          .from('condomini')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')

        const { error: errorTipologie } = await supabase
          .from('tipologie')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000')

        if (errorNotifiche || errorLavorazioni || errorUsers || errorCondomini || errorTipologie) {
          throw new Error('Errore durante il reset completo')
        }

        message = '✅ Database completamente resettato! Tutti i dati eliminati.'
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
          .neq('email', 'admin@condomini.it')
          .select()

        if (errUsers) throw errUsers
        deletedCount = deletedUsersOnly?.length || 0
        message = `✅ ${deletedCount} utenti eliminati (admin preservato)`
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
