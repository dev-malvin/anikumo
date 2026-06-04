import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import AnimeCard from './AnimeCard'
import { type Anime } from '@/lib/api'

interface SectionRowProps {
  title: string
  items: Anime[]
  viewAllHref?: string
  ranked?: boolean
  loading?: boolean
}

function SkeletonCard() {
  return (
    <div className="shrink-0 w-40 md:w-44 flex flex-col gap-2">
      <div className="skeleton aspect-[2/3] rounded-xl" />
      <div className="skeleton h-3 w-3/4 rounded" />
      <div className="skeleton h-3 w-1/2 rounded" />
    </div>
  )
}

export default function SectionRow({
  title,
  items,
  viewAllHref,
  ranked = false,
  loading = false,
}: SectionRowProps) {
  return (
    <section className="py-2">
      <div className="flex items-center justify-between mb-4 px-4 md:px-0">
        <h2 className="font-display text-2xl text-white tracking-wide">{title}</h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-purple transition-colors"
          >
            View All <ChevronRight size={15} />
          </Link>
        )}
      </div>

      <div className="scroll-row px-4 md:px-0">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : items.map((anime, i) => (
              <AnimeCard key={anime.id} anime={anime} rank={ranked ? i + 1 : undefined} />
            ))}
      </div>
    </section>
  )
}
