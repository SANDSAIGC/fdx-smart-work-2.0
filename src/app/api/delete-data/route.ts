import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({
        success: false,
        error: 'Environment variables not configured'
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID is required' 
      }, { status: 400 });
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/your_table?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return NextResponse.json({ 
        success: true, 
        message: 'Deleted successfully' 
      });
    } else {
      const errorText = await response.text();
      console.error('Supabase error:', errorText);
      return NextResponse.json({ 
        success: false, 
        error: 'Delete failed',
        details: errorText 
      }, { status: response.status });
    }
  } catch (error) {
    console.error('Delete data error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
