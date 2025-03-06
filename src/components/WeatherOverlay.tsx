
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { CloudSun, Wind, Droplets, Eye, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getWeatherForLocation, getRouteRiskAssessment, WeatherData } from '@/utils/weatherUtils';
import { cn } from '@/lib/utils';

interface WeatherOverlayProps {
  routeWaypoints?: [number, number][];
  centerCoordinates: [number, number];
  className?: string;
}

const WeatherOverlay = ({ routeWaypoints, centerCoordinates, className }: WeatherOverlayProps) => {
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [routeForecasts, setRouteForecasts] = useState<WeatherData[]>([]);
  const [risk, setRisk] = useState<{
    riskLevel: 'low' | 'medium' | 'high';
    description: string;
    recommendations: string[];
  } | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      try {
        // Fetch weather for current map center
        const weather = await getWeatherForLocation(centerCoordinates[0], centerCoordinates[1]);
        setCurrentWeather(weather);
        
        // If route waypoints are available, get forecasts for the route
        if (routeWaypoints && routeWaypoints.length > 0) {
          const forecasts: WeatherData[] = [];
          
          // For performance, we'll get forecasts for a subset of waypoints
          const step = Math.max(1, Math.floor(routeWaypoints.length / 5));
          
          for (let i = 0; i < routeWaypoints.length; i += step) {
            const point = routeWaypoints[i];
            const forecast = await getWeatherForLocation(point[0], point[1]);
            forecasts.push(forecast);
          }
          
          setRouteForecasts(forecasts);
          
          // Calculate risk assessment
          const assessment = getRouteRiskAssessment(forecasts);
          setRisk(assessment);
        } else {
          setRouteForecasts([]);
          setRisk(null);
        }
      } catch (error) {
        console.error('Error fetching weather:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWeather();
  }, [centerCoordinates, routeWaypoints]);

  const getRiskColor = (level: 'low' | 'medium' | 'high'): string => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <Card className={cn(
      "w-full max-w-md bg-white/90 dark:bg-black/80 backdrop-blur-lg shadow-lg border border-gray-200 dark:border-gray-800 animate-scale-in",
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <CloudSun className="text-ocean-600 dark:text-ocean-300" size={20} />
          <CardTitle className="text-xl">Weather Conditions</CardTitle>
        </div>
        <CardDescription>Current maritime weather information</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">
            Loading weather data...
          </div>
        ) : (
          <>
            {currentWeather && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-muted-foreground">Current Weather</h3>
                  <Badge variant="outline" className="text-xs bg-ocean-50 text-ocean-600 dark:bg-ocean-900 dark:text-ocean-300">
                    {currentWeather.description}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-marine-light dark:bg-ocean-900/30 rounded-lg text-center">
                    <div className="flex flex-col items-center">
                      <div className="text-ocean-600 dark:text-ocean-300 mb-1">
                        <CloudSun size={18} />
                      </div>
                      <div className="text-xs text-muted-foreground">Temperature</div>
                      <div className="text-lg font-medium text-ocean-800 dark:text-ocean-100">
                        {currentWeather.temperature}°C
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-marine-light dark:bg-ocean-900/30 rounded-lg text-center">
                    <div className="flex flex-col items-center">
                      <div className="text-ocean-600 dark:text-ocean-300 mb-1">
                        <Wind size={18} />
                      </div>
                      <div className="text-xs text-muted-foreground">Wind</div>
                      <div className="text-lg font-medium text-ocean-800 dark:text-ocean-100">
                        {currentWeather.windSpeed} km/h
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-marine-light dark:bg-ocean-900/30 rounded-lg text-center">
                    <div className="flex flex-col items-center">
                      <div className="text-ocean-600 dark:text-ocean-300 mb-1">
                        <Droplets size={18} />
                      </div>
                      <div className="text-xs text-muted-foreground">Waves</div>
                      <div className="text-lg font-medium text-ocean-800 dark:text-ocean-100">
                        {currentWeather.waveHeight}m
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-marine-light dark:bg-ocean-900/30 rounded-lg">
                    <div className="text-xs text-muted-foreground">Visibility</div>
                    <div className="flex items-center gap-1">
                      <Eye size={14} className="text-ocean-600 dark:text-ocean-300" />
                      <span className="text-sm font-medium text-ocean-800 dark:text-ocean-100">
                        {currentWeather.visibility} km
                      </span>
                    </div>
                  </div>
                  <div className="p-2 bg-marine-light dark:bg-ocean-900/30 rounded-lg">
                    <div className="text-xs text-muted-foreground">Precipitation</div>
                    <div className="flex items-center gap-1">
                      <Droplets size={14} className="text-ocean-600 dark:text-ocean-300" />
                      <span className="text-sm font-medium text-ocean-800 dark:text-ocean-100">
                        {currentWeather.precipitation} mm
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {risk && (
              <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium text-muted-foreground">Route Risk Assessment</h3>
                  <Badge className={`text-xs ${getRiskColor(risk.riskLevel)}`}>
                    {risk.riskLevel.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                  <p className="text-sm text-ocean-800 dark:text-ocean-100 mb-2">{risk.description}</p>
                  
                  {risk.recommendations.length > 0 && (
                    <div className="mt-2">
                      <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <AlertTriangle size={12} />
                        <span>Recommendations</span>
                      </h4>
                      <ul className="mt-1 space-y-1">
                        {risk.recommendations.map((rec, index) => (
                          <li key={index} className="text-xs text-ocean-800 dark:text-ocean-100 flex gap-1 items-start">
                            <span className="text-ocean-500 dark:text-ocean-400 mt-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default WeatherOverlay;
