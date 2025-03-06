import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Anchor, Navigation, Clock, Fuel, Wind, DollarSign, Route, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface RouteHistoryItem {
  id: string;
  startPort: string;
  endPort: string;
  distance: number;
  duration: string;
  fuelConsumption: number;
  fuelCost: number;
  crewCost: number;
  portCharges: number;
  averageSpeed: number;
  weatherConditions: string;
  date: string;
  path: {
    location: string;
    coordinates: [number, number];
    arrivalTime: string;
  }[];
}

interface TravelHistoryProps {
  className?: string;
}

const TravelHistory = ({ className }: TravelHistoryProps) => {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Mock data - In a real app, this would come from your backend
  const historyItems: RouteHistoryItem[] = [
    {
      id: "1",
      startPort: "Dubai Port",
      endPort: "Mumbai Port",
      distance: 1234,
      duration: "3d 4h",
      fuelConsumption: 45.6,
      fuelCost: 36480,
      crewCost: 15000,
      portCharges: 8500,
      averageSpeed: 12.5,
      weatherConditions: "Calm seas, Wind 10 knots",
      date: "2024-03-15",
      path: [
        { location: "Dubai Port", coordinates: [55.27, 25.27], arrivalTime: "Start" },
        { location: "Strait of Hormuz", coordinates: [56.42, 26.68], arrivalTime: "Day 1, 08:00" },
        { location: "Arabian Sea", coordinates: [59.55, 24.12], arrivalTime: "Day 1, 18:00" },
        { location: "Mumbai Approach", coordinates: [72.45, 18.95], arrivalTime: "Day 3, 02:00" },
        { location: "Mumbai Port", coordinates: [72.85, 18.92], arrivalTime: "Day 3, 04:00" }
      ]
    },
    {
      id: "2",
      startPort: "Mumbai Port",
      endPort: "Singapore Port",
      distance: 2468,
      duration: "5d 12h",
      fuelConsumption: 78.3,
      fuelCost: 62640,
      crewCost: 25000,
      portCharges: 12000,
      averageSpeed: 15.2,
      weatherConditions: "Moderate seas, Wind 15 knots",
      date: "2024-03-10",
      path: [
        { location: "Mumbai Port", coordinates: [72.85, 18.92], arrivalTime: "Start" },
        { location: "Arabian Sea", coordinates: [75.12, 15.45], arrivalTime: "Day 1, 12:00" },
        { location: "Lakshadweep Sea", coordinates: [73.88, 10.23], arrivalTime: "Day 2, 06:00" },
        { location: "Bay of Bengal", coordinates: [85.45, 12.67], arrivalTime: "Day 3, 14:00" },
        { location: "Malacca Strait", coordinates: [98.76, 5.32], arrivalTime: "Day 4, 20:00" },
        { location: "Singapore Port", coordinates: [103.85, 1.29], arrivalTime: "Day 5, 12:00" }
      ]
    }
  ];

  const toggleExpand = (id: string) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="text-ocean-600 dark:text-ocean-400" size={20} />
          <CardTitle className="text-xl">Travel History</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {historyItems.map((item) => (
              <Card key={item.id} className="p-4 bg-background/50 hover:bg-background/80 transition-colors">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Navigation size={16} className="text-ocean-600" />
                      <span className="font-medium">{item.startPort} → {item.endPort}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{item.date}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Anchor size={14} className="text-ocean-500" />
                      <span>{item.distance} nautical miles</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-ocean-500" />
                      <span>{item.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Fuel size={14} className="text-ocean-500" />
                      <span>{item.fuelConsumption} tons</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wind size={14} className="text-ocean-500" />
                      <span>{item.weatherConditions}</span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-3">
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div className="flex items-center gap-2">
                        <DollarSign size={14} className="text-ocean-500" />
                        <span>Fuel Cost: {formatCurrency(item.fuelCost)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign size={14} className="text-ocean-500" />
                        <span>Total Cost: {formatCurrency(item.fuelCost + item.crewCost + item.portCharges)}</span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      className="w-full flex items-center justify-center gap-2 text-ocean-600"
                      onClick={() => toggleExpand(item.id)}
                    >
                      <Route size={14} />
                      <span>Detailed Path</span>
                      {expandedItem === item.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </Button>

                    {expandedItem === item.id && (
                      <div className="mt-3 space-y-2 bg-background/40 p-3 rounded-md">
                        {item.path.map((waypoint, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <div className="w-24 text-ocean-600">{waypoint.arrivalTime}</div>
                            <div className="flex-1">{waypoint.location}</div>
                            <div className="text-muted-foreground text-xs">
                              {waypoint.coordinates[0].toFixed(2)}°, {waypoint.coordinates[1].toFixed(2)}°
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TravelHistory; 