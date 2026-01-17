import { createContext, useContext, useState } from 'react'

const SelectionContext = createContext()

export const useSelection = () => {
  const context = useContext(SelectionContext)
  if (!context) {
    throw new Error('useSelection must be used within SelectionProvider')
  }
  return context
}

export const SelectionProvider = ({ children }) => {
  const [selectedGames, setSelectedGames] = useState([])
  const [selectedItems, setSelectedItems] = useState([])

  const toggleGame = (gameId) => {
    setSelectedGames(prev => {
      if (prev.includes(gameId)) {
        return prev.filter(id => id !== gameId)
      } else {
        return [...prev, gameId]
      }
    })
  }

  const toggleItem = (uniqueId) => {
    setSelectedItems(prev => {
      if (prev.includes(uniqueId)) {
        return prev.filter(id => id !== uniqueId)
      } else {
        return [...prev, uniqueId]
      }
    })
  }

  const clearGamesSelection = () => {
    setSelectedGames([])
  }

  const clearItemsSelection = () => {
    setSelectedItems([])
  }

  const clearAllSelection = () => {
    setSelectedGames([])
    setSelectedItems([])
  }

  const totalSelectedCount = selectedGames.length + selectedItems.length

  return (
    <SelectionContext.Provider
      value={{
        selectedGames,
        selectedItems,
        toggleGame,
        toggleItem,
        clearGamesSelection,
        clearItemsSelection,
        clearAllSelection,
        totalSelectedCount,
      }}
    >
      {children}
    </SelectionContext.Provider>
  )
}



