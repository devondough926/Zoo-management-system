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
import { useWeather } from "../contexts/WeatherContext";

/**
 * Memoized Exhibit Card Component
 * Only re-renders when exhibit data actually changes
 */
export const ExhibitCard = React.memo(
  function ExhibitCard({ exhibit, activities }) {
    const { isExhibitClosed } = useWeather();
    const isClosed = isExhibitClosed({ Enclosure_Type: exhibit.enclosureType });

    return (
      <Card className="hover:shadow-lg transition-shadow overflow-hidden relative">
        <div className="h-48 bg-gradient-to-br from-green-100 to-emerald-100 overflow-hidden relative">
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

          {/* Closed Banner - Diagonal across top right */}
          {isClosed && (
            <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden">
              <div
                className="absolute bg-red-600 text-white font-bold text-xs py-1 px-8 shadow-lg transform rotate-45 origin-top-right"
                style={{
                  top: "28px",
                  right: "-32px",
                  width: "160px",
                  textAlign: "center",
                }}
              >
                CLOSED
              </div>
            </div>
          )}
        </div>
        <CardHeader>
          <CardTitle className="flex items-start justify-between">
            <span className="text-lg">{exhibit.name}</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 w-fit">
              Zone {exhibit.zone}
            </Badge>
            {/* Exhibit type shown as plain text (no badge) when available */}
            {exhibit.enclosureType && (
              <span className="text-sm text-red-600 ml-2 italic">
                {exhibit.enclosureType}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* closure reason and small Closed badge removed per design request */}

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
      prevProps.exhibit.enclosureType === nextProps.exhibit.enclosureType &&
      prevProps.exhibit.imageUrl === nextProps.exhibit.imageUrl &&
      JSON.stringify(prevProps.activities) ===
        JSON.stringify(nextProps.activities)
    );
  }
);
