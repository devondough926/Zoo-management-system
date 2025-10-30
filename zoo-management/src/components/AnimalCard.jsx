import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Heart } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

/**
 * Memoized Animal Card Component
 * Only re-renders when animal data actually changes
 */
export const AnimalCard = React.memo(
  function AnimalCard({ animal }) {
    return (
      <Card className="hover:shadow-lg transition-shadow overflow-hidden">
        <div className="aspect-square w-full overflow-hidden bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
          {animal.imageUrl ? (
            <ImageWithFallback
              src={animal.imageUrl}
              alt={animal.name}
              className="w-full h-full object-cover"
              width="300"
              height="300"
            />
          ) : (
            <Heart className="h-24 w-24 text-green-300" />
          )}
        </div>
        <CardHeader>
          <div className="flex items-start justify-between mb-2">
            <CardTitle className="text-lg">{animal.name}</CardTitle>
            <Badge
              variant="outline"
              className={`${
                animal.gender === "Male"
                  ? "bg-teal-100 text-teal-800 border-teal-300"
                  : animal.gender === "Female"
                  ? "bg-teal-100 text-teal-800 border-teal-300"
                  : "bg-gray-100 text-gray-800 border-gray-300"
              }`}
            >
              {animal.gender}
            </Badge>
          </div>
          <p className="text-gray-600">{animal.species}</p>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {animal.habitat}
          </Badge>
        </CardContent>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function - only re-render if data actually changed
    return (
      prevProps.animal.name === nextProps.animal.name &&
      prevProps.animal.species === nextProps.animal.species &&
      prevProps.animal.gender === nextProps.animal.gender &&
      prevProps.animal.habitat === nextProps.animal.habitat &&
      prevProps.animal.imageUrl === nextProps.animal.imageUrl
    );
  }
);
