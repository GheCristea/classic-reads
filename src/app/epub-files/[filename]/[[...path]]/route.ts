import JSZip from 'jszip'
import { NextRequest } from 'next/server'

export const dynamic = "force-dynamic"

interface EpubSession {
  epubUrl: string
  timestamp: number
}

interface CachedEpub {
  zip: JSZip
  timestamp: number
}

// Use global storage shared with the session route
declare global {
  var epubSessions: Map<string, EpubSession>
  var epubCache: Map<string, CachedEpub>
}

// Initialize global variables
if (!global.epubSessions) {
  global.epubSessions = new Map()
}
if (!global.epubCache) {
  global.epubCache = new Map()
}

const CACHE_DURATION = 60 * 60 * 1000 // 1 hour
const MAX_CACHE_ENTRIES = 6

function pruneCache() {
  try {
    if (global.epubCache.size <= MAX_CACHE_ENTRIES) return
    const entries = Array.from(global.epubCache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    const toDelete = entries.slice(0, Math.max(0, entries.length - MAX_CACHE_ENTRIES))
    for (const [key] of toDelete) {
      global.epubCache.delete(key)
    }
  } catch {}
}

async function getEpubZip(epubUrl: string): Promise<JSZip> {
  // Check cache first
  const cached = global.epubCache.get(epubUrl)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    // touch timestamp for simple LRU
    cached.timestamp = Date.now()
    return cached.zip
  }

  // Download EPUB file
  const response = await fetch(epubUrl, {
    headers: {
      'User-Agent': 'Classic-Reads-App/1.0 (Educational Purpose)',
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  // Parse as ZIP
  const arrayBuffer = await response.arrayBuffer()
  const zip = await JSZip.loadAsync(arrayBuffer)

  // Cache the result
  global.epubCache.set(epubUrl, {
    zip,
    timestamp: Date.now()
  })
  pruneCache()

  return zip
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string; path?: string[] }> }
) {
  try {
    const resolvedParams = await params
    const { filename } = resolvedParams
    
    // Extract session ID from filename (remove .epub extension)
    const sessionId = filename.replace('.epub', '')
    
    // Get session data
    const session = global.epubSessions.get(sessionId)
    if (!session) {
      return new Response('Session not found or expired', { status: 404 })
    }

    const epubUrl = session.epubUrl

    // Handle root request - return the EPUB file itself (support Range)
    if (!resolvedParams.path || resolvedParams.path.length === 0) {
      const incomingRange = request.headers.get('range')

      const upstreamHeaders: Record<string, string> = {
        'User-Agent': 'Classic-Reads-App/1.0 (Educational Purpose)'
      }
      if (incomingRange) {
        upstreamHeaders['Range'] = incomingRange
      }

      const upstream = await fetch(epubUrl, {
        method: 'GET',
        headers: upstreamHeaders,
      })

      if (!upstream.ok && upstream.status !== 206) {
        throw new Error(`HTTP error! status: ${upstream.status}`)
      }

      const passthroughHeaders = new Headers()
      // Prefer origin content-type, fallback
      passthroughHeaders.set('Content-Type', upstream.headers.get('content-type') || 'application/epub+zip')
      for (const h of ['Accept-Ranges', 'Content-Range', 'Content-Length', 'ETag', 'Last-Modified']) {
        const v = upstream.headers.get(h)
        if (v) passthroughHeaders.set(h, v)
      }
      // CORS and caching
      passthroughHeaders.set('Access-Control-Allow-Origin', '*')
      passthroughHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD')
      passthroughHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Range, If-Range')
      passthroughHeaders.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')

      return new Response(upstream.body, {
        status: upstream.status,
        headers: passthroughHeaders,
      })
    }

    // Handle internal file requests
    const zip = await getEpubZip(epubUrl)
    const filePath = resolvedParams.path.join('/')

    // Normalize path - handle common EPUB reader path resolution issues
    let normalizedPath = filePath
    
    // Handle duplicated OEBPS paths (react-reader sometimes does this)
    if (filePath.includes('OEBPS/OEBPS/')) {
      normalizedPath = filePath.replace('OEBPS/OEBPS/', 'OEBPS/')
    }
    
    // Handle duplicated META-INF paths
    if (filePath.includes('META-INF/META-INF/')) {
      normalizedPath = filePath.replace('META-INF/META-INF/', 'META-INF/')
    }

    // Try to get the file with original path first
    let file = zip.file(filePath)
    
    // If not found and we have a normalized path, try that
    if (!file && normalizedPath !== filePath) {
      console.log(`📁 File not found at "${filePath}", trying normalized path: "${normalizedPath}"`)
      file = zip.file(normalizedPath)
    }
    
    if (!file) {
      console.log(`❌ File not found in EPUB: "${filePath}" (normalized: "${normalizedPath}")`)
      return new Response(`File not found: ${filePath}`, { status: 404 })
    }

    console.log(`✅ Found file in EPUB: "${file.name}"`)

    // Get file content
    const content = await file.async('arraybuffer')
    
    // Determine content type based on the actual file path
    const actualPath = normalizedPath !== filePath ? normalizedPath : filePath
    let contentType = 'application/octet-stream'
    if (actualPath.endsWith('.xml')) {
      contentType = 'application/xml'
    } else if (actualPath.endsWith('.opf')) {
      contentType = 'application/oebps-package+xml'
    } else if (actualPath.endsWith('.xhtml') || actualPath.endsWith('.html')) {
      contentType = 'application/xhtml+xml'
    } else if (actualPath.endsWith('.css')) {
      contentType = 'text/css'
    } else if (actualPath.endsWith('.js')) {
      contentType = 'application/javascript'
    } else if (actualPath.endsWith('.jpg') || actualPath.endsWith('.jpeg')) {
      contentType = 'image/jpeg'
    } else if (actualPath.endsWith('.png')) {
      contentType = 'image/png'
    } else if (actualPath.endsWith('.svg')) {
      contentType = 'image/svg+xml'
    }

    return new Response(content, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })

  } catch (error) {
    console.error('Error processing EPUB file request:', error)
    return new Response('Failed to process EPUB file', { status: 500 })
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, Range, If-Range',
    },
  })
} 

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string; path?: string[] }> }
) {
  const resolvedParams = await params
  const { filename } = resolvedParams
  const sessionId = filename.replace('.epub', '')
  const session = global.epubSessions.get(sessionId)
  if (!session) return new Response(null, { status: 404 })

  // For internal assets, mirror GET headers without a body
  if (resolvedParams.path && resolvedParams.path.length > 0) {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
        'Access-Control-Allow-Headers': 'Content-Type, Range, If-Range',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  }

  // For root EPUB file, pass through upstream headers
  const upstream = await fetch(session.epubUrl, {
    method: 'HEAD',
    headers: { 'User-Agent': 'Classic-Reads-App/1.0 (Educational Purpose)' },
  })

  const headers = new Headers()
  headers.set('Content-Type', upstream.headers.get('content-type') || 'application/epub+zip')
  for (const h of ['Accept-Ranges', 'Content-Range', 'Content-Length', 'ETag', 'Last-Modified']) {
    const v = upstream.headers.get(h)
    if (v) headers.set(h, v)
  }
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD')
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Range, If-Range')
  headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')

  return new Response(null, { status: upstream.status, headers })
}