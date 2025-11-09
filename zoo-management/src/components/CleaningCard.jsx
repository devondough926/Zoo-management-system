import { Card, CardContent, CardHeader } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { CheckCircle2, FastForward } from "lucide-react";

/**
 * CleaningCard Component
 * Displays habitat cleaning schedule information
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
export function CleaningCard({
  data,
  onClean,
  onCancel,
  onSkip,
  loading = false,
}) {
  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getProgressColor = () => {
    if (data.days_remaining === 0 || data.status === "Overdue") {
      return "bg-red-600";
    } else if (data.days_remaining <= 2 || data.status === "Due Soon") {
      return "bg-yellow-500";
    }
    return "bg-green-600";
  };

  const getDaysRemainingColor = () => {
    if (data.days_remaining === 0) {
      return "text-red-600";
    } else if (data.days_remaining <= 2) {
      return "text-yellow-600";
    }
    return "text-green-600";
  };

  return (
    <Card className="shadow-sm border rounded-lg">
      <CardHeader className="pb-3">
        <div className="space-y-2">
          <h3 className="text-base font-semibold">{data.Enclosure_Name}</h3>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Zone: {data.Zone}</span>
            <span>Size: {data.Size?.toLocaleString()} sq ft</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Last Cleaned and Next Due */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            <p className="text-gray-500">Last cleaned:</p>
            <p className="text-gray-900 font-medium">
              {formatDate(data.last_cleaned)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-500">Next due:</p>
            <p className="text-gray-900 font-medium">
              {formatDate(data.next_due)}
            </p>
          </div>
        </div>

        {/* Cleaning Cycle Progress */}
        <div>
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-gray-600 font-medium">
              Cleaning Cycle Progress
            </span>
            <span className={`font-semibold ${getDaysRemainingColor()}`}>
              {data.days_remaining} day{data.days_remaining !== 1 ? "s" : ""}{" "}
              remaining
            </span>
          </div>

          {/* Progress Bar with Skip Button */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${getProgressColor()}`}
                style={{ width: `${Math.min(100, data.progress_percent)}%` }}
              />
            </div>
            {data.last_cleaned && data.days_remaining > 0 && (
              <button
                onClick={() => onSkip(data)}
                disabled={loading}
                className="p-1.5 rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
                aria-label="Skip one day"
              >
                <FastForward className="h-5 w-5 text-blue-600" />
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={() => onClean(data)}
            disabled={loading}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
            size="sm"
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Clean Now
          </Button>
          <Button
            onClick={() => onCancel(data)}
            disabled={loading}
            variant="outline"
            size="sm"
            className="bg-yellow-50 border-yellow-300 text-gray-700 hover:bg-yellow-100"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
