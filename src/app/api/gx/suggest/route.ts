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

  const cacheKey = buildStableKey({ scope: 'gutendex:suggest', q, type, limit })

  if (!supabaseAdmin) {
    const items = await fetchSuggest(q, type, limit)
    return Response.json(items, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', 'x-cache': 'passthrough' } })
  }

  const now = new Date()
  const { data: rows, error } = await supabaseAdmin
    .from('suggest_cache')
    .select('value, expires_at')
    .eq('cache_key', cacheKey)
    .order('expires_at', { ascending: false })
    .limit(1)

  const hit = Array.isArray(rows) && rows.length > 0 ? rows[0] as { value: Item[]; expires_at: string } : null
  if (!error && hit) {
    const isFresh = new Date(hit.expires_at) > now
    if (isFresh) {
      return Response.json(hit.value as Item[], { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', 'x-cache': 'hit' } })
    }
    void refreshInBackground(cacheKey, q, type, limit)
    return Response.json(hit.value as Item[], { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', 'x-cache': 'stale' } })
  }

  const items = await fetchSuggest(q, type, limit).catch(() => [] as Item[])
  if (items.length > 0) {
    const { error: upsertError } = await supabaseAdmin
      .from('suggest_cache')
      .upsert({ cache_key: cacheKey, value: items, expires_at: getExpiryIso(ONE_MONTH_SECONDS) }, { onConflict: 'cache_key' })
    if (upsertError) {
      console.error('suggest_cache upsert error:', upsertError.message)
    }
  }
  return Response.json(items, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', 'x-cache': 'miss' } })
}

async function fetchSuggest(q: string, type: string, limit: number): Promise<Item[]> {
  const url = `https://gutendex.com/books?search=${encodeURIComponent(q)}&page=1`
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

async function refreshInBackground(cacheKey: string, q: string, type: string, limit: number) {
  try {
    const items = await fetchSuggest(q, type, limit)
    if (items.length === 0) return
    await supabaseAdmin!
      .from('suggest_cache')
      .upsert({ cache_key: cacheKey, value: items, expires_at: getExpiryIso(ONE_MONTH_SECONDS) })
  } catch {}
}


