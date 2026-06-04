'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, X, Menu, Home, Compass, BookOpen, Music, User, LogIn } from 'lucide-react'
import useSWR from 'swr'
import { signOut } from '@/lib/auth-client'
import { animeApi, titleOf, coverOf } from '@/lib/api'

const NAV_LINKS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/browse', label: 'Browse', icon: Compass },
  { href: '/manga', label: 'Manga', icon: BookOpen },
  { href: '/music', label: 'Music', icon: Music },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSWR('/api/auth/session', (url) => fetch(url).then(r => r.ok ? r.json() : null), { revalidateOnFocus: false })
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus()
  }, [searchOpen])

  const handleInput = (val: string) => {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (val.length < 2) { setSuggestions([]); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await animeApi.suggest(val)
        setSuggestions(Array.isArray(data) ? data.slice(0, 7) : [])
      } catch { setSuggestions([]) }
    }, 280)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    router.push(`/browse?q=${encodeURIComponent(query.trim())}`)
    closeSearch()
  }

  const closeSearch = () => {
    setSearchOpen(false)
    setQuery('')
    setSuggestions([])
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-background/95 backdrop-blur-md border-b border-border' : 'bg-transparent'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="font-display text-2xl text-white tracking-wide">ANIKUMO</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === href
                    ? 'text-white bg-white/10'
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
              aria-label="Search"
            >
              <Search size={20} />
            </button>

            {session ? (
              <div className="relative group">
                <Link href="/profile">
                  <div className="w-8 h-8 rounded-full bg-purple flex items-center justify-center text-white text-sm font-semibold overflow-hidden">
                    {session.image ? (
                      <img src={session.image} alt={session.name || ''} className="w-full h-full object-cover" />
                    ) : (
                      (session.name || session.email || 'U')[0].toUpperCase()
                    )}
                  </div>
                </Link>
                <div className="absolute right-0 top-full mt-2 w-44 glass rounded-xl overflow-hidden opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity">
                  <Link href="/profile" className="flex items-center gap-2 px-4 py-3 text-sm text-foreground hover:bg-white/5 transition-colors">
                    <User size={15} /> Profile
                  </Link>
                  <button
                    onClick={() => signOut().then(() => window.location.reload())}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/auth/sign-in"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple text-white text-sm font-medium hover:bg-purple/80 transition-colors"
              >
                <LogIn size={15} /> Sign In
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-white transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden bg-background/95 backdrop-blur-md border-t border-border px-4 py-3 flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  pathname === href
                    ? 'text-white bg-white/10'
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={16} /> {label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeSearch() }}
        >
          <div className="w-full max-w-2xl">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => handleInput(e.target.value)}
                placeholder="Search anime..."
                className="w-full bg-surface border border-border rounded-2xl pl-12 pr-12 py-4 text-foreground placeholder:text-muted-foreground outline-none focus:border-purple text-base"
              />
              <button
                type="button"
                onClick={closeSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </form>

            {suggestions.length > 0 && (
              <div className="mt-2 glass rounded-2xl overflow-hidden">
                {suggestions.map((a) => (
                  <Link
                    key={a.id}
                    href={`/anime/${a.id}`}
                    onClick={closeSearch}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                  >
                    <img
                      src={coverOf(a)}
                      alt={titleOf(a)}
                      className="w-10 h-14 object-cover rounded"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground line-clamp-1">{titleOf(a)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {a.format || ''} {a.seasonYear || a.year || ''}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
