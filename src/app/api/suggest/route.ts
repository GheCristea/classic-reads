import { NextRequest } from 'next/server'

type GutendexBook = {
  id: number
  title: string
  authors?: Array<{ name: string }>
}

type GutendexResponse = {
  results?: GutendexBook[]
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim().slice(0, 100)
  const type = (searchParams.get('type') || 'books').toLowerCase()
  const limit = Math.min(12, Math.max(1, Number(searchParams.get('limit') || 8)))

  if (!q || q.length < 3) {
    return Response.json([], { status: 200, headers: { 'Cache-Control': 'public, max-age=60' } })
  }

  const url = `https://gutendex.com/books?search=${encodeURIComponent(q)}&page=1`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(url, { next: { revalidate: 60 }, signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) {
      return Response.json([], { status: 200, headers: { 'Cache-Control': 'public, max-age=30' } })
    }
    const data = (await res.json()) as GutendexResponse
    const results = Array.isArray(data.results) ? data.results : []
    let items = [] as Array<{ id: string; title: string; subtitle?: string }>
    if (type === 'authors') {
      const seen = new Set<string>()
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
    } else {
      items = results.slice(0, limit).map((b) => ({
        id: String(b.id),
        title: b.title,
        subtitle: (b.authors && b.authors.length > 0) ? b.authors.map(a => a.name).join(', ') : undefined,
      }))
    }

    return Response.json(items, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch {
    return Response.json([], { status: 200, headers: { 'Cache-Control': 'public, max-age=15' } })
  }
}


