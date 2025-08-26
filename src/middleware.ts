import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const userAgent = request.headers.get("user-agent")
  
  // Bot detection arrays
  const bots = [
    "googlebot",
    "yahoo! slurp",
    "bingbot",
    "yandex",
    "baiduspider",
    "facebookexternalhit",
    "twitterbot",
    "rogerbot",
    "linkedinbot",
    "embedly",
    "quora link preview",
    "showyoubot",
    "outbrain",
    "pinterest/0.",
    "developers.google.com/+/web/snippet",
    "slackbot",
    "vkshare",
    "w3c_validator",
    "redditbot",
    "applebot",
    "whatsapp",
    "flipboard",
    "tumblr",
    "bitlybot",
    "skypeuripreview",
    "nuzzel",
    "discordbot",
    "google page speed",
    "qwantify",
    "pinterestbot",
    "bitrix link preview",
    "xing-contenttabreceiver",
    "chrome-lighthouse",
    "telegrambot",
    "oai-searchbot",
    "chatgpt",
    "gptbot",
    "perplexity",
    "claudeBot",
    "amazonbot",
    "integration-test", // Integration testing
  ]

  const IGNORE_EXTENSIONS = [
    ".js",
    ".css",
    ".xml",
    ".less",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".pdf",
    ".doc",
    ".txt",
    ".ico",
    ".rss",
    ".zip",
    ".mp3",
    ".rar",
    ".exe",
    ".wmv",
    ".doc",
    ".avi",
    ".ppt",
    ".mpg",
    ".mpeg",
    ".tif",
    ".wav",
    ".mov",
    ".psd",
    ".ai",
    ".xls",
    ".mp4",
    ".m4a",
    ".swf",
    ".dat",
    ".dmg",
    ".iso",
    ".flv",
    ".m4v",
    ".torrent",
    ".woff",
    ".ttf",
    ".svg",
    ".webmanifest",
  ]
  
  // Bot detection logic
  const isBot = userAgent && bots.some((bot) => userAgent.toLowerCase().includes(bot))
  const isPrerender = request.headers.get("X-Prerender")
  const extension = pathname.slice(((pathname.lastIndexOf(".") - 1) >>> 0) + 1)

  // Debug logging
  console.log('🤖 Bot check - UserAgent:', userAgent)
  console.log('🤖 isBot:', isBot, 'isPrerender:', isPrerender)
  console.log('🤖 pathname:', pathname, 'extension:', extension)
  console.log('🤖 Should ignore extension?', extension.length && IGNORE_EXTENSIONS.includes(`.${extension.toLowerCase()}`))

  // Handle bot detection and prerendering (first priority)
  if (isBot && !isPrerender && !(extension.length && IGNORE_EXTENSIONS.includes(`.${extension.toLowerCase()}`))) {
    console.log('🚀 Triggering prerender for bot')
    try {
      const newURL = `http://service.prerender.io/${request.url}`
      const newHeaders = new Headers(request.headers)
      newHeaders.set("X-Prerender-Token", process.env.PRERENDER_TOKEN || "")
      newHeaders.set("X-Prerender-Int-Type", "NextJS")

      console.log('🌐 Prerender URL:', newURL)
      console.log('🔑 PRERENDER_TOKEN set:', !!process.env.PRERENDER_TOKEN)

      const res = await fetch(new Request(newURL, {
        headers: newHeaders,
        redirect: "manual",
      }))

      console.log('📡 Prerender response status:', res.status, res.statusText)

      const responseHeaders = new Headers(res.headers)
      responseHeaders.set("X-Redirected-From", request.url)

      // Create a ReadableStream from the response body
      const { readable, writable } = new TransformStream()
      res.body?.pipeTo(writable)

      const response = new NextResponse(readable, {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
      })

      return response
    } catch (error) {
      console.error('❌ Prerender error:', error)
      return NextResponse.next()
    }
  }
  
  // Check for EPUB internal files - either under /books/ or direct paths
  const isEpubFile = (
    // Original /books/ prefixed requests
    (pathname.startsWith('/books/') && (
      pathname.includes('META-INF/container.xml') ||
      pathname.includes('OEBPS/') ||
      pathname.includes('.opf') ||
      pathname.includes('.xhtml') ||
      pathname.includes('.ncx') ||
      pathname.endsWith('.xml') ||
      pathname.endsWith('.css') ||
      pathname.endsWith('.js') ||
      pathname.endsWith('.jpg') ||
      pathname.endsWith('.jpeg') ||
      pathname.endsWith('.png') ||
      pathname.endsWith('.svg') ||
      pathname.endsWith('.gif')
    )) ||
    // Direct EPUB paths (react-reader sometimes uses these)
    pathname.startsWith('/META-INF/') ||
    pathname.startsWith('/OEBPS/') ||
    pathname.includes('.opf') ||
    pathname.includes('.ncx') ||
    (pathname.includes('/') && (
      pathname.endsWith('.xhtml') ||
      pathname.endsWith('.xml') ||
      pathname.endsWith('.css')
    ))
  )
  
  if (isEpubFile) {
    console.log('🚨 Middleware detected EPUB file request:', pathname)
    
    // Get the current session from cookie
    const sessionId = request.cookies.get('epub-session-id')?.value
    
    if (sessionId) {
      // For /books/ prefixed paths, remove the /books/ prefix
      // For direct paths, use them as-is
      let filePath: string
      if (pathname.startsWith('/books/')) {
        filePath = pathname.replace('/books/', '')
      } else {
        filePath = pathname.startsWith('/') ? pathname.substring(1) : pathname
      }
      
      // Redirect to our EPUB proxy
      const newUrl = new URL(`/epub-files/${sessionId}.epub/${filePath}`, request.url)
      
      console.log(`📍 Middleware redirect: ${pathname} -> ${newUrl.pathname}`)
      
      // Use 307 to preserve method and avoid extra roundtrips in some clients
      return NextResponse.redirect(newUrl, { status: 307 })
    } else {
      console.log('❌ EPUB file request without session cookie:', pathname)
      
      // Try to extract session from referer URL if possible
      const referer = request.headers.get('referer')
      if (referer) {
        console.log('🔍 Referer:', referer)
      }
      
      return new NextResponse('EPUB session not found', { status: 404 })
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths for bot detection (excluding API routes and Next.js internals)
    '/((?!api|_next/static|_next/image|favicon.ico|epub-files).)*',
    // Specific EPUB file paths
    '/books/:path*',
    '/META-INF/:path*',
    '/OEBPS/:path*',
  ]
} 