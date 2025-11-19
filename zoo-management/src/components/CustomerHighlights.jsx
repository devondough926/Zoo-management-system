import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
import { preloadImages } from "../utils/imagePreloader";
import LoadingWithIcon from "./ui/LoadingWithIcon";

const membershipBenefits = [
  "Unlimited zoo admission",
  "Exclusive member discounts",
  "Free parking",
  "Quarterly members newsletter",
];

export function CustomerHighlights() {
  const navigate = useNavigate();
  const [eventsIndex, setEventsIndex] = useState(0);
  const [exhibitsIndex, setExhibitsIndex] = useState(0);
  const [exhibits, setExhibits] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exhibitsNoTransition, setExhibitsNoTransition] = useState(false);
  const [exhibitsAnimating, setExhibitsAnimating] = useState(false);
  const exhibitsTimersRef = useRef({});

  const itemsPerPage = 3;

  // Fetch exhibits data
  useEffect(() => {
    const fetchExhibits = async () => {
      try {
        const exhibitsData = await exhibitsAPI.getAll();
        setExhibits(exhibitsData || []);
      } catch (err) {
        console.error("Error fetching exhibits:", err);
        setError(err.message);
      }
    };
    fetchExhibits();
  }, []);

  // Fetch activities - no longer needed for upcoming events
  // but kept for compatibility if needed elsewhere
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const activitiesData = await activitiesAPI.getAll();
        setActivities(activitiesData || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching activities:", err);
        setError(err.message);
        setLoading(false);
      }
    };
    fetchActivities();
  }, []);

  // Preload exhibit images for better performance
  useEffect(() => {
    if (exhibits.length > 0) {
      const imageUrls = exhibits
        .map((exhibit) => getExhibitImage(exhibit))
        .filter(Boolean);

      if (imageUrls.length > 0) {
        preloadImages(imageUrls.slice(0, 6)); // Preload first 6 exhibits
      }
    }
  }, [exhibits]);

  const handleMembershipClick = () => {
    navigate("/tickets");
    setTimeout(() => {
      const membershipsSection = document.getElementById("memberships");
      if (membershipsSection) {
        membershipsSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  // Get visible items (3 consecutive items, wrapping around if needed)
  const getVisibleItems = (array, startIndex) => {
    const items = [];
    for (let i = 0; i < itemsPerPage; i++) {
      items.push(array[(startIndex + i) % array.length]);
    }
    return items;
  };

  // Generate next 7 days of events - fetch from database based on even/odd days
  const generateNext7DaysEvents = () => {
    const next7Days = [];
    const today = new Date();

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const eventDate = new Date(today);
      eventDate.setDate(today.getDate() + dayOffset);

      // Calculate day of year to determine even/odd
      const startOfYear = new Date(eventDate.getFullYear(), 0, 0);
      const diff = eventDate - startOfYear;
      const oneDay = 1000 * 60 * 60 * 24;
      const dayOfYear = Math.floor(diff / oneDay);

      // Even days of year: Activity_Order 1, Odd days: Activity_Order 2
      const activityOrder = dayOfYear % 2 === 0 ? 1 : 2;

      // Filter activities by the activity order for this specific day
      const dayActivities = activities.filter(
        (activity) => activity.Activity_Order === activityOrder
      );

      // Randomize selection for this day
      if (dayActivities.length > 0) {
        // Use date as seed for consistent randomization per day
        const seed = eventDate.getDate() + eventDate.getMonth() * 31;
        const randomIndex = seed % dayActivities.length;
        const selectedActivity = dayActivities[randomIndex];

        // Check if this event is today
        const isToday =
          eventDate.getDate() === today.getDate() &&
          eventDate.getMonth() === today.getMonth() &&
          eventDate.getFullYear() === today.getFullYear();

        next7Days.push({
          ...selectedActivity,
          displayDate: eventDate,
          dateString: isToday
            ? "Today"
            : eventDate.toLocaleDateString("en-US", {
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

  const nextEvents = () => {
    const totalEvents = upcomingEvents.length || 1;
    setEventsIndex((eventsIndex + 1) % totalEvents);
  };

  const prevEvents = () => {
    const totalEvents = upcomingEvents.length || 1;
    setEventsIndex(eventsIndex === 0 ? totalEvents - 1 : eventsIndex - 1);
  };

  // New carousel-style next/prev to support smooth looping with cloned head/tail
  const nextExhibits = () => {
    if (!exhibits.length) return;
    if (exhibitsAnimating) return;
    const slidesPerView = itemsPerPage;
    const offsetStart = slidesPerView;
    const n = exhibits.length;
    const curr =
      typeof exhibitsIndex === "number" ? exhibitsIndex : offsetStart;
    const newIndex = curr + 1;

    // Preload upcoming visible images
    const realStart = (((newIndex - offsetStart) % n) + n) % n;
    const nextItems = [];
    for (let i = 0; i < slidesPerView; i++)
      nextItems.push(exhibits[(realStart + i) % n]);
    const urls = nextItems.map((e) => getExhibitImage(e)).filter(Boolean);

    setExhibitsAnimating(true);
    if (exhibitsTimersRef.current.timer)
      clearTimeout(exhibitsTimersRef.current.timer);
    setExhibitsNoTransition(false);
    setExhibitsIndex(newIndex);

    const transitionMs = 420;
    const clonedTailStart = offsetStart + n;
    if (newIndex >= clonedTailStart) {
      // compute target real index
      const normalized = (((newIndex - offsetStart) % n) + n) % n;
      const target = offsetStart + normalized;
      setTimeout(() => {
        setExhibitsNoTransition(true);
        setExhibitsIndex(target);
        setTimeout(() => setExhibitsNoTransition(false), 20);
      }, transitionMs);
      exhibitsTimersRef.current.timer = setTimeout(
        () => setExhibitsAnimating(false),
        transitionMs + 40
      );
    } else {
      exhibitsTimersRef.current.timer = setTimeout(
        () => setExhibitsAnimating(false),
        transitionMs + 20
      );
    }

    Promise.race([
      preloadImages(urls, "high"),
      new Promise((res) => setTimeout(res, 120)),
    ]);
  };

  const prevExhibits = () => {
    if (!exhibits.length) return;
    if (exhibitsAnimating) return;
    const slidesPerView = itemsPerPage;
    const offsetStart = slidesPerView;
    const n = exhibits.length;
    const curr =
      typeof exhibitsIndex === "number" ? exhibitsIndex : offsetStart;
    const newIndex = curr - 1;

    // Preload upcoming visible images
    const realStart = (((newIndex - offsetStart) % n) + n) % n;
    const prevItems = [];
    for (let i = 0; i < slidesPerView; i++)
      prevItems.push(exhibits[(realStart + i) % n]);
    const urls = prevItems.map((e) => getExhibitImage(e)).filter(Boolean);

    setExhibitsAnimating(true);
    if (exhibitsTimersRef.current.timer)
      clearTimeout(exhibitsTimersRef.current.timer);
    setExhibitsNoTransition(false);
    setExhibitsIndex(newIndex);

    const transitionMs = 420;
    if (newIndex < offsetStart) {
      const normalized = (((newIndex - offsetStart) % n) + n) % n;
      const target = offsetStart + normalized;
      setTimeout(() => {
        setExhibitsNoTransition(true);
        setExhibitsIndex(target);
        setTimeout(() => setExhibitsNoTransition(false), 20);
      }, transitionMs);
      exhibitsTimersRef.current.timer = setTimeout(
        () => setExhibitsAnimating(false),
        transitionMs + 40
      );
    } else {
      exhibitsTimersRef.current.timer = setTimeout(
        () => setExhibitsAnimating(false),
        transitionMs + 20
      );
    }

    Promise.race([
      preloadImages(urls, "high"),
      new Promise((res) => setTimeout(res, 120)),
    ]);
  };

  // Note: we intentionally do NOT scroll here. Preload-then-switch is handled
  // in the next/prev functions so visuals update smoothly once images are ready.

  // Format time from 24-hour to 12-hour
  const formatTime = (time) => {
    if (!time) return "";
    // Handle both "HH:MM:SS" and "HH:MM" formats from backend
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <LoadingWithIcon text="Loading..." size={56} />
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
  if (!loading && !exhibits.length) {
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
          <div className="text-center mb-12" id="upcoming-events">
            <h2 className="text-3xl md:text-4xl mb-4">Upcoming Events</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Don't miss these exciting animal activities. All events are
              included with your admission ticket!
            </p>
          </div>

          <div className="relative max-w-6xl mx-auto">
            <button
              onClick={prevEvents}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-5 bg-green-600 text-white rounded-full p-3 shadow-lg hover:bg-green-700 transition-colors cursor-pointer"
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
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-5 bg-green-600 text-white rounded-full p-3 shadow-lg hover:bg-green-700 transition-colors cursor-pointer"
              aria-label="Next events"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Exhibits */}
        <div className="mb-16">
          <div className="text-center mb-12" id="exhibits">
            <h2 className="text-3xl md:text-4xl mb-4">Exhibits</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore our amazing animal habitats from around the world.
            </p>
          </div>

          <div className="relative max-w-6xl mx-auto">
            <button
              onClick={prevExhibits}
              className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-5 bg-green-600 text-white rounded-full p-3 shadow-lg transition-colors ${
                exhibitsAnimating
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:bg-green-700 cursor-pointer"
              }`}
              aria-label="Previous exhibits"
              disabled={!!exhibitsAnimating}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <div className="overflow-hidden">
              {/** Build cloned items for seamless looping when there are more exhibits than the view **/}
              {(() => {
                const slidesPerView = itemsPerPage;
                const offsetStart = slidesPerView;
                let carouselItems = exhibits;
                if (exhibits.length > slidesPerView) {
                  carouselItems = [
                    ...exhibits.slice(-slidesPerView),
                    ...exhibits,
                    ...exhibits.slice(0, slidesPerView),
                  ];
                }

                const currentIndex =
                  typeof exhibitsIndex === "number"
                    ? exhibitsIndex
                    : offsetStart;
                const noTransition = exhibitsNoTransition;

                return (
                  <div
                    className={`flex will-change-transform ${
                      noTransition
                        ? ""
                        : "transition-transform duration-400 ease-in-out"
                    }`}
                    style={{
                      transform: `translateX(-${
                        (currentIndex || 0) * (100 / slidesPerView)
                      }%)`,
                    }}
                  >
                    {carouselItems.map((exhibit, idx) => (
                      <div
                        key={`exhibit-slide-${idx}`}
                        className="flex-none px-2"
                        style={{ flex: `0 0 calc(100% / ${slidesPerView})` }}
                      >
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                          <div className="h-48 bg-gradient-to-br from-green-100 to-emerald-100 overflow-hidden">
                            {exhibit && getExhibitImage(exhibit) ? (
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
                              {exhibit?.exhibit_Name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-green-600 mb-2 font-bold">
                              Zone {exhibit?.Zone_Name}
                            </p>
                            <p className="text-gray-600 text-sm">
                              {exhibit?.exhibit_Description}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <button
              onClick={nextExhibits}
              className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-5 bg-green-600 text-white rounded-full p-3 shadow-lg transition-colors ${
                exhibitsAnimating
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:bg-green-700 cursor-pointer"
              }`}
              aria-label="Next exhibits"
              disabled={!!exhibitsAnimating}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Membership Benefits */}
        <div className="bg-green-50 rounded-lg p-8">
          <div className="text-center mb-8" id="membership">
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
              Unlock All Benefits
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
