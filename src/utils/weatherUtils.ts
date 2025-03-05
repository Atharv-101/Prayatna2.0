
// Types for weather data
export interface WeatherData {
  temperature: number; // in Celsius
  windSpeed: number; // in kmh
  windDirection: number; // in degrees
  waveHeight: number; // in meters
  precipitation: number; // in mm
  visibility: number; // in km
  description: string;
  icon: string;
}

// Sample weather data generator (in a real app, this would fetch from an API)
export const getWeatherForLocation = async (
  longitude: number,
  latitude: number
): Promise<WeatherData> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Generate semi-random weather data based on location
  // This is just for demonstration - real app would use a weather API
  const temp = 15 + Math.sin(latitude / 10) * 10 + Math.random() * 5;
  const wind = 5 + Math.cos(longitude / 20) * 10 + Math.random() * 5;
  const windDir = Math.floor(Math.random() * 360);
  const waves = Math.max(0.1, Math.min(5, (wind / 10) + Math.random() * 2));
  const rain = Math.max(0, Math.min(25, Math.cos(latitude / 15) * 10 + Math.random() * 5));
  const vis = Math.max(1, Math.min(20, 15 - rain/2 + Math.random() * 5));
  
  // Select appropriate weather icon and description
  let icon: string;
  let description: string;
  
  if (rain > 10) {
    icon = 'cloud-rain';
    description = 'Heavy Rain';
  } else if (rain > 5) {
    icon = 'cloud-drizzle';
    description = 'Light Rain';
  } else if (wind > 15) {
    icon = 'wind';
    description = 'Windy';
  } else if (vis < 5) {
    icon = 'cloud-fog';
    description = 'Foggy';
  } else if (temp < 5) {
    icon = 'cloud-snow';
    description = 'Cold';
  } else {
    icon = 'sun';
    description = 'Clear';
  }
  
  return {
    temperature: Math.round(temp * 10) / 10,
    windSpeed: Math.round(wind * 10) / 10,
    windDirection: windDir,
    waveHeight: Math.round(waves * 10) / 10,
    precipitation: Math.round(rain * 10) / 10,
    visibility: Math.round(vis * 10) / 10,
    description,
    icon
  };
};

// Get weather forecast for a route (multiple points along the path)
export const getRouteWeatherForecast = async (
  waypoints: [number, number][],
  departureDate: Date
): Promise<WeatherData[]> => {
  // For sample purposes, we'll just get weather for each waypoint
  // In a real app, you would use a time-based forecast API
  
  const forecasts: WeatherData[] = [];
  
  for (const point of waypoints) {
    const forecast = await getWeatherForLocation(point[0], point[1]);
    forecasts.push(forecast);
  }
  
  return forecasts;
};

// Get weather-based risk assessment for a route
export const getRouteRiskAssessment = (forecasts: WeatherData[]): {
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
  recommendations: string[];
} => {
  // Calculate average values
  const avgWave = forecasts.reduce((sum, f) => sum + f.waveHeight, 0) / forecasts.length;
  const avgWind = forecasts.reduce((sum, f) => sum + f.windSpeed, 0) / forecasts.length;
  const avgVis = forecasts.reduce((sum, f) => sum + f.visibility, 0) / forecasts.length;
  
  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  const riskFactors: string[] = [];
  const recommendations: string[] = [];
  
  if (avgWave > 3) {
    riskLevel = 'high';
    riskFactors.push('high wave height');
    recommendations.push('Consider alternative route or delay departure');
  } else if (avgWave > 1.5) {
    if (riskLevel === 'low') riskLevel = 'medium';
    riskFactors.push('moderate wave height');
    recommendations.push('Monitor wave conditions closely');
  }
  
  if (avgWind > 25) {
    riskLevel = 'high';
    riskFactors.push('strong winds');
    recommendations.push('Secure cargo and consider delay until wind conditions improve');
  } else if (avgWind > 15) {
    if (riskLevel === 'low') riskLevel = 'medium';
    riskFactors.push('moderate winds');
    recommendations.push('Adjust speed according to wind conditions');
  }
  
  if (avgVis < 2) {
    riskLevel = 'high';
    riskFactors.push('poor visibility');
    recommendations.push('Use additional navigational aids and reduce speed');
  } else if (avgVis < 5) {
    if (riskLevel === 'low') riskLevel = 'medium';
    riskFactors.push('reduced visibility');
    recommendations.push('Maintain vigilant watch and use fog signals if appropriate');
  }
  
  // Create description
  let description: string;
  
  if (riskFactors.length === 0) {
    description = 'Favorable weather conditions along the route.';
    recommendations.push('Maintain standard watch and protocols');
  } else {
    description = `Route contains ${riskFactors.join(', ')}.`;
  }
  
  return {
    riskLevel,
    description,
    recommendations
  };
};
