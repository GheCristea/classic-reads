import { buildStableKey, getExpiryIso, supabaseAdmin } from '@/lib/supabaseAdmin'
import { NextRequest } from 'next/server'

const ONE_MONTH_SECONDS = 30 * 24 * 60 * 60 // ~30 days

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const params = Object.fromEntries(url.searchParams.entries())
  // Normalize search query to lowercase for case-insensitive caching
  if (params.search) {
    params.search = params.search.toLowerCase().trim()
  }
  
  const cacheKey = buildStableKey({ scope: 'gutendx:books', ...params })

  // If Supabase not configured, proxy directly
  if (!supabaseAdmin) {
    console.log('no supabase admin in books search')
    const res = await fetch(`https://gutendex.com/books?${new URLSearchParams(params).toString()}`, { next: { revalidate: 60 } })
    const value = await res.json()
    return Response.json(value, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', 'x-cache': 'passthrough' }
    })
  }

  const now = new Date()
  console.log('supabase admin in books search', cacheKey)
  const { data: rows, error } = await supabaseAdmin
    .from('books_cache')
    .select('value, expires_at')
    .eq('cache_key', cacheKey)
    .order('expires_at', { ascending: false })
    .limit(1)

  if (error) {
    console.error('books_cache select error:', error.message)
  }

  const hit = Array.isArray(rows) && rows.length > 0 ? rows[0] as { value: unknown; expires_at: string } : null
  if (!error && hit) {
    const isFresh = new Date(hit.expires_at) > now
    if (isFresh) {
      return Response.json(hit.value, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', 'x-cache': 'hit' }
      })
    }
    // stale -> serve and refresh in background
    void refreshInBackground(cacheKey, params)
    return Response.json(hit.value, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', 'x-cache': 'stale' }
    })
  }

  // miss -> fetch now
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(`https://gutendex.com/books?${new URLSearchParams(params).toString()}`, { signal: controller.signal, next: { revalidate: 60 } })
    clearTimeout(timeout)
    if (!res.ok) {
      return Response.json({ count: 0, next: null, previous: null, results: [] }, { status: 200, headers: { 'Cache-Control': 'public, max-age=30', 'x-cache': 'miss-error' } })
    }
    const value = await res.json()
    const { error: upsertError } = await supabaseAdmin
      .from('books_cache')
      .upsert({ cache_key: cacheKey, value, expires_at: getExpiryIso(ONE_MONTH_SECONDS) }, { onConflict: 'cache_key' })
    if (upsertError) {
      console.error('books_cache upsert error:', upsertError.message)
    }
    return Response.json(value, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', 'x-cache': 'miss' }
    })
  } catch (e) {
    console.warn('primary fetch aborted/failed, attempting fallback:', (e as Error)?.message)
    try {
      const res = await fetch(`https://gutendex.com/books?${new URLSearchParams(params).toString()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('fallback fetch failed')
      const value = await res.json()
      return Response.json(value, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', 'x-cache': 'timeout-fallback' }
      })
    } catch (ee) {
      console.error('fallback fetch error:', (ee as Error)?.message)
      return Response.json({ count: 0, next: null, previous: null, results: [] }, { status: 200, headers: { 'Cache-Control': 'public, max-age=30', 'x-cache': 'timeout' } })
    }
  }
}

async function refreshInBackground(cacheKey: string, params: Record<string, string>) {
  try {
    const res = await fetch(`https://gutendex.com/books?${new URLSearchParams(params).toString()}`, { cache: 'no-store' })
    if (!res.ok) return
    const value = await res.json()
    const { error: upsertError } = await supabaseAdmin!
      .from('books_cache')
      .upsert({ cache_key: cacheKey, value, expires_at: getExpiryIso(ONE_MONTH_SECONDS) }, { onConflict: 'cache_key' })
    if (upsertError) {
      console.error('books_cache upsert error (background):', upsertError.message)
    }
  } catch {}
}


