import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Play, Star, Calendar, Clock, Film, Users, Heart } from 'lucide-react'
import Navbar from '@/components/Navbar'
import SectionRow from '@/components/SectionRow'
import { animeApi, titleOf, coverOf, stripHtml, scoreLabel, formatStatus } from '@/lib/api'

export const revalidate = 3600

interface Props { params: Promise<{ id: string }> }

export default async function AnimePage({ params }: Props) {
  const { id } = await params

  let anime
  try {
    anime = await animeApi.info(id)
  } catch {
    notFound()
  }

  const title = titleOf(anime)
  const cover = coverOf(anime)
  const altTitle = typeof anime.title !== 'string'
    ? (anime.title?.romaji !== title ? anime.title?.romaji : anime.title?.native)
    : undefined
  const desc = stripHtml(anime.description || '')
  const score = scoreLabel(anime.averageScore)
  const status = formatStatus(anime.status)
  const anilistId = anime.anilistId || anime.alID || anime.anilist_id || anime.id
  const banner = anilistId
    ? `https://anikuro.to/static/top_banners/${anilistId}.jpg`
    : anime.bannerImage

  const infoItems = [
    { label: 'Status', value: status },
    { label: 'Format', value: anime.format },
    { label: 'Episodes', value: anime.episodes },
    { label: 'Duration', value: anime.duration ? `${anime.duration} min` : undefined },
    { label: 'Season', value: anime.season && anime.seasonYear ? `${anime.season[0] + anime.season.slice(1).toLowerCase()} ${anime.seasonYear}` : undefined },
    { label: 'Source', value: anime.source },
    { label: 'Popularity', value: anime.popularity?.toLocaleString() },
    { label: 'Favourites', value: anime.favourites?.toLocaleString() },
    { label: 'Studios', value: anime.studios?.map(s => s.name).join(', ') },
  ].filter(i => i.value)

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Banner */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        {banner && (
          <img src={banner} alt={title} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent" />
      </div>

      {/* Main content */}
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 -mt-32 relative z-10 pb-16">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Cover poster */}
          <div className="shrink-0">
            <img
              src={cover}
              alt={title}
              className="w-44 md:w-56 aspect-[2/3] rounded-2xl object-cover shadow-2xl shadow-black/50 ring-2 ring-white/10"
            />
          </div>

          {/* Info */}
          <div className="flex-1 pt-32 md:pt-10">
            {altTitle && <p className="text-muted-foreground text-sm mb-1">{altTitle}</p>}
            <h1 className="font-display text-4xl md:text-5xl text-white mb-3 text-balance">{title}</h1>

            <div className="flex items-center gap-4 flex-wrap mb-4">
              {score && (
                <span className="flex items-center gap-1.5 text-yellow-400 font-semibold">
                  <Star size={16} fill="currentColor" /> {score}
                </span>
              )}
              {status && <span className="px-3 py-1 rounded-full bg-white/10 text-white text-sm">{status}</span>}
              {anime.format && <span className="text-muted-foreground text-sm">{anime.format}</span>}
            </div>

            {/* Genres */}
            {anime.genres && anime.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {anime.genres.map(g => (
                  <Link key={g} href={`/browse?genre=${encodeURIComponent(g)}`}
                    className="px-3 py-1 rounded-full border border-border text-xs text-muted-foreground hover:border-purple hover:text-purple transition-colors">
                    {g}
                  </Link>
                ))}
              </div>
            )}

            {/* CTA buttons */}
            <div className="flex items-center gap-3 flex-wrap mb-6">
              <Link
                href={`/watch/${id}?ep=1`}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-purple hover:bg-purple/80 text-white font-semibold text-sm transition-colors"
              >
                <Play size={16} fill="white" /> Watch Now
              </Link>
              <button className="flex items-center gap-2 px-5 py-3 rounded-xl glass text-white text-sm hover:bg-white/10 transition-colors">
                <Heart size={16} /> Add to List
              </button>
            </div>

            {/* Synopsis */}
            {desc && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Synopsis</h2>
                <p className="text-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            )}

            {/* Info grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
              {infoItems.map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
                  <p className="text-sm text-foreground mt-0.5">{String(value)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Characters */}
        {anime.characters && anime.characters.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl text-white mb-4">Characters</h2>
            <div className="scroll-row">
              {anime.characters.slice(0, 20).map(char => (
                <div key={char.id} className="shrink-0 w-24 flex flex-col items-center text-center gap-2">
                  <img
                    src={char.image?.medium || char.image?.large || ''}
                    alt={char.name?.full || ''}
                    className="w-20 h-20 rounded-full object-cover ring-2 ring-white/10"
                  />
                  <p className="text-xs text-foreground line-clamp-2 leading-tight">{char.name?.full}</p>
                  <p className="text-[10px] text-muted-foreground">{char.role}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Relations */}
        {anime.relations && anime.relations.length > 0 && (
          <div className="mt-12">
            <SectionRow title="Related Anime" items={anime.relations} />
          </div>
        )}

        {/* Recommendations */}
        {anime.recommendations && anime.recommendations.length > 0 && (
          <div className="mt-12">
            <SectionRow title="You Might Also Like" items={anime.recommendations} />
          </div>
        )}
      </div>
    </main>
  )
}
