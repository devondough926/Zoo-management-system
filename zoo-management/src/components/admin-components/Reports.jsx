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
import { Checkbox } from "../ui/checkbox";
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
  Coffee,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Boxes,
  Activity,
  Settings,
  Search,
  Ticket,
  Crown,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { PaginationControls } from "../PaginationControls";

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
    fontWeight: 400,
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

// Empty state component for charts with no data
function EmptyState({
  message = "No data available for the selected filters",
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: 300,
        color: "#9ca3af",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <svg
        style={{ width: 64, height: 64, marginBottom: 16 }}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
      <p style={{ fontSize: "0.95rem", fontWeight: 500, marginBottom: 8 }}>
        {message}
      </p>
      <p style={{ fontSize: "0.85rem", color: "#d1d5db" }}>
        Try adjusting your filters to see more data
      </p>
    </div>
  );
}

export function Reports({
  detailedTransactions,
  memberships,
  items = [],
  concessionItems = [],
  revenueData = null,
  comparisonData = null,
  renderPercentageChange = null,
}) {
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

  // ========== TRANSACTION DETAILS TABLE STATE ==========
  const [transactionSortState, setTransactionSortState] = useState({
    col: null,
    dir: null,
  });
  const [transactionSource, setTransactionSource] = useState("No Selection");
  const [transactionSearch, setTransactionSearch] = useState("");
  const [visibleColumns, setVisibleColumns] = useState({
    purchaseId: true,
    dateTime: true,
    customer: true,
    category: true,
    description: true,
    quantity: true,
    unitPrice: true,
    total: true,
    payment: true,
  });
  const [transactionCurrentPage, setTransactionCurrentPage] = useState(1);
  const [transactionItemsPerPage, setTransactionItemsPerPage] = useState(15);

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
    // Allow single-day selections (from === to) as valid ranges
    return true;
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

  // ========== TRANSACTION TABLE HANDLERS ==========

  const toggleColumn = (columnKey) => {
    if (columnKey === "all") {
      const allChecked = Object.values(visibleColumns).every((v) => v);
      const newState = {};
      Object.keys(visibleColumns).forEach((k) => {
        newState[k] = !allChecked;
      });
      setVisibleColumns(newState);
    } else {
      setVisibleColumns((prev) => ({ ...prev, [columnKey]: !prev[columnKey] }));
    }
  };

  const toggleTransactionSort = (col) => {
    setTransactionSortState((prev) => {
      if (prev.col === col) {
        return { col, dir: prev.dir === "asc" ? "desc" : "asc" };
      }
      return { col, dir: "asc" };
    });
  };

  const handleTransactionPageChange = (page) => {
    if (page < 1 || page > transactionTotalPages) return;
    setTransactionCurrentPage(page);
    // Scroll to top of transactions section
    setTimeout(() => {
      const el = document.getElementById("revenue-transactions");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  // Reset transaction page when search changes
  useEffect(() => {
    setTransactionCurrentPage(1);
  }, [transactionSearch]);

  // Reset transaction page when revenue filters are applied
  useEffect(() => {
    setTransactionCurrentPage(1);
  }, [appliedRevenueConfig]);

  // ========== REVENUE REPORT DATA PROCESSING ==========

  // Precompute a map of Customer_ID -> membership ranges to speed up "is member at purchase" checks
  const membershipsByCustomer = useMemo(() => {
    const m = new Map();
    if (!Array.isArray(memberships)) return m;
    memberships.forEach((row) => {
      const cid = row.Customer_ID;
      if (cid == null) return;
      const start = row.Start_Date ? new Date(row.Start_Date) : null;
      const end = row.End_Date ? new Date(row.End_Date) : null;
      const status = (row.Membership_Status || "").toLowerCase();
      if (!m.has(String(cid))) m.set(String(cid), []);
      m.get(String(cid)).push({ start, end, status });
    });
    return m;
  }, [memberships]);

  // Helper to check if a customer was an active member at a specific datetime
  const isMemberAt = (customerId, date) => {
    if (customerId == null || !date) return false;
    const arr = membershipsByCustomer.get(String(customerId));
    if (!arr || arr.length === 0) return false;
    const dt = date instanceof Date ? date : new Date(date);
    for (const r of arr) {
      if (r.status !== "active") continue;
      // Treat missing start as -Infinity and missing end as +Infinity
      const start = r.start ? new Date(r.start) : null;
      const end = r.end ? new Date(r.end) : null;
      // inclusive comparison
      if (start && dt < start) continue;
      if (end && dt > end) continue;
      return true;
    }
    return false;
  };

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

    // Filter by visitor type (classify transactions by whether the purchaser
    // was an active member at the Purchase_Date). We use datetime-aware
    // membership ranges (inclusive on both ends). For consistency with the
    // attendance logic, treat explicit membership transactions as member-related.
    if (appliedRevenueConfig.visitorType !== "all") {
      if (appliedRevenueConfig.visitorType === "daypass") {
        // daypass (non-members): include any transaction where the purchaser
        // was NOT an active member at the purchase datetime. We exclude
        // explicit membership purchase transactions here because those are
        // classified with members (they represent a membership sale).
        filtered = filtered.filter((t) => {
          const cat = t.Category?.toLowerCase() || "";
          const desc = (t.Item_Description || "").toLowerCase();
          // If this is an explicit membership sale, treat it as member-side
          if (cat.includes("membership") || desc.includes("annual"))
            return false;
          const cid = t.Customer_ID;
          const pDate = t.Purchase_Date ? new Date(t.Purchase_Date) : null;
          // null/undefined Customer_ID are considered non-members
          const member = isMemberAt(cid, pDate);
          return !member;
        });
      } else if (appliedRevenueConfig.visitorType === "members") {
        // members: include transactions where purchaser was a member at purchase
        // time, or the transaction itself is a membership purchase
        filtered = filtered.filter((t) => {
          const cid = t.Customer_ID;
          const pDate = t.Purchase_Date ? new Date(t.Purchase_Date) : null;
          const cat = t.Category?.toLowerCase() || "";
          const desc = (t.Item_Description || "").toLowerCase();
          if (cat.includes("membership") || desc.includes("annual"))
            return true;
          if (!pDate) return false;
          return isMemberAt(cid, pDate);
        });
      }
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

  // ========== TRANSACTION TABLE DATA PROCESSING ==========

  const sortedTransactions = useMemo(() => {
    if (!transactionSortState.col) return filteredRevenueTransactions;
    const sorted = [...filteredRevenueTransactions].sort((a, b) => {
      const aVal = a[transactionSortState.col];
      const bVal = b[transactionSortState.col];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === "string") {
        const cmp = aVal.localeCompare(bVal);
        return transactionSortState.dir === "asc" ? cmp : -cmp;
      }
      const cmp = aVal - bVal;
      return transactionSortState.dir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [filteredRevenueTransactions, transactionSortState]);

  const transactionCategories = useMemo(() => {
    const cats = new Set();
    filteredRevenueTransactions.forEach((t) => {
      if (t.Category) cats.add(t.Category);
    });
    return Array.from(cats).sort();
  }, [filteredRevenueTransactions]);

  const filteredTransactions = useMemo(() => {
    let filtered = sortedTransactions;
    if (transactionSearch.trim()) {
      const search = transactionSearch.toLowerCase();
      filtered = filtered.filter((t) =>
        (t.Customer_Name || "").toLowerCase().includes(search)
      );
    }
    return filtered;
  }, [sortedTransactions, transactionSearch]);

  const displayedTransactions = useMemo(() => {
    const start = (transactionCurrentPage - 1) * transactionItemsPerPage;
    return filteredTransactions.slice(start, start + transactionItemsPerPage);
  }, [filteredTransactions, transactionCurrentPage, transactionItemsPerPage]);

  const transactionTotalPages = useMemo(() => {
    return Math.ceil(filteredTransactions.length / transactionItemsPerPage);
  }, [filteredTransactions.length, transactionItemsPerPage]);

  const transactionPaginationArray = useMemo(() => {
    const total = transactionTotalPages;
    const current = transactionCurrentPage;
    return Array.from({ length: total }, (_, i) => i + 1);
  }, [transactionCurrentPage, transactionTotalPages]);

  // ========== REVENUE BREAKDOWN FROM FILTERED TRANSACTIONS ==========

  const filteredRevenueBreakdown = useMemo(() => {
    const breakdown = {
      ticketRevenue: 0,
      membershipRevenue: 0,
      giftShopRevenue: 0,
      foodRevenue: 0,
      totalRevenue: 0,
    };

    filteredRevenueTransactions.forEach((t) => {
      const amount = parseFloat(t.Total_Amount) || 0;
      const category = t.Category || "";

      if (category === "Ticket") {
        breakdown.ticketRevenue += amount;
      } else if (category === "Membership") {
        breakdown.membershipRevenue += amount;
      } else if (category === "Gift Shop") {
        breakdown.giftShopRevenue += amount;
      } else if (category === "Food & Beverage" || category === "Concession") {
        breakdown.foodRevenue += amount;
      }
      breakdown.totalRevenue += amount;
    });

    return breakdown;
  }, [filteredRevenueTransactions]);

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
          return hour >= 9 && hour <= 12;
        if (appliedBehaviorConfig.timeOfDay === "afternoon")
          return hour >= 12 && hour <= 17;
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

    // Filter by visitor type (use membership table to determine membership at purchase time)
    if (appliedBehaviorConfig.visitorType !== "all") {
      filtered = filtered.filter((t) => {
        const cat = t.Category?.toLowerCase() || "";
        const desc = (t.Item_Description || "").toLowerCase();
        const cid = t.Customer_ID;
        const pDate = t.Purchase_Date ? new Date(t.Purchase_Date) : null;

        // If daypass (non-members): include transactions where purchaser was NOT
        // an active member at purchase time. Exclude explicit membership purchases
        // (those are treated as member-side sales).
        if (appliedBehaviorConfig.visitorType === "daypass") {
          if (cat.includes("membership") || desc.includes("annual"))
            return false;
          const member = isMemberAt(cid, pDate);
          return !member;
        }

        // If members: include transactions where purchaser was an active member
        // at purchase time OR the transaction itself is a membership purchase.
        if (appliedBehaviorConfig.visitorType === "members") {
          if (cat.includes("membership") || desc.includes("annual"))
            return true;
          if (!pDate) return false;
          return isMemberAt(cid, pDate);
        }

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

  // Transactions used for computing visitor-level KPIs (attendance)
  // This set respects date range, dayType, timeOfDay and visitorType, but
  // intentionally ignores productCategory and transactionSize so Total Visitors
  // represents attendance rather than product-filtered counts.
  const visitorTransactions = useMemo(() => {
    let tx = filterTransactionsByDateRange(
      detailedTransactions,
      appliedBehaviorConfig.dateRange,
      appliedBehaviorConfig.customRange
    );

    // Day type filter (weekdays/weekends)
    if (
      appliedBehaviorConfig.dayType &&
      appliedBehaviorConfig.dayType !== "all"
    ) {
      tx = tx.filter((t) => {
        const d = t.Purchase_Date ? new Date(t.Purchase_Date) : null;
        if (!d) return false;
        const day = d.getDay();
        if (appliedBehaviorConfig.dayType === "weekdays")
          return day >= 1 && day <= 5;
        if (appliedBehaviorConfig.dayType === "weekends")
          return day === 0 || day === 6;
        return true;
      });
    }

    // Visitor type: use membership table to decide membership at purchase time
    if (
      appliedBehaviorConfig.visitorType &&
      appliedBehaviorConfig.visitorType !== "all"
    ) {
      tx = tx.filter((t) => {
        const cat = (t.Category || "").toLowerCase();
        const desc = (t.Item_Description || "").toLowerCase();
        const cid = t.Customer_ID;
        const pDate = t.Purchase_Date ? new Date(t.Purchase_Date) : null;

        if (appliedBehaviorConfig.visitorType === "daypass") {
          if (cat.includes("membership") || desc.includes("annual"))
            return false;
          return !isMemberAt(cid, pDate);
        }

        if (appliedBehaviorConfig.visitorType === "members") {
          if (cat.includes("membership") || desc.includes("annual"))
            return true;
          if (!pDate) return false;
          return isMemberAt(cid, pDate);
        }

        return true;
      });
    }

    // Time of day filter: if a time slice is selected, only include transactions in that hour range
    const tod = appliedBehaviorConfig.timeOfDay || "all";
    if (tod && tod !== "all") {
      let startHour = 9;
      let endHour = 18;
      if (tod === "morning") {
        startHour = 9;
        endHour = 12;
      } else if (tod === "afternoon") {
        startHour = 12;
        endHour = 17;
      } else if (tod === "evening") {
        startHour = 17;
        endHour = 23;
      }
      tx = tx.filter((t) => {
        if (!t.Purchase_Date) return false;
        const h = new Date(t.Purchase_Date).getHours();
        return h >= startHour && h <= endHour;
      });
    }

    return tx;
  }, [
    detailedTransactions,
    appliedBehaviorConfig.dateRange,
    appliedBehaviorConfig.customRange,
    appliedBehaviorConfig.dayType,
    appliedBehaviorConfig.visitorType,
    appliedBehaviorConfig.timeOfDay,
  ]);

  const behaviorKPIs = useMemo(() => {
    // Build per-customer-per-date groups from visitorTransactions
    // Each group collects ticket quantities and whether non-ticket items were bought
    const groups = new Map();
    visitorTransactions.forEach((t) => {
      const date = new Date(t.Purchase_Date).toLocaleDateString();
      const customerId = t.Customer_ID;
      const key = `${date}-${customerId}`;
      if (!groups.has(key)) {
        groups.set(key, {
          date,
          customerId,
          ticketQty: 0,
          hasNonTicket: false,
          hasMembershipTxToday: false,
          hasNonMembershipNonTicket: false,
        });
      }
      const g = groups.get(key);
      const cat = (t.Category || "").toLowerCase();
      const desc = (t.Item_Description || "").toLowerCase();
      const isTicket = cat.includes("ticket");
      const isMembershipTx =
        cat.includes("membership") || desc.includes("annual");
      const qty = parseInt(t.Quantity) || 1;
      if (isTicket) {
        g.ticketQty = (g.ticketQty || 0) + qty;
      } else {
        g.hasNonTicket = true;
        if (isMembershipTx) {
          g.hasMembershipTxToday = true;
        } else {
          g.hasNonMembershipNonTicket = true;
        }
      }
    });

    // Now compute ticketVisitors and memberVisitors according to the rules:
    // - If account is a member on that date (membership table covers date OR they bought membership that day):
    //     * tickets count by quantity
    //     * if they bought any other non-ticket items that day, add +1 visitor
    //     * if they bought only non-ticket items (no tickets), count 1 visitor
    // - If not a member on that date:
    //     * only tickets count (by quantity); non-ticket-only purchases do NOT count
    let ticketVisitors = 0;
    let memberVisitors = 0; // unique member visitors (per-day)

    for (const [key, g] of groups.entries()) {
      const {
        date,
        customerId,
        ticketQty = 0,
        hasNonTicket,
        hasMembershipTxToday,
        hasNonMembershipNonTicket,
      } = g;

      // Normalize tx date to date-only
      const dateObj = new Date(date);
      const txDateOnly = new Date(
        dateObj.getFullYear(),
        dateObj.getMonth(),
        dateObj.getDate()
      );

      let isMemberFromTable = false;
      let wasActiveYesterday = false;
      if (
        customerId != null &&
        Array.isArray(memberships) &&
        memberships.length > 0
      ) {
        // check if membership covers tx date
        isMemberFromTable = memberships.some((m) => {
          if (m.Customer_ID == null) return false;
          if (String(m.Customer_ID) !== String(customerId)) return false;
          if ((m.Membership_Status || "").toLowerCase() !== "active")
            return false;
          const start = m.Start_Date ? new Date(m.Start_Date) : null;
          const end = m.End_Date ? new Date(m.End_Date) : null;
          const startDateOnly = start
            ? new Date(start.getFullYear(), start.getMonth(), start.getDate())
            : null;
          const endDateOnly = end
            ? new Date(end.getFullYear(), end.getMonth(), end.getDate())
            : null;
          if (startDateOnly && txDateOnly < startDateOnly) return false;
          if (endDateOnly && txDateOnly > endDateOnly) return false;
          return true;
        });

        // check if they were active the day before (to detect extensions)
        const yesterday = new Date(txDateOnly);
        yesterday.setDate(yesterday.getDate() - 1);
        wasActiveYesterday = memberships.some((m) => {
          if (m.Customer_ID == null) return false;
          if (String(m.Customer_ID) !== String(customerId)) return false;
          if ((m.Membership_Status || "").toLowerCase() !== "active")
            return false;
          const start = m.Start_Date ? new Date(m.Start_Date) : null;
          const end = m.End_Date ? new Date(m.End_Date) : null;
          const startDateOnly = start
            ? new Date(start.getFullYear(), start.getMonth(), start.getDate())
            : null;
          const endDateOnly = end
            ? new Date(end.getFullYear(), end.getMonth(), end.getDate())
            : null;
          if (startDateOnly && yesterday < startDateOnly) return false;
          if (endDateOnly && yesterday > endDateOnly) return false;
          return true;
        });
      }

      // Determine membership status for counting
      let isMember = false;
      let isNewMemberToday = false;
      if (isMemberFromTable) {
        isMember = true;
      } else if (hasMembershipTxToday) {
        // no membership in table but bought membership today -> treat as new member for that day
        isMember = true;
        isNewMemberToday = true;
      }

      if (isMember) {
        // tickets always count by quantity
        ticketVisitors += ticketQty;

        // Decide whether to add the unique member visitor for non-ticket activity:
        // - If they bought any non-membership non-ticket items that day -> count 1
        // - Else if they bought no tickets and they are a NEW member today -> count 1
        // - Else if they were already active before today and only bought a membership (extension) -> do NOT count
        if (hasNonMembershipNonTicket) {
          memberVisitors += 1;
        } else if (ticketQty === 0 && isNewMemberToday) {
          memberVisitors += 1;
        }
      } else {
        // non-members: only tickets count
        ticketVisitors += ticketQty;
      }
    }

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

    // Find peak hour based on all transaction activity using filteredBehaviorTransactions
    const hourCounts = new Map();
    filteredBehaviorTransactions.forEach((t) => {
      if (t.Purchase_Date) {
        const hour = new Date(t.Purchase_Date).getHours();
        // Count each transaction (not quantities) to show actual activity/traffic
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
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
    const topProductCategory = topCategoryEntry ? topCategoryEntry[0] : "N/A";

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
  }, [filteredBehaviorTransactions, visitorTransactions, memberships]);
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
      endHour = 12;
    } else if (tod === "afternoon") {
      startHour = 12;
      endHour = 17;
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

    // Helper to extract display name from catalog items
    const extractName = (it) => {
      if (!it) return "Unknown";
      return (
        it.Item_Name ||
        it.Concession_Item_Name ||
        it.name ||
        it.item_name ||
        it.Name ||
        "Unknown"
      );
    };

    // Seed productSales with catalog items so products with zero sales appear
    if (Array.isArray(items)) {
      items.forEach((it) => {
        const raw = extractName(it) || "Unknown";
        const cleaned = raw.replace(/\s*\([^)]*\)\s*$/, "");
        const key = cleaned || "Unknown";
        if (!productSales.has(key)) {
          productSales.set(key, {
            product: key,
            // track a set of Purchase_IDs so we can compute distinct orders
            ordersSet: new Set(),
            quantity: 0,
            revenue: 0,
          });
        }
      });
    }
    if (Array.isArray(concessionItems)) {
      concessionItems.forEach((it) => {
        const raw = extractName(it) || "Unknown";
        const cleaned = raw.replace(/\s*\([^)]*\)\s*$/, "");
        const key = cleaned || "Unknown";
        if (!productSales.has(key)) {
          productSales.set(key, {
            product: key,
            ordersSet: new Set(),
            quantity: 0,
            revenue: 0,
          });
        }
      });
    }

    // Aggregate from transactions, merging into seeded catalog entries when possible
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
          ordersSet: new Set(),
          quantity: 0,
          revenue: 0,
        });
      }
      const data = productSales.get(key);
      // Record the purchase id for distinct orders counting
      const purchaseId = t.Purchase_ID ?? t.PurchaseId ?? t.PurchaseId;
      if (purchaseId != null) data.ordersSet.add(String(purchaseId));
      data.quantity += parseInt(t.Quantity) || 1;
      data.revenue += parseFloat(t.Total_Amount) || 0;
    });

    // Convert ordersSet to numeric `orders` and remove internal sets
    const out = Array.from(productSales.values()).map((v) => ({
      product: v.product,
      orders: v.ordersSet ? v.ordersSet.size : 0,
      quantity: v.quantity || 0,
      revenue: v.revenue || 0,
    }));

    return out
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, appliedBehaviorConfig.topNProducts);
  }, [
    filteredBehaviorTransactions,
    appliedBehaviorConfig.topNProducts,
    items,
    concessionItems,
  ]);

  // Number of unique available products (excluding tickets/memberships) so the UI can
  // clamp the user-entered top-N value
  const availableProductCount = useMemo(() => {
    const set = new Set();

    // Seed from catalog
    const extractName = (it) => {
      if (!it) return "Unknown";
      return (
        it.Item_Name ||
        it.Concession_Item_Name ||
        it.name ||
        it.item_name ||
        it.Name ||
        "Unknown"
      );
    };
    if (Array.isArray(items)) {
      items.forEach((it) => {
        const cleaned = (extractName(it) || "Unknown").replace(
          /\s*\([^)]*\)\s*$/,
          ""
        );
        set.add(cleaned || "Unknown");
      });
    }
    if (Array.isArray(concessionItems)) {
      concessionItems.forEach((it) => {
        const cleaned = (extractName(it) || "Unknown").replace(
          /\s*\([^)]*\)\s*$/,
          ""
        );
        set.add(cleaned || "Unknown");
      });
    }

    // Also include any sold products found in transactions
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
  }, [filteredBehaviorTransactions, items, concessionItems]);

  // Keep configured topNProducts within bounds when availableProductCount changes
  useEffect(() => {
    // Avoid clamping when availableProductCount is unknown/0 on initial load.
    if (!availableProductCount || availableProductCount <= 0) return;

    const max = Math.max(1, availableProductCount);
    setBehaviorConfig((b) => {
      const current = parseInt(b.topNProducts, 10);
      const defaultTop =
        typeof initialBehaviorConfig.topNProducts === "number"
          ? initialBehaviorConfig.topNProducts
          : parseInt(initialBehaviorConfig.topNProducts, 10) || 1;
      let next;
      if (Number.isNaN(current)) {
        next = Math.min(defaultTop, max);
      } else {
        next = Math.max(1, Math.min(current, max));
      }
      if (String(b.topNProducts) === String(next)) return b;
      return { ...b, topNProducts: next };
    });
  }, [availableProductCount]);

  // Ensure revenueConfig.topN remains in valid bounds when availableDaysCount changes
  useEffect(() => {
    // If we don't yet know how many days are available (e.g. initial load),
    // avoid clamping to 0 and preserve the configured default (usually 6).
    if (!availableDaysCount || availableDaysCount <= 0) return;

    const max = Math.max(1, availableDaysCount);
    setRevenueConfig((r) => {
      const current = parseInt(r.topN, 10);
      const defaultTop =
        typeof initialRevenueConfig.topN === "number"
          ? initialRevenueConfig.topN
          : parseInt(initialRevenueConfig.topN, 10) || 1;
      let next;
      if (Number.isNaN(current)) {
        // use the default topN but don't exceed available days
        next = Math.min(defaultTop, max);
      } else {
        next = Math.max(1, Math.min(current, max));
      }
      if (String(r.topN) === String(next)) return r;
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
                          <p style={{ fontSize: "0.875rem" }}>Total Revenue</p>
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
                          <p style={{ fontSize: "0.875rem" }}>
                            Total Transactions
                          </p>
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
                  {revenueTrendData.length === 0 ? (
                    <EmptyState message="No revenue data available" />
                  ) : (
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
                  )}
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
                    {revenueBySource.length === 0 ? (
                      <EmptyState message="No revenue sources available" />
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <defs>
                              {revenueBySource.map((entry, i) => {
                                const c =
                                  entry.fill ||
                                  PIE_COLORS[i % PIE_COLORS.length];
                                return (
                                  <linearGradient
                                    key={`pg-${i}`}
                                    id={`pieGrad${i}`}
                                    x1="0%"
                                    x2="100%"
                                    y1="0%"
                                    y2="100%"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor={c}
                                      stopOpacity="1"
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor={c}
                                      stopOpacity="1"
                                    />
                                  </linearGradient>
                                );
                              })}
                            </defs>
                            <Pie
                              data={revenueBySource}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={(entry) => {
                                const total = revenueSourceTotal || 0;
                                const pct =
                                  total > 0 ? (entry.value / total) * 100 : 0;
                                return `${entry.name}: ${pct.toFixed(1)}%`;
                              }}
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
                              style={{
                                fontSize: 16,
                                fontWeight: 700,
                                fill: "red",
                              }}
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
                                style={{
                                  fontSize: "0.85rem",
                                  color: "#374151",
                                }}
                              >
                                {entry.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
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
                    {topRevenueDays.length === 0 ? (
                      <EmptyState message="No revenue days available" />
                    ) : (
                      (() => {
                        const maxLabelsToShow = 6;
                        const showXAxisLabels =
                          topRevenueDays.length <= maxLabelsToShow;
                        const chartHeight = showXAxisLabels ? 300 : 380;
                        const xAxisHeight = showXAxisLabels ? 80 : 6;

                        return (
                          <ResponsiveContainer
                            width="100%"
                            height={chartHeight}
                          >
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
                      })()
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Breakdown Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
                <DollarSign className="h-6 w-6" /> Revenue Breakdown
              </CardTitle>
              <CardDescription>
                Revenue totals based on current filters
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    category: "Tickets",
                    amount: filteredRevenueBreakdown.ticketRevenue,
                    color: "bg-green-600",
                    icon: Ticket,
                  },
                  {
                    category: "Memberships",
                    amount: filteredRevenueBreakdown.membershipRevenue,
                    color: "bg-purple-600",
                    icon: Crown,
                  },
                  {
                    category: "Gift Shop",
                    amount: filteredRevenueBreakdown.giftShopRevenue,
                    color: "bg-blue-600",
                    icon: Package,
                  },
                  {
                    category: "Food & Beverages",
                    amount: filteredRevenueBreakdown.foodRevenue,
                    color: "bg-orange-600",
                    icon: Coffee,
                  },
                ].map((stat) => {
                  const IconComponent = stat.icon;
                  return (
                    <div
                      key={stat.category}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="flex items-center justify-center mb-2">
                          <IconComponent
                            className={`h-10 w-10 ${stat.color.replace(
                              "bg-",
                              "text-"
                            )}`}
                          />
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">{stat.category}</h3>
                          <p className="text-lg font-semibold text-green-600">
                            $
                            {stat.amount.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Transaction Details Table */}
          <Card id="revenue-transactions">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
                  <Activity className="h-6 w-6" /> Transaction Details
                </CardTitle>
                <div className="flex items-center gap-4">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        All
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64" align="end">
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm mb-3">
                          Toggle Columns
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 pb-2 border-b">
                            <Checkbox
                              id="col-all"
                              checked={Object.values(visibleColumns).every(
                                (v) => v
                              )}
                              onCheckedChange={() => toggleColumn("all")}
                            />
                            <label
                              htmlFor="col-all"
                              className="text-sm font-medium cursor-pointer"
                            >
                              All
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="col-purchaseId"
                              checked={visibleColumns.purchaseId}
                              onCheckedChange={() => toggleColumn("purchaseId")}
                            />
                            <label
                              htmlFor="col-purchaseId"
                              className="text-sm cursor-pointer"
                            >
                              Purchase ID
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="col-dateTime"
                              checked={visibleColumns.dateTime}
                              onCheckedChange={() => toggleColumn("dateTime")}
                            />
                            <label
                              htmlFor="col-dateTime"
                              className="text-sm cursor-pointer"
                            >
                              Date & Time
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="col-customer"
                              checked={visibleColumns.customer}
                              onCheckedChange={() => toggleColumn("customer")}
                            />
                            <label
                              htmlFor="col-customer"
                              className="text-sm cursor-pointer"
                            >
                              Customer
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="col-category"
                              checked={visibleColumns.category}
                              onCheckedChange={() => toggleColumn("category")}
                            />
                            <label
                              htmlFor="col-category"
                              className="text-sm cursor-pointer"
                            >
                              Category
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="col-description"
                              checked={visibleColumns.description}
                              onCheckedChange={() =>
                                toggleColumn("description")
                              }
                            />
                            <label
                              htmlFor="col-description"
                              className="text-sm cursor-pointer"
                            >
                              Description
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="col-quantity"
                              checked={visibleColumns.quantity}
                              onCheckedChange={() => toggleColumn("quantity")}
                            />
                            <label
                              htmlFor="col-quantity"
                              className="text-sm cursor-pointer"
                            >
                              Quantity
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="col-unitPrice"
                              checked={visibleColumns.unitPrice}
                              onCheckedChange={() => toggleColumn("unitPrice")}
                            />
                            <label
                              htmlFor="col-unitPrice"
                              className="text-sm cursor-pointer"
                            >
                              Unit Price
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="col-total"
                              checked={visibleColumns.total}
                              onCheckedChange={() => toggleColumn("total")}
                            />
                            <label
                              htmlFor="col-total"
                              className="text-sm cursor-pointer"
                            >
                              Total
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="col-payment"
                              checked={visibleColumns.payment}
                              onCheckedChange={() => toggleColumn("payment")}
                            />
                            <label
                              htmlFor="col-payment"
                              className="text-sm cursor-pointer"
                            >
                              Payment
                            </label>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by customer name..."
                      value={transactionSearch}
                      onChange={(e) => setTransactionSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div
                className="w-full rounded-md border"
                style={{
                  overflowX: "auto",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                <div className="min-w-0">
                  <Table
                    className="min-w-[900px] table-auto"
                    style={{ minWidth: "900px", whiteSpace: "nowrap" }}
                  >
                    <TableHeader className="bg-gray-100">
                      <TableRow>
                        {visibleColumns.purchaseId && (
                          <TableHead
                            className="w-[100px] cursor-pointer select-none hover:bg-gray-50"
                            onClick={() => toggleTransactionSort("Purchase_ID")}
                          >
                            Purchase ID
                            {transactionSortState.col === "Purchase_ID" && (
                              <span className="ml-1 text-xs">
                                {transactionSortState.dir === "asc" ? "▲" : "▼"}
                              </span>
                            )}
                          </TableHead>
                        )}
                        {visibleColumns.dateTime && (
                          <TableHead
                            className="cursor-pointer select-none hover:bg-gray-50"
                            onClick={() =>
                              toggleTransactionSort("Purchase_Date")
                            }
                          >
                            Date & Time
                            {transactionSortState.col === "Purchase_Date" && (
                              <span className="ml-1 text-xs">
                                {transactionSortState.dir === "asc" ? "▲" : "▼"}
                              </span>
                            )}
                          </TableHead>
                        )}
                        {visibleColumns.customer && (
                          <TableHead
                            className="cursor-pointer select-none hover:bg-gray-50"
                            onClick={() =>
                              toggleTransactionSort("Customer_Name")
                            }
                          >
                            Customer
                            {transactionSortState.col === "Customer_Name" && (
                              <span className="ml-1 text-xs">
                                {transactionSortState.dir === "asc" ? "▲" : "▼"}
                              </span>
                            )}
                          </TableHead>
                        )}
                        {visibleColumns.category && (
                          <TableHead
                            className="cursor-pointer select-none hover:bg-gray-50"
                            onClick={() => toggleTransactionSort("Category")}
                          >
                            Category
                            {transactionSortState.col === "Category" && (
                              <span className="ml-1 text-xs">
                                {transactionSortState.dir === "asc" ? "▲" : "▼"}
                              </span>
                            )}
                          </TableHead>
                        )}
                        {visibleColumns.description && (
                          <TableHead
                            className="cursor-pointer select-none hover:bg-gray-50"
                            onClick={() =>
                              toggleTransactionSort("Item_Description")
                            }
                          >
                            Description
                            {transactionSortState.col ===
                              "Item_Description" && (
                              <span className="ml-1 text-xs">
                                {transactionSortState.dir === "asc" ? "▲" : "▼"}
                              </span>
                            )}
                          </TableHead>
                        )}
                        {visibleColumns.quantity && (
                          <TableHead
                            className="text-center cursor-pointer select-none hover:bg-gray-50"
                            onClick={() => toggleTransactionSort("Quantity")}
                          >
                            Quantity
                            {transactionSortState.col === "Quantity" && (
                              <span className="ml-1 text-xs">
                                {transactionSortState.dir === "asc" ? "▲" : "▼"}
                              </span>
                            )}
                          </TableHead>
                        )}
                        {visibleColumns.unitPrice && (
                          <TableHead
                            className="text-right cursor-pointer select-none hover:bg-gray-50"
                            onClick={() => toggleTransactionSort("Unit_Price")}
                          >
                            Unit Price
                            {transactionSortState.col === "Unit_Price" && (
                              <span className="ml-1 text-xs">
                                {transactionSortState.dir === "asc" ? "▲" : "▼"}
                              </span>
                            )}
                          </TableHead>
                        )}
                        {visibleColumns.total && (
                          <TableHead
                            className="text-right cursor-pointer select-none hover:bg-gray-50"
                            onClick={() =>
                              toggleTransactionSort("Total_Amount")
                            }
                          >
                            Total
                            {transactionSortState.col === "Total_Amount" && (
                              <span className="ml-1 text-xs">
                                {transactionSortState.dir === "asc" ? "▲" : "▼"}
                              </span>
                            )}
                          </TableHead>
                        )}
                        {visibleColumns.payment && (
                          <TableHead
                            className="cursor-pointer select-none hover:bg-gray-50"
                            onClick={() =>
                              toggleTransactionSort("Payment_Method")
                            }
                          >
                            Payment
                            {transactionSortState.col === "Payment_Method" && (
                              <span className="ml-1 text-xs">
                                {transactionSortState.dir === "asc" ? "▲" : "▼"}
                              </span>
                            )}
                          </TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedTransactions.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={
                              Object.values(visibleColumns).filter(Boolean)
                                .length
                            }
                            className="text-center py-8 text-gray-500"
                          >
                            No transactions found for the selected filters
                          </TableCell>
                        </TableRow>
                      ) : (
                        displayedTransactions.map((transaction, index) => (
                          <TableRow key={`${transaction.Purchase_ID}-${index}`}>
                            {visibleColumns.purchaseId && (
                              <TableCell className="font-medium">
                                #{transaction.Purchase_ID}
                              </TableCell>
                            )}
                            {visibleColumns.dateTime && (
                              <TableCell className="whitespace-nowrap">
                                {new Date(
                                  transaction.Purchase_Date
                                ).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </TableCell>
                            )}
                            {visibleColumns.customer && (
                              <TableCell className="whitespace-nowrap">
                                {transaction.Customer_Name}
                              </TableCell>
                            )}
                            {visibleColumns.category && (
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={
                                    transaction.Category === "Ticket"
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : transaction.Category === "Membership"
                                      ? "bg-purple-50 text-purple-700 border-purple-200"
                                      : transaction.Category === "Gift Shop"
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : ""
                                  }
                                  style={
                                    transaction.Category !== "Ticket" &&
                                    transaction.Category !== "Membership" &&
                                    transaction.Category !== "Gift Shop"
                                      ? {
                                          backgroundColor: "#FFF7ED",
                                          color: "#C2410C",
                                          border: "1px solid #FED7AA",
                                        }
                                      : {}
                                  }
                                >
                                  {transaction.Category}
                                </Badge>
                              </TableCell>
                            )}
                            {visibleColumns.description && (
                              <TableCell>
                                {transaction.Item_Description
                                  ? transaction.Item_Description.replace(
                                      /\s*\([^)]*\)\s*$/,
                                      ""
                                    )
                                  : ""}
                              </TableCell>
                            )}
                            {visibleColumns.quantity && (
                              <TableCell className="text-center">
                                {transaction.Quantity}
                              </TableCell>
                            )}
                            {visibleColumns.unitPrice && (
                              <TableCell className="text-right whitespace-nowrap">
                                ${parseFloat(transaction.Unit_Price).toFixed(2)}
                              </TableCell>
                            )}
                            {visibleColumns.total && (
                              <TableCell className="text-right font-semibold text-green-600 whitespace-nowrap">
                                $
                                {parseFloat(transaction.Total_Amount).toFixed(
                                  2
                                )}
                              </TableCell>
                            )}
                            {visibleColumns.payment && (
                              <TableCell>
                                <Badge variant="secondary">
                                  {transaction.Payment_Method}
                                </Badge>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <span>
                  Showing{" "}
                  {filteredTransactions.length > 0
                    ? (transactionCurrentPage - 1) * transactionItemsPerPage + 1
                    : 0}
                  -
                  {Math.min(
                    transactionCurrentPage * transactionItemsPerPage,
                    filteredTransactions.length
                  )}{" "}
                  of {filteredTransactions.length} transaction
                  {filteredTransactions.length !== 1 ? "s" : ""}
                </span>
                <span className="font-semibold">
                  Total Revenue:{" "}
                  <span className="text-red-600">
                    $
                    {filteredTransactions
                      .reduce(
                        (sum, t) => sum + parseFloat(t.Total_Amount || 0),
                        0
                      )
                      .toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                  </span>
                </span>
              </div>
              <PaginationControls
                currentPage={transactionCurrentPage}
                totalPages={transactionTotalPages}
                onPageChange={handleTransactionPageChange}
                paginationArray={transactionPaginationArray}
                className="mt-4"
              />
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
                <HoverTooltip content="Total visitors (attendance). Respects date, day type, time slice and visitor type.">
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
                    style={{
                      borderLeft: `4px solid ${
                        /food/i.test(behaviorKPIs.topProductCategory)
                          ? COLORS.food
                          : "#9333ea"
                      }`,
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
                        {behaviorKPIs.topProductCategory &&
                        /food/i.test(behaviorKPIs.topProductCategory) ? (
                          <Coffee
                            style={{
                              height: "2rem",
                              width: "2rem",
                              color: COLORS.food,
                            }}
                          />
                        ) : (
                          <Package
                            style={{
                              height: "2rem",
                              width: "2rem",
                              color: "#9333ea",
                            }}
                          />
                        )}
                        <div>
                          <p style={{ fontSize: "0.875rem" }}>
                            Top Product Category
                          </p>
                          <p
                            style={{
                              fontSize: "1.5rem",
                              fontWeight: 600,
                              color: /food/i.test(
                                behaviorKPIs.topProductCategory
                              )
                                ? COLORS.food
                                : "#9333ea",
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
                  {
                    // Consider the chart empty when there are no points or all transaction counts are zero
                    trafficByHour.length === 0 ||
                    trafficByHour.every(
                      (pt) => !pt || !pt.transactions || pt.transactions === 0
                    ) ? (
                      <EmptyState message="No traffic data available" />
                    ) : (
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
                    )
                  }
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
                    {topProducts.length === 0 ? (
                      <EmptyState message="No product sales available" />
                    ) : (
                      (() => {
                        const maxLabelsToShow = 10;
                        const showXAxisLabels =
                          topProducts.length <= maxLabelsToShow;
                        const chartHeight = showXAxisLabels ? 300 : 380;
                        const xAxisHeight = showXAxisLabels ? 80 : 6; // minimal reserved height when labels hidden

                        return (
                          <ResponsiveContainer
                            width="100%"
                            height={chartHeight}
                          >
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
                                tickFormatter={(val) => val.toLocaleString()}
                                label={{
                                  value: "# Sold",
                                  angle: -90,
                                  position: "insideLeft",
                                  offset: 0,
                                }}
                              />
                              <Tooltip
                                formatter={(value) =>
                                  `${value.toLocaleString("en-US")} sold`
                                }
                              />
                              <Bar
                                dataKey="quantity"
                                fill="url(#prodBarGrad)"
                                radius={[6, 6, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        );
                      })()
                    )}
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
                    {ticketsByType.length === 0 ? (
                      <EmptyState message="No ticket data available" />
                    ) : (
                      <>
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
                                style={{
                                  fontSize: "0.85rem",
                                  color: "#374151",
                                }}
                              >
                                {entry.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
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
                    const ROW_LIMIT = 10;
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
                                  <HoverTooltip
                                    content={
                                      "Product name from catalog or transaction description"
                                    }
                                  >
                                    <>
                                      Product
                                      {productSort.column === "product" && (
                                        <span>
                                          {productSort.direction === "asc"
                                            ? "▲"
                                            : "▼"}
                                        </span>
                                      )}
                                    </>
                                  </HoverTooltip>
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
                                      column: "orders",
                                      direction:
                                        p.column === "orders" &&
                                        p.direction === "asc"
                                          ? "desc"
                                          : "asc",
                                    }));
                                  }}
                                >
                                  <HoverTooltip
                                    content={
                                      "Number of distinct purchases containing this item (orders), not units"
                                    }
                                  >
                                    <>
                                      Orders
                                      {productSort.column === "orders" && (
                                        <span>
                                          {productSort.direction === "asc"
                                            ? "▲"
                                            : "▼"}
                                        </span>
                                      )}
                                    </>
                                  </HoverTooltip>
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
                                  <HoverTooltip
                                    content={
                                      "Total units sold (sum of Quantity across all orders)"
                                    }
                                  >
                                    <>
                                      Quantity Sold
                                      {productSort.column === "quantity" && (
                                        <span>
                                          {productSort.direction === "asc"
                                            ? "▲"
                                            : "▼"}
                                        </span>
                                      )}
                                    </>
                                  </HoverTooltip>
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
                                  <HoverTooltip
                                    content={
                                      "Total revenue from this product (sum of Quantity * Unit_Price)"
                                    }
                                  >
                                    <>
                                      Revenue
                                      {productSort.column === "revenue" && (
                                        <span>
                                          {productSort.direction === "asc"
                                            ? "▲"
                                            : "▼"}
                                        </span>
                                      )}
                                    </>
                                  </HoverTooltip>
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
                                  <HoverTooltip
                                    content={
                                      "Average price per unit (Revenue / Quantity)"
                                    }
                                  >
                                    <>
                                      Avg Price
                                      {productSort.column === "avgPrice" && (
                                        <span>
                                          {productSort.direction === "asc"
                                            ? "▲"
                                            : "▼"}
                                        </span>
                                      )}
                                    </>
                                  </HoverTooltip>
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
                                  {product.orders}
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
