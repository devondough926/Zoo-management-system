import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { MapPin } from "lucide-react";
import { exhibitsAPI, activitiesAPI } from "../services/customerAPI";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { getExhibitImage } from "../utils/imageMapping";

export function AttractionsPage() {
  const [exhibits, setExhibits] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setExhibits([]);
        setActivities([]);

        const [exhibitsData, activitiesData] = await Promise.all([
          exhibitsAPI.getAll(),
          activitiesAPI.getAll(),
        ]);

        setExhibits(exhibitsData);
        setActivities(activitiesData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setExhibits([]);
        setActivities([]);
        setError(
          "Unable to connect to the server. Please ensure the backend is running."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Group activities by exhibit
  const getExhibitActivities = (exhibitId) => {
    return activities
      .filter((activity) => activity.Exhibit_ID === exhibitId)
      .map((activity) => activity.Activity_Name);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 to-emerald-700 text-white py-16">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl mb-4">Exhibits</h1>
          <p className="text-xl text-green-100 max-w-2xl">
            Explore our world-class habitats and discover amazing animals from
            every corner of the globe across 4 themed zones.
          </p>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-gray-500">Loading exhibits...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-16">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
            <p className="text-red-600 font-semibold mb-2">Connection Error</p>
            <p className="text-red-500">{error}</p>
          </div>
        </div>
      ) : exhibits.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl mx-auto">
            <p className="text-yellow-600 font-semibold mb-2">
              No Data Available
            </p>
            <p className="text-yellow-700">Unable to load exhibits data.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Exhibits Grid */}
          <section className="py-16">
            <div className="container mx-auto px-6">
              <h2 className="text-3xl mb-8 text-center">All Exhibits</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {exhibits.map((exhibit) => (
                  <Card
                    key={exhibit.Exhibit_ID}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <div className="h-48 bg-gradient-to-br from-green-100 to-emerald-100 overflow-hidden">
                      {getExhibitImage(exhibit) ? (
                        <ImageWithFallback
                          src={getExhibitImage(exhibit)}
                          alt={exhibit.exhibit_Name}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="h-48 flex items-center justify-center">
                          <MapPin className="h-20 w-20 text-green-300" />
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <CardTitle className="flex items-start justify-between">
                        <span className="text-lg">{exhibit.exhibit_Name}</span>
                      </CardTitle>
                      <Badge className="bg-green-100 text-green-800 w-fit">
                        Zone {exhibit.Zone_Name}
                      </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-600 text-sm">
                        {exhibit.exhibit_Description}
                      </p>

                      {getExhibitActivities(exhibit.Exhibit_ID).length > 0 && (
                        <div>
                          <p className="font-medium text-gray-900 mb-2 text-sm">
                            Featured Activities:
                          </p>
                          <ul className="space-y-1">
                            {getExhibitActivities(exhibit.Exhibit_ID).map(
                              (activity, idx) => (
                                <li
                                  key={idx}
                                  className="text-sm text-gray-600 flex items-start"
                                >
                                  <span className="text-green-600 mr-2">•</span>
                                  {activity}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Zone Information */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-6">
              <h2 className="text-3xl mb-8 text-center">Zoo Zones</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-3xl text-orange-600 mb-2">🦁</div>
                    <h3 className="text-xl font-semibold mb-2">Zone A</h3>
                    <p className="text-sm text-gray-600">African Savanna</p>
                    <p className="text-sm text-gray-600">Big Cat Territory</p>
                    <div className="mt-4 text-xs text-gray-500">
                      🍔 Safari Grill
                    </div>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-3xl text-green-600 mb-2">🦍</div>
                    <h3 className="text-xl font-semibold mb-2">Zone B</h3>
                    <p className="text-sm text-gray-600">Primate Forest</p>
                    <p className="text-sm text-gray-600">Reptile House</p>
                    <div className="mt-4 text-xs text-gray-500">
                      🍦 Polar Cafe
                    </div>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-3xl text-yellow-600 mb-2">🦘</div>
                    <h3 className="text-xl font-semibold mb-2">Zone C</h3>
                    <p className="text-sm text-gray-600">Australian Outback</p>
                    <p className="text-sm text-gray-600">Tropical Rainforest</p>
                    <div className="mt-4 text-xs text-gray-500">
                      🥤 Rainforest Refreshments
                    </div>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-3xl text-blue-600 mb-2">🦅</div>
                    <h3 className="text-xl font-semibold mb-2">Zone D</h3>
                    <p className="text-sm text-gray-600">Bird Sanctuary</p>
                    <p className="text-sm text-gray-600">
                      N. American Wilderness
                    </p>
                    <div className="mt-4 text-xs text-gray-500">
                      🍕 Desert Diner
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
