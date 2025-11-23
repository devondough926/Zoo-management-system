import React from "react";
import { Link } from "react-router-dom";
import { useWeather } from "../contexts/WeatherContext";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  CloudRain,
  CloudSnow,
  Wind,
  Sun,
  Snowflake,
  CloudLightning,
  X,
} from "lucide-react";

const weatherIcons = {
  Rain: CloudRain,
  Storm: CloudLightning,
  "Extreme Heat": Sun,
  "Extreme Cold": Snowflake,
  "High Wind": Wind,
  Snow: CloudSnow,
};

export function WeatherSelector({ isAdminView = false }) {
  const { selectedWeather, setSelectedWeather, weatherConditions } =
    useWeather();
  // pendingWeather holds the card selection until the user clicks Apply
  const [pendingWeather, setPendingWeather] = React.useState(selectedWeather);

  // Keep pendingWeather in sync when selectedWeather changes externally
  React.useEffect(() => {
    setPendingWeather(selectedWeather);
  }, [selectedWeather]);

  // Hover state for buttons
  const [isClearHover, setIsClearHover] = React.useState(false);
  const [isApplyHover, setIsApplyHover] = React.useState(false);

  // Disable Apply when there's no pending selection or the pending selection
  // is identical to the already-applied `selectedWeather`.
  const isApplyDisabled =
    !pendingWeather ||
    (selectedWeather &&
      pendingWeather &&
      pendingWeather.id === selectedWeather.id);

  const handleWeatherSelect = (condition) => {
    // toggle pending selection
    if (pendingWeather?.id === condition.id) {
      setPendingWeather(null);
    } else {
      setPendingWeather(condition);
    }
  };

  const styles = {
    section: { padding: "56px 0", backgroundColor: "#f3f4f6" },
    container: { maxWidth: 1100, margin: "0 auto", padding: "0 24px" },
    header: { textAlign: "center", marginBottom: 16 },
    title: {
      fontSize: "2rem",
      marginBottom: 8,
      lineHeight: 1.15,
      fontWeight: 600,
    },
    intro: {
      color: "#6b7280",
      maxWidth: 680,
      margin: "0 auto",
      marginBottom: 8,
    },
    badge: {
      display: "inline-block",
      marginTop: 12,
      backgroundColor: "#eef2ff",
      color: "#0f172a",
      padding: "8px 16px",
      fontSize: 14,
      borderRadius: 999,
    },
    // fixed 3 columns x 2 rows layout on larger screens
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gridAutoRows: "120px",
      gap: 20,
      maxWidth: 980,
      margin: "24px auto",
    },
    // cardStyle receives color and highlights when active
    cardStyle: (isSelected, color) => ({
      cursor: "pointer",
      transition: "transform .18s cubic-bezier(.2,.9,.2,1), box-shadow .18s",
      borderRadius: 12,
      // Keep a neutral border at all times; rely on box-shadow for selection
      border: `1px solid #e6e9ee`,
      outline: "none",
      boxShadow: isSelected
        ? `0 18px 44px ${hexToRgba(color, 0.14)}`
        : "0 6px 14px rgba(2,6,23,0.03)",
      background: "#ffffff",
      transform: isSelected ? "translateY(-6px)" : "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "visible",
    }),
    cardContent: {
      padding: 24,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 10,
    },
    iconWrap: { marginBottom: 8, position: "relative" },
    icon: (color) => ({ width: 52, height: 52, color }),
    typeText: (isSelected) => ({
      fontSize: 15,
      fontWeight: 600,
      color: isSelected ? "#111827" : "#374151",
    }),
    clearWrap: { marginTop: 18, textAlign: "center" },
    // clearer, lighter clear button (defaults to pale background; overridden by selected color)
    clearButton: {
      background: "#eef2ff",
      color: "#0f172a",
      border: "none",
      padding: "10px 20px",
      borderRadius: 999,
      cursor: "pointer",
      boxShadow: "0 6px 18px rgba(2,6,23,0.06)",
    },
    impactWrap: {
      marginTop: 28,
      maxWidth: 760,
      marginLeft: "auto",
      marginRight: "auto",
      textAlign: "center",
    },
    impactCard: {
      // stronger red tint to indicate weather impact / warning
      backgroundColor: "#fee2e2",
      border: "1px solid #fecaca",
      borderRadius: 12,
      padding: "22px 20px",
      boxShadow: "0 8px 24px rgba(2,6,23,0.04)",
    },
    impactTitle: {
      color: "#111827",
      fontWeight: 700,
      marginBottom: 8,
      fontSize: 16,
    },
    impactText: { color: "#1f2937", fontSize: 14, margin: 0 },
  };

  // softer, site-themed color map for cards (lighter tones)
  const cardColors = {
    Rain: "#60a5fa", // blue-400
    Storm: "#94a3b8", // slate-400
    "Extreme Heat": "#fbbf24", // amber-400
    "Extreme Cold": "#7dd3fc", // sky-300
    "High Wind": "#86efac", // green-200
    Snow: "#bfdbfe", // blue-200
  };

  // helper to create rgba from hex
  function hexToRgba(hex, alpha) {
    const h = hex.replace("#", "");
    const bigint = parseInt(h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return (
    <section id="weather-conditions" style={styles.section}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Weather Conditions</h2>
          {isAdminView && <p style={styles.intro}></p>}
          {selectedWeather && (
            <span
              style={{
                ...styles.badge,
                backgroundColor:
                  cardColors[selectedWeather.type] ||
                  styles.badge.backgroundColor,
              }}
            >
              Current Weather: {selectedWeather.type}
            </span>
          )}
        </div>

        {isAdminView && (
          <div style={styles.grid}>
            {weatherConditions.map((condition) => {
              const Icon = weatherIcons[condition.type];
              const isSelected = pendingWeather?.id === condition.id;
              const color = cardColors[condition.type] || "#6b7280";

              return (
                <Card
                  key={condition.id}
                  style={styles.cardStyle(isSelected, color)}
                  onClick={() => handleWeatherSelect(condition)}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow =
                        "0 10px 30px rgba(2,6,23,0.06)";
                    } else {
                      e.currentTarget.style.transform = "translateY(-8px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow =
                        "0 6px 14px rgba(2,6,23,0.03)";
                    } else {
                      e.currentTarget.style.transform = "translateY(-6px)";
                    }
                  }}
                >
                  {/* colored accent stripe at top of card (softer tone) */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 6,
                      background: isSelected ? color : hexToRgba(color, 0.18),
                      borderTopLeftRadius: 12,
                      borderTopRightRadius: 12,
                    }}
                  />
                  <CardContent style={styles.cardContent}>
                    <div style={styles.iconWrap}>
                      {Icon && (
                        <Icon
                          style={{ ...styles.icon(color), opacity: 0.95 }}
                        />
                      )}
                    </div>
                    <p style={styles.typeText(isSelected)}>{condition.type}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {isAdminView && (
          <div style={styles.clearWrap}>
            {/* Single Clear button: clears pending if present, otherwise clears applied weather */}
            <button
              onMouseEnter={() => setIsClearHover(true)}
              onMouseLeave={() => setIsClearHover(false)}
              style={{
                background: isClearHover ? "#f8fafc" : "#ffffff",
                color: "#374151",
                border: "1px solid #e5e7eb",
                padding: "10px 20px",
                borderRadius: 999,
                cursor:
                  pendingWeather || selectedWeather ? "pointer" : "not-allowed",
                boxShadow:
                  pendingWeather || selectedWeather
                    ? isClearHover
                      ? "0 10px 30px rgba(2,6,23,0.08)"
                      : "0 6px 18px rgba(2,6,23,0.04)"
                    : "none",
                marginRight: 12,
                transition: "all 160ms ease",
                transform: isClearHover ? "translateY(-2px)" : "none",
              }}
              onClick={async () => {
                if (pendingWeather) {
                  setPendingWeather(null);
                  return;
                }

                if (selectedWeather) {
                  // Clear server-side active weather
                  try {
                    const base =
                      import.meta.env.VITE_API_URL ||
                      "http://localhost:5000/api";
                    await fetch(`${base}/weather/clear`, { method: "POST" });
                  } catch (err) {
                    console.error("Failed to clear weather on server:", err);
                  }
                  setSelectedWeather(null);
                }
              }}
              disabled={!pendingWeather && !selectedWeather}
            >
              Clear
            </button>

            {/* Apply button applies the pending selection to the global weather */}
            <button
              onMouseEnter={() => setIsApplyHover(true)}
              onMouseLeave={() => setIsApplyHover(false)}
              style={{
                background: !isApplyDisabled
                  ? isApplyHover
                    ? "#0b1220"
                    : "#111827"
                  : "#f3f4f6",
                color: !isApplyDisabled ? "#ffffff" : "#9ca3af",
                border: "none",
                padding: "10px 20px",
                borderRadius: 999,
                cursor: !isApplyDisabled ? "pointer" : "not-allowed",
                boxShadow: !isApplyDisabled
                  ? isApplyHover
                    ? "0 14px 36px rgba(2,6,23,0.12)"
                    : "0 8px 20px rgba(2,6,23,0.06)"
                  : "none",
                transition: "all 160ms ease",
                transform:
                  isApplyHover && !isApplyDisabled
                    ? "translateY(-3px)"
                    : "none",
              }}
              onClick={async () => {
                if (isApplyDisabled || !pendingWeather) return;

                // First tell the server to activate this weather so DB triggers run
                try {
                  const base =
                    import.meta.env.VITE_API_URL || "http://localhost:5000/api";
                  await fetch(`${base}/weather/activate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      id: pendingWeather.id,
                      type: pendingWeather.type,
                    }),
                  });
                } catch (err) {
                  console.error("Failed to activate weather on server:", err);
                  // fall through to setSelectedWeather locally anyway
                }

                setSelectedWeather(pendingWeather);
              }}
              disabled={isApplyDisabled}
            >
              Apply
            </button>
          </div>
        )}

        {selectedWeather && (
          <div style={styles.impactWrap}>
            <div style={styles.impactCard}>
              <div
                style={{
                  padding: "8px 18px",
                  textAlign: "center",
                  width: "100%",
                }}
              >
                <p style={styles.impactTitle}>Weather Impact Information</p>
                <p style={styles.impactText}>
                  {getWeatherImpactText(selectedWeather.type)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function getWeatherImpactText(weatherType) {
  switch (weatherType) {
    case "Rain":
    case "Storm":
    case "High Wind":
      return (
        <>
          Outdoor and Hybrid{" "}
          <Link
            to="/attractions"
            style={{
              textDecoration: "underline",
              color: "#dc2626",
              fontWeight: 700,
            }}
          >
            exhibits
          </Link>{" "}
          are closed for visitor safety.
        </>
      );
    case "Snow":
      return (
        <>
          Outdoor{" "}
          <Link
            to="/attractions"
            style={{
              textDecoration: "underline",
              color: "#dc2626",
              fontWeight: 700,
            }}
          >
            exhibits
          </Link>{" "}
          are closed for visitor safety.
        </>
      );
    case "Extreme Heat":
    case "Extreme Cold":
      return (
        <>
          All{" "}
          <Link
            to="/attractions"
            style={{
              textDecoration: "underline",
              color: "#dc2626",
              fontWeight: 700,
            }}
          >
            exhibits
          </Link>{" "}
          are closed due to extreme weather conditions.
        </>
      );
    default:
      return (
        <>
          Some{" "}
          <Link
            to="/attractions"
            style={{
              textDecoration: "underline",
              color: "#dc2626",
              fontWeight: 700,
            }}
          >
            exhibits
          </Link>{" "}
          may be affected by current weather conditions.
        </>
      );
  }
}
