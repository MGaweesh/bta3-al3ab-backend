import { useState, useEffect } from 'react'
import api from '../services/api'
import { movieImages } from '../data/movieImages'

// Helper function to get movie image
const getMovieImage = (name) => {
  return movieImages[name] || null
}

// Sample Movies Data - Default data if localStorage is empty
const initialMovies = [
  { id: 1, name: "Inception", year: "2010", rating: "8.8", genre: "Sci-Fi, Action", image: getMovieImage("Inception"), description: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O." },
  { id: 2, name: "The Dark Knight", year: "2008", rating: "9.0", genre: "Action, Crime", image: getMovieImage("The Dark Knight"), description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice." },
  { id: 3, name: "Interstellar", year: "2014", rating: "8.6", genre: "Sci-Fi, Adventure", image: getMovieImage("Interstellar"), description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival." },
  { id: 4, name: "Avatar", year: "2009", rating: "7.8", genre: "Sci-Fi, Adventure", image: getMovieImage("Avatar"), description: "A paraplegic Marine dispatched to the moon Pandora on a unique mission becomes torn between following his orders and protecting the world he feels is his home." },
  { id: 5, name: "Avengers: Endgame", year: "2019", rating: "8.4", genre: "Action, Adventure", image: getMovieImage("Avengers: Endgame"), description: "After the devastating events of Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more in order to reverse Thanos' actions and restore balance to the universe." },
  { id: 6, name: "The Matrix", year: "1999", rating: "8.7", genre: "Sci-Fi, Action", image: getMovieImage("The Matrix"), description: "When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth--the life he knows is the elaborate deception of an evil cyber-intelligence." },
  { id: 7, name: "Fight Club", year: "1999", rating: "8.8", genre: "Drama", image: getMovieImage("Fight Club"), description: "An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into something much, much more." },
  { id: 8, name: "Pulp Fiction", year: "1994", rating: "8.9", genre: "Crime, Drama", image: getMovieImage("Pulp Fiction"), description: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption." },
  { id: 9, name: "The Shawshank Redemption", year: "1994", rating: "9.3", genre: "Drama", image: getMovieImage("The Shawshank Redemption"), description: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency." },
  { id: 10, name: "Godfather", year: "1972", rating: "9.2", genre: "Crime, Drama", image: getMovieImage("Godfather"), description: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son." },
  { id: 11, name: "Spider-Man: No Way Home", year: "2021", rating: "8.2", genre: "Action, Adventure", image: getMovieImage("Spider-Man: No Way Home"), description: "With Spider-Man's identity now revealed, Peter asks Doctor Strange for help. When a spell goes wrong, dangerous foes from other worlds start to appear, forcing Peter to discover what it truly means to be Spider-Man." },
  { id: 12, name: "Dune", year: "2021", rating: "8.0", genre: "Sci-Fi, Adventure", image: getMovieImage("Dune"), description: "A noble family becomes embroiled in a war for control over the galaxy's most valuable asset while its heir becomes troubled by visions of a dark future." },
  { id: 13, name: "Oppenheimer", year: "2023", rating: "8.4", genre: "Biography, Drama", image: getMovieImage("Oppenheimer"), description: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb." },
  { id: 14, name: "Barbie", year: "2023", rating: "7.0", genre: "Adventure, Comedy", image: getMovieImage("Barbie"), description: "Barbie suffers a crisis that leads her to question her world and her existence." },
  { id: 15, name: "Top Gun: Maverick", year: "2022", rating: "8.3", genre: "Action, Drama", image: getMovieImage("Top Gun: Maverick"), description: "After thirty years, Maverick is still pushing the envelope as a top naval aviator, but must confront ghosts of his past when he leads TOP GUN's elite graduates on a mission that demands the ultimate sacrifice from those chosen to fly it." }
]

const initialTvShows = [
  { id: 101, name: "Breaking Bad", seasons: "5", rating: "9.5", genre: "Crime, Drama", image: getMovieImage("Breaking Bad"), description: "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine in order to secure his family's future." },
  { id: 102, name: "Game of Thrones", seasons: "8", rating: "9.2", genre: "Action, Adventure", image: getMovieImage("Game of Thrones"), description: "Nine noble families fight for control over the lands of Westeros, while an ancient enemy returns after being dormant for millennia." },
  { id: 103, name: "Stranger Things", seasons: "4", rating: "8.7", genre: "Drama, Fantasy", image: getMovieImage("Stranger Things"), description: "When a young boy disappears, his mother, a police chief and his friends must confront terrifying supernatural forces in order to get him back." },
  { id: 104, name: "The Witcher", seasons: "3", rating: "8.1", genre: "Action, Adventure", image: getMovieImage("The Witcher"), description: "Geralt of Rivia, a solitary monster hunter, struggles to find his place in a world where people often prove more wicked than beasts." },
  { id: 105, name: "The Mandalorian", seasons: "3", rating: "8.7", genre: "Action, Adventure", image: getMovieImage("The Mandalorian"), description: "The travels of a lone bounty hunter in the outer reaches of the galaxy, far from the authority of the New Republic." },
  { id: 106, name: "Squid Game", seasons: "1", rating: "8.0", genre: "Action, Drama", image: getMovieImage("Squid Game"), description: "Hundreds of cash-strapped players accept a strange invitation to compete in children's games. Inside, a tempting prize awaits with deadly high stakes." },
  { id: 107, name: "The Last of Us", seasons: "1", rating: "8.8", genre: "Action, Adventure", image: getMovieImage("The Last of Us"), description: "After a global pandemic destroys civilization, a hardened survivor takes charge of a 14-year-old girl who may be humanity's last hope." },
  { id: 108, name: "Succession", seasons: "4", rating: "8.9", genre: "Drama", image: getMovieImage("Succession"), description: "The Roy family is known for controlling the biggest media and entertainment company in the world. However, their world changes when their father steps down from the company." },
  { id: 109, name: "The Boys", seasons: "3", rating: "8.7", genre: "Action, Comedy", image: getMovieImage("The Boys"), description: "A group of vigilantes set out to take down corrupt superheroes who abuse their superpowers." },
  { id: 110, name: "Better Call Saul", seasons: "6", rating: "9.0", genre: "Crime, Drama", image: getMovieImage("Better Call Saul"), description: "The trials and tribulations of criminal lawyer Jimmy McGill in the time before he established his strip-mall law office in Albuquerque, New Mexico." },
  { id: 111, name: "Chernobyl", seasons: "1", rating: "9.4", genre: "Drama, History", image: getMovieImage("Chernobyl"), description: "In April 1986, an explosion at the Chernobyl nuclear power plant in the Union of Soviet Socialist Republics becomes one of the world's worst man-made catastrophes." },
  { id: 112, name: "Black Mirror", seasons: "6", rating: "8.7", genre: "Drama, Sci-Fi", image: getMovieImage("Black Mirror"), description: "An anthology series exploring a twisted, high-tech multiverse where humanity's greatest innovations and darkest instincts collide." },
  { id: 113, name: "Friends", seasons: "10", rating: "8.9", genre: "Comedy, Romance", image: getMovieImage("Friends"), description: "Follows the personal and professional lives of six twenty to thirty-something-year-old friends living in Manhattan." },
  { id: 114, name: "The Office", seasons: "9", rating: "9.0", genre: "Comedy", image: getMovieImage("The Office"), description: "A mockumentary on a group of typical office workers, where the workday consists of ego clashes, inappropriate behavior, and tedium." },
  { id: 115, name: "Sherlock", seasons: "4", rating: "9.1", genre: "Crime, Drama", image: getMovieImage("Sherlock"), description: "A modern update finds the famous sleuth and his doctor partner solving crime in 21st century London." }
]

const initialAnime = [
  { id: 201, name: "Attack on Titan", seasons: "4", rating: "9.1", genre: "Action, Dark Fantasy", image: getMovieImage("Attack on Titan"), description: "After his hometown is destroyed and his mother is killed, young Eren Jaeger vows to cleanse the earth of the giant humanoid Titans that have brought humanity to the brink of extinction." },
  { id: 202, name: "Death Note", seasons: "1", rating: "9.0", genre: "Thriller, Supernatural", image: getMovieImage("Death Note"), description: "An intelligent high school student goes on a secret crusade to eliminate criminals from the world after discovering a notebook capable of killing anyone whose name is written into it." },
  { id: 203, name: "One Piece", seasons: "20+", rating: "8.9", genre: "Action, Adventure", image: getMovieImage("One Piece"), description: "Follows the adventures of Monkey D. Luffy and his pirate crew in order to find the greatest treasure ever left by the legendary Pirate, Gold Roger." },
  { id: 204, name: "Naruto Shippuden", seasons: "21", rating: "8.7", genre: "Action, Adventure", image: getMovieImage("Naruto Shippuden"), description: "Naruto Uzumaki, is a loud, hyperactive, adolescent ninja who constantly searches for approval and recognition, as well as to become Hokage, who is acknowledged as the leader and strongest of all ninja in the village." },
  { id: 205, name: "Demon Slayer", seasons: "3", rating: "8.7", genre: "Action, Fantasy", image: getMovieImage("Demon Slayer"), description: "A family is attacked by demons and only two members survive - Tanjiro and his sister Nezuko, who is turning into a demon slowly. Tanjiro sets out to become a demon slayer to avenge his family and cure his sister." },
  { id: 206, name: "Jujutsu Kaisen", seasons: "2", rating: "8.5", genre: "Action, Supernatural", image: getMovieImage("Jujutsu Kaisen"), description: "A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself. He enters a shaman's school to be able to locate the demon's other body parts and thus exorcise himself." },
  { id: 207, name: "Fullmetal Alchemist: Brotherhood", seasons: "1", rating: "9.1", genre: "Action, Adventure", image: getMovieImage("Fullmetal Alchemist: Brotherhood"), description: "Two brothers search for a Philosopher's Stone after an attempt to revive their deceased mother goes awry and leaves them in damaged physical forms." },
  { id: 208, name: "One Punch Man", seasons: "2", rating: "8.7", genre: "Action, Comedy", image: getMovieImage("One Punch Man"), description: "The story of Saitama, a hero who does it just for fun & can defeat his enemies with a single punch." },
  { id: 209, name: "My Hero Academia", seasons: "6", rating: "8.3", genre: "Action, Superhero", image: getMovieImage("My Hero Academia"), description: "A superhero-loving boy without any powers is determined to enroll in a prestigious hero academy and learn what it really means to be a hero." },
  { id: 210, name: "Dragon Ball Z", seasons: "9", rating: "8.8", genre: "Action, Adventure", image: getMovieImage("Dragon Ball Z"), description: "With the help of the powerful Dragonballs, a team of fighters led by the saiyan warrior Goku defend the planet earth from extraterrestrial enemies." },
  { id: 211, name: "Hunter x Hunter", seasons: "6", rating: "9.0", genre: "Action, Adventure", image: getMovieImage("Hunter x Hunter"), description: "Gon Freecss aspires to become a Hunter, an exceptional being capable of greatness. With his friends and his potential, he seeks for his father who left him when he was younger." },
  { id: 212, name: "Tokyo Ghoul", seasons: "4", rating: "7.7", genre: "Horror, Action", image: getMovieImage("Tokyo Ghoul"), description: "A Tokyo college student is attacked by a ghoul, a superpowered human who feeds on human flesh. He survives, but has become part ghoul and becomes a fugitive on the run." },
  { id: 213, name: "Steins;Gate", seasons: "1", rating: "8.8", genre: "Sci-Fi, Thriller", image: getMovieImage("Steins;Gate"), description: "After discovering time travel, a university student and his colleagues must use their knowledge of it to stop an evil organization and their diabolical plans." },
  { id: 214, name: "Cowboy Bebop", seasons: "1", rating: "8.9", genre: "Sci-Fi, Action", image: getMovieImage("Cowboy Bebop"), description: "The futuristic misadventures and tragedies of an easygoing bounty hunter and his partners." },
  { id: 215, name: "Neon Genesis Evangelion", seasons: "1", rating: "8.5", genre: "Sci-Fi, Mecha", image: getMovieImage("Neon Genesis Evangelion"), description: "A teenage boy finds himself recruited as a member of an elite team of pilots by his father." }
]

export const useMovies = () => {
  const [movies, setMovies] = useState([])
  const [tvShows, setTvShows] = useState([])
  const [anime, setAnime] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Helper to add images to items if missing
  const addImagesToItems = (items) => {
    return items.map(item => ({
      ...item,
      image: item.image || getMovieImage(item.name || item.title)
    }))
  }

  // Helper to deduplicate items by id (keep last occurrence)
  const deduplicateById = (items) => {
    const seen = new Map()
    for (const item of items) {
      // Normalize id key to avoid duplicates like 123 vs "123"
      const key = item?.id != null ? String(item.id) : `${item?.name || ''}-${item?.year || ''}`
      seen.set(key, item)
    }
    return Array.from(seen.values())
  }

  // Helper to sort items alphabetically by name
  const sortItemsAlphabetically = (items) => {
    return [...items].sort((a, b) => {
      const nameA = (a.name || '').toLowerCase().trim()
      const nameB = (b.name || '').toLowerCase().trim()
      return nameA.localeCompare(nameB, 'en', { numeric: true, sensitivity: 'base' })
    })
  }

  // Helper to get local data safely
  const getLocalData = (key) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : []
    } catch {
      return []
    }
  }

  const loadMovies = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Loading movies...')

      // Always fetch from API first to avoid stale UI after edits.
      const data = await api.getAllMovies()

      console.log('✅ Movies data received:', {
        movies: data.movies?.length || 0,
        tvShows: data.tvShows?.length || 0,
        anime: data.anime?.length || 0
      })

      // Add images and sort items alphabetically
      const sortedMovies = sortItemsAlphabetically(deduplicateById(addImagesToItems(data.movies || [])))
      const sortedTvShows = sortItemsAlphabetically(deduplicateById(addImagesToItems(data.tvShows || [])))
      const sortedAnime = sortItemsAlphabetically(deduplicateById(addImagesToItems(data.anime || [])))

      // 3. Update State
      setMovies(sortedMovies)
      setTvShows(sortedTvShows)
      setAnime(sortedAnime)

      // Update LocalStorage (fallback cache only)
      localStorage.setItem('movies_cache', JSON.stringify(sortedMovies))
      localStorage.setItem('tvShows_cache', JSON.stringify(sortedTvShows))
      localStorage.setItem('anime_cache', JSON.stringify(sortedAnime))

    } catch (err) {
      console.error('❌ Error loading movies from API:', err)
      const isNetworkError = err.message.includes('fetch') ||
        err.message.includes('Network') ||
        err.message.includes('Failed to fetch')

      if (isNetworkError) {
        // Fallback to local cache first, then hardcoded data
        const savedMovies = forceRefresh ? [] : getLocalData('movies_cache')
        const savedTvShows = forceRefresh ? [] : getLocalData('tvShows_cache')
        const savedAnime = forceRefresh ? [] : getLocalData('anime_cache')

        if (savedMovies.length || savedTvShows.length || savedAnime.length) {
          console.warn('⚠️ Network error, using cached data')
          setMovies(sortItemsAlphabetically(deduplicateById(addImagesToItems(savedMovies))))
          setTvShows(sortItemsAlphabetically(deduplicateById(addImagesToItems(savedTvShows))))
          setAnime(sortItemsAlphabetically(deduplicateById(addImagesToItems(savedAnime))))
        } else {
          console.warn('⚠️ Network error, using fallback data')
          setMovies(sortItemsAlphabetically(deduplicateById(addImagesToItems(initialMovies))))
          setTvShows(sortItemsAlphabetically(deduplicateById(addImagesToItems(initialTvShows))))
          setAnime(sortItemsAlphabetically(deduplicateById(addImagesToItems(initialAnime))))
        }
      } else {
        setError('فشل تحميل الأفلام من السيرفر: ' + err.message)
        setMovies([])
        setTvShows([])
        setAnime([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMovies()
  }, [])

  return {
    movies,
    tvShows,
    anime,
    loading,
    error,
    refreshMovies: loadMovies,
  }
}
