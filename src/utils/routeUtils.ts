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

// Enhanced land mass coordinates with more detailed Mediterranean coastline
const landMassCoordinates = [
  // European Mediterranean coast (more detailed)
  [[0, 43], [3, 43], [7, 44], [10, 44], [12, 45], [14, 45], [16, 41], [18, 40], [20, 38]], // Southern Europe
  [[20, 38], [22, 37], [25, 35], [26, 40], [28, 41]], // Greece and Turkey
  // North African Mediterranean coast
  [[-5, 35], [0, 36], [5, 37], [10, 33], [15, 32], [20, 32], [25, 32], [30, 31]], // North Africa
  // Middle East coast
  [[30, 31], [32, 31], [34, 32], [35, 33], [35, 35]], // Levant coast
  // Add other existing landmasses...
];

// Mediterranean Sea specific waypoints for safe navigation
const mediterraneanSeaLanes: [number, number][][] = [
  // Main East-West Mediterranean route
  [[5, 37.5], [8, 38], [11, 39], [15, 38], [18, 37], [20, 36], [25, 35], [30, 33]], // Central Mediterranean
  // Alternative routes
  [[5, 38], [10, 39], [15, 37], [20, 35]], // Southern route
  [[5, 39], [10, 40], [15, 39], [20, 37]] // Northern route
];

// Enhanced land detection with stricter safety margins
const isPointNearLand = (lon: number, lat: number): boolean => {
  // Increased safety margin to 150km for stricter land avoidance
  const safetyMargin = 150; // km
  
  for (const coastline of landMassCoordinates) {
    for (let i = 0; i < coastline.length; i++) {
      const [x1, y1] = coastline[i];
      
      const R = 6371; // Earth's radius in km
      const dLat = (lat - y1) * Math.PI / 180;
      const dLon = (lon - x1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(y1 * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      if (distance < safetyMargin) {
        return true;
      }
    }
  }
  return false;
};

// Enhanced sea point finding with more aggressive search
const findNearestSeaPoint = (lon: number, lat: number): [number, number] => {
  if (!isPointNearLand(lon, lat)) return [lon, lat];
  
  // More comprehensive search pattern (every 5 degrees)
  const directions = Array.from({ length: 72 }, (_, i) => {
    const angle = (i * 5) * Math.PI / 180;
    return [Math.cos(angle), Math.sin(angle)];
  });
  
  // More granular distance steps and increased search radius
  for (let distance = 1; distance <= 1000; distance += 1) {
    for (const [dx, dy] of directions) {
      const newLon = lon + dx * distance / 111;
      const newLat = lat + dy * distance / 111;
      
      if (newLon >= -180 && newLon <= 180 && newLat >= -90 && newLat <= 90) {
        if (!isPointNearLand(newLon, newLat)) {
          return [newLon, newLat];
        }
      }
    }
  }
  
  return findNearestOceanPoint(lon, lat);
};

// Helper function to find nearest ocean point
const findNearestOceanPoint = (lon: number, lat: number): [number, number] => {
  const oceanCenters = [
    [15, 38],   // Mediterranean Sea
    [0, 0],     // Indian Ocean
    [-150, 0],  // Pacific Ocean
    [30, 0],    // Atlantic Ocean
    [120, -60], // Southern Ocean
    [100, 20],  // South China Sea
    [-80, 25],  // Caribbean
    [140, 35]   // East China Sea
  ];
  
  let bestPoint: [number, number] = [lon, lat];
  let minDistance = Infinity;
  
  for (const [centerLon, centerLat] of oceanCenters) {
    const R = 6371;
    const dLat = (centerLat - lat) * Math.PI / 180;
    const dLon = (centerLon - lon) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat * Math.PI / 180) * Math.cos(centerLat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    if (distance < minDistance) {
      minDistance = distance;
      bestPoint = [centerLon, centerLat] as [number, number];
    }
  }
  
  return bestPoint;
};

// Major shipping lanes for route optimization
const majorShippingLanes: [number, number][][] = [
  // Asia to Europe
  [[120, 30], [100, 20], [60, 30], [30, 35], [0, 45]],
  // Asia to North America
  [[120, 30], [100, 20], [0, 0], [-150, 0], [-120, 35]],
  // Europe to North America
  [[0, 45], [-30, 40], [-60, 35], [-90, 35], [-120, 35]],
  // Asia to Australia
  [[120, 30], [130, 20], [140, 10], [150, -20], [160, -30]]
];

// Find nearest shipping lane
const findNearestShippingLane = (lon: number, lat: number): [number, number][] => {
  let nearestLane = majorShippingLanes[0];
  let minDistance = Infinity;
  
  for (const lane of majorShippingLanes) {
    let laneDistance = 0;
    for (const point of lane) {
      const R = 6371;
      const dLat = (point[1] - lat) * Math.PI / 180;
      const dLon = (point[0] - lon) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat * Math.PI / 180) * Math.cos(point[1] * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      laneDistance += R * c;
    }
    laneDistance /= lane.length;
    
    if (laneDistance < minDistance) {
      minDistance = laneDistance;
      nearestLane = lane;
    }
  }
  
  return nearestLane;
};

// Maritime zones and constraints
interface MaritimeZone {
  name: string;
  type: 'ECA' | 'SECA' | 'PIRACY' | 'ICE';
  coordinates: [number, number][];
  description: string;
  restrictions?: {
    maxSpeed?: number;
    minDistance?: number;
    requiresEscort?: boolean;
  };
}

// Define major maritime zones
const maritimeZones: MaritimeZone[] = [
  {
    name: 'North Sea ECA',
    type: 'ECA',
    coordinates: [[-5, 55], [10, 55], [10, 60], [-5, 60]],
    description: 'North Sea Emission Control Area',
    restrictions: { maxSpeed: 12 }
  },
  {
    name: 'Baltic Sea SECA',
    type: 'SECA',
    coordinates: [[10, 55], [30, 55], [30, 65], [10, 65]],
    description: 'Baltic Sea Sulphur Emission Control Area',
    restrictions: { maxSpeed: 12 }
  },
  {
    name: 'Gulf of Aden Piracy Zone',
    type: 'PIRACY',
    coordinates: [[45, 10], [55, 10], [55, 15], [45, 15]],
    description: 'High risk piracy area',
    restrictions: { requiresEscort: true }
  },
  {
    name: 'Arctic Ice Zone',
    type: 'ICE',
    coordinates: [[-180, 70], [180, 70], [180, 90], [-180, 90]],
    description: 'Arctic ice zone requiring ice-class vessels',
    restrictions: { requiresEscort: true }
  }
];

// Canal constraints
interface CanalConstraint {
  name: string;
  coordinates: [number, number][];
  maxDraft: number;
  maxLength: number;
  maxBeam: number;
  description: string;
}

const canalConstraints: CanalConstraint[] = [
  {
    name: 'Panama Canal',
    coordinates: [[-80, 9], [-79, 9], [-79, 10], [-80, 10]],
    maxDraft: 15.2,
    maxLength: 366,
    maxBeam: 49,
    description: 'Panama Canal size restrictions'
  },
  {
    name: 'Suez Canal',
    coordinates: [[32, 30], [33, 30], [33, 31], [32, 31]],
    maxDraft: 20.1,
    maxLength: 400,
    maxBeam: 77.5,
    description: 'Suez Canal size restrictions'
  }
];

// Check if a point is in a maritime zone
const isInMaritimeZone = (lon: number, lat: number): MaritimeZone | null => {
  for (const zone of maritimeZones) {
    // Simple polygon containment check
    let inside = false;
    for (let i = 0, j = zone.coordinates.length - 1; i < zone.coordinates.length; j = i++) {
      const xi = zone.coordinates[i][0], yi = zone.coordinates[i][1];
      const xj = zone.coordinates[j][0], yj = zone.coordinates[j][1];
      
      if (((yi > lat) !== (yj > lat)) &&
          (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    if (inside) {
      return zone;
    }
  }
  return null;
};

// Check canal constraints
const checkCanalConstraints = (lon: number, lat: number, vessel: {
  draft: number;
  length: number;
  beam: number;
}): CanalConstraint | null => {
  for (const canal of canalConstraints) {
    // Simple polygon containment check
    let inside = false;
    for (let i = 0, j = canal.coordinates.length - 1; i < canal.coordinates.length; j = i++) {
      const xi = canal.coordinates[i][0], yi = canal.coordinates[i][1];
      const xj = canal.coordinates[j][0], yj = canal.coordinates[j][1];
      
      if (((yi > lat) !== (yj > lat)) &&
          (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    if (inside) {
      if (vessel.draft > canal.maxDraft ||
          vessel.length > canal.maxLength ||
          vessel.beam > canal.maxBeam) {
        return canal;
      }
    }
  }
  return null;
};

// Enhanced segment crossing check
const doesSegmentCrossLand = (
  start: [number, number],
  end: [number, number],
  numChecks: number = 100  // Increased number of checks
): boolean => {
  for (let i = 0; i <= numChecks; i++) {
    const fraction = i / numChecks;
    const lon = start[0] + (end[0] - start[0]) * fraction;
    const lat = start[1] + (end[1] - start[1]) * fraction;
    
    if (isPointNearLand(lon, lat)) {
      return true;
    }
  }
  return false;
};

// Enhanced safe path finding with strict water-only routing
const findSafeSeaPath = (
  start: [number, number],
  end: [number, number],
  maxAttempts: number = 30  // Increased max attempts
): [number, number][] => {
  // Ensure start and end points are in safe waters
  const safeStart = findNearestSeaPoint(start[0], start[1]);
  const safeEnd = findNearestSeaPoint(end[0], end[1]);
  
  // Initialize path with safe start point
  const path: [number, number][] = [safeStart];
  let currentPoint = safeStart;
  let attempts = 0;
  
  while (attempts < maxAttempts && !path.includes(safeEnd)) {
    let bestNextPoint: [number, number] | null = null;
    let minDistanceToEnd = Infinity;
    
    // Try points from shipping lanes first
    const lanes = findRelevantShippingLanes(currentPoint, safeEnd);
    for (const lane of lanes) {
      for (const point of lane) {
        if (!doesSegmentCrossLand(currentPoint, point)) {
          const distToEnd = calculateDistance(point[0], point[1], safeEnd[0], safeEnd[1]);
          if (distToEnd < minDistanceToEnd) {
            minDistanceToEnd = distToEnd;
            bestNextPoint = point;
          }
        }
      }
    }
    
    // If no shipping lane point works, try radial search with more points
    if (!bestNextPoint) {
      const angles = Array.from({ length: 72 }, (_, i) => i * 5);  // Every 5 degrees
      const distances = [50, 100, 150, 200, 300, 400, 500];  // More distance options
      
      for (const distance of distances) {
        for (const angle of angles) {
          const rad = angle * Math.PI / 180;
          const dx = Math.cos(rad) * distance / 111;
          const dy = Math.sin(rad) * distance / 111;
          
          const testPoint: [number, number] = [
            currentPoint[0] + dx,
            currentPoint[1] + dy
          ];
          
          if (!isPointNearLand(testPoint[0], testPoint[1]) &&
              !doesSegmentCrossLand(currentPoint, testPoint)) {
            const distToEnd = calculateDistance(testPoint[0], testPoint[1], safeEnd[0], safeEnd[1]);
            if (distToEnd < minDistanceToEnd) {
              minDistanceToEnd = distToEnd;
              bestNextPoint = testPoint;
            }
          }
        }
      }
    }
    
    if (bestNextPoint) {
      path.push(bestNextPoint);
      currentPoint = bestNextPoint;
      
      // Try to reach end point with intermediate validation
      if (!doesSegmentCrossLand(currentPoint, safeEnd)) {
        // Add intermediate points for safety
        const midPoint = [
          (currentPoint[0] + safeEnd[0]) / 2,
          (currentPoint[1] + safeEnd[1]) / 2
        ] as [number, number];
        
        if (!isPointNearLand(midPoint[0], midPoint[1])) {
          path.push(midPoint);
        }
        path.push(safeEnd);
        break;
      }
    }
    
    attempts++;
  }
  
  // Add more intermediate points for smoother water-only path
  return optimizeAndValidateSeaPath(path);
};

// Enhanced route optimization and validation
const optimizeAndValidateSeaPath = (path: [number, number][]): [number, number][] => {
  if (path.length <= 2) return path;
  
  // First pass: Ensure all points are in water and add intermediate points where needed
  const validated: [number, number][] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const current = path[i];
    const next = path[i + 1];
    validated.push(current);
    
    // Check if segment needs intermediate points
    if (doesSegmentCrossLand(current, next)) {
      // Add multiple intermediate points
      const numIntermediatePoints = 5;
      for (let j = 1; j < numIntermediatePoints; j++) {
        const fraction = j / numIntermediatePoints;
        const intermediateLon = current[0] + (next[0] - current[0]) * fraction;
        const intermediateLat = current[1] + (next[1] - current[1]) * fraction;
        const safePoint = findNearestSeaPoint(intermediateLon, intermediateLat);
        validated.push(safePoint);
      }
    }
  }
  validated.push(path[path.length - 1]);
  
  // Second pass: Smooth the path while ensuring water-only route
  const smoothed = smoothRoute(validated);
  
  // Final pass: Ensure all points are in water
  return smoothed.map(point => 
    isPointNearLand(point[0], point[1]) ? 
      findNearestSeaPoint(point[0], point[1]) : 
      point
  );
};

// Enhanced route smoothing with water validation
const smoothRoute = (waypoints: [number, number][]): [number, number][] => {
  if (waypoints.length < 3) return waypoints;
  
  const smoothed: [number, number][] = [waypoints[0]];
  const windowSize = 3;
  
  for (let i = 1; i < waypoints.length - 1; i++) {
    const window = waypoints.slice(
      Math.max(0, i - windowSize),
      Math.min(waypoints.length, i + windowSize + 1)
    );
    
    // Calculate weighted average
    let sumLon = 0, sumLat = 0, totalWeight = 0;
    window.forEach((point, idx) => {
      const weight = 1 / (Math.abs(idx - windowSize) + 1);
      sumLon += point[0] * weight;
      sumLat += point[1] * weight;
      totalWeight += weight;
    });
    
    const smoothedPoint: [number, number] = [
      sumLon / totalWeight,
      sumLat / totalWeight
    ];
    
    // Only use smoothed point if it's in water and doesn't create land crossings
    if (!isPointNearLand(smoothedPoint[0], smoothedPoint[1]) &&
        !doesSegmentCrossLand(smoothed[smoothed.length - 1], smoothedPoint)) {
      smoothed.push(smoothedPoint);
    } else {
      // If smoothed point is invalid, use nearest safe point
      const safePoint = findNearestSeaPoint(smoothedPoint[0], smoothedPoint[1]);
      if (!doesSegmentCrossLand(smoothed[smoothed.length - 1], safePoint)) {
        smoothed.push(safePoint);
      } else {
        // If safe point still creates crossing, keep original point
        smoothed.push(waypoints[i]);
      }
    }
  }
  
  smoothed.push(waypoints[waypoints.length - 1]);
  return smoothed;
};

// Find relevant shipping lanes for the route
const findRelevantShippingLanes = (
  start: [number, number],
  end: [number, number]
): [number, number][][] => {
  // Calculate bearing between start and end
  const startLat = start[1] * Math.PI / 180;
  const startLon = start[0] * Math.PI / 180;
  const endLat = end[1] * Math.PI / 180;
  const endLon = end[0] * Math.PI / 180;
  
  const y = Math.sin(endLon - startLon) * Math.cos(endLat);
  const x = Math.cos(startLat) * Math.sin(endLat) -
           Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLon - startLon);
  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  
  // Find lanes that generally go in the same direction
  return majorShippingLanes.filter(lane => {
    const laneBearing = calculateLaneBearing(lane);
    const bearingDiff = Math.abs(bearing - laneBearing);
    return bearingDiff <= 90 || bearingDiff >= 270;
  });
};

// Calculate the general bearing of a shipping lane
const calculateLaneBearing = (lane: [number, number][]): number => {
  if (lane.length < 2) return 0;
  
  const start = lane[0];
  const end = lane[lane.length - 1];
  
  const startLat = start[1] * Math.PI / 180;
  const startLon = start[0] * Math.PI / 180;
  const endLat = end[1] * Math.PI / 180;
  const endLon = end[0] * Math.PI / 180;
  
  const y = Math.sin(endLon - startLon) * Math.cos(endLat);
  const x = Math.cos(startLat) * Math.sin(endLat) -
           Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLon - startLon);
  
  return Math.atan2(y, x) * 180 / Math.PI;
};

// Enhanced createSeaRoute function
const createSeaRoute = (
  startLon: number, 
  startLat: number, 
  endLon: number, 
  endLat: number,
  options: {
    numPoints?: number;
    vessel?: {
      draft: number;
      length: number;
      beam: number;
      iceClass?: boolean;
    };
    avoidZones?: ('ECA' | 'SECA' | 'PIRACY' | 'ICE')[];
    useCanals?: boolean;
  } = {}
): [number, number][] => {
  const {
    numPoints = 100, // Increased from 50 to 100 for more detailed paths
    vessel,
    avoidZones = [],
    useCanals = true
  } = options;

  // Ensure start and end points are in the sea
  const startPoint = findNearestSeaPoint(startLon, startLat);
  const endPoint = findNearestSeaPoint(endLon, endLat);
  
  // Find safe path between points with increased attempts
  const safePath = findSafeSeaPath(startPoint, endPoint, 30);
  
  // Generate detailed waypoints along the safe path with validation
  const detailedWaypoints: [number, number][] = [];
  
  for (let i = 0; i < safePath.length - 1; i++) {
    const segment = calculateDetailedSegment(
      safePath[i][0],
      safePath[i][1],
      safePath[i + 1][0],
      safePath[i + 1][1],
      Math.max(10, Math.ceil(numPoints / safePath.length))
    );
    
    // Add all points except the last one (to avoid duplicates)
    detailedWaypoints.push(...segment.slice(0, -1));
  }
  
  // Add the final point
  detailedWaypoints.push(safePath[safePath.length - 1]);
  
  // Final validation and smoothing with strict water-only constraint
  return validateAndSmoothRoute(detailedWaypoints);
};

// New function to calculate detailed segment with water-only points
const calculateDetailedSegment = (
  startLon: number,
  startLat: number,
  endLon: number,
  endLat: number,
  numPoints: number
): [number, number][] => {
  const points: [number, number][] = [];
  let lastValidPoint: [number, number] = [startLon, startLat];
  points.push(lastValidPoint);

  for (let i = 1; i <= numPoints; i++) {
    const fraction = i / numPoints;
    const lon = startLon + (endLon - startLon) * fraction;
    const lat = startLat + (endLat - startLat) * fraction;
    
    if (!isPointNearLand(lon, lat)) {
      lastValidPoint = [lon, lat];
      points.push(lastValidPoint);
    } else {
      // If point is on land, find nearest sea point
      const seaPoint = findNearestSeaPoint(lon, lat);
      if (!doesSegmentCrossLand(lastValidPoint, seaPoint)) {
        lastValidPoint = seaPoint;
        points.push(lastValidPoint);
      }
    }
  }

  return points;
};

// Enhanced validation and smoothing with strict water-only constraint
const validateAndSmoothRoute = (waypoints: [number, number][]): [number, number][] => {
  // First pass: Ensure all points are in water
  const waterOnlyPoints = waypoints.map(point =>
    isPointNearLand(point[0], point[1]) ?
      findNearestSeaPoint(point[0], point[1]) :
      point
  );
  
  // Second pass: Add intermediate points where needed
  const withIntermediates: [number, number][] = [];
  for (let i = 0; i < waterOnlyPoints.length - 1; i++) {
    const current = waterOnlyPoints[i];
    const next = waterOnlyPoints[i + 1];
    withIntermediates.push(current);
    
    if (doesSegmentCrossLand(current, next)) {
      // Add multiple intermediate points
      const numIntermediatePoints = 5;
      for (let j = 1; j < numIntermediatePoints; j++) {
        const fraction = j / numIntermediatePoints;
        const intermediateLon = current[0] + (next[0] - current[0]) * fraction;
        const intermediateLat = current[1] + (next[1] - current[1]) * fraction;
        const safePoint = findNearestSeaPoint(intermediateLon, intermediateLat);
        withIntermediates.push(safePoint);
      }
    }
  }
  withIntermediates.push(waterOnlyPoints[waterOnlyPoints.length - 1]);
  
  // Final pass: Smooth while maintaining water-only constraint
  return optimizeAndValidateSeaPath(withIntermediates);
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
    vessel?: {
      draft: number;
      length: number;
      beam: number;
      iceClass?: boolean;
    };
    avoidZones?: ('ECA' | 'SECA' | 'PIRACY' | 'ICE')[];
    useCanals?: boolean;
  }
): Promise<RouteResult> => {
  // Use improved sea routing
  const waypoints = createSeaRoute(
    startCoords[0],
    startCoords[1],
    endCoords[0],
    endCoords[1],
    {
      numPoints: 12,
      vessel: options.vessel,
      avoidZones: options.avoidZones,
      useCanals: options.useCanals
    }
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
    vessel?: {
      draft: number;
      length: number;
      beam: number;
      iceClass?: boolean;
    };
    avoidZones?: ('ECA' | 'SECA' | 'PIRACY' | 'ICE')[];
    useCanals?: boolean;
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
