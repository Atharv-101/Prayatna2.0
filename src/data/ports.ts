
export interface Port {
  id: string;
  name: string;
  country: string;
  coordinates: [number, number]; // [longitude, latitude]
  size: 'small' | 'medium' | 'large';
  facilities: string[];
  depth: number; // in meters
  description: string;
}

export const majorPorts: Port[] = [
  {
    id: "USNYC",
    name: "Port of New York and New Jersey",
    country: "United States",
    coordinates: [-74.0060, 40.7128],
    size: "large",
    facilities: ["Container Terminal", "Cruise Terminal", "Bulk Cargo", "Oil Terminal"],
    depth: 15.2,
    description: "One of the largest natural harbors in the world, the Port of New York and New Jersey is a major gateway for international trade."
  },
  {
    id: "NLRTM",
    name: "Port of Rotterdam",
    country: "Netherlands",
    coordinates: [4.4000, 51.9000],
    size: "large",
    facilities: ["Container Terminal", "Bulk Cargo", "Oil Terminal", "LNG Terminal"],
    depth: 24,
    description: "The largest seaport in Europe, the Port of Rotterdam has been the world's busiest port for many years."
  },
  {
    id: "CNSHA",
    name: "Port of Shanghai",
    country: "China",
    coordinates: [121.8000, 31.2000],
    size: "large",
    facilities: ["Container Terminal", "Bulk Cargo", "Oil Terminal", "Ro-Ro Terminal"],
    depth: 17.5,
    description: "The busiest container port in the world, handling over 40 million TEU annually."
  },
  {
    id: "SGSIN",
    name: "Port of Singapore",
    country: "Singapore",
    coordinates: [103.8198, 1.3521],
    size: "large",
    facilities: ["Container Terminal", "Bulk Cargo", "Oil Terminal", "Cruise Terminal"],
    depth: 16,
    description: "A leading maritime capital of the world, the Port of Singapore is also one of the busiest ports in terms of shipping tonnage."
  },
  {
    id: "GBLON",
    name: "Port of London",
    country: "United Kingdom",
    coordinates: [-0.1275, 51.5072],
    size: "large",
    facilities: ["Container Terminal", "Bulk Cargo", "Cruise Terminal"],
    depth: 15.5,
    description: "One of the UK's busiest ports, handling various types of cargo and cruise ships."
  },
  {
    id: "JPTYO",
    name: "Port of Tokyo",
    country: "Japan",
    coordinates: [139.6917, 35.6895],
    size: "large",
    facilities: ["Container Terminal", "Bulk Cargo", "Ferry Terminal"],
    depth: 16,
    description: "The largest port in Japan, serving the Greater Tokyo Area, one of the largest metropolitan areas in the world."
  },
  {
    id: "AEBUH",
    name: "Port of Dubai (Jebel Ali)",
    country: "United Arab Emirates",
    coordinates: [55.0273, 25.0657],
    size: "large",
    facilities: ["Container Terminal", "Bulk Cargo", "Oil Terminal"],
    depth: 17,
    description: "The largest marine terminal in the Middle East and one of the busiest ports in the world."
  },
  {
    id: "AUBNE",
    name: "Port of Brisbane",
    country: "Australia",
    coordinates: [153.1711, -27.3976],
    size: "medium",
    facilities: ["Container Terminal", "Bulk Cargo", "Cruise Terminal"],
    depth: 14,
    description: "Queensland's largest multi-cargo port, handling a diverse range of cargo types."
  },
  {
    id: "ZADUR",
    name: "Port of Durban",
    country: "South Africa",
    coordinates: [31.0292, -29.8587],
    size: "medium",
    facilities: ["Container Terminal", "Bulk Cargo", "Cruise Terminal"],
    depth: 12.8,
    description: "The largest and busiest shipping terminal in sub-Saharan Africa."
  },
  {
    id: "BRRIO",
    name: "Port of Rio de Janeiro",
    country: "Brazil",
    coordinates: [-43.2075, -22.9068],
    size: "medium",
    facilities: ["Container Terminal", "Bulk Cargo", "Cruise Terminal"],
    depth: 13.5,
    description: "One of the most important ports in Brazil, serving the city of Rio de Janeiro."
  },
  {
    id: "MXZMM",
    name: "Port of Manzanillo",
    country: "Mexico",
    coordinates: [-104.3188, 19.0522],
    size: "medium",
    facilities: ["Container Terminal", "Bulk Cargo"],
    depth: 14.5,
    description: "The busiest port in Mexico, handling a significant portion of the country's Pacific cargo."
  },
  {
    id: "INBOM",
    name: "Port of Mumbai",
    country: "India",
    coordinates: [72.8777, 19.0760],
    size: "large",
    facilities: ["Container Terminal", "Bulk Cargo", "Cruise Terminal"],
    depth: 15,
    description: "One of the largest ports in India, serving the city of Mumbai and its industrial hinterland."
  },
  {
    id: "RUSTP",
    name: "Port of St. Petersburg",
    country: "Russia",
    coordinates: [30.3351, 59.9343],
    size: "medium",
    facilities: ["Container Terminal", "Bulk Cargo", "Ferry Terminal"],
    depth: 11.5,
    description: "Russia's largest port on the Baltic Sea, handling a variety of cargo types."
  },
  {
    id: "EGALY",
    name: "Port of Alexandria",
    country: "Egypt",
    coordinates: [29.9187, 31.2000],
    size: "medium",
    facilities: ["Container Terminal", "Bulk Cargo"],
    depth: 15.8,
    description: "The main port in Egypt, serving Mediterranean shipping routes."
  },
  {
    id: "NOOSL",
    name: "Port of Oslo",
    country: "Norway",
    coordinates: [10.7522, 59.9139],
    size: "small",
    facilities: ["Container Terminal", "Bulk Cargo", "Cruise Terminal", "Ferry Terminal"],
    depth: 9.5,
    description: "The major port of Norway, handling half of the country's container traffic."
  }
];

// Function to get ports by country
export const getPortsByCountry = (country: string): Port[] => {
  return majorPorts.filter(port => port.country.toLowerCase() === country.toLowerCase());
};

// Function to get port by ID
export const getPortById = (id: string): Port | undefined => {
  return majorPorts.find(port => port.id === id);
};

// Function to get ports by search term (searches name and country)
export const searchPorts = (term: string): Port[] => {
  const searchTerm = term.toLowerCase();
  return majorPorts.filter(
    port => 
      port.name.toLowerCase().includes(searchTerm) || 
      port.country.toLowerCase().includes(searchTerm) ||
      port.id.toLowerCase().includes(searchTerm)
  );
};
