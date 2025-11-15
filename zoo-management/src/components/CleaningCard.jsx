import { CheckCircle2, SkipForward } from "lucide-react";
import { useWeather } from "../contexts/WeatherContext";

/**
 * CleaningCard Component
 * Displays habitat cleaning schedule information with custom ZookeeperPortal styling
 *
 * @param {Object} props
 * @param {Object} props.data - Cleaning card data from cleaning_card_data view
 * @param {number} props.data.Enclosure_ID - Enclosure ID
 * @param {string} props.data.Enclosure_Name - Name of the enclosure/habitat
 * @param {number} props.data.Size - Size in square feet
 * @param {string} props.data.last_cleaned - Last cleaned date (YYYY-MM-DD)
 * @param {string} props.data.Zone - Zone letter (A, B, C, etc.)
 * @param {number} props.data.skip_days - Number of days skipped
 * @param {number} props.data.days_passed - Days since last cleaning
 * @param {number} props.data.days_remaining - Days until cleaning is due
 * @param {string} props.data.next_due - Next due date (YYYY-MM-DD)
 * @param {number} props.data.progress_percent - Progress percentage (0-100)
 * @param {string} props.data.status - Status: 'Clean', 'Due Soon', 'Overdue', 'Never Cleaned'
 * @param {Function} props.onClean - Callback when "Clean Now" is clicked
 * @param {Function} props.onCancel - Callback when "Cancel" is clicked
 * @param {Function} props.onSkip - Callback when skip/fast-forward is clicked
 * @param {boolean} props.loading - Whether actions are loading
 */
export function CleaningCard({ data, onClean, onSkip, loading = false }) {
  const { isExhibitClosed, getClosureReason } = useWeather();
  const enclosureType =
    data.Enclosure_Type ||
    data.enclosureType ||
    data.EnclosureType ||
    data.Type ||
    data.type;

  // Prefer server-provided Is_Closed when true, but allow client-side
  // weather selection to close exhibits immediately as well. This avoids
  // the UI remaining open when the server hasn't updated Is_Closed yet.
  const serverClosed = Boolean(data.Is_Closed);
  const weatherClosed = isExhibitClosed({ Enclosure_Type: enclosureType });
  const isClosed = serverClosed || weatherClosed;

  // Helper: format a hex color (#rrggbb) to "r,g,b" for use in rgba() via CSS variables
  const hexToRgb = (hex) => {
    if (!hex) return "0,0,0";
    const h = hex.replace("#", "").trim();
    if (h.length === 3) {
      const r = parseInt(h[0] + h[0], 16);
      const g = parseInt(h[1] + h[1], 16);
      const b = parseInt(h[2] + h[2], 16);
      return `${r},${g},${b}`;
    }
    if (h.length === 6) {
      const r = parseInt(h.slice(0, 2), 16);
      const g = parseInt(h.slice(2, 4), 16);
      const b = parseInt(h.slice(4, 6), 16);
      return `${r},${g},${b}`;
    }
    return "0,0,0";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Color-coded progress bar based on progress percentage
  const progressColor =
    data.progress_percent >= 75
      ? "#dc2626" // red-600
      : data.progress_percent >= 50
      ? "#ea580c" // orange-600
      : data.progress_percent >= 25
      ? "#ca8a04" // yellow-600
      : "#059669"; // emerald-600

  // Color-coded days remaining text
  const daysColor =
    data.days_remaining < 0
      ? "#dc2626" // red-600
      : data.days_remaining === 0
      ? "#ea580c" // orange-600
      : data.days_remaining <= 2
      ? "#ca8a04" // yellow-600
      : "#059669"; // emerald-600

  // Clean Now button availability - only allow if 4+ days passed
  const cleanDisabled = data.days_passed < 4 || loading || isClosed;

  // Percentage text color: white when the colored fill has passed the center
  // (center is at ~50%). This makes the percentage readable when the
  // progress fill overlaps the centered text.
  // Coerce progress to number (handles strings like "100") and decide color
  const _pct = Number(data.progress_percent) || 0;
  const percentTextColor = _pct >= 50 ? "#ffffff" : "#111827";

  const percentTextShadow =
    percentTextColor === "#ffffff"
      ? "0 1px 2px rgba(0,0,0,0.6)"
      : "0 1px 2px rgba(255,255,255,0.8)";

  return (
    <>
      <style>
        {`
          @keyframes prog-move {
            0% {
              background-position: 0 0;
            }
            100% {
              background-position: 28px 0;
            }
          }
        `}
      </style>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(180deg, #ecfdf5 0%, #ffffff 100%)",
          borderRadius: 8,
          padding: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)",
        }}
      >
        {isClosed && (
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              overflow: "hidden",
              zIndex: 50,
            }}
          >
            <div
              className="absolute bg-red-600 text-white font-bold text-xs py-1 px-8 shadow-lg transform rotate-45 origin-top-right"
              style={{
                top: "28px",
                right: "-32px",
                width: "160px",
                textAlign: "center",
              }}
              title={getClosureReason({ Enclosure_Type: enclosureType })}
            >
              CLOSED
            </div>
          </div>
        )}

        {/* When closed, blur the card content but keep the banner sharp above it */}
        <div
          style={{
            filter: isClosed ? "blur(2px)" : "none",
            transition: "filter 0.18s ease",
            pointerEvents: isClosed ? "none" : "auto",
          }}
        >
          {/* Card Header */}
          <div style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              {data.Enclosure_Name}
            </h3>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 14,
                color: "#6b7280",
              }}
            >
              <span>Zone: {data.Zone}</span>
              <span>Size: {data.Size?.toLocaleString()} sq ft</span>
            </div>
          </div>

          {/* Last Cleaned and Next Due */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 16,
              marginBottom: 12,
              fontSize: 14,
            }}
          >
            <div>
              <p style={{ color: "#9ca3af", marginBottom: 4 }}>Last cleaned:</p>
              <p style={{ fontWeight: 500, color: "#111827" }}>
                {formatDate(data.last_cleaned)}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ color: "#9ca3af", marginBottom: 4 }}>Next due:</p>
              <p style={{ fontWeight: 500, color: "#111827" }}>
                {formatDate(data.next_due)}
              </p>
            </div>
          </div>

          {/* Progress Section */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
                fontSize: 14,
              }}
            >
              <span style={{ fontWeight: 500, color: "#4b5563" }}>
                Cleaning Cycle Progress
              </span>
              <span style={{ fontWeight: 600, color: daysColor }}>
                {data.days_remaining} day{data.days_remaining !== 1 ? "s" : ""}{" "}
                remaining
              </span>
            </div>

            {/* Progress Track with Skip Button */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div
                className="progress-track-frame"
                style={{
                  flex: 1,
                  position: "relative",
                  height: 28,
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  padding: 2,
                  backgroundColor: "#f9fafb",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 2,
                    left: 2,
                    width: `calc(${Math.min(
                      100,
                      data.progress_percent
                    )}% - 4px)`,
                    height: "calc(100% - 4px)",
                    backgroundColor: progressColor,
                    borderRadius: 4,
                    backgroundImage: `linear-gradient(
                    45deg,
                    rgba(255,255,255,0.15) 25%,
                    transparent 25%,
                    transparent 50%,
                    rgba(255,255,255,0.15) 50%,
                    rgba(255,255,255,0.15) 75%,
                    transparent 75%,
                    transparent
                  )`,
                    backgroundSize: "28px 28px",
                    animation: "prog-move 1s linear infinite",
                    transition: "width 0.3s ease-in-out",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: 2,
                    left: 2,
                    width: "calc(100% - 4px)",
                    height: "calc(100% - 4px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: percentTextColor,
                    fontWeight: 600,
                    fontSize: 12,
                    zIndex: 1,
                    textShadow: percentTextShadow,
                  }}
                >
                  {Math.round(data.progress_percent)}%
                </div>
              </div>

              {data.last_cleaned && data.days_remaining > 0 && !isClosed && (
                <button
                  onClick={() => onSkip(data)}
                  disabled={loading || isClosed}
                  style={{
                    padding: 6,
                    borderRadius: 4,
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: loading || isClosed ? "not-allowed" : "pointer",
                    opacity: loading || isClosed ? 0.5 : 1,
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && !isClosed)
                      e.currentTarget.style.backgroundColor = "#f3f4f6";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                  aria-label="Skip one day"
                >
                  <SkipForward
                    style={{ width: 20, height: 20, color: "#2563eb" }}
                  />
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              onClick={() => onClean(data)}
              disabled={cleanDisabled}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "8px 12px",
                backgroundColor: cleanDisabled ? "#d1d5db" : "#059669",
                color: "#ffffff",
                border: "none",
                borderRadius: 6,
                fontWeight: 500,
                fontSize: 14,
                cursor: cleanDisabled ? "not-allowed" : "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!cleanDisabled)
                  e.currentTarget.style.backgroundColor = "#047857";
              }}
              onMouseLeave={(e) => {
                if (!cleanDisabled)
                  e.currentTarget.style.backgroundColor = "#059669";
              }}
              title={
                isClosed
                  ? getClosureReason({ Enclosure_Type: enclosureType })
                  : cleanDisabled
                  ? "Must wait at least 4 days before cleaning"
                  : undefined
              }
            >
              <CheckCircle2 style={{ width: 16, height: 16 }} />
              Clean Now
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
