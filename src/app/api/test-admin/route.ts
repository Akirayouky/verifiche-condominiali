import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    console.log('🔍 Testing Supabase connection...')
    
    // Test 1: Connessione base
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count', { count: 'exact' })
    
    if (testError) {
      return NextResponse.json({
        success: false,
        message: 'Errore connessione Supabase',
        error: testError
      })
    }
    
    // Test 2: Cerca admin senza RLS
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'admin')
      .single()
    
    if (adminError) {
      return NextResponse.json({
        success: false,
        message: 'Admin user not found',
        error: adminError,
        totalUsers: testData
      })
    }
    
    // Test 3: Verifica password
    const isPasswordCorrect = await bcrypt.compare('admin123', adminUser.password_hash)
    
    return NextResponse.json({
      success: true,
      message: 'Test completato',
      results: {
        totalUsers: testData,
        adminExists: !!adminUser,
        adminData: {
          id: adminUser.id,
          username: adminUser.username,
          email: adminUser.email,
          role: adminUser.role,
          approved: adminUser.approved
        },
        passwordCorrect: isPasswordCorrect
      }
    })
    
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Errore test',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}