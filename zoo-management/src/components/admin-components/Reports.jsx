import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import {
  BarChart,
  ComposedChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Label as RechartsLabel,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  Calendar,
  Settings,
  Activity,
  TrendingUp,
  Zap,
  Receipt,
  BarChart3,
  FileText,
} from "lucide-react";

export function Reports({ detailedTransactions }) {
  // Revenue Report Builder - Interactive Controls
  const [revenueReportConfig, setRevenueReportConfig] = useState({
    showPeakDays: false,
    showDayOfWeekAnalysis: false,
    showHourlyTrends: false,
    peakDaysLimit: 10,
    peakDaysShowCategory: true,
    peakDaysShowDayType: true,
    dayOfWeekShowGap: true,
    dayOfWeekShowTransactions: true,
    hourlyShowTopPeak: 4,
    hourlyShowAllHours: false,
    hourlyShowRevenueData: true,
  });
  const [revenueReportGenerated, setRevenueReportGenerated] = useState(false);
  const [isGeneratingRevenue, setIsGeneratingRevenue] = useState(false);

  // Day of Week date range state
  const [dayOfWeekRange, setDayOfWeekRange] = useState("all");
  const [dayOfWeekCustomRange, setDayOfWeekCustomRange] = useState({
    from: null,
    to: null,
  });
  const [dayOfWeekPopoverOpen, setDayOfWeekPopoverOpen] = useState(false);
  const [prevDayOfWeekCustomRange, setPrevDayOfWeekCustomRange] =
    useState(null);

  // Hourly date range state
  const [hourlyRange, setHourlyRange] = useState("all");
  const [hourlyCustomRange, setHourlyCustomRange] = useState({
    from: null,
    to: null,
  });
  const [hourlyPopoverOpen, setHourlyPopoverOpen] = useState(false);
  const [prevHourlyCustomRange, setPrevHourlyCustomRange] = useState(null);

  // Today's date for date picker max
  const todayOnly = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Helper functions for date filtering and formatting
  const filterTransactionsByRange = (transactions, range, customRange) => {
    if (!transactions || transactions.length === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let startDate, endDate;

    if (range === "today") {
      startDate = new Date(today);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
    } else if (range === "week") {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
    } else if (range === "month") {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
    } else if (range === "custom" && customRange?.from) {
      startDate = new Date(customRange.from);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customRange.to || customRange.from);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // "all" - return all transactions
      return transactions;
    }

    return transactions.filter((t) => {
      const purchaseDate = new Date(t.Purchase_Date);
      return purchaseDate >= startDate && purchaseDate <= endDate;
    });
  };

  const formatShortDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getRangeLabel = (range, customRange) => {
    if (range === "today") return "Today";
    if (range === "week") return "Past Week";
    if (range === "month") return "Past Month";
    if (range === "all") return "All Time";
    if (range === "custom" && customRange?.from && customRange?.to) {
      return `${formatShortDate(customRange.from)} - ${formatShortDate(
        customRange.to
      )}`;
    }
    return "All Time";
  };

  const canApplyRange = (customRange) => {
    if (!customRange || !customRange.from || !customRange.to) return false;
    try {
      return customRange.to.getTime() !== customRange.from.getTime();
    } catch (e) {
      return false;
    }
  };

  // Filtered transactions for each section
  const dayOfWeekTransactions = useMemo(
    () =>
      filterTransactionsByRange(
        detailedTransactions,
        dayOfWeekRange,
        dayOfWeekCustomRange
      ),
    [detailedTransactions, dayOfWeekRange, dayOfWeekCustomRange]
  );

  const hourlyTransactions = useMemo(
    () =>
      filterTransactionsByRange(
        detailedTransactions,
        hourlyRange,
        hourlyCustomRange
      ),
    [detailedTransactions, hourlyRange, hourlyCustomRange]
  );

  return (
    <section id="revenue-report">
      <div
        style={{
          background: "#667eea",
          borderRadius: "1rem",
          padding: "1.25rem",
          marginBottom: "1rem",
          boxShadow: "0 6px 18px rgba(102, 126, 234, 0.18)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-50px",
            right: "-50px",
            width: "200px",
            height: "200px",
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: "50%",
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-30px",
            left: "-30px",
            width: "150px",
            height: "150px",
            background: "rgba(255, 255, 255, 0.08)",
            borderRadius: "50%",
            filter: "blur(35px)",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "0.75rem",
            }}
          >
            <div
              style={{
                width: "3rem",
                height: "3rem",
                background: "rgba(255, 255, 255, 0.14)",
                backdropFilter: "blur(8px)",
                borderRadius: "0.85rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1.5px solid rgba(255, 255, 255, 0.22)",
              }}
            >
              <FileText
                style={{
                  height: "1.5rem",
                  width: "1.5rem",
                  color: "#ffffff",
                }}
              />
            </div>
            <h2
              style={{
                fontSize: "1.5rem",
                color: "#ffffff",
                fontWeight: 700,
                margin: 0,
                letterSpacing: "-0.4px",
              }}
            >
              Advanced Analytics
            </h2>
          </div>
          <p
            style={{
              fontSize: "1rem",
              color: "rgba(255, 255, 255, 0.9)",
              margin: 0,
              lineHeight: "1.6",
              maxWidth: "600px",
            }}
          ></p>
        </div>
      </div>
      {revenueReportGenerated && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            marginBottom: "1.5rem",
          }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRevenueReportGenerated(false)}
            style={{
              cursor: "pointer",
              border: "1px solid #d1d5db",
              padding: "0.375rem 0.75rem",
              borderRadius: "0.375rem",
            }}
          >
            <Settings
              style={{
                height: "1rem",
                width: "1rem",
                marginRight: "0.5rem",
              }}
            />
            Reconfigure
          </Button>
        </div>
      )}

      {!revenueReportGenerated ? (
        <Card
          style={{
            border: "none",
            backgroundColor: "#ffffff",
            borderRadius: "1.25rem",
            boxShadow:
              "0 20px 60px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "linear-gradient(180deg, #e0f2fe 0%, #f0f9ff 100%)",
              padding: "1.25rem",
              borderBottom: "1px solid rgba(59, 130, 246, 0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                marginBottom: "0.75rem",
              }}
            >
              <div
                style={{
                  width: "2.5rem",
                  height: "2.5rem",
                  background:
                    "linear-gradient(180deg, #2563eb 0%, #3b82f6 100%)",
                  borderRadius: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 12px rgba(59, 130, 246, 0.18)",
                }}
              >
                <Settings
                  style={{
                    height: "1.5rem",
                    width: "1.5rem",
                    color: "#ffffff",
                  }}
                />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "#1e40af",
                    margin: 0,
                    letterSpacing: "-0.4px",
                  }}
                >
                  Detailed Insights
                </h3>
                <p
                  style={{
                    color: "#64748b",
                    fontSize: "0.85rem",
                    margin: "0.2rem 0 0 0",
                    lineHeight: "1.4",
                  }}
                >
                  Select and customize insights to uncover revenue opportunities
                  and optimize business strategy
                </p>
              </div>
            </div>
          </div>
          <CardContent
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              padding: "1rem",
            }}
          >
            {/* Report Sections */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              {/* Peak Revenue Days Section */}
              <div
                role="button"
                aria-pressed={revenueReportConfig.showPeakDays}
                onClick={(e) => {
                  // avoid toggling when interacting with form controls inside
                  if (
                    e.target.closest &&
                    e.target.closest("input,select,button,textarea,label")
                  )
                    return;
                  setRevenueReportConfig((prev) => ({
                    ...prev,
                    showPeakDays: !prev.showPeakDays,
                    showDayOfWeekAnalysis: !prev.showPeakDays
                      ? false
                      : prev.showDayOfWeekAnalysis,
                    showHourlyTrends: !prev.showPeakDays
                      ? false
                      : prev.showHourlyTrends,
                  }));
                }}
                style={{
                  padding: "1rem",
                  background: revenueReportConfig.showPeakDays
                    ? "#eaf2ff"
                    : "#f3f4f6",
                  borderRadius: "1rem",
                  borderTop: revenueReportConfig.showPeakDays
                    ? "4px solid #60a5fa"
                    : "4px solid #e5e7eb",
                  transition: "all 0.25s ease",
                  boxShadow: revenueReportConfig.showPeakDays
                    ? "0 6px 14px rgba(59, 130, 246, 0.08)"
                    : "0 2px 6px rgba(0, 0, 0, 0.03)",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    <label
                      htmlFor="peakDays"
                      style={{
                        fontSize: "1.125rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        color: "#111827",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <BarChart3
                        style={{
                          height: "1.25rem",
                          width: "1.25rem",
                          color: "#2563eb",
                        }}
                      />
                      Peak Revenue Days
                    </label>
                    <Checkbox
                      id="peakDays"
                      style={{ accentColor: "#ffffff", color: "#ffffff" }}
                      checked={revenueReportConfig.showPeakDays}
                      onCheckedChange={(checked) =>
                        setRevenueReportConfig({
                          ...revenueReportConfig,
                          showPeakDays: checked,
                          showDayOfWeekAnalysis: checked
                            ? false
                            : revenueReportConfig.showDayOfWeekAnalysis,
                          showHourlyTrends: checked
                            ? false
                            : revenueReportConfig.showHourlyTrends,
                        })
                      }
                    />
                  </div>
                  {revenueReportConfig.showPeakDays && (
                    <Badge
                      style={{
                        backgroundColor: "#3b82f6",
                        color: "#ffffff",
                        padding: "0.35rem 0.6rem",
                        borderRadius: 999,
                        fontSize: "0.75rem",
                        fontWeight: 700,
                      }}
                    >
                      Selected
                    </Badge>
                  )}
                </div>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#6b7280",
                    marginBottom: revenueReportConfig.showPeakDays
                      ? "1rem"
                      : "0",
                    lineHeight: "1.5",
                  }}
                >
                  Identify top revenue-generating days with detailed patterns
                  and insights
                </p>
                {revenueReportConfig.showPeakDays && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(250px, 1fr))",
                      gap: "1rem",
                      marginTop: "1rem",
                      paddingTop: "1rem",
                      borderTop: "1px solid #dbeafe",
                    }}
                  >
                    <div>
                      <Label
                        htmlFor="peakDaysLimit"
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          color: "#374151",
                        }}
                      >
                        Number of Days to Show
                      </Label>
                      <div style={{ marginTop: 8 }}>
                        <input
                          id="peakDaysLimit"
                          type="number"
                          min={1}
                          max={20}
                          value={revenueReportConfig.peakDaysLimit}
                          onChange={(e) => {
                            const v = parseInt(e.target.value || "0", 10);
                            const clamped = Math.min(
                              20,
                              Math.max(1, Number.isNaN(v) ? 1 : v)
                            );
                            setRevenueReportConfig({
                              ...revenueReportConfig,
                              peakDaysLimit: clamped,
                            });
                          }}
                          style={{
                            width: 120,
                            padding: "0.5rem 0.75rem",
                            borderRadius: 8,
                            border: "1px solid rgba(15, 23, 42, 0.08)",
                            background: "#ffffff",
                            boxShadow: "inset 0 1px 2px rgba(16,24,40,0.03)",
                            fontWeight: 600,
                          }}
                        />
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "#6b7280",
                            marginTop: 6,
                          }}
                        >
                          Enter a number between 1 and 20
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.75rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <Checkbox
                          id="peakDaysShowCategory"
                          style={{ accentColor: "#ffffff", color: "#ffffff" }}
                          checked={revenueReportConfig.peakDaysShowCategory}
                          onCheckedChange={(checked) =>
                            setRevenueReportConfig({
                              ...revenueReportConfig,
                              peakDaysShowCategory: checked,
                            })
                          }
                        />
                        <label
                          htmlFor="peakDaysShowCategory"
                          style={{
                            fontSize: "0.875rem",
                            cursor: "pointer",
                          }}
                        >
                          Show Top Category
                        </label>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <Checkbox
                          id="peakDaysShowDayType"
                          style={{ accentColor: "#ffffff", color: "#ffffff" }}
                          checked={revenueReportConfig.peakDaysShowDayType}
                          onCheckedChange={(checked) =>
                            setRevenueReportConfig({
                              ...revenueReportConfig,
                              peakDaysShowDayType: checked,
                            })
                          }
                        />
                        <label
                          htmlFor="peakDaysShowDayType"
                          style={{
                            fontSize: "0.875rem",
                            cursor: "pointer",
                          }}
                        >
                          Highlight Weekends
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Day of Week Analysis Section */}
              <div
                role="button"
                aria-pressed={revenueReportConfig.showDayOfWeekAnalysis}
                onClick={(e) => {
                  if (
                    e.target.closest &&
                    e.target.closest("input,select,button,textarea,label")
                  )
                    return;
                  setRevenueReportConfig((prev) => ({
                    ...prev,
                    showDayOfWeekAnalysis: !prev.showDayOfWeekAnalysis,
                    showPeakDays: !prev.showDayOfWeekAnalysis
                      ? false
                      : prev.showPeakDays,
                    showHourlyTrends: !prev.showDayOfWeekAnalysis
                      ? false
                      : prev.showHourlyTrends,
                  }));
                }}
                style={{
                  padding: "1.75rem",
                  background: revenueReportConfig.showDayOfWeekAnalysis
                    ? "#dfffe9"
                    : "#f3f4f6",
                  borderRadius: "1rem",
                  borderTop: revenueReportConfig.showDayOfWeekAnalysis
                    ? "4px solid #34d399"
                    : "4px solid #e5e7eb",
                  transition: "all 0.25s ease",
                  boxShadow: revenueReportConfig.showDayOfWeekAnalysis
                    ? "0 6px 16px rgba(16, 185, 129, 0.10)"
                    : "0 2px 8px rgba(0, 0, 0, 0.04)",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    <label
                      htmlFor="dayAnalysis"
                      style={{
                        fontSize: "1.125rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        color: "#111827",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <Calendar
                        style={{
                          height: "1.25rem",
                          width: "1.25rem",
                          color: "#16a34a",
                        }}
                      />
                      Day of Week Performance
                    </label>
                    <Checkbox
                      id="dayAnalysis"
                      style={{ accentColor: "#ffffff", color: "#ffffff" }}
                      checked={revenueReportConfig.showDayOfWeekAnalysis}
                      onCheckedChange={(checked) =>
                        setRevenueReportConfig({
                          ...revenueReportConfig,
                          showDayOfWeekAnalysis: checked,
                          showPeakDays: checked
                            ? false
                            : revenueReportConfig.showPeakDays,
                          showHourlyTrends: checked
                            ? false
                            : revenueReportConfig.showHourlyTrends,
                        })
                      }
                    />
                  </div>
                  {revenueReportConfig.showDayOfWeekAnalysis && (
                    <Badge
                      style={{
                        backgroundColor: "#10b981",
                        color: "#ffffff",
                        padding: "0.35rem 0.6rem",
                        borderRadius: 999,
                        fontSize: "0.75rem",
                        fontWeight: 700,
                      }}
                    >
                      Selected
                    </Badge>
                  )}
                </div>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#6b7280",
                    marginBottom: revenueReportConfig.showDayOfWeekAnalysis
                      ? "1rem"
                      : "0",
                    lineHeight: "1.5",
                  }}
                >
                  Compare weekday vs weekend performance to optimize staffing
                  and operations
                </p>
                {revenueReportConfig.showDayOfWeekAnalysis && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                      marginTop: "1rem",
                      paddingTop: "1rem",
                      borderTop: "1px solid #d1fae5",
                    }}
                  >
                    {/* Checkboxes and Date Range Selector Row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "1rem",
                      }}
                    >
                      {/* Left side: Checkboxes */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1.5rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <Checkbox
                            id="dayOfWeekShowGap"
                            style={{ accentColor: "#ffffff", color: "#ffffff" }}
                            checked={revenueReportConfig.dayOfWeekShowGap}
                            onCheckedChange={(checked) =>
                              setRevenueReportConfig({
                                ...revenueReportConfig,
                                dayOfWeekShowGap: checked,
                              })
                            }
                          />
                          <label
                            htmlFor="dayOfWeekShowGap"
                            style={{
                              fontSize: "0.875rem",
                              cursor: "pointer",
                            }}
                          >
                            Show Performance Gap Card
                          </label>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <Checkbox
                            id="dayOfWeekShowTransactions"
                            style={{ accentColor: "#ffffff", color: "#ffffff" }}
                            checked={
                              revenueReportConfig.dayOfWeekShowTransactions
                            }
                            onCheckedChange={(checked) =>
                              setRevenueReportConfig({
                                ...revenueReportConfig,
                                dayOfWeekShowTransactions: checked,
                              })
                            }
                          />
                          <label
                            htmlFor="dayOfWeekShowTransactions"
                            style={{
                              fontSize: "0.875rem",
                              cursor: "pointer",
                            }}
                          >
                            Show Transaction Counts
                          </label>
                        </div>
                      </div>

                      {/* Right side: Date Range Selector */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <Label
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            color: "#374151",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Date Range:
                        </Label>
                        <Popover
                          open={dayOfWeekPopoverOpen}
                          onOpenChange={(open) => {
                            if (open) {
                              setPrevDayOfWeekCustomRange(dayOfWeekCustomRange);
                            }
                            setDayOfWeekPopoverOpen(open);
                          }}
                        >
                          <PopoverTrigger asChild>
                            <button
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                padding: "0.5rem 0.75rem",
                                borderRadius: "0.5rem",
                                border: "1px solid #d1d5db",
                                background: "#ffffff",
                                cursor: "pointer",
                                fontSize: "0.875rem",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Calendar
                                style={{
                                  height: "1rem",
                                  width: "1rem",
                                  color: "#6b7280",
                                }}
                              />
                              <span style={{ color: "#374151" }}>
                                {getRangeLabel(
                                  dayOfWeekRange,
                                  dayOfWeekCustomRange
                                )}
                              </span>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            style={{ width: "450px" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div style={{ display: "flex" }}>
                              {/* Quick Ranges */}
                              <div
                                style={{
                                  width: "176px",
                                  borderRight: "1px solid #e5e7eb",
                                  paddingRight: "0.75rem",
                                }}
                              >
                                <ul
                                  style={{
                                    listStyle: "none",
                                    padding: 0,
                                    margin: 0,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.5rem",
                                  }}
                                >
                                  <li>
                                    <button
                                      onClick={() => {
                                        setDayOfWeekCustomRange({
                                          from: null,
                                          to: null,
                                        });
                                        setDayOfWeekRange("today");
                                        setDayOfWeekPopoverOpen(false);
                                      }}
                                      style={{
                                        width: "100%",
                                        textAlign: "left",
                                        padding: "0.5rem",
                                        borderRadius: "0.375rem",
                                        border: "none",
                                        background:
                                          dayOfWeekRange === "today"
                                            ? "#f3f4f6"
                                            : "transparent",
                                        cursor: "pointer",
                                        fontSize: "0.875rem",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                    >
                                      Today
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      onClick={() => {
                                        setDayOfWeekCustomRange({
                                          from: null,
                                          to: null,
                                        });
                                        setDayOfWeekRange("week");
                                        setDayOfWeekPopoverOpen(false);
                                      }}
                                      style={{
                                        width: "100%",
                                        textAlign: "left",
                                        padding: "0.5rem",
                                        borderRadius: "0.375rem",
                                        border: "none",
                                        background:
                                          dayOfWeekRange === "week"
                                            ? "#f3f4f6"
                                            : "transparent",
                                        cursor: "pointer",
                                        fontSize: "0.875rem",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                    >
                                      Past Week
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      onClick={() => {
                                        setDayOfWeekCustomRange({
                                          from: null,
                                          to: null,
                                        });
                                        setDayOfWeekRange("month");
                                        setDayOfWeekPopoverOpen(false);
                                      }}
                                      style={{
                                        width: "100%",
                                        textAlign: "left",
                                        padding: "0.5rem",
                                        borderRadius: "0.375rem",
                                        border: "none",
                                        background:
                                          dayOfWeekRange === "month"
                                            ? "#f3f4f6"
                                            : "transparent",
                                        cursor: "pointer",
                                        fontSize: "0.875rem",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                    >
                                      Past Month
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      onClick={() => {
                                        setDayOfWeekCustomRange({
                                          from: null,
                                          to: null,
                                        });
                                        setDayOfWeekRange("all");
                                        setDayOfWeekPopoverOpen(false);
                                      }}
                                      style={{
                                        width: "100%",
                                        textAlign: "left",
                                        padding: "0.5rem",
                                        borderRadius: "0.375rem",
                                        border: "none",
                                        background:
                                          dayOfWeekRange === "all"
                                            ? "#f3f4f6"
                                            : "transparent",
                                        cursor: "pointer",
                                        fontSize: "0.875rem",
                                      }}
                                    >
                                      All Time
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      onClick={() => {
                                        setDayOfWeekCustomRange({
                                          from: null,
                                          to: null,
                                        });
                                        setDayOfWeekRange("all");
                                        setDayOfWeekPopoverOpen(false);
                                      }}
                                      style={{
                                        width: "100%",
                                        textAlign: "left",
                                        padding: "0.5rem",
                                        borderRadius: "0.375rem",
                                        border: "none",
                                        background: "transparent",
                                        cursor: "pointer",
                                        fontSize: "0.875rem",
                                        color: "#3b82f6",
                                      }}
                                    >
                                      Reset
                                    </button>
                                  </li>
                                </ul>
                              </div>

                              {/* Date Picker */}
                              <div
                                style={{
                                  flex: 1,
                                  paddingLeft: "0.75rem",
                                }}
                              >
                                <div
                                  style={{
                                    background: "#ffffff",
                                    borderRadius: "0.5rem",
                                    padding: "0.5rem",
                                  }}
                                >
                                  <DayPicker
                                    mode="range"
                                    defaultMonth={new Date()}
                                    selected={
                                      dayOfWeekCustomRange.from
                                        ? dayOfWeekCustomRange
                                        : undefined
                                    }
                                    disabled={{ after: todayOnly }}
                                    onSelect={(range) => {
                                      if (!range) return;
                                      if (range?.from) {
                                        const fromDate = range.from;
                                        let toDate = range.to || range.from;
                                        const toCompare = new Date(toDate);
                                        toCompare.setHours(0, 0, 0, 0);
                                        if (toCompare > todayOnly) {
                                          toDate = new Date(todayOnly);
                                        }
                                        setDayOfWeekCustomRange({
                                          from: fromDate,
                                          to: toDate,
                                        });
                                      }
                                    }}
                                  />
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "flex-end",
                                      gap: "0.5rem",
                                      marginTop: "0.75rem",
                                    }}
                                  >
                                    <button
                                      style={{
                                        padding: "0.375rem 0.75rem",
                                        borderRadius: "0.375rem",
                                        border: "none",
                                        background: canApplyRange(
                                          dayOfWeekCustomRange
                                        )
                                          ? "#16a34a"
                                          : "#d1fae5",
                                        color: "#ffffff",
                                        cursor: canApplyRange(
                                          dayOfWeekCustomRange
                                        )
                                          ? "pointer"
                                          : "not-allowed",
                                        fontSize: "0.875rem",
                                        fontWeight: 500,
                                        opacity: canApplyRange(
                                          dayOfWeekCustomRange
                                        )
                                          ? 1
                                          : 0.5,
                                      }}
                                      onClick={() => {
                                        if (
                                          !canApplyRange(dayOfWeekCustomRange)
                                        )
                                          return;
                                        setDayOfWeekRange("custom");
                                        setDayOfWeekPopoverOpen(false);
                                      }}
                                      disabled={
                                        !canApplyRange(dayOfWeekCustomRange)
                                      }
                                    >
                                      Apply
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Hourly Traffic Patterns Section */}
              <div
                role="button"
                aria-pressed={revenueReportConfig.showHourlyTrends}
                onClick={(e) => {
                  if (
                    e.target.closest &&
                    e.target.closest("input,select,button,textarea,label")
                  )
                    return;
                  setRevenueReportConfig((prev) => ({
                    ...prev,
                    showHourlyTrends: !prev.showHourlyTrends,
                    showPeakDays: !prev.showHourlyTrends
                      ? false
                      : prev.showPeakDays,
                    showDayOfWeekAnalysis: !prev.showHourlyTrends
                      ? false
                      : prev.showDayOfWeekAnalysis,
                  }));
                }}
                style={{
                  padding: "1.75rem",
                  background: revenueReportConfig.showHourlyTrends
                    ? "#fff8e1"
                    : "#f3f4f6",
                  borderRadius: "1rem",
                  borderTop: revenueReportConfig.showHourlyTrends
                    ? "4px solid #fbbf24"
                    : "4px solid #e5e7eb",
                  transition: "all 0.25s ease",
                  boxShadow: revenueReportConfig.showHourlyTrends
                    ? "0 6px 16px rgba(245, 158, 11, 0.10)"
                    : "0 2px 8px rgba(0, 0, 0, 0.04)",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    <label
                      htmlFor="hourlyTrends"
                      style={{
                        fontSize: "1.125rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        color: "#111827",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <Activity
                        style={{
                          height: "1.25rem",
                          width: "1.25rem",
                          color: "#f59e0b",
                        }}
                      />
                      Hourly Traffic Patterns
                    </label>
                    <Checkbox
                      id="hourlyTrends"
                      style={{ accentColor: "#ffffff", color: "#ffffff" }}
                      checked={revenueReportConfig.showHourlyTrends}
                      onCheckedChange={(checked) =>
                        setRevenueReportConfig({
                          ...revenueReportConfig,
                          showHourlyTrends: checked,
                          showPeakDays: checked
                            ? false
                            : revenueReportConfig.showPeakDays,
                          showDayOfWeekAnalysis: checked
                            ? false
                            : revenueReportConfig.showDayOfWeekAnalysis,
                        })
                      }
                    />
                  </div>
                  {revenueReportConfig.showHourlyTrends && (
                    <Badge
                      style={{
                        backgroundColor: "#f59e0b",
                        color: "#ffffff",
                        padding: "0.35rem 0.6rem",
                        borderRadius: 999,
                        fontSize: "0.75rem",
                        fontWeight: 700,
                      }}
                    >
                      Selected
                    </Badge>
                  )}
                </div>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#6b7280",
                    marginBottom: revenueReportConfig.showHourlyTrends
                      ? "1rem"
                      : "0",
                    lineHeight: "1.5",
                  }}
                >
                  Identify peak hours to optimize staffing, concessions, and
                  visitor experience
                </p>
                {revenueReportConfig.showHourlyTrends && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                      marginTop: "1rem",
                      paddingTop: "1rem",
                      borderTop: "1px solid #fde68a",
                    }}
                  >
                    {/* Top Row: Number of Peak Hours, Checkboxes, and Date Range Selector */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: "1rem",
                        flexWrap: "wrap",
                      }}
                    >
                      {/* Left side: Controls */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "1.5rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <Label
                            htmlFor="hourlyShowTopPeak"
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: 500,
                              color: "#374151",
                            }}
                          >
                            Number of Peak Hours
                          </Label>
                          <div style={{ marginTop: 8 }}>
                            <input
                              id="hourlyShowTopPeak"
                              type="number"
                              min={1}
                              max={10}
                              value={revenueReportConfig.hourlyShowTopPeak}
                              onChange={(e) => {
                                const v = parseInt(e.target.value || "1", 10);
                                const clamped = Math.min(
                                  10,
                                  Math.max(1, Number.isNaN(v) ? 1 : v)
                                );
                                setRevenueReportConfig({
                                  ...revenueReportConfig,
                                  hourlyShowTopPeak: clamped,
                                });
                              }}
                              style={{
                                width: 120,
                                padding: "0.5rem 0.75rem",
                                borderRadius: 8,
                                border: "1px solid rgba(15, 23, 42, 0.08)",
                                background: "#ffffff",
                                boxShadow:
                                  "inset 0 1px 2px rgba(16,24,40,0.03)",
                                fontWeight: 600,
                              }}
                            />
                            <div
                              style={{
                                fontSize: "0.8rem",
                                color: "#6b7280",
                                marginTop: 6,
                              }}
                            >
                              Enter a number between 1 and 10
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.75rem",
                            paddingTop: "1.75rem",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <Checkbox
                              id="hourlyShowRevenueData"
                              checked={
                                revenueReportConfig.hourlyShowRevenueData
                              }
                              onCheckedChange={(checked) =>
                                setRevenueReportConfig({
                                  ...revenueReportConfig,
                                  hourlyShowRevenueData: checked,
                                })
                              }
                              style={{
                                accentColor: "#ffffff",
                                color: "#ffffff",
                              }}
                            />
                            <label
                              htmlFor="hourlyShowRevenueData"
                              style={{
                                fontSize: "0.875rem",
                                cursor: "pointer",
                              }}
                            >
                              Show Revenue Data
                            </label>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <Checkbox
                              id="hourlyShowAllHours"
                              checked={revenueReportConfig.hourlyShowAllHours}
                              onCheckedChange={(checked) =>
                                setRevenueReportConfig({
                                  ...revenueReportConfig,
                                  hourlyShowAllHours: checked,
                                })
                              }
                              style={{
                                accentColor: "#ffffff",
                                color: "#ffffff",
                              }}
                            />
                            <label
                              htmlFor="hourlyShowAllHours"
                              style={{
                                fontSize: "0.875rem",
                                cursor: "pointer",
                              }}
                            >
                              Show All Hours (24h)
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Right side: Date Range Selector */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          paddingTop: "1.75rem",
                        }}
                      >
                        <Label
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            color: "#374151",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Date Range:
                        </Label>
                        <Popover
                          open={hourlyPopoverOpen}
                          onOpenChange={(open) => {
                            if (open) {
                              setPrevHourlyCustomRange(hourlyCustomRange);
                            }
                            setHourlyPopoverOpen(open);
                          }}
                        >
                          <PopoverTrigger asChild>
                            <button
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                padding: "0.5rem 0.75rem",
                                borderRadius: "0.5rem",
                                border: "1px solid #d1d5db",
                                background: "#ffffff",
                                cursor: "pointer",
                                fontSize: "0.875rem",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Calendar
                                style={{
                                  height: "1rem",
                                  width: "1rem",
                                  color: "#6b7280",
                                }}
                              />
                              <span style={{ color: "#374151" }}>
                                {getRangeLabel(hourlyRange, hourlyCustomRange)}
                              </span>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            style={{ width: "450px" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div style={{ display: "flex" }}>
                              {/* Quick Ranges */}
                              <div
                                style={{
                                  width: "176px",
                                  borderRight: "1px solid #e5e7eb",
                                  paddingRight: "0.75rem",
                                }}
                              >
                                <ul
                                  style={{
                                    listStyle: "none",
                                    padding: 0,
                                    margin: 0,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "0.5rem",
                                  }}
                                >
                                  <li>
                                    <button
                                      onClick={() => {
                                        setHourlyCustomRange({
                                          from: null,
                                          to: null,
                                        });
                                        setHourlyRange("today");
                                        setHourlyPopoverOpen(false);
                                      }}
                                      style={{
                                        width: "100%",
                                        textAlign: "left",
                                        padding: "0.5rem",
                                        borderRadius: "0.375rem",
                                        border: "none",
                                        background:
                                          hourlyRange === "today"
                                            ? "#f3f4f6"
                                            : "transparent",
                                        cursor: "pointer",
                                        fontSize: "0.875rem",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                    >
                                      Today
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      onClick={() => {
                                        setHourlyCustomRange({
                                          from: null,
                                          to: null,
                                        });
                                        setHourlyRange("week");
                                        setHourlyPopoverOpen(false);
                                      }}
                                      style={{
                                        width: "100%",
                                        textAlign: "left",
                                        padding: "0.5rem",
                                        borderRadius: "0.375rem",
                                        border: "none",
                                        background:
                                          hourlyRange === "week"
                                            ? "#f3f4f6"
                                            : "transparent",
                                        cursor: "pointer",
                                        fontSize: "0.875rem",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                    >
                                      Past Week
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      onClick={() => {
                                        setHourlyCustomRange({
                                          from: null,
                                          to: null,
                                        });
                                        setHourlyRange("month");
                                        setHourlyPopoverOpen(false);
                                      }}
                                      style={{
                                        width: "100%",
                                        textAlign: "left",
                                        padding: "0.5rem",
                                        borderRadius: "0.375rem",
                                        border: "none",
                                        background:
                                          hourlyRange === "month"
                                            ? "#f3f4f6"
                                            : "transparent",
                                        cursor: "pointer",
                                        fontSize: "0.875rem",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                    >
                                      Past Month
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      onClick={() => {
                                        setHourlyCustomRange({
                                          from: null,
                                          to: null,
                                        });
                                        setHourlyRange("all");
                                        setHourlyPopoverOpen(false);
                                      }}
                                      style={{
                                        width: "100%",
                                        textAlign: "left",
                                        padding: "0.5rem",
                                        borderRadius: "0.375rem",
                                        border: "none",
                                        background:
                                          hourlyRange === "all"
                                            ? "#f3f4f6"
                                            : "transparent",
                                        cursor: "pointer",
                                        fontSize: "0.875rem",
                                      }}
                                    >
                                      All Time
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      onClick={() => {
                                        setHourlyCustomRange({
                                          from: null,
                                          to: null,
                                        });
                                        setHourlyRange("all");
                                        setHourlyPopoverOpen(false);
                                      }}
                                      style={{
                                        width: "100%",
                                        textAlign: "left",
                                        padding: "0.5rem",
                                        borderRadius: "0.375rem",
                                        border: "none",
                                        background: "transparent",
                                        cursor: "pointer",
                                        fontSize: "0.875rem",
                                        color: "#3b82f6",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                    >
                                      Reset
                                    </button>
                                  </li>
                                </ul>
                              </div>

                              {/* Date Picker */}
                              <div
                                style={{
                                  flex: 1,
                                  paddingLeft: "0.75rem",
                                }}
                              >
                                <div
                                  style={{
                                    background: "#ffffff",
                                    borderRadius: "0.5rem",
                                    padding: "0.5rem",
                                  }}
                                >
                                  <DayPicker
                                    mode="range"
                                    defaultMonth={new Date()}
                                    selected={
                                      hourlyCustomRange.from
                                        ? hourlyCustomRange
                                        : undefined
                                    }
                                    disabled={{ after: todayOnly }}
                                    onSelect={(range) => {
                                      if (!range) return;
                                      if (range?.from) {
                                        const fromDate = range.from;
                                        let toDate = range.to || range.from;
                                        const toCompare = new Date(toDate);
                                        toCompare.setHours(0, 0, 0, 0);
                                        if (toCompare > todayOnly) {
                                          toDate = new Date(todayOnly);
                                        }
                                        setHourlyCustomRange({
                                          from: fromDate,
                                          to: toDate,
                                        });
                                      }
                                    }}
                                  />
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "flex-end",
                                      gap: "0.5rem",
                                      marginTop: "0.75rem",
                                    }}
                                  >
                                    <button
                                      style={{
                                        padding: "0.375rem 0.75rem",
                                        borderRadius: "0.375rem",
                                        border: "none",
                                        background: canApplyRange(
                                          hourlyCustomRange
                                        )
                                          ? "#f59e0b"
                                          : "#fde68a",
                                        color: "#ffffff",
                                        cursor: canApplyRange(hourlyCustomRange)
                                          ? "pointer"
                                          : "not-allowed",
                                        fontSize: "0.875rem",
                                        fontWeight: 500,
                                        opacity: canApplyRange(
                                          hourlyCustomRange
                                        )
                                          ? 1
                                          : 0.5,
                                      }}
                                      onClick={() => {
                                        if (!canApplyRange(hourlyCustomRange))
                                          return;
                                        setHourlyRange("custom");
                                        setHourlyPopoverOpen(false);
                                      }}
                                      disabled={
                                        !canApplyRange(hourlyCustomRange)
                                      }
                                    >
                                      Apply
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                paddingTop: "2rem",
                borderTop: "2px solid #e5e7eb",
                marginTop: "1.5rem",
                padding: "1.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  onClick={() => {
                    setIsGeneratingRevenue(true);
                    setTimeout(() => {
                      setRevenueReportGenerated(true);
                      setIsGeneratingRevenue(false);
                    }, 800);
                  }}
                  disabled={
                    [
                      revenueReportConfig.showPeakDays,
                      revenueReportConfig.showDayOfWeekAnalysis,
                      revenueReportConfig.showHourlyTrends,
                    ].filter(Boolean).length === 0 || isGeneratingRevenue
                  }
                  style={{
                    background: isGeneratingRevenue
                      ? "linear-gradient(180deg, #64748b 0%, #94a3b8 100%)"
                      : "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)",
                    color: "#ffffff",
                    padding: "1rem 2.5rem",
                    borderRadius: "0.75rem",
                    fontWeight: 700,
                    fontSize: "1.0625rem",
                    cursor: isGeneratingRevenue ? "not-allowed" : "pointer",
                    border: "none",
                    boxShadow: "0 8px 16px rgba(59, 130, 246, 0.3)",
                    transition: "all 0.3s ease",
                    transform: isGeneratingRevenue ? "scale(0.98)" : "scale(1)",
                  }}
                >
                  {isGeneratingRevenue ? (
                    <>
                      <Zap
                        style={{
                          height: "1.125rem",
                          width: "1.125rem",
                          marginRight: "0.5rem",
                          animation: "pulse 1s infinite",
                        }}
                      />
                      Generating...
                    </>
                  ) : (
                    <>Generate</>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
          }}
        >
          {/* Summary Metrics */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "0.75rem",
            }}
          >
            <Card style={{ borderLeft: "4px solid #16a34a" }}>
              <CardContent style={{ paddingTop: "1.5rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                      Total Revenue
                    </p>
                    <p
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 600,
                        color: "#16a34a",
                      }}
                    >
                      $
                      {detailedTransactions
                        .reduce(
                          (sum, t) => sum + parseFloat(t.Total_Amount || 0),
                          0
                        )
                        .toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                    </p>
                  </div>
                  <TrendingUp
                    style={{
                      height: "2rem",
                      width: "2rem",
                      color: "#16a34a",
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card style={{ borderLeft: "4px solid #60a5fa" }}>
              <CardContent style={{ paddingTop: "1.5rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                      Transactions
                    </p>
                    <p
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 600,
                        color: "#2563eb",
                      }}
                    >
                      {detailedTransactions.length.toLocaleString()}
                    </p>
                  </div>
                  <Receipt
                    style={{
                      height: "2rem",
                      width: "2rem",
                      color: "#2563eb",
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card style={{ borderLeft: "4px solid #2563eb" }}>
              <CardContent style={{ paddingTop: "1.5rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                      $ avg / transaction
                    </p>
                    <p
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 600,
                        color: "#2563eb",
                      }}
                    >
                      $
                      {detailedTransactions.length > 0
                        ? (
                            detailedTransactions.reduce(
                              (sum, t) => sum + parseFloat(t.Total_Amount || 0),
                              0
                            ) / detailedTransactions.length
                          ).toFixed(1)
                        : "0.0"}
                    </p>
                  </div>
                  <DollarSign
                    style={{
                      height: "2rem",
                      width: "2rem",
                      color: "#2563eb",
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card style={{ borderLeft: "4px solid #d97706" }}>
              <CardContent style={{ paddingTop: "1.5rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                      Peak Day
                    </p>
                    <p
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 600,
                        color: "#d97706",
                      }}
                    >
                      $
                      {(() => {
                        const dailyRevenue = {};
                        detailedTransactions.forEach((t) => {
                          const date = new Date(t.Purchase_Date)
                            .toISOString()
                            .split("T")[0];
                          dailyRevenue[date] =
                            (dailyRevenue[date] || 0) +
                            parseFloat(t.Total_Amount || 0);
                        });
                        return Math.max(
                          ...Object.values(dailyRevenue),
                          0
                        ).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        });
                      })()}
                    </p>
                  </div>
                  <Calendar
                    style={{
                      height: "2rem",
                      width: "2rem",
                      color: "#d97706",
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Peak Revenue Days */}
          {revenueReportConfig.showPeakDays && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Top {revenueReportConfig.peakDaysLimit} Revenue Days -{" "}
                  {revenueReportConfig.peakDaysShowDayType
                    ? "Weekend/Weekday Analysis"
                    : "Performance Overview"}
                </CardTitle>
                <CardDescription>
                  Identify which dates drive the most revenue to plan future
                  promotions
                  {revenueReportConfig.peakDaysShowCategory &&
                    " and understand category performance"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const dailyData = {};
                  detailedTransactions.forEach((t) => {
                    const date = new Date(t.Purchase_Date)
                      .toISOString()
                      .split("T")[0];
                    if (!dailyData[date]) {
                      dailyData[date] = {
                        revenue: 0,
                        count: 0,
                        categories: {},
                      };
                    }
                    dailyData[date].revenue += parseFloat(t.Total_Amount || 0);
                    dailyData[date].count += 1;
                    dailyData[date].categories[t.Category] =
                      (dailyData[date].categories[t.Category] || 0) +
                      parseFloat(t.Total_Amount || 0);
                  });

                  const sortedDays = Object.entries(dailyData)
                    .map(([date, data]) => ({
                      date,
                      ...data,
                      topCategory: Object.entries(data.categories).sort(
                        (a, b) => b[1] - a[1]
                      )[0]?.[0],
                    }))
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, revenueReportConfig.peakDaysLimit);

                  const maxRevenue = Math.max(
                    ...sortedDays.map((d) => d.revenue),
                    1
                  );

                  // Prepare data for area chart
                  const chartData = sortedDays.map((day, idx) => {
                    const date = new Date(day.date + "T00:00:00");
                    const isWeekend =
                      date.getDay() === 0 || date.getDay() === 6;
                    return {
                      name: date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      }),
                      revenue: day.revenue,
                      count: day.count,
                      topCategory: day.topCategory || "",
                      isWeekend,
                      date: day.date,
                      avg: day.count > 0 ? day.revenue / day.count : 0,
                    };
                  });

                  return (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1.5rem",
                      }}
                    >
                      {/* Area Chart Visualization */}
                      <div
                        style={{
                          background:
                            "linear-gradient(180deg, #f1f5f9 0%, #f8fafc 100%)",
                          borderRadius: "1rem",
                          padding: "1.5rem",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <div style={{ marginBottom: "1rem" }}>
                          <h3
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: 600,
                              color: "#475569",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              marginBottom: "0.25rem",
                            }}
                          >
                            Revenue Trend
                          </h3>
                          <p
                            style={{
                              fontSize: "0.75rem",
                              color: "#94a3b8",
                            }}
                          >
                            Peak performance days over time
                          </p>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "0.5rem",
                            paddingRight: "1rem",
                          }}
                        >
                          <div />
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-end",
                              gap: "0.5rem",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                minWidth: 160,
                              }}
                            >
                              <span
                                style={{
                                  width: 12,
                                  height: 12,
                                  background: "#60a5fa",
                                  borderRadius: 3,
                                  display: "inline-block",
                                  flexShrink: 0,
                                }}
                              />
                              <span
                                style={{
                                  fontSize: "0.85rem",
                                  color: "#475569",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Transactions
                              </span>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                minWidth: 160,
                              }}
                            >
                              <span
                                style={{
                                  width: 12,
                                  height: 12,
                                  background: "#2563eb",
                                  borderRadius: 3,
                                  display: "inline-block",
                                  flexShrink: 0,
                                }}
                              />
                              <span
                                style={{
                                  fontSize: "0.85rem",
                                  color: "#475569",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                $ avg / transaction
                              </span>
                            </div>
                          </div>
                        </div>
                        <ResponsiveContainer width="100%" height={320}>
                          <ComposedChart
                            data={chartData}
                            margin={{ top: 10, right: 40, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid
                              strokeDasharray="4 4"
                              stroke="#eef2f7"
                            />
                            <XAxis
                              dataKey="name"
                              stroke="#94a3b8"
                              style={{ fontSize: "0.75rem" }}
                              tick={{ fill: "#64748b" }}
                            >
                              <RechartsLabel
                                value="Date"
                                position="insideBottom"
                                offset={-8}
                                style={{ fill: "#94a3b8", fontSize: "0.75rem" }}
                              />
                            </XAxis>
                            <YAxis
                              yAxisId="left"
                              stroke="#94a3b8"
                              style={{ fontSize: "0.75rem" }}
                              tick={{ fill: "#64748b" }}
                            >
                              <RechartsLabel
                                value="Transactions"
                                angle={-90}
                                position="insideLeft"
                                style={{
                                  textAnchor: "middle",
                                  fill: "#94a3b8",
                                  fontSize: "0.75rem",
                                }}
                              />
                            </YAxis>
                            <YAxis
                              yAxisId="right"
                              orientation="right"
                              stroke="#94a3b8"
                              style={{ fontSize: "0.75rem" }}
                              tick={{ fill: "#64748b" }}
                              tickFormatter={(v) => `$${v.toFixed(1)}`}
                            >
                              <RechartsLabel
                                value="$ avg / transaction"
                                angle={-90}
                                position="insideRight"
                                style={{
                                  textAnchor: "middle",
                                  fill: "#94a3b8",
                                  fontSize: "0.75rem",
                                }}
                              />
                            </YAxis>
                            <Tooltip
                              contentStyle={{
                                background: "#ffffff",
                                border: "1px solid #e2e8f0",
                                borderRadius: "0.5rem",
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)",
                              }}
                              formatter={(value, name) => {
                                if (name === "$ avg / transaction") {
                                  return [
                                    `$${value.toFixed(1)}`,
                                    "$ avg / transaction",
                                  ];
                                }
                                if (name === "revenue") {
                                  return [
                                    `$${value.toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}`,
                                    "Revenue",
                                  ];
                                }
                                return [value, "Transactions"];
                              }}
                            />
                            {/* Legend moved to custom container above chart */}
                            <Bar
                              dataKey="count"
                              name="Transactions"
                              yAxisId="left"
                              fill="#60a5fa"
                              barSize={18}
                              radius={[6, 6, 0, 0]}
                            />
                            <Line
                              type="monotone"
                              dataKey="avg"
                              name="$ avg / transaction"
                              yAxisId="right"
                              stroke="#2563eb"
                              strokeWidth={2.5}
                              dot={{ r: 4 }}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Card Grid for Detailed Stats */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            revenueReportConfig.peakDaysLimit <= 3
                              ? `repeat(${revenueReportConfig.peakDaysLimit}, 1fr)`
                              : revenueReportConfig.peakDaysLimit <= 6
                              ? "repeat(3, 1fr)"
                              : revenueReportConfig.peakDaysLimit <= 9
                              ? "repeat(3, 1fr)"
                              : "repeat(5, 1fr)",
                          gap: "0.75rem",
                        }}
                      >
                        {sortedDays.map((day, idx) => {
                          const date = new Date(day.date + "T00:00:00");
                          const dayOfWeek = date.toLocaleDateString("en-US", {
                            weekday: "short",
                          });
                          const isWeekend =
                            date.getDay() === 0 || date.getDay() === 6;

                          const topRevenue =
                            day.topCategory && day.categories
                              ? day.categories[day.topCategory] || 0
                              : 0;
                          const topShare =
                            (topRevenue / Math.max(day.revenue, 1)) * 100;

                          // Card background and accent colors
                          const cardBg = revenueReportConfig.peakDaysShowDayType
                            ? isWeekend
                              ? "linear-gradient(180deg, #dbeafe 0%, #eff6ff 100%)"
                              : "linear-gradient(180deg, #d1fae5 0%, #ecfdf5 100%)"
                            : "linear-gradient(180deg, #f3f4f6 0%, #f9fafb 100%)";

                          const accentColor =
                            revenueReportConfig.peakDaysShowDayType
                              ? isWeekend
                                ? "#3b82f6"
                                : "#22c55e"
                              : "#6b7280";

                          return (
                            <div
                              key={day.date}
                              style={{
                                background: cardBg,
                                // remove full outline; use top border accent
                                borderTop: `4px solid ${accentColor}`,
                                borderRadius: "1rem",
                                padding: "1.25rem",
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.875rem",
                                position: "relative",
                                overflow: "hidden",
                                transition: "all 0.3s ease",
                                boxShadow:
                                  revenueReportConfig.peakDaysShowDayType
                                    ? `0 2px 12px ${
                                        isWeekend
                                          ? "rgba(59, 130, 246, 0.08)"
                                          : "rgba(34, 197, 94, 0.08)"
                                      }`
                                    : "0 2px 12px rgba(0, 0, 0, 0.06)",
                              }}
                            >
                              {/* Rank Badge */}
                              <div
                                style={{
                                  position: "absolute",
                                  top: "0.75rem",
                                  right: "0.75rem",
                                  width: "2rem",
                                  height: "2rem",
                                  borderRadius: "50%",
                                  background:
                                    idx === 0
                                      ? "linear-gradient(180deg, #f59e0b 0%, #fbbf24 100%)"
                                      : idx === 1
                                      ? "linear-gradient(180deg, #64748b 0%, #94a3b8 100%)"
                                      : idx === 2
                                      ? "linear-gradient(180deg, #f97316 0%, #fb923c 100%)"
                                      : "#f3f4f6",
                                  color: idx >= 3 ? "#374151" : "#ffffff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: 700,
                                  fontSize: "0.875rem",
                                  boxShadow: "none",
                                  border: "2px solid rgba(255, 255, 255, 0.5)",
                                }}
                              >
                                {idx + 1}
                              </div>

                              {/* Date Info */}
                              <div style={{ marginTop: "1.5rem" }}>
                                <div
                                  style={{
                                    fontSize: "1.125rem",
                                    fontWeight: 700,
                                    color:
                                      revenueReportConfig.peakDaysShowDayType
                                        ? isWeekend
                                          ? "#1e40af"
                                          : "#166534"
                                        : "#374151",
                                    textAlign: "center",
                                    letterSpacing: "-0.5px",
                                  }}
                                >
                                  {date.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </div>
                                {revenueReportConfig.peakDaysShowDayType && (
                                  <div
                                    style={{
                                      fontSize: "0.75rem",
                                      color: accentColor,
                                      textAlign: "center",
                                      marginTop: "0.375rem",
                                      fontWeight: 600,
                                      textTransform: "uppercase",
                                      letterSpacing: "0.5px",
                                    }}
                                  >
                                    {dayOfWeek}
                                  </div>
                                )}
                              </div>

                              {/* Revenue Sparkline Mini-Visual */}
                              <div
                                style={{
                                  height: "40px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "2px",
                                }}
                              >
                                {revenueReportConfig.peakDaysShowCategory ? (
                                  // Show category breakdown as mini bars (only largest bar shows percent label)
                                  (() => {
                                    const topCats = Object.entries(
                                      day.categories || {}
                                    )
                                      .sort((a, b) => b[1] - a[1])
                                      .slice(0, 3);
                                    const total = Math.max(day.revenue, 1);
                                    return topCats.map(([cat, rev], i) => {
                                      const pct = (rev / total) * 100;
                                      const isLargest = i === 0;
                                      return (
                                        <div
                                          key={cat}
                                          title={`${cat}: $${rev.toFixed(
                                            2
                                          )} (${pct.toFixed(1)}%)`}
                                          aria-label={`${cat} ${Math.round(
                                            pct
                                          )}%`}
                                          style={{
                                            flex: pct,
                                            height: "100%",
                                            background:
                                              revenueReportConfig.peakDaysShowDayType
                                                ? isWeekend
                                                  ? `rgba(59, 130, 246, ${
                                                      0.7 - i * 0.15
                                                    })`
                                                  : `rgba(34, 197, 94, ${
                                                      0.7 - i * 0.15
                                                    })`
                                                : `rgba(107, 114, 128, ${
                                                    0.7 - i * 0.15
                                                  })`,
                                            borderRadius: "0.25rem",
                                            position: "relative",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            overflow: "hidden",
                                          }}
                                        >
                                          {isLargest && (
                                            <span
                                              style={{
                                                fontSize: "0.65rem",
                                                fontWeight: 400,
                                                color: "#ffffff",
                                                padding: "0 6px",
                                              }}
                                            >
                                              {Math.round(pct)}%
                                            </span>
                                          )}
                                        </div>
                                      );
                                    });
                                  })()
                                ) : (
                                  // Show simple metric icon
                                  <div
                                    style={{
                                      width: "3rem",
                                      height: "3rem",
                                      borderRadius: "50%",
                                      background:
                                        revenueReportConfig.peakDaysShowDayType
                                          ? isWeekend
                                            ? "rgba(59, 130, 246, 0.15)"
                                            : "rgba(34, 197, 94, 0.15)"
                                          : "rgba(107, 114, 128, 0.15)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <DollarSign
                                      style={{
                                        width: "1.5rem",
                                        height: "1.5rem",
                                        color: accentColor,
                                      }}
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Revenue Amount */}
                              <div
                                style={{
                                  textAlign: "center",
                                  borderTop:
                                    revenueReportConfig.peakDaysShowDayType
                                      ? `1px solid ${
                                          isWeekend
                                            ? "rgba(147,197,253,0.3)"
                                            : "rgba(134,239,172,0.25)"
                                        }`
                                      : "1px solid rgba(229, 231, 235, 0.5)",
                                  paddingTop: "0.875rem",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "1.25rem",
                                    fontWeight: 700,
                                    color:
                                      revenueReportConfig.peakDaysShowDayType
                                        ? isWeekend
                                          ? "#1e3a8a"
                                          : "#14532d"
                                        : "#111827",
                                    letterSpacing: "-0.5px",
                                  }}
                                >
                                  $
                                  {day.revenue.toLocaleString("en-US", {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  })}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.7rem",
                                    color: "#6b7280",
                                    marginTop: "0.325rem",
                                    fontWeight: 500,
                                  }}
                                >
                                  {day.count} transactions
                                </div>
                                {revenueReportConfig.peakDaysShowCategory &&
                                  day.topCategory && (
                                    <div
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "0.35rem",
                                        fontSize: "0.65rem",
                                        color: "#374151",
                                        marginTop: "0.625rem",
                                        padding: "0.3rem 0.6rem",
                                        backgroundColor:
                                          "rgba(255, 255, 255, 0.9)",
                                        borderRadius: "0.5rem",
                                        fontWeight: 400,
                                        border: "1px solid rgba(0, 0, 0, 0.06)",
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: "0.8rem",
                                          background: "transparent",
                                          color: "#dc2626",
                                          fontWeight: 700,
                                          lineHeight: 1,
                                        }}
                                      >
                                        {Math.round(topShare)}%
                                      </span>
                                      <span
                                        style={{
                                          lineHeight: 1,
                                          marginLeft: 6,
                                          fontWeight: 600,
                                        }}
                                      >
                                        {day.topCategory}
                                      </span>
                                    </div>
                                  )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Day of Week Analysis */}
          {revenueReportConfig.showDayOfWeekAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <Calendar
                    style={{
                      height: "1.25rem",
                      width: "1.25rem",
                      color: "#16a34a",
                    }}
                  />
                  Day of Week Performance -{" "}
                  {revenueReportConfig.dayOfWeekShowGap &&
                  revenueReportConfig.dayOfWeekShowTransactions
                    ? "Full Analysis"
                    : revenueReportConfig.dayOfWeekShowGap
                    ? "Performance Comparison"
                    : "Transaction Overview"}
                </CardTitle>
                <CardDescription>
                  Compare weekday vs weekend performance to optimize staffing
                  and operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const dayData = {};
                  const dayOccurrences = {};

                  dayOfWeekTransactions.forEach((t) => {
                    const date = new Date(t.Purchase_Date);
                    const dayOfWeek = date.toLocaleDateString("en-US", {
                      weekday: "long",
                    });
                    const dateStr = date.toISOString().split("T")[0];

                    if (!dayData[dayOfWeek]) {
                      dayData[dayOfWeek] = { total: 0, count: 0 };
                    }
                    if (!dayOccurrences[dayOfWeek]) {
                      dayOccurrences[dayOfWeek] = new Set();
                    }

                    dayOccurrences[dayOfWeek].add(dateStr);
                    dayData[dayOfWeek].total += parseFloat(t.Total_Amount || 0);
                    dayData[dayOfWeek].count += 1;
                  });

                  const weekOrder = [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ];
                  const sortedDays = weekOrder
                    .filter((day) => dayData[day])
                    .map((day) => ({
                      day,
                      ...dayData[day],
                      avgPerDay: dayData[day].total / dayOccurrences[day].size,
                      avgTransactionsPerDay:
                        dayData[day].count / dayOccurrences[day].size,
                    }));

                  const maxAvgRevenue = Math.max(
                    ...sortedDays.map((d) => d.avgPerDay)
                  );
                  const weekendData = sortedDays.filter(
                    (d) => d.day === "Saturday" || d.day === "Sunday"
                  );
                  const weekdayData = sortedDays.filter(
                    (d) => d.day !== "Saturday" && d.day !== "Sunday"
                  );

                  const weekendAvgRevenue =
                    weekendData.reduce((sum, d) => sum + d.avgPerDay, 0) /
                    Math.max(weekendData.length, 1);
                  const weekdayAvgRevenue =
                    weekdayData.reduce((sum, d) => sum + d.avgPerDay, 0) /
                    Math.max(weekdayData.length, 1);

                  return (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1.5rem",
                      }}
                    >
                      {/* Comparison Cards */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(180px, 1fr))",
                          gap: "0.5rem",
                        }}
                      >
                        {/* Weekend Performance Card */}
                        <div
                          style={{
                            background:
                              "linear-gradient(180deg, #2563eb 0%, #3b82f6 100%)",
                            borderRadius: "0.75rem",
                            padding: "1.5rem 1.5rem",
                            color: "#ffffff",
                            position: "relative",
                            overflow: "hidden",
                            boxShadow: "0 2px 8px rgba(59, 130, 246, 0.12)",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              top: "-10px",
                              right: "-10px",
                              width: "60px",
                              height: "60px",
                              background: "rgba(255, 255, 255, 0.06)",
                              borderRadius: "50%",
                              filter: "blur(18px)",
                            }}
                          />
                          <div style={{ position: "relative", zIndex: 1 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "1rem",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                }}
                              >
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "1.25rem",
                                    height: "1.25rem",
                                    borderRadius: "50%",
                                    background: "rgba(255, 255, 255, 0.18)",
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                  }}
                                >
                                  {weekendData.length}
                                </span>
                                <span
                                  style={{
                                    opacity: 0.95,
                                    fontSize: "1rem",
                                    fontWeight: 600,
                                  }}
                                >
                                  Days Tracked
                                </span>
                              </div>
                              <div
                                style={{
                                  textAlign: "right",
                                  paddingRight: "0.75rem",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    opacity: 0.95,
                                    marginBottom: "0.125rem",
                                  }}
                                >
                                  Weekend Average
                                </div>
                                <div
                                  style={{
                                    fontSize: "1.25rem",
                                    fontWeight: 700,
                                    letterSpacing: "-0.5px",
                                  }}
                                >
                                  $
                                  {weekendAvgRevenue.toLocaleString("en-US", {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Weekday Performance Card */}
                        <div
                          style={{
                            background:
                              "linear-gradient(180deg, #16a34a 0%, #22c55e 100%)",
                            borderRadius: "0.75rem",
                            padding: "1.5rem 1.5rem",
                            color: "#ffffff",
                            position: "relative",
                            overflow: "hidden",
                            boxShadow: "0 2px 8px rgba(34, 197, 94, 0.12)",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              top: "-10px",
                              right: "-10px",
                              width: "60px",
                              height: "60px",
                              background: "rgba(255, 255, 255, 0.06)",
                              borderRadius: "50%",
                              filter: "blur(18px)",
                            }}
                          />
                          <div style={{ position: "relative", zIndex: 1 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "1rem",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                }}
                              >
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "1.25rem",
                                    height: "1.25rem",
                                    borderRadius: "50%",
                                    background: "rgba(255, 255, 255, 0.18)",
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                  }}
                                >
                                  {weekdayData.length}
                                </span>
                                <span
                                  style={{
                                    opacity: 0.95,
                                    fontSize: "1rem",
                                    fontWeight: 600,
                                  }}
                                >
                                  Days Tracked
                                </span>
                              </div>
                              <div
                                style={{
                                  textAlign: "right",
                                  paddingRight: "0.75rem",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    opacity: 0.95,
                                    marginBottom: "0.125rem",
                                  }}
                                >
                                  Weekday Average
                                </div>
                                <div
                                  style={{
                                    fontSize: "1.25rem",
                                    fontWeight: 700,
                                    letterSpacing: "-0.5px",
                                  }}
                                >
                                  $
                                  {weekdayAvgRevenue.toLocaleString("en-US", {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Difference Indicator - Conditional */}
                        {revenueReportConfig.dayOfWeekShowGap && (
                          <div
                            style={{
                              background: "rgba(179, 252, 255, 0.95)",
                              borderRadius: "0.75rem",
                              padding: "0.8rem",
                              border: "1px solid #e6eef6",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "0.65rem",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "1px",
                                color: "#64748b",
                                marginBottom: "0.25rem",
                              }}
                            >
                              Performance Gap
                            </div>
                            <div
                              style={{
                                fontSize: "1.25rem",
                                fontWeight: 700,
                                color:
                                  weekendAvgRevenue > weekdayAvgRevenue
                                    ? "#3b82f6"
                                    : "#22c55e",
                                letterSpacing: "-0.5px",
                                marginBottom: "0.25rem",
                              }}
                            >
                              {Math.abs(
                                ((weekendAvgRevenue - weekdayAvgRevenue) /
                                  Math.max(weekdayAvgRevenue, 1)) *
                                  100
                              ).toFixed(1)}
                              %
                            </div>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "#64748b",
                                textAlign: "center",
                              }}
                            >
                              {weekendAvgRevenue > weekdayAvgRevenue
                                ? "Weekends lead"
                                : "Weekdays lead"}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Individual Day Cards */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(140px, 1fr))",
                          gap: "0.75rem",
                        }}
                      >
                        {sortedDays.map((dayInfo) => {
                          const isWeekend =
                            dayInfo.day === "Saturday" ||
                            dayInfo.day === "Sunday";
                          const performanceRatio =
                            dayInfo.avgPerDay / maxAvgRevenue;

                          return (
                            <div
                              key={dayInfo.day}
                              style={{
                                background: isWeekend
                                  ? "#e6f1ffff"
                                  : "#dcffe7ff",
                                borderRadius: "1rem",
                                padding: "1rem",
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.75rem",
                                transition: "all 0.3s ease",
                                boxShadow: isWeekend
                                  ? "0 2px 8px rgba(59, 130, 246, 0.08)"
                                  : "0 2px 8px rgba(34, 197, 94, 0.08)",
                              }}
                            >
                              {/* Day Name */}
                              <div
                                style={{
                                  fontSize: "0.875rem",
                                  fontWeight: 700,
                                  color: isWeekend ? "#1e40af" : "#166534",
                                  textAlign: "center",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                {dayInfo.day.substring(0, 3)}
                              </div>

                              {/* Performance Bar */}
                              <div
                                style={{
                                  height: "4px",
                                  background: "#ffffff",
                                  borderRadius: "999px",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${performanceRatio * 100}%`,
                                    height: "100%",
                                    background: isWeekend
                                      ? "linear-gradient(90deg, #3b82f6, #2563eb)"
                                      : "linear-gradient(90deg, #22c55e, #16a34a)",
                                    borderRadius: "999px",
                                  }}
                                />
                              </div>

                              {/* Revenue */}
                              <div style={{ textAlign: "center" }}>
                                <div
                                  style={{
                                    fontSize: "1.125rem",
                                    fontWeight: 700,
                                    color: isWeekend ? "#1e3a8a" : "#14532d",
                                    letterSpacing: "-0.5px",
                                  }}
                                >
                                  $
                                  {dayInfo.avgPerDay.toLocaleString("en-US", {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  })}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.65rem",
                                    color: "#64748b",
                                    marginTop: "0.25rem",
                                  }}
                                >
                                  Average per Day
                                </div>
                              </div>

                              {/* Transactions */}
                              {revenueReportConfig.dayOfWeekShowTransactions && (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "0.35rem",
                                    fontSize: "0.7rem",
                                    color: "#64748b",
                                    padding: "0.35rem 0.5rem",
                                    background: "rgba(255, 255, 255, 0.6)",
                                    borderRadius: "0.5rem",
                                  }}
                                >
                                  <Receipt
                                    style={{
                                      width: "0.875rem",
                                      height: "0.875rem",
                                    }}
                                  />
                                  {dayInfo.avgTransactionsPerDay.toFixed(0)}{" "}
                                  Transaction(s)
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Hourly Trends */}
          {revenueReportConfig.showHourlyTrends && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-amber-600" />
                  Hourly Traffic Patterns - Interactive Analysis
                </CardTitle>
                <CardDescription>
                  Identify peak hours to optimize staffing, concessions, and
                  visitor experience (showing top{" "}
                  {revenueReportConfig.hourlyShowTopPeak} peak hours)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const hourlyData = {};

                  hourlyTransactions.forEach((t) => {
                    const date = new Date(t.Purchase_Date);
                    const hour = date.getHours();

                    if (!hourlyData[hour]) {
                      hourlyData[hour] = { revenue: 0, count: 0 };
                    }
                    hourlyData[hour].revenue += parseFloat(t.Total_Amount || 0);
                    hourlyData[hour].count += 1;
                  });

                  const hours = Array.from({ length: 24 }, (_, i) => i)
                    .filter((hour) => hourlyData[hour])
                    .map((hour) => ({
                      hour,
                      display:
                        hour === 0
                          ? "12 AM"
                          : hour < 12
                          ? `${hour} AM`
                          : hour === 12
                          ? "12 PM"
                          : `${hour - 12} PM`,
                      ...hourlyData[hour],
                    }));

                  const topPeakHours = [...hours]
                    .sort((a, b) => b.count - a.count)
                    .slice(0, revenueReportConfig.hourlyShowTopPeak);

                  return (
                    <div className="space-y-4">
                      <ResponsiveContainer width="100%" height={320}>
                        <BarChart
                          data={hours}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="hourlyBarGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="#f59e0b"
                                stopOpacity={1}
                              />
                              <stop
                                offset="60%"
                                stopColor="#f97316"
                                stopOpacity={1}
                              />
                              <stop
                                offset="100%"
                                stopColor="#fb923c"
                                stopOpacity={1}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#eef2f7"
                          />
                          <XAxis
                            dataKey="display"
                            stroke="#94a3b8"
                            style={{ fontSize: "0.75rem" }}
                            angle={-45}
                            textAnchor="end"
                            height={70}
                          />
                          <YAxis
                            stroke="#94a3b8"
                            style={{ fontSize: "0.75rem" }}
                            tick={{ fill: "#64748b" }}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "#ffffff",
                              border: "1px solid #e2e8f0",
                              borderRadius: "0.5rem",
                              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)",
                            }}
                            formatter={(value) => [value, "Transactions"]}
                            labelFormatter={(label) => `Hour: ${label}`}
                          />
                          <Bar
                            dataKey="count"
                            name="Transactions"
                            fill="url(#hourlyBarGradient)"
                            radius={[6, 6, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                      <div
                        className="grid gap-3"
                        style={{
                          gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`,
                        }}
                      >
                        {(revenueReportConfig.hourlyShowAllHours
                          ? hours
                          : topPeakHours
                        ).map((h, idx) => (
                          <div
                            key={h.hour}
                            className="p-4 rounded-lg border"
                            style={{
                              background:
                                "linear-gradient(180deg, #fde68a 0%, #fef3c7 100%)",
                              borderColor: "#fbbf24",
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1">
                                <Activity className="h-4 w-4 text-amber-700" />
                                {!revenueReportConfig.hourlyShowAllHours && (
                                  <p
                                    className="text-sm font-bold"
                                    style={{ color: "#b45309" }}
                                  >
                                    Peak #{idx + 1}
                                  </p>
                                )}
                              </div>
                              <Badge
                                style={{
                                  backgroundColor: "#f59e0b",
                                  color: "#ffffff",
                                }}
                              >
                                {h.display}
                              </Badge>
                            </div>
                            <p
                              className="text-2xl font-bold"
                              style={{ color: "#d97706" }}
                            >
                              {h.count}
                            </p>
                            <p
                              className="text-xs font-medium"
                              style={{ color: "#92400e" }}
                            >
                              transactions
                            </p>
                            {revenueReportConfig.hourlyShowRevenueData && (
                              <p
                                className="text-sm font-bold mt-1"
                                style={{ color: "#b45309" }}
                              >
                                ${h.revenue.toFixed(0)} revenue
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </section>
  );
}
