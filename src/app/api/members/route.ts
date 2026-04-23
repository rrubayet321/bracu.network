import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Handle CORS for the embed widget API
export async function OPTIONS() {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return new NextResponse(null, { status: 204, headers });
}

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('members')
    .select('slug, name, website')
    .eq('is_approved', true)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }

  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  return NextResponse.json(data, { headers });
}
