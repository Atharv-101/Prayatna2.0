
import { useState, useEffect } from 'react';
import { Port } from '@/data/ports';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Anchor, Globe, Ship, MapPin, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getWeatherForLocation } from '@/utils/weatherUtils';

interface PortInfoProps {
  port: Port | null;
  onClose: () => void;
  onSetAsStart: (port: Port) => void;
  onSetAsEnd: (port: Port) => void;
  className?: string;
}

const PortInfo = ({ port, onClose, onSetAsStart, onSetAsEnd, className }: PortInfoProps) => {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (port) {
      setLoading(true);
      getWeatherForLocation(port.coordinates[0], port.coordinates[1])
        .then(data => {
          setWeather(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setWeather(null);
    }
  }, [port]);

  if (!port) return null;

  return (
    <Card className={cn(
      "w-full max-w-md bg-white/90 dark:bg-black/80 backdrop-blur-lg shadow-lg border border-gray-200 dark:border-gray-800 animate-scale-in",
      className
    )}>
      <CardHeader className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-8 w-8 rounded-full"
          onClick={onClose}
        >
          <X size={16} />
          <span className="sr-only">Close</span>
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-ocean-50 text-ocean-600 dark:bg-ocean-900 dark:text-ocean-300 border-ocean-200 dark:border-ocean-800 px-2 py-1 rounded-full">
            {port.size.charAt(0).toUpperCase() + port.size.slice(1)} Port
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800 px-2 py-1 rounded-full">
            {port.id}
          </Badge>
        </div>
        <CardTitle className="text-xl text-ocean-800 dark:text-white">{port.name}</CardTitle>
        <CardDescription className="flex items-center gap-1 text-muted-foreground">
          <Globe size={14} />
          <span>{port.country}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-ocean-50 dark:bg-ocean-900/50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Max Depth</div>
            <div className="text-lg font-medium text-ocean-700 dark:text-ocean-300">{port.depth}m</div>
          </div>
          <div className="p-3 bg-ocean-50 dark:bg-ocean-900/50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Coordinates</div>
            <div className="text-sm font-medium text-ocean-700 dark:text-ocean-300">
              {port.coordinates[1].toFixed(4)}, {port.coordinates[0].toFixed(4)}
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2 text-muted-foreground">Facilities</h4>
          <div className="flex flex-wrap gap-2">
            {port.facilities.map((facility, index) => (
              <Badge key={index} variant="secondary" className="rounded-full text-xs">
                {facility}
              </Badge>
            ))}
          </div>
        </div>
        
        {weather && (
          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">Current Weather</h4>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-marine-light dark:bg-ocean-900/30 rounded-lg">
                <div className="text-xs text-muted-foreground">Temp</div>
                <div className="text-sm font-medium">{weather.temperature}°C</div>
              </div>
              <div className="p-2 bg-marine-light dark:bg-ocean-900/30 rounded-lg">
                <div className="text-xs text-muted-foreground">Wind</div>
                <div className="text-sm font-medium">{weather.windSpeed} km/h</div>
              </div>
              <div className="p-2 bg-marine-light dark:bg-ocean-900/30 rounded-lg">
                <div className="text-xs text-muted-foreground">Waves</div>
                <div className="text-sm font-medium">{weather.waveHeight}m</div>
              </div>
            </div>
          </div>
        )}
        
        <div>
          <h4 className="text-sm font-medium mb-2 text-muted-foreground">Description</h4>
          <p className="text-sm text-ocean-800 dark:text-ocean-100">{port.description}</p>
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2">
        <Button 
          variant="outline"
          size="sm"
          className="gap-1 flex-1 bg-ocean-50 hover:bg-ocean-100 text-ocean-600 border-ocean-200 dark:bg-ocean-900/50 dark:hover:bg-ocean-800 dark:text-ocean-300 dark:border-ocean-700"
          onClick={() => onSetAsStart(port)}
        >
          <Anchor size={14} />
          <span>Set as origin</span>
        </Button>
        <Button 
          variant="outline"
          size="sm"
          className="gap-1 flex-1 bg-ocean-50 hover:bg-ocean-100 text-ocean-600 border-ocean-200 dark:bg-ocean-900/50 dark:hover:bg-ocean-800 dark:text-ocean-300 dark:border-ocean-700"
          onClick={() => onSetAsEnd(port)}
        >
          <MapPin size={14} />
          <span>Set as destination</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PortInfo;
