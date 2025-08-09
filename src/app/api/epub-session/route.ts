import { randomUUID } from 'crypto'
import { NextRequest } from 'next/server'

interface EpubSession {
  epubUrl: string
  timestamp: number
}

// Use global storage shared with the dynamic route
declare global {
  var epubSessions: Map<string, EpubSession>
}

if (!global.epubSessions) {
  global.epubSessions = new Map()
}

const SESSION_DURATION = 2 * 60 * 60 * 1000 // 2 hours

// Clean expired sessions
setInterval(() => {
  const now = Date.now()
  for (const [sessionId, session] of global.epubSessions.entries()) {
    if (now - session.timestamp > SESSION_DURATION) {
      global.epubSessions.delete(sessionId)
    }
  }
}, 5 * 60 * 1000) // Clean every 5 minutes

export async function POST(request: NextRequest) {
  try {
    const { epubUrl } = await request.json()

    if (!epubUrl) {
      return new Response('epubUrl is required', { status: 400 })
    }

    // Validate URL
    const urlObj = new URL(epubUrl)
    const allowedHosts = ['www.gutenberg.org', 'gutenberg.org']
    
    if (!allowedHosts.includes(urlObj.hostname)) {
      return new Response('URL not allowed', { status: 403 })
    }

    // Create session
    const sessionId = randomUUID()
    global.epubSessions.set(sessionId, {
      epubUrl,
      timestamp: Date.now()
    })

    // Return URL that looks like a static file
    return Response.json({ 
      sessionId,
      epubUrl: `/epub-files/${sessionId}.epub`,
      expiresIn: SESSION_DURATION
    })

  } catch (error) {
    console.error('Error creating EPUB session:', error)
    return new Response('Failed to create session', { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const sessions_data = Array.from(global.epubSessions.entries()).map(([id, session]) => ({
    id,
    epubUrl: session.epubUrl,
    timestamp: session.timestamp
  }))

  return Response.json({ sessions: sessions_data })
} 