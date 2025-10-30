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

  // Get visible items (3 consecutive items, wrapping around if needed)
  const getVisibleItems = (array, startIndex) => {
    const items = [];
    for (let i = 0; i < itemsPerPage; i++) {
      items.push(array[(startIndex + i) % array.length]);
    }
    return items;
  };

  // Generate next 7 days of events - one random activity per exhibit per day
  const generateNext7DaysEvents = () => {
    if (!exhibits.length || !activities.length) return [];

    const next7Days = [];
    const today = new Date();

    // Group activities by exhibit
    const activitiesByExhibit = exhibits.reduce((acc, exhibit) => {
      const exhibitActivities = activities.filter(
        (activity) => activity.Exhibit_ID === exhibit.Exhibit_ID
      );
      if (exhibitActivities.length > 0) {
        acc[exhibit.Exhibit_ID] = exhibitActivities;
      }
      return acc;
    }, {});

    // Generate one event for each of the next 7 days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const eventDate = new Date(today);
      eventDate.setDate(today.getDate() + dayOffset);

      // Get exhibits that have activities
      const exhibitsWithActivities = Object.keys(activitiesByExhibit);

      if (exhibitsWithActivities.length > 0) {
        // Pick a random exhibit for this day using date as seed for consistency
        const exhibitIndex =
          (eventDate.getDate() + dayOffset) % exhibitsWithActivities.length;
        const selectedExhibitId = exhibitsWithActivities[exhibitIndex];
        const exhibitActivities = activitiesByExhibit[selectedExhibitId];

        // Pick a random activity from this exhibit
        const activityIndex = eventDate.getDate() % exhibitActivities.length;
        const selectedActivity = exhibitActivities[activityIndex];

        next7Days.push({
          ...selectedActivity,
          displayDate: eventDate,
          dateString: eventDate.toLocaleDateString("en-US", {
            weekday: "short",
            month: "numeric",
            day: "numeric",
          }),
        });
      }
    }

    return next7Days;
  };

  const upcomingEvents = generateNext7DaysEvents();
  const visibleEvents = getVisibleItems(upcomingEvents, eventsIndex);
  const visibleExhibits = getVisibleItems(exhibits, exhibitsIndex);

  const nextEvents = () => {
    const totalEvents = upcomingEvents.length || 1;
    setEventsIndex((eventsIndex + 1) % totalEvents);
  };

  const prevEvents = () => {
    const totalEvents = upcomingEvents.length || 1;
    setEventsIndex(eventsIndex === 0 ? totalEvents - 1 : eventsIndex - 1);
  };

  const nextExhibits = () => {
    setExhibitsIndex((exhibitsIndex + 1) % exhibits.length);
  };

  const prevExhibits = () => {
    setExhibitsIndex(
      exhibitsIndex === 0 ? exhibits.length - 1 : exhibitsIndex - 1
    );
  };

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
                  className="hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                >
                  <CardHeader className="text-center">
                    <div className="mb-4 flex justify-center">
                      <div className="bg-green-600 text-white rounded-full p-4">
                        <Calendar className="h-8 w-8" />
                      </div>
                    </div>
                    <CardTitle className="text-xl mb-3 text-gray-900">
                      {event.Activity_Name}
                    </CardTitle>
                    <div className="flex items-center justify-center text-gray-700 text-sm mb-2 font-medium">
                      <Calendar className="h-4 w-4 mr-2" />
                      {event.dateString} at {formatTime(event.Display_Time)}
                    </div>
                    <div className="flex items-center justify-center text-sm text-green-700 font-medium">
                      <MapPin className="h-4 w-4 mr-1" />
                      {event.exhibit_Name}
                    </div>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {event.Activity_Description ||
                        "Join us for this exciting activity and get up close with amazing animals!"}
                    </p>
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
