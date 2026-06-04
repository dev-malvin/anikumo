'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import Navbar from '@/components/Navbar'
import AnimeCard from '@/components/AnimeCard'
import { animeApi, type Anime } from '@/lib/api'

const GENRES = ['Action','Adventure','Comedy','Drama','Ecchi','Fantasy','Horror','Mahou Shoujo','Mecha','Music','Mystery','Psychological','Romance','Sci-Fi','Slice of Life','Sports','Supernatural','Thriller']
const FORMATS = ['TV','TV_SHORT','MOVIE','SPECIAL','OVA','ONA','MUSIC']
const SEASONS = ['WINTER','SPRING','SUMMER','FALL']
const STATUSES = ['RELEASING','FINISHED','NOT_YET_RELEASED','CANCELLED']
const SORTS = [
  { label: 'Trending', value: 'TRENDING_DESC' },
  { label: 'Popularity', value: 'POPULARITY_DESC' },
  { label: 'Score', value: 'SCORE_DESC' },
  { label: 'Start Date', value: 'START_DATE_DESC' },
  { label: 'Updated', value: 'UPDATED_AT_DESC' },
]
const YEARS = Array.from({ length: 30 }, (_, i) => String(new Date().getFullYear() - i))

function BrowseContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [results, setResults] = useState<Anime[]>([])
  const [loading, setLoading] = useState(false)
  const [hasNext, setHasNext] = useState(false)
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [genre, setGenre] = useState(searchParams.get('genre') || '')
  const [format, setFormat] = useState(searchParams.get('format') || '')
  const [season, setSeason] = useState(searchParams.get('season') || '')
  const [year, setYear] = useState(searchParams.get('year') || '')
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || 'TRENDING_DESC')

  const fetch = useCallback(async (pg = 1, replace = true) => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(pg), sort }
      if (query) params.q = query
      if (genre) params.genre = genre
      if (format) params.format = format
      if (season) params.season = season
      if (year) params.year = year
      if (status) params.status = status

      let data: { results: Anime[]; hasNextPage: boolean }
      if (query) {
        data = await animeApi.search(query, pg)
      } else {
        data = await animeApi.filter(params)
      }
      setResults(replace ? data.results : (prev) => [...prev, ...data.results])
      setHasNext(data.hasNextPage)
      setPage(pg)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [query, genre, format, season, year, status, sort])

  useEffect(() => { fetch(1) }, [fetch])

  const reset = () => {
    setQuery(''); setGenre(''); setFormat('')
    setSeason(''); setYear(''); setStatus('')
    setSort('TRENDING_DESC')
  }

  const activeFilters = [genre, format, season, year, status].filter(Boolean).length

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-24 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetch(1)}
              placeholder="Search anime..."
              className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-purple transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${showFilters || activeFilters > 0 ? 'bg-purple border-purple text-white' : 'border-border text-muted-foreground hover:text-white hover:border-white/20'}`}
          >
            <SlidersHorizontal size={16} />
            Filters {activeFilters > 0 && `(${activeFilters})`}
          </button>
          {activeFilters > 0 && (
            <button onClick={reset} className="flex items-center gap-1 px-4 py-3 rounded-xl border border-border text-sm text-muted-foreground hover:text-white transition-colors">
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="glass rounded-2xl p-4 mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Sort', value: sort, set: setSort, opts: SORTS.map(s => ({ label: s.label, value: s.value })) },
              { label: 'Genre', value: genre, set: setGenre, opts: GENRES.map(g => ({ label: g, value: g })) },
              { label: 'Format', value: format, set: setFormat, opts: FORMATS.map(f => ({ label: f, value: f })) },
              { label: 'Season', value: season, set: setSeason, opts: SEASONS.map(s => ({ label: s[0] + s.slice(1).toLowerCase(), value: s })) },
              { label: 'Year', value: year, set: setYear, opts: YEARS.map(y => ({ label: y, value: y })) },
              { label: 'Status', value: status, set: setStatus, opts: STATUSES.map(s => ({ label: s.replace(/_/g,' '), value: s })) },
            ].map(({ label, value, set, opts }) => (
              <div key={label} className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">{label}</label>
                <select
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  className="bg-surface-raised border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-purple"
                >
                  <option value="">Any</option>
                  {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* Grid */}
        {loading && results.length === 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="skeleton aspect-[2/3] rounded-xl" />
                <div className="skeleton h-3 w-3/4 rounded" />
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
            <Search size={48} className="mb-4 opacity-30" />
            <p className="text-lg">No results found</p>
            <p className="text-sm mt-1">Try different search terms or filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3">
              {results.map((a) => (
                <AnimeCard key={a.id} anime={a} />
              ))}
            </div>
            {hasNext && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => fetch(page + 1, false)}
                  disabled={loading}
                  className="px-8 py-3 rounded-xl bg-surface border border-border text-sm font-medium text-foreground hover:border-purple hover:text-white transition-colors disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

export default function BrowsePage() {
  return (
    <Suspense>
      <BrowseContent />
    </Suspense>
  )
}
