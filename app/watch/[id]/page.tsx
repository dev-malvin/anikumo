'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Settings, AlertCircle } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { animeApi, streamApi, titleOf, type AnimeInfo, type Episode, type WatchData } from '@/lib/api'

const PROVIDERS = ['gogoanime', 'zoro', 'animepahu', 'allmanga', 'reanime']

function VideoPlayer({ src, tracks }: { src: string; tracks?: WatchData['tracks'] }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!src) return
    const video = videoRef.current
    if (!video) return

    if (src.includes('.m3u8')) {
      import('hls.js').then(({ default: Hls }) => {
        if (Hls.isSupported()) {
          const hls = new Hls({ maxBufferLength: 30 })
          hls.loadSource(src)
          hls.attachMedia(video)
          return () => hls.destroy()
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = src
        }
      })
    } else {
      video.src = src
    }
  }, [src])

  return (
    <video
      ref={videoRef}
      controls
      autoPlay
      crossOrigin="anonymous"
      className="w-full aspect-video bg-black"
      playsInline
    >
      {tracks?.map((t, i) => (
        <track key={i} kind={(t.kind as any) || 'subtitles'} src={t.url} label={t.label || t.lang || 'Sub'} default={t.default} />
      ))}
    </video>
  )
}

function WatchContent() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()

  const [anime, setAnime] = useState<AnimeInfo | null>(null)
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [currentEp, setCurrentEp] = useState(Number(searchParams.get('ep') || 1))
  const [type, setType] = useState<'sub' | 'dub'>('sub')
  const [provider, setProvider] = useState(PROVIDERS[0])
  const [watchData, setWatchData] = useState<WatchData | null>(null)
  const [loadingStream, setLoadingStream] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [providerIdx, setProviderIdx] = useState(0)

  useEffect(() => {
    Promise.all([
      animeApi.info(id).catch(() => null),
      animeApi.episodes(id).catch(() => []),
    ]).then(([info, eps]) => {
      if (info) setAnime(info)
      if (Array.isArray(eps)) setEpisodes(eps)
    })
  }, [id])

  useEffect(() => {
    const load = async (pIdx = 0) => {
      if (pIdx >= PROVIDERS.length) { setError('No stream available. Try another provider.'); setLoadingStream(false); return }
      setLoadingStream(true)
      setError(null)
      try {
        const p = PROVIDERS[pIdx]
        const data = await streamApi.watch(p, id, type, currentEp)
        if (!data?.sources?.length) throw new Error('No sources')
        setWatchData(data)
        setProvider(p)
        setProviderIdx(pIdx)
      } catch {
        load(pIdx + 1)
      } finally {
        setLoadingStream(false)
      }
    }
    load(0)
  }, [id, currentEp, type])

  const title = anime ? titleOf(anime) : 'Loading...'
  const ep = episodes.find(e => e.number === currentEp)
  const src = watchData?.sources?.[0]?.url || ''

  const goEp = (n: number) => {
    if (n < 1 || n > episodes.length) return
    setCurrentEp(n)
    window.history.replaceState(null, '', `/watch/${id}?ep=${n}`)
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-20 pb-16">
        <div className="flex flex-col xl:flex-row gap-6">

          {/* Player column */}
          <div className="flex-1 min-w-0">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 flex-wrap">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link href={`/anime/${id}`} className="hover:text-white transition-colors">{title}</Link>
              <span>/</span>
              <span className="text-foreground">Episode {currentEp}</span>
            </div>

            {/* Video */}
            <div className="rounded-2xl overflow-hidden bg-black relative">
              {loadingStream ? (
                <div className="aspect-video flex items-center justify-center bg-surface">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <div className="w-8 h-8 border-2 border-purple border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm">Loading stream...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="aspect-video flex items-center justify-center bg-surface">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground text-center px-4">
                    <AlertCircle size={40} className="text-red-400" />
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              ) : src ? (
                <VideoPlayer src={src} tracks={watchData?.tracks} />
              ) : (
                <div className="aspect-video bg-surface" />
              )}
            </div>

            {/* Episode controls */}
            <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
              <div>
                <h1 className="text-white font-semibold">{title}</h1>
                <p className="text-muted-foreground text-sm">
                  Episode {currentEp}{ep?.title ? ` — ${ep.title}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => goEp(currentEp - 1)} disabled={currentEp <= 1}
                  className="p-2 rounded-lg border border-border text-muted-foreground hover:text-white hover:border-white/20 disabled:opacity-30 transition-colors">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={() => goEp(currentEp + 1)} disabled={currentEp >= episodes.length}
                  className="p-2 rounded-lg border border-border text-muted-foreground hover:text-white hover:border-white/20 disabled:opacity-30 transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Sub/Dub + Provider */}
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              {/* Sub / Dub toggle */}
              <div className="flex rounded-lg overflow-hidden border border-border">
                {(['sub', 'dub'] as const).map(t => (
                  <button key={t} onClick={() => setType(t)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${type === t ? 'bg-purple text-white' : 'text-muted-foreground hover:text-white'}`}>
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Provider picker */}
              <div className="flex items-center gap-2 flex-wrap">
                <Settings size={14} className="text-muted-foreground" />
                {PROVIDERS.map((p, i) => (
                  <button key={p} onClick={() => { setProviderIdx(i); setProvider(p) }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${provider === p ? 'bg-purple/20 border-purple text-purple' : 'border-border text-muted-foreground hover:text-white hover:border-white/20'}`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Episode list */}
          <div className="xl:w-80 shrink-0">
            <h2 className="font-display text-xl text-white mb-3">Episodes</h2>
            <div className="bg-surface rounded-2xl overflow-hidden max-h-[600px] overflow-y-auto">
              {episodes.length === 0 ? (
                <div className="flex flex-col gap-1.5 p-2">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="skeleton h-10 rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-0.5 p-2">
                  {episodes.map((ep) => (
                    <button key={ep.number} onClick={() => goEp(ep.number)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${currentEp === ep.number ? 'bg-purple text-white' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}`}>
                      <span className="text-xs font-semibold w-8 shrink-0">EP {ep.number}</span>
                      <span className="text-xs truncate">{ep.title || `Episode ${ep.number}`}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function WatchPage() {
  return <Suspense><WatchContent /></Suspense>
}
