'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Play, Info, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { type Anime, titleOf, stripHtml, scoreLabel, formatStatus } from '@/lib/api'

interface SpotlightProps {
  items: Anime[]
}

export default function Spotlight({ items }: SpotlightProps) {
  const [idx, setIdx] = useState(0)
  const [transitioning, setTransitioning] = useState(false)

  const go = useCallback((next: number) => {
    if (transitioning || items.length < 2) return
    setTransitioning(true)
    setTimeout(() => {
      setIdx((next + items.length) % items.length)
      setTransitioning(false)
    }, 300)
  }, [transitioning, items.length])

  useEffect(() => {
    if (items.length < 2) return
    const t = setInterval(() => go(idx + 1), 7000)
    return () => clearInterval(t)
  }, [idx, go, items.length])

  if (!items.length) return null

  const anime = items[idx]
  const title = titleOf(anime)
  const desc = stripHtml(anime.description || '').slice(0, 220)
  const score = scoreLabel(anime.averageScore)
  const status = formatStatus(anime.status)
  const genres = anime.genres?.slice(0, 3) || []
  const id = anime.anilistId || anime.alID || anime.anilist_id || anime.id

  const banner = id
    ? `https://anikuro.to/static/top_banners/${id}.jpg`
    : anime.bannerImage || coverOf(anime)

  function coverOf(a: Anime) {
    return a.poster || a.coverImage?.extraLarge || a.coverImage?.large || ''
  }

  return (
    <div className="relative w-full h-[85vh] min-h-[520px] max-h-[800px] overflow-hidden">
      {/* Background */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${transitioning ? 'opacity-0' : 'opacity-100'}`}
      >
        <img
          src={banner}
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const t = e.currentTarget
            t.src = coverOf(anime)
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/20" />
      </div>

      {/* Content */}
      <div
        className={`relative z-10 h-full flex flex-col justify-end pb-20 px-4 md:px-16 transition-opacity duration-500 ${transitioning ? 'opacity-0' : 'opacity-100'}`}
      >
        {/* Rank + status badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full bg-purple text-white text-xs font-semibold">
            #{idx + 1} Spotlight
          </span>
          {status && (
            <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs">
              {status}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-white leading-none mb-3 text-balance max-w-2xl">
          {title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {score && (
            <span className="flex items-center gap-1 text-yellow-400 text-sm font-semibold">
              <Star size={14} fill="currentColor" /> {score}
            </span>
          )}
          {anime.format && <span className="text-muted-foreground text-sm">{anime.format}</span>}
          {anime.episodes && <span className="text-muted-foreground text-sm">{anime.episodes} Episodes</span>}
          {genres.map((g) => (
            <span key={g} className="px-2 py-0.5 rounded-full bg-white/10 text-white text-xs">
              {g}
            </span>
          ))}
        </div>

        {/* Description */}
        {desc && (
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xl mb-6 line-clamp-3 hidden sm:block">
            {desc}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href={`/anime/${id}`}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple hover:bg-purple/80 text-white font-semibold text-sm transition-colors"
          >
            <Play size={16} fill="white" /> Watch Now
          </Link>
          <Link
            href={`/anime/${id}`}
            className="flex items-center gap-2 px-6 py-3 rounded-xl glass text-white font-semibold text-sm hover:bg-white/10 transition-colors"
          >
            <Info size={16} /> Details
          </Link>
        </div>
      </div>

      {/* Prev / Next */}
      {items.length > 1 && (
        <>
          <button
            onClick={() => go(idx - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full glass flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => go(idx + 1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full glass flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            aria-label="Next"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === idx ? 'bg-purple w-6 h-2' : 'bg-white/30 w-2 h-2 hover:bg-white/60'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
