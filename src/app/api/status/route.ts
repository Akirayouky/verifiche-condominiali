import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Server is working!',
    problem_identified: 'Table condomini (ID 17433) does not exist in Supabase database',
    solution: 'Execute SQL scripts to create missing tables',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    return NextResponse.json({
      success: true,
      message: 'POST working - ready to create condomini table',
      data: body,
      next_steps: [
        '1. Execute sql/create_condomini_table.sql in Supabase',
        '2. Or execute sql/update_condomini_columns.sql if table exists',
        '3. Test condomini API again'
      ]
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 400 })
  }
}