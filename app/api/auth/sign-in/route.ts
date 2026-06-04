import { NextRequest, NextResponse } from 'next/server'
import { createSessionToken, hashPassword, verifyPassword, SESSION_COOKIE } from '@/lib/auth'

// Inline Turso client to avoid importing @libsql/client at module level
async function getTurso() {
  const { createClient } = await import('@libsql/client')
  return createClient({
    url: process.env.TURSO_URL || 'file:local.db',
    authToken: process.env.TURSO_TOKEN,
  })
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const db = await getTurso()

    // Ensure users table exists
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

    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ?',
      args: [email],
    })

    const user = result.rows[0]
    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.password as string)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const sessionUser = {
      id: user.id as string,
      name: user.name as string,
      email: user.email as string,
      image: user.image as string | undefined,
    }

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
    console.error('[auth/sign-in]', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
