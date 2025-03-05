
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  onSearch: (term: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchBar = ({ onSearch, placeholder = "Search ports, routes or locations...", className }: SearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={cn(
        "relative flex w-full items-center", 
        className
      )}
    >
      <div className="relative w-full">
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pr-12 w-full bg-white/90 dark:bg-black/70 backdrop-blur-sm border-none rounded-full shadow-sm transition-all duration-300 focus-visible:ring-2 focus-visible:ring-ocean-300 h-11"
        />
        <Button 
          type="submit" 
          size="icon"
          variant="ghost"
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full h-9 w-9 text-ocean-500 hover:text-ocean-400 hover:bg-ocean-50"
        >
          <Search size={18} />
          <span className="sr-only">Search</span>
        </Button>
      </div>
    </form>
  );
};

export default SearchBar;
