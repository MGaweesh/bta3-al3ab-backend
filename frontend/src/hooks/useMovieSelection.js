import { useMovies } from './useMovies'
import { useSelection } from '../context/SelectionContext'

export const useMovieSelection = () => {
  const { selectedItems, toggleItem: toggleItemContext, clearItemsSelection } = useSelection()
  const { movies, tvShows, anime } = useMovies()

  // Create unique ID by combining type and id: "movies-1", "tvShows-1", "anime-1"
  const createUniqueId = (type, id) => {
    const typeMap = {
      'فيلم': 'movies',
      'مسلسل': 'tvShows',
      'أنمي': 'anime'
    }
    return `${typeMap[type] || 'unknown'}-${id}`
  }

  // Parse unique ID back to type and id
  const parseUniqueId = (uniqueId) => {
    const [type, id] = uniqueId.split('-')
    return { type, id: parseInt(id) }
  }

  const toggleItem = (item, itemType) => {
    const type = itemType || item.type
    const uniqueId = createUniqueId(type, item.id)
    console.log('🔄 Toggling item:', {
      itemName: item.name,
      itemId: item.id,
      type,
      uniqueId
    })
    toggleItemContext(uniqueId)
  }

  const clearSelection = () => {
    clearItemsSelection()
  }

  const getSelectedItemsNames = () => {
    const allItems = [
      ...movies.map(item => ({ ...item, category: 'movies' })),
      ...tvShows.map(item => ({ ...item, category: 'tvShows' })),
      ...anime.map(item => ({ ...item, category: 'anime' }))
    ]

    console.log('📋 Getting selected items names:', {
      selectedItems,
      allItemsCount: allItems.length,
      moviesCount: movies.length,
      tvShowsCount: tvShows.length,
      animeCount: anime.length
    })

    const selected = selectedItems
      .map(uniqueId => {
        const { type, id } = parseUniqueId(uniqueId)
        const found = allItems.find(item => item.category === type && item.id === id)
        if (!found) {
          console.warn('⚠️ Item not found:', { uniqueId, type, id })
        }
        return found
      })
      .filter(Boolean)

    console.log('✅ Selected items found:', selected.map(item => item.name))

    return selected.map(item => {
      const sizeText = item.size ? ` - ${item.size}` : ''
      if (item.type === 'فيلم') {
        return `${item.name} (${item.year}) - ${item.type}${sizeText}`
      } else if (item.type === 'مسلسل') {
        return `${item.name} (${item.year}) - ${item.type} - ${item.seasons} موسم${sizeText}`
      } else {
        return `${item.name} (${item.year}) - ${item.type} - ${item.episodes} حلقة${sizeText}`
      }
    })
  }

  // Check if item is selected using unique ID
  const isItemSelected = (item, itemType) => {
    if (!item || !item.id) return false
    const type = itemType || item.type
    const uniqueId = createUniqueId(type, item.id)
    const isSelected = selectedItems.includes(uniqueId)
    return isSelected
  }

  const sendToWhatsApp = () => {
    const itemsList = getSelectedItemsNames()
    const message = `مرحبا، أريد العناصر التالية:\n\n${itemsList.join('\n')}`
    const encodedMessage = encodeURIComponent(message)
    const phoneNumber = '+201004694666'
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank')
  }

  const sendToMessenger = () => {
    const itemsList = getSelectedItemsNames()
    const message = `مرحبا، أريد العناصر التالية:\n\n${itemsList.join('\n')}`
    const encodedMessage = encodeURIComponent(message)
    // Open Messenger chat directly with the new Facebook page
    window.open(`https://m.me/bta3al3ab96?text=${encodedMessage}`, '_blank')
  }

  return {
    selectedItems,
    toggleItem,
    clearSelection,
    sendToWhatsApp,
    sendToMessenger,
    isItemSelected,
  }
}

