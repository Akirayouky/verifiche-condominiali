import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Basic API test - no database calls...')
    
    return NextResponse.json({
      success: true,
      message: 'Basic API is working!',
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
      }
    })

  } catch (error) {
    console.error('💥 Fatal error in basic API:', error)
    return NextResponse.json({
      success: false,
      error: 'Fatal error occurred',
      details: String(error)
    }, { status: 500 })
  }
}