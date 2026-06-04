import { NextRequest, NextResponse } from 'next/server'

const ANIME_API = process.env.ANIME_API_URL || 'https://muriro-api.vercel.app'
const API_KEY = process.env.MURIRO_API_KEY || ''

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const endpoint = path.join('/')
  const searchParams = request.nextUrl.searchParams.toString()
  const url = `${ANIME_API}/${endpoint}${searchParams ? `?${searchParams}` : ''}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'origin': process.env.NEXT_PUBLIC_APP_URL || 'https://anikumo.vercel.app',
  }
  if (API_KEY) headers['x-api-key'] = API_KEY

  try {
    const res = await fetch(url, {
      headers,
      next: { revalidate: 300 },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
