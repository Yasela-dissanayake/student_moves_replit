import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, Tag, MapPin, Clock, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// Types
interface SearchResult {
  id: number;
  title: string;
  type: 'item' | 'category' | 'user' | 'tag';
  price?: string;
  image?: string;
  category?: string;
  location?: string;
  createdAt?: string;
}

export function MarketplaceSearch() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([
    'textbooks', 'laptop', 'desk', 'monitor', 'macbook pro'
  ]);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  // Load search history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('marketplaceSearchHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory).slice(0, 5));
      } catch (e) {
        console.error('Failed to parse search history:', e);
      }
    }
  }, []);

  // Handle keyboard shortcut (Ctrl+K or Cmd+K) to open search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Handle regular search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle regular search form submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addToSearchHistory(searchQuery);
      setLocation(`/dashboard/marketplace?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Add search term to history
  const addToSearchHistory = (term: string) => {
    const newHistory = [term, ...searchHistory.filter(item => item !== term)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('marketplaceSearchHistory', JSON.stringify(newHistory));
  };

  // Handle command dialog item selection
  const handleSelect = (item: SearchResult | string) => {
    setOpen(false);
    
    if (typeof item === 'string') {
      // It's a search term
      setSearchQuery(item);
      addToSearchHistory(item);
      setLocation(`/dashboard/marketplace?search=${encodeURIComponent(item)}`);
    } else {
      // It's a search result item
      if (item.type === 'item') {
        setLocation(`/dashboard/marketplace/item/${item.id}`);
      } else if (item.type === 'category') {
        setLocation(`/dashboard/marketplace?category=${encodeURIComponent(item.title.toLowerCase())}`);
      } else if (item.type === 'tag') {
        setLocation(`/dashboard/marketplace?tag=${encodeURIComponent(item.title)}`);
      } else if (item.type === 'user') {
        setLocation(`/dashboard/marketplace/seller/${item.id}`);
      }
    }
  };

  // Fetch search results from API
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['/api/marketplace/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) return { results: [] };
      
      const response = await fetch(`/api/marketplace/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error('Failed to search marketplace');
      }
      return response.json();
    },
    enabled: open && searchQuery.trim().length >= 2,
  });

  // Format price
  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
    }).format(parseFloat(price));
  };

  // Format relative time
  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <>
      {/* Regular search input */}
      <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search the marketplace..."
          className="pr-10 w-full"
          value={searchQuery}
          onChange={handleSearchInputChange}
          onClick={() => setOpen(true)}
        />
        <Button
          size="sm"
          variant="ghost"
          className="absolute right-0 top-0 h-full"
          type="submit"
        >
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {/* Enhanced search dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search for items, categories, tags..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          {/* Show search history if no query */}
          {!searchQuery && searchHistory.length > 0 && (
            <CommandGroup heading="Recent Searches">
              {searchHistory.map((term, index) => (
                <CommandItem
                  key={`history-${index}`}
                  onSelect={() => handleSelect(term)}
                >
                  <Clock className="mr-2 h-4 w-4 opacity-50" />
                  <span>{term}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          
          {/* Show trending searches if no query */}
          {!searchQuery && trendingSearches.length > 0 && (
            <CommandGroup heading="Trending">
              {trendingSearches.map((term, index) => (
                <CommandItem
                  key={`trending-${index}`}
                  onSelect={() => handleSelect(term)}
                >
                  <TrendingUp className="mr-2 h-4 w-4 opacity-50" />
                  <span>{term}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          
          {/* Show search results if there's a query */}
          {searchQuery && !isLoading && searchResults?.results && (
            <>
              {/* Items */}
              {searchResults.results.filter(r => r.type === 'item').length > 0 && (
                <CommandGroup heading="Items">
                  {searchResults.results
                    .filter(r => r.type === 'item')
                    .map((result: SearchResult) => (
                      <CommandItem
                        key={`item-${result.id}`}
                        onSelect={() => handleSelect(result)}
                        className="flex items-center"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {result.image ? (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={result.image} alt={result.title} />
                              <AvatarFallback>{result.title.charAt(0)}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                              <Search className="h-4 w-4" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-medium">{result.title}</span>
                            <div className="flex items-center text-sm text-gray-500">
                              {result.category && (
                                <Badge variant="outline" className="mr-2 text-xs">
                                  {result.category}
                                </Badge>
                              )}
                              {result.location && (
                                <span className="flex items-center text-xs">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {result.location}
                                </span>
                              )}
                            </div>
                          </div>
                          {result.price && (
                            <span className="ml-auto font-medium">
                              {formatPrice(result.price)}
                            </span>
                          )}
                        </div>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </CommandItem>
                    ))}
                </CommandGroup>
              )}
              
              {/* Categories */}
              {searchResults.results.filter(r => r.type === 'category').length > 0 && (
                <CommandGroup heading="Categories">
                  {searchResults.results
                    .filter(r => r.type === 'category')
                    .map((result: SearchResult) => (
                      <CommandItem
                        key={`category-${result.id}`}
                        onSelect={() => handleSelect(result)}
                      >
                        <div className="flex items-center">
                          <Tag className="mr-2 h-4 w-4" />
                          <span>{result.title}</span>
                        </div>
                        <ArrowRight className="ml-auto h-4 w-4" />
                      </CommandItem>
                    ))}
                </CommandGroup>
              )}
              
              {/* Tags */}
              {searchResults.results.filter(r => r.type === 'tag').length > 0 && (
                <CommandGroup heading="Tags">
                  {searchResults.results
                    .filter(r => r.type === 'tag')
                    .map((result: SearchResult) => (
                      <CommandItem
                        key={`tag-${result.id}`}
                        onSelect={() => handleSelect(result)}
                      >
                        <div className="flex items-center">
                          <Tag className="mr-2 h-4 w-4" />
                          <span>#{result.title}</span>
                        </div>
                        <ArrowRight className="ml-auto h-4 w-4" />
                      </CommandItem>
                    ))}
                </CommandGroup>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}