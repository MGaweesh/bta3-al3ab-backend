import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function AutocompleteInput({ 
  value, 
  onChange, 
  options = [], 
  placeholder = '', 
  label = '',
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [filteredOptions, setFilteredOptions] = useState(options)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (value) {
      const filtered = options.filter(option =>
        option.toLowerCase().includes(value.toLowerCase())
      )
      setFilteredOptions(filtered.slice(0, 10)) // Limit to 10 results
      setIsOpen(filtered.length > 0 && value.length > 0)
    } else {
      setFilteredOptions([])
      setIsOpen(false)
    }
  }, [value, options])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e) => {
    onChange(e.target.value)
    setHighlightedIndex(-1)
  }

  const handleSelect = (option) => {
    onChange(option)
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (!isOpen || filteredOptions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[highlightedIndex])
        } else if (filteredOptions.length > 0) {
          handleSelect(filteredOptions[0])
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
      default:
        break
    }
  }

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (value && filteredOptions.length > 0) {
            setIsOpen(true)
          }
        }}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 transition-all"
      />

      <AnimatePresence>
        {isOpen && filteredOptions.length > 0 && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-2xl max-h-64 overflow-y-auto"
          >
            {filteredOptions.map((option, index) => (
              <motion.div
                key={option}
                whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                className={`px-4 py-3 cursor-pointer transition-colors ${
                  index === highlightedIndex
                    ? 'bg-blue-100 dark:bg-blue-900/30'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                } ${index === 0 ? 'rounded-t-xl' : ''} ${
                  index === filteredOptions.length - 1 ? 'rounded-b-xl' : ''
                }`}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span className="text-gray-900 dark:text-white font-medium">
                  {option}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AutocompleteInput

