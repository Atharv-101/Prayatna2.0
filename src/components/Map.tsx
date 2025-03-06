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
      // Helper function to check if a point is in water
      const isInWater = (lon: number, lat: number): boolean => {
        // Safety margin in degrees (approximately 30km)
        const SAFETY_MARGIN = 0.3;
        
        // Additional safety check for points too close to shore
        const MIN_SHORE_DISTANCE = 0.2;

        // Indian Subcontinent - More detailed coastline
        const landMasses = [
          [[72.8, 19.2], [72.5, 19], [72.8, 18.9], // Mumbai coast
           [73, 18], [73.5, 17], [74, 16], [74.5, 15], [75, 14], [75.5, 13], 
           [76, 12], [76.5, 11], [77, 10], [77.5, 9], [78, 8.5], // West coast detail
           [79, 8], [79.5, 7.5], [80, 7], [80.5, 6.5], // Southern tip
           [81, 7], [81.5, 8], [82, 9], [82.5, 10], [83, 11], 
           [83.5, 12], [84, 13], [84.5, 14], [85, 15], // East coast detail
           [85.5, 16], [86, 17], [86.5, 18], [87, 19], [88, 20], 
           [89, 21], [90, 22], [91, 22]], // Up to Bangladesh

          // Sri Lanka - More detailed
          [[79.5, 5.8], [79.8, 6], [80, 6.2], [80.2, 6.5], [80.5, 7],
           [81, 7.5], [81.5, 7.8], [81.8, 8], [81.9, 8.5], [81.7, 9],
           [81.5, 9.2], [81, 9.5], [80.5, 9.3], [80, 9], [79.8, 8.5],
           [79.5, 8], [79.3, 7.5], [79.2, 6.8], [79.3, 6.2]],
        ];

        // Known safe shipping lanes with more detail
        const shippingLanes = [
          // Mumbai to Gulf route - Southern path
          [[72.8, 18.9], [72.5, 17], [73, 15], [73.5, 13], [74, 12], 
           [75, 11], [76, 10], [77, 9], [78, 8], [79, 7.5], 
           [80, 7], [81, 6.5], [82, 6], [83, 6], [84, 6], 
           [85, 6], [86, 6], [87, 6], [88, 6], [89, 6],
           [90, 6], [91, 6], [92, 6], [93, 6], [94, 6],
           [95, 5], [96, 4], [97, 3], [98, 2], [99, 1.5],
           [100, 1.3], [101, 1.2], [102, 1.2], [103, 1.3], [103.8, 1.3]], // To Singapore

          // Alternative deeper southern route
          [[72.8, 18.9], [73, 16], [74, 14], [75, 12], [76, 10],
           [77, 8], [78, 7], [79, 6], [80, 5], [81, 4],
           [82, 4], [83, 4], [84, 4], [85, 4], [90, 4],
           [95, 3], [100, 2], [103.8, 1.3]]
        ];

        // Check shipping lanes first with increased tolerance
        for (const lane of shippingLanes) {
          for (let i = 0; i < lane.length - 1; i++) {
            const start: [number, number] = [lane[i][0], lane[i][1]];
            const end: [number, number] = [lane[i + 1][0], lane[i + 1][1]];
            const dist = pointToLineDistance([lon, lat] as [number, number], start, end);
            if (dist < 1.5) { // Increased tolerance for shipping lanes
              // Additional check to ensure we're not too close to shore
              let tooCloseToShore = false;
              for (const landMass of landMasses) {
                for (let j = 0; j < landMass.length; j++) {
                  const point = landMass[j];
                  const dx = lon - point[0];
                  const dy = lat - point[1];
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  if (dist < MIN_SHORE_DISTANCE) {
                    tooCloseToShore = true;
                    break;
                  }
                }
                if (tooCloseToShore) break;
              }
              if (!tooCloseToShore) return true;
            }
          }
        }

        // Check against land masses with safety margin
        for (const landMass of landMasses) {
          // Add safety margin to land mass
          const expandedLandMass = landMass.map(point => {
            return [point[0], point[1]] as [number, number];
          });

          let inside = false;
          for (let i = 0, j = expandedLandMass.length - 1; i < expandedLandMass.length; j = i++) {
            const xi = expandedLandMass[i][0], yi = expandedLandMass[i][1];
            const xj = expandedLandMass[j][0], yj = expandedLandMass[j][1];
            
            // Check if point is within safety margin of land
            const distToSegment = pointToLineDistance(
              [lon, lat] as [number, number], 
              [xi, yi] as [number, number], 
              [xj, yj] as [number, number]
            );
            if (distToSegment < SAFETY_MARGIN) {
              return false;
            }
            
            if (((yi > lat) !== (yj > lat)) &&
                (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
              inside = !inside;
            }
          }
          if (inside) return false;
        }
        return true;
      };

      // Helper function to calculate point to line distance
      const pointToLineDistance = (point: [number, number], lineStart: [number, number], lineEnd: [number, number]): number => {
        const x = point[0];
        const y = point[1];
        const x1 = lineStart[0];
        const y1 = lineStart[1];
        const x2 = lineEnd[0];
        const y2 = lineEnd[1];
        
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        
        let param = -1;
        if (len_sq !== 0) {
          param = dot / len_sq;
        }
        
        let xx, yy;
        
        if (param < 0) {
          xx = x1;
          yy = y1;
        } else if (param > 1) {
          xx = x2;
          yy = y2;
        } else {
          xx = x1 + param * C;
          yy = y1 + param * D;
        }
        
        const dx = x - xx;
        const dy = y - yy;
        
        return Math.sqrt(dx * dx + dy * dy);
      };

      // Enhance createCurvedPath function
      const createCurvedPath = (points: [number, number][]): [number, number][] => {
        if (points.length < 2) return [];
        
        const coordinates: [number, number][] = [];
        
        for (let i = 0; i < points.length - 1; i++) {
          const start = points[i];
          const end = points[i + 1];
          
          // Calculate direct distance
          const dx = end[0] - start[0];
          const dy = end[1] - start[1];
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // If distance is large, add intermediate waypoints
          if (distance > 5) {
            const steps = Math.ceil(distance / 3); // One point every ~3 degrees
            let validPath = false;
            let attempts = 0;
            const maxAttempts = 12; // Increased attempts
            
            while (!validPath && attempts < maxAttempts) {
              const testCoords: [number, number][] = [];
              validPath = true;
              
              // Try different curve orientations
              const angleOffset = (Math.PI / 6) * (attempts % 2 === 0 ? 1 : -1) * (Math.floor(attempts / 2) + 1);
              const controlDist = Math.min(distance / 4, 4);
              
              const angle = Math.atan2(dy, dx);
              const ctrl1: [number, number] = [
                start[0] + controlDist * Math.cos(angle + angleOffset),
                start[1] + controlDist * Math.sin(angle + angleOffset)
              ];
              
              if (i === 0) {
                testCoords.push([...start]);
              }
              
              // Generate more points for smoother curves
              for (let step = 0; step <= steps; step++) {
                const t = step / steps;
                const u = 1 - t;
                
                const x = u * u * start[0] + 2 * u * t * ctrl1[0] + t * t * end[0];
                const y = u * u * start[1] + 2 * u * t * ctrl1[1] + t * t * end[1];
                
                // Validate each point
                if (!isInWater(x, y)) {
                  validPath = false;
                  break;
                }
                
                testCoords.push([x, y] as [number, number]);
              }
              
              if (validPath) {
                coordinates.push(...testCoords);
                break;
              }
              
              attempts++;
            }
            
            // If no valid curved path, try straight line with water point finding
            if (!validPath) {
              if (i === 0) {
                coordinates.push([...start]);
              }
              
              for (let step = 1; step <= steps; step++) {
                const t = step / steps;
                let x = start[0] + dx * t;
                let y = start[1] + dy * t;
                
                // Find nearest water point if needed
                if (!isInWater(x, y)) {
                  let found = false;
                  for (let radius = 0.2; radius <= 2; radius += 0.2) {
                    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
                      const testX = x + radius * Math.cos(angle);
                      const testY = y + radius * Math.sin(angle);
                      if (isInWater(testX, testY)) {
                        x = testX;
                        y = testY;
                        found = true;
                        break;
                      }
                    }
                    if (found) break;
                  }
                }
                
                coordinates.push([x, y] as [number, number]);
              }
            }
          } else {
            // For short distances, use direct line with validation
            if (i === 0) {
              coordinates.push([...start]);
            }
            coordinates.push([...end]);
          }
        }
        
        return coordinates;
      };
      
      // Create the main route with curved path
      const curvedCoordinates = createCurvedPath(routeData.waypoints);
      const mainRouteFeature = new Feature({
        geometry: new geom.LineString(curvedCoordinates)
      });
      
      // Enhanced route style with gradient and glow effect
      mainRouteFeature.setStyle(new style.Style({
        stroke: new style.Stroke({
          color: 'rgba(0, 123, 255, 0.8)',
          width: 4,
          lineCap: 'round',
          lineJoin: 'round',
          lineDash: undefined
        }),
        // Add glow effect
        fill: new style.Fill({
          color: 'rgba(0, 123, 255, 0.2)'
        })
      }));
      
      routesSource.addFeature(mainRouteFeature);
      
      // Add waypoint markers with improved styling
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
              radius: 4,
              fill: new style.Fill({
                color: 'rgba(0, 123, 255, 0.8)'
              }),
              stroke: new style.Stroke({
                color: 'rgba(255, 255, 255, 0.9)',
                width: 2
              })
            })
          }));
          
          routesSource.addFeature(waypointFeature);
        }
      });
      
      // Add checkpoints with enhanced styling
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
                radius: 6,
                fill: new style.Fill({
                  color: 'rgba(0, 123, 255, 0.9)'
                }),
                stroke: new style.Stroke({
                  color: 'rgba(255, 255, 255, 1)',
                  width: 2
                })
              }),
              text: new style.Text({
                text: `${checkpoint.estimatedTime}\n${checkpoint.distance}km`,
                offsetY: -20,
                textAlign: 'center',
                textBaseline: 'bottom',
                font: '12px sans-serif',
                fill: new style.Fill({
                  color: 'rgba(0, 123, 255, 1)'
                }),
                stroke: new style.Stroke({
                  color: 'rgba(255, 255, 255, 0.9)',
                  width: 3
                }),
                padding: [5, 5, 5, 5]
              })
            }));
            
            routesSource.addFeature(checkpointFeature);
          }
        });
      }
      
      // Fit view to show entire route with padding
      const extent = routesSource.getExtent();
      olMapRef.current.getView().fit(extent, {
        padding: [50, 50, 50, 50],
        duration: 1000,
        maxZoom: 12
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

