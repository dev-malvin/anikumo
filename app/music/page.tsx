'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, Search, Music } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { musicApi, type ThemeEntry, type ThemeAnime } from '@/lib/api'

function getAudioUrl(entry: ThemeEntry): string | null {
  const entries = entry.animethemeentries || []
  for (const e of entries) {
    for (const v of e.videos || []) {
      if (v.audio?.link) return v.audio.link
    }
  }
  return null
}

function getCoverUrl(anime?: ThemeAnime): string {
  if (!anime) return ''
  const imgs = anime.images || []
  return imgs.find(i => i.facet === 'Large Cover')?.link
    || imgs.find(i => i.facet === 'Small Cover')?.link
    || imgs[0]?.link || ''
}

function TrackRow({ entry, isPlaying, onPlay }: { entry: ThemeEntry; isPlaying: boolean; onPlay: () => void }) {
  const cover = getCoverUrl(entry.anime)
  const title = entry.song?.title || 'Unknown'
  const artists = entry.song?.artists?.map(a => a.name).join(', ') || ''
  const animeName = entry.anime?.name || ''
  const type = entry.type ? `${entry.type}${entry.sequence || ''}` : ''

  return (
    <button
      onClick={onPlay}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-colors ${isPlaying ? 'bg-purple/20 ring-1 ring-purple/40' : 'hover:bg-white/5'}`}
    >
      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-surface-raised">
        {cover ? <img src={cover} alt={animeName} className="w-full h-full object-cover" loading="lazy" /> : <Music size={20} className="text-muted-foreground absolute inset-0 m-auto" />}
        {isPlaying && (
          <div className="absolute inset-0 bg-purple/60 flex items-center justify-center">
            <Pause size={16} fill="white" className="text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{artists}</p>
        <p className="text-[10px] text-muted-foreground/60 truncate">{animeName} {type && `· ${type}`}</p>
      </div>
      <div className="shrink-0">
        {!isPlaying && <Play size={16} className="text-muted-foreground group-hover:text-white" />}
      </div>
    </button>
  )
}

export default function MusicPage() {
  const [entries, setEntries] = useState<ThemeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [currentIdx, setCurrentIdx] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    musicApi.recent().then(d => setEntries(d.animethemes || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const search = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    try {
      const data = await musicApi.search(query)
      const results: ThemeEntry[] = [
        ...(data.search?.animethemes || []),
        ...(data.search?.anime?.flatMap(a => a.animethemes || []) || []),
      ]
      setEntries(results)
    } catch { setEntries([]) }
    finally { setLoading(false) }
  }

  const play = (idx: number) => {
    if (currentIdx === idx) {
      const audio = audioRef.current
      if (!audio) return
      if (playing) { audio.pause(); setPlaying(false) } else { audio.play(); setPlaying(true) }
      return
    }
    setCurrentIdx(idx)
    setPlaying(true)
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || currentIdx < 0) return
    const src = getAudioUrl(entries[currentIdx])
    if (!src) return
    audio.src = src
    audio.volume = volume
    audio.play().catch(() => {})
  }, [currentIdx, entries])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const currentEntry = currentIdx >= 0 ? entries[currentIdx] : null
  const currentCover = getCoverUrl(currentEntry?.anime)
  const currentTitle = currentEntry?.song?.title || ''
  const currentArtists = currentEntry?.song?.artists?.map(a => a.name).join(', ') || ''

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`

  return (
    <main className="min-h-screen bg-background pb-36">
      <Navbar />

      <audio
        ref={audioRef}
        onTimeUpdate={e => setProgress((e.currentTarget.currentTime / (e.currentTarget.duration || 1)) * 100)}
        onDurationChange={e => setDuration(e.currentTarget.duration)}
        onEnded={() => {
          if (currentIdx < entries.length - 1) play(currentIdx + 1)
          else setPlaying(false)
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-24">
        <div className="mb-8">
          <h1 className="font-display text-5xl text-white mb-2">Anime Music</h1>
          <p className="text-muted-foreground text-sm">OP/ED themes from AnimeThemes</p>
        </div>

        {/* Search */}
        <form onSubmit={search} className="relative max-w-lg mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search anime themes..."
            className="w-full bg-surface border border-border rounded-xl pl-10 pr-28 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-purple transition-colors"
          />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg bg-purple text-white text-xs font-medium">
            Search
          </button>
        </form>

        {/* Track list */}
        <div className="bg-surface rounded-2xl overflow-hidden">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3">
                  <div className="skeleton w-12 h-12 rounded-lg shrink-0" />
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="skeleton h-3 w-1/2 rounded" />
                    <div className="skeleton h-3 w-1/3 rounded" />
                  </div>
                </div>
              ))
            : entries.length === 0
            ? (
              <div className="flex flex-col items-center py-20 text-muted-foreground">
                <Music size={48} className="mb-4 opacity-30" />
                <p>No tracks found</p>
              </div>
            )
            : entries.map((entry, i) => (
                <TrackRow key={entry.id} entry={entry} isPlaying={currentIdx === i && playing} onPlay={() => play(i)} />
              ))
          }
        </div>
      </div>

      {/* Player bar */}
      {currentEntry && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border px-4 py-3">
          {/* Progress bar */}
          <div className="max-w-[1400px] mx-auto">
            <input
              type="range" min={0} max={100} value={progress}
              onChange={e => {
                const audio = audioRef.current
                if (audio) audio.currentTime = (Number(e.target.value) / 100) * duration
              }}
              className="w-full h-1 accent-purple mb-3 cursor-pointer"
            />
            <div className="flex items-center gap-4">
              {/* Track info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-surface-raised">
                  {currentCover && <img src={currentCover} alt={currentTitle} className="w-full h-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{currentTitle}</p>
                  <p className="text-xs text-muted-foreground truncate">{currentArtists}</p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={() => currentIdx > 0 && play(currentIdx - 1)} className="text-muted-foreground hover:text-white transition-colors disabled:opacity-30" disabled={currentIdx <= 0}>
                  <SkipBack size={18} />
                </button>
                <button
                  onClick={() => { const a = audioRef.current; if (!a) return; if (playing) a.pause(); else a.play() }}
                  className="w-10 h-10 rounded-full bg-purple flex items-center justify-center text-white hover:bg-purple/80 transition-colors"
                >
                  {playing ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" className="ml-0.5" />}
                </button>
                <button onClick={() => currentIdx < entries.length - 1 && play(currentIdx + 1)} className="text-muted-foreground hover:text-white transition-colors disabled:opacity-30" disabled={currentIdx >= entries.length - 1}>
                  <SkipForward size={18} />
                </button>
              </div>

              {/* Volume */}
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <Volume2 size={16} className="text-muted-foreground" />
                <input type="range" min={0} max={1} step={0.05} value={volume}
                  onChange={e => setVolume(Number(e.target.value))}
                  className="w-20 h-1 accent-purple cursor-pointer" />
              </div>

              {/* Time */}
              <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <span>{fmtTime((progress / 100) * duration)}</span>
                <span>/</span>
                <span>{fmtTime(duration)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
