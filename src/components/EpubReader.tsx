"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { NavItem, Rendition } from 'epubjs'
import { ChevronLeft, ChevronRight, Menu, X } from 'lucide-react'
import React, { useCallback, useRef, useState } from 'react'
import { IReactReaderStyle, ReactReader } from 'react-reader'

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
  const renditionRef = useRef<Rendition>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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

  // Navigation functions with debugging
  const goToNextPage = useCallback(() => {
    console.log('Next button clicked, rendition:', renditionRef.current)
    if (renditionRef.current && renditionRef.current.next) {
      try {
        renditionRef.current.next()
      } catch (error) {
        console.error('Error going to next page:', error)
      }
    } else {
      console.warn('No rendition available for next page')
    }
  }, [])

  const goToPreviousPage = useCallback(() => {
    console.log('Previous button clicked, rendition:', renditionRef.current)
    if (renditionRef.current && renditionRef.current.prev) {
      try {
        renditionRef.current.prev()
      } catch (error) {
        console.error('Error going to previous page:', error)
      }
    } else {
      console.warn('No rendition available for previous page')
    }
  }, [])

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

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4 border-b">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Button variant="ghost" size="icon" onClick={onClose}>
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
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="absolute top-1/2 left-4 transform -translate-y-1/2 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            goToPreviousPage()
          }}
          className="bg-white/90 hover:bg-white shadow-lg"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            goToNextPage()
          }}
          className="bg-white/90 hover:bg-white shadow-lg"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

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
          ref={containerRef}
          className="flex-1 relative bg-white min-h-[300px]"
          data-react-reader-container
        >
          <ReactReader
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
            </div>
          )}
        </div>
      )}

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