'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronDown, BookOpen } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { mangaApi, type MangaInfo, type Chapter } from '@/lib/api'

export default function MangaInfoPage() {
  const { source, id } = useParams<{ source: string; id: string }>()
  const [manga, setManga] = useState<MangaInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandDesc, setExpandDesc] = useState(false)
  const [readingChapter, setReadingChapter] = useState<Chapter | null>(null)
  const [pages, setPages] = useState<string[]>([])
  const [loadingPages, setLoadingPages] = useState(false)

  useEffect(() => {
    mangaApi.info(source, decodeURIComponent(id)).then(setManga).catch(() => {}).finally(() => setLoading(false))
  }, [source, id])

  const openChapter = async (chapter: Chapter) => {
    setReadingChapter(chapter)
    setLoadingPages(true)
    setPages([])
    try {
      const data = await mangaApi.pages(source, chapter.id)
      setPages(Array.isArray(data) ? data : [])
    } catch { setPages([]) }
    finally { setLoadingPages(false) }
  }

  if (loading) return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-24 pb-16">
        <div className="flex gap-8">
          <div className="skeleton w-48 aspect-[2/3] rounded-2xl shrink-0" />
          <div className="flex-1 flex flex-col gap-4 pt-4">
            <div className="skeleton h-8 w-64 rounded" />
            <div className="skeleton h-4 w-40 rounded" />
            <div className="skeleton h-24 w-full rounded" />
          </div>
        </div>
      </div>
    </main>
  )

  if (!manga) return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <Navbar />
      <p className="text-muted-foreground">Manga not found.</p>
    </main>
  )

  if (readingChapter) return (
    <main className="min-h-screen bg-black">
      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={() => { setReadingChapter(null); setPages([]) }}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors">
          <ChevronLeft size={16} /> Back to chapters
        </button>
        <span className="text-sm text-white font-medium">{manga.title} — {readingChapter.title || `Chapter ${readingChapter.number}`}</span>
      </div>

      <div className="max-w-3xl mx-auto px-2 py-6 flex flex-col gap-1">
        {loadingPages
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton w-full aspect-[3/4] rounded" />)
          : pages.map((src, i) => (
              <img key={i} src={src} alt={`Page ${i + 1}`} className="w-full" loading="lazy" crossOrigin="anonymous" />
            ))
        }
      </div>
    </main>
  )

  const chapters = manga.chapters || []

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-24 pb-16">
        {/* Back */}
        <Link href="/manga" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white mb-6 transition-colors">
          <ChevronLeft size={16} /> All Manga
        </Link>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover */}
          <div className="shrink-0">
            {manga.cover ? (
              <img src={manga.cover} alt={manga.title} className="w-48 aspect-[2/3] rounded-2xl object-cover ring-2 ring-white/10 shadow-2xl" />
            ) : (
              <div className="w-48 aspect-[2/3] rounded-2xl bg-surface-raised flex items-center justify-center">
                <BookOpen size={48} className="text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="font-display text-4xl md:text-5xl text-white mb-2">{manga.title}</h1>
            {manga.author && <p className="text-muted-foreground text-sm mb-4">by {manga.author}</p>}

            {manga.genres && manga.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {manga.genres.map(g => (
                  <span key={g} className="px-3 py-1 rounded-full border border-border text-xs text-muted-foreground">{g}</span>
                ))}
              </div>
            )}

            {manga.description && (
              <div className="mb-6">
                <p className={`text-sm text-foreground leading-relaxed ${expandDesc ? '' : 'line-clamp-4'}`}>
                  {manga.description}
                </p>
                {manga.description.length > 200 && (
                  <button onClick={() => setExpandDesc(!expandDesc)}
                    className="flex items-center gap-1 text-xs text-purple mt-2 hover:text-purple/80 transition-colors">
                    {expandDesc ? 'Show less' : 'Read more'} <ChevronDown size={12} className={expandDesc ? 'rotate-180' : ''} />
                  </button>
                )}
              </div>
            )}

            {/* Start reading */}
            {chapters.length > 0 && (
              <button onClick={() => openChapter(chapters[chapters.length - 1])}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple hover:bg-purple/80 text-white font-semibold text-sm transition-colors mb-6">
                <BookOpen size={16} /> Start Reading
              </button>
            )}
          </div>
        </div>

        {/* Chapter list */}
        {chapters.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-2xl text-white mb-4">{chapters.length} Chapters</h2>
            <div className="bg-surface rounded-2xl overflow-hidden max-h-[500px] overflow-y-auto">
              <div className="flex flex-col gap-0.5 p-2">
                {chapters.map((ch) => (
                  <button key={ch.id} onClick={() => openChapter(ch)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left hover:bg-white/5 transition-colors group">
                    <div>
                      <p className="text-sm text-foreground group-hover:text-white transition-colors">
                        {ch.title || `Chapter ${ch.number}`}
                      </p>
                      {ch.date && <p className="text-xs text-muted-foreground mt-0.5">{ch.date}</p>}
                    </div>
                    <span className="text-xs text-muted-foreground group-hover:text-purple transition-colors">Read →</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
