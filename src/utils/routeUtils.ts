import { calculateDistance, calculateWaypoints } from './mapUtils';
import { getRouteWeatherForecast, getRouteRiskAssessment } from './weatherUtils';

// Route calculation options interface
export interface RouteOptions {
  startPortId: string;
  endPortId: string;
  shipType: string;
  shipSpeed: number; // in knots
  departureDate: Date;
  considerWeather: boolean;
  fuelEfficient: boolean;
}

// Route result interface
export interface RouteResult {
  waypoints: [number, number][]; 
  distance: number; // in km
  duration: string; // formatted time
  fuelConsumption: number; // in tons
  weatherRisk: {
    level: 'low' | 'medium' | 'high';
    description: string;
    recommendations: string[];
  };
  routeType?: string; // Optional field for route alternatives
  // Additional journey details
  journeyDetails: {
    estimatedArrival: string; // formatted date/time
    fuelCostEstimate: number; // in USD
    checkpoints: {
      position: [number, number];
      estimatedTime: string; // formatted date/time
      distance: number; // distance from start in km
      weatherForecast?: {
        description: string;
        temperature: number;
        windSpeed: number;
      };
    }[];
    totalDurationHours: number; // Total duration in hours (for calculations)
  };
}

// Land avoidance data: simplified global coastline coordinates
const landMassCoordinates = [
  // Sample coordinates representing major continents' outlines
  // North America coast
  [[-125, 48], [-123, 49], [-122, 47], [-120, 45], [-118, 40], [-110, 35], [-90, 30], [-85, 25], [-80, 25]],
  // South America coast
  [[-80, 5], [-75, 0], [-70, -10], [-65, -20], [-60, -30], [-70, -40], [-75, -50]],
  // Europe coast
  [[-10, 35], [-5, 40], [0, 45], [5, 50], [10, 55], [15, 60], [20, 65]],
  // Africa coast
  [[0, 30], [10, 20], [20, 10], [30, 0], [40, -10], [35, -20], [20, -30]],
  // Asia coast
  [[40, 40], [50, 50], [60, 60], [70, 55], [80, 50], [90, 40], [100, 30], [110, 20], [120, 10]],
  // Australia coast
  [[115, -20], [120, -25], [130, -30], [140, -35], [150, -30], [145, -25], [135, -15]]
];

// Enhanced implementation for land detection
const isPointNearLand = (lon: number, lat: number): boolean => {
  // Improved land detection algorithm
  for (const coastline of landMassCoordinates) {
    for (let i = 0; i < coastline.length; i++) {
      const [x1, y1] = coastline[i];
      
      // Check if point is near this coastline point
      const distance = Math.sqrt(Math.pow(lon - x1, 2) + Math.pow(lat - y1, 2));
      if (distance < 10) { // 10 degrees is a large safety margin for our simplified model
        return true;
      }
    }
  }
  return false;
};

// Find a sea point near the given coordinates
const findNearestSeaPoint = (lon: number, lat: number): [number, number] => {
  // If not near land, return the original point
  if (!isPointNearLand(lon, lat)) return [lon, lat];
  
  // Try different directions to find open water
  const directions = [
    [1, 0], [1, 1], [0, 1], [-1, 1], 
    [-1, 0], [-1, -1], [0, -1], [1, -1]
  ];
  
  // Start with a small distance and increase if needed
  for (let distance = 2; distance <= 20; distance += 2) {
    for (const [dx, dy] of directions) {
      const newLon = lon + dx * distance;
      const newLat = lat + dy * distance;
      
      // Check if this point is away from land
      if (!isPointNearLand(newLon, newLat)) {
        return [newLon, newLat];
      }
    }
  }
  
  // If all else fails, move point further out to sea
  // In this simplified model, we move further away from the equator and prime meridian
  const lonDirection = lon >= 0 ? 1 : -1;
  const latDirection = lat >= 0 ? 1 : -1;
  return [lon + lonDirection * 20, lat + latDirection * 20];
};

// Create optimized sea route between two points, avoiding land
const createSeaRoute = (
  startLon: number, 
  startLat: number, 
  endLon: number, 
  endLat: number,
  numPoints: number = 8
): [number, number][] => {
  // We'll create a direct route first
  const basicWaypoints = calculateWaypoints(startLon, startLat, endLon, endLat, numPoints);
  const seaWaypoints: [number, number][] = [];
  
  // Always include start and end points (ports)
  seaWaypoints.push([startLon, startLat]);
  
  // Process intermediate waypoints to ensure they're over sea
  for (let i = 1; i < basicWaypoints.length - 1; i++) {
    const [lon, lat] = basicWaypoints[i];
    
    // Check if waypoint is near land
    if (isPointNearLand(lon, lat)) {
      // Find an alternate route through sea
      const seaPoint = findNearestSeaPoint(lon, lat);
      seaWaypoints.push(seaPoint);
    } else {
      seaWaypoints.push([lon, lat]);
    }
  }
  
  // Add the destination
  seaWaypoints.push([endLon, endLat]);
  
  return seaWaypoints;
};

// Calculate optimal route between two ports
export const calculateOptimalRoute = async (
  startCoords: [number, number],
  endCoords: [number, number],
  options: {
    shipSpeed: number;
    departureDate: Date;
    considerWeather: boolean;
    fuelEfficient: boolean;
    shipType: string;
  }
): Promise<RouteResult> => {
  // Use improved sea routing
  const numWaypoints = 6; // Reduced for cleaner direct routes, matching reference image
  const waypoints = createSeaRoute(
    startCoords[0],
    startCoords[1],
    endCoords[0],
    endCoords[1],
    numWaypoints
  );
  
  // Calculate total distance
  let totalDistance = 0;
  for (let i = 1; i < waypoints.length; i++) {
    totalDistance += calculateDistance(
      waypoints[i-1][0],
      waypoints[i-1][1],
      waypoints[i][0],
      waypoints[i][1]
    );
  }
  
  // Calculate duration based on ship speed (knots to km/h conversion)
  const speedKmh = options.shipSpeed * 1.852;
  const durationHours = totalDistance / speedKmh;
  
  // Format duration
  const days = Math.floor(durationHours / 24);
  const hours = Math.floor(durationHours % 24);
  const duration = days > 0 ? `${days}d ${hours}h` : `${hours}h`;
  
  // Calculate fuel consumption (simplified)
  const baseFuelRate = {
    'container': 0.3,
    'bulk': 0.25,
    'tanker': 0.35,
    'cruise': 0.4,
    'ferry': 0.2,
  }[options.shipType.toLowerCase()] || 0.3;
  
  // Apply fuel efficiency modifier if selected
  const fuelRate = options.fuelEfficient ? baseFuelRate * 0.85 : baseFuelRate;
  const fuelConsumption = Math.round(totalDistance * fuelRate);
  
  // Get weather data and risk assessment if requested
  let weatherRisk = {
    level: 'low' as 'low' | 'medium' | 'high',
    description: 'Weather data not considered',
    recommendations: []
  };
  
  if (options.considerWeather) {
    const forecasts = await getRouteWeatherForecast(waypoints, options.departureDate);
    const assessment = getRouteRiskAssessment(forecasts);
    weatherRisk = {
      level: assessment.riskLevel,
      description: assessment.description,
      recommendations: assessment.recommendations
    };
  }

  // Calculate journey details including checkpoints and timing
  const departureTime = new Date(options.departureDate);
  const checkpoints = [];
  let currentDistance = 0;
  const hoursPerCheckpoint = durationHours / (waypoints.length - 1);
  
  // Get weather forecasts for checkpoints if weather is considered
  const checkpointForecasts = options.considerWeather
    ? await getRouteWeatherForecast(waypoints, departureTime)
    : null;
  
  for (let i = 0; i < waypoints.length; i++) {
    if (i > 0) {
      const segmentDistance = calculateDistance(
        waypoints[i-1][0], waypoints[i-1][1],
        waypoints[i][0], waypoints[i][1]
      );
      currentDistance += segmentDistance;
    }
    
    // Calculate estimated time at this checkpoint
    const hoursFromStart = i * hoursPerCheckpoint;
    const checkpointTime = new Date(departureTime.getTime() + hoursFromStart * 60 * 60 * 1000);
    
    // Format time
    const timeStr = checkpointTime.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const checkpoint = {
      position: waypoints[i] as [number, number],
      estimatedTime: timeStr,
      distance: Math.round(currentDistance),
      ...(checkpointForecasts && {
        weatherForecast: {
          description: checkpointForecasts[i]?.description || 'Unknown',
          temperature: checkpointForecasts[i]?.temperature || 0,
          windSpeed: checkpointForecasts[i]?.windSpeed || 0
        }
      })
    };
    
    checkpoints.push(checkpoint);
  }
  
  // Calculate arrival time
  const arrivalTime = new Date(departureTime.getTime() + durationHours * 60 * 60 * 1000);
  const formattedArrivalTime = arrivalTime.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Calculate fuel cost estimate (simplified)
  const fuelPricePerTon = 500; // USD per ton, average price
  const fuelCostEstimate = Math.round(fuelConsumption * fuelPricePerTon);
  
  return {
    waypoints,
    distance: Math.round(totalDistance),
    duration,
    fuelConsumption,
    weatherRisk,
    journeyDetails: {
      estimatedArrival: formattedArrivalTime,
      fuelCostEstimate,
      checkpoints,
      totalDurationHours: durationHours
    }
  };
};

// Calculate multiple route alternatives
export const calculateRouteAlternatives = async (
  startCoords: [number, number],
  endCoords: [number, number],
  options: {
    shipSpeed: number;
    departureDate: Date;
    shipType: string;
  }
): Promise<RouteResult[]> => {
  // Generate 3 route alternatives: standard, weather-optimized, and fuel-efficient
  const standardOptions = {
    ...options,
    considerWeather: false,
    fuelEfficient: false
  };
  
  const weatherOptions = {
    ...options,
    considerWeather: true,
    fuelEfficient: false
  };
  
  const fuelOptions = {
    ...options,
    considerWeather: false,
    fuelEfficient: true
  };
  
  const [standardRoute, weatherRoute, fuelRoute] = await Promise.all([
    calculateOptimalRoute(startCoords, endCoords, standardOptions),
    calculateOptimalRoute(startCoords, endCoords, weatherOptions),
    calculateOptimalRoute(startCoords, endCoords, fuelOptions)
  ]);
  
  return [
    { ...standardRoute, routeType: 'Standard' },
    { ...weatherRoute, routeType: 'Weather Optimized' },
    { ...fuelRoute, routeType: 'Fuel Efficient' }
  ];
};
