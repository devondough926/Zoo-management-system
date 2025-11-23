import { useState, useMemo, useEffect, useRef } from "react";
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
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  Calendar,
  TrendingUp,
  Users,
  ShoppingCart,
  Clock,
  Package,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Boxes,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

const COLORS = {
  tickets: "#10B981",
  membership: "#8B5CF6",
  giftShop: "#3B82F6",
  food: "#F59E0B",
  primary: "#059669",
};

const PIE_COLORS = ["#10B981", "#8B5CF6", "#3B82F6", "#F59E0B", "#EC4899"];

// Simple hover tooltip component with no show delay and white background
function HoverTooltip({ content, children }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const ref = useRef(null);

  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (r) {
      setPos({ left: r.left + r.width / 2, top: r.top });
    }
    setOpen(true);
  };

  const hide = () => setOpen(false);

  const tooltipStyle = {
    position: "fixed",
    left: pos.left,
    top: pos.top - 8,
    transform: "translateX(-50%) translateY(-100%)",
    background: "#ffffff",
    color: "#000000",
    padding: "6px 8px",
    borderRadius: 6,
    boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
    border: "1px solid rgba(0,0,0,0.08)",
    whiteSpace: "nowrap",
    zIndex: 2147483647,
    fontSize: "0.85rem",
  };

  return (
    <div
      ref={ref}
      style={{ position: "relative", display: "block", height: "100%" }}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {open && <div style={tooltipStyle}>{content}</div>}
    </div>
  );
}

export function Reports({ detailedTransactions }) {
  const [activeReportTab, setActiveReportTab] = useState("revenue");

  // ========== REPORT 1: Revenue & Financial Analysis ==========
  const initialRevenueConfig = {
    dateRange: "all",
    customRange: { from: null, to: null },
    revenueSource: "all",
    visitorType: "all",
    dayOfWeek: "all",
    minTransaction: "",
    maxTransaction: "",
    topN: 6,
  };

  const [revenueConfig, setRevenueConfig] = useState(initialRevenueConfig);
  const [appliedRevenueConfig, setAppliedRevenueConfig] =
    useState(initialRevenueConfig);
  const [revenuePopoverOpen, setRevenuePopoverOpen] = useState(false);
  // validation errors for revenue filter inputs
  const [revenueInputErrors, setRevenueInputErrors] = useState({
    min: "",
    max: "",
    topN: "",
  });

  // Ensure initial applied filters are explicitly applied on mount
  useEffect(() => {
    setAppliedRevenueConfig({ ...initialRevenueConfig });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========== REPORT 2: Visitor Behavior & Sales Performance ==========
  const initialBehaviorConfig = {
    dateRange: "all",
    customRange: { from: null, to: null },
    timeOfDay: "all",
    dayType: "all",
    visitorType: "all",
    productCategory: "all",
    transactionSize: "all",
    topNProducts: 10,
    conversionFilter: "all",
  };

  const [behaviorConfig, setBehaviorConfig] = useState(initialBehaviorConfig);
  const [appliedBehaviorConfig, setAppliedBehaviorConfig] = useState(
    initialBehaviorConfig
  );
  const [behaviorPopoverOpen, setBehaviorPopoverOpen] = useState(false);
  // Product table sorting state
  const [productSort, setProductSort] = useState({
    column: "revenue",
    direction: "desc",
  });

  // Today's date for date picker max
  const todayOnly = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // ========== HELPER FUNCTIONS ==========

  const getDateRangeFromPreset = (preset) => {
    const now = new Date();
    const startDate = new Date(now);

    switch (preset) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        return { from: startDate, to: new Date(now) };
      case "week":
        startDate.setDate(now.getDate() - 7);
        return { from: startDate, to: new Date(now) };
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        return { from: startDate, to: new Date(now) };
      case "all":
      default:
        return { from: null, to: null };
    }
  };

  const filterTransactionsByDateRange = (transactions, range, customRange) => {
    if (!transactions || transactions.length === 0) return [];

    if (range === "all" || (!customRange?.from && !customRange?.to)) {
      return transactions;
    }

    const actualRange =
      range === "custom" ? customRange : getDateRangeFromPreset(range);
    if (!actualRange.from) return transactions;

    return transactions.filter((t) => {
      const tDate = new Date(t.Purchase_Date);
      tDate.setHours(0, 0, 0, 0);
      const from = new Date(actualRange.from);
      from.setHours(0, 0, 0, 0);
      const to = actualRange.to ? new Date(actualRange.to) : new Date();
      to.setHours(23, 59, 59, 999);

      return tDate >= from && tDate <= to;
    });
  };

  const formatShortDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    const m = dt.getMonth() + 1;
    const day = dt.getDate();
    const y = dt.getFullYear();
    return `${m}/${day}/${y}`;
  };

  const getRangeLabel = (range, customRange) => {
    switch (range) {
      case "today":
        return "Today";
      case "week":
        return "Past Week";
      case "month":
        return "Past Month";
      case "all":
        return "All Time";
      case "custom":
        if (customRange?.from && customRange?.to) {
          return `${formatShortDate(customRange.from)} - ${formatShortDate(
            customRange.to
          )}`;
        }
        return "Custom";
      default:
        return "All Time";
    }
  };

  const canApplyRange = (customRange) => {
    if (!customRange || !customRange.from || !customRange.to) return false;
    return customRange.to.getTime() !== customRange.from.getTime();
  };

  // Number of unique days available for the revenue filters (based on the current
  // revenueConfig dateRange/customRange, so the Top N Days control can clamp correctly)
  const availableDaysCount = useMemo(() => {
    // Build a filtered set of transactions according to the current revenueConfig
    const filtered = filterTransactionsByDateRange(
      detailedTransactions,
      revenueConfig.dateRange,
      revenueConfig.customRange
    );
    const days = new Set();
    filtered.forEach((t) => {
      const d = t.Purchase_Date ? new Date(t.Purchase_Date) : null;
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(d.getDate()).padStart(2, "0")}`;
      days.add(key);
    });
    return days.size;
  }, [
    detailedTransactions,
    revenueConfig.dateRange,
    revenueConfig.customRange?.from,
    revenueConfig.customRange?.to,
  ]);

  // Check if configs have changed
  const hasRevenueChanges = useMemo(() => {
    return (
      JSON.stringify(revenueConfig) !== JSON.stringify(appliedRevenueConfig)
    );
  }, [revenueConfig, appliedRevenueConfig]);

  // Determine whether the current revenueConfig equals the component defaults.
  // We normalize numeric fields because user inputs sometimes cast to strings.
  const isRevenueConfigDefault = useMemo(() => {
    const normalize = (cfg) => ({
      dateRange: cfg.dateRange,
      customRange: {
        from: cfg.customRange?.from
          ? new Date(cfg.customRange.from).toISOString()
          : null,
        to: cfg.customRange?.to
          ? new Date(cfg.customRange.to).toISOString()
          : null,
      },
      revenueSource: cfg.revenueSource,
      visitorType: cfg.visitorType,
      dayOfWeek: cfg.dayOfWeek,
      minTransaction:
        cfg.minTransaction === "" ? "" : Number(cfg.minTransaction),
      maxTransaction:
        cfg.maxTransaction === "" ? "" : Number(cfg.maxTransaction),
      topN: cfg.topN === "" ? "" : Number(cfg.topN),
    });
    return (
      JSON.stringify(normalize(revenueConfig)) ===
      JSON.stringify(normalize(initialRevenueConfig))
    );
  }, [revenueConfig, initialRevenueConfig]);

  const hasBehaviorChanges = useMemo(() => {
    return (
      JSON.stringify(behaviorConfig) !== JSON.stringify(appliedBehaviorConfig)
    );
  }, [behaviorConfig, appliedBehaviorConfig]);

  // Determine if behaviorConfig equals defaults (normalize numeric topNProducts)
  const isBehaviorConfigDefault = useMemo(() => {
    const normalize = (cfg) => ({
      ...cfg,
      topNProducts: Number(cfg.topNProducts || 0),
    });
    return (
      JSON.stringify(normalize(behaviorConfig)) ===
      JSON.stringify(normalize(initialBehaviorConfig))
    );
  }, [behaviorConfig, initialBehaviorConfig]);

  // Apply filter handlers
  const handleApplyRevenueFilters = () => {
    // Validate one more time before applying
    const minRaw = revenueConfig.minTransaction;
    const maxRaw = revenueConfig.maxTransaction;
    const errors = { min: "", max: "", topN: "" };
    const parsedMin = minRaw === "" ? null : parseFloat(minRaw);
    const parsedMax = maxRaw === "" ? null : parseFloat(maxRaw);

    if (parsedMin !== null) {
      if (Number.isNaN(parsedMin)) errors.min = "Enter a valid number";
      else if (parsedMin < 0) errors.min = "Cannot be negative";
    }
    if (parsedMax !== null) {
      if (Number.isNaN(parsedMax)) errors.max = "Enter a valid number";
      else if (parsedMax < 0) errors.max = "Cannot be negative";
    }
    if (parsedMin !== null && parsedMax !== null && parsedMax < parsedMin)
      errors.max = "Maximum must be >= minimum";

    // Validate topN
    const parsedTopN =
      revenueConfig.topN === "" ? null : parseInt(revenueConfig.topN, 10);
    if (parsedTopN === null || Number.isNaN(parsedTopN))
      errors.topN = "Enter a valid number";
    else if (parsedTopN < 0) errors.topN = "Cannot be negative";
    else if (availableDaysCount && parsedTopN > availableDaysCount)
      errors.topN = `Cannot be greater than ${availableDaysCount}`;

    setRevenueInputErrors(errors);
    // If there are errors, do not apply
    if (errors.min || errors.max || errors.topN) return;

    setAppliedRevenueConfig({ ...revenueConfig });
  };

  const handleApplyBehaviorFilters = () => {
    setAppliedBehaviorConfig({ ...behaviorConfig });
  };

  // Reset revenue filter inputs back to defaults (do not apply until user clicks Apply)
  const handleClearRevenueFilters = () => {
    setRevenueConfig({ ...initialRevenueConfig });
    setRevenueInputErrors({ min: "", max: "", topN: "" });
  };

  // Reset behaviour filter inputs back to defaults (do not apply until user clicks Apply)
  const handleClearBehaviorFilters = () => {
    setBehaviorConfig({ ...initialBehaviorConfig });
  };

  // ========== REVENUE REPORT DATA PROCESSING ==========

  const filteredRevenueTransactions = useMemo(() => {
    let filtered = filterTransactionsByDateRange(
      detailedTransactions,
      appliedRevenueConfig.dateRange,
      appliedRevenueConfig.customRange
    );

    // Filter by revenue source
    if (appliedRevenueConfig.revenueSource !== "all") {
      filtered = filtered.filter((t) => {
        const cat = t.Category?.toLowerCase() || "";
        if (appliedRevenueConfig.revenueSource === "tickets")
          return cat.includes("ticket");
        if (appliedRevenueConfig.revenueSource === "membership")
          return cat.includes("membership");
        if (appliedRevenueConfig.revenueSource === "giftshop")
          return cat.includes("gift") || cat.includes("shop");
        if (appliedRevenueConfig.revenueSource === "food")
          return cat.includes("food");
        return true;
      });
    }

    // Filter by visitor type (day pass tickets vs annual members)
    if (appliedRevenueConfig.visitorType !== "all") {
      filtered = filtered.filter((t) => {
        const cat = t.Category?.toLowerCase() || "";
        if (appliedRevenueConfig.visitorType === "daypass")
          return cat.includes("ticket");
        if (appliedRevenueConfig.visitorType === "members")
          return cat.includes("membership");
        return true;
      });
    }

    // Filter by day of week
    if (appliedRevenueConfig.dayOfWeek !== "all") {
      filtered = filtered.filter((t) => {
        const date = new Date(t.Purchase_Date);
        const day = date.getDay();
        if (appliedRevenueConfig.dayOfWeek === "weekdays")
          return day >= 1 && day <= 5;
        if (appliedRevenueConfig.dayOfWeek === "weekends")
          return day === 0 || day === 6;
        return true;
      });
    }

    // Filter by transaction amount
    if (appliedRevenueConfig.minTransaction) {
      const min = parseFloat(appliedRevenueConfig.minTransaction);
      filtered = filtered.filter(
        (t) => (parseFloat(t.Total_Amount) || 0) >= min
      );
    }
    if (appliedRevenueConfig.maxTransaction) {
      const max = parseFloat(appliedRevenueConfig.maxTransaction);
      filtered = filtered.filter(
        (t) => (parseFloat(t.Total_Amount) || 0) <= max
      );
    }

    return filtered;
  }, [detailedTransactions, appliedRevenueConfig]);

  const revenueKPIs = useMemo(() => {
    const total = filteredRevenueTransactions.reduce(
      (sum, t) => sum + (parseFloat(t.Total_Amount) || 0),
      0
    );
    const count = filteredRevenueTransactions.length;
    const avg = count > 0 ? total / count : 0;

    // compute revenue per unique customer
    const uniqueCustomers = new Set(
      filteredRevenueTransactions
        .map((t) => t.Customer_ID)
        .filter((id) => typeof id !== "undefined" && id !== null)
    );
    const uniqueCount = uniqueCustomers.size || 0;
    const revenuePerCustomer = uniqueCount > 0 ? total / uniqueCount : 0;

    return {
      totalRevenue: total,
      transactionCount: count,
      avgTransaction: avg,
      revenuePerCustomer,
    };
  }, [filteredRevenueTransactions]);

  const revenueBySource = useMemo(() => {
    const sources = { tickets: 0, membership: 0, giftShop: 0, food: 0 };

    filteredRevenueTransactions.forEach((t) => {
      const cat = t.Category?.toLowerCase() || "";
      const amount = parseFloat(t.Total_Amount) || 0;

      if (cat.includes("ticket")) sources.tickets += amount;
      else if (cat.includes("membership")) sources.membership += amount;
      else if (cat.includes("gift") || cat.includes("shop"))
        sources.giftShop += amount;
      else if (cat.includes("food")) sources.food += amount;
    });

    return [
      { name: "Tickets", value: sources.tickets, fill: COLORS.tickets },
      {
        name: "Memberships",
        value: sources.membership,
        fill: COLORS.membership,
      },
      { name: "Gift Shop", value: sources.giftShop, fill: COLORS.giftShop },
      { name: "Food", value: sources.food, fill: COLORS.food },
    ].filter((item) => item.value > 0);
  }, [filteredRevenueTransactions]);

  // Total revenue for the donut center (computed after revenueBySource is available)
  const revenueSourceTotal = useMemo(() => {
    return (
      (Array.isArray(revenueBySource)
        ? revenueBySource.reduce((sum, item) => sum + (item.value || 0), 0)
        : 0) || 0
    );
  }, [revenueBySource]);

  const revenueTrendData = useMemo(() => {
    const dailyRevenue = new Map();

    filteredRevenueTransactions.forEach((t) => {
      const date = new Date(t.Purchase_Date).toLocaleDateString();
      const amount = parseFloat(t.Total_Amount) || 0;
      dailyRevenue.set(date, (dailyRevenue.get(date) || 0) + amount);
    });

    return Array.from(dailyRevenue.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredRevenueTransactions]);

  const topRevenueDays = useMemo(() => {
    const dailyData = new Map();

    filteredRevenueTransactions.forEach((t) => {
      const date = new Date(t.Purchase_Date).toLocaleDateString();
      const amount = parseFloat(t.Total_Amount) || 0;

      if (!dailyData.has(date)) {
        dailyData.set(date, { date, revenue: 0, transactions: 0 });
      }

      const day = dailyData.get(date);
      day.revenue += amount;
      day.transactions += 1;
    });

    return Array.from(dailyData.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, appliedRevenueConfig.topN);
  }, [filteredRevenueTransactions, appliedRevenueConfig.topN]);

  // ========== VISITOR BEHAVIOR REPORT DATA PROCESSING ==========

  const filteredBehaviorTransactions = useMemo(() => {
    let filtered = filterTransactionsByDateRange(
      detailedTransactions,
      appliedBehaviorConfig.dateRange,
      appliedBehaviorConfig.customRange
    );

    // Filter by time of day
    if (appliedBehaviorConfig.timeOfDay !== "all") {
      filtered = filtered.filter((t) => {
        if (!t.Purchase_Date) return true;
        const hour = new Date(t.Purchase_Date).getHours();
        if (appliedBehaviorConfig.timeOfDay === "morning")
          return hour >= 9 && hour < 12;
        if (appliedBehaviorConfig.timeOfDay === "afternoon")
          return hour >= 12 && hour < 17;
        if (appliedBehaviorConfig.timeOfDay === "evening") return hour >= 17;
        return true;
      });
    }

    // Filter by day type
    if (appliedBehaviorConfig.dayType !== "all") {
      filtered = filtered.filter((t) => {
        const date = new Date(t.Purchase_Date);
        const day = date.getDay();
        if (appliedBehaviorConfig.dayType === "weekdays")
          return day >= 1 && day <= 5;
        if (appliedBehaviorConfig.dayType === "weekends")
          return day === 0 || day === 6;
        return true;
      });
    }

    // Filter by visitor type
    if (appliedBehaviorConfig.visitorType !== "all") {
      filtered = filtered.filter((t) => {
        const cat = t.Category?.toLowerCase() || "";
        if (appliedBehaviorConfig.visitorType === "daypass")
          return cat.includes("ticket");
        if (appliedBehaviorConfig.visitorType === "members")
          return cat.includes("membership");
        return true;
      });
    }

    // (Age Demographics filter removed)

    // Filter by product category
    if (appliedBehaviorConfig.productCategory !== "all") {
      filtered = filtered.filter((t) => {
        const cat = t.Category?.toLowerCase() || "";
        if (appliedBehaviorConfig.productCategory === "giftshop")
          return cat.includes("gift") || cat.includes("shop");
        if (appliedBehaviorConfig.productCategory === "food")
          return cat.includes("food");
        return true;
      });
    }

    // Filter by transaction size
    if (appliedBehaviorConfig.transactionSize !== "all") {
      filtered = filtered.filter((t) => {
        const total = parseFloat(t.Total_Amount) || 0;
        if (appliedBehaviorConfig.transactionSize === "small")
          return total < 50;
        if (appliedBehaviorConfig.transactionSize === "medium")
          return total >= 50 && total <= 100;
        if (appliedBehaviorConfig.transactionSize === "large")
          return total > 100;
        return true;
      });
    }

    return filtered;
  }, [detailedTransactions, appliedBehaviorConfig]);

  const behaviorKPIs = useMemo(() => {
    // Count visitors by date
    // 1 ticket purchase = 1 visitor
    // 1 customer with active membership who made any purchase that day = 1 member visitor
    const visitorsByDate = new Map();
    const memberVisitorsByDate = new Map();

    filteredBehaviorTransactions.forEach((t) => {
      const date = new Date(t.Purchase_Date).toLocaleDateString();
      const customerId = t.Customer_ID;
      const cat = t.Category?.toLowerCase() || "";
      const desc = t.Item_Description?.toLowerCase() || "";

      // Check if customer has active membership
      const hasMembership =
        cat.includes("membership") || desc.includes("annual");

      // Track tickets purchased (each ticket = 1 visitor)
      if (cat.includes("ticket")) {
        const quantity = parseInt(t.Quantity) || 1;
        if (!visitorsByDate.has(date)) visitorsByDate.set(date, 0);
        visitorsByDate.set(date, visitorsByDate.get(date) + quantity);
      }

      // Track member visitors (one per customer per day with active membership)
      if (hasMembership || cat.includes("membership")) {
        const key = `${date}-${customerId}`;
        if (!memberVisitorsByDate.has(key)) {
          memberVisitorsByDate.set(key, true);
        }
      }
    });

    // Total visitors = ticket count + unique member visits
    const ticketVisitors = Array.from(visitorsByDate.values()).reduce(
      (sum, count) => sum + count,
      0
    );
    const memberVisitors = memberVisitorsByDate.size;
    const totalVisitors = ticketVisitors + memberVisitors;

    // Calculate items per transaction (using Quantity, excluding tickets)
    const nonTicketTransactions = filteredBehaviorTransactions.filter(
      (t) => !(t.Category?.toLowerCase() || "").includes("ticket")
    );
    const totalItems = nonTicketTransactions.reduce(
      (sum, t) => sum + (parseInt(t.Quantity) || 1),
      0
    );
    const avgItems =
      nonTicketTransactions.length > 0
        ? totalItems / nonTicketTransactions.length
        : 0;

    // Find peak hour based on visitor traffic (tickets sold)
    const hourCounts = new Map();
    filteredBehaviorTransactions.forEach((t) => {
      if (t.Purchase_Date) {
        const cat = t.Category?.toLowerCase() || "";
        if (cat.includes("ticket")) {
          const hour = new Date(t.Purchase_Date).getHours();
          const quantity = parseInt(t.Quantity) || 1;
          hourCounts.set(hour, (hourCounts.get(hour) || 0) + quantity);
        }
      }
    });
    const peakHourEntry = Array.from(hourCounts.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0];
    const formatHour12 = (h) => {
      const hour = ((h % 24) + 24) % 24; // normalize
      const period = hour >= 12 ? "pm" : "am";
      const hour12 = hour % 12 === 0 ? 12 : hour % 12;
      return `${hour12}:00 ${period}`;
    };

    const peakHour = peakHourEntry
      ? `${formatHour12(peakHourEntry[0])} - ${formatHour12(
          (peakHourEntry[0] + 1) % 24
        )}`
      : "N/A";

    // Conversion rate: percentage of visitors who made purchases (excluding ticket purchases)
    const shoppingVisitors = new Set(
      nonTicketTransactions.map((t) => t.Customer_ID)
    ).size;
    const conversionRate =
      totalVisitors > 0 ? (shoppingVisitors / totalVisitors) * 100 : 0;

    // Average revenue per visitor (kept for other uses)
    const totalRevenue = filteredBehaviorTransactions.reduce(
      (sum, t) => sum + (parseFloat(t.Total_Amount) || 0),
      0
    );
    const avgRevenuePerVisitor =
      totalVisitors > 0 ? totalRevenue / totalVisitors : 0;

    // Top product category by revenue (excluding tickets)
    const categoryRevenue = new Map();
    nonTicketTransactions.forEach((t) => {
      const cat = t.Category || "Other";
      const rev = parseFloat(t.Total_Amount) || 0;
      categoryRevenue.set(cat, (categoryRevenue.get(cat) || 0) + rev);
    });
    const topCategoryEntry = Array.from(categoryRevenue.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0];
    const topProductCategory = topCategoryEntry
      ? `${topCategoryEntry[0]} - $${topCategoryEntry[1].toFixed(2)}`
      : "N/A";

    // Compute member vs non-member ratio based on unique accounts present
    // We consider an account a 'member' if there's any transaction for that
    // Customer_ID that includes a membership category or description.
    const accountSet = new Set();
    const memberAccountSet = new Set();
    filteredBehaviorTransactions.forEach((t) => {
      const cid = t.Customer_ID;
      if (cid === null || cid === undefined) return;
      accountSet.add(cid);
      const cat = (t.Category || "").toLowerCase();
      const desc = (t.Item_Description || "").toLowerCase();
      if (cat.includes("membership") || desc.includes("annual")) {
        memberAccountSet.add(cid);
      }
    });

    const totalAccounts = accountSet.size;
    const memberAccounts = memberAccountSet.size;
    const nonmemberAccounts = Math.max(0, totalAccounts - memberAccounts);
    const memberAccountRatio =
      totalAccounts > 0 ? (memberAccounts / totalAccounts) * 100 : 0;

    return {
      totalVisitors,
      avgRevenuePerVisitor,
      topProductCategory,
      peakHour,
      // account metrics
      totalAccounts,
      memberAccounts,
      nonmemberAccounts,
      memberAccountRatio,
      // conversion & shopping metrics
      conversionRate,
      shoppingVisitors,
      avgItems,
    };
  }, [filteredBehaviorTransactions]);
  const trafficByHour = useMemo(() => {
    const hourlyData = new Map();

    // Determine hour range based on selected timeOfDay filter.
    // When 'all' is selected, include full 24 hours (0-23) so even hours with 0 transactions are shown.
    let startHour = 9;
    let endHour = 18;
    const tod = appliedBehaviorConfig?.timeOfDay || "all";
    if (tod === "all") {
      startHour = 0;
      endHour = 23;
    } else if (tod === "morning") {
      startHour = 9;
      endHour = 11;
    } else if (tod === "afternoon") {
      startHour = 12;
      endHour = 16;
    } else if (tod === "evening") {
      startHour = 17;
      endHour = 23;
    }

    for (let h = startHour; h <= endHour; h++) {
      // Track transaction counts (each transaction = 1) and revenue
      hourlyData.set(h, { hour: `${h}:00`, transactions: 0, revenue: 0 });
    }

    // Count transactions per hour (each transaction = 1) and sum revenue
    filteredBehaviorTransactions.forEach((t) => {
      if (t.Purchase_Date) {
        const hour = new Date(t.Purchase_Date).getHours();

        if (hourlyData.has(hour)) {
          const data = hourlyData.get(hour);
          // Count each transaction (not just ticket quantities)
          data.transactions += 1;
          data.revenue += parseFloat(t.Total_Amount) || 0;
        }
      }
    });

    return Array.from(hourlyData.values());
  }, [filteredBehaviorTransactions, appliedBehaviorConfig?.timeOfDay]);

  const topProducts = useMemo(() => {
    const productSales = new Map();

    filteredBehaviorTransactions.forEach((t) => {
      const rawDesc = t.Item_Description || "Unknown";
      const cat = t.Category?.toLowerCase() || "";

      // Skip tickets and membership items from top products
      if (cat.includes("ticket") || cat.includes("membership")) return;
      const descLower = rawDesc.toLowerCase();
      if (descLower.includes("membership") || descLower.includes("annual"))
        return;

      // Strip trailing parenthetical category markers like " (Shop)" or " (Food)"
      const cleaned = rawDesc.replace(/\s*\([^)]*\)\s*$/, "");

      const key = cleaned || "Unknown";

      if (!productSales.has(key)) {
        productSales.set(key, {
          product: key,
          sales: 0,
          quantity: 0,
          revenue: 0,
        });
      }
      const data = productSales.get(key);
      data.sales += 1;
      data.quantity += parseInt(t.Quantity) || 1;
      data.revenue += parseFloat(t.Total_Amount) || 0;
    });

    return Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, appliedBehaviorConfig.topNProducts);
  }, [filteredBehaviorTransactions, appliedBehaviorConfig.topNProducts]);

  // Number of unique available products (excluding tickets/memberships) so the UI can
  // clamp the user-entered top-N value
  const availableProductCount = useMemo(() => {
    const set = new Set();
    filteredBehaviorTransactions.forEach((t) => {
      const rawDesc = t.Item_Description || "Unknown";
      const cat = t.Category?.toLowerCase() || "";
      if (cat.includes("ticket") || cat.includes("membership")) return;
      const descLower = rawDesc.toLowerCase();
      if (descLower.includes("membership") || descLower.includes("annual"))
        return;
      const cleaned = rawDesc.replace(/\s*\([^)]*\)\s*$/, "");
      set.add(cleaned || "Unknown");
    });
    return set.size;
  }, [filteredBehaviorTransactions]);

  // Keep configured topNProducts within bounds when availableProductCount changes
  useEffect(() => {
    const max = Math.max(1, availableProductCount || 1);
    if (behaviorConfig.topNProducts > max) {
      setBehaviorConfig((b) => ({ ...b, topNProducts: max }));
    }
    if (behaviorConfig.topNProducts < 1) {
      setBehaviorConfig((b) => ({ ...b, topNProducts: 1 }));
    }
  }, [availableProductCount]);

  // Ensure revenueConfig.topN remains in valid bounds when availableDaysCount changes
  useEffect(() => {
    const max = Math.max(0, availableDaysCount || 0);
    setRevenueConfig((r) => {
      const current = parseInt(r.topN, 10);
      let next = Number.isNaN(current) ? 0 : current;
      if (next < 0) next = 0;
      if (next > max) next = max;
      if (next === current) return r;
      return { ...r, topN: next };
    });
  }, [availableDaysCount]);

  // Sorted products for the table (react to header sorting)
  const sortedProducts = useMemo(() => {
    const arr = topProducts.map((p) => ({
      ...p,
      avgPrice: p.quantity ? p.revenue / p.quantity : 0,
    }));

    const col = productSort.column;
    const dir = productSort.direction === "asc" ? 1 : -1;

    arr.sort((a, b) => {
      if (col === "product") return a.product.localeCompare(b.product) * dir;
      if (col === "avgPrice") return (a.avgPrice - b.avgPrice) * dir;
      return (a[col] - b[col]) * dir;
    });

    return arr;
  }, [topProducts, productSort]);

  // Tickets by type (counts) for the donut chart
  const ticketsByType = useMemo(() => {
    const types = { adult: 0, child: 0, student: 0, senior: 0 };

    filteredBehaviorTransactions.forEach((t) => {
      const cat = t.Category?.toLowerCase() || "";
      const desc = t.Item_Description?.toLowerCase() || "";
      // Use Quantity for ticket counts; default to 1 if missing
      const qty = parseInt(t.Quantity) || 1;

      // Only count ticket transactions
      if (!cat.includes("ticket")) return;

      if (desc.includes("adult")) types.adult += qty;
      else if (desc.includes("child")) types.child += qty;
      else if (desc.includes("student")) types.student += qty;
      else if (desc.includes("senior")) types.senior += qty;
    });

    return [
      { name: "Adult Tickets", value: types.adult, fill: "#3B82F6" },
      { name: "Child Tickets", value: types.child, fill: "#10B981" },
      { name: "Student Tickets", value: types.student, fill: "#F59E0B" },
      { name: "Senior Tickets", value: types.senior, fill: "#8B5CF6" },
    ].filter((item) => item.value > 0);
  }, [filteredBehaviorTransactions]);

  // Total ticket count for the donut center
  const ticketsTotal = useMemo(() => {
    return (
      (Array.isArray(ticketsByType)
        ? ticketsByType.reduce((sum, item) => sum + (item.value || 0), 0)
        : 0) || 0
    );
  }, [ticketsByType]);

  // ========== DATE SELECTOR COMPONENT ==========

  const DateRangeSelector = ({
    config,
    setConfig,
    popoverOpen,
    setPopoverOpen,
  }) => {
    const [tempRange, setTempRange] = useState(config.customRange);

    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Date Range:</span>
        <Popover
          open={popoverOpen}
          onOpenChange={(open) => {
            if (open) {
              setTempRange(config.customRange);
            }
            setPopoverOpen(open);
          }}
        >
          <PopoverTrigger asChild>
            <button
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-white text-sm hover:bg-gray-50"
              style={{ borderColor: "#e5e7eb" }}
            >
              <Calendar className="h-4 w-4 text-gray-600" />
              <span className="text-gray-700">
                {getRangeLabel(config.dateRange, config.customRange)}
              </span>
            </button>
          </PopoverTrigger>

          <PopoverContent
            style={{ width: "450px", overflow: "hidden" }}
            align="end"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex" }}>
              {/* Preset buttons */}
              <div
                style={{
                  width: "180px",
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
                  {["today", "week", "month", "all"].map((preset) => (
                    <li key={preset}>
                      <button
                        onClick={() => {
                          const range = getDateRangeFromPreset(preset);
                          setConfig({
                            ...config,
                            dateRange: preset,
                            customRange: range,
                          });
                          setPopoverOpen(false);
                        }}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "0.5rem",
                          borderRadius: "0.375rem",
                          border: "none",
                          background:
                            config.dateRange === preset
                              ? "#f3f4f6"
                              : "transparent",
                          cursor: "pointer",
                          fontSize: "0.875rem",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {preset === "today" && "Today"}
                        {preset === "week" && "Past Week"}
                        {preset === "month" && "Past Month"}
                        {preset === "all" && "All Time"}
                      </button>
                    </li>
                  ))}
                  <li>
                    <button
                      onClick={() => {
                        const range = getDateRangeFromPreset("all");
                        setConfig({
                          ...config,
                          dateRange: "all",
                          customRange: range,
                        });
                        setPopoverOpen(false);
                      }}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "0.5rem",
                        borderRadius: "0.375rem",
                        border: "none",
                        color: "#2563eb",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Reset
                    </button>
                  </li>
                </ul>
              </div>

              {/* Calendar */}
              <div style={{ flex: 1, paddingLeft: "0.75rem" }}>
                <DayPicker
                  mode="range"
                  selected={tempRange}
                  onSelect={(range) => {
                    if (!range) return;
                    if (range?.from) {
                      const sel = {
                        from: range.from,
                        to: range.to || range.from,
                      };
                      setTempRange(sel);
                    }
                  }}
                  disabled={{ after: todayOnly }}
                  numberOfMonths={1}
                />
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginTop: "1rem",
                    justifyContent: "flex-end",
                  }}
                >
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setTempRange({ from: null, to: null })}
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!canApplyRange(tempRange)) return;
                      setConfig({
                        ...config,
                        dateRange: "custom",
                        customRange: tempRange,
                      });
                      setPopoverOpen(false);
                    }}
                    disabled={!canApplyRange(tempRange)}
                    className={`${
                      canApplyRange(tempRange)
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-green-200 cursor-not-allowed"
                    } text-white`}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  // Custom tick renderer that allows long labels to wrap into two lines
  const MultiLineTick = ({ x, y, payload, angle = -30 }) => {
    const raw = payload?.value || "";
    const label = String(raw);

    // if short, no need to wrap
    const maxLen = 18;
    let lines = [label];
    if (label.length > maxLen) {
      const mid = Math.floor(label.length / 2);
      let split = label.lastIndexOf(" ", mid);
      if (split === -1) split = label.indexOf(" ", mid);
      if (split !== -1) {
        lines = [label.slice(0, split), label.slice(split + 1)];
      } else {
        lines = [label.slice(0, maxLen), label.slice(maxLen)];
      }
    }

    // Render rotated text with tspans for multiline support
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          textAnchor="end"
          transform={`rotate(${angle})`}
          style={{ fontSize: 12, fill: "#374151" }}
        >
          {lines.map((ln, i) => (
            <tspan key={i} x={0} dy={i === 0 ? 0 : "1.15em"}>
              {ln}
            </tspan>
          ))}
        </text>
      </g>
    );
  };

  // ========== RENDER ==========

  return (
    <div className="space-y-6">
      <Tabs value={activeReportTab} onValueChange={setActiveReportTab}>
        <TabsList className="flex w-full justify-center gap-3 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger
            value="revenue"
            style={{
              cursor: "pointer",
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              fontSize: "0.875rem",
              fontWeight: "bold",
              background:
                activeReportTab === "revenue" ? "#ffffff" : "transparent",
              boxShadow:
                activeReportTab === "revenue"
                  ? "0 2px 3px rgba(0,0,0,0.3)"
                  : "none",
              color: activeReportTab === "revenue" ? "#047857" : "#374151",
              transition: "all 150ms",
            }}
          >
            Revenue Analysis
          </TabsTrigger>
          <TabsTrigger
            value="behavior"
            style={{
              cursor: "pointer",
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              fontSize: "0.875rem",
              fontWeight: "bold",
              background:
                activeReportTab === "behavior" ? "#ffffff" : "transparent",
              boxShadow:
                activeReportTab === "behavior"
                  ? "0 2px 3px rgba(0,0,0,0.3)"
                  : "none",
              color: activeReportTab === "behavior" ? "#1d4ed8" : "#374151",
              transition: "all 150ms",
            }}
          >
            Visitor Behavior
          </TabsTrigger>
        </TabsList>

        {/* ========== REPORT 1: Revenue & Financial Analysis ========== */}
        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between px-3 overflow-visible relative">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Comprehensive Revenue & Financial Analysis
                  </CardTitle>
                  <CardDescription>
                    Complete control over revenue analysis across all zoo
                    revenue streams
                  </CardDescription>
                </div>

                {/* Date range in header for quicker access */}
                <div className="ml-2 flex-none z-50">
                  <DateRangeSelector
                    config={revenueConfig}
                    setConfig={setRevenueConfig}
                    popoverOpen={revenuePopoverOpen}
                    setPopoverOpen={setRevenuePopoverOpen}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent
              className="space-y-6 overflow-visible"
              style={{ paddingBottom: "1.5rem" }}
            >
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Revenue Source */}
                <div>
                  <Label>Revenue Source</Label>
                  <Select
                    value={revenueConfig.revenueSource}
                    onValueChange={(value) =>
                      setRevenueConfig({
                        ...revenueConfig,
                        revenueSource: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="tickets">Tickets</SelectItem>
                      <SelectItem value="giftshop">Gift Shop</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="membership">Membership</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Visitor Type (same as Visitor Behavior filter) */}
                <div>
                  <Label>Visitor Type</Label>
                  <Select
                    value={revenueConfig.visitorType}
                    onValueChange={(value) =>
                      setRevenueConfig({ ...revenueConfig, visitorType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Visitors</SelectItem>
                      <SelectItem value="daypass">Non-members</SelectItem>
                      <SelectItem value="members">Annual Members</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Day of Week */}
                <div>
                  <Label>Day of Week</Label>
                  <Select
                    value={revenueConfig.dayOfWeek}
                    onValueChange={(value) =>
                      setRevenueConfig({ ...revenueConfig, dayOfWeek: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Days</SelectItem>
                      <SelectItem value="weekdays">Weekdays Only</SelectItem>
                      <SelectItem value="weekends">Weekends Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Top N Results */}
                <div>
                  <Label>Top # of Days</Label>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <input
                      type="number"
                      min={0}
                      max={Math.max(0, availableDaysCount)}
                      value={revenueConfig.topN}
                      onChange={(e) => {
                        const raw = e.target.value;
                        let val = parseInt(raw, 10);
                        if (Number.isNaN(val)) val = 0;
                        const max = Math.max(0, availableDaysCount || 0);
                        val = Math.max(0, Math.min(max, val));
                        setRevenueConfig({ ...revenueConfig, topN: val });
                        setRevenueInputErrors((s) => ({ ...s, topN: "" }));
                      }}
                      style={{
                        width: 90,
                        padding: "6px 8px",
                        borderRadius: 6,
                        border: "1px solid rgba(0,0,0,0.08)",
                        background: "#f7f7f7ff",
                      }}
                    />
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{`(max ${
                      availableDaysCount || 0
                    })`}</div>
                  </div>
                  {revenueInputErrors.topN && (
                    <div
                      style={{ fontSize: 12, color: "#dc2626", marginTop: 6 }}
                    >
                      {revenueInputErrors.topN}
                    </div>
                  )}
                </div>

                {/* Min Transaction Amount */}
                <div>
                  <Label>Min Transaction ($)</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={revenueConfig.minTransaction}
                    onChange={(e) => {
                      const raw = e.target.value;
                      // allow empty string
                      if (raw === "") {
                        setRevenueConfig({
                          ...revenueConfig,
                          minTransaction: "",
                        });
                        setRevenueInputErrors((s) => ({ ...s, min: "" }));
                        return;
                      }
                      const parsed = parseFloat(raw);
                      // clamp negative values to 0
                      const newVal = Number.isNaN(parsed)
                        ? ""
                        : Math.max(0, parsed);
                      setRevenueConfig({
                        ...revenueConfig,
                        minTransaction: newVal.toString(),
                      });

                      // live validate against max
                      const maxRaw = revenueConfig.maxTransaction;
                      const parsedMax =
                        maxRaw === "" ? null : parseFloat(maxRaw);
                      let err = "";
                      if (Number.isNaN(parsed)) err = "Enter a valid number";
                      else if (newVal < 0) err = "Cannot be negative";
                      else if (
                        parsedMax !== null &&
                        !Number.isNaN(parsedMax) &&
                        parsedMax < newVal
                      )
                        err = "Min cannot be greater than Max";
                      setRevenueInputErrors((s) => ({
                        ...s,
                        min: err,
                        max: s.max,
                      }));
                    }}
                  />
                  {revenueInputErrors.min && (
                    <div
                      style={{ fontSize: 12, color: "#dc2626", marginTop: 6 }}
                    >
                      {revenueInputErrors.min}
                    </div>
                  )}
                </div>

                {/* Max Transaction Amount */}
                <div>
                  <Label>Max Transaction ($)</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="No limit"
                    value={revenueConfig.maxTransaction}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        setRevenueConfig({
                          ...revenueConfig,
                          maxTransaction: "",
                        });
                        setRevenueInputErrors((s) => ({ ...s, max: "" }));
                        return;
                      }
                      const parsed = parseFloat(raw);
                      const newVal = Number.isNaN(parsed)
                        ? ""
                        : Math.max(0, parsed);
                      setRevenueConfig({
                        ...revenueConfig,
                        maxTransaction: newVal.toString(),
                      });

                      // live validate against min
                      const minRaw = revenueConfig.minTransaction;
                      const parsedMin =
                        minRaw === "" ? null : parseFloat(minRaw);
                      let err = "";
                      if (Number.isNaN(parsed)) err = "Enter a valid number";
                      else if (newVal < 0) err = "Cannot be negative";
                      else if (
                        parsedMin !== null &&
                        !Number.isNaN(parsedMin) &&
                        newVal < parsedMin
                      )
                        err = "Max cannot be less than Min";
                      setRevenueInputErrors((s) => ({
                        ...s,
                        max: err,
                        min: s.min,
                      }));
                    }}
                  />
                  {revenueInputErrors.max && (
                    <div
                      style={{ fontSize: 12, color: "#dc2626", marginTop: 6 }}
                    >
                      {revenueInputErrors.max}
                    </div>
                  )}
                </div>

                {/* Empty space for grid alignment */}
                <div></div>

                {/* Apply button: placed at end of second row, right aligned */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "flex-end",
                    gap: 8,
                  }}
                >
                  <Button
                    onClick={handleClearRevenueFilters}
                    disabled={isRevenueConfigDefault}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800"
                  >
                    Clear
                  </Button>

                  <Button
                    onClick={handleApplyRevenueFilters}
                    disabled={
                      !hasRevenueChanges ||
                      Boolean(revenueInputErrors.min) ||
                      Boolean(revenueInputErrors.max) ||
                      Boolean(revenueInputErrors.topN)
                    }
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Apply
                  </Button>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <HoverTooltip content="Sum of all transaction amounts in the selected range and filters.">
                  <Card
                    style={{
                      borderLeft: "4px solid #059669",
                    }}
                  >
                    <CardContent className="pt-6">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        <DollarSign
                          style={{
                            height: "2rem",
                            width: "2rem",
                            color: "#059669",
                          }}
                        />
                        <div>
                          <p style={{ fontSize: "0.875rem" }}>Revenue</p>
                          <p
                            style={{
                              fontSize: "1.5rem",
                              fontWeight: 600,
                              color: "#059669",
                            }}
                          >
                            $
                            {revenueKPIs.totalRevenue.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </HoverTooltip>

                <HoverTooltip content="Number of transactions in the selected range and filters.">
                  <Card
                    style={{
                      borderLeft: "4px solid #2563eb",
                    }}
                  >
                    <CardContent className="pt-6">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        <Receipt
                          style={{
                            height: "2rem",
                            width: "2rem",
                            color: "#2563eb",
                          }}
                        />
                        <div>
                          <p style={{ fontSize: "0.875rem" }}>Transactions</p>
                          <p
                            style={{
                              fontSize: "1.5rem",
                              fontWeight: 600,
                              color: "#2563eb",
                            }}
                          >
                            {revenueKPIs.transactionCount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </HoverTooltip>

                <HoverTooltip content="Average revenue per transaction for the selected filters.">
                  <Card style={{ borderLeft: "4px solid #9333ea" }}>
                    <CardContent className="pt-6">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        <TrendingUp
                          style={{
                            height: "2rem",
                            width: "2rem",
                            color: "#9333ea",
                          }}
                        />
                        <div>
                          <p style={{ fontSize: "0.875rem" }}>
                            Avg Transaction
                          </p>
                          <p
                            style={{
                              fontSize: "1.5rem",
                              fontWeight: 600,
                              color: "#9333ea",
                            }}
                          >
                            $
                            {revenueKPIs.avgTransaction.toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </HoverTooltip>

                <HoverTooltip content="Average revenue per unique customer in the selected range.">
                  <Card
                    style={{
                      borderLeft: "4px solid #ea580c",
                    }}
                  >
                    <CardContent className="pt-6">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        <DollarSign
                          style={{
                            height: "2rem",
                            width: "2rem",
                            color: "#ea580c",
                          }}
                        />
                        <div>
                          <p style={{ fontSize: "0.875rem" }}>
                            Revenue / Customer
                          </p>
                          <p
                            style={{
                              fontSize: "1.5rem",
                              fontWeight: 600,
                              color: "#ea580c",
                            }}
                          >
                            $
                            {revenueKPIs.revenuePerCustomer.toLocaleString(
                              "en-US",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </HoverTooltip>
              </div>

              {/* Charts Row 1: Revenue Trend (Line) */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.35rem 0.7rem",
                        borderRadius: "0.375rem",
                        background:
                          "linear-gradient(90deg, #10B981 0%, #059669 100%)",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                      }}
                    >
                      Revenue Trend Over Time
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent style={{ paddingBottom: 0 }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={revenueTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip
                        formatter={(value) =>
                          `$${value.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke={COLORS.primary}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Charts Row 2: Pie Chart and Bar Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.35rem 0.7rem",
                          borderRadius: "0.375rem",
                          background:
                            "linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)",
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: "0.95rem",
                        }}
                      >
                        Revenue Breakdown by Source
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent style={{ paddingBottom: 0 }}>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <defs>
                          {PIE_COLORS.map((c, i) => (
                            <linearGradient
                              key={`pg-${i}`}
                              id={`pieGrad${i}`}
                              x1="0%"
                              x2="100%"
                              y1="0%"
                              y2="100%"
                            >
                              <stop offset="0%" stopColor={c} stopOpacity="1" />
                              <stop
                                offset="100%"
                                stopColor={c}
                                stopOpacity="1"
                              />
                            </linearGradient>
                          ))}
                        </defs>
                        <Pie
                          data={revenueBySource}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) =>
                            `${entry.name}: $${entry.value.toFixed(0)}`
                          }
                          innerRadius={50}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {revenueBySource.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={`url(#pieGrad${index})`}
                            />
                          ))}
                        </Pie>
                        {/* Center label showing total revenue */}
                        <text
                          x="50%"
                          y="50%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          style={{ fontSize: 16, fontWeight: 700, fill: "red" }}
                        >
                          {`$${revenueSourceTotal.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`}
                        </text>
                        <Tooltip
                          formatter={(value) =>
                            `$${value.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Legend below pie chart showing colors matching the slices */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "1.25rem",
                        marginTop: "0.75rem",
                        flexWrap: "wrap",
                      }}
                    >
                      {revenueBySource.map((entry, idx) => (
                        <div
                          key={`legend-${idx}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <span
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: 3,
                              display: "inline-block",
                              background: entry.fill || PIE_COLORS[idx],
                            }}
                          />
                          <span
                            style={{ fontSize: "0.85rem", color: "#374151" }}
                          >
                            {entry.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.35rem 0.7rem",
                          borderRadius: "0.375rem",
                          background:
                            "linear-gradient(90deg, #059669 0%, #10B981 100%)",
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: "0.95rem",
                        }}
                      >
                        Top Revenue-Generating Days
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent style={{ paddingBottom: 0 }}>
                    {(() => {
                      const maxLabelsToShow = 6;
                      const showXAxisLabels =
                        topRevenueDays.length <= maxLabelsToShow;
                      const chartHeight = showXAxisLabels ? 300 : 380;
                      const xAxisHeight = showXAxisLabels ? 80 : 6;

                      return (
                        <ResponsiveContainer width="100%" height={chartHeight}>
                          <BarChart data={topRevenueDays}>
                            <defs>
                              <linearGradient
                                id="barGrad"
                                x1="0"
                                x2="0"
                                y1="0"
                                y2="1"
                              >
                                <stop
                                  offset="0%"
                                  stopColor={COLORS.primary}
                                  stopOpacity="0.95"
                                />
                                <stop
                                  offset="100%"
                                  stopColor={COLORS.primary}
                                  stopOpacity="0.6"
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="date"
                              // only render ticks when there are <= maxLabelsToShow bars
                              tick={
                                showXAxisLabels ? (
                                  <MultiLineTick angle={-45} />
                                ) : (
                                  false
                                )
                              }
                              height={xAxisHeight}
                            />
                            <YAxis />
                            <Tooltip
                              formatter={(value) =>
                                `$${value.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}`
                              }
                            />
                            <Bar
                              dataKey="revenue"
                              fill="url(#barGrad)"
                              radius={[8, 8, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== REPORT 2: Visitor Behavior & Sales Performance ========== */}
        <TabsContent value="behavior" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between px-3 overflow-visible relative">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Visitor Behavior & Sales Performance Analysis
                  </CardTitle>
                  <CardDescription>
                    Understand visitor patterns, shopping behavior, and product
                    performance
                  </CardDescription>
                </div>

                {/* Date range in header for quicker access */}
                <div className="ml-2 flex-none z-50">
                  <DateRangeSelector
                    config={behaviorConfig}
                    setConfig={setBehaviorConfig}
                    popoverOpen={behaviorPopoverOpen}
                    setPopoverOpen={setBehaviorPopoverOpen}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent
              className="space-y-6 overflow-visible"
              style={{ paddingBottom: "1.5rem" }}
            >
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Time of Day */}
                <div>
                  <Label>Time of Day</Label>
                  <Select
                    value={behaviorConfig.timeOfDay}
                    onValueChange={(value) =>
                      setBehaviorConfig({ ...behaviorConfig, timeOfDay: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Hours</SelectItem>
                      <SelectItem value="morning">
                        Morning (9AM-12PM)
                      </SelectItem>
                      <SelectItem value="afternoon">
                        Afternoon (12PM-5PM)
                      </SelectItem>
                      <SelectItem value="evening">
                        Evening (5PM-Midnight)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Day Type */}
                <div>
                  <Label>Day Type</Label>
                  <Select
                    value={behaviorConfig.dayType}
                    onValueChange={(value) =>
                      setBehaviorConfig({ ...behaviorConfig, dayType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Days</SelectItem>
                      <SelectItem value="weekdays">Weekdays</SelectItem>
                      <SelectItem value="weekends">Weekends</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Visitor Type */}
                <div>
                  <Label>Visitor Type</Label>
                  <Select
                    value={behaviorConfig.visitorType}
                    onValueChange={(value) =>
                      setBehaviorConfig({
                        ...behaviorConfig,
                        visitorType: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Visitors</SelectItem>
                      <SelectItem value="daypass">Non-members</SelectItem>
                      <SelectItem value="members">Annual Members</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Age Demographics filter removed */}

                {/* Product Category */}
                <div>
                  <Label>Product Category</Label>
                  <Select
                    value={behaviorConfig.productCategory}
                    onValueChange={(value) =>
                      setBehaviorConfig({
                        ...behaviorConfig,
                        productCategory: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products</SelectItem>
                      <SelectItem value="giftshop">Gift Shop</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Transaction Size */}
                <div>
                  <Label>Transaction Size</Label>
                  <Select
                    value={behaviorConfig.transactionSize}
                    onValueChange={(value) =>
                      setBehaviorConfig({
                        ...behaviorConfig,
                        transactionSize: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sizes</SelectItem>
                      <SelectItem value="small">Small (&lt;$50)</SelectItem>
                      <SelectItem value="medium">Medium ($50-$100)</SelectItem>
                      <SelectItem value="large">Large (&gt;$100)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Top N Products */}
                <div>
                  <Label>Top # of Products</Label>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <input
                      type="number"
                      min={1}
                      max={Math.max(1, availableProductCount)}
                      value={behaviorConfig.topNProducts}
                      onChange={(e) => {
                        // allow only numeric input
                        const raw = e.target.value;
                        let val = parseInt(raw, 10);
                        if (Number.isNaN(val)) val = 1;
                        // clamp
                        const max = Math.max(1, availableProductCount || 1);
                        val = Math.max(1, Math.min(max, val));
                        setBehaviorConfig({
                          ...behaviorConfig,
                          topNProducts: val,
                        });
                      }}
                      style={{
                        width: 90,
                        padding: "6px 8px",
                        borderRadius: 6,
                        border: "1px solid rgba(0,0,0,0.08)",
                        background: "rgba(245, 245, 245, 1)",
                      }}
                    />
                    <div style={{ fontSize: 12, color: "#6b7280" }}>{`(max ${
                      availableProductCount || 0
                    })`}</div>
                  </div>
                </div>
                {/* Empty space for grid alignment (so Apply sits bottom-right) */}
                <div></div>

                {/* Apply/Clear buttons: placed at end of second row, right aligned */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "flex-end",
                    gap: 8,
                  }}
                >
                  <Button
                    onClick={handleClearBehaviorFilters}
                    disabled={isBehaviorConfigDefault}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800"
                  >
                    Clear
                  </Button>

                  <Button
                    onClick={handleApplyBehaviorFilters}
                    disabled={!hasBehaviorChanges}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Apply
                  </Button>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <HoverTooltip content="Total visitors (tickets sold + unique member visits) in the selected range.">
                  <Card
                    className="h-full"
                    style={{
                      borderLeft: "4px solid #2563eb",
                    }}
                  >
                    <CardContent className="pt-6 h-full">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        <Users
                          style={{
                            height: "2rem",
                            width: "2rem",
                            color: "#2563eb",
                          }}
                        />
                        <div>
                          <p style={{ fontSize: "0.875rem" }}>Total Visitors</p>
                          <p
                            style={{
                              fontSize: "1.5rem",
                              fontWeight: 600,
                              color: "#2563eb",
                            }}
                          >
                            {behaviorKPIs.totalVisitors.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </HoverTooltip>

                <HoverTooltip content="Average number of items sold per non-ticket transaction for the selected filters.">
                  <Card
                    className="h-full"
                    style={{ borderLeft: "4px solid #059669" }}
                  >
                    <CardContent className="pt-6 h-full">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        <Boxes
                          style={{
                            height: "2rem",
                            width: "2rem",
                            color: "#059669",
                          }}
                        />
                        <div>
                          <p style={{ fontSize: "0.875rem" }}>
                            Avg Items / Transaction
                          </p>
                          <p
                            style={{
                              fontSize: "1.5rem",
                              fontWeight: 600,
                              color: "#059669",
                            }}
                          >
                            {behaviorKPIs.avgItems.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </HoverTooltip>

                <HoverTooltip content="Product category with the highest revenue (excluding tickets).">
                  <Card
                    className="h-full"
                    style={{ borderLeft: "4px solid #9333ea" }}
                  >
                    <CardContent className="pt-6 h-full">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        <Package
                          style={{
                            height: "2rem",
                            width: "2rem",
                            color: "#9333ea",
                          }}
                        />
                        <div>
                          <p style={{ fontSize: "0.875rem" }}>
                            Top Product Category
                          </p>
                          <p
                            style={{
                              fontSize: "1.5rem",
                              fontWeight: 600,
                              color: "#9333ea",
                            }}
                          >
                            {behaviorKPIs.topProductCategory}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </HoverTooltip>

                <HoverTooltip content="Hour with the highest ticket sales in the selected range.">
                  <Card
                    className="h-full"
                    style={{ borderLeft: "4px solid #ea580c" }}
                  >
                    <CardContent className="pt-6 h-full ">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        <Clock
                          style={{
                            height: "2rem",
                            width: "2rem",
                            color: "#ea580c",
                          }}
                        />
                        <div>
                          <p style={{ fontSize: "0.875rem" }}>Peak Hour</p>
                          <p
                            style={{
                              fontSize: "1.5rem",
                              fontWeight: 600,
                              color: "#ea580c",
                            }}
                          >
                            {behaviorKPIs.peakHour}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </HoverTooltip>
              </div>

              {/* Charts Row 1: Traffic by Hour */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.35rem 0.7rem",
                        borderRadius: "0.375rem",
                        background:
                          "linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%)",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                      }}
                    >
                      Traffic by Hour of Day
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent style={{ paddingBottom: 0 }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trafficByHour}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis
                        label={{
                          value: "Transactions",
                          angle: -90,
                          position: "insideLeft",
                          offset: 8,
                        }}
                      />
                      <Tooltip
                        formatter={(value, name) => {
                          // Make tooltip labels friendly for transactions and revenue
                          if (name === "transactions")
                            return [value, "Transactions"];
                          if (name === "revenue") return [value, "Revenue"];
                          return [value, name];
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="transactions"
                        stroke="#3B82F6"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Charts Row 2: Top Products and Revenue by Ticket Type */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.35rem 0.7rem",
                          borderRadius: "0.375rem",
                          background:
                            "linear-gradient(90deg, #10B981 0%, #059669 100%)",
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: "0.95rem",
                        }}
                      >
                        Top-Selling Products (Excluding Tickets)
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent style={{ paddingBottom: 0 }}>
                    {/* When there are many bars we hide X-axis labels to avoid overlap and
                        expand the chart so bars use the extra space */}
                    {(() => {
                      const maxLabelsToShow = 10;
                      const showXAxisLabels =
                        topProducts.length <= maxLabelsToShow;
                      const chartHeight = showXAxisLabels ? 300 : 380;
                      const xAxisHeight = showXAxisLabels ? 80 : 6; // minimal reserved height when labels hidden

                      return (
                        <ResponsiveContainer width="100%" height={chartHeight}>
                          <BarChart data={topProducts}>
                            <defs>
                              <linearGradient
                                id="prodBarGrad"
                                x1="0"
                                x2="0"
                                y1="0"
                                y2="1"
                              >
                                <stop
                                  offset="0%"
                                  stopColor="#10B981"
                                  stopOpacity="0.95"
                                />
                                <stop
                                  offset="100%"
                                  stopColor="#10B981"
                                  stopOpacity="0.6"
                                />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              dataKey="product"
                              type="category"
                              interval={0}
                              // disable rendering ticks when there are too many bars
                              tick={
                                showXAxisLabels ? (
                                  <MultiLineTick angle={-30} />
                                ) : (
                                  false
                                )
                              }
                              height={xAxisHeight}
                            />
                            <YAxis
                              type="number"
                              tickFormatter={(val) =>
                                `$${val.toLocaleString()}`
                              }
                            />
                            <Tooltip
                              formatter={(value) =>
                                `$${value.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}`
                              }
                            />
                            <Bar
                              dataKey="revenue"
                              fill="url(#prodBarGrad)"
                              radius={[6, 6, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.35rem 0.7rem",
                          borderRadius: "0.375rem",
                          background:
                            "linear-gradient(90deg, #8B5CF6 0%, #3B82F6 100%)",
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: "0.95rem",
                        }}
                      >
                        Tickets by Type
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent style={{ paddingBottom: 0 }}>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <defs>
                          {ticketsByType.map((entry, i) => (
                            <linearGradient
                              key={`tg-${i}`}
                              id={`ticketGrad${i}`}
                              x1="0%"
                              x2="100%"
                              y1="0%"
                              y2="100%"
                            >
                              <stop
                                offset="0%"
                                stopColor={entry.fill}
                                stopOpacity="1"
                              />
                              <stop
                                offset="100%"
                                stopColor={entry.fill}
                                stopOpacity="1"
                              />
                            </linearGradient>
                          ))}
                        </defs>
                        <Pie
                          data={ticketsByType}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                          innerRadius={50}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {ticketsByType.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={`url(#ticketGrad${index})`}
                            />
                          ))}
                        </Pie>
                        {/* Center label showing total tickets */}
                        <text
                          x="50%"
                          y="50%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            fill: "red",
                          }}
                        >
                          {`${ticketsTotal.toLocaleString("en-US")}`}
                        </text>
                        <Tooltip
                          formatter={(value) =>
                            `${value.toLocaleString("en-US")}`
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Legend below pie chart matching the Revenue by Source style */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "1.25rem",
                        marginTop: "0.75rem",
                        flexWrap: "wrap",
                      }}
                    >
                      {ticketsByType.map((entry, idx) => (
                        <div
                          key={`tlegend-${idx}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <span
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: 3,
                              display: "inline-block",
                              background: `linear-gradient(90deg, ${entry.fill} 0%, ${entry.fill} 100%)`,
                            }}
                          />
                          <span
                            style={{ fontSize: "0.85rem", color: "#374151" }}
                          >
                            {entry.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Product Performance Table */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.35rem 0.7rem",
                        borderRadius: "0.375rem",
                        background:
                          "linear-gradient(90deg, #f97316 0%, #f59e0b 100%)",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                      }}
                    >
                      Product Performance Details
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const maxRevenue =
                      sortedProducts && sortedProducts.length
                        ? Math.max(...sortedProducts.map((p) => p.revenue || 0))
                        : 1;
                    const ROW_LIMIT = 15;
                    const ROW_HEIGHT_PX = 52; // approximate height per row for scrolling math
                    const needsScroll = sortedProducts.length > ROW_LIMIT;
                    const wrapperStyle = {
                      maxHeight: needsScroll
                        ? `${ROW_LIMIT * ROW_HEIGHT_PX}px`
                        : "auto",
                      overflowY: needsScroll ? "auto" : "visible",
                      // small padding so the table header shadow has room
                      paddingRight: needsScroll ? 8 : 0,
                    };

                    return (
                      <div style={wrapperStyle}>
                        <Table>
                          <TableHeader
                            className="bg-slate-50"
                            style={{
                              position: "sticky",
                              top: 0,
                              zIndex: 6,
                              background: "#fbfbfc",
                              boxShadow: needsScroll
                                ? "0 2px 0 rgba(0,0,0,0.03)"
                                : "none",
                            }}
                          >
                            <TableRow>
                              <TableHead style={{ width: 56 }}>
                                <div
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: "#6b7280",
                                  }}
                                >
                                  <span style={{ paddingLeft: "1rem" }}>#</span>
                                </div>
                              </TableHead>
                              <TableHead
                                style={{ minWidth: 200, textAlign: "left" }}
                              >
                                <div
                                  style={{
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    fontWeight: "bold",
                                  }}
                                  onClick={() => {
                                    setProductSort((p) => ({
                                      column: "product",
                                      direction:
                                        p.column === "product" &&
                                        p.direction === "asc"
                                          ? "desc"
                                          : "asc",
                                    }));
                                  }}
                                >
                                  Product
                                  {productSort.column === "product" && (
                                    <span>
                                      {productSort.direction === "asc"
                                        ? "▲"
                                        : "▼"}
                                    </span>
                                  )}
                                </div>
                              </TableHead>
                              <TableHead
                                style={{ minWidth: 120, textAlign: "center" }}
                              >
                                <div
                                  style={{
                                    cursor: "pointer",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    gap: 6,
                                    fontWeight: "bold",
                                  }}
                                  onClick={() => {
                                    setProductSort((p) => ({
                                      column: "sales",
                                      direction:
                                        p.column === "sales" &&
                                        p.direction === "asc"
                                          ? "desc"
                                          : "asc",
                                    }));
                                  }}
                                >
                                  Sales Count
                                  {productSort.column === "sales" && (
                                    <span>
                                      {productSort.direction === "asc"
                                        ? "▲"
                                        : "▼"}
                                    </span>
                                  )}
                                </div>
                              </TableHead>
                              <TableHead
                                style={{ minWidth: 120, textAlign: "center" }}
                              >
                                <div
                                  style={{
                                    cursor: "pointer",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    gap: 6,
                                    fontWeight: "bold",
                                  }}
                                  onClick={() => {
                                    setProductSort((p) => ({
                                      column: "quantity",
                                      direction:
                                        p.column === "quantity" &&
                                        p.direction === "asc"
                                          ? "desc"
                                          : "asc",
                                    }));
                                  }}
                                >
                                  Quantity Sold
                                  {productSort.column === "quantity" && (
                                    <span>
                                      {productSort.direction === "asc"
                                        ? "▲"
                                        : "▼"}
                                    </span>
                                  )}
                                </div>
                              </TableHead>
                              <TableHead
                                style={{ minWidth: 160, textAlign: "center" }}
                              >
                                <div
                                  style={{
                                    cursor: "pointer",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    gap: 6,
                                    fontWeight: "bold",
                                  }}
                                  onClick={() => {
                                    setProductSort((p) => ({
                                      column: "revenue",
                                      direction:
                                        p.column === "revenue" &&
                                        p.direction === "asc"
                                          ? "desc"
                                          : "asc",
                                    }));
                                  }}
                                >
                                  Revenue
                                  {productSort.column === "revenue" && (
                                    <span>
                                      {productSort.direction === "asc"
                                        ? "▲"
                                        : "▼"}
                                    </span>
                                  )}
                                </div>
                              </TableHead>
                              <TableHead
                                style={{ minWidth: 120, textAlign: "center" }}
                              >
                                <div
                                  style={{
                                    cursor: "pointer",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    gap: 6,
                                    fontWeight: "bold",
                                  }}
                                  onClick={() => {
                                    setProductSort((p) => ({
                                      column: "avgPrice",
                                      direction:
                                        p.column === "avgPrice" &&
                                        p.direction === "asc"
                                          ? "desc"
                                          : "asc",
                                    }));
                                  }}
                                >
                                  Avg Price
                                  {productSort.column === "avgPrice" && (
                                    <span>
                                      {productSort.direction === "asc"
                                        ? "▲"
                                        : "▼"}
                                    </span>
                                  )}
                                </div>
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sortedProducts.map((product, index) => (
                              <TableRow
                                key={index}
                                className="hover:bg-slate-50"
                                style={{
                                  borderBottom: "1px solid rgba(0,0,0,0.04)",
                                }}
                              >
                                {/* Rank cell (matches header '#') */}
                                <TableCell
                                  style={{ paddingLeft: 12, width: 56 }}
                                >
                                  <div
                                    style={{
                                      width: 30,
                                      height: 30,
                                      borderRadius: 6,
                                      background: "#f3f4f6",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: "#374151",
                                      fontWeight: 700,
                                    }}
                                  >
                                    {index + 1}
                                  </div>
                                </TableCell>
                                {/* Product name cell (remove the small meta line) */}
                                <TableCell
                                  className="font-medium text-sm"
                                  style={{ minWidth: 200 }}
                                >
                                  <div
                                    style={{
                                      fontWeight: 600,
                                      color: "#111827",
                                    }}
                                  >
                                    {product.product}
                                  </div>
                                </TableCell>
                                <TableCell
                                  className="text-center text-sm"
                                  style={{
                                    verticalAlign: "middle",
                                    minWidth: 120,
                                  }}
                                >
                                  {product.sales}
                                </TableCell>
                                <TableCell
                                  className="text-center text-sm"
                                  style={{
                                    verticalAlign: "middle",
                                    minWidth: 120,
                                  }}
                                >
                                  {product.quantity}
                                </TableCell>
                                <TableCell
                                  className="text-center text-sm"
                                  style={{ verticalAlign: "middle" }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "center",
                                      gap: 6,
                                    }}
                                  >
                                    <div style={{ fontWeight: 700 }}>
                                      $
                                      {product.revenue.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </div>
                                    <div
                                      style={{
                                        width: 160,
                                        height: 8,
                                        background: "#eef2ff",
                                        borderRadius: 9999,
                                        overflow: "hidden",
                                        margin: "0 auto",
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: `${Math.round(
                                            (product.revenue / maxRevenue) * 100
                                          )}%`,
                                          height: "100%",
                                          background: "#c7e1ff",
                                        }}
                                      />
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell
                                  className="text-center text-sm"
                                  style={{
                                    verticalAlign: "middle",
                                    minWidth: 120,
                                  }}
                                >
                                  $
                                  {product.avgPrice.toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </TableCell>
                              </TableRow>
                            ))}
                            {sortedProducts.length === 0 && (
                              <TableRow>
                                <TableCell
                                  colSpan={6}
                                  className="text-center text-gray-500"
                                >
                                  No products found with current filters
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
