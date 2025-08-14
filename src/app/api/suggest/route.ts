import { NextRequest } from 'next/server'

type GutendexBook = {
  id: number
  title: string
  authors?: Array<{ name: string }>
}

type GutendexResponse = {
  results?: GutendexBook[]
}

// Deprecated: retained temporarily to forward to new cached route
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim().slice(0, 100)
  const type = (searchParams.get('type') || 'books').toLowerCase()
  const limit = Math.min(12, Math.max(1, Number(searchParams.get('limit') || 8)))

  if (!q || q.length < 3) {
    return Response.json([], { status: 200, headers: { 'Cache-Control': 'public, max-age=60' } })
  }

  const url = `${new URL(req.url).origin}/api/gx/suggest?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}&limit=${limit}`

  try {
    const res = await fetch(url, { cache: 'no-store' })
    const items = await res.json()
    return Response.json(items, { status: 200, headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } })
  } catch {
    return Response.json([], { status: 200, headers: { 'Cache-Control': 'public, max-age=15' } })
  }
}


