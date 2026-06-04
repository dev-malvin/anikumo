import { betterAuth } from 'better-auth'
import { createClient } from '@libsql/client'

const turso = createClient({
  url: process.env.TURSO_URL!,
  authToken: process.env.TURSO_TOKEN,
})

// Minimal drizzle-like adapter using raw libsql
// Better Auth supports a custom database adapter via its `database` option
export const auth = betterAuth({
  database: {
    type: 'sqlite',
    db: turso as any,
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
})

export type Session = typeof auth.$Infer.Session
