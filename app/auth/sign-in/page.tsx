'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Github, Eye, EyeOff } from 'lucide-react'
import { signIn } from '@/lib/auth-client'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await signIn.email({ email, password })
      if ((res as any).error) { setError((res as any).error.message || 'Invalid credentials'); return }
      router.push('/')
    } catch { setError('Sign in failed. Please try again.') }
    finally { setLoading(false) }
  }

  const handleSocial = async (provider: 'google' | 'github') => {
    await signIn.social({ provider, callbackURL: '/' })
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <span className="font-display text-4xl text-white tracking-wide">ANIKUMO</span>
          </Link>
          <p className="text-muted-foreground text-sm mt-2">Sign in to your account</p>
        </div>

        {/* Social buttons */}
        <div className="flex flex-col gap-3 mb-6">
          <button onClick={() => handleSocial('google')}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl glass hover:bg-white/10 text-white text-sm font-medium transition-colors border border-border">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
          <button onClick={() => handleSocial('github')}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl glass hover:bg-white/10 text-white text-sm font-medium transition-colors border border-border">
            <Github size={20} />
            Continue with GitHub
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Email form */}
        <form onSubmit={handleEmail} className="flex flex-col gap-4">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="Email address"
              className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-purple transition-colors" />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="Password"
              className="w-full bg-surface border border-border rounded-xl pl-10 pr-10 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-purple transition-colors" />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-purple hover:bg-purple/80 text-white font-semibold text-sm transition-colors disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {"Don't have an account? "}
          <Link href="/auth/sign-up" className="text-purple hover:text-purple/80 transition-colors font-medium">
            Sign Up
          </Link>
        </p>
      </div>
    </main>
  )
}
