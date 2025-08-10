import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
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
    // Match all paths that could be EPUB files
    '/books/:path*',
    '/META-INF/:path*',
    '/OEBPS/:path*',
    '/((?!api|_next|favicon.ico|epub-files).)*\\.(opf|ncx|xhtml|xml|css|js|jpg|jpeg|png|svg|gif)$'
  ]
} 