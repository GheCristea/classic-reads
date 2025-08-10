"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { AuthorMetadata } from "@/lib/wikipedia"
import { MouseEvent, useState } from "react"

type AuthorCardProps = {
  name: string
  portrait: string
  meta?: AuthorMetadata | null
  topTitles?: string[]
}

export function AuthorCard({ name, portrait, meta, topTitles = [] }: AuthorCardProps) {
  const [open, setOpen] = useState(false)

  const toggleOpen = () => setOpen((v) => !v)
  const stop = (e: MouseEvent) => e.stopPropagation()

  return (
    <Card
      className="group overflow-hidden hover:shadow-md transition-shadow cursor-pointer md:flex"
      onClick={toggleOpen}
      onMouseLeave={() => setOpen(false)}
      role="button"
      aria-pressed={open}
    >
      {/* Left: Image section */}
      <div className="relative w-full h-72 bg-muted overflow-hidden md:w-1/2 md:h-72">
        <img
          src={portrait}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 origin-top group-hover:scale-105"
          loading="lazy"
        />

        {/* Always-visible vertical name bar (left) */}
        <div className="absolute inset-y-0 left-0 w-12 md:w-14 z-20 bg-black/60 backdrop-blur-sm">
          <div className="h-full w-full flex items-center justify-center px-1">
            <span className="text-white font-semibold text-sm md:text-base tracking-wide [writing-mode:vertical-rl] [text-orientation:upright] drop-shadow">
              {name}
            </span>
          </div>
        </div>

        {/* Gradient overlay to darken on hover/open (mobile only) */}
        <div
          className={
            "absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-black/30 to-transparent transition-opacity duration-300 md:hidden " +
            (open ? "opacity-100" : "opacity-0 group-hover:opacity-100")
          }
        />

        {/* Details + CTA overlay (mobile) */}
        <div
          className={
            "absolute inset-0 z-30 p-4 pl-14 flex flex-col justify-end transition-opacity duration-300 md:hidden " +
            (open ? "opacity-100" : "opacity-0 group-hover:opacity-100")
          }
        >
          <div className="mt-auto" />
          <div className="rounded-lg bg-black/55 backdrop-blur-sm p-3 text-white" onClick={stop}>
            <div className="text-sm/6">
              {meta?.birthYear || meta?.deathYear ? (
                <div>{(meta?.birthYear ?? "?")}{meta?.deathYear ? `–${meta?.deathYear}` : "–"}</div>
              ) : null}
              {meta?.nationality ? (
                <div className="text-white/90">{meta.nationality}</div>
              ) : null}
            </div>
            <div className="mt-2">
              <Button asChild size="sm" variant="secondary" className="shadow" onClick={stop}>
                <a href={`/search?q=${encodeURIComponent(name)}`} aria-label={`View books by ${name}`}>View books</a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Info panel (desktop and up) */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-between p-4 gap-3">
        <div>
          <h3 className="text-lg font-semibold">{name}</h3>
          <div className="mt-1 text-sm text-muted-foreground">
            {meta?.birthYear || meta?.deathYear ? (
              <span>{(meta?.birthYear ?? "?")}{meta?.deathYear ? `–${meta?.deathYear}` : "–"}</span>
            ) : null}
            {meta?.nationality ? (
              <span className={meta?.birthYear || meta?.deathYear ? "before:content-['•'] before:mx-2" : ""}>{meta.nationality}</span>
            ) : null}
          </div>
        </div>

        {topTitles.length > 0 ? (
          <div>
            <div className="text-sm font-medium">Notable works</div>
            <ul className="mt-1 space-y-1 text-sm list-disc list-inside">
              {topTitles.slice(0, 3).map((t) => (
                <li key={t} className="truncate" title={t}>{t}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <Button asChild size="sm" className="shadow self-start">
            <a href={`/search?q=${encodeURIComponent(name)}`} aria-label={`View books by ${name}`}>View books</a>
          </Button>
        </div>
      </div>
    </Card>
  )
}


