import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ygvlcikgzkoaxlrmwsnv.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlndmxjaWtnemtvYXhscm13c252Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzOTgzMzgsImV4cCI6MjA3NDk3NDMzOH0.Zc6eihyJiTZy6WicV6MyIgZ1Oq7GwzRYR01zovQHFPs'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Funzioni helper per il database
export const dbQuery = {
  // Condomini
  condomini: {
    getAll: () => supabase.from('condomini').select('*').order('data_inserimento', { ascending: false }),
    create: (data: any) => supabase.from('condomini').insert([data]).select().single(),
    getById: (id: string) => supabase.from('condomini').select('*').eq('id', id).single(),
    update: (id: string, data: any) => supabase.from('condomini').update(data).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('condomini').delete().eq('id', id)
  },

  // Tipologie
  tipologie: {
    getAll: () => supabase.from('tipologie_verifiche').select('*').order('data_creazione', { ascending: false }),
    create: (data: any) => supabase.from('tipologie_verifiche').insert([data]).select().single(),
    getById: (id: string) => supabase.from('tipologie_verifiche').select('*').eq('id', id).single(),
    update: (id: string, data: any) => supabase.from('tipologie_verifiche').update(data).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('tipologie_verifiche').delete().eq('id', id)
  },

  // Verifiche
  verifiche: {
    getAll: () => supabase.from('verifiche').select('*').order('data_creazione', { ascending: false }),
    create: (data: any) => supabase.from('verifiche').insert([data]).select().single(),
    getById: (id: string) => supabase.from('verifiche').select('*').eq('id', id).single(),
    update: (id: string, data: any) => supabase.from('verifiche').update(data).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('verifiche').delete().eq('id', id)
  },

  // Lavorazioni
  lavorazioni: {
    getAll: () => supabase.from('lavorazioni').select('*').order('data_creazione', { ascending: false }),
    create: (data: any) => supabase.from('lavorazioni').insert([data]).select().single(),
    getById: (id: string) => supabase.from('lavorazioni').select('*').eq('id', id).single(),
    update: (id: string, data: any) => supabase.from('lavorazioni').update(data).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('lavorazioni').delete().eq('id', id)
  }
}