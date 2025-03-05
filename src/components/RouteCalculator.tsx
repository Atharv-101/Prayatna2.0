
import { useState, useEffect } from 'react';
import { Ship, Navigation, Calendar, Anchor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { majorPorts, Port } from '@/data/ports';
import { calculateOptimalRoute, RouteResult } from '@/utils/routeUtils';
import { cn } from '@/lib/utils';
import JourneyDetails from './JourneyDetails';
import RouteTimeline from './RouteTimeline';

interface RouteCalculatorProps {
  startPort: Port | null;
  endPort: Port | null;
  onCalculate: (routeData: any) => void;
  className?: string;
}

const RouteCalculator = ({ startPort, endPort, onCalculate, className }: RouteCalculatorProps) => {
  const [shipType, setShipType] = useState('container');
  const [shipSpeed, setShipSpeed] = useState('14');
  const [considerWeather, setConsiderWeather] = useState(true);
  const [fuelEfficient, setFuelEfficient] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculatedRoute, setCalculatedRoute] = useState<RouteResult | null>(null);
  const [departureDate, setDepartureDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isMobileView, setIsMobileView] = useState(false);
  const [activeTab, setActiveTab] = useState("route");

  // Check for mobile view
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    
    return () => {
      window.removeEventListener('resize', checkMobileView);
    };
  }, []);

  const handleCalculation = async () => {
    if (!startPort || !endPort) return;
    
    setIsCalculating(true);
    
    try {
      const route = await calculateOptimalRoute(
        startPort.coordinates,
        endPort.coordinates,
        {
          shipSpeed: parseFloat(shipSpeed),
          departureDate: new Date(departureDate),
          considerWeather,
          fuelEfficient,
          shipType
        }
      );
      
      setCalculatedRoute(route);
      setActiveTab("timeline");
      
      onCalculate({
        route,
        startPort,
        endPort,
        shipType,
        shipSpeed: parseFloat(shipSpeed)
      });
    } catch (error) {
      console.error('Route calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className={cn("space-y-4", isMobileView ? "w-full" : "")}>
      <Card className={cn(
        "w-full bg-white/95 dark:bg-black/90 backdrop-blur-lg shadow-lg border border-gray-200 dark:border-gray-800",
        isMobileView ? "max-w-full" : "max-w-md",
        className
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Navigation className="text-blue-600 dark:text-blue-400" size={20} />
            <CardTitle className="text-xl">Sea Route Calculator</CardTitle>
          </div>
        </CardHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mx-4">
            <TabsTrigger value="route">Route Settings</TabsTrigger>
            <TabsTrigger value="timeline" disabled={!calculatedRoute}>Journey Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="route" className="m-0">
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <div className="rounded-md border p-3">
                    <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">PORT OF ORIGIN</label>
                    {startPort ? (
                      <div className="flex items-center gap-2 mt-1">
                        <Anchor className="text-blue-500" size={16} />
                        <div>
                          <span className="font-semibold text-sm">{startPort.name}</span>
                          <span className="text-xs text-muted-foreground ml-1">{startPort.country}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">No origin port selected</div>
                    )}
                  </div>
                  
                  <div className="rounded-md border p-3">
                    <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">PORT OF DESTINATION</label>
                    {endPort ? (
                      <div className="flex items-center gap-2 mt-1">
                        <Anchor className="text-blue-500" size={16} />
                        <div>
                          <span className="font-semibold text-sm">{endPort.name}</span>
                          <span className="text-xs text-muted-foreground ml-1">{endPort.country}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">No destination port selected</div>
                    )}
                  </div>
                </div>
                
                <div className="rounded-md border p-3">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">TRANSPORTATION BY</label>
                  <div className="flex gap-2 mt-1">
                    <Button size="sm" variant="default" className="bg-blue-500 hover:bg-blue-600">SEA</Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="ship-type" className="text-xs text-muted-foreground uppercase tracking-wider">Ship Type</Label>
                    <Select
                      value={shipType}
                      onValueChange={setShipType}
                    >
                      <SelectTrigger id="ship-type" className="bg-white dark:bg-black">
                        <SelectValue placeholder="Ship Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="container">Container Ship</SelectItem>
                        <SelectItem value="bulk">Bulk Carrier</SelectItem>
                        <SelectItem value="tanker">Tanker</SelectItem>
                        <SelectItem value="cruise">Cruise Ship</SelectItem>
                        <SelectItem value="ferry">Ferry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="ship-speed" className="text-xs text-muted-foreground uppercase tracking-wider">AVERAGE SPEED (knots)</Label>
                    <Input
                      id="ship-speed"
                      type="number"
                      min="1"
                      max="50"
                      value={shipSpeed}
                      onChange={(e) => setShipSpeed(e.target.value)}
                      className="bg-white dark:bg-black"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="departure-date" className="text-xs text-muted-foreground uppercase tracking-wider">Departure Date</Label>
                  <Input
                    id="departure-date"
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="bg-white dark:bg-black mt-1"
                  />
                </div>
                
                <div className="rounded-md border p-3">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">ROUTING MODE</label>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-medium">SAFE</span>
                    <Switch
                      checked={considerWeather}
                      onCheckedChange={setConsiderWeather}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="fuel-efficient" className="text-xs text-muted-foreground uppercase tracking-wider">Fuel Efficient</Label>
                    <p className="text-xs text-muted-foreground">Optimize for minimal fuel consumption</p>
                  </div>
                  <Switch
                    id="fuel-efficient"
                    checked={fuelEfficient}
                    onCheckedChange={setFuelEfficient}
                  />
                </div>
              </div>
            </CardContent>
          </TabsContent>
          
          <TabsContent value="timeline" className="m-0">
            {calculatedRoute && (
              <RouteTimeline routeData={calculatedRoute} />
            )}
          </TabsContent>
        </Tabs>
        
        <CardFooter className="pt-2 pb-4">
          <Button 
            onClick={handleCalculation}
            disabled={!startPort || !endPort || isCalculating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isCalculating ? 'Calculating...' : 'Calculate Route'}
          </Button>
        </CardFooter>
      </Card>
      
      {calculatedRoute && activeTab === "route" && (
        <JourneyDetails 
          routeData={calculatedRoute} 
          className={isMobileView ? "max-w-full" : "max-w-md"} 
        />
      )}
    </div>
  );
};

export default RouteCalculator;
