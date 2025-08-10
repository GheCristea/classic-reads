"use client"

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getSuggestions, type SuggestionItem } from '@/lib/suggestions'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'

interface SearchFieldProps {
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  showButton?: boolean
  className?: string
  inputClassName?: string
  defaultQuery?: string
  autoFocus?: boolean
  buildHref?: (query: string) => string
  onSearchSubmit?: () => void
  fetchSuggestions?: (query: string, limit: number) => Promise<SuggestionItem[]>
}

export function SearchField({
  placeholder = 'Search books, authors...',
  size = 'md',
  showButton = true,
  className,
  inputClassName,
  defaultQuery = '',
  autoFocus = false,
  buildHref,
  onSearchSubmit,
  fetchSuggestions,
}: SearchFieldProps) {
  const [query, setQuery] = React.useState(defaultQuery)
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [items, setItems] = React.useState<SuggestionItem[]>([])
  const [activeIndex, setActiveIndex] = React.useState(-1)
  const router = useRouter()
  const containerRef = React.useRef<HTMLDivElement | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    const href = buildHref ? buildHref(trimmed) : `/books?search=${encodeURIComponent(trimmed)}`
    router.push(href)
    onSearchSubmit?.()
    setOpen(false)
    setActiveIndex(-1)
  }

  const heightClass = size === 'lg' ? 'h-12 text-lg' : size === 'sm' ? 'h-9 text-sm' : 'h-10'
  const buttonSize = size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'default'

  // Debounced suggestions
  const debouncedFetch = React.useMemo(() => {
    let handle: number | null = null
    return (q: string) => {
      if (handle) window.clearTimeout(handle)
      handle = window.setTimeout(async () => {
        const trimmed = q.trim()
        if (!trimmed) {
          setItems([])
          setOpen(false)
          setLoading(false)
          return
        }
        try {
          setLoading(true)
          const data = await (fetchSuggestions ? fetchSuggestions(trimmed, 8) : getSuggestions(trimmed, 8))
          setItems(data)
          setOpen(data.length > 0)
          setActiveIndex(-1)
        } finally {
          setLoading(false)
        }
      }, 200)
    }
  }, [fetchSuggestions])

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleDocumentMouseDown(event: MouseEvent) {
      const target = event.target as Node | null
      if (containerRef.current && target && !containerRef.current.contains(target)) {
        setOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleDocumentMouseDown)
    return () => document.removeEventListener('mousedown', handleDocumentMouseDown)
  }, [])

  return (
    <form onSubmit={handleSubmit} className={cn('w-full', className)}>
      <div ref={containerRef} className="flex gap-2">
        <div className="relative flex-1">
          <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground', size === 'lg' ? 'h-5 w-5' : '')} />
          <Input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              const value = e.target.value
              setQuery(value)
              debouncedFetch(value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit(e as unknown as React.FormEvent)
              } else if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActiveIndex((i) => Math.min(i + 1, items.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActiveIndex((i) => Math.max(i - 1, -1))
              } else if (e.key === 'Escape') {
                setOpen(false)
                setActiveIndex(-1)
              }
            }}
            className={cn('pl-10', heightClass, inputClassName)}
            autoFocus={autoFocus}
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls="search-suggestions"
          />
          {open && (
            <div
              id="search-suggestions"
              role="listbox"
              className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md"
            >
              {loading && (
                <div className="px-3 py-2 text-sm text-muted-foreground">Loading…</div>
              )}
              {!loading && items.map((item, idx) => (
                <button
                  key={`${item.id}-${idx}`}
                  role="option"
                  aria-selected={idx === activeIndex}
                  className={cn(
                    'w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground',
                    idx === activeIndex ? 'bg-accent text-accent-foreground' : ''
                  )}
                  onMouseDown={(e) => {
                    // use mousedown so we don't blur before click
                    e.preventDefault()
                    const q = item.title
                    setQuery(q)
                    const href = buildHref ? buildHref(q) : `/books?search=${encodeURIComponent(q)}`
                    router.push(href)
                    onSearchSubmit?.()
                    setOpen(false)
                  }}
                >
                  <div className="text-sm font-medium line-clamp-1">{item.title}</div>
                  {item.subtitle && (
                    <div className="text-xs text-muted-foreground line-clamp-1">{item.subtitle}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        {showButton && (
          <Button type="submit" size={buttonSize} className={heightClass.replace('text-lg', '')}>
            Search
          </Button>
        )}
      </div>
    </form>
  )
}


