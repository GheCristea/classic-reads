export interface SuggestionItem {
  id: string
  title: string
  subtitle?: string
}

const GUTENDEX_API = 'https://gutendex.com/books'
// const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes'

function sanitizeQuery(query: string): string {
  return query.trim().slice(0, 100)
}

export async function getGutendexSuggestions(query: string, limit = 8): Promise<SuggestionItem[]> {
  const q = sanitizeQuery(query)
  if (!q) return []
  const url = `${GUTENDEX_API}?search=${encodeURIComponent(q)}&page=1`
  const res = await fetch(url, { next: { revalidate: 60 } })
  console.log(res)
  if (!res.ok) return []
  const data = await res.json() as { results?: Array<{ id: number; title: string; authors?: Array<{ name: string }> }> }
  const items = (data.results || []).slice(0, limit).map((b) => ({
    id: String(b.id),
    title: b.title,
    subtitle: (b.authors && b.authors.length > 0) ? b.authors.map(a => a.name).join(', ') : undefined,
  }))
  return items
}

// export async function getGoogleBooksSuggestions(query: string, limit = 8): Promise<SuggestionItem[]> {
//   const q = sanitizeQuery(query)
//   if (!q) return []
//   const key = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY
//   const params = new URLSearchParams({
//     q,
//     printType: 'books',
//     maxResults: String(Math.min(limit, 10)),
//     fields: 'items(volumeInfo/title,volumeInfo/authors)',
//   })
//   if (key) params.set('key', key)
//   const url = `${GOOGLE_BOOKS_API}?${params.toString()}`
//   const res = await fetch(url, { cache: 'no-store' })
//   if (!res.ok) return []
//   const data = await res.json() as { items?: Array<{ volumeInfo?: { title?: string; authors?: string[] } }> }
//   const items = (data.items || [])
//     .map((it, idx) => ({
//       id: String(idx),
//       title: it.volumeInfo?.title || '',
//       subtitle: (it.volumeInfo?.authors && it.volumeInfo.authors.length > 0) ? it.volumeInfo.authors.join(', ') : undefined,
//     }))
//     .filter(s => s.title)
//   return items
// }

export async function getSuggestions(query: string, limit = 8): Promise<SuggestionItem[]> {
  try {
    return await getGutendexSuggestions(query, limit)
  } catch {
    return []
  }
}


