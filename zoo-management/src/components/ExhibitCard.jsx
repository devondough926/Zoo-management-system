import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { MapPin } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

/**
 * Memoized Exhibit Card Component
 * Only re-renders when exhibit data actually changes
 */
export const ExhibitCard = React.memo(
  function ExhibitCard({ exhibit, activities }) {
    return (
      <Card className="hover:shadow-lg transition-shadow overflow-hidden">
        <div className="h-48 bg-gradient-to-br from-green-100 to-emerald-100 overflow-hidden">
          {exhibit.imageUrl ? (
            <ImageWithFallback
              src={exhibit.imageUrl}
              alt={exhibit.name}
              className="w-full h-48 object-cover"
              width="300"
              height="192"
            />
          ) : (
            <div className="h-48 flex items-center justify-center">
              <MapPin className="h-20 w-20 text-green-300" />
            </div>
          )}
        </div>
        <CardHeader>
          <CardTitle className="flex items-start justify-between">
            <span className="text-lg">{exhibit.name}</span>
          </CardTitle>
          <Badge className="bg-green-100 text-green-800 w-fit">
            Zone {exhibit.zone}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-sm">{exhibit.description}</p>

          {activities.length > 0 && (
            <div>
              <p className="font-medium text-gray-900 mb-2 text-sm">
                Featured Activities:
              </p>
              <ul className="space-y-1">
                {activities.map((activity, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-gray-600 flex items-start"
                  >
                    <span className="text-green-600 mr-2">•</span>
                    {activity}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function - only re-render if data actually changed
    return (
      prevProps.exhibit.name === nextProps.exhibit.name &&
      prevProps.exhibit.description === nextProps.exhibit.description &&
      prevProps.exhibit.zone === nextProps.exhibit.zone &&
      prevProps.exhibit.imageUrl === nextProps.exhibit.imageUrl &&
      JSON.stringify(prevProps.activities) ===
        JSON.stringify(nextProps.activities)
    );
  }
);
