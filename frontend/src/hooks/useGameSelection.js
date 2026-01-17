import { useGames } from './useGames'
import { useSelection } from '../context/SelectionContext'

export const useGameSelection = () => {
  const { selectedGames, toggleGame: toggleGameContext, clearGamesSelection } = useSelection()
  const { readyToPlayGames, repackGames } = useGames()

  const toggleGame = (gameId) => {
    toggleGameContext(gameId)
  }

  const clearSelection = () => {
    clearGamesSelection()
  }

  const getSelectedGamesNames = () => {
    const allGames = [...readyToPlayGames, ...repackGames]
    return selectedGames
      .map(id => allGames.find(game => game.id === id))
      .filter(Boolean)
      .map(game => `${game.name} (${game.size})`)
  }

  const sendToWhatsApp = () => {
    const gamesList = getSelectedGamesNames()
    const message = `مرحبا، أريد الألعاب التالية:\n\n${gamesList.join('\n')}`
    const encodedMessage = encodeURIComponent(message)
    const phoneNumber = '+201004694666'
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank')
  }

  const sendToMessenger = () => {
    const gamesList = getSelectedGamesNames()
    const message = `مرحبا، أريد الألعاب التالية:\n\n${gamesList.join('\n')}`
    const encodedMessage = encodeURIComponent(message)
    // Open Messenger chat directly with the new Facebook page
    window.open(`https://m.me/bta3al3ab96?text=${encodedMessage}`, '_blank')
  }

  return {
    selectedGames,
    toggleGame,
    clearSelection,
    sendToWhatsApp,
    sendToMessenger,
  }
}

