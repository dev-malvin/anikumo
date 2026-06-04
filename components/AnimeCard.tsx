import Link from 'next/link'
import { Play } from 'lucide-react'
import { type Anime, titleOf, coverOf, scoreLabel } from '@/lib/api'

interface AnimeCardProps {
  anime: Anime
  rank?: number
  compact?: boolean
}

export default function AnimeCard({ anime, rank, compact }: AnimeCardProps) {
  const title = titleOf(anime)
  const cover = coverOf(anime)
  const score = scoreLabel(anime.averageScore)
  const isUpcoming =
    anime.status === 'NOT_YET_RELEASED' ||
    (anime.nextAiringEpisode?.episode === 1) ||
    anime.next_episode === 1
  const isAiring = anime.status === 'RELEASING' && !isUpcoming
  const eps = anime.episodes
    ? `EP ${anime.episodes}`
    : isAiring
    ? 'Ongoing'
    : ''

  return (
    <Link
      href={`/anime/${anime.id}`}
      className={`group relative flex flex-col shrink-0 rounded-xl overflow-hidden bg-surface hover:ring-2 hover:ring-purple/60 transition-all duration-200 ${
        compact ? 'w-32' : 'w-40 md:w-44'
      }`}
    >
      {/* Poster */}
      <div className={`relative overflow-hidden ${compact ? 'aspect-[2/3]' : 'aspect-[2/3]'}`}>
        {cover ? (
          <img
            src={cover}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-surface-raised flex items-center justify-center">
            <span className="text-muted-foreground text-xs">No image</span>
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-10 h-10 rounded-full bg-purple flex items-center justify-center">
            <Play size={16} fill="white" className="text-white ml-0.5" />
          </div>
        </div>

        {/* Rank badge */}
        {rank && (
          <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-purple flex items-center justify-center text-white text-xs font-bold">
            {rank}
          </div>
        )}

        {/* Episode badge */}
        {eps && (
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-medium">
            {eps}
          </div>
        )}

        {/* Airing dot */}
        {isAiring && !rank && (
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-green-400 shadow-lg shadow-green-400/50" />
        )}
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="text-xs font-medium text-foreground line-clamp-2 leading-relaxed">{title}</p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {score && (
            <span className="text-[10px] text-yellow-400 font-semibold">★ {score}</span>
          )}
          {anime.format && (
            <span className="text-[10px] text-muted-foreground">{anime.format}</span>
          )}
          {anime.seasonYear && (
            <span className="text-[10px] text-muted-foreground">{anime.seasonYear}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
