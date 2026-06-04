const ANIME_API = process.env.ANIME_API_URL || 'https://muriro-api.vercel.app'
const MANGA_API = process.env.NEXT_PUBLIC_MANGA_API_URL || 'https://manga-vault-main.vercel.app'
const THEMES_API = 'https://api.animethemes.moe'

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { next: { revalidate: 300 } })
  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
  return res.json()
}

// ─── Anime (muriro-api) ─────────────────────────────────────────────────────

export const animeApi = {
  spotlight: () => get<{ results: Anime[] }>(`${ANIME_API}/spotlight`),
  trending: (page = 1, per_page = 20) =>
    get<PaginatedResult<Anime>>(`${ANIME_API}/trending?page=${page}&per_page=${per_page}`),
  popular: (page = 1, per_page = 20) =>
    get<PaginatedResult<Anime>>(`${ANIME_API}/popular?page=${page}&per_page=${per_page}`),
  upcoming: (page = 1, per_page = 20) =>
    get<PaginatedResult<Anime>>(`${ANIME_API}/upcoming?page=${page}&per_page=${per_page}`),
  recent: (page = 1, per_page = 20) =>
    get<PaginatedResult<Anime>>(`${ANIME_API}/recent?page=${page}&per_page=${per_page}`),
  schedule: (page = 1, per_page = 20) =>
    get<PaginatedResult<ScheduleItem>>(`${ANIME_API}/schedule?page=${page}&per_page=${per_page}`),
  search: (query: string, page = 1, per_page = 20) =>
    get<PaginatedResult<Anime>>(`${ANIME_API}/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${per_page}`),
  suggest: (query: string) =>
    get<{ suggestions: SuggestAnime[] }>(`${ANIME_API}/suggestions?query=${encodeURIComponent(query)}`),
  filter: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString()
    return get<PaginatedResult<Anime>>(`${ANIME_API}/filter?${qs}`)
  },
  info: (id: string | number) =>
    get<AnimeInfo>(`${ANIME_API}/info/${id}`),
  episodes: (id: string | number) =>
    get<EpisodesResponse>(`${ANIME_API}/episodes/${id}`),
  // Watch: takes the full episode id string from episodes response
  // e.g. "watch/kiwi/178005/sub/animepahe-1"  =>  GET /watch/kiwi/178005/sub/animepahe-1
  watch: (episodeId: string) =>
    get<WatchData>(`${ANIME_API}/watch/${episodeId}`),
  characters: (id: string | number, page = 1) =>
    get<{ results: Character[] }>(`${ANIME_API}/anime/${id}/characters?page=${page}&per_page=25`),
  relations: (id: string | number) =>
    get<{ results: Anime[] }>(`${ANIME_API}/anime/${id}/relations`),
  recommendations: (id: string | number, page = 1) =>
    get<{ results: Anime[] }>(`${ANIME_API}/anime/${id}/recommendations?page=${page}&per_page=10`),
}

// ─── Manga (manga-vault) ────────────────────────────────────────────────────

// manga-vault uses atsu provider — the only fully working one
// Endpoints: /atsu/home, /atsu/search?keyword=, /atsu/manga/{id}/details, /atsu/manga/{mangaId}/chapter/{chapterId}/images
export const mangaApi = {
  home: () =>
    get<{ success: boolean; data: AtsuHome }>(`${MANGA_API}/atsu/home`),
  search: (keyword: string) =>
    get<{ success: boolean; data: { items: Manga[] } }>(`${MANGA_API}/atsu/search?keyword=${encodeURIComponent(keyword)}`),
  info: (id: string) =>
    get<{ success: boolean; data: MangaInfo }>(`${MANGA_API}/atsu/manga/${encodeURIComponent(id)}/details`),
  pages: (mangaId: string, chapterId: string) =>
    get<string[]>(`${MANGA_API}/atsu/manga/${encodeURIComponent(mangaId)}/chapter/${encodeURIComponent(chapterId)}/images`),
}

// ─── Music (animethemes.moe) ────────────────────────────────────────────────

export const musicApi = {
  search: (q: string) =>
    get<ThemeSearch>(`${THEMES_API}/search?q=${encodeURIComponent(q)}&fields[search]=anime,animethemes,artists,songs&include[anime]=images,animethemes.song.artists,animethemes.animethemeentries.videos.audio&include[animetheme]=song.artists,anime.images,animethemeentries.videos.audio&limit=12`),
  recent: () =>
    get<{ animethemes: ThemeEntry[] }>(`${THEMES_API}/animetheme?sort=-id&include=song.artists,anime.images,animethemeentries.videos.audio&page[size]=24`),
  anime: (slug: string) =>
    get<{ anime: ThemeAnime }>(`${THEMES_API}/anime/${slug}?include=animethemes.song.artists,animethemes.animethemeentries.videos.audio,images`),
  artist: (slug: string) =>
    get<{ artist: ThemeArtist }>(`${THEMES_API}/artist/${slug}?include=songs.animethemes.anime.images,songs.animethemes.animethemeentries.videos.audio,images`),
  topArtists: () =>
    get<{ artists: ThemeArtist[] }>(`${THEMES_API}/artist?sort=-created_at&page[size]=20&include=images`),
  year: (year: string) =>
    get<{ animethemes: ThemeEntry[] }>(`${THEMES_API}/animetheme?filter[year]=${year}&include=song.artists,anime.images,animethemeentries.videos.audio&page[size]=24`),
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Anime {
  id: number
  title: { english?: string; romaji?: string; native?: string } | string
  coverImage?: { large?: string; extraLarge?: string; medium?: string }
  bannerImage?: string
  description?: string
  averageScore?: number
  episodes?: number
  status?: string
  format?: string
  season?: string
  seasonYear?: number
  genres?: string[]
  isAdult?: boolean
  nextAiringEpisode?: { episode: number; airingAt: number }
  poster?: string
  year?: number
  anilistId?: number
  alID?: number
  anilist_id?: number
  next_episode?: number
}

export interface AnimeInfo extends Anime {
  characters?: Character[]
  relations?: Anime[]
  recommendations?: Anime[]
  trailer?: { id?: string; site?: string }
  studios?: { name: string }[]
  startDate?: { year?: number; month?: number; day?: number }
  endDate?: { year?: number; month?: number; day?: number }
  source?: string
  duration?: number
  popularity?: number
  favourites?: number
}

export interface Character {
  id: number
  name: { full?: string; native?: string }
  image?: { medium?: string; large?: string }
  role?: string
  voiceActors?: { name: { full?: string }; image?: { medium?: string } }[]
}

export interface PaginatedResult<T> {
  page: number
  perPage: number
  total: number
  hasNextPage: boolean
  results: T[]
}

export interface SuggestAnime {
  id: number
  title: string
  title_romaji?: string
  poster?: string
  format?: string
  status?: string
  year?: number
  episodes?: number
}

// Episodes response — providers keyed by name (kiwi, arc, zoro, etc.)
export interface EpisodesResponse {
  mappings?: { anilistId?: number; malId?: number; kitsuId?: number }
  providers: Record<string, ProviderEpisodes>
}

export interface ProviderEpisodes {
  episodes: {
    sub?: Episode[]
    dub?: Episode[]
  }
}

export interface Episode {
  // Full episode ID string used directly as URL path e.g. "kiwi/178005/sub/animepahe-1"
  id: string
  number: number
  title?: string
  image?: string
  airDate?: string
  duration?: number
  description?: string
  filler?: boolean
}

export interface WatchData {
  streams?: StreamSource[]
  subtitles?: Subtitle[]
  intro?: { start: number; end: number }
  outro?: { start: number; end: number }
}

export interface StreamSource {
  url: string
  type?: string
  quality?: string
}

export interface Subtitle {
  file: string
  label: string
}

export interface ScheduleItem {
  airingAt: number
  timeUntilAiring: number
  next_episode: number
  id: number
  title: { english?: string; romaji?: string; native?: string }
  coverImage?: { large?: string; extraLarge?: string }
  bannerImage?: string
  format?: string
  status?: string
  genres?: string[]
  averageScore?: number
}

export interface Manga {
  id: string
  slug?: string
  title: string
  cover?: string
  type?: string
  status?: string
  year?: number
  isAdult?: boolean
  url?: string
}

// atsu /home response shape
export interface AtsuHome {
  trending_carousel?: { title: string; items: Manga[] }
  most_bookmarked?: { title: string; items: Manga[] }
  hot_updates?: { title: string; items: Manga[] }
  recently_updated?: { title: string; items: Manga[] }
  top_rated?: { title: string; items: Manga[] }
  popular?: { title: string; items: Manga[] }
  recently_added?: { title: string; items: Manga[] }
}

export interface MangaInfo {
  id: string
  title: string
  cover?: string
  type?: string
  views?: number
  released?: string
  scanlators?: string[]
  chapter_count?: number
  chapters?: Chapter[]
}

export interface Chapter {
  id: string
  number: number
  title?: string
  scanId?: string
  pageCount?: number
  url?: string
}

export interface ThemeSearch {
  search: {
    anime?: ThemeAnime[]
    animethemes?: ThemeEntry[]
    artists?: ThemeArtist[]
  }
}

export interface ThemeAnime {
  id: number
  name: string
  slug: string
  images?: ThemeImage[]
  animethemes?: ThemeEntry[]
}

export interface ThemeEntry {
  id: number
  type?: string
  sequence?: number
  slug?: string
  song?: { title?: string; artists?: ThemeArtist[] }
  anime?: ThemeAnime
  animethemeentries?: { id: number; version?: number; videos?: ThemeVideo[] }[]
}

export interface ThemeVideo {
  id: number
  basename?: string
  link?: string
  audio?: { link?: string; basename?: string }
}

export interface ThemeArtist {
  id: number
  name: string
  slug: string
  images?: ThemeImage[]
  songs?: { animethemes?: ThemeEntry[] }[]
}

export interface ThemeImage {
  facet?: string
  link?: string
}

// Providers available in muriro-api episodes response
export const PROVIDERS = ['kiwi', 'arc', 'zoro', 'jet'] as const
export type Provider = typeof PROVIDERS[number]

export function titleOf(a: Anime | AnimeInfo): string {
  if (!a?.title) return 'Unknown'
  if (typeof a.title === 'string') return a.title
  return a.title.english || a.title.romaji || a.title.native || 'Unknown'
}

export function coverOf(a: Anime | AnimeInfo): string {
  return a.poster || a.coverImage?.extraLarge || a.coverImage?.large || a.coverImage?.medium || ''
}

export function scoreLabel(s?: number): string | null {
  if (!s) return null
  return (s / 10).toFixed(1)
}

export function stripHtml(html?: string): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/g, ' ').trim()
}

export function formatStatus(s?: string): string {
  const map: Record<string, string> = {
    RELEASING: 'Airing',
    FINISHED: 'Finished',
    NOT_YET_RELEASED: 'Upcoming',
    CANCELLED: 'Cancelled',
    HIATUS: 'Hiatus',
  }
  return s ? (map[s] || s) : ''
}
