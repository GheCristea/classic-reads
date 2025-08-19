import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextRequest } from 'next/server';


export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type SupabaseSuggestion = {
  id: string
  title: string
  authors: string
  issued: string
  language: string
  updated_at: string
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim().slice(0, 100)
  const parsedLimit = parseInt(searchParams.get('limit') || '8')
  const queryLimit = !isNaN(parsedLimit) ? parsedLimit : 8
  const type = (searchParams.get('type') || '').toLowerCase()

  if (!q || q.length < 3) {
    return Response.json([], { status: 200, headers: { 'Cache-Control': 'public, max-age=60' } })
  }

  // Normalize search query to lowercase for case-insensitive matching
  const normalizedQ = q.toLowerCase().trim()

  if (!supabaseAdmin) {
    return Response.json([], { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', 'x-cache': 'passthrough' } })
  }

  // Escape % and _ for LIKE patterns
  const escaped = normalizedQ.replace(/[%_]/g, '\\$&')
  const likeAny = `%${escaped}%`

  // Fetch a bit more than we need so we can rank locally
  const fetchLimit = Math.max(queryLimit * 3, 24)

  const { data: rows, error } = await supabaseAdmin
    .from('pg_catalog')
    .select('id, title, authors')
    .or(`title.ilike.${likeAny},authors.ilike.${likeAny}`)
    .limit(fetchLimit)

  if (error) {
    console.error('error fetching suggestions', error)
    console.log('error TRACE', error.stack?.split('\n').slice(0, 3).join('\n') ?? 'no stack')
    return Response.json([], { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', 'x-cache': 'passthrough' } })
  }

  const list = Array.isArray(rows) ? (rows as SupabaseSuggestion[]) : []

  // Lightweight ranking: prefer startsWith on title, then includes; then authors
  function scoreRow(r: SupabaseSuggestion) {
    const t = (r.title || '').toLowerCase()
    const a = (r.authors || '').toLowerCase()
    const ti = t.indexOf(normalizedQ)
    const ai = a.indexOf(normalizedQ)

    let score = 0
    if (ti === 0) score += 300 // title starts with
    else if (ti > 0) score += 200 - Math.min(ti, 100)

    if (ai === 0) score += 120 // author starts with
    else if (ai > 0) score += 80 - Math.min(ai, 80)

    // Shorter titles get a small boost
    score += Math.max(0, 40 - Math.min(t.length, 40))

    return score
  }

  const ranked = list
    .map(r => ({ r, s: scoreRow(r) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map(x => x.r)

  // If author suggestions requested, bias ordering and shape accordingly
  if (type === 'authors') {
    ranked.sort((a, b) => {
      const ai = (a.authors || '').toLowerCase().indexOf(normalizedQ)
      const bi = (b.authors || '').toLowerCase().indexOf(normalizedQ)
      const aw = ai === 0 ? 1 : ai > 0 ? 2 : 3
      const bw = bi === 0 ? 1 : bi > 0 ? 2 : 3
      if (aw !== bw) return aw - bw
      return (a.authors || '').localeCompare(b.authors || '')
    })
  }

  const items = ranked.slice(0, queryLimit).map((row) => ({
    id: String(row.id),
    title: type === 'authors' ? (row.authors || row.title) : row.title,
    subtitle: type === 'authors' ? undefined : row.authors,
  }))

  return Response.json(items, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300', 'x-cache': 'stale' } })
}