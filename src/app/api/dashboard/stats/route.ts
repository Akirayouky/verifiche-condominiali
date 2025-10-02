import { NextRequest, NextResponse } from 'next/server'
import { dbQuery } from '@/lib/supabase'

// GET - Ottieni statistiche dashboard
export async function GET(request: NextRequest) {
  try {
    // Query parallele per ottimizzare performance
    const [
      lavorazioniResult,
      condominienResult,
      tipologieResult,
      verificheResult
    ] = await Promise.allSettled([
      dbQuery.lavorazioni.getAll(),
      dbQuery.condomini.getAll(),
      dbQuery.tipologie.getAll(),
      dbQuery.verifiche.getAll()
    ])

    // Estrai dati dalle promise
    const lavorazioni = lavorazioniResult.status === 'fulfilled' ? lavorazioniResult.value.data || [] : []
    const condomini = condominienResult.status === 'fulfilled' ? condominienResult.value.data || [] : []
    const tipologie = tipologieResult.status === 'fulfilled' ? tipologieResult.value.data || [] : []
    const verifiche = verificheResult.status === 'fulfilled' ? verificheResult.value.data || [] : []

    // Calcola statistiche lavorazioni
    const lavorazioniStats = {
      totali: lavorazioni.length,
      da_eseguire: lavorazioni.filter(l => l.stato === 'da_eseguire').length,
      in_corso: lavorazioni.filter(l => l.stato === 'in_corso').length,
      completate: lavorazioni.filter(l => l.stato === 'completata').length,
      riaperte: lavorazioni.filter(l => l.stato === 'riaperta').length
    }

    // Calcola statistiche verifiche
    const verificheStats = {
      totali: verifiche.length,
      bozze: verifiche.filter(v => v.stato === 'bozza').length,
      in_corso: verifiche.filter(v => v.stato === 'in_corso').length,
      completate: verifiche.filter(v => v.stato === 'completata').length,
      archiviate: verifiche.filter(v => v.stato === 'archiviata').length
    }

    // Lavorazioni per condominio (top 5)
    const lavorazioniPerCondominio = condomini.map(cond => {
      const lavorazioniCond = lavorazioni.filter(l => {
        // Trova verifica associata
        const verifica = verifiche.find(v => v.id === l.verifica_id)
        return verifica?.condominio_id === cond.id
      })

      return {
        condominio: cond.nome,
        totali: lavorazioniCond.length,
        completate: lavorazioniCond.filter(l => l.stato === 'completata').length,
        da_completare: lavorazioniCond.filter(l => l.stato !== 'completata').length
      }
    }).sort((a, b) => b.totali - a.totali).slice(0, 5)

    // Lavorazioni per tipologia
    const lavorazioniPerTipologia = tipologie.map(tip => {
      const lavorazioniTip = lavorazioni.filter(l => {
        const verifica = verifiche.find(v => v.id === l.verifica_id)
        return verifica?.tipologia_id === tip.id
      })

      return {
        tipologia: tip.nome,
        totali: lavorazioniTip.length,
        completate: lavorazioniTip.filter(l => l.stato === 'completata').length
      }
    }).filter(item => item.totali > 0).sort((a, b) => b.totali - a.totali)

    // Lavorazioni recenti (ultime 10)
    const lavorazioniRecenti = lavorazioni
      .sort((a, b) => new Date(b.data_apertura).getTime() - new Date(a.data_apertura).getTime())
      .slice(0, 10)
      .map(l => {
        const verifica = verifiche.find(v => v.id === l.verifica_id)
        const condominio = condomini.find(c => c.id === verifica?.condominio_id)
        
        return {
          id: l.id,
          descrizione: l.descrizione,
          stato: l.stato,
          condominio: condominio?.nome || 'N/D',
          data_apertura: l.data_apertura,
          utente_assegnato: l.utente_assegnato
        }
      })

    // Statistiche temporali (ultimo mese)
    const ora = new Date()
    const ultimoMese = new Date(ora.getFullYear(), ora.getMonth() - 1, ora.getDate())
    
    const lavorazioniUltimoMese = lavorazioni.filter(l => 
      new Date(l.data_apertura) >= ultimoMese
    )

    const lavorazioniCompletateUltimoMese = lavorazioni.filter(l => 
      l.data_chiusura && new Date(l.data_chiusura) >= ultimoMese
    )

    const statistiche = {
      // Contatori principali
      totali: {
        condomini: condomini.length,
        tipologie: tipologie.filter(t => t.attiva).length,
        verifiche: verifiche.length,
        lavorazioni: lavorazioni.length
      },

      // Statistiche lavorazioni
      lavorazioni: lavorazioniStats,

      // Statistiche verifiche
      verifiche: verificheStats,

      // Distribuzione per condominio
      condomini: lavorazioniPerCondominio,

      // Distribuzione per tipologia
      tipologie: lavorazioniPerTipologia,

      // Attività recenti
      recenti: lavorazioniRecenti,

      // Trend ultimo mese
      trend: {
        nuove_lavorazioni: lavorazioniUltimoMese.length,
        lavorazioni_completate: lavorazioniCompletateUltimoMese.length,
        percentuale_completamento: lavorazioni.length > 0 
          ? Math.round((lavorazioniStats.completate / lavorazioni.length) * 100) 
          : 0
      }
    }

    return NextResponse.json({
      success: true,
      data: statistiche
    })

  } catch (error) {
    console.error('Errore nel calcolo delle statistiche:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nel calcolo delle statistiche' },
      { status: 500 }
    )
  }
}