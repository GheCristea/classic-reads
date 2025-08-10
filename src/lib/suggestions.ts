export interface SuggestionItem {
  id: string
  title: string
  subtitle?: string
}

const LOCAL_SUGGEST_API = '/api/suggest'

// Simple in-memory cache for suggestions
type CacheEntry = { ts: number; items: SuggestionItem[] }
const SUGGESTIONS_CACHE = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 2 * 60 * 1000 // 2 minutes
// const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes'

function sanitizeQuery(query: string): string {
  return query.trim().slice(0, 100)
}

export async function getGutendexSuggestions(query: string, limit = 8, signal?: AbortSignal): Promise<SuggestionItem[]> {
  const q = sanitizeQuery(query)
  if (!q) return []
  const url = `${LOCAL_SUGGEST_API}?q=${encodeURIComponent(q)}&limit=${limit}`
  const res = await fetch(url, { cache: 'no-store', signal })
  if (!res.ok) return []
  const data = await res.json() as { results?: Array<{ id: number; title: string; authors?: Array<{ name: string }> }> }
  const items = (data.results || []).slice(0, limit).map((b) => ({
    id: String(b.id),
    title: b.title,
    subtitle: (b.authors && b.authors.length > 0) ? b.authors.map(a => a.name).join(', ') : undefined,
  }))
  return items
}

// Author suggestions using the same Gutendex endpoint, but extract unique author names
export async function getAuthorSuggestions(query: string, limit = 8, signal?: AbortSignal): Promise<SuggestionItem[]> {
  const q = sanitizeQuery(query)
  if (!q) return []
  const url = `${LOCAL_SUGGEST_API}?q=${encodeURIComponent(q)}&type=authors&limit=${limit}`
  const res = await fetch(url, { cache: 'no-store', signal })
  if (!res.ok) return []
  const data = await res.json() as SuggestionItem[]
  return data
}

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes'
export async function getGoogleBooksSuggestions(query: string, limit = 8, signal?: AbortSignal): Promise<SuggestionItem[]> {
  const q = sanitizeQuery(query)
  if (!q) return []
  const params = new URLSearchParams({
    q,
    printType: 'books',
    maxResults: String(Math.min(limit, 10)),
    fields: 'items(volumeInfo/title,volumeInfo/authors)'
  })
  const url = `${GOOGLE_BOOKS_API}?${params.toString()}`
  const res = await fetch(url, { cache: 'no-store', signal })
  if (!res.ok) return []
  const data = await res.json() as { items?: Array<{ volumeInfo?: { title?: string; authors?: string[] } }> }
  const items = (data.items || [])
    .map((it, idx) => ({
      id: String(idx),
      title: it.volumeInfo?.title || '',
      subtitle: (it.volumeInfo?.authors && it.volumeInfo.authors.length > 0) ? it.volumeInfo.authors.join(', ') : undefined,
    }))
    .filter(s => s.title)
    .slice(0, limit)
  return items
}

export async function getSuggestions(query: string, limit = 8, signal?: AbortSignal): Promise<SuggestionItem[]> {
  try {
    if (query.length < 3) {
      return []
    }
    const key = `${query}\n${limit}`
    const now = Date.now()
    const cached = SUGGESTIONS_CACHE.get(key)
    if (cached && now - cached.ts < CACHE_TTL_MS) {
      return cached.items
    }
    // Parallel: Gutendex vs delayed Google fallback (3s)
    const gutPromise = getGutendexSuggestions(query, limit, signal)
    const fallbackPromise = new Promise<SuggestionItem[]>((resolve) => {
      const timer = setTimeout(async () => {
        if (signal?.aborted) { resolve([]); return }
        resolve(await getGoogleBooksSuggestions(query, limit, signal))
      }, 3000)
      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timer)
          resolve([])
        }, { once: true })
      }
    })
    const items = await Promise.race([gutPromise, fallbackPromise])
    SUGGESTIONS_CACHE.set(key, { ts: now, items })
    return items
  } catch {
    return []
  }
}


