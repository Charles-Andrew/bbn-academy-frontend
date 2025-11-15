"use client";

import * as React from "react";
import { Check, ChevronDown, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MultiSelectProps<T extends string = string> {
  options: { label: string; value: T }[]
  selected: T[]
  onChange: (selected: T[]) => void
  placeholder?: string
  className?: string
  showClearAll?: boolean
}

export function MultiSelect<T extends string = string>({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  className,
  showClearAll = true,
}: MultiSelectProps<T>) {
  const [open, setOpen] = React.useState(false)

  const handleUnselect = (value: T) => {
    onChange(selected.filter(item => item !== value))
  }

  const handleSelect = (value: T) => {
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const handleClearAll = () => {
    onChange([])
  }

  const hasActiveFilters = selected.length > 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-auto min-h-[40px] py-2", className)}
        >
          <div className="flex gap-1 flex-wrap items-center">
            <span className="text-sm">
              {placeholder}
              {selected.length > 0 && (
                <span className="text-muted-foreground"> ({selected.length})</span>
              )}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandList>
            {hasActiveFilters && showClearAll && (
              <div className="p-2 border-b">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="w-full justify-start text-muted-foreground hover:text-destructive"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear all
                </Button>
              </div>
            )}
            <CommandEmpty>No option found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value as T)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selected.includes(option.value as T)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}