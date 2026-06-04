'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, User, Mail, Calendar } from 'lucide-react'
import Navbar from '@/components/Navbar'
import useSWR from 'swr'
import { signOut } from '@/lib/auth-client'

const fetcher = (url: string) => fetch(url).then(r => r.ok ? r.json() : null)

export default function ProfilePage() {
  const router = useRouter()
  const { data: session, isLoading } = useSWR('/api/auth/session', fetcher, { revalidateOnFocus: false })

  useEffect(() => {
    if (!isLoading && !session) router.push('/auth/sign-in')
  }, [session, isLoading, router])

  if (isLoading) return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-24 pb-16 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple border-t-transparent rounded-full animate-spin" />
      </div>
    </main>
  )

  if (!session) return null

  const user = session
  const joinDate = new Date(Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-24 pb-16">
        {/* Profile header */}
        <div className="glass rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-purple flex items-center justify-center text-white text-3xl font-bold overflow-hidden shrink-0 ring-4 ring-purple/30">
              {user.image ? (
                <img src={user.image} alt={user.name || ''} className="w-full h-full object-cover" />
              ) : (
                (user.name || user.email || 'U')[0].toUpperCase()
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="font-display text-4xl text-white">{user.name || 'Anikumo User'}</h1>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Mail size={14} /> {user.email}</span>
                <span className="flex items-center gap-1.5"><Calendar size={14} /> Joined {joinDate}</span>
              </div>
            </div>
            <button
              onClick={() => signOut().then(() => router.push('/'))}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-white hover:border-white/20 transition-colors"
            >
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>

        {/* Placeholder sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Watching', value: '—' },
            { label: 'Completed', value: '—' },
            { label: 'Plan to Watch', value: '—' },
          ].map(({ label, value }) => (
            <div key={label} className="glass rounded-2xl p-6 text-center">
              <p className="font-display text-4xl text-white">{value}</p>
              <p className="text-sm text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl p-6 text-center text-muted-foreground">
          <User size={48} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">Your watchlist and history will appear here as you use Anikumo.</p>
          <Link href="/" className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-purple text-white text-sm font-medium hover:bg-purple/80 transition-colors">
            Start Watching
          </Link>
        </div>
      </div>
    </main>
  )
}
