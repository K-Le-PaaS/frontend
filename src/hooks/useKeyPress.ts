import { useEffect } from 'react'

export const useKeyPress = (
  targetKey: string,
  handler: (event: KeyboardEvent) => void,
  options: {
    preventDefault?: boolean
    stopPropagation?: boolean
  } = {}
) => {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === targetKey) {
        if (options.preventDefault) {
          event.preventDefault()
        }
        if (options.stopPropagation) {
          event.stopPropagation()
        }
        handler(event)
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [targetKey, handler, options.preventDefault, options.stopPropagation])
}
