
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Ship, Menu, X, Globe, Map, Navigation, Anchor, CloudSun } from 'lucide-react';
import { cn } from '@/lib/utils';
import SearchBar from './SearchBar';

interface NavbarProps {
  onSearchPorts: (term: string) => void;
  onRouteClick: () => void;
  onPortsClick: () => void;
  onWeatherClick: () => void;
}

const Navbar = ({ onSearchPorts, onRouteClick, onPortsClick, onWeatherClick }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-30 bg-white/80 dark:bg-ocean-800/80 backdrop-blur-md border-b border-gray-200 dark:border-ocean-700 shadow-sm transition-all duration-300">
      <div className="container mx-auto px-4 py-2 flex items-center justify-between h-16">
        {/* Logo and site name */}
        <div className="flex items-center gap-2">
          <Ship className="text-ocean-600 dark:text-ocean-300 animate-pulse-soft" size={24} />
          <span className="text-lg font-medium tracking-tight text-ocean-800 dark:text-white">
            ShipRoute Navigator
          </span>
        </div>

        {/* Search bar (hidden on mobile) */}
        <div className="hidden md:block max-w-md w-full mx-4">
          <SearchBar onSearch={onSearchPorts} />
        </div>

        {/* Desktop navigation links */}
        <div className="hidden md:flex items-center space-x-1">
          <Button 
            variant="ghost" 
            className="flex items-center gap-1 text-ocean-600 hover:text-ocean-800 hover:bg-ocean-50 dark:text-ocean-300 dark:hover:text-white dark:hover:bg-ocean
            -700"
            onClick={onRouteClick}
          >
            <Navigation size={18} />
            <span>Routes</span>
          </Button>
          
          <Button 
            variant="ghost" 
            className="flex items-center gap-1 text-ocean-600 hover:text-ocean-800 hover:bg-ocean-50 dark:text-ocean-300 dark:hover:text-white dark:hover:bg-ocean-700"
            onClick={onPortsClick}
          >
            <Anchor size={18} />
            <span>Ports</span>
          </Button>
          
          <Button 
            variant="ghost" 
            className="flex items-center gap-1 text-ocean-600 hover:text-ocean-800 hover:bg-ocean-50 dark:text-ocean-300 dark:hover:text-white dark:hover:bg-ocean-700"
            onClick={onWeatherClick}
          >
            <CloudSun size={18} />
            <span>Weather</span>
          </Button>
        </div>

        {/* Mobile menu button */}
        <Button 
          variant="ghost" 
          className="md:hidden text-ocean-600 dark:text-ocean-300" 
          onClick={toggleMenu}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </div>

      {/* Mobile menu */}
      <div className={cn(
        "fixed inset-x-0 top-16 bg-white/95 dark:bg-ocean-800/95 backdrop-blur-md shadow-lg transition-all duration-300 ease-in-out transform z-20 md:hidden",
        isMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
      )}>
        <div className="container mx-auto px-4 py-3 space-y-4">
          <SearchBar onSearch={onSearchPorts} />
          
          <div className="flex flex-col space-y-1">
            <Button 
              variant="ghost" 
              className="flex items-center justify-start gap-2 text-ocean-600 hover:text-ocean-800 hover:bg-ocean-50 dark:text-ocean-300 dark:hover:text-white dark:hover:bg-ocean-700"
              onClick={() => {
                onRouteClick();
                setIsMenuOpen(false);
              }}
            >
              <Navigation size={18} />
              <span>Routes</span>
            </Button>
            
            <Button 
              variant="ghost" 
              className="flex items-center justify-start gap-2 text-ocean-600 hover:text-ocean-800 hover:bg-ocean-50 dark:text-ocean-300 dark:hover:text-white dark:hover:bg-ocean-700"
              onClick={() => {
                onPortsClick();
                setIsMenuOpen(false);
              }}
            >
              <Anchor size={18} />
              <span>Ports</span>
            </Button>
            
            <Button 
              variant="ghost" 
              className="flex items-center justify-start gap-2 text-ocean-600 hover:text-ocean-800 hover:bg-ocean-50 dark:text-ocean-300 dark:hover:text-white dark:hover:bg-ocean-700"
              onClick={() => {
                onWeatherClick();
                setIsMenuOpen(false);
              }}
            >
              <CloudSun size={18} />
              <span>Weather</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
