import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import Navbar from '@/components/Navbar';
import Map from '@/components/Map';
import PortInfo from '@/components/PortInfo';
import RouteCalculator from '@/components/RouteCalculator';
import WeatherOverlay from '@/components/WeatherOverlay';
import TravelHistory from '@/components/TravelHistory';
import { Port, searchPorts, majorPorts } from '@/data/ports';
import { RouteResult } from '@/utils/routeUtils';
import { cn } from '@/lib/utils';
import { ChevronUp } from 'lucide-react';

const Index = () => {
  const { toast } = useToast();
  
  // State for UI
  const [activePanel, setActivePanel] = useState<'ports' | 'routes' | 'weather' | null>('routes');
  const [selectedPort, setSelectedPort] = useState<Port | null>(null);
  
  // State for route planning
  const [startPort, setStartPort] = useState<Port | null>(null);
  const [endPort, setEndPort] = useState<Port | null>(null);
  const [routeData, setRouteData] = useState<{
    route: RouteResult;
    startPort: Port;
    endPort: Port;
    shipType: string;
    shipSpeed: number;
  } | null>(null);
  
  // State for map
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 30]);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);

  // Check for mobile view
  useEffect(() => {
    const checkMobileView = () => {
      const mobile = window.innerWidth < 768;
      setIsMobileView(mobile);
      if (mobile) {
        setIsPanelMinimized(true);
      }
    };
    
    checkMobileView();
    window.addEventListener('resize', checkMobileView);
    
    return () => {
      window.removeEventListener('resize', checkMobileView);
    };
  }, []);

  // Handle port search
  const handlePortSearch = (searchTerm: string) => {
    const results = searchPorts(searchTerm);
    if (results.length > 0) {
      toast({
        title: `Found ${results.length} ports`,
        description: `Showing results for "${searchTerm}"`,
      });
      
      // Focus the map on the first result
      setSelectedPort(results[0]);
      setMapCenter(results[0].coordinates);
    } else {
      toast({
        title: "No ports found",
        description: `No results for "${searchTerm}"`,
        variant: "destructive",
      });
    }
  };

  // Handle port click on map
  const handlePortClick = (port: Port) => {
    setSelectedPort(port);
    setActivePanel('ports');
    setIsPanelMinimized(false);
  };

  // Handle setting start port
  const handleSetStartPort = (port: Port) => {
    setStartPort(port);
    toast({
      title: "Origin Port Set",
      description: `${port.name} set as the origin port`,
    });
    
    // If end port is already set, open route calculator
    if (endPort) {
      setActivePanel('routes');
    }
    
    // Close port info panel
    setSelectedPort(null);
  };

  // Handle setting end port
  const handleSetEndPort = (port: Port) => {
    setEndPort(port);
    toast({
      title: "Destination Port Set",
      description: `${port.name} set as the destination port`,
    });
    
    // If start port is already set, open route calculator
    if (startPort) {
      setActivePanel('routes');
    }
    
    // Close port info panel
    setSelectedPort(null);
  };

  // Handle route calculation
  const handleCalculateRoute = (data: any) => {
    setRouteData(data);
    
    // Show success toast with more journey details
    toast({
      title: "Route Calculated",
      description: `${data.route.distance}km journey from ${data.startPort.name} to ${data.endPort.name}`,
    });
    
    // Stay on routes panel to show journey details
    setActivePanel('routes');
  };

  // Handle UI panel navigation
  const handleNavigation = (panel: 'ports' | 'routes' | 'weather') => {
    setActivePanel(prev => prev === panel ? null : panel);
    setIsPanelMinimized(false);
  };

  // Toggle panel minimization on mobile
  const togglePanelMinimize = () => {
    setIsPanelMinimized(!isPanelMinimized);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden">
      {/* Navigation Bar */}
      <Navbar 
        onSearchPorts={handlePortSearch}
        onRouteClick={() => handleNavigation('routes')}
        onPortsClick={() => handleNavigation('ports')}
        onWeatherClick={() => handleNavigation('weather')}
      />
      
      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Map Component */}
        <Map
          onPortClick={handlePortClick}
          selectedPorts={{ start: startPort, end: endPort }}
          routeData={routeData?.route || null}
          className="h-full w-full"
        />
        
        {/* Side Panel */}
        <div className={cn(
          "absolute top-4 right-4 flex flex-col gap-4 transition-all duration-300 max-h-[90vh] overflow-y-auto",
          isMobileView && isPanelMinimized ? "translate-y-[-90%]" : ""
        )}>
          {/* Route Calculator */}
          {activePanel === 'routes' && (
            <>
              <RouteCalculator
                startPort={startPort}
                endPort={endPort}
                onCalculate={handleCalculateRoute}
              />
              <TravelHistory className="mt-4" />
            </>
          )}
          
          {/* Port Information */}
          {activePanel === 'ports' && selectedPort && (
            <PortInfo 
              port={selectedPort}
              onClose={() => setSelectedPort(null)}
              onSetAsStart={handleSetStartPort}
              onSetAsEnd={handleSetEndPort}
            />
          )}
          
          {/* Weather Overlay Controls */}
          {activePanel === 'weather' && (
            <WeatherOverlay 
              centerCoordinates={mapCenter}
              routeWaypoints={routeData?.route?.waypoints || []}
            />
          )}
        </div>
        
        {/* Mobile Panel Toggle */}
        {isMobileView && activePanel && (
          <button
            onClick={togglePanelMinimize}
            className="absolute bottom-4 right-4 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg"
          >
            <ChevronUp
              className={cn(
                "transform transition-transform",
                isPanelMinimized ? "rotate-180" : ""
              )}
            />
          </button>
        )}
      </div>
    </div>
  );
};

export default Index;
