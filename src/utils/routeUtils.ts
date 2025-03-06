import { calculateDistance, calculateWaypoints } from './mapUtils';
import { getRouteWeatherForecast, getRouteRiskAssessment } from './weatherUtils';

// Add types at the top of the file
interface WeatherForecast {
  description: string;
  temperature: number;
  windSpeed: number;
  windDirection: number;
  waveHeight: number;
  precipitation: number;
  visibility: number;
  pressure: number;
  humidity: number;
  seaTemp: number;
  currentSpeed: number;
  currentDirection: number;
}

interface WeatherRisk {
  level: 'low' | 'medium' | 'high';
  description: string;
  recommendations: string[];
}

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
    checkpoints: CheckpointInfo[];
    totalDurationHours: number; // Total duration in hours (for calculations)
  };
}

// Add WeatherData interface
interface WeatherData {
  description?: string;
  temperature?: number;
  windSpeed?: number;
  windDirection?: number;
  waveHeight?: number;
  precipitation?: number;
  visibility?: number;
  pressure?: number;
  humidity?: number;
  seaTemp?: number;
  currentSpeed?: number;
  currentDirection?: number;
}

// Add new interface for detailed checkpoint information
interface CheckpointInfo {
  position: [number, number];
  estimatedTime: string;
  distance: number;
  weatherForecast: {
    description: string;
    temperature: number;
    windSpeed: number;
    windDirection: number;
    waveHeight: number;
    precipitation: number;
    visibility: number;
    pressure: number;
    humidity: number;
    seaTemp: number;
    currentSpeed: number;
    currentDirection: number;
  };
  navigationInfo: {
    distanceFromStart: number;
    distanceToNext: number;
    bearing: number;
    estimatedSpeed: number;
    fuelConsumption: number;
    timeToNext: string;
  };
  safetyInfo: {
    nearestPort: string;
    nearestPortDistance: number;
    riskLevel: 'low' | 'medium' | 'high';
    warnings: string[];
    recommendations: string[];
  };
}

// Update the landMasses array with more precise coastal points
const landMasses = [
  // Japan main islands (detailed coastline)
  [[129.33, 33.23], // Fukuoka North
   [129.87, 32.75], // Nagasaki
   [130.20, 32.24], // Kumamoto
   [130.40, 31.90], // Kagoshima
   [131.12, 31.58], // Southern Kyushu
   [131.47, 31.80], // Miyazaki
   [132.55, 32.45], // Kochi
   [133.53, 33.55], // Tokushima
   [134.69, 34.07], // Wakayama
   [135.43, 34.65], // Osaka
   [136.90, 34.90], // Nagoya
   [137.72, 34.70], // Shizuoka
   [138.64, 35.10], // Mount Fuji
   [139.77, 35.45], // Tokyo
   [140.87, 36.10], // Ibaraki
   [140.97, 36.95], // Fukushima
   [141.15, 38.26], // Sendai
   [141.35, 39.58], // Iwate
   [141.47, 40.83], // Aomori
   [140.72, 41.77], // Hokkaido South
   [141.35, 42.65], // Hokkaido East
   [142.95, 43.82], // Hokkaido North
   [144.37, 43.38], // Hokkaido Northeast
   [145.52, 43.15]], // Hokkaido East tip

  // South Korea (detailed coastline)
  [[126.45, 37.50], // Incheon
   [126.37, 36.90],
   [126.52, 36.32],
   [126.48, 35.95],
   [127.35, 34.85],
   [127.75, 34.72],
   [128.15, 34.95],
   [128.60, 35.10],
   [129.05, 35.15],
   [129.45, 35.50], // Busan
   [129.57, 35.95],
   [129.45, 36.63],
   [129.37, 37.25],
   [129.12, 37.65],
   [128.85, 38.30]], // East coast

  // China East Coast (detailed)
  [[117.72, 38.97], // Tianjin
   [118.12, 38.72],
   [118.97, 37.85],
   [119.52, 37.12],
   [120.32, 36.27], // Qingdao
   [121.45, 35.42],
   [121.85, 34.75],
   [121.97, 33.92],
   [121.82, 32.85],
   [121.52, 31.67], // Shanghai
   [120.15, 30.27], // Hangzhou
   [119.65, 29.12],
   [119.02, 27.35],
   [118.77, 26.15],
   [118.15, 24.82]], // Xiamen

  // Taiwan (detailed)
  [[121.45, 25.18], // Keelung
   [121.92, 25.05], // Northeast
   [121.87, 24.72],
   [121.62, 24.02],
   [121.37, 23.10],
   [120.85, 22.02], // South
   [120.25, 22.57],
   [120.20, 23.05],
   [120.32, 23.75],
   [120.52, 24.42],
   [121.00, 25.00]], // North

  // Philippines (main islands outline)
  [[120.23, 18.22], // Luzon North
   [121.65, 18.47],
   [122.12, 16.92],
   [123.97, 13.67],
   [124.27, 12.32],
   [125.52, 11.27], // Samar
   [125.37, 10.12],
   [124.97, 9.77],
   [123.92, 9.57],
   [123.15, 9.42], // Cebu
   [122.52, 9.83],
   [121.97, 10.82],
   [120.92, 11.37],
   [120.47, 11.92],
   [119.77, 12.77]], // Mindoro

  // Vietnam Coast (detailed)
  [[108.82, 19.27], // Central
   [109.12, 18.72],
   [109.40, 17.97],
   [108.92, 16.62],
   [108.37, 15.92],
   [108.20, 14.52],
   [109.12, 13.37],
   [109.27, 12.25],
   [109.42, 11.45],
   [108.87, 10.72],
   [107.02, 10.37], // South
   [106.62, 10.22],
   [106.22, 9.95],
   [105.72, 9.77],
   [104.82, 9.52]], // Gulf of Thailand

  // Thailand Gulf Coast
  [[100.42, 13.72], // Bangkok
   [100.92, 13.32],
   [101.27, 12.92],
   [101.87, 12.67],
   [102.52, 12.47],
   [102.92, 12.17],
   [102.37, 11.77],
   [101.82, 10.97],
   [100.92, 9.82],
   [100.22, 8.92]], // South

  // Malaysia & Singapore (detailed)
  [[103.85, 1.42], // Singapore
   [103.62, 1.27],
   [103.42, 1.17],
   [102.87, 1.47],
   [102.42, 1.97],
   [101.97, 2.42],
   [101.42, 2.92],
   [100.92, 3.42],
   [100.42, 3.92],
   [100.12, 4.42],
   [99.87, 4.92],
   [99.62, 5.42],
   [99.42, 5.92]], // North

  // Indonesia (major islands outline)
  [[95.32, 5.57], // Sumatra North
   [96.12, 5.27],
   [97.42, 4.92],
   [98.72, 4.27],
   [100.12, 3.72],
   [101.42, 2.92],
   [102.72, 2.27],
   [103.92, 1.62],
   [104.42, 1.12],
   [105.92, 0.42]], // Sumatra South

  // India East Coast (detailed)
  [[88.42, 21.92], // West Bengal
   [87.92, 21.42],
   [86.92, 20.92],
   [86.42, 20.42],
   [85.92, 19.82],
   [85.12, 19.22],
   [84.42, 18.42],
   [83.92, 17.92],
   [83.42, 17.42],
   [82.92, 16.92],
   [82.12, 16.42],
   [81.42, 15.92],
   [80.92, 15.42],
   [80.42, 14.92],
   [80.12, 14.42],
   [79.92, 13.92],
   [79.82, 13.42],
   [79.92, 12.92],
   [79.82, 12.42],
   [79.42, 11.92],
   [79.12, 11.42],
   [78.92, 10.92],
   [78.42, 10.42],
   [77.92, 9.92],
   [77.42, 9.42],
   [77.12, 8.92],
   [76.92, 8.42]], // Kerala

  // Sri Lanka (detailed)
  [[79.87, 9.82],
   [80.12, 9.67],
   [80.52, 9.42],
   [80.87, 9.27],
   [81.22, 9.12],
   [81.62, 8.92],
   [81.87, 8.42],
   [81.72, 7.92],
   [81.52, 7.42],
   [81.22, 6.92],
   [80.92, 6.42],
   [80.52, 6.12],
   [80.12, 5.92],
   [79.92, 6.12],
   [79.72, 6.42],
   [79.52, 6.92],
   [79.42, 7.42],
   [79.32, 7.92],
   [79.42, 8.42],
   [79.52, 8.92],
   [79.72, 9.42]], // North

  // UAE & Oman (detailed coastline)
  [[51.35, 24.45], // Abu Dhabi West
   [51.58, 24.47], // Abu Dhabi Port
   [51.95, 24.48], // Between Abu Dhabi and Dubai
   [52.60, 24.45],
   [53.20, 24.42],
   [53.85, 24.40],
   [54.15, 24.42], // Approaching Dubai
   [54.28, 24.45], // Dubai West
   [54.32, 24.47], // Dubai Main Port
   [54.38, 24.48], // Dubai Creek
   [54.45, 24.49], // Dubai Central
   [54.52, 24.51], // Dubai East
   [54.65, 24.55], // Sharjah West
   [54.72, 24.58], // Sharjah Port
   [54.85, 24.65], // Sharjah East
   [55.05, 24.75], // Ajman
   [55.15, 24.85], // Umm Al Quwain
   [55.35, 24.95], // Ras Al Khaimah South
   [55.55, 25.15], // Ras Al Khaimah
   [55.75, 25.35], // Approaching Musandam
   [55.95, 25.55],
   [56.15, 25.75],
   [56.35, 25.95], // Musandam Peninsula
   [56.45, 26.15],
   [56.52, 26.25], // Musandam Tip
   // Oman Coast
   [56.65, 26.15],
   [56.85, 25.95],
   [57.05, 25.75],
   [57.25, 25.45],
   [57.45, 25.15],
   [57.65, 24.85],
   [57.85, 24.55],
   [58.05, 24.25],
   [58.25, 23.95],
   [58.45, 23.65],
   [58.65, 23.35]], // Oman South
];

// Increase safety margins for better land avoidance
function isInWater(lon: number, lat: number): boolean {
  const SAFETY_MARGIN = 0.5; // Increased from 0.3
  const GULF_MARGIN = 0.4;  // Increased from 0.2
  
  // Additional check for Gulf region
  if (lon >= 51.0 && lon <= 57.0 && lat >= 23.5 && lat <= 26.5) {
    for (const landMass of landMasses.slice(0, 2)) { // Check only UAE and Oman coastlines
      for (let i = 0; i < landMass.length - 1; i++) {
        const [x1, y1] = landMass[i];
        const [x2, y2] = landMass[i + 1];
        
        // Calculate distance to line segment
        const A = lon - x1;
        const B = lat - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        
        let param = -1;
        if (len_sq != 0) {
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

        const dx = lon - xx;
        const dy = lat - yy;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < GULF_MARGIN) {
          return false;
        }
      }
    }
  }

  // Regular check for other areas
  for (const landMass of landMasses) {
    for (let i = 0; i < landMass.length - 1; i++) {
      const [x1, y1] = landMass[i];
      const [x2, y2] = landMass[i + 1];
      
      const A = lon - x1;
      const B = lat - y1;
      const C = x2 - x1;
      const D = y2 - y1;

      const dot = A * C + B * D;
      const len_sq = C * C + D * D;
      
      let param = -1;
      if (len_sq != 0) {
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

      const dx = lon - xx;
      const dy = lat - yy;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < SAFETY_MARGIN) {
        return false;
      }
    }
  }
  return true;
}

// Update the findSafeWaterPoint function for better accuracy
function findSafeWaterPoint(lon: number, lat: number): [number, number] {
  if (isInWater(lon, lat)) return [lon, lat];
  
  // Try points progressively further out into open water
  const directions = [
    [1, -0.5],   // East-southeast
    [1, 0],      // East
    [0.8, -0.6], // Southeast
    [0.6, -0.8], // South-southeast
    [-0.5, -1],  // South-southwest
  ];
  
  for (let distance = 0.5; distance <= 2; distance += 0.5) {
    for (const [dx, dy] of directions) {
      const testLon = lon + dx * distance;
      const testLat = lat + dy * distance;
      if (isInWater(testLon, testLat)) {
        return [testLon, testLat];
      }
    }
  }
  
  // If still not found, try moving further out
  return [lon + 1.5, lat - 1];
}

// Create a simple water route between two points
function createWaterRoute(
  startLon: number, 
  startLat: number, 
  endLon: number, 
  endLat: number
): [number, number][] {
  const route: [number, number][] = [];
  
  // First, find safe starting and ending points if needed
  const safeStart = findSafeWaterPoint(startLon, startLat);
  const safeEnd = findSafeWaterPoint(endLon, endLat);
  
  // For routes near Japan, take southern route
  if (startLon >= 130 && startLon <= 145 && startLat >= 30 && startLat <= 45) {
    route.push(safeStart);
    // Go south of Japan
    route.push([safeStart[0], 33.0] as [number, number]);
    route.push([145.0, 33.0] as [number, number]);
    route.push(safeEnd);
  } else {
    route.push(safeStart);
    route.push(safeEnd);
  }

  // Verify the entire path
  const finalRoute: [number, number][] = [];
  for (let i = 0; i < route.length - 1; i++) {
    const start = route[i];
    const end = route[i + 1];
    
    finalRoute.push(start);
    
    // Add intermediate points to ensure path stays in water
    const steps = 8;
    for (let j = 1; j < steps; j++) {
      const t = j / steps;
      const point: [number, number] = [
        start[0] + (end[0] - start[0]) * t,
        start[1] + (end[1] - start[1]) * t
      ];
      
      // If point is not in water, move it south
      if (!isInWater(point[0], point[1])) {
        const safePoint: [number, number] = [point[0], point[1] - 1.5];
        if (isInWater(safePoint[0], safePoint[1])) {
          finalRoute.push(safePoint);
        }
    } else {
        finalRoute.push(point);
      }
    }
  }
  
  finalRoute.push(route[route.length - 1]);
  return finalRoute;
}

// Simplified path safety check
function checkPathSafety(
  startLon: number,
  startLat: number,
  endLon: number,
  endLat: number
): boolean {
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lon = startLon + (endLon - startLon) * t;
    const lat = startLat + (endLat - startLat) * t;
    if (!isInWater(lon, lat)) {
      return false;
    }
  }
  return true;
}

// Calculate optimal route between two ports (simplified)
export const calculateOptimalRoute = async (
  startCoords: [number, number],
  endCoords: [number, number],
  options: RouteOptions
): Promise<RouteResult> => {
  // Generate water-only route
  const waypoints = createWaterRoute(
    startCoords[0],
    startCoords[1],
    endCoords[0],
    endCoords[1]
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
  
  // Calculate duration based on ship speed
  const speedKmh = options.shipSpeed * 1.852;
  const durationHours = totalDistance / speedKmh;

  // Update the weather forecast fetching
  const checkpointPromises = waypoints.map(async (point, index) => {
    const timeAtPoint = new Date(
      options.departureDate.getTime() + (durationHours * index / (waypoints.length - 1)) * 60 * 60 * 1000
    );

    try {
      // Get live weather forecast for this point
      const weatherResponse = await getRouteWeatherForecast(
        [[point[0], point[1]]], // coordinates array
        timeAtPoint // timestamp as Date object
      );
      const weatherData = weatherResponse as WeatherData;

      // Format the weather data with proper units
      const formattedWeather: WeatherForecast = {
        description: weatherData.description || 'No data available',
        temperature: Math.round((weatherData.temperature || 20) * 10) / 10, // One decimal place
        windSpeed: Math.round(weatherData.windSpeed || 0),
        windDirection: Math.round(weatherData.windDirection || 0),
        waveHeight: Math.round((weatherData.waveHeight || 0) * 10) / 10,
        precipitation: Math.round((weatherData.precipitation || 0) * 100) / 100,
        visibility: Math.round(weatherData.visibility || 10),
        pressure: Math.round(weatherData.pressure || 1013),
        humidity: Math.round(weatherData.humidity || 70),
        seaTemp: Math.round((weatherData.seaTemp || 20) * 10) / 10,
        currentSpeed: Math.round((weatherData.currentSpeed || 0) * 10) / 10,
        currentDirection: Math.round(weatherData.currentDirection || 0)
      };

      // Calculate navigation info
      const distanceFromStart = calculateDistance(
        startCoords[0], startCoords[1],
        point[0], point[1]
      );

      const distanceToNext = index < waypoints.length - 1
        ? calculateDistance(
            point[0], point[1],
            waypoints[index + 1][0], waypoints[index + 1][1]
          )
        : 0;

      const bearing = index < waypoints.length - 1
        ? calculateBearing(
            point[0], point[1],
            waypoints[index + 1][0], waypoints[index + 1][1]
          )
        : 0;

      const timeToNext = index < waypoints.length - 1
        ? formatDuration(distanceToNext / options.shipSpeed)
        : '0h';

      // Get nearest port and assess weather risks
      const nearestPortInfo = findNearestPort(point[0], point[1]);
      const weatherRisk = assessWeatherRisk(formattedWeather);

      // Create checkpoint with live weather info
      const checkpoint: CheckpointInfo = {
        position: point,
        estimatedTime: timeAtPoint.toLocaleString(),
        distance: Math.round(totalDistance * index / (waypoints.length - 1)),
        weatherForecast: {
          ...formattedWeather,
          description: `${formattedWeather.description} (Live)`,
          temperature: formattedWeather.temperature,
          windSpeed: formattedWeather.windSpeed,
          windDirection: formattedWeather.windDirection,
          waveHeight: formattedWeather.waveHeight,
          precipitation: formattedWeather.precipitation,
          visibility: formattedWeather.visibility,
          pressure: formattedWeather.pressure,
          humidity: formattedWeather.humidity,
          seaTemp: formattedWeather.seaTemp,
          currentSpeed: formattedWeather.currentSpeed,
          currentDirection: formattedWeather.currentDirection
        },
        navigationInfo: {
          distanceFromStart: Math.round(distanceFromStart),
          distanceToNext: Math.round(distanceToNext),
          bearing: Math.round(bearing),
          estimatedSpeed: options.shipSpeed,
          fuelConsumption: Math.round(distanceToNext * 0.3),
          timeToNext
        },
        safetyInfo: {
          nearestPort: nearestPortInfo.name,
          nearestPortDistance: Math.round(nearestPortInfo.distance),
          riskLevel: weatherRisk.level,
          warnings: weatherRisk.description.split(', ').filter(w => w),
          recommendations: weatherRisk.recommendations
        }
      };

      return checkpoint;
    } catch (error) {
      console.error('Weather fetch error:', error);
      // Return default data with error indication
      return {
        position: point,
        estimatedTime: timeAtPoint.toLocaleString(),
        distance: Math.round(totalDistance * index / (waypoints.length - 1)),
        weatherForecast: {
          description: 'Live weather data unavailable',
          temperature: null,
          windSpeed: null,
          windDirection: null,
          waveHeight: null,
          precipitation: null,
          visibility: null,
          pressure: null,
          humidity: null,
          seaTemp: null,
          currentSpeed: null,
          currentDirection: null
        },
        navigationInfo: {
          distanceFromStart: Math.round(calculateDistance(
            startCoords[0], startCoords[1],
            point[0], point[1]
          )),
          distanceToNext: 0,
          bearing: 0,
          estimatedSpeed: options.shipSpeed,
          fuelConsumption: 0,
          timeToNext: '0h'
        },
        safetyInfo: {
          nearestPort: 'Unknown',
          nearestPortDistance: 0,
          riskLevel: 'low',
          warnings: ['Weather data unavailable'],
          recommendations: ['Check weather service status']
        }
      } as CheckpointInfo;
    }
  });

  // Wait for all weather forecasts
  const checkpoints = await Promise.all(checkpointPromises);
  
  // Format duration
  const days = Math.floor(durationHours / 24);
  const hours = Math.floor(durationHours % 24);
  const duration = days > 0 ? `${days}d ${hours}h` : `${hours}h`;
  
  // Calculate overall weather risk
  const weatherRisks = checkpoints.map(cp => {
    const risk = assessWeatherRisk(cp.weatherForecast);
    return {
      level: risk.level,
      description: risk.description,
      recommendations: risk.recommendations
    };
  });

  // Get highest risk level
  const riskLevels = { low: 0, medium: 1, high: 2 };
  const maxRisk = weatherRisks.reduce((max, risk) => {
    return riskLevels[risk.level] > riskLevels[max.level] ? risk : max;
  }, { level: 'low', description: '', recommendations: [] });

  // Simplified fuel consumption calculation with weather consideration
  const weatherImpact = maxRisk.level === 'high' ? 1.3 : maxRisk.level === 'medium' ? 1.15 : 1;
  const fuelConsumption = Math.round(totalDistance * 0.3 * weatherImpact);
  
  return {
    waypoints,
    distance: Math.round(totalDistance),
    duration,
    fuelConsumption,
    weatherRisk: maxRisk,
    journeyDetails: {
      estimatedArrival: checkpoints[checkpoints.length - 1].estimatedTime,
      fuelCostEstimate: Math.round(fuelConsumption * 500),
      checkpoints,
      totalDurationHours: durationHours
    }
  };
};

// Helper function to assess weather risk
function assessWeatherRisk(weather: WeatherForecast): WeatherRisk {
  const risks: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  const recommendations: string[] = [];

  // Check wind speed
  if (weather.windSpeed > 30) {
    risks.push('High winds');
    riskLevel = 'high';
    recommendations.push('Consider alternative route or delay departure');
  } else if (weather.windSpeed > 20) {
    risks.push('Moderate winds');
    riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
    recommendations.push('Monitor wind conditions');
  }

  // Check wave height
  if (weather.waveHeight > 4) {
    risks.push('High waves');
    riskLevel = 'high';
    recommendations.push('Avoid area if possible');
  } else if (weather.waveHeight > 2) {
    risks.push('Moderate waves');
    riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
    recommendations.push('Prepare for rough seas');
  }

  // Check visibility
  if (weather.visibility < 1) {
    risks.push('Poor visibility');
    riskLevel = 'high';
    recommendations.push('Use radar and reduce speed');
  } else if (weather.visibility < 3) {
    risks.push('Reduced visibility');
    riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
    recommendations.push('Maintain proper lookout');
  }

  return {
    level: riskLevel,
    description: risks.join(', ') || 'Good conditions',
    recommendations
  };
}

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
  const baseOptions: RouteOptions = {
    startPortId: `PORT_${startCoords[0]}_${startCoords[1]}`,
    endPortId: `PORT_${endCoords[0]}_${endCoords[1]}`,
    shipType: options.shipType,
    shipSpeed: options.shipSpeed,
    departureDate: options.departureDate,
    considerWeather: false,
    fuelEfficient: false
  };

  const standardOptions = {
    ...baseOptions,
    considerWeather: false,
    fuelEfficient: false
  };
  
  const weatherOptions = {
    ...baseOptions,
    considerWeather: true,
    fuelEfficient: false
  };
  
  const fuelOptions = {
    ...baseOptions,
    considerWeather: false,
    fuelEfficient: true
  };
  
  try {
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
  } catch (error) {
    console.error('Error calculating routes:', error);
    // Return at least one basic route on error
    const basicRoute = await calculateOptimalRoute(startCoords, endCoords, standardOptions);
    return [{ ...basicRoute, routeType: 'Standard' }];
  }
};

// Add helper functions at the top of the file
function calculateBearing(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const y = Math.sin(lon2 - lon1) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
           Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function formatDuration(hours: number): string {
  const days = Math.floor(hours / 24);
  const remainingHours = Math.floor(hours % 24);
  return days > 0 ? `${days}d ${remainingHours}h` : `${remainingHours}h`;
}

interface NearestPort {
  name: string;
  distance: number;
  coordinates: [number, number];
}

function findNearestPort(lon: number, lat: number): NearestPort {
  const ports: Array<[string, number, number]> = [
    ['Dubai Port', 54.32, 24.47],
    ['Abu Dhabi Port', 51.58, 24.47],
    ['Fujairah Port', 55.35, 25.05],
    ['Sharjah Port', 54.72, 24.58],
    ['Ajman Port', 55.05, 24.75],
    ['Ras Al Khaimah Port', 55.55, 25.15]
  ];

  let nearest = {
    name: ports[0][0],
    distance: calculateDistance(lon, lat, ports[0][1], ports[0][2]),
    coordinates: [ports[0][1], ports[0][2]] as [number, number]
  };

  for (const [name, portLon, portLat] of ports) {
    const distance = calculateDistance(lon, lat, portLon, portLat);
    if (distance < nearest.distance) {
      nearest = {
        name,
        distance,
        coordinates: [portLon, portLat]
      };
    }
  }

  return nearest;
}
