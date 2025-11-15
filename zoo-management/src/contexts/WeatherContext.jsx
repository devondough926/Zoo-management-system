/**
 * WeatherContext - Manages weather conditions that affect exhibit closures
 *
 * Weather conditions from the database:
 * - Rain: Closes Outdoor and Hybrid exhibits
 * - Storm: Closes Outdoor and Hybrid exhibits
 * - High Wind: Closes Outdoor and Hybrid exhibits
 * - Snow: Closes Outdoor exhibits only
 * - Extreme Heat: Closes ALL exhibits
 * - Extreme Cold: Closes ALL exhibits
 */

import { createContext, useContext, useState, useEffect } from "react";

const WeatherContext = createContext(undefined);

export const WEATHER_CONDITIONS = [
  { id: 1, type: "Rain" },
  { id: 2, type: "Storm" },
  { id: 3, type: "Extreme Heat" },
  { id: 4, type: "Extreme Cold" },
  { id: 5, type: "High Wind" },
  { id: 6, type: "Snow" },
];

export function WeatherProvider({ children }) {
  // Load initial weather from localStorage
  const [selectedWeather, setSelectedWeather] = useState(() => {
    try {
      const saved = localStorage.getItem("zoo_selected_weather");
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Error loading weather from localStorage:", error);
      return null;
    }
  });

  // Save to localStorage whenever weather changes
  useEffect(() => {
    try {
      if (selectedWeather) {
        localStorage.setItem(
          "zoo_selected_weather",
          JSON.stringify(selectedWeather)
        );
      } else {
        localStorage.removeItem("zoo_selected_weather");
      }
    } catch (error) {
      console.error("Error saving weather to localStorage:", error);
    }
  }, [selectedWeather]);

  /**
   * Determines if an exhibit should be closed based on weather
   * @param {Object} exhibit - The exhibit object with Enclosure_Type property
   * @returns {boolean} - True if exhibit should be closed
   */
  const isExhibitClosed = (exhibit) => {
    if (!selectedWeather || !exhibit) return false;

    const weatherType = selectedWeather.type;
    const enclosureType = exhibit.Enclosure_Type || exhibit.enclosure_Type;

    // Extreme conditions close ALL exhibits
    if (weatherType === "Extreme Heat" || weatherType === "Extreme Cold") {
      return true;
    }

    // Rain, Storm, High Wind close Outdoor and Hybrid exhibits
    if (["Rain", "Storm", "High Wind"].includes(weatherType)) {
      return enclosureType === "Outdoor" || enclosureType === "Hybrid";
    }

    // Snow closes only Outdoor exhibits
    if (weatherType === "Snow") {
      return enclosureType === "Outdoor";
    }

    return false;
  };

  /**
   * Gets the closure reason text for a closed exhibit
   * @param {Object} exhibit - The exhibit object
   * @returns {string|null} - Closure reason text or null if not closed
   */
  const getClosureReason = (exhibit) => {
    if (!isExhibitClosed(exhibit)) return null;
    return `Closed due to ${selectedWeather.type}`;
  };

  const value = {
    selectedWeather,
    setSelectedWeather,
    isExhibitClosed,
    getClosureReason,
    weatherConditions: WEATHER_CONDITIONS,
  };

  return (
    <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>
  );
}

export function useWeather() {
  const context = useContext(WeatherContext);
  if (context === undefined) {
    throw new Error("useWeather must be used within a WeatherProvider");
  }
  return context;
}
