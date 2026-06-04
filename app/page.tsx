import Navbar from '@/components/Navbar'
import Spotlight from '@/components/Spotlight'
import SectionRow from '@/components/SectionRow'
import { animeApi } from '@/lib/api'

export const revalidate = 300

async function getHomeData() {
  const [spotlight, trending, popular, upcoming, recent] = await Promise.allSettled([
    animeApi.spotlight(),
    animeApi.trending(),
    animeApi.popular(),
    animeApi.upcoming(),
    animeApi.recent(),
  ])

  return {
    spotlight: spotlight.status === 'fulfilled' ? (spotlight.value?.results ?? []) : [],
    trending: trending.status === 'fulfilled' ? (trending.value?.results ?? []) : [],
    popular: popular.status === 'fulfilled' ? (popular.value?.results ?? []) : [],
    upcoming: upcoming.status === 'fulfilled' ? (upcoming.value?.results ?? []) : [],
    recent: recent.status === 'fulfilled' ? (recent.value?.results ?? []) : [],
  }
}

export default async function HomePage() {
  const { spotlight, trending, popular, upcoming, recent } = await getHomeData()

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Spotlight items={spotlight} />
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pb-16 space-y-10 mt-10">
        {trending.length > 0 && (
          <SectionRow title="Trending Now" items={trending} viewAllHref="/browse?sort=TRENDING_DESC" ranked />
        )}
        {popular.length > 0 && (
          <SectionRow title="All Time Popular" items={popular} viewAllHref="/browse?sort=POPULARITY_DESC" />
        )}
        {recent.length > 0 && (
          <SectionRow title="Recently Updated" items={recent} viewAllHref="/browse?sort=UPDATED_AT_DESC" />
        )}
        {upcoming.length > 0 && (
          <SectionRow title="Upcoming" items={upcoming} viewAllHref="/browse?sort=START_DATE_DESC" />
        )}
      </div>
    </main>
  )
}
