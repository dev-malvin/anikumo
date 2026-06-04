'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, BookOpen } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { mangaApi, type Manga } from '@/lib/api'

function MangaCard({ manga }: { manga: Manga }) {
  return (
    <Link
      href={`/manga/${manga.source || 'atsumaru'}/${encodeURIComponent(manga.id)}`}
      className="group flex flex-col shrink-0 rounded-xl overflow-hidden bg-surface hover:ring-2 hover:ring-purple/60 transition-all duration-200 w-36 md:w-40"
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        {manga.cover ? (
          <img src={manga.cover} alt={manga.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-surface-raised flex items-center justify-center">
            <BookOpen size={32} className="text-muted-foreground" />
          </div>
        )}
        {manga.status && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-medium">
            {manga.status}
          </div>
        )}
      </div>
      <div className="p-2">
        <p className="text-xs font-medium text-foreground line-clamp-2 leading-relaxed">{manga.title}</p>
        {manga.latestChapter && <p className="text-[10px] text-muted-foreground mt-1">{manga.latestChapter}</p>}
      </div>
    </Link>
  )
}

function MangaRow({ title, items, loading }: { title: string; items: Manga[]; loading: boolean }) {
  return (
    <section className="py-2">
      <h2 className="font-display text-2xl text-white mb-4">{title}</h2>
      <div className="scroll-row">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="shrink-0 w-40 flex flex-col gap-2">
                <div className="skeleton aspect-[2/3] rounded-xl" />
                <div className="skeleton h-3 w-3/4 rounded" />
              </div>
            ))
          : items.map((m) => <MangaCard key={`${m.source}-${m.id}`} manga={m} />)
        }
      </div>
    </section>
  )
}

export default function MangaPage() {
  const [home, setHome] = useState<{ popular?: Manga[]; latest?: Manga[]; trending?: Manga[] }>({})
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Manga[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    mangaApi.home().then(setHome).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    try {
      const data = await mangaApi.search(query)
      setResults(data.results || [])
    } catch { setResults([]) }
    finally { setSearching(false) }
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-24 pb-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-5xl text-white mb-2">Manga</h1>
          <p className="text-muted-foreground text-sm">Read manga online for free</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="relative max-w-lg mb-10">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search manga..."
            className="w-full bg-surface border border-border rounded-xl pl-10 pr-28 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-purple transition-colors"
          />
          <button type="submit" disabled={searching}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg bg-purple text-white text-xs font-medium disabled:opacity-50 transition-opacity">
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Search results */}
        {results.length > 0 && (
          <section className="mb-10">
            <h2 className="font-display text-2xl text-white mb-4">Search Results</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3">
              {results.map(m => <MangaCard key={`${m.source}-${m.id}`} manga={m} />)}
            </div>
          </section>
        )}

        {/* Home rows */}
        <div className="space-y-10">
          <MangaRow title="Trending" items={home.trending || []} loading={loading} />
          <MangaRow title="Popular" items={home.popular || []} loading={loading} />
          <MangaRow title="Latest Updates" items={home.latest || []} loading={loading} />
        </div>
      </div>
    </main>
  )
}
