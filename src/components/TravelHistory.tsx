import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Anchor, Navigation, Clock, Fuel, Wind } from "lucide-react";

interface RouteHistoryItem {
  id: string;
  startPort: string;
  endPort: string;
  distance: number;
  duration: string;
  fuelConsumption: number;
  averageSpeed: number;
  weatherConditions: string;
  date: string;
}

interface TravelHistoryProps {
  className?: string;
}

const TravelHistory = ({ className }: TravelHistoryProps) => {
  // Mock data - In a real app, this would come from your backend
  const historyItems: RouteHistoryItem[] = [
    {
      id: "1",
      startPort: "Dubai Port",
      endPort: "Mumbai Port",
      distance: 1234,
      duration: "3d 4h",
      fuelConsumption: 45.6,
      averageSpeed: 12.5,
      weatherConditions: "Calm seas, Wind 10 knots",
      date: "2024-03-15"
    },
    {
      id: "2",
      startPort: "Mumbai Port",
      endPort: "Singapore Port",
      distance: 2468,
      duration: "5d 12h",
      fuelConsumption: 78.3,
      averageSpeed: 15.2,
      weatherConditions: "Moderate seas, Wind 15 knots",
      date: "2024-03-10"
    },
    {
      id: "3",
      startPort: "Singapore Port",
      endPort: "Hong Kong Port",
      distance: 1579,
      duration: "4d 8h",
      fuelConsumption: 56.7,
      averageSpeed: 13.8,
      weatherConditions: "Rough seas, Wind 20 knots",
      date: "2024-03-05"
    }
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="text-ocean-600 dark:text-ocean-400" size={20} />
          <CardTitle className="text-xl">Travel History</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
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