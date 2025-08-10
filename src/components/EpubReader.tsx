"use client"
import { baseReaderStyles } from '@/components/epub-reader/styles'
import type {
  EpubContentsLike,
  EpubLocation,
  ExtendedStyle,
  RenditionWithBook
} from '@/components/epub-reader/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { NavItem } from 'epubjs'
import { Menu, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import React, { useCallback, useRef, useState } from 'react'
import { useSwipeable } from 'react-swipeable'

const ReactReaderLazy = dynamic(() =>
  import('react-reader').then((m) => ({ default: m.ReactReader })),
  { ssr: false }
)

const MobileControlsLazy = dynamic(() =>
  import('@/components/epub-reader/MobileControls').then((m) => m.default)
)

const DesktopArrowsLazy = dynamic(() =>
  import('@/components/epub-reader/DesktopArrows').then((m) => m.default),
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
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionDirection, setTransitionDirection] = useState<null | 'next' | 'prev'>(null)
  const [isTextSelected, setIsTextSelected] = useState(false)
  const [progress, setProgress] = useState<{ chapter: number; book: number; timeLeft: number }>({ chapter: 0, book: 0, timeLeft: 0 })
  const [totalLocations, setTotalLocations] = useState<number>(0)
  const renditionRef = useRef<RenditionWithBook>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [scrubPct, setScrubPct] = useState<number | null>(null)
  const lastScrubRef = useRef<number>(0)
  const SCRUB_THROTTLE_MS = 100
  const autoHideTimerRef = useRef<number | null>(null)
  const prevOverflowRef = useRef<string>('')
  const prevHtmlOverflowRef = useRef<string>('')
  const lastNavTimeRef = useRef<number>(0)
  const selectionModeRef = useRef<boolean>(selectionMode)
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

  // Debug: Log the URL being used (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('EpubReader original URL:', url)
    console.log('EpubReader absolute URL:', absoluteUrl)
  }

  // Stable storage key for progress
  const progressStorageKey = React.useMemo(() => {
    if (progressKey) return `reading-progress-${progressKey}`
    // Fallback: use URL. Note: session URLs are ephemeral; wrapper should pass progressKey when possible
    return `reading-progress-${url}`
  }, [progressKey, url])

  const locationChanged = useCallback((epubcfi: string) => {
    try {
      setLocation(epubcfi)
      localStorage.setItem(progressStorageKey, epubcfi)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error handling location change:', error)
      }
    }
  }, [progressStorageKey])

  const tocChanged = useCallback((toc: NavItem[]) => {
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

  const getRendition = useCallback((rendition: RenditionWithBook) => {
    if (!rendition) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Rendition is null or undefined')
      }
      setError('Failed to initialize book reader')
      setIsLoading(false)
      return
    }
    
    renditionRef.current = rendition
    setIsLoading(false)
    setError(null) // Clear any previous errors
    
    // Add error handling for the book
    rendition.on('rendered', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Book content rendered successfully')
      }
      // Check if content is actually visible
      const iframe = document.querySelector('iframe[title="epub-reader"]')
      if (iframe) {
        if (process.env.NODE_ENV === 'development') {
          console.log('📚 EPUB iframe found:', iframe)
          console.log('📚 EPUB iframe dimensions:', {
            width: (iframe as HTMLElement).offsetWidth,
            height: (iframe as HTMLElement).offsetHeight,
            display: getComputedStyle(iframe).display,
            visibility: getComputedStyle(iframe).visibility
          })
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ EPUB iframe not found in DOM')
        }
      }

      // Attach selection monitoring and enforce touch/selection styles inside iframe(s)
      try {
        const unsafeContents = rendition.getContents?.() as unknown as EpubContentsLike[]
        const contentsList = Array.isArray(unsafeContents)
          ? (unsafeContents )
          : unsafeContents
            ? [unsafeContents]
            : []
        contentsList.forEach((contents) => {
          const doc: Document | undefined = contents?.document
          if (!doc) return
          // Ensure consistent touch behavior
          const body = doc.body
          if (body) {
            body.style.touchAction = 'pan-y'
            body.style.userSelect = selectionModeRef.current ? 'text' : 'none'
            ;(body.style as ExtendedStyle).webkitUserSelect = selectionModeRef.current ? 'text' : 'none'
          }
          // Monitor text selection to temporarily disable navigation when selecting
          const onSelectionChange = () => {
            try {
              const sel = doc.getSelection?.()
              setIsTextSelected(Boolean(sel && sel.toString().length > 0))
            } catch {}
          }
          doc.removeEventListener('selectionchange', onSelectionChange)
          doc.addEventListener('selectionchange', onSelectionChange)
        })
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Unable to attach selection listeners to EPUB contents:', e)
        }
      }
    })
    
    rendition.on('loadError', (error: unknown) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Book load error:', error)
      }
      setError('Failed to load book content. Please try again.')
    })
    
    rendition.on('relocated', (location: EpubLocation) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('📍 Book relocated to:', location)
      }
      // Release navigation lock and process queued actions
      setIsNavigating(false)
      setIsTransitioning(false)
      setTransitionDirection(null)

      // Update reading progress (chapter/book/time remaining)
      try {
        const bookProgress = location?.start?.percentage ?? 0
        const displayed = location?.start?.displayed
        const chapterProgress = displayed ? (displayed.page || 0) / Math.max(1, displayed.total || 1) : 0
        const locationsTotal = renditionRef.current?.book?.locations?.total || 0
        const wordsPerLocation = 150
        const wordsRemaining = Math.max(0, locationsTotal * (1 - bookProgress) * wordsPerLocation)
        const minutesLeft = Math.ceil(wordsRemaining / 250)
        setProgress({
          chapter: Math.round(chapterProgress * 100),
          book: Math.round(bookProgress * 100),
          timeLeft: minutesLeft,
        })
        } catch (e) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Failed to compute reading progress:', e)
          }
      }

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
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Forcing rendition resize')
        }
        const width = containerRef.current.offsetWidth
        const height = containerRef.current.offsetHeight
        if (process.env.NODE_ENV === 'development') {
          console.log('📏 Container dimensions from ref:', { width, height })
        }
        
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
      if (process.env.NODE_ENV === 'development') {
        console.error('Error setting themes:', error)
      }
    }

    // Prepare EPUB locations for consistent pagination and progress calculation
    try {
      const anyRendition = rendition
      const book = anyRendition?.book
      const initLocations = async () => {
        try {
          if (!book) return
          // Ensure book is ready, then generate locations
          await (book.ready || Promise.resolve())
          if (!book.locations || !book.locations.generate) return
          await (book.locations).generate?.(1600) // ~600 chars per page
          const total = book.locations.total || 0
          setTotalLocations(total)
          // If we already have a current location, trigger a progress computation
          const loc = rendition.currentLocation?.()
          if (loc) {
            rendition.emit?.('relocated', loc)
          }
        } catch (e) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Failed to generate EPUB locations:', e)
          }
        }
      }
      initLocations()
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error during locations initialization:', e)
      }
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
        const anyRendition = renditionRef.current
        anyRendition?.destroy?.()
      } catch (e) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Error during rendition cleanup:', e)
        }
      }
    }
  }, [])

  // Navigation controller: throttle/queue rapid taps
  const navigate = useCallback((direction: 'next' | 'prev') => {
    const rendition = renditionRef.current
    if (!rendition) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('No rendition available for navigation')
      }
      return
    }

    // Avoid navigation when user is selecting text
    if (isTextSelected) {
      return
    }

    // Throttle to avoid overwhelming mobile devices
    const now = Date.now()
    if (now - lastNavTimeRef.current < 250) {
      return
    }
    lastNavTimeRef.current = now

    if (isNavigating) {
      setNavigationQueue((q) => [...q, direction])
      return
    }

    setIsNavigating(true)
    setIsTransitioning(true)
    setTransitionDirection(direction)
    try {
      if (direction === 'next') {
        rendition.next?.()
      } else {
        rendition.prev?.()
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Navigation error:', error)
      }
      setIsNavigating(false)
      setIsTransitioning(false)
      setTransitionDirection(null)
    }
  }, [isNavigating, isTextSelected])

  const goToNextPage = useCallback(() => navigate('next'), [navigate])
  const goToPreviousPage = useCallback(() => navigate('prev'), [navigate])

  const goToChapter = useCallback((href: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Chapter clicked:', href, 'rendition:', renditionRef.current)
    }
    if (renditionRef.current && renditionRef.current.display) {
      try {
        renditionRef.current.display(href)
        setShowToc(false)
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error navigating to chapter:', error)
        }
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.warn('No rendition available for chapter navigation')
      }
    }
  }, [])

  // Keep a live ref of selectionMode for iframe styling logic
  React.useEffect(() => {
    selectionModeRef.current = selectionMode
    try {
      // When selection mode toggles, update current contents user-select
      const unsafeContents = renditionRef.current?.getContents?.() as unknown as EpubContentsLike[]
      const contentsList = Array.isArray(unsafeContents)
        ? (unsafeContents )
        : unsafeContents
          ? [unsafeContents]
          : []
      contentsList.forEach((contents: EpubContentsLike) => {
        const doc = contents.document
        if (!doc) return
        const body = doc.body
        if (body) {
          body.style.userSelect = selectionMode ? 'text' : 'none'
          ;(body.style as ExtendedStyle).webkitUserSelect = selectionMode ? 'text' : 'none'
        }
      })
    } catch {}
  }, [selectionMode])

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
          if (process.env.NODE_ENV === 'development') {
            console.warn('Book loading timeout - taking too long to load')
          }
        setError('Book is taking too long to load. Please check your connection and try again.')
        setIsLoading(false)
      }
    }, 30000) // 30 seconds timeout

    return () => clearTimeout(timeout)
  }, [isLoading, error])

  // Handle window resize to update EPUB dimensions
  React.useEffect(() => {
    const handleResize = () => {
      if (renditionRef.current && containerRef.current) {
        setTimeout(() => {
          const width = containerRef.current!.offsetWidth
          const height = containerRef.current!.offsetHeight
          if (process.env.NODE_ENV === 'development') {
            console.log('🪟 Window resized, updating EPUB dimensions:', { width, height })
          }
          
          if (width > 0 && height > 0) {
            renditionRef.current!.resize(width, height)
          }
        }, 100)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])


  // Keyboard navigation with debugging
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Key pressed:', e.key)
      }
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

  // Swipe gestures (mobile): left = next page, right = previous page
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => (!selectionMode ? goToNextPage() : undefined),
    onSwipedRight: () => (!selectionMode ? goToPreviousPage() : undefined),
    onSwipedUp: () => {
      if (controlsVisible && !showToc) {
        setControlsVisible(false)
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: false,
    delta: 50,
  })

  // Merge our container ref with swipeable's ref
  const { ref: swipeRef, ...swipeProps } = swipeHandlers;
  const setMergedRef = (node: HTMLDivElement | null) => {
    // Assign to our ref
    ;(containerRef).current = node
    // Forward to swipe ref if present
    try {
      if (typeof swipeRef === 'function') swipeRef(node)
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
    >
      {/* Controls Overlay */}
      {controlsVisible && (
        <div className="absolute top-0 left-0 right-0 z-30 pointer-events-none">
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
            if (process.env.NODE_ENV === 'development') {
              console.log('TOC button clicked, current TOC:', toc)
            }
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

      {/* Reveal Indicator removed: controls now show on interaction across devices */}

      {/* Desktop-only navigation arrows (hidden on mobile) */}
      <DesktopArrowsLazy
        visible={controlsVisible}
        isNavigating={isNavigating}
        onPrev={goToPreviousPage}
        onNext={goToNextPage}
      />

      {/* Mobile tap zones for page navigation */}
      <button
        className="md:hidden absolute inset-y-0 left-0 w-1/5 z-10"
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
        className="md:hidden absolute inset-y-0 right-0 w-1/5 z-10"
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
            const clientY = (e).clientY ?? 0
            if (clientY <= topOverlayHeight) return
            if (!controlsVisible) {
              setControlsVisible(true)
            }
          }}
          onTouchMove={(e) => {
            if (!controlsVisible) return
            const first = e.touches && e.touches[0]
            if (!first) return
            // If user swipes up significantly, hide controls
            if (first.clientY < 48) {
              setControlsVisible(false)
            }
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          style={{ touchAction: 'pan-y' }}
          {...swipeProps}
        >
          {/* Transition overlay for page turns */}
          {isTransitioning && transitionDirection && (
            <div className="pointer-events-none absolute inset-0 z-40">
              <div
                className={`h-full w-full bg-gradient-to-r from-transparent via-black/10 to-transparent animate-[slide_180ms_ease-out] ${transitionDirection === 'prev' ? 'direction-reverse' : ''}`}
                style={{
                  // Fallback transform-based animation when keyframes are not available
                  willChange: 'transform, opacity',
                }}
              />
              <style jsx>{`
                @keyframes slide {
                  from { transform: translateX(-100%); opacity: 0.9; }
                  to { transform: translateX(100%); opacity: 0.6; }
                }
                .direction-reverse { animation-direction: reverse; }
              `}</style>
            </div>
          )}

          <ReactReaderLazy
            url={absoluteUrl}
            location={location}
            locationChanged={locationChanged}
            tocChanged={tocChanged}
            getRendition={getRendition}
            showToc={false}
            readerStyles={{
              ...baseReaderStyles,
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
              // Needed to avoid blocked script execution inside sandboxed iframe created by epub.js
              // Only enable for trusted EPUB sources
              allowScriptedContent: true,
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

      {!error && controlsVisible && (
        <div
          className="absolute left-0 right-0 bottom-0 z-40 px-4 pb-3"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
        >
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0"
            style={{ height: 'calc(env(safe-area-inset-bottom, 0px) + 88px)' }}
          >
            <div className="w-full h-full bg-gradient-to-t from-black/40 via-black/20 to-transparent backdrop-blur-[2px]" />
          </div>
          <div className="mx-auto max-w-3xl relative z-10">
            <div className="relative h-8 select-none">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-muted" />
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-primary transition-[width] duration-200 ease-out"
                style={{ width: `${Math.max(0, Math.min(100, isScrubbing && scrubPct != null ? scrubPct : progress.book))}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 rounded-full bg-white ring-2 ring-primary shadow"
                style={{ left: `${Math.max(0, Math.min(100, isScrubbing && scrubPct != null ? scrubPct : progress.book))}%` }}
                aria-hidden="true"
              />
              {totalLocations > 0 && (
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={progress.book}
                  onInput={(e) => {
                    try {
                      const raw = Number((e.target as HTMLInputElement).value)
                      const clamped = Math.max(0, Math.min(100, raw))
                      setIsScrubbing(true)
                      setScrubPct(clamped)
                      const now = Date.now()
                      if (now - lastScrubRef.current > SCRUB_THROTTLE_MS) {
                        lastScrubRef.current = now
                        const pct = clamped / 100
                        const r = renditionRef.current
                        const book = r?.book
                        const cfi = book?.locations?.cfiFromPercentage?.(pct)
                        const displayFn = renditionRef.current && renditionRef.current.display
                        if (cfi && displayFn) {
                          displayFn(cfi)
                        }
                      }
                    } catch (err) {
                      console.warn('Failed to scrub to percentage:', err)
                    }
                  }}
                  onMouseDown={() => setIsScrubbing(true)}
                  onTouchStart={() => setIsScrubbing(true)}
                  onMouseUp={(e) => {
                    try {
                      const raw = Number((e.target as HTMLInputElement).value)
                      const clamped = Math.max(0, Math.min(100, raw))
                      const pct = clamped / 100
                      const r = renditionRef.current
                      const book = r?.book
                      const cfi = book?.locations?.cfiFromPercentage?.(pct)
                      const displayFn = renditionRef.current && renditionRef.current.display
                      if (cfi && displayFn) {
                        displayFn(cfi)
                      }
                    } catch {}
                    setIsScrubbing(false)
                    setScrubPct(null)
                  }}
                  onTouchEnd={(e) => {
                    try {
                      const raw = Number((e.target as HTMLInputElement).value)
                      const clamped = Math.max(0, Math.min(100, raw))
                      const pct = clamped / 100
                      const r = renditionRef.current
                      const book = r?.book
                      const cfi = book?.locations?.cfiFromPercentage?.(pct)
                      const displayFn = renditionRef.current && renditionRef.current.display
                      if (cfi && displayFn) {
                        displayFn(cfi)
                      }
                    } catch {}
                    setIsScrubbing(false)
                    setScrubPct(null)
                  }}
                  aria-label="Scrub reading position"
                  className="absolute inset-0 w-full h-8 opacity-0 cursor-pointer"
                />
              )}
            </div>
            <div className="mt-2 flex items-center justify-center gap-3 text-[11px] text-muted-foreground">
              <div>Page: {Math.max(0, Math.min(100, Math.round(progress.chapter)))}%</div>
              <span>•</span>
              <div>Book: {Math.max(0, Math.min(100, Math.round(progress.book)))}%</div>
              <span>•</span>
              <div>~{progress.timeLeft} min left</div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile floating action button and bottom sheet */}
      <MobileControlsLazy
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
                    if (process.env.NODE_ENV === 'development') {
                      console.log('Chapter button clicked:', chapter)
                    }
                    goToChapter(chapter.href)
                  }}
                >
                  <div className="font-medium">{chapter.label}</div>
                  {((chapter.subitems?.length) || 0) > 0 ? (
                    <div className="text-xs text-muted-foreground mt-1">
                      {chapter.subitems?.length || 0} sections
                    </div>
                  ): null}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 