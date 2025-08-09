"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { NavItem, Rendition } from 'epubjs'
import { ChevronLeft, ChevronRight, Menu, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import React, { useCallback, useRef, useState } from 'react'
import type { IReactReaderStyle } from 'react-reader'
import { useSwipeable } from 'react-swipeable'

const ReactReaderLazy = dynamic(() =>
  import('react-reader').then((m) => ({ default: m.ReactReader })),
  { ssr: false }
)

interface EpubReaderProps {
  url: string
  title: string
  author: string
  onClose: () => void
  // Stable identifier for saving reading progress (e.g., original Gutenberg epub URL or book id)
  progressKey?: string
}

export function EpubReader({ url, title, author, onClose, progressKey }: EpubReaderProps) {
  const [location, setLocation] = useState<string | number>(0)
  const [toc, setToc] = useState<NavItem[]>([])
  const [showToc, setShowToc] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [controlsVisible, setControlsVisible] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [, setNavigationQueue] = useState<Array<'next' | 'prev'>>([])
  const renditionRef = useRef<Rendition>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const autoHideTimerRef = useRef<number | null>(null)
  const prevOverflowRef = useRef<string>('')
  const prevHtmlOverflowRef = useRef<string>('')
  const AUTO_HIDE_DELAY_MS = 2500

  // Reader appearance settings
  const [fontSizePct, setFontSizePct] = useState<number>(100)
  const [themeName, setThemeName] = useState<'light' | 'sepia'>('light')

  // Load saved appearance settings on mount
  React.useEffect(() => {
    try {
      if (typeof window === 'undefined') return
      const savedFont = window.localStorage.getItem('reader-font-size')
      const savedTheme = window.localStorage.getItem('reader-theme') as 'light' | 'sepia' | null
      if (savedFont) {
        const next = Math.min(200, Math.max(80, parseInt(savedFont, 10)))
        setFontSizePct(next)
        if (renditionRef.current) {
          renditionRef.current.themes.fontSize(`${next}%`)
        }
      }
      if (savedTheme === 'light' || savedTheme === 'sepia') {
        setThemeName(savedTheme)
        if (renditionRef.current) {
          renditionRef.current.themes.select(savedTheme)
        }
      }
    } catch (e) {
      console.error('Error loading saved reader settings:', e)
    }
  }, [])

  // Convert to absolute URL to ensure react-reader uses it correctly
  const absoluteUrl = React.useMemo(() => {
    if (url.startsWith('http')) {
      return url
    }
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${url}`
    }
    return url
  }, [url])

  // Preload EPUB asset for faster start
  React.useEffect(() => {
    try {
      if (!absoluteUrl || typeof document === 'undefined') return
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = absoluteUrl
      link.as = 'fetch'
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
      return () => {
        try { document.head.removeChild(link) } catch {}
      }
    } catch {}
  }, [absoluteUrl])

  // Debug: Log the URL being used
  console.log('EpubReader original URL:', url)
  console.log('EpubReader absolute URL:', absoluteUrl)

  // Stable storage key for progress
  const progressStorageKey = React.useMemo(() => {
    if (progressKey) return `reading-progress-${progressKey}`
    // Fallback: use URL. Note: session URLs are ephemeral; wrapper should pass progressKey when possible
    return `reading-progress-${url}`
  }, [progressKey, url])

  const locationChanged = useCallback((epubcfi: string) => {
    try {
      console.log('Location changed to:', epubcfi)
      setLocation(epubcfi)
      localStorage.setItem(progressStorageKey, epubcfi)
    } catch (error) {
      console.error('Error handling location change:', error)
    }
  }, [progressStorageKey])

  const tocChanged = useCallback((toc: NavItem[]) => {
    console.log('TOC received:', toc)
    setToc(toc)
  }, [])

  // Auto-hide controls after inactivity when visible
  const clearAutoHideTimer = useCallback(() => {
    if (autoHideTimerRef.current !== null) {
      window.clearTimeout(autoHideTimerRef.current)
      autoHideTimerRef.current = null
    }
  }, [])

  const scheduleAutoHide = useCallback(() => {
    clearAutoHideTimer()
    if (!controlsVisible || showToc) return
    autoHideTimerRef.current = window.setTimeout(() => {
      setControlsVisible(false)
    }, AUTO_HIDE_DELAY_MS)
  }, [AUTO_HIDE_DELAY_MS, clearAutoHideTimer, controlsVisible, showToc])

  const toggleControls = useCallback(() => {
    setControlsVisible((prev) => {
      const next = !prev
      if (!next) {
        clearAutoHideTimer()
      }
      return next
    })
  }, [clearAutoHideTimer])

  React.useEffect(() => {
    if (controlsVisible && !showToc) {
      scheduleAutoHide()
    } else {
      clearAutoHideTimer()
    }
    return clearAutoHideTimer
  }, [controlsVisible, showToc, scheduleAutoHide, clearAutoHideTimer])

  React.useEffect(() => {
    const handleUserActivity = () => {
      if (!controlsVisible || showToc) return
      scheduleAutoHide()
    }
    window.addEventListener('mousemove', handleUserActivity)
    window.addEventListener('touchstart', handleUserActivity)
    window.addEventListener('keydown', handleUserActivity)
    return () => {
      window.removeEventListener('mousemove', handleUserActivity)
      window.removeEventListener('touchstart', handleUserActivity)
      window.removeEventListener('keydown', handleUserActivity)
    }
  }, [controlsVisible, showToc, scheduleAutoHide])

  const getRendition = useCallback((rendition: Rendition) => {
    console.log('Rendition received:', rendition)
    
    if (!rendition) {
      console.error('Rendition is null or undefined')
      setError('Failed to initialize book reader')
      setIsLoading(false)
      return
    }
    
    renditionRef.current = rendition
    setIsLoading(false)
    setError(null) // Clear any previous errors
    
    // Add error handling for the book
    rendition.on('rendered', () => {
      console.log('✅ Book content rendered successfully')
      // Check if content is actually visible
      const iframe = document.querySelector('iframe[title="epub-reader"]')
      if (iframe) {
        console.log('📚 EPUB iframe found:', iframe)
        console.log('📚 EPUB iframe dimensions:', {
          width: (iframe as HTMLElement).offsetWidth,
          height: (iframe as HTMLElement).offsetHeight,
          display: getComputedStyle(iframe).display,
          visibility: getComputedStyle(iframe).visibility
        })
      } else {
        console.warn('⚠️ EPUB iframe not found in DOM')
      }
    })
    
    rendition.on('loadError', (error: unknown) => {
      console.error('❌ Book load error:', error)
      setError('Failed to load book content. Please try again.')
    })
    
    rendition.on('relocated', (location: string) => {
      console.log('📍 Book relocated to:', location)
      // Release navigation lock and process queued actions
      setIsNavigating(false)
      setNavigationQueue((queue) => {
        if (queue.length === 0) return queue
        const [nextDirection, ...remaining] = queue
        // Defer to allow DOM to settle
        setTimeout(() => {
          if (nextDirection === 'next') {
            renditionRef.current?.next?.()
          } else {
            renditionRef.current?.prev?.()
          }
        }, 100)
        return remaining
      })
    })
    
    // Force resize to ensure proper display
    setTimeout(() => {
      if (rendition.resize && containerRef.current) {
        console.log('🔄 Forcing rendition resize')
        const width = containerRef.current.offsetWidth
        const height = containerRef.current.offsetHeight
        console.log('📏 Container dimensions from ref:', { width, height })
        
        if (width > 0 && height > 0) {
          rendition.resize(width, height)
        }
      }
    }, 200)
    
    // Customize the reader appearance
    try {
      // Base default theme (will be overridden by selected theme)
      rendition.themes.default({
        body: {
          'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          'line-height': '1.6',
          'margin': '0',
          'padding': '2rem'
        }
      })

      // Register light/dark/sepia themes
      rendition.themes.register('light', {
        body: {
          'background': '#ffffff',
          'color': '#1f2937'
        }
      })


      rendition.themes.register('sepia', {
        body: {
          'background': '#f4ecd8',
          'color': '#4b3f2f'
        }
      })

      // Apply saved settings
      const savedFont = typeof window !== 'undefined' ? window.localStorage.getItem('reader-font-size') : null
      const savedTheme = typeof window !== 'undefined' ? window.localStorage.getItem('reader-theme') : null
      const nextFontPct = savedFont ? Math.min(200, Math.max(80, parseInt(savedFont, 10))) : 100
      const nextTheme = (savedTheme as 'light' | 'sepia') || 'light'

      rendition.themes.fontSize(`${nextFontPct}%`)
      rendition.themes.select(nextTheme)
    } catch (error) {
      console.error('Error setting themes:', error)
    }
  }, [])

  // Lock body scroll while reader is open (iOS-safe: lock both body and html)
  React.useEffect(() => {
    try {
      const prevOverflow = document.body.style.overflow
      const prevHtmlOverflow = document.documentElement.style.overflow
      prevOverflowRef.current = prevOverflow
      prevHtmlOverflowRef.current = prevHtmlOverflow
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      return () => {
        try {
          document.body.style.overflow = prevOverflowRef.current
          document.documentElement.style.overflow = prevHtmlOverflowRef.current
        } catch {}
      }
    } catch {}
  }, [])

  const handleClose = useCallback(() => {
    // Proactively restore scroll before parent unmounts this component
    try {
      document.body.style.overflow = prevOverflowRef.current || ''
      document.documentElement.style.overflow = prevHtmlOverflowRef.current || ''
      // Failsafe: if still stuck, force enable after a tick
      setTimeout(() => {
        if (getComputedStyle(document.body).overflow === 'hidden') {
          document.body.style.overflow = 'auto'
        }
        if (getComputedStyle(document.documentElement).overflow === 'hidden') {
          document.documentElement.style.overflow = 'auto'
        }
      }, 0)
    } catch {}
    onClose()
  }, [onClose])

  // Destroy rendition on unmount to free resources (if supported)
  React.useEffect(() => {
    return () => {
      try {
        const anyRendition = renditionRef.current as unknown as { destroy?: () => void }
        anyRendition?.destroy?.()
      } catch (e) {
        console.warn('Error during rendition cleanup:', e)
      }
    }
  }, [])

  // Navigation controller: throttle/queue rapid taps
  const navigate = useCallback((direction: 'next' | 'prev') => {
    const rendition = renditionRef.current
    if (!rendition) {
      console.warn('No rendition available for navigation')
      return
    }

    if (isNavigating) {
      setNavigationQueue((q) => [...q, direction])
      return
    }

    setIsNavigating(true)
    try {
      if (direction === 'next') {
        rendition.next?.()
      } else {
        rendition.prev?.()
      }
    } catch (error) {
      console.error('Navigation error:', error)
      setIsNavigating(false)
    }
  }, [isNavigating])

  const goToNextPage = useCallback(() => navigate('next'), [navigate])
  const goToPreviousPage = useCallback(() => navigate('prev'), [navigate])

  const goToChapter = useCallback((href: string) => {
    console.log('Chapter clicked:', href, 'rendition:', renditionRef.current)
    if (renditionRef.current && renditionRef.current.display) {
      try {
        renditionRef.current.display(href)
        setShowToc(false)
      } catch (error) {
        console.error('Error navigating to chapter:', error)
      }
    } else {
      console.warn('No rendition available for chapter navigation')
    }
  }, [])

  // Load saved reading progress
  React.useEffect(() => {
    const savedLocation = localStorage.getItem(progressStorageKey)
    if (savedLocation) {
      setLocation(savedLocation)
    }
  }, [progressStorageKey])

  // Add timeout for loading
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading && !error) {
        console.warn('Book loading timeout - taking too long to load')
        setError('Book is taking too long to load. Please check your connection and try again.')
        setIsLoading(false)
      }
    }, 30000) // 30 seconds timeout

    return () => clearTimeout(timeout)
  }, [isLoading, error])

  // Test URL accessibility
  React.useEffect(() => {
    const testUrl = async () => {
      try {
        console.log('Testing URL accessibility:', absoluteUrl)
        const response = await fetch(absoluteUrl, { 
          method: 'HEAD',
          mode: 'cors',
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        console.log('✅ URL is accessible')
      } catch (error) {
        console.error('❌ URL accessibility test failed:', error)
        setError(`Cannot access book file: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setIsLoading(false)
      }
    }

    if (absoluteUrl && isLoading && !error) {
      testUrl()
    }
  }, [absoluteUrl, isLoading, error])

  // Force a DOM check for ReactReader content
  React.useEffect(() => {
    if (!isLoading && !error) {
      const checkInterval = setInterval(() => {
        const container = document.querySelector('[data-testid="react-reader"]') || 
                         document.querySelector('.react-reader-container') ||
                         document.querySelector('iframe[title="epub-reader"]')
        
        if (container) {
          console.log('📚 Found ReactReader container:', container)
          console.log('📚 Container styles:', {
            display: getComputedStyle(container).display,
            visibility: getComputedStyle(container).visibility,
            width: (container as HTMLElement).offsetWidth || getComputedStyle(container).width,
            height: (container as HTMLElement).offsetHeight || getComputedStyle(container).height,
            zIndex: getComputedStyle(container).zIndex
          })
          clearInterval(checkInterval)
        } else {
          console.warn('⚠️ ReactReader container not found, retrying...')
        }
      }, 1000)

      // Clean up after 10 seconds
      setTimeout(() => clearInterval(checkInterval), 10000)
      
      return () => clearInterval(checkInterval)
    }
  }, [isLoading, error])

  // Handle window resize to update EPUB dimensions
  React.useEffect(() => {
    const handleResize = () => {
      if (renditionRef.current && containerRef.current) {
        setTimeout(() => {
          const width = containerRef.current!.offsetWidth
          const height = containerRef.current!.offsetHeight
          console.log('🪟 Window resized, updating EPUB dimensions:', { width, height })
          
          if (width > 0 && height > 0) {
            renditionRef.current!.resize(width, height)
          }
        }, 100)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Force initial resize when rendition and container are both available
  React.useEffect(() => {
    if (renditionRef.current && containerRef.current && !isLoading && !error) {
      setTimeout(() => {
        const width = containerRef.current!.offsetWidth
        const height = containerRef.current!.offsetHeight
        console.log('🔧 Initial force resize with container dimensions:', { width, height })
        
        if (width > 0 && height > 0) {
          renditionRef.current!.resize(width, height)
        }
      }, 300)
    }
  }, [isLoading, error])

  // Keyboard navigation with debugging
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      console.log('Key pressed:', e.key)
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goToPreviousPage()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goToNextPage()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setShowToc(false)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [goToNextPage, goToPreviousPage])

  // Define our own reader styles
  const readerStyles: IReactReaderStyle = {
    container: {
      height: '100%',
      width: '100%',
      overflow: 'hidden',
    },
    readerArea: {
      position: 'relative',
      height: '100%',
      width: '100%',
      overflow: 'hidden',
    },
    reader: {
      position: 'relative',
      height: '100%',
      width: '100%',
      background: '#ffffff',
      color: '#333333',
    },
    swipeWrapper: {
      height: '100%',
      width: '100%',
    },
    tocArea: {
      background: '#f8fafc',
      minWidth: '300px',
      height: '100%',
    },
    tocButtonBar: {
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      padding: '12px',
    },
    tocButton: {
      color: '#64748b',
      fontSize: '14px',
    },
    tocButtonExpanded: {
      background: '#f1f5f9',
    },
    containerExpanded: {},
    titleArea: {},
    prev: {},
    next: {},
    arrow: {},
    arrowHover: {},
    tocBackground: {},
    toc: {},
    tocAreaButton: {},
    tocButtonBarTop: {},
    loadingView: {},
    tocButtonBottom: {}
  }

  // Swipe gestures (mobile): left = next page, right = previous page
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => (!selectionMode ? goToNextPage() : undefined),
    onSwipedRight: () => (!selectionMode ? goToPreviousPage() : undefined),
    preventScrollOnSwipe: true,
    trackMouse: false,
    delta: 50,
  })

  // Merge our container ref with swipeable's ref
  const { ref: swipeRef, ...swipeProps } = swipeHandlers as unknown as {
    ref?: (node: HTMLElement | null) => void
  }
  const setMergedRef = (node: HTMLDivElement | null) => {
    // Assign to our ref
    ;(containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node
    // Forward to swipe ref if present
    try {
      if (typeof swipeRef === 'function') swipeRef(node as unknown as HTMLElement | null)
    } catch {}
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden"
      style={{ 
        touchAction: 'pan-y', 
        height: '100dvh',
        overscrollBehavior: 'contain'
      }}
      onTouchMove={(e) => { e.preventDefault(); e.stopPropagation() }}
      onWheel={(e) => { e.preventDefault(); e.stopPropagation() }}
    >
      {/* Controls Overlay */}
      {controlsVisible && (
        <div className="hidden md:block absolute top-0 left-0 right-0 z-30 pointer-events-none">
          <div
            className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4 bg-gradient-to-b from-background/80 to-transparent backdrop-blur-sm pointer-events-auto"
            style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
          >
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Button variant="ghost" size="icon" className="h-11 w-11" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="font-semibold text-base sm:text-lg truncate">{title}</h1>
            <p className="hidden sm:block text-sm text-muted-foreground">{author}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 w-full md:w-auto justify-end mt-2 md:mt-0">
          {/* Font size controls */}
          <div className="flex items-center gap-1 mr-1 sm:mr-2">
            <Button
              variant="outline"
              size="sm"
              className="min-h-11 min-w-11"
              onClick={() => {
                const next = Math.max(80, fontSizePct - 10)
                setFontSizePct(next)
                try {
                  if (renditionRef.current) {
                    renditionRef.current.themes.fontSize(`${next}%`)
                  }
                  if (typeof window !== 'undefined') {
                    window.localStorage.setItem('reader-font-size', String(next))
                  }
                } catch (e) {
                  console.error('Error decreasing font size:', e)
                }
              }}
            >
              A-
            </Button>
            <span className="hidden sm:inline-block text-xs w-10 text-center text-muted-foreground">{fontSizePct}%</span>
            <Button
              variant="outline"
              size="sm"
              className="min-h-11 min-w-11"
              onClick={() => {
                const next = Math.min(200, fontSizePct + 10)
                setFontSizePct(next)
                try {
                  if (renditionRef.current) {
                    renditionRef.current.themes.fontSize(`${next}%`)
                  }
                  if (typeof window !== 'undefined') {
                    window.localStorage.setItem('reader-font-size', String(next))
                  }
                } catch (e) {
                  console.error('Error increasing font size:', e)
                }
              }}
            >
              A+
            </Button>
          </div>

          {/* Theme selector */}
          <div className="hidden sm:flex items-center gap-1 mr-2">
            <label className="text-xs text-muted-foreground">Theme</label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={themeName}
              onChange={(e) => {
                const next = e.target.value as 'light' | 'sepia'
                setThemeName(next)
                try {
                  if (renditionRef.current) {
                    renditionRef.current.themes.select(next)
                  }
                  if (typeof window !== 'undefined') {
                    window.localStorage.setItem('reader-theme', next)
                  }
                } catch (err) {
                  console.error('Error selecting theme:', err)
                }
              }}
            >
              <option value="light">Light</option>
              <option value="sepia">Sepia</option>
            </select>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              console.log('TOC button clicked, current TOC:', toc)
              setShowToc(!showToc)
            }}
            disabled={toc.length === 0}
          >
            <Menu className="h-4 w-4" />
            <span className="hidden sm:inline ml-2">Contents ({toc.length})</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`ml-2 ${selectionMode ? 'bg-muted' : ''}`}
            onClick={() => setSelectionMode((v) => !v)}
            title="Toggle selection mode"
          >
            {selectionMode ? 'Selection: On' : 'Selection: Off'}
          </Button>
        </div>
          </div>
        </div>
      )}

      {/* Reveal Indicator */}
      {!controlsVisible && (
        <button
          className="hidden md:block absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-background/60 hover:bg-background/80 text-foreground text-[11px] px-2 py-0.5 rounded-full shadow backdrop-blur-sm pointer-events-auto"
          onClick={(e) => {
            e.stopPropagation()
            setControlsVisible(true)
          }}
          aria-label="Show reader controls"
        >
          Show controls
        </button>
      )}

      {/* Navigation Controls (show on tap/mobile too) */}
      <div className={`${controlsVisible ? 'block' : 'hidden'} md:block absolute top-1/2 left-4 transform -translate-y-1/2 z-40`}>
        <Button
          variant="outline"
          size="icon"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            goToPreviousPage()
          }}
          className="bg-background/80 hover:bg-background shadow h-11 w-11 backdrop-blur-sm"
          disabled={isNavigating}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>
      
      <div className={`${controlsVisible ? 'block' : 'hidden'} md:block absolute top-1/2 right-4 transform -translate-y-1/2 z-40`}>
        <Button
          variant="outline"
          size="icon"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            goToNextPage()
          }}
          className="bg-background/80 hover:bg-background shadow h-11 w-11 backdrop-blur-sm"
          disabled={isNavigating}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile tap zones for page navigation */}
      <button
        className="md:hidden absolute inset-y-0 left-0 w-1/3 z-10"
        style={{ touchAction: 'manipulation' }}
        aria-label="Previous page"
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (!selectionMode) goToPreviousPage()
        }}
        disabled={isNavigating}
      />
      <button
        className="md:hidden absolute inset-y-0 right-0 w-1/3 z-10"
        style={{ touchAction: 'manipulation' }}
        aria-label="Next page"
        onTouchStart={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (!selectionMode) goToNextPage()
        }}
        disabled={isNavigating}
      />

      {/* Center tap zone: reveal controls without navigation (mobile) */}
      {!controlsVisible && (
        <button
          className="md:hidden absolute inset-y-0 left-1/3 right-1/3 z-10"
          style={{ touchAction: 'manipulation' }}
          aria-label="Toggle controls"
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            toggleControls()
          }}
        />
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-center justify-center flex-1">
          <div className="text-center space-y-4 max-w-md">
            <div className="rounded-full bg-red-100 p-3 mx-auto w-fit">
              <X className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Unable to Load Book</h3>
              <p className="text-sm text-gray-600 mt-2">{error}</p>
              <p className="text-xs text-gray-500 mt-2">URL: {absoluteUrl}</p>
            </div>
            <Button 
              onClick={() => {
                setError(null)
                setIsLoading(true)
                window.location.reload()
              }}
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Reader Container */}
      {!error && (
        <div 
          ref={setMergedRef}
          className="flex-1 relative bg-white min-h-[300px] overflow-hidden"
          data-react-reader-container
          onPointerDown={(e) => {
            // Avoid clicks inside the overlay area from closing it
            const topOverlayHeight = 96 // approx overlay height including safe area
            const clientY = (e as unknown as { clientY?: number }).clientY ?? 0
            if (clientY <= topOverlayHeight) return
            if (!controlsVisible) {
              setControlsVisible(true)
            }
          }}
          onPointerMove={() => {
            if (controlsVisible) return
            setControlsVisible(true)
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          style={{ touchAction: 'pan-y' }}
          {...swipeProps}
        >
          <ReactReaderLazy
            url={absoluteUrl}
            location={location}
            locationChanged={locationChanged}
            tocChanged={tocChanged}
            getRendition={getRendition}
            showToc={false}
            readerStyles={{
              ...readerStyles,
              container: {
                height: '100%',
                width: '100%',
                position: 'relative',
                overflow: 'hidden',
                background: '#ffffff',
              },
              readerArea: {
                position: 'relative',
                height: '100%',
                width: '100%',
                overflow: 'hidden',
                background: '#ffffff',
              },
              reader: {
                position: 'relative',
                height: '100%',
                width: '100%',
                background: '#ffffff',
                color: '#333333',
                border: 'none',
                outline: 'none',
              }
            }}
            epubOptions={{
              allowPopups: false,
              allowScriptedContent: false,
            }}
            loadingView={
              <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground">Loading book content...</p>
                  <p className="text-xs text-gray-500">URL: {absoluteUrl}</p>
                </div>
              </div>
            }
          />
          
          {/* Debug overlay */}
          {process.env.NODE_ENV === 'development' && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs p-2 rounded z-50">
              <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
              <div>Error: {error ? 'Yes' : 'No'}</div>
              <div>TOC items: {toc.length}</div>
              <div>Location: {typeof location === 'string' ? location.substring(0, 20) + '...' : location}</div>
              <div>Navigating: {isNavigating ? 'Yes' : 'No'}</div>
              <div>Selection: {selectionMode ? 'On' : 'Off'}</div>
            </div>
          )}
        </div>
      )}

      {/* Mobile floating action button and bottom sheet */}
      <MobileControls
        selectionMode={selectionMode}
        setSelectionMode={setSelectionMode}
        onPrev={goToPreviousPage}
        onNext={goToNextPage}
        onClose={handleClose}
        isNavigating={isNavigating}
        fontSizePct={fontSizePct}
        setFontSizePct={(next) => {
          const clamped = Math.max(80, Math.min(200, next))
          setFontSizePct(clamped)
          try {
            renditionRef.current?.themes.fontSize(`${clamped}%`)
            if (typeof window !== 'undefined') {
              window.localStorage.setItem('reader-font-size', String(clamped))
            }
          } catch (e) {
            console.error('Error updating font size:', e)
          }
        }}
        themeName={themeName}
        setThemeName={(next) => {
          setThemeName(next)
          try {
            renditionRef.current?.themes.select(next)
            if (typeof window !== 'undefined') {
              window.localStorage.setItem('reader-theme', next)
            }
          } catch (e) {
            console.error('Error updating theme:', e)
          }
        }}
      />

      {/* Table of Contents Overlay */}
      {showToc && toc.length > 0 && (
        <div className="absolute top-20 left-4 w-80 max-h-[calc(100vh-120px)] overflow-y-auto z-20">
          <Card className="shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Table of Contents</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowToc(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              {toc.map((chapter, index) => (
                <button
                  key={index}
                  className="w-full text-left p-3 rounded hover:bg-muted transition-colors text-sm border-l-2 border-transparent hover:border-primary"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('Chapter button clicked:', chapter)
                    goToChapter(chapter.href)
                  }}
                >
                  <div className="font-medium">{chapter.label}</div>
                  {chapter.subitems && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {chapter.subitems.length} sections
                    </div>
                  )}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 

type MobileControlsProps = {
  selectionMode: boolean
  setSelectionMode: React.Dispatch<React.SetStateAction<boolean>>
  onPrev: () => void
  onNext: () => void
  onClose: () => void
  isNavigating: boolean
  fontSizePct: number
  setFontSizePct: (value: number) => void
  themeName: 'light' | 'sepia'
  setThemeName: (value: 'light' | 'sepia') => void
}

function MobileControls(props: MobileControlsProps) {
  const {
    selectionMode,
    setSelectionMode,
    onPrev,
    onNext,
    onClose,
    isNavigating,
    fontSizePct,
    setFontSizePct,
    themeName,
    setThemeName,
  } = props

  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  return (
    <>
      {/* FAB */}
      <button
        className="md:hidden fixed bottom-5 right-5 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg focus:outline-none"
        aria-label="Reader menu"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsMenuOpen((v) => !v)
        }}
        style={{ minWidth: 44, minHeight: 44 }}
      >
        ☰
      </button>

      {/* Bottom sheet */}
      {isMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40"
          onClick={() => setIsMenuOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute left-0 right-0 bottom-0 bg-background rounded-t-xl shadow-xl p-4 space-y-3"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto h-1 w-10 bg-muted rounded" />
            <div className="flex items-center justify-between">
              <Button variant="outline" className="h-11" onClick={onPrev} disabled={isNavigating}>
                <ChevronLeft className="h-5 w-5 mr-2" /> Previous
              </Button>
              <Button variant="outline" className="h-11" onClick={onNext} disabled={isNavigating}>
                Next <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Font size</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="h-11 w-11" onClick={() => setFontSizePct(fontSizePct - 10)}>A-</Button>
                <span className="text-xs w-10 text-center">{fontSizePct}%</span>
                <Button variant="outline" className="h-11 w-11" onClick={() => setFontSizePct(fontSizePct + 10)}>A+</Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Theme</span>
              <select
                className="border rounded px-2 py-2 text-sm"
                value={themeName}
                onChange={(e) => setThemeName(e.target.value as 'light' | 'sepia')}
              >
                <option value="light">Light</option>
                <option value="sepia">Sepia</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Selection mode</span>
              <Button variant="outline" className="h-11" onClick={() => setSelectionMode(!selectionMode)}>
                {selectionMode ? 'On' : 'Off'}
              </Button>
            </div>
            <div className="pt-2 space-y-2">
              <Button className="w-full h-11" variant="destructive" onClick={onClose}>
                Close Reader
              </Button>
              <Button className="w-full h-11" variant="outline" onClick={() => setIsMenuOpen(false)}>
                Close Menu
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}