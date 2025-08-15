import { buildStableKey, getExpiryIso, supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest } from 'next/server';

const ONE_MONTH_SECONDS = 30 * 24 * 60 * 60 // ~30 days

type Item = { id: string; title: string; subtitle?: string }

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim().slice(0, 100)
  const type = (searchParams.get('type') || 'books').toLowerCase()
  const limit = Math.min(12, Math.max(1, Number(searchParams.get('limit') || 8)))

  if (!q || q.length < 3) {
    return Response.json([], { status: 200, headers: { 'Cache-Control': 'public, max-age=60' } })
  }

  // Use the same underlying cache as the search endpoint: books_cache keyed by Gutendex params
  // Normalize search query to lowercase for case-insensitive caching
  const normalizedQ = q.toLowerCase().trim()
  const booksCacheKey = buildStableKey({ scope: 'gutendx:books', search: normalizedQ, page: '1' })

  if (!supabaseAdmin) {
    const items = await fetchSuggest(q, type, limit)
    return Response.json(items, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', 'x-cache': 'passthrough' } })
  }

  const now = new Date()
  const { data: rows, error } = await supabaseAdmin
    .from('books_cache')
    .select('value, expires_at')
    .eq('cache_key', booksCacheKey)
    .order('expires_at', { ascending: false })
    .limit(1)

  const hit = Array.isArray(rows) && rows.length > 0 ? rows[0] as { value: unknown; expires_at: string } : null
  if (!error && hit) {
    const isFresh = new Date(hit.expires_at) > now
    if (isFresh) {
      const items = toItemsFromBooksValue(hit.value, type, limit)
      return Response.json(items, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', 'x-cache': 'hit' } })
    }
    void refreshInBackground(booksCacheKey, normalizedQ)
    const items = toItemsFromBooksValue(hit.value, type, limit)
    return Response.json(items, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', 'x-cache': 'stale' } })
  }

  // Cache miss: fetch Gutendex, store raw response in books_cache, then derive items
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(`https://gutendex.com/books?search=${encodeURIComponent(q.toLowerCase().trim())}&page=1`, { signal: controller.signal, next: { revalidate: 60 } })
    clearTimeout(timeout)
    if (!res.ok) {
      return Response.json([], { headers: { 'Cache-Control': 'public, max-age=30', 'x-cache': 'miss-error' } })
    }
    const value = await res.json()
    const { error: upsertError } = await supabaseAdmin
      .from('books_cache')
      .upsert({ cache_key: booksCacheKey, value, expires_at: getExpiryIso(ONE_MONTH_SECONDS) }, { onConflict: 'cache_key' })
    if (upsertError) {
      console.error('books_cache upsert error (suggest):', upsertError.message)
    }
    const items = toItemsFromBooksValue(value, type, limit)
    return Response.json(items, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', 'x-cache': 'miss' } })
  } catch {
    return Response.json([], { headers: { 'Cache-Control': 'public, max-age=30', 'x-cache': 'timeout' } })
  }
}

async function fetchSuggest(q: string, type: string, limit: number): Promise<Item[]> {
  const url = `https://gutendex.com/books?search=${encodeURIComponent(q.toLowerCase().trim())}&page=1`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)
  try {
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 60 } })
    clearTimeout(timeout)
    if (!res.ok) return []
    const data = (await res.json()) as { results?: Array<{ id: number; title: string; authors?: Array<{ name: string }> }> }
    const results = Array.isArray(data.results) ? data.results : []
    if (type === 'authors') {
      const seen = new Set<string>()
      const items: Item[] = []
      for (const b of results) {
        for (const a of b.authors || []) {
          const name = (a.name || '').trim()
          if (name && !seen.has(name)) {
            seen.add(name)
            items.push({ id: name, title: name })
            if (items.length >= limit) break
          }
        }
        if (items.length >= limit) break
      }
      return items
    }
    return results.slice(0, limit).map((b) => ({ id: String(b.id), title: b.title, subtitle: (b.authors && b.authors.length > 0) ? b.authors.map(a => a.name).join(', ') : undefined }))
  } catch {
    clearTimeout(timeout)
    return []
  }
}

function toItemsFromBooksValue(value: unknown, type: string, limit: number): Item[] {
  const data = value as { results?: Array<{ id: number; title: string; authors?: Array<{ name: string }> }> }
  const results = Array.isArray(data?.results) ? data.results : []
  if (type === 'authors') {
    const seen = new Set<string>()
    const items: Item[] = []
    for (const b of results) {
      for (const a of b.authors || []) {
        const name = (a.name || '').trim()
        if (name && !seen.has(name)) {
          seen.add(name)
          items.push({ id: name, title: name })
          if (items.length >= limit) break
        }
      }
      if (items.length >= limit) break
    }
    return items
  }
  return results.slice(0, limit).map((b) => ({ id: String(b.id), title: b.title, subtitle: (b.authors && b.authors.length > 0) ? b.authors.map(a => a.name).join(', ') : undefined }))
}

async function refreshInBackground(cacheKey: string, q: string) {
  try {
    const res = await fetch(`https://gutendex.com/books?search=${encodeURIComponent(q.toLowerCase().trim())}&page=1`, { cache: 'no-store' })
    if (!res.ok) return
    const value = await res.json()
    await supabaseAdmin!
      .from('books_cache')
      .upsert({ cache_key: cacheKey, value, expires_at: getExpiryIso(ONE_MONTH_SECONDS) })
  } catch {}
}


