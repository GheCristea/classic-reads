"use client"

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import React from 'react'

export type MobileControlsProps = {
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

export function MobileControls(props: MobileControlsProps) {
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
  const panelRef = React.useRef<HTMLDivElement | null>(null)
  const [dragY, setDragY] = React.useState(0)
  const [isDragging, setIsDragging] = React.useState(false)
  const startYRef = React.useRef<number | null>(null)
  const [isFabVisible, setIsFabVisible] = React.useState(true)
  const hideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }
  }

  const scheduleHide = React.useCallback(() => {
    clearHideTimer()
    hideTimerRef.current = setTimeout(() => {
      setIsFabVisible(false)
    }, 2500)
  }, [])

  const registerActivity = React.useCallback(() => {
    if (isMenuOpen) return
    setIsFabVisible(true)
    scheduleHide()
  }, [isMenuOpen, scheduleHide])

  React.useEffect(() => {
    // Auto-hide lifecycle
    if (isMenuOpen) {
      setIsFabVisible(false)
      clearHideTimer()
      return
    }
    setIsFabVisible(true)
    scheduleHide()
    return clearHideTimer
  }, [isMenuOpen, scheduleHide])

  React.useEffect(() => {
    // Global activity listeners to reshow FAB
    const handler = () => registerActivity()
    document.addEventListener('pointerdown', handler, { passive: true })
    document.addEventListener('touchstart', handler, { passive: true })
    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('pointerdown', handler)
      document.removeEventListener('touchstart', handler)
      document.removeEventListener('keydown', handler)
    }
  }, [registerActivity])

  const handleDragStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    startYRef.current = e.touches[0].clientY
    setIsDragging(true)
  }

  const handleDragMove = (e: React.TouchEvent) => {
    if (!isDragging || startYRef.current === null) return
    const currentY = e.touches[0].clientY
    const delta = currentY - startYRef.current
    setDragY(delta > 0 ? delta : 0)
  }

  const handleDragEnd = () => {
    if (!isDragging) return
    const shouldClose = dragY > 80
    setIsDragging(false)
    setDragY(0)
    startYRef.current = null
    if (shouldClose) setIsMenuOpen(false)
  }

  return (
    <>
      {!isMenuOpen && (
        <button
          className="md:hidden fixed bottom-16 right-5 z-50 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg focus:outline-none"
          aria-label="Reader menu"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsMenuOpen((v) => !v)
          }}
          style={{
            minWidth: 44,
            minHeight: 44,
            opacity: isFabVisible ? 1 : 0,
            transform: `translateY(${isFabVisible ? 0 : 10}px) scale(${isFabVisible ? 1 : 0.98})`,
            transition: 'opacity 250ms ease, transform 250ms ease',
            pointerEvents: isFabVisible ? 'auto' : 'none',
          }}
        >
          ☰
        </button>
      )}

      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}>
          <div
            className="absolute inset-0 bg-black/40"
            style={{
              opacity: isDragging ? Math.max(0, 1 - dragY / 200) : 1,
              transition: isDragging ? 'none' : 'opacity 200ms ease',
            }}
          />
          <div
            ref={panelRef}
            className="absolute left-0 right-0 bottom-0 bg-background rounded-t-xl shadow-xl p-4 space-y-3"
            style={{
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
              transform: `translateY(${dragY}px)`,
              transition: isDragging ? 'none' : 'transform 200ms ease',
              touchAction: 'pan-y',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="mx-auto h-1 w-10 bg-muted rounded"
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
              onTouchCancel={handleDragEnd}
              style={{ touchAction: 'none' }}
            />
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
                <Button variant="outline" className="h-11 w-11" onClick={() => setFontSizePct(fontSizePct - 10)}>
                  A-
                </Button>
                <span className="text-xs w-10 text-center">{fontSizePct}%</span>
                <Button variant="outline" className="h-11 w-11" onClick={() => setFontSizePct(fontSizePct + 10)}>
                  A+
                </Button>
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

export default MobileControls


