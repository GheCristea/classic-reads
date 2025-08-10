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

  return (
    <>
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

      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}>
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


