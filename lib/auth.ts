import { betterAuth } from 'better-auth'
import { createClient } from '@libsql/client'

const turso = createClient({
  url: process.env.TURSO_URL!,
  authToken: process.env.TURSO_TOKEN,
})

const socialProviders: Record<string, any> = {}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  socialProviders.github = {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  }
}

export const auth = betterAuth({
  database: {
    type: 'sqlite',
    db: turso as any,
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders,
})

export type Session = typeof auth.$Infer.Session
