import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { withTimeout } from '@/lib/with-timeout';

const API_QUERY_MS = 12_000;

// Handle CORS for the embed widget API
export async function OPTIONS() {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return new NextResponse(null, { status: 204, headers });
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cache-Control', 'no-store');
    return NextResponse.json([], { headers });
  }

  const supabase = await createClient();
  let data: { slug: string; name: string; website: string }[] | null = null;
  let error: { message: string } | null = null;
  try {
    const result = await withTimeout(
      supabase
        .from('members')
        .select('slug, name, website')
        .eq('is_approved', true)
        .order('created_at', { ascending: true }),
      API_QUERY_MS,
      () => {}
    );
    data = result.data;
    error = result.error;
  } catch {
    return NextResponse.json(
      { error: 'Request to database timed out' },
      { status: 503, statusText: 'Service Unavailable' }
    );
  }

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }

  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  return NextResponse.json(data, { headers });
}
