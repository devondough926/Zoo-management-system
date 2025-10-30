import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Clock, MapPin } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { activitiesAPI, formatTime } from "../services/customerAPI";
import { useOptimizedFetch } from "../hooks/useOptimizedFetch";

export function OperationalDashboard() {
  // Optimized data fetching with caching
  const {
    data: scheduleData,
    loading,
    error: fetchError,
  } = useOptimizedFetch(
    "todaysSchedule",
    () => activitiesAPI.getTodaysSchedule(),
    { cacheTime: 5 * 60 * 1000 } // Cache for 5 minutes
  );

  // Memoize formatted schedule to avoid recalculating on every render
  const todaysSchedule = useMemo(() => {
    if (!scheduleData) return [];

    return scheduleData.map((item) => ({
      time: formatTime(item.time),
      activity: item.Activity_Name,
      location: item.location,
      description: item.Activity_Description,
    }));
  }, [scheduleData]);

  const error = fetchError
    ? "Unable to connect to the server. Please ensure the backend is running."
    : null;

  return (
    <section className="py-16 bg-gray-100">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl mb-4">Today's Activities</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Check out all the exciting activities and experiences happening
            today at the zoo.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <p className="text-gray-500">Loading schedule...</p>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                    <p className="text-red-600 font-semibold mb-2">
                      Connection Error
                    </p>
                    <p className="text-red-500 text-sm">{error}</p>
                  </div>
                </div>
              ) : todaysSchedule.length === 0 ? (
                <div className="flex items-center justify-center h-[400px]">
                  <p className="text-gray-500">
                    No activities scheduled for today
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {todaysSchedule.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-4 w-full">
                          <div className="min-w-[90px]">
                            <span className="font-medium text-green-700">
                              {item.time}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{item.activity}</p>
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-3 w-3 mr-1" />
                              {item.location}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
