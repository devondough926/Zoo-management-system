import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Calendar,
  Crown,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { exhibitsAPI, activitiesAPI } from "../services/customerAPI";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { getExhibitImage } from "../utils/imageMapping";

const membershipBenefits = [
  "Unlimited zoo admission",
  "Exclusive member discounts",
  "Free parking",
  "Quarterly members newsletter",
];

export function CustomerHighlights({ onNavigate }) {
  const [exhibits, setExhibits] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventsIndex, setEventsIndex] = useState(0);
  const [exhibitsIndex, setExhibitsIndex] = useState(0);

  const itemsPerPage = 3;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setExhibits([]); // Clear any existing data
        setActivities([]); // Clear any existing data

        const [exhibitsData, activitiesData] = await Promise.all([
          exhibitsAPI.getAll(),
          activitiesAPI.getAll(),
        ]);

        setExhibits(exhibitsData);
        setActivities(activitiesData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setExhibits([]); // Ensure no data is shown on error
        setActivities([]); // Ensure no data is shown on error
        setError(
          "Unable to connect to the server. Please ensure the backend is running."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleMembershipClick = () => {
    if (onNavigate) {
      onNavigate("tickets");
      setTimeout(() => {
        const membershipsSection = document.getElementById("memberships");
        if (membershipsSection) {
          membershipsSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
    }
  };

  const nextEvents = () => {
    setEventsIndex((eventsIndex + 1) % activities.length);
  };

  const prevEvents = () => {
    setEventsIndex(eventsIndex === 0 ? activities.length - 1 : eventsIndex - 1);
  };

  const nextExhibits = () => {
    setExhibitsIndex((exhibitsIndex + 1) % exhibits.length);
  };

  const prevExhibits = () => {
    setExhibitsIndex(
      exhibitsIndex === 0 ? exhibits.length - 1 : exhibitsIndex - 1
    );
  };

  // Get visible items (3 consecutive items, wrapping around if needed)
  const getVisibleItems = (array, startIndex) => {
    const items = [];
    for (let i = 0; i < itemsPerPage; i++) {
      items.push(array[(startIndex + i) % array.length]);
    }
    return items;
  };

  const visibleEvents = getVisibleItems(activities, eventsIndex);
  const visibleExhibits = getVisibleItems(exhibits, exhibitsIndex);

  // Format time from 24-hour to 12-hour
  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
              <p className="text-red-600 font-semibold mb-2">
                Connection Error
              </p>
              <p className="text-red-500">{error}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Don't render if no data is available
  if (!loading && (!exhibits.length || !activities.length)) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center py-12">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl mx-auto">
              <p className="text-yellow-600 font-semibold mb-2">
                No Data Available
              </p>
              <p className="text-yellow-700">
                Unable to load exhibits and activities. Please check your
                connection.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-6">
        {/* Upcoming Events */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">Upcoming Events</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Don't miss these exciting animal activities. All events are
              included with your admission ticket!
            </p>
          </div>

          <div className="relative max-w-6xl mx-auto">
            <button
              onClick={prevEvents}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-green-600 text-white rounded-full p-3 shadow-lg hover:bg-green-700 transition-colors cursor-pointer"
              aria-label="Previous events"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {visibleEvents.map((event, index) => (
                <Card
                  key={`${eventsIndex}-${index}`}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-48 bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                    <Calendar className="h-24 w-24 text-green-300" />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl">
                      {event.Activity_Name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-gray-600 mb-2">
                      <Calendar className="h-4 w-4 mr-2" />
                      Daily at {formatTime(event.Display_Time)}
                    </div>
                    <div className="flex items-center text-sm text-green-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      {event.exhibit_Name}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <button
              onClick={nextEvents}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-green-600 text-white rounded-full p-3 shadow-lg hover:bg-green-700 transition-colors cursor-pointer"
              aria-label="Next events"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Exhibits */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl mb-4">Exhibits</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore our amazing animal habitats from around the world.
            </p>
          </div>

          <div className="relative max-w-6xl mx-auto">
            <button
              onClick={prevExhibits}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-green-600 text-white rounded-full p-3 shadow-lg hover:bg-green-700 transition-colors cursor-pointer"
              aria-label="Previous exhibits"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {visibleExhibits.map((exhibit, index) => (
                <Card
                  key={`${exhibitsIndex}-${index}`}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
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
                        <MapPin className="h-24 w-24 text-green-300" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl">
                      {exhibit.exhibit_Name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-green-600 mb-2">
                      Zone {exhibit.Zone_Name}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {exhibit.exhibit_Description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <button
              onClick={nextExhibits}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-green-600 text-white rounded-full p-3 shadow-lg hover:bg-green-700 transition-colors cursor-pointer"
              aria-label="Next exhibits"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Membership Benefits */}
        <div className="bg-green-50 rounded-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl mb-4 text-green-800">
              Membership Benefits
            </h2>
            <p className="text-green-600 max-w-2xl mx-auto">
              Join our zoo family and enjoy exclusive benefits year-round.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-2xl mx-auto">
            {membershipBenefits.map((benefit, index) => (
              <div key={index} className="flex items-center">
                <Crown className="h-5 w-5 text-yellow-500 mr-3" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 cursor-pointer"
              onClick={handleMembershipClick}
            >
              Become a Member
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
