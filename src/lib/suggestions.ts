export interface SuggestionItem {
  id: string
  title: string
  subtitle?: string
}

const LOCAL_SUGGEST_API = '/api/suggest'

// Simple in-memory cache for suggestions (LRU + SWR-friendly)
type CacheEntry = { ts: number; items: SuggestionItem[] }
const SUGGESTIONS_CACHE = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 2 * 60 * 1000 // 2 minutes
const MAX_CACHE_ENTRIES = 100
// Coalesce identical in-flight requests only for Gutendex lookups
const INFLIGHT_GUT = new Map<string, Promise<SuggestionItem[]>>()

function pruneCache() {
  if (SUGGESTIONS_CACHE.size <= MAX_CACHE_ENTRIES) return
  const entries = Array.from(SUGGESTIONS_CACHE.entries())
  entries.sort((a, b) => a[1].ts - b[1].ts)
  const toDelete = entries.slice(0, entries.length - MAX_CACHE_ENTRIES)
  for (const [key] of toDelete) {
    SUGGESTIONS_CACHE.delete(key)
  }
}
// const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes'

function sanitizeQuery(query: string): string {
  return query.trim().slice(0, 100)
}

export async function getGutendexSuggestions(query: string, limit = 8, signal?: AbortSignal): Promise<SuggestionItem[]> {
  const q = sanitizeQuery(query)
  if (!q) return []
  const key = `gut:${q}\n${limit}`
  const existing = INFLIGHT_GUT.get(key)
  if (existing) return existing

  const promise = (async () => {
    const fetchStartTime = performance.now()
    const url = `${LOCAL_SUGGEST_API}?q=${encodeURIComponent(q)}&limit=${limit}`
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout
    
    try {
      const res = await fetch(url, { 
        cache: 'no-store', 
        signal: signal ? AbortSignal.any([signal, controller.signal]) : controller.signal 
      })
      clearTimeout(timeoutId)
      const fetchTime = performance.now() - fetchStartTime
    
    if (!res.ok) {
      console.log(`❌ Gutendex fetch failed after ${fetchTime.toFixed(1)}ms: ${res.status}`)
      return []
    }
    
    const parseStartTime = performance.now()
    const data = await res.json() as unknown
    const parseTime = performance.now() - parseStartTime
    
    // API returns SuggestionItem[] directly; support older shape too
    if (Array.isArray(data)) {
      const totalTime = performance.now() - fetchStartTime
      console.log(`📖 Gutendex fetch: ${fetchTime.toFixed(1)}ms, parse: ${parseTime.toFixed(1)}ms, total: ${totalTime.toFixed(1)}ms`)
      return (data as SuggestionItem[]).slice(0, limit)
    }
    
    const obj = data as { results?: Array<{ id: number; title: string; authors?: Array<{ name: string }> }> }
    const results = Array.isArray(obj?.results) ? obj.results : []
    const mapped = results.slice(0, limit).map((b) => ({
      id: String(b.id),
      title: b.title,
      subtitle: (b.authors && b.authors.length > 0) ? b.authors.map(a => a.name).join(', ') : undefined,
    }))
    
    const totalTime = performance.now() - fetchStartTime
    console.log(`📖 Gutendex fetch: ${fetchTime.toFixed(1)}ms, parse: ${parseTime.toFixed(1)}ms, total: ${totalTime.toFixed(1)}ms`)
    return mapped
    } catch (error) {
      clearTimeout(timeoutId)
      const errorTime = performance.now() - fetchStartTime
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`⏰ Gutendex timeout after ${errorTime.toFixed(1)}ms`)
      } else {
        console.error(`❌ Gutendex error after ${errorTime.toFixed(1)}ms:`, error)
      }
      return []
    }
  })()

  INFLIGHT_GUT.set(key, promise)
  try {
    return await promise
  } finally {
    INFLIGHT_GUT.delete(key)
  }
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
  console.log('GOOGLE_BOOKS_API', url)
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
  const startTime = performance.now()
  try {
    if (query.length < 3) {
      return []
    }
    const key = `${query}\n${limit}`
    const now = Date.now()
    const cached = SUGGESTIONS_CACHE.get(key)
    if (cached && now - cached.ts < CACHE_TTL_MS) {
      const cacheTime = performance.now() - startTime
      console.log(`📦 Suggestions cache hit: ${cacheTime.toFixed(1)}ms`)
      return cached.items
    }

    // Prioritize Gutendex for 3 seconds, then allow Google fallback
    const gutStartTime = performance.now()
    const gutPromise = getGutendexSuggestions(query, limit, signal)
    
    let timer: ReturnType<typeof setTimeout> | null = null
    let fallbackAllowed = false
    
    const fallbackPromise = new Promise<SuggestionItem[]>((resolve) => {
      timer = setTimeout(async () => {
        if (signal?.aborted) { resolve([]); return }
        fallbackAllowed = true
        const fallbackStartTime = performance.now()
        console.log(`🔄 Starting Google fallback after ${(fallbackStartTime - startTime).toFixed(1)}ms`)
        const result = await getGoogleBooksSuggestions(query, limit, signal)
        const fallbackTime = performance.now() - fallbackStartTime
        console.log(`📚 Google fallback completed: ${fallbackTime.toFixed(1)}ms`)
        resolve(result)
      }, 3000) // Wait 3 seconds before allowing fallback
      
      if (signal) {
        signal.addEventListener('abort', () => {
          if (timer) clearTimeout(timer)
          resolve([])
        }, { once: true })
      }
    })

    // Race with priority: Gutendex wins if it resolves within 3s, otherwise Google wins
    const items = await Promise.race([
      gutPromise.then(result => {
        const gutTime = performance.now() - gutStartTime
        console.log(`✅ Gutendex suggestions: ${gutTime.toFixed(1)}ms`)
        if (timer) {
          clearTimeout(timer)
          timer = null
        }
        // Only use Gutendex if it completed within 3 seconds
        if (gutTime <= 3000) {
          return result
        } else {
          console.log(`⏰ Gutendex too slow (${gutTime.toFixed(1)}ms), ignoring result`)
          // Return empty to let Google fallback win
          return []
        }
      }),
      fallbackPromise
    ])

    const totalTime = performance.now() - startTime
    console.log(`🎯 Total suggestions time: ${totalTime.toFixed(1)}ms (${fallbackAllowed ? 'with fallback' : 'Gutendex only'})`)
    
    SUGGESTIONS_CACHE.set(key, { ts: Date.now(), items })
    pruneCache()
    return items
  } catch (error) {
    const errorTime = performance.now() - startTime
    console.error(`❌ Suggestions error after ${errorTime.toFixed(1)}ms:`, error)
    return []
  }
}


