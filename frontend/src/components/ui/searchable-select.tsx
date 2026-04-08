import * as React from "react"
import { ChevronDown, Monitor } from "lucide-react"
import { cn } from "../../lib/utils"

interface SearchableSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  options: Array<{
    value: string
    label: string
  }>
  className?: string
}

const SearchableSelect = React.forwardRef<
  HTMLDivElement,
  SearchableSelectProps
>(({ value, onValueChange, placeholder = "Select option", disabled, options, className }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Find the selected option's label
  const selectedOption = options.find(option => option.value === value)
  const displayValue = selectedOption?.label || ""

  // Handle click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm("")
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Focus input when dropdown opens
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSelect = (optionValue: string) => {
    onValueChange?.(optionValue)
    setIsOpen(false)
    setSearchTerm("")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    if (!isOpen) {
      setIsOpen(true)
    }
  }

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setSearchTerm("")
    } else if (e.key === 'ArrowDown' && isOpen) {
      e.preventDefault()
      const firstOption = dropdownRef.current?.querySelector('[data-option]')
      if (firstOption) {
        ;(firstOption as HTMLElement).focus()
      }
    }
  }

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* Trigger/Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? searchTerm : displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            "pr-10" // Space for dropdown arrow
          )}
        />
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
          disabled={disabled}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-9999 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {/* Options */}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                data-option
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 focus:bg-blue-50 focus:outline-none flex items-center gap-2",
                  value === option.value && "bg-blue-100 text-blue-700"
                )}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleSelect(option.value)
                  }
                }}
              >
                <Monitor className="w-4 h-4 text-gray-900" />
                {option.label}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">
              No options found
            </div>
          )}
        </div>
      )}
    </div>
  )
})

SearchableSelect.displayName = "SearchableSelect"

export { SearchableSelect }
