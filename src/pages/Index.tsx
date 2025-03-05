import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import Navbar from '@/components/Navbar';
import Map from '@/components/Map';
import PortInfo from '@/components/PortInfo';
import RouteCalculator from '@/components/RouteCalculator';
import WeatherOverlay from '@/components/WeatherOverlay';
import { Port, searchPorts, majorPorts } from '@/data/ports';
import { RouteResult } from '@/utils/routeUtils';
import { cn } from '@/lib/utils';

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
      <div className="flex-1 pt-16 relative overflow-hidden">
        {/* Map Component */}
        <Map 
          onPortClick={handlePortClick}
          selectedPorts={{ start: startPort, end: endPort }}
          routeData={routeData?.route || null}
          className="h-full w-full absolute inset-0"
        />
        
        {/* Mobile Toggle Button */}
        {isMobileView && activePanel && (
          <button
            onClick={togglePanelMinimize}
            className="absolute top-4 right-4 z-30 bg-white/90 dark:bg-black/80 backdrop-blur-sm p-2 rounded-full shadow-md"
          >
            {isPanelMinimized ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            )}
          </button>
        )}
        
        {/* Side Panels Container */}
        <div className={cn(
          "absolute z-20 transition-all duration-300 transform",
          isMobileView 
            ? isPanelMinimized
              ? "bottom-0 left-0 right-0 translate-y-[calc(100%-60px)]"
              : "bottom-0 left-0 right-0 max-h-[70vh] overflow-auto px-4 pb-4" 
            : "top-4 left-4 max-h-[calc(100vh-5rem)] overflow-auto"
        )}>
          {/* Mobile Panel Handle */}
          {isMobileView && activePanel && (
            <div 
              className="h-8 bg-white/90 dark:bg-black/80 rounded-t-lg flex items-center justify-center cursor-pointer"
              onClick={togglePanelMinimize}
            >
              <div className="w-16 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
            </div>
          )}
          
          {/* Panel Content */}
          <div className={cn(
            "space-y-4",
            isMobileView && "px-2"
          )}>
            {/* Port Info Panel */}
            {selectedPort && activePanel === 'ports' && (
              <PortInfo 
                port={selectedPort}
                onClose={() => setSelectedPort(null)}
                onSetAsStart={handleSetStartPort}
                onSetAsEnd={handleSetEndPort}
              />
            )}
            
            {/* Route Calculator Panel */}
            {activePanel === 'routes' && (
              <RouteCalculator 
                startPort={startPort}
                endPort={endPort}
                onCalculate={handleCalculateRoute}
                className="animate-scale-in"
              />
            )}
            
            {/* Weather Panel */}
            {activePanel === 'weather' && routeData && (
              <WeatherOverlay 
                routeWaypoints={routeData.route.waypoints}
                centerCoordinates={mapCenter}
                className="animate-scale-in"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
