
// Function to calculate the distance between two points on Earth (Haversine formula)
export const calculateDistance = (
  lon1: number, 
  lat1: number, 
  lon2: number, 
  lat2: number
): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

// Function to convert degrees to radians
export const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

// Function to calculate the time required for a journey based on distance and speed
export const calculateTime = (distance: number, speed: number): string => {
  if (speed <= 0) return "Invalid speed";
  
  // Time in hours
  const timeHours = distance / speed;
  
  // Convert to days and hours
  const days = Math.floor(timeHours / 24);
  const hours = Math.floor(timeHours % 24);
  
  if (days > 0) {
    return `${days} days, ${hours} hours`;
  }
  return `${hours} hours`;
};

// Function to calculate fuel consumption based on distance and ship type
export const calculateFuel = (distance: number, shipType: string): number => {
  // Average fuel consumption rates in tons per km for different ship types
  const fuelRates: Record<string, number> = {
    'container': 0.3,
    'bulk': 0.25,
    'tanker': 0.35,
    'cruise': 0.4,
    'ferry': 0.2,
  };
  
  const rate = fuelRates[shipType.toLowerCase()] || 0.3; // Default to container ship rate
  return distance * rate;
};

// Function to calculate waypoints between two locations (simplified direct route)
export const calculateWaypoints = (
  startLon: number, 
  startLat: number, 
  endLon: number, 
  endLat: number, 
  numPoints: number = 10
): [number, number][] => {
  const waypoints: [number, number][] = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const fraction = i / numPoints;
    const lon = startLon + (endLon - startLon) * fraction;
    const lat = startLat + (endLat - startLat) * fraction;
    waypoints.push([lon, lat]);
  }
  
  return waypoints;
};

// Function to find the nearest port to a given coordinate
export const findNearestPort = (
  ports: { coordinates: [number, number]; name: string; id: string }[],
  lon: number,
  lat: number
): { id: string; name: string; distance: number } | null => {
  if (ports.length === 0) return null;

  let nearestPort = ports[0];
  let minDistance = calculateDistance(
    lon,
    lat,
    nearestPort.coordinates[0],
    nearestPort.coordinates[1]
  );

  for (let i = 1; i < ports.length; i++) {
    const port = ports[i];
    const distance = calculateDistance(
      lon,
      lat,
      port.coordinates[0],
      port.coordinates[1]
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestPort = port;
    }
  }

  return {
    id: nearestPort.id,
    name: nearestPort.name,
    distance: minDistance
  };
};
