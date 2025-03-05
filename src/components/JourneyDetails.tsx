
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Anchor, Calendar, Compass, Droplet, Wind, DollarSign } from 'lucide-react';
import { RouteResult } from '@/utils/routeUtils';

interface JourneyDetailsProps {
  routeData: RouteResult | null;
  className?: string;
}

const JourneyDetails = ({ routeData, className }: JourneyDetailsProps) => {
  if (!routeData) return null;

  const { distance, duration, fuelConsumption, journeyDetails, weatherRisk } = routeData;
  
  // Calculate percentage of journey completed (for demo purposes always 0)
  const journeyProgress = 0;
  
  // Get weather risk color
  const getRiskColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
    }
  };

  return (
    <Card className={`bg-white/90 dark:bg-black/80 backdrop-blur-lg shadow-lg overflow-hidden ${className}`}>
      <CardHeader className="bg-ocean-700 dark:bg-ocean-900 text-white pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Compass className="h-5 w-5" />
            Journey Details
          </CardTitle>
          <Badge 
            variant="outline" 
            className={getRiskColor(weatherRisk.level)}
          >
            {weatherRisk.level.toUpperCase()} RISK
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="space-y-4">
          {/* Journey Summary */}
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div className="flex items-center gap-2">
              <Anchor className="h-4 w-4 text-ocean-600" />
              <div>
                <p className="text-muted-foreground">Distance</p>
                <p className="font-medium">{distance} km</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-ocean-600" />
              <div>
                <p className="text-muted-foreground">Duration</p>
                <p className="font-medium">{duration}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Droplet className="h-4 w-4 text-ocean-600" />
              <div>
                <p className="text-muted-foreground">Fuel</p>
                <p className="font-medium">{fuelConsumption} tons</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-ocean-600" />
              <div>
                <p className="text-muted-foreground">Est. Cost</p>
                <p className="font-medium">${journeyDetails.fuelCostEstimate.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          {/* Arrival Time */}
          <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded-md flex items-center gap-2">
            <Calendar className="h-5 w-5 text-ocean-600" />
            <div>
              <p className="text-xs text-muted-foreground">Estimated Arrival</p>
              <p className="text-sm font-medium">{journeyDetails.estimatedArrival}</p>
            </div>
          </div>
          
          {/* Weather Notice */}
          {weatherRisk.description && (
            <div className="border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950 p-2 pl-3 text-sm">
              <p className="font-medium text-orange-800 dark:text-orange-200">{weatherRisk.description}</p>
              {weatherRisk.recommendations.length > 0 && (
                <ul className="mt-1 text-xs text-orange-700 dark:text-orange-300 pl-4 list-disc">
                  {weatherRisk.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          
          {/* Route Checkpoints */}
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Checkpoints</h4>
            <div className="relative">
              <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-ocean-200 dark:bg-ocean-800 z-0"></div>
              {journeyDetails.checkpoints.map((checkpoint, idx) => (
                <div key={idx} className="relative z-10 pl-6 py-1 flex items-center text-xs">
                  <div 
                    className={`absolute left-0 w-4 h-4 rounded-full border-2 
                                ${idx === 0 
                                  ? 'bg-green-500 border-green-600' 
                                  : idx === journeyDetails.checkpoints.length - 1 
                                  ? 'bg-red-500 border-red-600' 
                                  : 'bg-ocean-100 dark:bg-ocean-900 border-ocean-300 dark:border-ocean-700'}`}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between flex-wrap">
                      <span className="font-medium">
                        {idx === 0 
                          ? 'Departure' 
                          : idx === journeyDetails.checkpoints.length - 1 
                          ? 'Arrival' 
                          : `Checkpoint ${idx}`}
                      </span>
                      <span>{checkpoint.estimatedTime}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground mt-0.5 flex-wrap">
                      <span>{checkpoint.distance} km</span>
                      {checkpoint.weatherForecast && (
                        <span className="flex items-center gap-1">
                          <Wind className="h-3 w-3" />
                          {checkpoint.weatherForecast.windSpeed} km/h
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JourneyDetails;
