import React, { useState, useRef, useEffect } from 'react';
import { X, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiSelectProps {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (value: string[]) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  creatable?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  className,
  placeholder = 'Select options',
  disabled = false,
  creatable = false
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelectOption = (optionValue: string) => {
    const newValue = selected.includes(optionValue)
      ? selected.filter(v => v !== optionValue)
      : [...selected, optionValue];
    onChange(newValue);
    setSearchValue('');
  };

  const handleRemoveOption = (e: React.MouseEvent, optionValue: string) => {
    e.stopPropagation();
    onChange(selected.filter(v => v !== optionValue));
  };

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          'flex min-h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          {
            'cursor-pointer': !disabled,
            'cursor-not-allowed': disabled
          }
        )}
      >
        <div className="flex flex-wrap gap-1">
          {selected.length > 0 ? (
            selected.map((v) => {
              const option = options.find((opt) => opt.value === v);
              return (
                <span
                  key={v}
                  className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs text-secondary-foreground"
                >
                  {option?.label || v}
                  {!disabled && (
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={(e) => handleRemoveOption(e, v)}
                    />
                  )}
                </span>
              );
            })
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        {!disabled && <ChevronsUpDown className="h-4 w-4 opacity-50" />}
      </div>
      
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-background py-1 shadow-md">
          <div className="px-3 py-2 sticky top-0 bg-background border-b">
            <input
              type="text"
              className="w-full focus:outline-none text-sm"
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => {
              const isSelected = selected.includes(option.value);
              return (
                <div
                  key={option.value}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center py-2 px-3 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    {
                      "bg-primary/10": isSelected
                    }
                  )}
                  onClick={() => handleSelectOption(option.value)}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="h-4 w-4 ml-auto" />}
                </div>
              );
            })
          ) : (
            <div className="text-center py-2 text-sm text-muted-foreground">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
}