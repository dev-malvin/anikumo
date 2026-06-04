// Server-side: use direct API URL. Client-side: use internal proxy to avoid CORS/origin issues.
const isServer = typeof window === 'undefined'
const ANIME_API = isServer
  ? (process.env.ANIME_API_URL || 'https://muriro-api.vercel.app')
  : '/api/anime'
const STREAM_API = process.env.NEXT_PUBLIC_STREAM_API_URL || 'https://anikumo-api.vercel.app'
const MANGA_API = process.env.NEXT_PUBLIC_MANGA_API_URL || 'https://manga-vault-main.vercel.app'
const THEMES_API = 'https://api.animethemes.moe'

// Server-side API key header for direct muriro-api calls
const MURIRO_HEADERS: Record<string, string> = isServer && process.env.MURIRO_API_KEY
  ? { 'x-api-key': process.env.MURIRO_API_KEY, 'origin': process.env.NEXT_PUBLIC_APP_URL || 'https://anikumo.vercel.app' }
  : {}

async function get<T>(url: string, extraHeaders?: Record<string, string>): Promise<T> {
  const res = await fetch(url, {
    headers: extraHeaders,
    next: { revalidate: 300 },
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
  return res.json()
}

// ─── Anime (muriro-api) ─────────────────────────────────────────────────────

export const animeApi = {
  spotlight: () => get<{ results: Anime[] }>(`${ANIME_API}/spotlight`, MURIRO_HEADERS),
  trending: () => get<{ results: Anime[] }>(`${ANIME_API}/trending`, MURIRO_HEADERS),
  popular: () => get<{ results: Anime[] }>(`${ANIME_API}/popular`, MURIRO_HEADERS),
  upcoming: () => get<{ results: Anime[] }>(`${ANIME_API}/upcoming`, MURIRO_HEADERS),
  recent: () => get<{ results: Anime[] }>(`${ANIME_API}/recent`, MURIRO_HEADERS),
  schedule: () => get<ScheduleDay[]>(`${ANIME_API}/schedule`, MURIRO_HEADERS),
  search: (q: string, page = 1) =>
    get<{ results: Anime[]; hasNextPage: boolean }>(`${ANIME_API}/search?q=${encodeURIComponent(q)}&page=${page}`, MURIRO_HEADERS),
  suggest: (q: string) =>
    get<Anime[]>(`${ANIME_API}/suggestions?q=${encodeURIComponent(q)}`, MURIRO_HEADERS),
  filter: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString()
    return get<{ results: Anime[]; hasNextPage: boolean }>(`${ANIME_API}/filter?${qs}`, MURIRO_HEADERS)
  },
  info: (id: string | number) =>
    get<AnimeInfo>(`${ANIME_API}/info/${id}`, MURIRO_HEADERS),
  episodes: (id: string | number) =>
    get<Episode[]>(`${ANIME_API}/episodes/${id}`, MURIRO_HEADERS),
}

// ─── Streaming (anikumo-api) ────────────────────────────────────────────────

export const streamApi = {
  watch: (provider: string, id: string | number, type: 'sub' | 'dub', ep: number) =>
    get<WatchData>(`${STREAM_API}/watch/${provider}/${id}/${type}/${ep}`),
  map: (id: string | number) =>
    get<IdMap>(`${STREAM_API}/map/${id}`),
}

// ─── Manga (manga-vault) ────────────────────────────────────────────────────

export const mangaApi = {
  home: () => get<MangaHome>(`${MANGA_API}/home`),
  search: (q: string, source: string = 'atsumaru') =>
    get<{ results: Manga[] }>(`${MANGA_API}/search/${source}?q=${encodeURIComponent(q)}`),
  info: (source: string, id: string) =>
    get<MangaInfo>(`${MANGA_API}/manga/${source}/${encodeURIComponent(id)}`),
  chapters: (source: string, id: string) =>
    get<Chapter[]>(`${MANGA_API}/chapters/${source}/${encodeURIComponent(id)}`),
  pages: (source: string, chapterId: string) =>
    get<string[]>(`${MANGA_API}/pages/${source}/${encodeURIComponent(chapterId)}`),
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

export interface Episode {
  id?: string | number
  number: number
  title?: string
  thumbnail?: string
  isFiller?: boolean
}

export interface WatchData {
  sources?: StreamSource[]
  tracks?: Track[]
  intro?: { start: number; end: number }
  outro?: { start: number; end: number }
}

export interface StreamSource {
  url: string
  quality?: string
  isM3U8?: boolean
}

export interface Track {
  url: string
  lang?: string
  label?: string
  kind?: string
  default?: boolean
}

export interface IdMap {
  anilistId?: number
  malId?: number
  tvdbId?: number
  tmdbId?: number
}

export interface ScheduleDay {
  date?: string
  day?: string
  anime: Anime[]
}

export interface Manga {
  id: string
  title: string
  cover?: string
  source?: string
  status?: string
  genres?: string[]
  latestChapter?: string
}

export interface MangaHome {
  popular?: Manga[]
  latest?: Manga[]
  trending?: Manga[]
}

export interface MangaInfo extends Manga {
  description?: string
  author?: string
  chapters?: Chapter[]
}

export interface Chapter {
  id: string
  title?: string
  number?: string | number
  date?: string
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

export const PROVIDERS = ['gogoanime', 'zoro', 'animepahu', 'allmanga', 'reanime'] as const
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
