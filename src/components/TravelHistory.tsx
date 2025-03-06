import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Anchor, Calendar, Navigation } from "lucide-react";

interface TravelHistoryProps {
  className?: string;
}

interface TravelRecord {
  id: string;
  startPort: string;
  endPort: string;
  date: string;
  distance: number;
  duration: string;
}

// Sample data - In a real app, this would come from your backend
const sampleHistory: TravelRecord[] = [
  {
    id: "1",
    startPort: "Dubai Port",
    endPort: "Port of Fujairah",
    date: "2024-03-15",
    distance: 145,
    duration: "12h 30m"
  },
  {
    id: "2",
    startPort: "Port of Fujairah",
    endPort: "Muscat Port",
    date: "2024-03-12",
    distance: 280,
    duration: "1d 2h"
  },
  {
    id: "3",
    startPort: "Jebel Ali Port",
    endPort: "Dubai Port",
    date: "2024-03-10",
    distance: 35,
    duration: "3h 15m"
  }
];

const TravelHistory = ({ className = "" }: TravelHistoryProps) => {
  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="text-ocean-600 dark:text-ocean-400" size={20} />
          <CardTitle className="text-xl">Travel History</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {sampleHistory.map((record) => (
              <div
                key={record.id}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Navigation size={16} className="text-ocean-500" />
                      <span className="font-medium">{record.startPort}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Anchor size={16} className="text-ocean-500" />
                      <span className="font-medium">{record.endPort}</span>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                    <div>{new Date(record.date).toLocaleDateString()}</div>
                    <div>{record.distance} km</div>
                    <div>{record.duration}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TravelHistory; 