import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, hashPassword, SESSION_COOKIE } from '@/lib/auth'
import { randomUUID } from 'crypto'

async function getTurso() {
  const { createClient } = await import('@libsql/client')
  return createClient({
    url: process.env.TURSO_URL || 'file:local.db',
    authToken: process.env.TURSO_TOKEN,
  })
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields required' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const db = await getTurso()

    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        image TEXT,
        created_at INTEGER DEFAULT (unixepoch())
      )
    `)

    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [email],
    })
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    const id = randomUUID()
    const hashed = await hashPassword(password)

    await db.execute({
      sql: 'INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)',
      args: [id, name, email, hashed],
    })

    const sessionUser = { id, name, email }
    const token = await createSessionToken(sessionUser)
    const res = NextResponse.json({ user: sessionUser })
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    return res
  } catch (e) {
    console.error('[auth/sign-up]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
