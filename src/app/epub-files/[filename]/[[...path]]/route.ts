import JSZip from 'jszip'
import { NextRequest } from 'next/server'

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

async function getEpubZip(epubUrl: string): Promise<JSZip> {
  // Check cache first
  const cached = global.epubCache.get(epubUrl)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
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

    // Handle root request - return the EPUB file itself
    if (!resolvedParams.path || resolvedParams.path.length === 0) {
      const response = await fetch(epubUrl, {
        headers: {
          'User-Agent': 'Classic-Reads-App/1.0 (Educational Purpose)',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return new Response(response.body, {
        headers: {
          'Content-Type': 'application/epub+zip',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          // Prefer edge/CDN caching with SWR for robustness
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
} 