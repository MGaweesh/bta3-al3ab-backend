import { useState, useEffect } from 'react'
import { gameImages } from '../data/gameImages'
import api from '../services/api'

// Helper function to get game image
const getGameImage = (gameName) => {
  return gameImages[gameName] || null
}

// Sample games data - Default data if localStorage is empty
const initialReadyToPlayGames = [
  { id: 1, name: "Assassin's Creed's collections", size: '359GB', image: getGameImage("Assassin's Creed's collections") },
  { id: 2, name: 'Battlefield V', size: '50.6GB', image: getGameImage('Battlefield V') },
  { id: 3, name: 'BioShock Infinite - The Complete Edition', size: '38.3GB', image: getGameImage('BioShock Infinite - The Complete Edition') },
  { id: 4, name: 'BioShock Remastered', size: '18GB', image: getGameImage('BioShock Remastered') },
  { id: 5, name: 'Dishonored - Death of the Outsider', size: '23.8GB', image: getGameImage('Dishonored - Death of the Outsider') },
  { id: 6, name: 'eFootball PES 2021', size: '31.8GB', image: getGameImage('eFootball PES 2021') },
  { id: 7, name: 'Far Cry 5', size: '24GB', image: getGameImage('Far Cry 5') },
  { id: 8, name: 'Far Cry 6', size: '76.8GB', image: getGameImage('Far Cry 6') },
  { id: 9, name: 'FIFA 19', size: '35.7GB', image: getGameImage('FIFA 19') },
  { id: 10, name: 'FIFA 22', size: '43GB', image: getGameImage('FIFA 22') },
  { id: 11, name: 'Hellblade Senuas Sacrifice', size: '21.6GB', image: getGameImage('Hellblade Senuas Sacrifice') },
  { id: 12, name: 'Horizon - Zero Down', size: '55GB', image: getGameImage('Horizon - Zero Down') },
  { id: 13, name: 'Inside', size: '2.5GB', image: getGameImage('Inside') },
  { id: 14, name: 'Layers of Fear', size: '3.3GB', image: getGameImage('Layers of Fear') },
  { id: 15, name: 'Little Nightmares', size: '6.5GB', image: getGameImage('Little Nightmares') },
  { id: 16, name: 'Mafia - Definitive Edition', size: '28.7GB', image: getGameImage('Mafia - Definitive Edition') },
  { id: 17, name: 'old Games', size: '38GB', image: getGameImage('old Games') },
  { id: 18, name: 'Outlast 2', size: '25.5GB', image: getGameImage('Outlast 2') },
  { id: 19, name: 'Portal Collection', size: '31.9GB', image: getGameImage('Portal Collection') },
  { id: 20, name: 'Prey', size: '30.8GB', image: getGameImage('Prey') },
  { id: 21, name: 'Prince of Persia The Lost Crown', size: '7.7GB', image: getGameImage('Prince of Persia The Lost Crown') },
  { id: 22, name: 'PRO EVOLUTION SOCCER 2019', size: '45.6GB', image: getGameImage('PRO EVOLUTION SOCCER 2019') },
  { id: 23, name: 'Red Dead Redemption 2', size: '116GB', image: getGameImage('Red Dead Redemption 2') },
  { id: 24, name: 'Resident Evil - Village', size: '37.4GB', image: getGameImage('Resident Evil - Village') },
  { id: 25, name: 'Resident Evil 7 Biohazard', size: '23.4GB', image: getGameImage('Resident Evil 7 Biohazard') },
  { id: 26, name: 'South of Midnight', size: '60GB', image: getGameImage('South of Midnight') },
  { id: 27, name: 'Watch Dogs Legion', size: '54.8GB', image: getGameImage('Watch Dogs Legion') },
]

const initialRepackGames = [
  { id: 101, name: 'A Plague Tale - Innocence [FitGirl Repack]', size: '10GB', image: null },
  { id: 102, name: 'A Plague Tale Requiem [DODI Repack]', size: '28GB', image: null },
  { id: 103, name: 'ABZU', size: '1GB', image: null },
  { id: 104, name: 'Alan Wake - Remastered', size: '20.7GB', image: null },
  { id: 105, name: 'Amnesia The Bunker [DODI Repack]', size: '6.26GB', image: null },
  { id: 106, name: 'Aragami 2 Digital Deluxe Edition - [DODI Repack]', size: '3.6GB', image: null },
  { id: 107, name: 'Assassin Creed Mirage [DODI Repack]', size: '20.6GB', image: null },
  { id: 108, name: 'Atomic Heart', size: '26.5GB', image: null },
  { id: 109, name: 'Baldurs Gate 3 [DODI Repack]', size: '89.7GB', image: null },
  { id: 110, name: 'Batman - Arkham Knight', size: '27GB', image: null },
  { id: 111, name: 'BioShock 2 Remastered [FitGirl Repack]', size: '7GB', image: null },
  { id: 112, name: 'Borderlands 2 - Remastered [FitGirl Repack]', size: '11.9GB', image: null },
  { id: 113, name: 'Call of Duty Black Ops 6 [DODI Repack]', size: '42.1GB', image: null },
  { id: 114, name: 'Call Of Duty Modern Warfare 2', size: '3.6GB', image: null },
  { id: 115, name: 'Call of Duty Modern Warfare 3 [DODI]', size: '21.6GB', image: null },
  { id: 116, name: 'Clair Obscur Expedition 33 [DODI Repack]', size: '36.7GB', image: null },
  { id: 117, name: 'Control DLC [FitGirl Repack]', size: '18GB', image: null },
  { id: 118, name: 'Cronos The New Dawn [DODI Repack]', size: '17.4GB', image: null },
  { id: 119, name: 'Cyberpunk 2077 [DODI Repack]', size: '66GB', image: null },
  { id: 120, name: 'Days Gone', size: '21.5GB', image: null },
  { id: 121, name: 'Dead Cells [FitGirl Repack]', size: '2GB', image: null },
  { id: 122, name: 'Dead Island 2', size: '37GB', image: null },
  { id: 123, name: 'Deadpool', size: '3.5GB', image: null },
  { id: 124, name: 'Death Stranding Directors Cut [DODI]', size: '46.6GB', image: null },
  { id: 125, name: 'DeathLoop - [DODI Repack]', size: '21.7GB', image: null },
  { id: 126, name: 'Deliver At All Costs [DODI Repack]', size: '3GB', image: null },
  { id: 127, name: 'Detroit - Become Human [FitGirl Repack]', size: '23GB', image: null },
  { id: 128, name: 'Deus Ex - Mankind Divided [FitGirl Repack]', size: '25.1GB', image: null },
  { id: 129, name: 'Devil May Cry 5 [FitGirl Repack]', size: '27.4GB', image: null },
  { id: 130, name: 'Disco Elysium [FitGirl Repack]', size: '6.8GB', image: null },
  { id: 131, name: 'Dying Light - The Following EE [FitGirl Repack]', size: '12.8GB', image: null },
  { id: 132, name: 'Dying Light 2 Stay Human [DODI Repack]', size: '23.7GB', image: null },
  { id: 133, name: 'Dying Light The Beast [DODI Repack]', size: '35.5GB', image: null },
  { id: 134, name: 'EA SPORTS FC 26', size: '54.7GB', image: null },
  { id: 135, name: 'ELDEN RING [DODI Repack]', size: '38GB', image: null },
  { id: 136, name: 'Eternights [FitGirl Repack]', size: '3.6GB', image: null },
  { id: 137, name: 'Fallout 4 [FitGirl Repack]', size: '21.6GB', image: null },
  { id: 138, name: 'Far Cry - New Dawn', size: '16.4GB', image: null },
  { id: 139, name: 'Far Cry 3', size: '4.9GB', image: null },
  { id: 140, name: 'FIFA 23 [FitGirl Repack]', size: '42.5GB', image: null },
  { id: 141, name: 'Forza Horizon 3 [FitGirl Repack]', size: '27.4GB', image: null },
  { id: 142, name: 'Forza Horizon 5 [DODI Repack]', size: '84.6GB', image: null },
  { id: 143, name: 'Ghost of Tsushima [DODI Repack]', size: '33.3GB', image: null },
  { id: 144, name: 'Ghostrunner [FitGirl Repack]', size: '7.5GB', image: null },
  { id: 145, name: 'God of War [DODI Repack]', size: '26GB', image: null },
  { id: 146, name: 'God of War 1&2', size: '300MB', image: null },
  { id: 147, name: 'God of War Ragnarok [DODI Repack]', size: '70.8GB', image: null },
  { id: 148, name: 'Gotham Knights [DODI Repack]', size: '30.7GB', image: null },
  { id: 149, name: 'Grand Theft Auto V', size: '38.9GB', image: null },
  { id: 150, name: 'GRIS - [DODI Repack]', size: '964MB', image: null },
  { id: 151, name: 'GTA San Andreas Definitive Edition - [DODI Repack]', size: '13GB', image: null },
  { id: 152, name: 'GTA Vice City Definitive Edition - [DODI Repack]', size: '6.5GB', image: null },
  { id: 153, name: 'HADES - [DODI Repack]', size: '5GB', image: null },
  { id: 154, name: 'Hell is Us [FitGirl Repack]', size: '16.5GB', image: null },
  { id: 155, name: 'Hellblade Senuas Sacrifice Enhanced - [DODI Repack]', size: '7.4GB', image: null },
  { id: 156, name: 'High on Life [FitGirl Repack]', size: '30GB', image: null },
  { id: 157, name: 'Hitman 3', size: '18.5GB', image: null },
  { id: 158, name: 'Hogwarts Legacy [DODI Repack]', size: '58.6GB', image: null },
  { id: 159, name: 'Hollow Knight - [DODI Repack]', size: '1GB', image: null },
  { id: 160, name: 'Hollow Knight Silksong [DODI Repack]', size: '1.7GB', image: null },
  { id: 161, name: 'Immortals - Fenyx Rising', size: '20.5GB', image: null },
  { id: 162, name: 'Indiana Jones and the Great Circle [DODI]', size: '64.2GB', image: null },
  { id: 163, name: 'Kingdom Come Deliverance II [DODI]', size: '70GB', image: null },
  { id: 164, name: 'Layers of Fear - Inheritance', size: '1.4GB', image: null },
  { id: 165, name: 'Layers of Fear 2 [FitGirl Repack]', size: '7.8GB', image: null },
  { id: 166, name: 'Layers of Fear horror reimagined [DODI Repack]', size: '12.2GB', image: null },
  { id: 167, name: 'Left for Dead', size: '2.8GB', image: null },
  { id: 168, name: 'Left for Dead 2', size: '7.3GB', image: null },
  { id: 169, name: 'Lies of P [DODI Repack]', size: '36GB', image: null },
  { id: 170, name: 'Little Nightmares II [FitGirl Repack]', size: '2.7GB', image: null },
  { id: 171, name: 'Little Nightmares III [DODI Repack]', size: '8.8GB', image: null },
  { id: 172, name: 'Mad Max', size: '3.7GB', image: null },
  { id: 173, name: 'MADISON [DODI Repack]', size: '3GB', image: null },
  { id: 174, name: 'Mafia 2 (classic) - [DODI Repack]', size: '4GB', image: null },
  { id: 175, name: 'Marvels Guardians of the Galaxy [DODI Repack]', size: '14.8GB', image: null },
  { id: 176, name: 'Marvels SpiderMan 2 [DODI Repack]', size: '68.7GB', image: null },
  { id: 177, name: 'Marvels SpiderMan Miles Morales [DODI Repack]', size: '28.7GB', image: null },
  { id: 178, name: 'Marvels SpiderMan Remastered [DODI Repack]', size: '39GB', image: null },
  { id: 179, name: 'Max Payne 3 - Complete Edition [FitGirl Repack]', size: '13.8GB', image: null },
  { id: 180, name: 'Metal Gear Solid V The Phantom Pain', size: '21.6GB', image: null },
  { id: 181, name: 'Metro - Exodus', size: '32.9GB', image: null },
  { id: 182, name: 'Murdered - Soul Suspect', size: '5.7GB', image: null },
  { id: 183, name: 'My Friend Pedro', size: '1.8GB', image: null },
  { id: 184, name: 'Ori and the Blind Forest - Definitive Edition', size: '3.5GB', image: null },
  { id: 185, name: 'Ori and the Will of the Wisps', size: '3.5GB', image: null },
  { id: 186, name: 'Persona 5 Royal [FitGirl Repack]', size: '7.6GB', image: null },
  { id: 187, name: 'Prince of Persia - 2008 [DODI Repack]', size: '1.7GB', image: null },
  { id: 188, name: 'Prince of Persia The Forgotten Sand Remastered - [DODI Repack]', size: '2.1GB', image: null },
  { id: 189, name: 'Prince of Persia The Sands of Time - [DODI Repack]', size: '979MB', image: null },
  { id: 190, name: 'Prince of Persia The Two Thrones - [DODI Repack]', size: '1GB', image: null },
  { id: 191, name: 'Prince of Persia Warrior Within - [DODI Repack]', size: '2.2GB', image: null },
  { id: 192, name: 'Pro Evolution Soccer 2018', size: '8.7GB', image: null },
  { id: 193, name: 'Project Nightmares - Case 36 [FitGirl Repack]', size: '3.3GB', image: null },
  { id: 194, name: 'Ratchet & Clank - Rift Apart', size: '33GB', image: null },
  { id: 195, name: 'Ready or Not [DODI Repack]', size: '23.6GB', image: null },
  { id: 196, name: 'Red Dead Redemption [DODI Repack]', size: '8.10GB', image: null },
  { id: 197, name: 'Resident Evil 2', size: '17GB', image: null },
  { id: 198, name: 'Resident Evil 3 [FitGirl Repack]', size: '13GB', image: null },
  { id: 199, name: 'Resident Evil 4 Remake', size: '41.8GB', image: null },
  { id: 200, name: 'Resident Evil Village - [DODI Repack]', size: '19.7GB', image: null },
  { id: 201, name: 'Rise of the Tomb Raider', size: '14.4GB', image: null },
  { id: 202, name: 'RoboCop - Rogue City [FitGirl Repack]', size: '28.2GB', image: null },
  { id: 203, name: 'Senua Saga Hellblade II [DODI Repack]', size: '34.4GB', image: null },
  { id: 204, name: 'Sifu [DODI Repack]', size: '8.8GB', image: null },
  { id: 205, name: 'Silent Hill 2 [DODI Repack]', size: '26GB', image: null },
  { id: 206, name: 'Silent Hill f [DODI Repack]', size: '28.2GB', image: null },
  { id: 207, name: 'Spider-Man Web of Shadows - [DODI Repack]', size: '4.3GB', image: null },
  { id: 208, name: 'Splinter Cell - Blacklist [FitGirl Repack]', size: '11.3GB', image: null },
  { id: 209, name: 'Split Fiction [DODI Repack]', size: '57.4GB', image: null },
  { id: 210, name: 'Star Wars Jedi - Fallen Order', size: '37.5GB', image: null },
  { id: 211, name: 'Starfield [FitGirl Repack]', size: '62.5GB', image: null },
  { id: 212, name: 'Stray [FitGirl Repack]', size: '4GB', image: null },
  { id: 213, name: 'Superliminal [FitGirl Repack]', size: '1.8GB', image: null },
  { id: 214, name: 'System Shock - Remake [FitGirl Repack]', size: '2.8GB', image: null },
  { id: 215, name: 'The Conjuring House [FitGirl Repack]', size: '2.7GB', image: null },
  { id: 216, name: 'The Elder Scrolls - Skyrim - Special Edition [FitGirl Repack]', size: '8.6GB', image: null },
  { id: 217, name: 'The Evil Within [FitGirl Repack]', size: '12.9GB', image: null },
  { id: 218, name: 'The Evil Within 2 [FitGirl Repack]', size: '12.6GB', image: null },
  { id: 219, name: 'The Last of Us [DODI Repack]', size: '46.8GB', image: null },
  { id: 220, name: 'The Last of Us Part II Remastered [DODI Repack]', size: '49.6GB', image: null },
  { id: 221, name: 'The Legend of Zelda Breath of the Wild (Portable)', size: '15.8GB', image: null },
  { id: 222, name: 'The Shattering [FitGirl Repack]', size: '2.6GB', image: null },
  { id: 223, name: 'The Stanley Parable - Ultra Deluxe', size: '2.6GB', image: null },
  { id: 224, name: 'The Suicide of Rachel Foster [FitGirl Repack]', size: '5.3GB', image: null },
  { id: 225, name: 'The Witcher 3 - GotY Edition [FitGirl Repack]', size: '23GB', image: null },
  { id: 226, name: 'Thief', size: '14.7GB', image: null },
  { id: 227, name: 'Titanfall 2', size: '22GB', image: null },
  { id: 228, name: 'Tomb Raider', size: '7.2GB', image: null },
  { id: 229, name: 'Uncharted 4: A Thief\'s End [DODI Repack]', size: '46.5GB', image: null },
  { id: 230, name: 'Watch Dogs 2 Gold Edition - [DODI]', size: '25.2GB', image: null },
  { id: 231, name: 'Wo Long Fallen Dynasty [DODI Repack]', size: '20GB', image: null },
]

const initialOnlineGames = [
  { id: 201, name: 'Fortnite', size: 'Online', image: null },
  { id: 202, name: 'Valorant', size: 'Online', image: null },
  { id: 203, name: 'Apex Legends', size: 'Online', image: null },
]

export const useGames = () => {
  const [readyToPlayGames, setReadyToPlayGames] = useState([])
  const [repackGames, setRepackGames] = useState([])
  const [onlineGames, setOnlineGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Helper to add images to games if missing
  const addImagesToGames = (games) => {
    return games.map(game => ({
      ...game,
      image: game.image || getGameImage(game.name)
    }))
  }

  // Helper to sort games alphabetically by name
  const sortGamesAlphabetically = (games) => {
    return [...games].sort((a, b) => {
      const nameA = (a.name || '').toLowerCase().trim()
      const nameB = (b.name || '').toLowerCase().trim()
      return nameA.localeCompare(nameB, 'en', { numeric: true, sensitivity: 'base' })
    })
  }

  const loadGames = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      // 1. Try to load from LocalStorage first (Instant Load)
      if (!forceRefresh) {
        try {
          const savedReadyToPlay = JSON.parse(localStorage.getItem('readyToPlayGames') || 'null')
          const savedRepack = JSON.parse(localStorage.getItem('repackGames') || 'null')
          const savedOnline = JSON.parse(localStorage.getItem('onlineGames') || 'null')

          if (savedReadyToPlay && savedRepack && savedOnline) {
            console.log('📦 Loaded games from cache')
            setReadyToPlayGames(sortGamesAlphabetically(addImagesToGames(savedReadyToPlay)))
            setRepackGames(sortGamesAlphabetically(addImagesToGames(savedRepack)))
            setOnlineGames(sortGamesAlphabetically(addImagesToGames(savedOnline)))
            setLoading(false) // Show cached data immediately
          }
        } catch (e) {
          console.warn('Failed to load from cache', e)
        }
      }

      // 2. Fetch fresh data from API (Background Update)
      const data = await api.getAllGames()

      // Add images to games and sort alphabetically
      const readyToPlayWithImages = addImagesToGames(data.readyToPlay || [])
      const repackWithImages = addImagesToGames(data.repack || [])
      const onlineWithImages = addImagesToGames(data.online || [])

      // 3. Update State
      setReadyToPlayGames(sortGamesAlphabetically(readyToPlayWithImages))
      setRepackGames(sortGamesAlphabetically(repackWithImages))
      setOnlineGames(sortGamesAlphabetically(onlineWithImages))

      // 4. Update LocalStorage
      localStorage.setItem('readyToPlayGames', JSON.stringify(readyToPlayWithImages))
      localStorage.setItem('repackGames', JSON.stringify(repackWithImages))
      localStorage.setItem('onlineGames', JSON.stringify(onlineWithImages))

    } catch (err) {
      console.error('Error loading games from API:', err)
      // Only show error if we have NO data at all
      if (readyToPlayGames.length === 0) {
        setError('فشل تحميل الألعاب من السيرفر')

        // Use hardcoded fallback only if absolutely nothing else exists
        setReadyToPlayGames(sortGamesAlphabetically(addImagesToGames(initialReadyToPlayGames)))
        setRepackGames(sortGamesAlphabetically(addImagesToGames(initialRepackGames)))
        setOnlineGames(sortGamesAlphabetically(addImagesToGames(initialOnlineGames)))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGames()
  }, [])

  return {
    readyToPlayGames,
    repackGames,
    onlineGames,
    loading,
    error,
    refreshGames: loadGames,
  }
}

