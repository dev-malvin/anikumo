import { NextRequest, NextResponse } from 'next/server'

const ANIME_API = process.env.ANIME_API_URL || 'https://muriro-api.vercel.app'
const MANGA_VAULT = process.env.MANGA_VAULT_URL || 'https://vaultapi-one.vercel.app'
// ANIME_API_ORIGIN must match the ALLOWED_ORIGINS set in the muriro-api Vercel project
const APP_ORIGIN = process.env.ANIME_API_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || 'https://anikumo.malvintech.sbs'

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const subpath = '/' + path.join('/')
  const qs = req.nextUrl.search // includes leading '?'
  const fullPath = subpath + qs

  try {
    // Spotlight: fetch trending and return as { info: [] }
    if (subpath === '/spotlight') {
      const url = `${ANIME_API}/trending?page=1&per_page=10`
      const r = await fetch(url, {
        headers: { 'Origin': APP_ORIGIN, 'Referer': APP_ORIGIN + '/', 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
        next: { revalidate: 0 },
      })
      const json = await r.json()
      const raw = json?.info || json?.results || json?.data || []
      return NextResponse.json({ info: Array.isArray(raw) ? raw.slice(0, 10) : [] })
    }

    // Manga: proxy to manga vault
    if (subpath.startsWith('/manga/')) {
      const vaultPath = subpath.slice('/manga'.length) + qs
      const url = MANGA_VAULT + vaultPath
      const r = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
        next: { revalidate: 60 },
      })
      const data = await r.arrayBuffer()
      return new NextResponse(data, {
        status: r.status,
        headers: { 'Content-Type': r.headers.get('Content-Type') || 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // All other anime API calls: proxy to muriro-api with correct Origin
    const url = ANIME_API + fullPath
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': APP_ORIGIN + '/',
        'Origin': APP_ORIGIN,
      },
      next: { revalidate: subpath.startsWith('/watch/') ? 0 : 60 },
    })

    const data = await r.arrayBuffer()
    return new NextResponse(data, {
      status: r.status,
      headers: { 'Content-Type': r.headers.get('Content-Type') || 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 })
  }
}
