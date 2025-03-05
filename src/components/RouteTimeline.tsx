
import { Card, CardContent } from "@/components/ui/card";
import { RouteResult } from "@/utils/routeUtils";

interface RouteTimelineProps {
  routeData: RouteResult;
  className?: string;
}

const RouteTimeline = ({ routeData, className }: RouteTimelineProps) => {
  if (!routeData.journeyDetails.checkpoints || routeData.journeyDetails.checkpoints.length < 2) {
    return null;
  }

  const checkpoints = routeData.journeyDetails.checkpoints;
  
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4 text-ocean-800 dark:text-ocean-200">Distances & Time</h3>
        
        <div className="relative pl-8 pb-1">
          {/* Vertical line */}
          <div className="absolute left-3 top-2 bottom-0 w-0.5 bg-blue-500"></div>
          
          {/* Route checkpoints */}
          {checkpoints.map((checkpoint, index) => (
            <div key={index} className="mb-6 relative">
              {/* Bullet point */}
              <div className="absolute left-[-26px] top-0 w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center">
                {index === 0 || index === checkpoints.length - 1 ? 
                  <div className="w-2 h-2 rounded-full bg-white"></div> : 
                  <div className="w-2 h-2 rounded-full bg-white opacity-70"></div>
                }
              </div>
              
              {/* Content */}
              <div className="pb-1">
                <h4 className="font-semibold text-ocean-700 dark:text-ocean-300">
                  {index === 0 ? 'Origin: ' : index === checkpoints.length - 1 ? 'Destination: ' : 'Checkpoint: '}
                  {routeData.routeType}
                </h4>
                {checkpoint.distance > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {checkpoint.distance.toLocaleString()} km ({Math.round(checkpoint.distance * 0.539957).toLocaleString()} nautical mi)
                  </p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Transit Time: {index === 0 ? '0' : 
                    Math.floor((index / (checkpoints.length - 1)) * routeData.journeyDetails.totalDurationHours / 24)} days
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Average Speed: {routeData.routeType === 'Fuel Efficient' ? '12' : '14'} knots
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RouteTimeline;
