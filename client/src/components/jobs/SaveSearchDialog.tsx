import React, { useState } from 'react';
import { Check, Save, Trash2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SavedSearch, useSavedSearches } from '@/hooks/use-saved-searches';
import { formatDistanceToNow } from 'date-fns';

interface SaveSearchDialogProps {
  filters: SavedSearch['filters'];
  sortBy: string;
  onApplySearch: (search: SavedSearch) => void;
}

export function SaveSearchDialog({ filters, sortBy, onApplySearch }: SaveSearchDialogProps) {
  const { savedSearches, saveSearch, removeSearch, updateSearch } = useSavedSearches();
  const [open, setOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [activeTab, setActiveTab] = useState<'save' | 'manage'>('save');

  const handleSaveSearch = () => {
    if (searchName.trim()) {
      saveSearch(searchName, filters, sortBy);
      setSearchName('');
      setActiveTab('manage');
    }
  };

  const getSummaryText = (search: SavedSearch) => {
    const summaryParts = [];
    
    if (search.filters.search) {
      summaryParts.push(`"${search.filters.search}"`);
    }
    if (search.filters.category) {
      summaryParts.push(search.filters.category);
    }
    if (search.filters.location) {
      summaryParts.push(search.filters.location);
    }
    if (search.filters.type) {
      summaryParts.push(search.filters.type);
    }
    if (search.filters.workArrangement) {
      summaryParts.push(search.filters.workArrangement === 'remote' ? 'Remote' : 
                       search.filters.workArrangement === 'onsite' ? 'On-site' : 'Hybrid');
    }
    if (search.filters.latitude && search.filters.longitude && search.filters.distanceInKm) {
      summaryParts.push(`Within ${search.filters.distanceInKm}km`);
    }
    
    if (summaryParts.length === 0) {
      return 'All jobs';
    }
    
    return summaryParts.join(', ');
  };

  const handleApplySearch = (search: SavedSearch) => {
    onApplySearch(search);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Save size={16} />
          Save Search
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {activeTab === 'save' ? 'Save Current Search' : 'Manage Saved Searches'}
          </DialogTitle>
          <DialogDescription>
            {activeTab === 'save' 
              ? 'Save your current search filters and settings for quick access later.' 
              : 'View, apply, or delete your previously saved searches.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex border-b mb-4">
          <div className="flex-1 flex">
            <button
              className={`flex-1 pb-2 px-3 ${activeTab === 'save' ? 'border-b-2 border-primary font-medium' : 'text-gray-500'}`}
              onClick={() => setActiveTab('save')}
              type="button"
            >
              Save Current
            </button>
            <button
              className={`flex-1 pb-2 px-3 ${activeTab === 'manage' ? 'border-b-2 border-primary font-medium' : 'text-gray-500'}`}
              onClick={() => setActiveTab('manage')}
              type="button"
            >
              Manage ({savedSearches.length})
            </button>
          </div>
        </div>
        
        {activeTab === 'save' ? (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="search-name">Name your search</Label>
              <Input 
                id="search-name" 
                placeholder="E.g., Remote tech jobs" 
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Current filters</Label>
              <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-700">
                {getSummaryText({ id: '', name: '', timestamp: '', filters, sortBy })}
              </div>
            </div>
            
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveSearch} disabled={!searchName.trim()}>Save Search</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 max-h-[300px] overflow-y-auto py-2">
            {savedSearches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>You haven't saved any searches yet.</p>
                <Button variant="link" onClick={() => setActiveTab('save')} className="mt-2">
                  Save your current search
                </Button>
              </div>
            ) : (
              savedSearches.map(search => (
                <div key={search.id} className="border rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{search.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{getSummaryText(search)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {search.sortBy === 'date' ? 'Newest first' : 
                           search.sortBy === 'salary' ? 'Highest salary' : 
                           'Closest first'}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          Saved {formatDistanceToNow(new Date(search.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeSearch(search.id)}
                        className="h-7 w-7 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t flex justify-end">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-1"
                      onClick={() => handleApplySearch(search)}
                    >
                      <Check size={14} />
                      Apply
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}