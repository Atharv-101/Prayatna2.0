import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, AlertTriangle } from 'lucide-react';
import { Portal } from '@/components/ui/portal';
import { majorPorts, Port } from '@/data/ports';
import { toast } from '@/components/ui/use-toast';
import { RouteResult } from '@/utils/routeUtils';

declare global {
  interface Window {
    ol: any;
  }
}

interface MapProps {
  onPortClick: (port: Port) => void;
  selectedPorts: {
    start: Port | null;
    end: Port | null;
  };
  routeData: RouteResult | null;
  className?: string;
}

const Map = ({ onPortClick, selectedPorts, routeData, className }: MapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const olMapRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    const loadOpenLayers = async () => {
      try {
        if (window.ol) {
          initializeMap();
          return;
        }

        const olScript = document.createElement('script');
        olScript.src = 'https://cdn.jsdelivr.net/npm/ol@latest/dist/ol.js';
        olScript.async = true;
        
        const olStylesheet = document.createElement('link');
        olStylesheet.rel = 'stylesheet';
        olStylesheet.href = 'https://cdn.jsdelivr.net/npm/ol@latest/ol.css';
        
        document.head.appendChild(olStylesheet);
        
        olScript.onload = () => {
          console.log('OpenLayers loaded successfully');
          initializeMap();
        };
        
        olScript.onerror = () => {
          setMapError('Failed to load map library. Please check your internet connection and refresh the page.');
          console.error('Failed to load OpenLayers');
        };
        
        document.body.appendChild(olScript);
      } catch (error) {
        console.error('Error loading map:', error);
        setMapError('An error occurred while loading the map.');
      }
    };
    
    loadOpenLayers();
    
    return () => {
      if (olMapRef.current) {
        olMapRef.current.setTarget(undefined);
        olMapRef.current = null;
      }
    };
  }, []);

  const initializeMap = () => {
    if (!window.ol || !mapContainerRef.current) {
      console.error('OpenLayers not loaded or map container not found');
      return;
    }
    
    const { Map, View, layer, source, style, Feature, geom } = window.ol;
    
    const osmLayer = new layer.Tile({
      source: new source.OSM({
        attributions: 'OpenStreetMap contributors',
      }),
      visible: true,
      zIndex: 0,
    });
    
    let openSeaMapLayer;
    try {
      openSeaMapLayer = new layer.Tile({
        source: new source.XYZ({
          url: 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
          attributions: 'OpenSeaMap contributors',
          crossOrigin: 'anonymous',
        }),
        visible: true,
        zIndex: 1,
      });
    } catch (error) {
      console.error('Failed to load OpenSeaMap layer:', error);
      toast({
        title: "Warning",
        description: "Sea map layer couldn't be loaded. Basic map will be used instead.",
        variant: "destructive",
      });
    }
    
    const portsSource = new source.Vector();
    const portsLayer = new layer.Vector({
      source: portsSource,
      zIndex: 2,
    });
    
    const routesSource = new source.Vector();
    const routesLayer = new layer.Vector({
      source: routesSource,
      zIndex: 3,
    });
    
    const selectedPortsSource = new source.Vector();
    const selectedPortsLayer = new layer.Vector({
      source: selectedPortsSource,
      zIndex: 4,
    });
    
    const map = new Map({
      target: mapContainerRef.current,
      layers: [
        osmLayer,
        ...(openSeaMapLayer ? [openSeaMapLayer] : []),
        portsLayer,
        routesLayer,
        selectedPortsLayer,
      ],
      view: new View({
        center: [0, 30],
        zoom: 2,
        maxZoom: 18,
        minZoom: 2,
        projection: 'EPSG:4326',
      }),
    });
    
    majorPorts.forEach(port => {
      const portFeature = new Feature({
        geometry: new geom.Point(port.coordinates),
        name: port.name,
        port: port,
      });
      
      portsSource.addFeature(portFeature);
    });
    
    portsLayer.setStyle(feature => {
      const port = feature.get('port');
      const size = port ? port.size : 'small';
      
      let radius;
      switch (size) {
        case 'large':
          radius = 5;
          break;
        case 'medium':
          radius = 4;
          break;
        default:
          radius = 3;
      }
      
      return new style.Style({
        image: new style.Circle({
          radius,
          fill: new style.Fill({
            color: 'rgba(10, 37, 64, 0.8)',
          }),
          stroke: new style.Stroke({
            color: 'rgba(255, 255, 255, 0.8)',
            width: 1,
          }),
        }),
      });
    });
    
    map.on('click', event => {
      const feature = map.forEachFeatureAtPixel(event.pixel, feature => feature);
      
      if (feature && feature.get('port')) {
        const port = feature.get('port');
        onPortClick(port);
      }
    });
    
    map.on('pointermove', event => {
      const pixel = map.getEventPixel(event.originalEvent);
      const hit = map.hasFeatureAtPixel(pixel);
      mapContainerRef.current.style.cursor = hit ? 'pointer' : '';
    });
    
    olMapRef.current = map;
    setMapLoaded(true);
  };

  useEffect(() => {
    if (!mapLoaded || !olMapRef.current) return;
    
    const { Feature, geom, style } = window.ol;
    const selectedPortsSource = olMapRef.current.getLayers().getArray()[4].getSource();
    
    selectedPortsSource.clear();
    
    if (selectedPorts.start) {
      const startFeature = new Feature({
        geometry: new geom.Point(selectedPorts.start.coordinates),
        port: selectedPorts.start,
        type: 'start',
      });
      
      startFeature.setStyle(new style.Style({
        image: new style.Circle({
          radius: 8,
          fill: new style.Fill({
            color: 'rgba(0, 123, 255, 0.9)',
          }),
          stroke: new style.Stroke({
            color: 'rgba(255, 255, 255, 0.8)',
            width: 2,
          }),
        }),
        text: new style.Text({
          text: 'Origin',
          offsetY: -15,
          fill: new style.Fill({
            color: 'rgba(0, 123, 255, 1)',
          }),
          stroke: new style.Stroke({
            color: 'rgba(255, 255, 255, 0.8)',
            width: 3,
          }),
        }),
      }));
      
      selectedPortsSource.addFeature(startFeature);
    }
    
    if (selectedPorts.end) {
      const endFeature = new Feature({
        geometry: new geom.Point(selectedPorts.end.coordinates),
        port: selectedPorts.end,
        type: 'end',
      });
      
      endFeature.setStyle(new style.Style({
        image: new style.Circle({
          radius: 8,
          fill: new style.Fill({
            color: 'rgba(0, 123, 255, 0.9)',
          }),
          stroke: new style.Stroke({
            color: 'rgba(255, 255, 255, 0.8)',
            width: 2,
          }),
        }),
        text: new style.Text({
          text: 'Destination',
          offsetY: -15,
          fill: new style.Fill({
            color: 'rgba(0, 123, 255, 1)',
          }),
          stroke: new style.Stroke({
            color: 'rgba(255, 255, 255, 0.8)',
            width: 3,
          }),
        }),
      }));
      
      selectedPortsSource.addFeature(endFeature);
    }
    
    if (selectedPorts.start && selectedPorts.end) {
      const extent = selectedPortsSource.getExtent();
      olMapRef.current.getView().fit(extent, {
        padding: [50, 50, 50, 50],
        duration: 1000,
      });
    }
  }, [selectedPorts, mapLoaded]);

  useEffect(() => {
    if (!mapLoaded || !olMapRef.current || !routeData) return;
    
    const { Feature, geom, style } = window.ol;
    const routesSource = olMapRef.current.getLayers().getArray()[3].getSource();
    
    routesSource.clear();
    
    if (routeData.waypoints && routeData.waypoints.length > 1) {
      // Create the main route line with all waypoints
      const mainRouteFeature = new Feature({
        geometry: new geom.LineString(routeData.waypoints),
      });
      
      mainRouteFeature.setStyle(new style.Style({
        stroke: new style.Stroke({
          color: 'rgba(0, 123, 255, 0.8)',
          width: 3,
          lineDash: undefined,
          lineCap: 'round',
          lineJoin: 'round'
        }),
      }));
      
      routesSource.addFeature(mainRouteFeature);
      
      // Add intermediate waypoints
      routeData.waypoints.forEach((waypoint, index) => {
        if (index > 0 && index < routeData.waypoints.length - 1) {
          const waypointFeature = new Feature({
            geometry: new geom.Point(waypoint),
            properties: {
              index,
              type: 'waypoint'
            }
          });
          
          waypointFeature.setStyle(new style.Style({
            image: new style.Circle({
              radius: 3,
              fill: new style.Fill({
                color: 'rgba(0, 123, 255, 0.6)',
              }),
              stroke: new style.Stroke({
                color: 'rgba(255, 255, 255, 0.8)',
                width: 1,
              }),
            }),
          }));
          
          routesSource.addFeature(waypointFeature);
        }
      });
      
      // Add checkpoints with labels
      if (routeData.journeyDetails && routeData.journeyDetails.checkpoints) {
        routeData.journeyDetails.checkpoints.forEach((checkpoint, index) => {
          if (index > 0 && index < routeData.journeyDetails.checkpoints.length - 1) {
            const checkpointFeature = new Feature({
              geometry: new geom.Point(checkpoint.position),
              properties: {
                index,
                time: checkpoint.estimatedTime,
                distance: checkpoint.distance,
                type: 'checkpoint'
              }
            });
            
            checkpointFeature.setStyle(new style.Style({
              image: new style.Circle({
                radius: 5,
                fill: new style.Fill({
                  color: 'rgba(0, 123, 255, 0.8)',
                }),
                stroke: new style.Stroke({
                  color: 'rgba(255, 255, 255, 0.8)',
                  width: 2,
                }),
              }),
              text: new style.Text({
                text: `${checkpoint.estimatedTime}\n${checkpoint.distance}km`,
                offsetY: -15,
                textAlign: 'center',
                textBaseline: 'bottom',
                font: '12px sans-serif',
                fill: new style.Fill({
                  color: 'rgba(0, 123, 255, 1)',
                }),
                stroke: new style.Stroke({
                  color: 'rgba(255, 255, 255, 0.8)',
                  width: 3,
                }),
              }),
            }));
            
            routesSource.addFeature(checkpointFeature);
          }
        });
      }
      
      // Fit the view to show the entire route
      const extent = routesSource.getExtent();
      olMapRef.current.getView().fit(extent, {
        padding: [50, 50, 50, 50],
        duration: 1000,
        maxZoom: 12 // Limit maximum zoom level
      });
    }
  }, [routeData, mapLoaded]);

  const handleZoomIn = () => {
    if (olMapRef.current) {
      const view = olMapRef.current.getView();
      const zoom = view.getZoom();
      view.animate({ zoom: zoom + 1, duration: 250 });
    }
  };

  const handleZoomOut = () => {
    if (olMapRef.current) {
      const view = olMapRef.current.getView();
      const zoom = view.getZoom();
      view.animate({ zoom: zoom - 1, duration: 250 });
    }
  };

  return (
    <div className={cn("relative w-full h-full", className)}>
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
          <div className="bg-card p-4 rounded-lg shadow-lg max-w-md text-center">
            <AlertTriangle className="mx-auto mb-2 text-destructive" size={32} />
            <h3 className="text-lg font-medium mb-2">Map Error</h3>
            <p className="text-muted-foreground mb-4">{mapError}</p>
            <Button onClick={() => window.location.reload()}>Refresh Page</Button>
          </div>
        </div>
      )}
      
      <div 
        ref={mapContainerRef} 
        className="w-full h-full rounded-lg overflow-hidden" 
      />
      
      {mapLoaded && !mapError && (
        <Portal>
          <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-sm shadow-sm hover:shadow"
              onClick={handleZoomIn}
            >
              <ZoomIn size={18} />
              <span className="sr-only">Zoom In</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-sm shadow-sm hover:shadow"
              onClick={handleZoomOut}
            >
              <ZoomOut size={18} />
              <span className="sr-only">Zoom Out</span>
            </Button>
          </div>
        </Portal>
      )}
    </div>
  );
};

export default Map;

