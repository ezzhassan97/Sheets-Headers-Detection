"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface Option {
  value: string
  label: string
  caption?: string
  tag?: string
  tagColor?: string
}

interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  emptyMessage?: string
  disabled?: boolean
}

export function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder = "Select items",
  emptyMessage = "No items found.",
  disabled = false,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Focus search input when dropdown opens
  React.useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 10)
    }
  }, [isOpen])

  const handleUnselect = (item: string) => {
    onChange(selected.filter((i) => i !== item))
  }

  const filteredOptions = searchQuery
    ? options.filter(
        (option) =>
          option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          option.caption?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : options

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      if (!isOpen) {
        setSearchQuery("")
      }
    }
  }

  const handleOptionSelect = (option: Option) => {
    const isSelected = selected.includes(option.value)
    onChange(isSelected ? selected.filter((item) => item !== option.value) : [...selected, option.value])
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        className="w-full justify-between h-auto min-h-10"
        type="button"
        disabled={disabled}
        onClick={toggleDropdown}
      >
        <div className="flex flex-wrap gap-1">
          {selected.length > 0 ? (
            selected.map((item) => {
              const option = options.find((o) => o.value === item)
              return (
                <Badge key={item} variant="secondary" className="mr-1 mb-1">
                  {option?.label || item}
                  <button
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUnselect(item)
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUnselect(item)
                    }}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              )
            })
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover rounded-md border border-border shadow-md">
          {/* Search Input */}
          <div className="flex items-center border-b p-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Options List */}
          <div className="max-h-[300px] overflow-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selected.includes(option.value)
                return (
                  <div
                    key={option.value}
                    className={cn(
                      "relative flex cursor-default select-none items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-accent/50",
                    )}
                    onClick={() => handleOptionSelect(option)}
                  >
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      {option.caption && <span className="text-xs text-muted-foreground">{option.caption}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {option.tag && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            option.tagColor === "green" && "bg-green-100 text-green-800 border-green-200",
                            option.tagColor === "blue" && "bg-blue-100 text-blue-800 border-blue-200",
                          )}
                        >
                          {option.tag}
                        </Badge>
                      )}
                      <span
                        className={cn(
                          "flex h-4 w-4 items-center justify-center",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                      >
                        <Check className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
