import { useState, useMemo, useEffect } from "react";
import { usePageTitle } from "../hooks/usePageTitle";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  BarChart,
  Bar,
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
  LogOut,
  DollarSign,
  Users,
  Package,
  Coffee,
  Ticket,
  Crown,
  UserPlus,
  Trash2,
  Calendar,
  Eye,
  Edit,
  Search,
  Save,
  Home,
  Plus,
  PawPrint,
  X,
  BarChart3,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Map,
  Building2,
  Filter,
  AlertCircle,
  Activity,
  Receipt,
  CheckCircle2,
  Settings,
} from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "../components/ui/popover";

import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useData } from "../data/DataContext";
import { toast } from "sonner";
import { ZooLogo } from "../components/ZooLogo";
import LoadingWithIcon from "../components/ui/LoadingWithIcon";
import { EditExhibitDialog } from "../components/ExhibitDialogs";
import { PaginationControls } from "../components/PaginationControls";
import { generatePaginationArray } from "../utils/paginationHelper";
import { usePricing } from "../data/PricingContext";
import { Reports } from "../components/admin-components/Reports";
import { Assets } from "../components/admin-components/Assets";
import { Operations } from "../components/admin-components/Operations";
import {
  employeeAPI,
  locationAPI,
  exhibitAPI,
  animalAPI,
  analyticsAPI,
  referenceAPI,
  transactionAPI,
  pricingAPI,
  getDateRange,
} from "../services/adminAPI";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export function AdminPortal({ user, onLogout }) {
  const {
    animals,
    addAnimal,
    updateAnimal,
    deleteAnimal,
    items,
    concessionItems,
    purchases,
    tickets,
    purchaseItems,
    purchaseConcessionItems,
    memberships,
  } = useData();
  const {
    ticketPrices,
    membershipPrice,
    updateTicketPrices,
    updateMembershipPrice,
  } = usePricing();
  const [allEmployees, setAllEmployees] = useState([]);
  const [allLocations, setAllLocations] = useState([]);
  const [allExhibitsDB, setAllExhibitsDB] = useState([]);
  const [allAnimalsDB, setAllAnimalsDB] = useState([]);
  const [allJobTitles, setAllJobTitles] = useState([]);
  const [allEnclosures, setAllEnclosures] = useState([]);
  const [allMemberships, setAllMemberships] = useState([]);
  const [revenueData, setRevenueData] = useState(null);
  const [detailedTransactions, setDetailedTransactions] = useState([]);
  const [allTimeTransactions, setAllTimeTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isManageZoneOpen, setIsManageZoneOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [deleteConfirmEmployee, setDeleteConfirmEmployee] = useState(null);
  const [pendingSupervisor, setPendingSupervisor] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [revenueRange, setRevenueRange] = useState("today");
  const [customRange, setCustomRange] = useState({ from: null, to: null });
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [prevCustomRange, setPrevCustomRange] = useState(null);
  const canApply = useMemo(() => {
    if (!customRange || !customRange.from || !customRange.to) return false;
    try {
      return customRange.to.getTime() !== customRange.from.getTime();
    } catch (e) {
      return false;
    }
  }, [customRange]);
  // Today's date (zeroed to midnight) — used to prevent selecting future end dates
  const todayOnly = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const [viewZoneEmployees, setViewZoneEmployees] = useState(null);
  const [isSalaryManagementOpen, setIsSalaryManagementOpen] = useState(false);
  const [supervisorSearch, setSupervisorSearch] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [editingExhibit, setEditingExhibit] = useState(null);
  const [isAddAnimalOpen, setIsAddAnimalOpen] = useState(false);
  const [deleteConfirmAnimal, setDeleteConfirmAnimal] = useState(null);
  const [editingAnimal, setEditingAnimal] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const allowedAdminTabs = ["overview", "operations", "assets", "reports"];
  const [activeTab, setActiveTab] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(location.search);
        const tab = params.get("tab");
        if (tab && allowedAdminTabs.includes(tab)) return tab;
        return localStorage.getItem("admin.activeTab") || "overview";
      }
    } catch (e) {
      // ignore
    }
    return "overview";
  });

  // Persist active tab and include tab in the page title
  const adminTabLabels = {
    overview: "Overview",
    operations: "Operations",
    assets: "Assets",
    reports: "Reports",
  };
  const adminBaseTitle = "Admin Portal";
  const adminPageTitle = adminTabLabels[activeTab]
    ? `${adminBaseTitle} - ${adminTabLabels[activeTab]}`
    : adminBaseTitle;
  usePageTitle(adminPageTitle);
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("admin.activeTab", activeTab);
      }
    } catch (e) {
      // ignore
    }
  }, [activeTab]);

  // Keep URL in sync with tab selection
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      if (params.get("tab") !== activeTab) {
        params.set("tab", activeTab);
        navigate(`${location.pathname}?${params.toString()}`, {
          replace: true,
        });
      }
    } catch (e) {
      // ignore
    }
  }, [activeTab, navigate, location]);

  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [selectedExhibitForActivities, setSelectedExhibitForActivities] =
    useState(null);
  const [exhibitActivities, setExhibitActivities] = useState([]);

  const handleSetActiveTab = (tab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined" && window.scrollTo) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const [healthZoneFilter, setHealthZoneFilter] = useState("None");
  const [healthEnclosureFilter, setHealthEnclosureFilter] = useState("None");
  const [genderFilter, setGenderFilter] = useState("None");
  const [ageFilter, setAgeFilter] = useState("None");

  const enclosureMap = useMemo(() => {
    const m = {};
    (allEnclosures || []).forEach((e) => {
      if (e && typeof e.Enclosure_ID !== "undefined") m[e.Enclosure_ID] = e;
    });
    return m;
  }, [allEnclosures]);
  const [animalExhibitFilter, setAnimalExhibitFilter] = useState("");
  const [animalSearch, setAnimalSearch] = useState("");

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

  const [animalVisibleColumns, setAnimalVisibleColumns] = useState({
    animalId: true,
    name: true,
    species: true,
    age: true,
    gender: true,
    enclosure: true,
    healthStatus: true,
    weight: true,
  });

  const [staffJobFilter, setStaffJobFilter] = useState("No Selection");

  const toggleColumn = (columnKey) => {
    if (columnKey === "all") {
      const allChecked = Object.values(visibleColumns).every((v) => v);
      const newState = {};
      Object.keys(visibleColumns).forEach((key) => {
        newState[key] = !allChecked;
      });
      setVisibleColumns(newState);
    } else {
      setVisibleColumns((prev) => ({ ...prev, [columnKey]: !prev[columnKey] }));
    }
  };

  const toggleAnimalColumn = (columnKey) => {
    if (columnKey === "all") {
      const allChecked = Object.values(animalVisibleColumns).every((v) => v);
      const newState = {};
      Object.keys(animalVisibleColumns).forEach((key) => {
        newState[key] = !allChecked;
      });
      setAnimalVisibleColumns(newState);
    } else {
      setAnimalVisibleColumns((prev) => ({
        ...prev,
        [columnKey]: !prev[columnKey],
      }));
    }
  };

  const [transactionCurrentPage, setTransactionCurrentPage] = useState(1);
  const [transactionItemsPerPage, setTransactionItemsPerPage] = useState(15);

  const handleTransactionPageChange = (page) => {
    setTransactionCurrentPage(page);
    const transactionsSection = document.getElementById("transactions");
    if (transactionsSection) {
      transactionsSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const [animalCurrentPage, setAnimalCurrentPage] = useState(1);
  const [animalItemsPerPage, setAnimalItemsPerPage] = useState(15);

  const handleAnimalPageChange = (page) => {
    setAnimalCurrentPage(page);
    const animalsSection = document.getElementById("animals-section");
    if (animalsSection && typeof window !== "undefined") {
      try {
        const rect = animalsSection.getBoundingClientRect();
        const extraGap = 100;
        const targetY = window.scrollY + rect.top - extraGap;
        window.scrollTo({ top: targetY, behavior: "smooth" });
        return;
      } catch (e) {}
    }

    const animalTable = document.getElementById("animal-table");
    if (animalTable && typeof animalTable.scrollIntoView === "function") {
      animalTable.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const toggleTransactionSort = (col) => {
    if (transactionSortState.col !== col) {
      setTransactionSortState({ col, dir: "asc" });
    } else if (transactionSortState.dir === "asc") {
      setTransactionSortState({ col, dir: "desc" });
    } else {
      setTransactionSortState({ col: null, dir: null });
    }
  };

  const [animalSortState, setAnimalSortState] = useState({
    col: null,
    dir: null,
  });

  const [healthReportConfig, setHealthReportConfig] = useState({
    showHealthDistribution: true,
    showCriticalAlerts: true,
    showVaccinationStatus: false,
    showWeightTrends: false,
    showAgeDistribution: true,
    showSpeciesBreakdown: true,
  });
  const [healthReportGenerated, setHealthReportGenerated] = useState(false);
  const [isGeneratingHealth, setIsGeneratingHealth] = useState(false);
  const [showHealthTable, setShowHealthTable] = useState(true);
  const [healthChartType, setHealthChartType] = useState("both");

  const [comparisonData, setComparisonData] = useState(null);
  const [isLoadingComparison, setIsLoadingComparison] = useState(false);

  const toggleAnimalSort = (col) => {
    if (animalSortState.col !== col) {
      setAnimalSortState({ col, dir: "asc" });
    } else if (animalSortState.dir === "asc") {
      setAnimalSortState({ col, dir: "desc" });
    } else {
      setAnimalSortState({ col: null, dir: null });
    }
  };

  const [salaries, setSalaries] = useState({
    2: 72000,
    3: 72000,
    4: 45000,
    5: 32000,
    6: 35000,
  });

  const [tempSalaries, setTempSalaries] = useState({ ...salaries });
  const [isTicketPricingOpen, setIsTicketPricingOpen] = useState(false);
  const [isMembershipPricingOpen, setIsMembershipPricingOpen] = useState(false);
  const [selectedTicketType, setSelectedTicketType] = useState(null);
  const [tempTicketPrices, setTempTicketPrices] = useState({ ...ticketPrices });
  const [isTicketContentVisible, setIsTicketContentVisible] = useState(false);
  const [tempMembershipPrice, setTempMembershipPrice] =
    useState(membershipPrice);
  const [isJobSalaryOpen, setIsJobSalaryOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [tempJobSalary, setTempJobSalary] = useState(0);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      loadRevenueData();
    }
  }, [revenueRange]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);

      const [
        locationsData,
        jobTitlesData,
        enclosuresData,
        membershipsData,
        employeesData,
        exhibitsData,
        animalsData,
        allTransactions,
      ] = await Promise.all([
        locationAPI.getAll(),
        referenceAPI.getJobTitles(),
        referenceAPI.getEnclosures(),
        transactionAPI.getMemberships(),
        employeeAPI.getAll(),
        exhibitAPI.getAll(),
        animalAPI.getAll(),
        analyticsAPI.getDetailedTransactions(null, null),
      ]);

      setAllLocations(locationsData);
      setAllJobTitles(jobTitlesData);
      setAllEnclosures(enclosuresData);
      setAllMemberships(membershipsData);
      setAllEmployees(employeesData);
      setAllExhibitsDB(exhibitsData);
      setAllAnimalsDB(animalsData);
      setAllTimeTransactions(allTransactions);

      await loadRevenueData();

      setLastUpdated(new Date());
      toast.success("Dashboard loaded successfully!");
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data from server");
    } finally {
      setIsLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const employeesData = await employeeAPI.getAll();
      setAllEmployees(employeesData);
    } catch (error) {
      console.error("Error loading employees:", error);
      toast.error("Failed to load employees");
    }
  };

  const loadExhibits = async () => {
    try {
      const exhibitsData = await exhibitAPI.getAll();
      setAllExhibitsDB(exhibitsData);
    } catch (error) {
      console.error("Error loading exhibits:", error);
      toast.error("Failed to load exhibits");
    }
  };

  const loadAnimals = async () => {
    try {
      const animalsData = await animalAPI.getAll();
      setAllAnimalsDB(animalsData);
    } catch (error) {
      console.error("Error loading animals:", error);
      toast.error("Failed to load animals");
    }
  };

  const loadAllData = async () => {
    try {
      setIsLoading(true);

      const [
        employeesData,
        locationsData,
        exhibitsData,
        animalsData,
        jobTitlesData,
        enclosuresData,
        membershipsData,
      ] = await Promise.all([
        employeeAPI.getAll(),
        locationAPI.getAll(),
        exhibitAPI.getAll(),
        animalAPI.getAll(),
        referenceAPI.getJobTitles(),
        referenceAPI.getEnclosures(),
        transactionAPI.getMemberships(),
      ]);

      setAllEmployees(employeesData);
      setAllLocations(locationsData);
      setAllExhibitsDB(exhibitsData);
      setAllAnimalsDB(animalsData);
      setAllJobTitles(jobTitlesData);
      setAllEnclosures(enclosuresData);
      setAllMemberships(membershipsData);

      await loadRevenueData();

      setLastUpdated(new Date());
      toast.success("Data loaded successfully!");
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data from server");
    } finally {
      setIsLoading(false);
    }
  };

  const loadRevenueData = async () => {
    try {
      let startDate = null;
      let endDate = null;

      if (revenueRange === "custom" && customRange?.from) {
        startDate = customRange.from.toISOString().split("T")[0];
        endDate = (customRange.to || customRange.from)
          .toISOString()
          .split("T")[0];
      } else {
        const range = getDateRange(revenueRange);
        startDate = range.startDate;
        endDate = range.endDate;
      }

      const [revenue, transactions] = await Promise.all([
        analyticsAPI.getRevenue(startDate, endDate),
        analyticsAPI.getDetailedTransactions(startDate, endDate),
      ]);
      setRevenueData(revenue);
      setDetailedTransactions(transactions);

      // Load comparison data for percentage indicators (all ranges except custom)
      if (revenueRange !== "custom") {
        loadComparisonData(revenueRange);
      } else {
        setComparisonData(null);
      }
    } catch (error) {
      console.error("Error loading revenue data:", error);
      toast.error("Failed to load revenue data");
    }
  };

  const loadComparisonData = async (currentRange) => {
    try {
      setIsLoadingComparison(true);
      const now = new Date();
      let comparisonStartDate, comparisonEndDate;
      const msPerDay = 1000 * 60 * 60 * 24;
      switch (currentRange) {
        case "today": {
          const yesterday = new Date(now);
          yesterday.setHours(0, 0, 0, 0);
          yesterday.setDate(yesterday.getDate() - 1);
          comparisonStartDate = yesterday.toISOString().split("T")[0];
          comparisonEndDate = yesterday.toISOString().split("T")[0];
          try {
            const compTransactions = await analyticsAPI.getDetailedTransactions(
              comparisonStartDate,
              comparisonEndDate
            );

            const compTotals = {
              totalRevenue: 0,
              ticketRevenue: 0,
              membershipRevenue: 0,
              giftShopRevenue: 0,
              foodRevenue: 0,
            };

            (compTransactions || []).forEach((t) => {
              const amt = parseFloat(t.Total_Amount || t.total || 0) || 0;
              compTotals.totalRevenue += amt;
              const cat = (t.Category || "").toLowerCase();
              if (cat.includes("ticket")) compTotals.ticketRevenue += amt;
              else if (cat.includes("membership"))
                compTotals.membershipRevenue += amt;
              else if (cat.includes("gift")) compTotals.giftShopRevenue += amt;
              else if (cat.includes("food") || cat.includes("beverage"))
                compTotals.foodRevenue += amt;
            });

            setComparisonData(compTotals);
          } catch (e) {
            const compRevenue = await analyticsAPI.getRevenue(
              comparisonStartDate,
              comparisonEndDate
            );
            setComparisonData(compRevenue);
          }

          break;
        }
        case "week": {
          const startOfWeek = new Date(now);
          const day = startOfWeek.getDay();
          const diffToMon = (day + 6) % 7; // 0 for Monday, 6 for Sunday
          startOfWeek.setDate(startOfWeek.getDate() - diffToMon);
          startOfWeek.setHours(0, 0, 0, 0);

          const daysElapsed = Math.floor((now - startOfWeek) / msPerDay) + 1;

          const prevStart = new Date(startOfWeek);
          prevStart.setDate(prevStart.getDate() - 7);
          const prevEnd = new Date(prevStart);
          prevEnd.setDate(prevStart.getDate() + daysElapsed - 1);

          comparisonStartDate = prevStart.toISOString().split("T")[0];
          comparisonEndDate = prevEnd.toISOString().split("T")[0];
          break;
        }
        case "month": {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          startOfMonth.setHours(0, 0, 0, 0);
          const daysElapsed = Math.floor((now - startOfMonth) / msPerDay) + 1;

          const prevStart = new Date(startOfMonth);
          prevStart.setMonth(prevStart.getMonth() - 1);
          const prevEnd = new Date(prevStart);
          prevEnd.setDate(prevStart.getDate() + daysElapsed - 1);

          comparisonStartDate = prevStart.toISOString().split("T")[0];
          comparisonEndDate = prevEnd.toISOString().split("T")[0];
          break;
        }
        case "all": {
          // For All Time, compare against the beginning (0 if no data at start)
          // Get the very first transaction date from the database
          // If no transactions exist, comparison will be 0
          comparisonStartDate = "1900-01-01";
          comparisonEndDate = "1900-01-01";
          break;
        }
        default: {
          setComparisonData(null);
          return;
        }
      }

      // For non-today cases we use the revenue endpoint
      if (currentRange !== "today") {
        const compRevenue = await analyticsAPI.getRevenue(
          comparisonStartDate,
          comparisonEndDate
        );
        setComparisonData(compRevenue);
      }
    } catch (error) {
      console.error("Error loading comparison data:", error);
      setComparisonData(null);
    } finally {
      setIsLoadingComparison(false);
    }
  };

  useEffect(() => {
    setAllEmployees((prevEmployees) =>
      prevEmployees.map((emp) => {
        const isSupervisor = allLocations.some(
          (loc) => loc.Supervisor_ID === emp.Employee_ID
        );

        if (isSupervisor) {
          return { ...emp, Salary: salaries[2] };
        }
        return emp;
      })
    );
  }, []);

  const filterByDateRange = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();

    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const daysDiff = Math.floor(
      (nowOnly.getTime() - dateOnly.getTime()) / (1000 * 60 * 60 * 24)
    );

    switch (revenueRange) {
      case "today":
        return daysDiff === 0;
      case "week":
        return daysDiff >= 0 && daysDiff <= 7; // Include today and past 7 days
      case "month":
        return daysDiff >= 0 && daysDiff <= 30; // Include today and past 30 days
      case "year":
        return daysDiff >= 0 && daysDiff <= 365; // Include today and past 365 days
      case "all":
      default:
        return true;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const d = parseServerDate(dateString);
    if (!d) return "Invalid Date";
    return d.toLocaleDateString("en-US");
  };

  const formatTime = (time) => {
    if (!time) return "";
    try {
      const [hoursStr, minutesStr] = time.split(":");
      const hours = parseInt(hoursStr, 10);
      const minutes = minutesStr ? minutesStr.split(":")[0] : "00";
      if (Number.isNaN(hours)) return time;
      const period = hours >= 12 ? "PM" : "AM";
      const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      return `${displayHour}:${minutes} ${period}`;
    } catch (e) {
      return time;
    }
  };

  function parseServerDate(input) {
    if (!input) return null;
    if (input instanceof Date) return input;
    if (typeof input !== "string") return new Date(input);

    if (/Z$/.test(input) || /[+-]\d{2}:?\d{2}$/.test(input)) {
      const d = new Date(input);
      return isNaN(d.getTime()) ? null : d;
    }

    const m = input.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)$/);
    if (m) {
      const iso = `${m[1]}T${m[2]}Z`;
      const d = new Date(iso);
      return isNaN(d.getTime()) ? null : d;
    }

    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  const formatNumber = (num) => {
    return num.toLocaleString("en-US");
  };

  const formatLastUpdated = () => {
    const hours = lastUpdated.getHours();
    const minutes = String(lastUpdated.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  const calculatePercentageChange = (current, previous) => {
    const currentVal = Number.parseFloat(current) || 0;
    const previousVal = Number.parseFloat(previous) || 0;

    if (previousVal === 0) {
      return currentVal === 0 ? 0 : Infinity;
    }

    return ((currentVal - previousVal) / previousVal) * 100;
  };

  const renderPercentageChange = (current, previous) => {
    if (revenueRange === "custom") return null;

    if (!comparisonData) {
      return null;
    }

    const change = calculatePercentageChange(current, previous);

    const isPositive = change > 0;
    const isZero = change === 0;
    const isInfinite = !isFinite(change);

    const bgClass = isInfinite
      ? "bg-green-100 text-green-800"
      : isZero
      ? "bg-gray-100 text-gray-700"
      : isPositive
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${bgClass}`}
        aria-hidden
      >
        {isInfinite ? (
          <>
            <TrendingUp className="h-3 w-3" />
            <span className="leading-none">New!</span>
          </>
        ) : isZero ? (
          <span className="leading-none">+0.0%</span>
        ) : (
          <>
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span className="leading-none">
              {isPositive ? "+" : ""}
              {change.toFixed(1)}%
            </span>
          </>
        )}
      </span>
    );
  };

  const isSupervisor = (emp) => {
    return allLocations.some((loc) => loc.Supervisor_ID === emp.Employee_ID);
  };

  const getEmployeeTitle = (emp) => {
    if (isSupervisor(emp)) {
      return "Supervisor";
    }
    return emp.Title || "Unknown";
  };

  const getEmployeeZone = (emp) => {
    if (emp.Zone) return `Zone ${emp.Zone}`;

    const supervisedZone = allLocations.find(
      (loc) => loc.Supervisor_ID === emp.Employee_ID
    );
    if (supervisedZone) return `Zone ${supervisedZone.Zone}`;

    return "Not Assigned";
  };

  const sortedEmployees = useMemo(() => {
    let filtered = [...allEmployees];

    // Apply search filter
    if (staffSearch.trim()) {
      const searchLower = staffSearch.toLowerCase();
      filtered = filtered.filter((emp) => {
        const firstName = emp.First_Name?.toLowerCase() || "";
        const lastName = emp.Last_Name?.toLowerCase() || "";
        const employeeId = emp.Employee_ID?.toString() || "";

        return (
          firstName.includes(searchLower) ||
          lastName.includes(searchLower) ||
          employeeId.includes(searchLower)
        );
      });
    }

    if (staffJobFilter === "No Selection") {
      return [];
    }

    if (staffJobFilter !== "None") {
      filtered = filtered.filter((emp) => {
        if (staffJobFilter === "2") {
          return isSupervisor(emp);
        }
        return !isSupervisor(emp) && emp.Job_ID?.toString() === staffJobFilter;
      });
    }

    return filtered.sort((a, b) => a.Last_Name.localeCompare(b.Last_Name));
  }, [allEmployees, staffSearch, staffJobFilter]);

  const displayAnimals = useMemo(() => {
    if (!animalExhibitFilter) return [];
    const base =
      animalExhibitFilter === "All"
        ? allAnimalsDB
        : allAnimalsDB.filter(
            (animal) => animal.Enclosure_ID === animalExhibitFilter
          );

    if (animalSearch && animalSearch.trim() !== "") {
      const s = animalSearch.trim().toLowerCase();
      return base.filter((animal) => {
        const idStr = (animal.Animal_ID ?? "").toString().toLowerCase();
        const name = (animal.Animal_Name ?? "").toLowerCase();
        const species = (animal.Species ?? "").toLowerCase();

        return idStr.includes(s) || name.includes(s) || species.includes(s);
      });
    }

    return base;
  }, [allAnimalsDB, animalExhibitFilter, animalSearch]);

  const animalsByExhibit = useMemo(() => {
    const grouped = {};
    displayAnimals.forEach((animal) => {
      const enclosure = allEnclosures.find(
        (e) => e.Enclosure_ID === animal.Enclosure_ID
      );
      const enclosureName = enclosure?.Enclosure_Name || "Unknown";
      if (!grouped[enclosureName]) {
        grouped[enclosureName] = [];
      }
      grouped[enclosureName].push(animal);
    });
    return grouped;
  }, [displayAnimals, allEnclosures]);

  const sortedTransactions = useMemo(() => {
    const data = Array.isArray(detailedTransactions)
      ? [...detailedTransactions]
      : [];

    if (transactionSortState?.col) {
      const key = transactionSortState.col;
      const dir = transactionSortState.dir;
      data.sort((a, b) => {
        const A = a[key];
        const B = b[key];
        const numA = Number(A);
        const numB = Number(B);
        if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
          return dir === "asc" ? numA - numB : numB - numA;
        } else {
          const sa = String(A || "").toUpperCase();
          const sb = String(B || "").toUpperCase();
          if (sa < sb) return dir === "asc" ? -1 : 1;
          if (sa > sb) return dir === "asc" ? 1 : -1;
          return 0;
        }
      });
    }
    return data;
  }, [detailedTransactions, transactionSortState]);

  const transactionCategories = useMemo(() => {
    const cats = new Set();
    (Array.isArray(detailedTransactions) ? detailedTransactions : []).forEach(
      (t) => cats.add(t?.Category ?? "Uncategorized")
    );
    return Array.from(cats);
  }, [detailedTransactions]);

  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(sortedTransactions)) return [];
    if (transactionSource === "No Selection") return [];

    let filtered = sortedTransactions;

    if (transactionSource && transactionSource !== "All") {
      filtered = filtered.filter(
        (t) => (t?.Category ?? "Uncategorized") === transactionSource
      );
    }

    if (transactionSearch.trim()) {
      const searchLower = transactionSearch.toLowerCase().trim();
      filtered = filtered.filter((t) => {
        const customerName = (t?.Customer_Name || "").toLowerCase();
        return customerName.includes(searchLower);
      });
    }

    return filtered;
  }, [sortedTransactions, transactionSource, transactionSearch]);

  const displayedTransactions = useMemo(() => {
    const startIndex = (transactionCurrentPage - 1) * transactionItemsPerPage;
    const endIndex = startIndex + transactionItemsPerPage;
    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, transactionCurrentPage, transactionItemsPerPage]);

  const transactionTotalPages = useMemo(() => {
    return Math.ceil(filteredTransactions.length / transactionItemsPerPage);
  }, [filteredTransactions.length, transactionItemsPerPage]);

  const transactionPaginationArray = useMemo(() => {
    return generatePaginationArray(
      transactionCurrentPage,
      transactionTotalPages
    );
  }, [transactionCurrentPage, transactionTotalPages]);

  useEffect(() => {
    setTransactionCurrentPage(1);
  }, [transactionSource, transactionSearch]);

  const calculateAge = (birthday) => {
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const filteredAnimals = useMemo(() => {
    if (
      healthZoneFilter === "None" &&
      healthEnclosureFilter === "None" &&
      genderFilter === "None" &&
      ageFilter === "None"
    ) {
      return [];
    }

    return allAnimalsDB.filter((animal) => {
      if (healthZoneFilter !== "All" && healthZoneFilter !== "None") {
        const enclosure = allEnclosures.find(
          (e) => e.Enclosure_ID === animal.Enclosure_ID
        );
        const location = allLocations.find(
          (loc) => loc.Location_ID === enclosure?.Location_ID
        );
        if (location?.Zone !== healthZoneFilter) return false;
      }

      if (
        healthEnclosureFilter !== "All" &&
        healthEnclosureFilter !== "None" &&
        animal.Enclosure_ID !== healthEnclosureFilter
      )
        return false;

      if (
        genderFilter !== "All" &&
        genderFilter !== "None" &&
        animal.Gender !== genderFilter
      )
        return false;

      if (ageFilter !== "All" && ageFilter !== "None") {
        const age = calculateAge(animal.Birthday);
        if (ageFilter === "0-2" && (age < 0 || age > 2)) return false;
        if (ageFilter === "3-5" && (age < 3 || age > 5)) return false;
        if (ageFilter === "6-10" && (age < 6 || age > 10)) return false;
        if (ageFilter === "11+" && age < 11) return false;
      }

      if (animalSearch && animalSearch.trim()) {
        const s = animalSearch.toLowerCase().trim();
        const name = (animal.Animal_Name || "").toLowerCase();
        const species = (animal.Species || "").toLowerCase();
        if (!name.includes(s) && !species.includes(s)) return false;
      }

      return true;
    });
  }, [
    allAnimalsDB,
    healthZoneFilter,
    healthEnclosureFilter,
    genderFilter,
    ageFilter,
    allEnclosures,
    allLocations,
  ]);

  const sortedAnimals = useMemo(() => {
    const data = [...filteredAnimals];

    if (animalSortState?.col) {
      const key = animalSortState.col;
      const dir = animalSortState.dir;
      data.sort((a, b) => {
        let A = a[key];
        let B = b[key];

        if (key === "Age") {
          A = calculateAge(a.Birthday);
          B = calculateAge(b.Birthday);
        } else if (key === "Enclosure_Name") {
          A = enclosureMap[a.Enclosure_ID]?.Enclosure_Name || "";
          B = enclosureMap[b.Enclosure_ID]?.Enclosure_Name || "";
        }

        const numA = Number(A);
        const numB = Number(B);
        if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
          return dir === "asc" ? numA - numB : numB - numA;
        } else {
          const sa = String(A || "").toUpperCase();
          const sb = String(B || "").toUpperCase();
          if (sa < sb) return dir === "asc" ? -1 : 1;
          if (sa > sb) return dir === "asc" ? 1 : -1;
          return 0;
        }
      });
    }

    return data;
  }, [filteredAnimals, animalSortState]);

  const displayedAnimals = useMemo(() => {
    const startIndex = (animalCurrentPage - 1) * animalItemsPerPage;
    const endIndex = startIndex + animalItemsPerPage;
    return sortedAnimals.slice(startIndex, endIndex);
  }, [sortedAnimals, animalCurrentPage, animalItemsPerPage]);

  const animalTotalPages = useMemo(() => {
    return Math.ceil(sortedAnimals.length / animalItemsPerPage);
  }, [sortedAnimals.length, animalItemsPerPage]);

  const animalPaginationArray = useMemo(() => {
    return generatePaginationArray(animalCurrentPage, animalTotalPages);
  }, [animalCurrentPage, animalTotalPages]);

  // Reset to page 1 when animal filters change
  useEffect(() => {
    setAnimalCurrentPage(1);
  }, [
    healthZoneFilter,
    healthEnclosureFilter,
    genderFilter,
    ageFilter,
    animalSearch,
  ]);

  const ticketRevenue = revenueData?.ticketRevenue || 0;
  const membershipRevenue = revenueData?.membershipRevenue || 0;
  // Detect whether pricing inputs differ from current values so Save can be disabled
  const ticketPricesChanged = Object.keys(tempTicketPrices || {}).some(
    (k) =>
      parseFloat(tempTicketPrices[k] ?? 0) !==
      parseFloat((ticketPrices || {})[k] ?? 0)
  );
  const selectedTicketChanged = selectedTicketType
    ? parseFloat(tempTicketPrices[selectedTicketType] ?? 0) !==
      parseFloat((ticketPrices || {})[selectedTicketType] ?? 0)
    : false;
  const membershipChanged =
    parseFloat(tempMembershipPrice ?? 0) !== parseFloat(membershipPrice ?? 0);
  const giftShopRevenue = revenueData?.giftShopRevenue || 0;
  const foodRevenue = revenueData?.foodRevenue || 0;
  const totalRevenue = revenueData?.totalRevenue || 0;

  const totalAnimals = allAnimalsDB.length;
  const totalEmployees = allEmployees.length;
  const activeMemb = allMemberships.filter((m) => m.Membership_Status).length;

  // Revenue Breakdown
  const revenueBreakdown = [
    {
      category: "Tickets",
      amount: ticketRevenue,
      color: "bg-green-600",
      icon: Ticket,
    },
    {
      category: "Memberships",
      amount: membershipRevenue,
      color: "bg-purple-600",
      icon: Crown,
    },
    {
      category: "Gift Shop",
      amount: giftShopRevenue,
      color: "bg-blue-600",
      icon: Package,
    },
    {
      category: "Food & Beverages",
      amount: foodRevenue,
      color: "bg-orange-600",
      icon: Coffee,
    },
  ];

  const ticketStats = useMemo(
    () => [
      {
        type: "Adult",
        sold: revenueData?.ticketSales?.adultTickets || 0,
      },
      {
        type: "Child",
        sold: revenueData?.ticketSales?.childTickets || 0,
      },
      {
        type: "Senior",
        sold: revenueData?.ticketSales?.seniorTickets || 0,
      },
      {
        type: "Student",
        sold: revenueData?.ticketSales?.studentTickets || 0,
      },
    ],
    [revenueData]
  );

  // Compute a comfortable y-axis max so the largest bar doesn't touch the top
  const ticketMax = useMemo(() => {
    const max =
      ticketStats && ticketStats.length
        ? Math.max(...ticketStats.map((s) => s.sold || 0))
        : 0;
    // Add 10% padding and round up to next integer (minimum 1)
    const padded = Math.max(1, Math.ceil(max * 1.1));
    return padded;
  }, [ticketStats]);

  const handleDeleteEmployee = async (emp) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await employeeAPI.delete(emp.Employee_ID);

      const [employeesData, locationsData] = await Promise.all([
        employeeAPI.getAll(),
        locationAPI.getAll(),
      ]);

      setAllEmployees(employeesData);
      setAllLocations(locationsData);
      setDeleteConfirmEmployee(null);
      toast.success(`Successfully removed ${emp.First_Name} ${emp.Last_Name}`);
    } catch (error) {
      console.error("Error deleting employee:", error);

      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to delete employee";

      toast.error(errorMessage);
      setDeleteConfirmEmployee(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateEmployee = async (employeeId, formData) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const zoneLocation = allLocations.find(
        (loc) => loc.Zone === formData.zone
      );

      const employeeData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        birthdate: formData.birthdate,
        sex: formData.sex,
        jobId: parseInt(formData.jobId),
        salary: salaries[parseInt(formData.jobId)],
        email: formData.email,
        address: formData.address,
        locationId: zoneLocation ? zoneLocation.Location_ID : null,
      };

      await employeeAPI.update(employeeId, employeeData);

      // Reload employees
      const employeesData = await employeeAPI.getAll();
      setAllEmployees(employeesData);

      setEditingEmployee(null);
      toast.success(
        `Successfully updated ${formData.firstName} ${formData.lastName}`
      );
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error("Failed to update employee");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddEmployee = async (formData) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      // Find the location object for the selected zone
      const zoneLocation = allLocations.find(
        (loc) => loc.Zone === formData.zone
      );

      const employeeData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        birthdate: formData.birthdate,
        sex: formData.sex,
        jobId: parseInt(formData.jobId),
        salary: salaries[parseInt(formData.jobId)],
        email: formData.email,
        address: formData.address,
        locationId: zoneLocation ? zoneLocation.Location_ID : null,
      };

      await employeeAPI.create(employeeData);

      // Reload employees
      const employeesData = await employeeAPI.getAll();
      setAllEmployees(employeesData);

      setIsAddEmployeeOpen(false);
      toast.success(
        `Successfully added ${formData.firstName} ${formData.lastName}`
      );
    } catch (error) {
      console.error("Error adding employee:", error);
      toast.error("Failed to add employee");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssignSupervisor = async (zoneId, supervisorId) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await locationAPI.updateSupervisor(zoneId, supervisorId);

      // Reload locations and employees
      const [locationsData, employeesData] = await Promise.all([
        locationAPI.getAll(),
        employeeAPI.getAll(),
      ]);

      setAllLocations(locationsData);
      setAllEmployees(employeesData);
      setIsManageZoneOpen(false);
      setSelectedZone(null);
      setSupervisorSearch("");
      toast.success("Supervisor assigned successfully!");
    } catch (error) {
      console.error("Error assigning supervisor:", error);
      toast.error("Failed to assign supervisor");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSalarySave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      // Update actual salary state
      setSalaries({ ...tempSalaries });

      // Update all employees with new salaries
      const updatePromises = allEmployees.map((emp) => {
        // Check if this employee is a supervisor of any zone
        const isSupervisor = allLocations.some(
          (loc) => loc.Supervisor_ID === emp.Employee_ID
        );

        const newSalary = isSupervisor
          ? tempSalaries[2]
          : tempSalaries[emp.Job_ID];

        if (newSalary && newSalary !== emp.Salary) {
          return employeeAPI.updateSalary(emp.Employee_ID, newSalary);
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);

      // Reload employees
      const employeesData = await employeeAPI.getAll();
      setAllEmployees(employeesData);

      setIsSalaryManagementOpen(false);
      toast.success("Salaries updated successfully!");
    } catch (error) {
      console.error("Error updating salaries:", error);
      toast.error("Failed to update salaries");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSalaryDialogOpen = (open) => {
    if (open) {
      // Reset temp salaries to current salaries when opening
      setTempSalaries({ ...salaries });
    }
    setIsSalaryManagementOpen(open);
  };

  const handleTicketDialogOpen = (open, type = null) => {
    if (open) {
      // Prepare temp values and show content immediately
      setTempTicketPrices({ ...ticketPrices });
      setSelectedTicketType(type);
      setIsTicketContentVisible(true);
      setIsTicketPricingOpen(true);
    } else {
      // Hide inner content immediately to avoid flashing previous content
      setIsTicketContentVisible(false);
      // Clear selection and temp values
      setSelectedTicketType(null);
      setTempTicketPrices({});
      // Hide inner content immediately then close dialog to avoid flash
      setIsTicketContentVisible(false);
      setIsTicketPricingOpen(false);
    }
  };

  const handleMembershipDialogOpen = (open) => {
    if (open) {
      setTempMembershipPrice(membershipPrice);
    }
    setIsMembershipPricingOpen(open);
  };

  const handleTicketSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      // If a single ticket type is selected, update only that type
      if (selectedTicketType) {
        const updatedTickets = {
          ...ticketPrices,
          [selectedTicketType]: tempTicketPrices[selectedTicketType],
        };
        await pricingAPI.updatePricing(updatedTickets, membershipPrice);
        updateTicketPrices(updatedTickets);
        setSelectedTicketType(null);
      } else {
        // Update all ticket prices
        await pricingAPI.updatePricing(tempTicketPrices, membershipPrice);
        updateTicketPrices(tempTicketPrices);
      }
      setIsTicketPricingOpen(false);
      toast.success("Ticket prices updated successfully!");
    } catch (error) {
      console.error("Error updating ticket prices:", error);
      toast.error("Failed to update ticket prices");
    } finally {
      setIsSaving(false);
    }
  };

  const handleJobSalaryDialogOpen = (open, jobId = null) => {
    if (open && jobId) {
      setSelectedJobId(jobId);
      setTempJobSalary(salaries[jobId] || 0);
    }
    if (!open) {
      setSelectedJobId(null);
    }
    setIsJobSalaryOpen(open);
  };

  const handleJobSalarySave = async () => {
    if (isSaving || !selectedJobId) return;
    setIsSaving(true);
    try {
      // update local salaries map for the job
      setSalaries((prev) => ({ ...prev, [selectedJobId]: tempJobSalary }));

      // Update employees who match this job (include supervisors if jobId === 2)
      const updatePromises = allEmployees
        .filter((emp) => {
          if (selectedJobId === 2) {
            // supervisors may be identified via locations or Job_ID
            const isSupervisor = allLocations.some(
              (loc) => loc.Supervisor_ID === emp.Employee_ID
            );
            return isSupervisor || emp.Job_ID === 2;
          }
          return emp.Job_ID === selectedJobId;
        })
        .map((emp) => {
          if (emp.Salary !== tempJobSalary) {
            return employeeAPI.updateSalary(emp.Employee_ID, tempJobSalary);
          }
          return Promise.resolve();
        });

      await Promise.all(updatePromises);

      // reload employees
      const employeesData = await employeeAPI.getAll();
      setAllEmployees(employeesData);

      setIsJobSalaryOpen(false);
      setSelectedJobId(null);
      toast.success("Salary updated for selected job");
    } catch (error) {
      console.error("Error updating job salary:", error);
      toast.error("Failed to update salary for job");
    } finally {
      setIsSaving(false);
    }
  };

  const handleMembershipSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      // Update membership only, keep ticket prices unchanged
      await pricingAPI.updatePricing(ticketPrices, tempMembershipPrice);
      updateMembershipPrice(tempMembershipPrice);
      setIsMembershipPricingOpen(false);
      toast.success("Membership price updated successfully!");
    } catch (error) {
      console.error("Error updating membership price:", error);
      toast.error("Failed to update membership price");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateExhibit = async (formData) => {
    if (!editingExhibit || isSaving) return;
    setIsSaving(true);

    try {
      // Build update object with only changed fields
      const exhibitData = {};

      if (formData.name !== editingExhibit.exhibit_Name) {
        exhibitData.name = formData.name;
      }
      if (formData.description !== editingExhibit.exhibit_Description) {
        exhibitData.description = formData.description;
      }
      if (formData.capacity !== (editingExhibit.Capacity || "").toString()) {
        exhibitData.capacity = formData.capacity
          ? parseInt(formData.capacity)
          : null;
      }
      if (formData.displayTime !== (editingExhibit.Display_Time || "")) {
        exhibitData.displayTime = formData.displayTime || null;
      }
      // If exhibitType was changed, include it in the update payload.
      // Try to compare against any existing Exhibit_Type or Type fields on the exhibit.
      const existingType =
        editingExhibit.Exhibit_Type || editingExhibit.Type || "";
      if ((formData.exhibitType || "") !== existingType) {
        exhibitData.exhibitType = formData.exhibitType || null;
      }

      if (
        formData.locationId !== (editingExhibit.Location_ID || "").toString()
      ) {
        exhibitData.locationId = formData.locationId
          ? parseInt(formData.locationId)
          : null;
      }

      // Only send update if there are changes to text fields
      if (Object.keys(exhibitData).length > 0) {
        await exhibitAPI.update(editingExhibit.Exhibit_ID, exhibitData);
      }

      // Remove image if requested
      if (formData.removeImage) {
        await exhibitAPI.removeImage(editingExhibit.Exhibit_ID);
      }

      // Upload new image if provided
      if (formData.imageFile) {
        const imageFormData = new FormData();
        imageFormData.append("image", formData.imageFile);

        const imageResponse = await fetch(
          `${API_BASE_URL}/admin/exhibits/${editingExhibit.Exhibit_ID}/upload-image`,
          {
            method: "POST",
            body: imageFormData,
          }
        );

        if (!imageResponse.ok) {
          const errorData = await imageResponse.json();
          console.error("Image upload failed:", errorData);

          // Reload exhibits even if image failed
          const exhibitsData = await exhibitAPI.getAll();
          setAllExhibitsDB(exhibitsData);
          setEditingExhibit(null);

          toast.error(
            `Image upload failed: ${errorData.error || "Unknown error"}`
          );
          return; // Exit early - don't show success message
        }
      }

      // Reload exhibits to get fresh data including updated image URL
      const exhibitsData = await exhibitAPI.getAll();
      setAllExhibitsDB(exhibitsData);

      setEditingExhibit(null);
      toast.success(`Successfully updated exhibit: ${formData.name}!`);
    } catch (error) {
      console.error("Error updating exhibit:", error);
      toast.error("Failed to update exhibit");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveExhibitImage = async (exhibitId) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await exhibitAPI.removeImage(exhibitId);

      const exhibitsData = await exhibitAPI.getAll();
      setAllExhibitsDB(exhibitsData);

      toast.success("Image removed successfully!");
    } catch (error) {
      console.error("Error removing exhibit image:", error);
      toast.error("Failed to remove image");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAnimal = async (formData) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const animalData = {
        name: formData.name,
        species: formData.species,
        gender: formData.gender,
        weight: parseFloat(formData.weight),
        birthday: formData.birthday,
        healthStatus: formData.healthStatus || "Good",
        enclosureId: parseInt(formData.enclosureId),
        meals: formData.meals ? parseInt(formData.meals) : undefined,
        feedingFrequency: formData.feedingFrequency || undefined,
      };

      const newAnimal = await animalAPI.create(animalData);

      // Upload image if provided
      if (formData.imageFile) {
        const imageFormData = new FormData();
        imageFormData.append("image", formData.imageFile);

        const imageResponse = await fetch(
          `${API_BASE_URL}/admin/animals/${newAnimal.Animal_ID}/upload-image`,
          {
            method: "POST",
            body: imageFormData,
          }
        );

        if (!imageResponse.ok) {
          const errorData = await imageResponse.json();
          console.error("Image upload failed:", errorData);

          // Reload animals even if image failed
          const animalsData = await animalAPI.getAll();
          setAllAnimalsDB(animalsData);
          setIsAddAnimalOpen(false);

          toast.error(
            `Animal added but image upload failed: ${
              errorData.error || "Unknown error"
            }`
          );
          return; // Exit early
        }
      }

      // Reload animals to get fresh data including image URL
      const animalsData = await animalAPI.getAll();
      setAllAnimalsDB(animalsData);

      // Also add to context for immediate UI update
      addAnimal({
        Animal_ID: newAnimal.Animal_ID,
        Animal_Name: newAnimal.Animal_Name,
        Species: newAnimal.Species,
        Gender: newAnimal.Gender,
        Weight: newAnimal.Weight,
        Birthday: newAnimal.Birthday,
        Health_Status: newAnimal.Health_Status,
        Is_Vaccinated: newAnimal.Is_Vaccinated,
        Enclosure_ID: newAnimal.Enclosure_ID,
        Enclosure: allEnclosures.find(
          (e) => e.Enclosure_ID === newAnimal.Enclosure_ID
        ),
      });

      setIsAddAnimalOpen(false);
      toast.success(
        `Successfully added ${formData.name} to ${
          newAnimal.Enclosure_Name || "the zoo"
        }!`
      );
    } catch (error) {
      console.error("Error adding animal:", error);
      toast.error("Failed to add animal");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateAnimal = async (formData) => {
    if (!editingAnimal) return;
    if (isSaving) return;
    setIsSaving(true);

    try {
      // Build update object with only changed fields
      const animalData = {};

      if (formData.name !== editingAnimal.Animal_Name) {
        animalData.name = formData.name;
      }
      if (formData.species !== editingAnimal.Species) {
        animalData.species = formData.species;
      }
      if (formData.gender !== editingAnimal.Gender) {
        animalData.gender = formData.gender;
      }
      if (formData.weight !== editingAnimal.Weight.toString()) {
        animalData.weight = parseFloat(formData.weight);
      }
      // Compare formatted dates
      const originalBirthday = new Date(editingAnimal.Birthday)
        .toISOString()
        .split("T")[0];
      if (formData.birthday !== originalBirthday) {
        animalData.birthday = formData.birthday;
      }
      if (formData.enclosureId !== editingAnimal.Enclosure_ID.toString()) {
        animalData.enclosureId = parseInt(formData.enclosureId);
      }

      // Only send update if there are changes to text fields
      if (Object.keys(animalData).length > 0) {
        // Add health status and vaccination if updating other fields
        animalData.healthStatus = editingAnimal.Health_Status;
        animalData.isVaccinated = editingAnimal.Is_Vaccinated;

        await animalAPI.update(editingAnimal.Animal_ID, animalData);
      }

      // Remove image if requested
      if (formData.removeImage) {
        await animalAPI.removeImage(editingAnimal.Animal_ID);
      }

      // Upload new image if provided
      if (formData.imageFile) {
        const imageFormData = new FormData();
        imageFormData.append("image", formData.imageFile);

        const imageResponse = await fetch(
          `${API_BASE_URL}/admin/animals/${editingAnimal.Animal_ID}/upload-image`,
          {
            method: "POST",
            body: imageFormData,
          }
        );

        if (!imageResponse.ok) {
          const errorData = await imageResponse.json();
          console.error("Image upload failed:", errorData);

          // Reload animals even if image failed
          const animalsData = await animalAPI.getAll();
          setAllAnimalsDB(animalsData);
          setEditingAnimal(null);

          toast.error(
            `Image upload failed: ${errorData.error || "Unknown error"}`
          );
          return; // Exit early - don't show success message
        }
      }

      const animalsData = await animalAPI.getAll();
      setAllAnimalsDB(animalsData);

      setEditingAnimal(null);
      toast.success(
        `Successfully updated ${formData.name || editingAnimal.Animal_Name}!`
      );
    } catch (error) {
      console.error("Error updating animal:", error);
      toast.error("Failed to update animal");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveAnimalImage = async (animalId) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await animalAPI.removeImage(animalId);

      const animalsData = await animalAPI.getAll();
      setAllAnimalsDB(animalsData);

      toast.success("Image removed successfully!");
    } catch (error) {
      console.error("Error removing animal image:", error);
      toast.error("Failed to remove image");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAnimal = async (animal) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await animalAPI.delete(animal.Animal_ID);

      // Reload animals
      const animalsData = await animalAPI.getAll();
      setAllAnimalsDB(animalsData);

      deleteAnimal(animal.Animal_ID);

      setDeleteConfirmAnimal(null);
      toast.success(`Successfully removed ${animal.Animal_Name} from the zoo.`);
    } catch (error) {
      console.error("Error deleting animal:", error);
      toast.error("Failed to delete animal");
    } finally {
      setIsSaving(false);
    }
  };

  const handleManageActivities = async (exhibit) => {
    setSelectedExhibitForActivities(exhibit);
    try {
      const res = await fetch(
        `${API_BASE_URL}/admin/exhibits/${exhibit.Exhibit_ID}/activities`
      );
      if (res.ok) {
        const data = await res.json();
        setExhibitActivities(data);
      } else {
        setExhibitActivities([]);
      }
    } catch (error) {
      console.error("Error loading activities:", error);
      setExhibitActivities([]);
    }
    setIsActivityDialogOpen(true);
  };

  const handleSaveActivity = async (
    activityOrder,
    activityName,
    activityDescription,
    duration
  ) => {
    if (!selectedExhibitForActivities) return;

    try {
      setIsSaving(true);

      // Check if activity already exists for this order
      const existingActivity = exhibitActivities.find(
        (a) => a.Activity_Order === activityOrder
      );

      if (existingActivity) {
        // Update existing activity
        const res = await fetch(
          `${API_BASE_URL}/admin/activities/${existingActivity.Activity_ID}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              activityName,
              activityDescription,
              duration,
            }),
          }
        );

        if (!res.ok) throw new Error("Failed to update activity");
        toast.success("Activity updated successfully");
      } else {
        // Create new activity
        const res = await fetch(
          `${API_BASE_URL}/admin/exhibits/${selectedExhibitForActivities.Exhibit_ID}/activities`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              activityName,
              activityDescription,
              activityOrder,
              duration,
            }),
          }
        );

        if (!res.ok) throw new Error("Failed to add activity");
        toast.success("Activity added successfully");
      }

      // Reload activities
      const res = await fetch(
        `${API_BASE_URL}/admin/exhibits/${selectedExhibitForActivities.Exhibit_ID}/activities`
      );
      if (res.ok) {
        const data = await res.json();
        setExhibitActivities(data);
      }
    } catch (error) {
      console.error("Error saving activity:", error);
      toast.error("Failed to save activity");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteActivity = async (activityId) => {
    try {
      setIsSaving(true);
      const res = await fetch(
        `${API_BASE_URL}/admin/activities/${activityId}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) throw new Error("Failed to delete activity");

      toast.success("Activity deleted successfully");

      // Reload activities
      if (selectedExhibitForActivities) {
        const res = await fetch(
          `${API_BASE_URL}/admin/exhibits/${selectedExhibitForActivities.Exhibit_ID}/activities`
        );
        if (res.ok) {
          const data = await res.json();
          setExhibitActivities(data);
        }
      }
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast.error("Failed to delete activity");
    } finally {
      setIsSaving(false);
    }
  };

  const getRangeLabel = () => {
    const formatShortDate = (d) => {
      if (!d) return "";
      const dt = new Date(d);
      const m = dt.getMonth() + 1;
      const day = dt.getDate();
      const y = dt.getFullYear();
      return `${m}/${day}/${y}`;
    };

    switch (revenueRange) {
      case "today":
        return "Today";
      case "week":
        return "Past Week";
      case "month":
        return "Past Month";
      case "year":
        return "Past Year";
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

  const abbreviateNorth = (text) => {
    if (!text) return text;
    return text.replace(/\bNorth\b/g, "N.");
  };

  // Get employees in a specific zone
  const getZoneEmployees = (location) => {
    // Filter employees by their Zone from employee_location table
    return allEmployees.filter((emp) => {
      // Employee is in this zone if their Zone matches
      if (emp.Zone === location.Zone) return true;
      return false;
    });
  };

  // Filter employees for supervisor selection
  const filteredEmployeesForSupervisor = useMemo(() => {
    // Get all employee IDs that are currently supervisors
    const currentSupervisorIds = allLocations
      .map((loc) => loc.Supervisor_ID)
      .filter((id) => id !== null);

    // Filter out employees who are already supervisors
    const availableEmployees = allEmployees.filter(
      (emp) => !currentSupervisorIds.includes(emp.Employee_ID)
    );

    if (!supervisorSearch) return availableEmployees;
    const search = supervisorSearch.toLowerCase();
    return availableEmployees.filter(
      (emp) =>
        emp.First_Name.toLowerCase().includes(search) ||
        emp.Last_Name.toLowerCase().includes(search) ||
        emp.Employee_ID.toString().includes(search)
    );
  }, [allEmployees, allLocations, supervisorSearch]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header
        className="sticky top-0 z-50 shadow-sm border-b transition-colors duration-150 text-white"
        style={{ backgroundColor: "rgba(180, 255, 249)" }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ZooLogo size={64} />
              <div>
                <h1
                  className="font-semibold text-xl text-emerald-600"
                  style={{ color: "#059669" }}
                >
                  Admin Portal
                </h1>
                <p className="text-sm text-gray-600">Management Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium" style={{ color: "#059669" }}>
                  Welcome, Administrator
                </p>
                <p className="text-sm text-gray-600">Full System Access</p>
              </div>
              <Button
                variant="default"
                size="sm"
                aria-label="View Public Site"
                onClick={() => navigate("/")}
                className="bg-green-600 text-white rounded-full px-3 py-1.5 shadow-sm hover:bg-green-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors duration-150"
              >
                <Home className="h-4 w-4 mr-2" />
                View Public Site
              </Button>
              <Button
                variant="default"
                size="sm"
                aria-label="Logout"
                onClick={onLogout}
                className="bg-green-600 text-white rounded-full px-3 py-1.5 shadow-sm hover:bg-green-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors duration-150"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <LoadingWithIcon text="Loading from server..." size={56} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12 space-y-8 max-w-7xl">
        {/* Admin portal tab-style navigation (Overview | Operations | Assets) */}
        <nav
          aria-label="Admin portal tabs"
          className="sticky top-20 z-50 mb-10 rounded-lg border border-gray-200 bg-white shadow-md w-fit mx-auto"
          role="tablist"
        >
          <div className="flex items-center justify-center gap-8 p-4">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "overview"}
              onClick={() => handleSetActiveTab("overview")}
              className={`inline-block px-6 py-3 rounded-t-lg border-b-2 text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === "overview"
                  ? "border-green-600 text-green-800 bg-gradient-to-t from-green-100 to-white shadow-inner"
                  : "border-transparent text-gray-700 hover:bg-gray-50"
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "operations"}
              onClick={() => handleSetActiveTab("operations")}
              className={`inline-block px-6 py-3 rounded-t-lg border-b-2 text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === "operations"
                  ? "border-green-600 text-green-800 bg-gradient-to-t from-green-100 to-white shadow-inner"
                  : "border-transparent text-gray-700 hover:bg-gray-50"
              }`}
            >
              Operations
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "assets"}
              onClick={() => handleSetActiveTab("assets")}
              className={`inline-block px-6 py-3 rounded-t-lg border-b-2 text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === "assets"
                  ? "border-green-600 text-green-800 bg-gradient-to-t from-green-100 to-white shadow-inner"
                  : "border-transparent text-gray-700 hover:bg-gray-50"
              }`}
            >
              Assets
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "reports"}
              onClick={() => handleSetActiveTab("reports")}
              className={`inline-block px-6 py-3 rounded-t-lg border-b-2 text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === "reports"
                  ? "border-green-600 text-green-800 bg-gradient-to-t from-green-100 to-white shadow-inner"
                  : "border-transparent text-gray-700 hover:bg-gray-50"
              }`}
            >
              Reports
            </button>
          </div>
        </nav>
        {/* Revenue Range Filter */}
        {activeTab === "overview" && (
          <section id="overview">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-6 w-6" /> Overview Statistics
              </h2>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600 italic">
                  Last Updated: {formatLastUpdated()}
                </span>
                <Popover
                  open={isPopoverOpen}
                  onOpenChange={(open) => {
                    if (open) {
                      // store previous range so Cancel can revert
                      setPrevCustomRange(customRange);
                    }
                    setIsPopoverOpen(open);
                  }}
                >
                  <PopoverTrigger asChild>
                    <button
                      aria-label="Open date range picker"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "0.375rem",
                        border: "1px solid #e5e7eb",
                        background: "#ffffff",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                      }}
                    >
                      <Calendar
                        style={{
                          height: "1.25rem",
                          width: "1.25rem",
                          color: "#6b7280",
                        }}
                      />
                      <span style={{ fontSize: "0.875rem", color: "#374151" }}>
                        {getRangeLabel()}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent style={{ width: "380px" }}>
                    <div style={{ display: "flex" }}>
                      {/* Left: Quick Ranges */}
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
                                setCustomRange({ from: null, to: null });
                                setRevenueRange("today");
                                setIsPopoverOpen(false);
                              }}
                              style={{
                                width: "100%",
                                textAlign: "left",
                                padding: "0.5rem",
                                borderRadius: "0.375rem",
                                border: "none",
                                background:
                                  revenueRange === "today"
                                    ? "#f3f4f6"
                                    : "transparent",
                                cursor: "pointer",
                                fontSize: "0.875rem",
                              }}
                            >
                              Today
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => {
                                setCustomRange({ from: null, to: null });
                                setRevenueRange("week");
                                setIsPopoverOpen(false);
                              }}
                              style={{
                                width: "100%",
                                textAlign: "left",
                                padding: "0.5rem",
                                borderRadius: "0.375rem",
                                border: "none",
                                background:
                                  revenueRange === "week"
                                    ? "#f3f4f6"
                                    : "transparent",
                                cursor: "pointer",
                                fontSize: "0.875rem",
                              }}
                            >
                              Past Week
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => {
                                setCustomRange({ from: null, to: null });
                                setRevenueRange("month");
                                setIsPopoverOpen(false);
                              }}
                              style={{
                                width: "100%",
                                textAlign: "left",
                                padding: "0.5rem",
                                borderRadius: "0.375rem",
                                border: "none",
                                background:
                                  revenueRange === "month"
                                    ? "#f3f4f6"
                                    : "transparent",
                                cursor: "pointer",
                                fontSize: "0.875rem",
                              }}
                            >
                              Past Month
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => {
                                setCustomRange({ from: null, to: null });
                                setRevenueRange("all");
                                setIsPopoverOpen(false);
                              }}
                              style={{
                                width: "100%",
                                textAlign: "left",
                                padding: "0.5rem",
                                borderRadius: "0.375rem",
                                border: "none",
                                background:
                                  revenueRange === "all"
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
                                setCustomRange({ from: null, to: null });
                                setRevenueRange("all");
                                setIsPopoverOpen(false);
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
                              }}
                            >
                              Reset
                            </button>
                          </li>
                        </ul>
                      </div>

                      {/* Right: react-day-picker range selector */}
                      <div style={{ flex: 1, paddingLeft: "0.75rem" }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium">
                            {new Date().toLocaleString("en-US", {
                              month: "long",
                              year: "numeric",
                            })}
                          </div>
                        </div>

                        <div className="bg-white rounded p-2">
                          <DayPicker
                            mode="range"
                            defaultMonth={new Date()}
                            selected={
                              customRange.from ? customRange : undefined
                            }
                            // disable dates after today so users can't pick a future end date
                            disabled={{ after: todayOnly }}
                            onSelect={(range) => {
                              if (!range) return;
                              if (range?.from) {
                                // clamp end date to todayOnly if user attempted to pick a future date
                                const fromDate = range.from;
                                let toDate = range.to || range.from;
                                // normalize comparison by zeroing time on toDate as DayPicker returns midnight, but compare safely
                                const toCompare = new Date(toDate);
                                toCompare.setHours(0, 0, 0, 0);
                                if (toCompare > todayOnly) {
                                  toDate = new Date(todayOnly);
                                }
                                const sel = {
                                  from: fromDate,
                                  to: toDate,
                                };
                                // only set customRange; do not apply until user clicks Apply
                                setCustomRange(sel);
                              }
                            }}
                          />
                          <div className="flex justify-end gap-2 mt-3">
                            <button
                              className={`px-3 py-1 rounded text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                canApply
                                  ? "bg-green-600 hover:bg-green-700"
                                  : "bg-green-200"
                              }`}
                              onClick={() => {
                                // prevent applying when the selection is not a true range
                                if (!canApply) return;
                                setRevenueRange("custom");
                                setIsPopoverOpen(false);
                              }}
                              disabled={!canApply}
                              aria-disabled={!canApply}
                              title={
                                !canApply
                                  ? "Select a date range (at least two different dates) to apply"
                                  : "Apply selected date range"
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
            <p className="text-sm text-gray-600 mb-6">
              Showing revenue for:{" "}
              <Badge className="bg-green-600 text-white ml-1">
                {getRangeLabel()}
              </Badge>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-green-600">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="text-sm">Total Revenue</p>
                        <p className="text-2xl font-semibold text-green-600">
                          $
                          {totalRevenue.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      {renderPercentageChange(
                        totalRevenue,
                        comparisonData?.totalRevenue
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-teal-600">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <PawPrint className="h-8 w-8 text-teal-600" />
                    <div className="flex-1">
                      <p className="text-sm">Total Animals</p>
                      <p className="text-2xl font-semibold text-teal-600">
                        {formatNumber(totalAnimals)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-yellow-600">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <Users className="h-8 w-8 text-yellow-600" />
                    <div className="flex-1">
                      <p className="text-sm">Total Staff</p>
                      <p className="text-2xl font-semibold text-yellow-600">
                        {formatNumber(totalEmployees)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-600">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <Crown className="h-8 w-8 text-purple-600" />
                    <div className="flex-1">
                      <p className="text-sm">Active Memberships</p>
                      <p className="text-2xl font-semibold text-purple-600">
                        {formatNumber(activeMemb)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Revenue Breakdown */}
        {activeTab === "overview" && (
          <section id="revenue">
            <h2 className="text-2xl mb-6 text-gray-900 flex items-center gap-2">
              <DollarSign className="h-6 w-6" /> Revenue Breakdown
            </h2>
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {revenueBreakdown.map((stat) => {
                    const IconComponent = stat.icon;
                    let comparisonValue = null;
                    if (comparisonData) {
                      switch (stat.category) {
                        case "Tickets":
                          comparisonValue = comparisonData.ticketRevenue;
                          break;
                        case "Memberships":
                          comparisonValue = comparisonData.membershipRevenue;
                          break;
                        case "Gift Shop":
                          comparisonValue = comparisonData.giftShopRevenue;
                          break;
                        case "Food & Beverages":
                          comparisonValue = comparisonData.foodRevenue;
                          break;
                      }
                    }
                    return (
                      <div
                        key={stat.category}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center mb-0">
                              <IconComponent
                                className={`h-10 w-10 ${stat.color.replace(
                                  "bg-",
                                  "text-"
                                )}`}
                              />
                            </div>
                            <div>
                              <h3 className="font-medium mb-1">
                                {stat.category}
                              </h3>
                              <p className="text-lg font-semibold text-green-600">
                                $
                                {stat.amount.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            {renderPercentageChange(
                              stat.amount,
                              comparisonValue
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Interactive Revenue Report Builder */}
        {activeTab === "reports" && (
          <Reports detailedTransactions={allTimeTransactions} />
        )}

        {/* Detailed Transactions Table (restored) */}
        {activeTab === "overview" && (
          <section id="transactions">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl text-gray-900 flex items-center gap-2">
                <Activity className="h-6 w-6" /> Transaction Details
              </h2>
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
                            onCheckedChange={() => toggleColumn("description")}
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
                <div className="flex items-center gap-3">
                  <Label className="text-sm">Source</Label>
                  <Select
                    value={transactionSource}
                    onValueChange={(value) => setTransactionSource(value)}
                  >
                    <SelectTrigger className="w-[220px] cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="No Selection">No Selection</SelectItem>
                      <SelectItem value="All">All</SelectItem>
                      {transactionCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
            <Card>
              <CardContent className="pt-6">
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
                              onClick={() =>
                                toggleTransactionSort("Purchase_ID")
                              }
                            >
                              Purchase ID
                              {transactionSortState.col === "Purchase_ID" && (
                                <span className="ml-1 text-xs">
                                  {transactionSortState.dir === "asc"
                                    ? "▲"
                                    : "▼"}
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
                                  {transactionSortState.dir === "asc"
                                    ? "▲"
                                    : "▼"}
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
                                  {transactionSortState.dir === "asc"
                                    ? "▲"
                                    : "▼"}
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
                                  {transactionSortState.dir === "asc"
                                    ? "▲"
                                    : "▼"}
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
                                  {transactionSortState.dir === "asc"
                                    ? "▲"
                                    : "▼"}
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
                                  {transactionSortState.dir === "asc"
                                    ? "▲"
                                    : "▼"}
                                </span>
                              )}
                            </TableHead>
                          )}
                          {visibleColumns.unitPrice && (
                            <TableHead
                              className="text-right cursor-pointer select-none hover:bg-gray-50"
                              onClick={() =>
                                toggleTransactionSort("Unit_Price")
                              }
                            >
                              Unit Price
                              {transactionSortState.col === "Unit_Price" && (
                                <span className="ml-1 text-xs">
                                  {transactionSortState.dir === "asc"
                                    ? "▲"
                                    : "▼"}
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
                                  {transactionSortState.dir === "asc"
                                    ? "▲"
                                    : "▼"}
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
                              {transactionSortState.col ===
                                "Payment_Method" && (
                                <span className="ml-1 text-xs">
                                  {transactionSortState.dir === "asc"
                                    ? "▲"
                                    : "▼"}
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
                              {transactionSource === "No Selection"
                                ? "Please select a source to view transactions"
                                : "No transactions found for the selected date range"}
                            </TableCell>
                          </TableRow>
                        ) : (
                          displayedTransactions.map((transaction, index) => (
                            <TableRow
                              key={`${transaction.Purchase_ID}-${index}`}
                            >
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
                                  $
                                  {parseFloat(transaction.Unit_Price).toFixed(
                                    2
                                  )}
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
                      ? (transactionCurrentPage - 1) * transactionItemsPerPage +
                        1
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
          </section>
        )}

        {/* Ticket Sales merged into Pricing Management below */}

        {/* Revenue Analytics Charts */}
        {activeTab === "overview" && (
          <section id="analytics">
            <h2 className="text-2xl mb-6 text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-6 w-6" /> Visual Analytics
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart - Ticket Stats */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50">
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-green-600" />
                    Ticket Sales Analysis
                  </CardTitle>
                  <CardDescription>
                    Breakdown of tickets sold by category
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={340}>
                    <BarChart
                      data={ticketStats}
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient
                          id="ticketGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0.3}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="type"
                        stroke="#6b7280"
                        style={{ fontSize: "0.875rem" }}
                      />
                      <YAxis
                        allowDecimals={false}
                        domain={[0, ticketMax]}
                        stroke="#6b7280"
                        style={{ fontSize: "0.875rem" }}
                        label={{
                          value: "Tickets Sold",
                          angle: -90,
                          position: "insideLeft",
                          style: { fill: "#6b7280", fontSize: "0.875rem" },
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "0.5rem",
                        }}
                        formatter={(value) => [`${value} tickets`, "Sold"]}
                      />
                      <Bar
                        dataKey="sold"
                        fill="url(#ticketGradient)"
                        name="Tickets Sold"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Pie Chart */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    Revenue Distribution
                  </CardTitle>
                  <CardDescription>
                    Revenue breakdown by source category
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <ResponsiveContainer width="100%" height={340}>
                    <PieChart>
                      <Pie
                        data={revenueBreakdown
                          .filter((item) => item.amount > 0)
                          .map((item) => ({
                            name: item.category,
                            value: item.amount,
                          }))}
                        cx="50%"
                        cy="50%"
                        labelLine={{ stroke: "#6b7280", strokeWidth: 1 }}
                        label={({ name, percent }) => {
                          if (!percent || percent === 0) return null;
                          return `${name} ${(percent * 100).toFixed(1)}%`;
                        }}
                        outerRadius={100}
                        innerRadius={45}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {revenueBreakdown
                          .filter((item) => item.amount > 0)
                          .map((item, index) => {
                            const cat = (item.category || "").toLowerCase();
                            let fill = "#6b7280";
                            if (cat.includes("ticket"))
                              fill = "#10b981"; // Tickets - green
                            else if (cat.includes("gift"))
                              fill = "#3b82f6"; // Gift Shop - blue
                            else if (
                              cat.includes("food") ||
                              cat.includes("beverage")
                            )
                              fill = "#ea580c";
                            // Food - orange (darker, matches bg-orange-600)
                            else if (cat.includes("membership"))
                              fill = "#9333ea"; // Membership - purple

                            return <Cell key={`cell-${index}`} fill={fill} />;
                          })}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "0.5rem",
                        }}
                        formatter={(value) => [
                          `$${value.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`,
                          "Revenue",
                        ]}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ fontSize: "0.875rem" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Pricing Management */}
        {activeTab === "overview" && (
          <section id="pricing">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl text-gray-900 flex items-center gap-2">
                <Ticket className="h-6 w-6" /> Tickets Sold & Pricing
              </h2>
            </div>

            <Card>
              <CardContent className="pt-6">
                {/* Ticket sales stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {ticketStats.map((stat) => (
                    <div
                      key={stat.type}
                      className="text-center p-3 bg-green-50 rounded-lg"
                    >
                      <p className="text-sm mb-1">{stat.type}</p>
                      <p className="text-xl font-semibold text-green-600">
                        {formatNumber(stat.sold)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Ticket Prices */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg text-green-700 flex items-center gap-2">
                        <Ticket className="h-5 w-5" />
                        Day Pass Tickets
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {Object.entries(ticketPrices).map(([type, price]) => (
                        <div
                          key={type}
                          className="flex items-center justify-between p-4 rounded-xl"
                          style={{
                            background:
                              "linear-gradient(90deg, #d1fae5 0%, #ecfdf5 100%)",
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-gray-800 font-medium capitalize">
                              {type}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-green-700 text-lg">
                              ${price.toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleTicketDialogOpen(true, type)}
                              className="p-1 rounded text-green-700 cursor-pointer"
                              aria-label={`Edit ${type} ticket price`}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Membership Price */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg text-purple-700 flex items-center gap-2">
                        <Crown className="h-5 w-5" />
                        Annual Membership
                      </h3>
                    </div>
                    <div
                      className="p-6 rounded-xl"
                      style={{
                        background:
                          "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 50%, #fbcfe8 100%)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-800 font-semibold text-lg">
                          Annual Membership
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-purple-700 text-2xl">
                            ${membershipPrice.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleMembershipDialogOpen(true)}
                            className="p-1 rounded text-purple-700 cursor-pointer"
                            aria-label="Edit membership price"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 bg-white/50 p-2 rounded-lg">
                        Unlimited year-round access + benefits
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ticket Pricing Dialog (individual passes) */}
            {isTicketPricingOpen && (
              <Dialog
                open={true}
                onOpenChange={(open) => handleTicketDialogOpen(open)}
              >
                <DialogContent className="max-w-2xl">
                  {isTicketContentVisible && (
                    <>
                      <DialogHeader>
                        <DialogTitle>Manage Ticket Prices</DialogTitle>
                        <DialogDescription>
                          Update individual pass prices. Changes apply
                          immediately.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        {selectedTicketType ? (
                          <div className="space-y-2">
                            <Label
                              htmlFor={`ticket-${selectedTicketType}`}
                              className="text-gray-700"
                            >
                              {selectedTicketType} Ticket
                            </Label>
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">$</span>
                                <Input
                                  id={`ticket-${selectedTicketType}`}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={
                                    tempTicketPrices[selectedTicketType] ?? 0
                                  }
                                  onChange={(e) =>
                                    setTempTicketPrices((prev) => ({
                                      ...prev,
                                      [selectedTicketType]:
                                        parseFloat(e.target.value) || 0,
                                    }))
                                  }
                                  className="w-40"
                                />
                              </div>
                              <Button
                                onClick={handleTicketSave}
                                className="bg-green-600 hover:bg-green-700 cursor-pointer"
                                disabled={isSaving || !selectedTicketChanged}
                              >
                                <Save className="h-4 w-4 mr-2" />
                                {isSaving ? "Saving..." : "Save"}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          Object.entries(tempTicketPrices).map(
                            ([type, price]) => (
                              <div key={type} className="space-y-2">
                                <Label
                                  htmlFor={`ticket-${type}`}
                                  className="text-gray-700"
                                >
                                  {type} Ticket
                                </Label>
                                <div className="flex items-center space-x-2">
                                  <span className="text-gray-600">$</span>
                                  <Input
                                    id={`ticket-${type}`}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={price}
                                    onChange={(e) =>
                                      setTempTicketPrices((prev) => ({
                                        ...prev,
                                        [type]: parseFloat(e.target.value) || 0,
                                      }))
                                    }
                                    className="flex-1"
                                  />
                                </div>
                              </div>
                            )
                          )
                        )}
                      </div>

                      {!selectedTicketType && (
                        <div className="flex justify-end mt-4">
                          <Button
                            onClick={handleTicketSave}
                            className="bg-green-600 hover:bg-green-700 cursor-pointer"
                            disabled={isSaving || !ticketPricesChanged}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {isSaving ? "Saving..." : "Save"}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </DialogContent>
              </Dialog>
            )}

            {/* Membership Pricing Dialog (individual) */}
            <Dialog
              open={isMembershipPricingOpen}
              onOpenChange={(open) => handleMembershipDialogOpen(open)}
            >
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Manage Membership Price</DialogTitle>
                  <DialogDescription>
                    Update the annual membership price.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                  <Label
                    htmlFor="membership-price-inline"
                    className="text-gray-700"
                  >
                    Annual Membership
                  </Label>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">$</span>
                      <Input
                        id="membership-price-inline"
                        type="number"
                        step="0.01"
                        min="0"
                        value={tempMembershipPrice}
                        onChange={(e) =>
                          setTempMembershipPrice(
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-40"
                      />
                    </div>
                    <Button
                      onClick={handleMembershipSave}
                      className="bg-green-600 hover:bg-green-700 cursor-pointer"
                      disabled={isSaving || !membershipChanged}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </section>
        )}

        {activeTab === "operations" && (
          <Operations
            allLocations={allLocations}
            allEmployees={allEmployees}
            getZoneEmployees={getZoneEmployees}
            abbreviateNorth={abbreviateNorth}
            formatDate={formatDate}
            setViewZoneEmployees={setViewZoneEmployees}
            viewZoneEmployees={viewZoneEmployees}
            setSelectedZone={setSelectedZone}
            setIsManageZoneOpen={setIsManageZoneOpen}
            setSupervisorSearch={setSupervisorSearch}
            allJobTitles={allJobTitles}
            salaries={salaries}
            handleJobSalaryDialogOpen={handleJobSalaryDialogOpen}
            isJobSalaryOpen={isJobSalaryOpen}
            selectedJobId={selectedJobId}
            tempJobSalary={tempJobSalary}
            setTempJobSalary={setTempJobSalary}
            handleJobSalarySave={handleJobSalarySave}
            isSaving={isSaving}
            staffSearch={staffSearch}
            setStaffSearch={setStaffSearch}
            staffJobFilter={staffJobFilter}
            setStaffJobFilter={setStaffJobFilter}
            sortedEmployees={sortedEmployees}
            isSupervisor={isSupervisor}
            getEmployeeTitle={getEmployeeTitle}
            getEmployeeZone={getEmployeeZone}
            setEditingEmployee={setEditingEmployee}
            setDeleteConfirmEmployee={setDeleteConfirmEmployee}
            isManageZoneOpen={isManageZoneOpen}
            selectedZone={selectedZone}
            supervisorSearch={supervisorSearch}
            filteredEmployeesForSupervisor={filteredEmployeesForSupervisor}
            setPendingSupervisor={setPendingSupervisor}
            handleAssignSupervisor={handleAssignSupervisor}
            deleteConfirmEmployee={deleteConfirmEmployee}
            handleDeleteEmployee={handleDeleteEmployee}
            pendingSupervisor={pendingSupervisor}
            editingEmployee={editingEmployee}
            handleUpdateEmployee={handleUpdateEmployee}
            EditEmployeeDialog={EditEmployeeDialog}
            isAddEmployeeOpen={isAddEmployeeOpen}
            setIsAddEmployeeOpen={setIsAddEmployeeOpen}
            handleAddEmployee={handleAddEmployee}
            AddEmployeeDialog={AddEmployeeDialog}
          />
        )}

        {activeTab === "assets" && (
          <Assets
            allExhibitsDB={allExhibitsDB}
            formatTime={formatTime}
            handleManageActivities={handleManageActivities}
            setEditingExhibit={setEditingExhibit}
            isSaving={isSaving}
            totalAnimals={totalAnimals}
            isAddAnimalOpen={isAddAnimalOpen}
            setIsAddAnimalOpen={setIsAddAnimalOpen}
            handleAddAnimal={handleAddAnimal}
            AddAnimalDialog={AddAnimalDialog}
            allEnclosures={allEnclosures}
            animalExhibitFilter={animalExhibitFilter}
            setAnimalExhibitFilter={setAnimalExhibitFilter}
            animalSearch={animalSearch}
            setAnimalSearch={setAnimalSearch}
            animalsByExhibit={animalsByExhibit}
            formatDate={formatDate}
            setEditingAnimal={setEditingAnimal}
            animalVisibleColumns={animalVisibleColumns}
            toggleAnimalColumn={toggleAnimalColumn}
            healthZoneFilter={healthZoneFilter}
            setHealthZoneFilter={setHealthZoneFilter}
            healthEnclosureFilter={healthEnclosureFilter}
            setHealthEnclosureFilter={setHealthEnclosureFilter}
            genderFilter={genderFilter}
            setGenderFilter={setGenderFilter}
            ageFilter={ageFilter}
            setAgeFilter={setAgeFilter}
            allLocations={allLocations}
            allAnimalsDB={allAnimalsDB}
            animalSortState={animalSortState}
            toggleAnimalSort={toggleAnimalSort}
            enclosureMap={enclosureMap}
            displayedAnimals={displayedAnimals}
            animalCurrentPage={animalCurrentPage}
            animalItemsPerPage={animalItemsPerPage}
            animalTotalPages={animalTotalPages}
            animalPaginationArray={animalPaginationArray}
            handleAnimalPageChange={handleAnimalPageChange}
          />
        )}

        {/* Edit Exhibit Dialog */}
        <EditExhibitDialog
          exhibit={editingExhibit}
          isOpen={editingExhibit !== null}
          onOpenChange={(open) => !open && setEditingExhibit(null)}
          onUpdate={handleUpdateExhibit}
          onRemoveImage={handleRemoveExhibitImage}
          locations={allLocations}
          isSaving={isSaving}
        />

        {/* Edit Animal Dialog */}
        <EditAnimalDialog
          animal={editingAnimal}
          isOpen={editingAnimal !== null}
          onOpenChange={(open) => !open && setEditingAnimal(null)}
          onUpdate={handleUpdateAnimal}
          onDelete={(animal) => {
            setEditingAnimal(null);
            setDeleteConfirmAnimal(animal);
          }}
          onRemoveImage={handleRemoveAnimalImage}
          enclosures={allEnclosures}
          isSaving={isSaving}
        />

        {/* Activity Management Dialog */}
        <ActivityManagementDialog
          isOpen={isActivityDialogOpen}
          onOpenChange={setIsActivityDialogOpen}
          exhibit={selectedExhibitForActivities}
          activities={exhibitActivities}
          onSaveActivity={handleSaveActivity}
          onDeleteActivity={handleDeleteActivity}
          isSaving={isSaving}
        />

        {/* Delete Animal Confirmation Dialog */}
        <AlertDialog
          open={deleteConfirmAnimal !== null}
          onOpenChange={() => setDeleteConfirmAnimal(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Animal</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{" "}
                <strong>{deleteConfirmAnimal?.Animal_Name}</strong> (
                {deleteConfirmAnimal?.Species}) from the zoo? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="cursor-pointer" disabled={isSaving}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  deleteConfirmAnimal && handleDeleteAnimal(deleteConfirmAnimal)
                }
                className="bg-red-600 hover:bg-red-700 cursor-pointer"
                disabled={isSaving}
              >
                <PawPrint className="h-4 w-4 mr-2" />
                {isSaving ? "Deleting..." : "Delete Animal"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// Add Employee Dialog Component
function AddEmployeeDialog({
  isOpen,
  onOpenChange,
  onAdd,
  allEmployees,
  allJobTitles,
  salaries,
  isSaving,
}) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    birthdate: "",
    sex: "M",
    jobId: "3",
    email: "",
    address: "",
    zone: "A",
  });
  const [birthdateError, setBirthdateError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
    setFormData({
      firstName: "",
      lastName: "",
      birthdate: "",
      sex: "M",
      jobId: "3",
      email: "",
      address: "",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700 cursor-pointer">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Add a new employee to the WildWood Zoo staff. Salary will be set
            based on job type.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="jobId">Job Title *</Label>
              <Select
                value={formData.jobId}
                onValueChange={(value) =>
                  setFormData({ ...formData, jobId: value })
                }
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allJobTitles
                    .filter((j) => j.Job_ID !== 1 && j.Job_ID !== 2)
                    .map((job) => (
                      <SelectItem
                        key={job.Job_ID}
                        value={job.Job_ID.toString()}
                      >
                        {job.Title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="birthdate">Birthdate *</Label>
                <Input
                  id="birthdate"
                  type="date"
                  value={formData.birthdate}
                  onChange={(e) => {
                    const dateValue = e.target.value;
                    setBirthdateError(""); // Clear error on change

                    // Store the value regardless of validation
                    setFormData({ ...formData, birthdate: dateValue });

                    // Only validate if we have input and it's a complete date
                    if (!dateValue) return;

                    // Split the date value to check year specifically
                    const [year, month, day] = dateValue.split("-");

                    // Only validate if we have a complete 4-digit year and complete date
                    if (
                      year &&
                      year.length === 4 &&
                      month &&
                      month.length === 2 &&
                      day &&
                      day.length === 2
                    ) {
                      const selectedDate = new Date(dateValue);
                      // Validate that it's a real date (not Invalid Date)
                      if (isNaN(selectedDate.getTime())) return;

                      const today = new Date();
                      const minDate = new Date();
                      const maxDate = new Date();

                      // Set min date (70 years ago)
                      minDate.setFullYear(today.getFullYear() - 70);
                      // Set max date (18 years ago)
                      maxDate.setFullYear(today.getFullYear() - 18);

                      if (selectedDate > maxDate) {
                        setBirthdateError(
                          "Employee must be at least 18 years old"
                        );
                        return;
                      }
                      if (selectedDate < minDate) {
                        setBirthdateError(
                          "Employee must be under 70 years old"
                        );
                        return;
                      }
                    }
                  }}
                  min={
                    new Date(
                      new Date().setFullYear(new Date().getFullYear() - 70)
                    )
                      .toISOString()
                      .split("T")[0]
                  }
                  max={
                    new Date(
                      new Date().setFullYear(new Date().getFullYear() - 18)
                    )
                      .toISOString()
                      .split("T")[0]
                  }
                  className={birthdateError ? "border-red-500" : ""}
                  required
                  onInvalid={(e) => e.preventDefault()}
                />
                {birthdateError && (
                  <p className="text-xs text-red-600 mt-0.5">
                    {birthdateError}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="sex">Sex *</Label>
                <Select
                  value={formData.sex}
                  onValueChange={(value) =>
                    setFormData({ ...formData, sex: value })
                  }
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Male</SelectItem>
                    <SelectItem value="F">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                placeholder="123 Main St, City, State ZIP"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="zone">Zone Assignment *</Label>
              <Select
                value={formData.zone}
                onValueChange={(value) =>
                  setFormData({ ...formData, zone: value })
                }
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["A", "B", "C", "D"].map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      Zone {zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 cursor-pointer"
              disabled={isSaving}
            >
              {isSaving ? "Adding..." : "Add Employee"}
            </Button>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Edit Employee Dialog Component
function EditEmployeeDialog({
  employee,
  isOpen,
  onOpenChange,
  onUpdate,
  allJobTitles,
  allLocations,
  salaries,
  isSaving,
}) {
  // Helper function to format date for input[type="date"]
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";

    // Parse the date string manually to avoid timezone issues
    // Remove 'T' and treat as local date (YYYY-MM-DD or YYYY-MM-DD HH:mm:ss)
    let dateStr = dateString.replace("T", " ").split(" ")[0]; // Get just the date part

    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // Otherwise parse manually to avoid UTC conversion
    const parts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!parts) return "";

    return `${parts[1]}-${parts[2]}-${parts[3]}`;
  };

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    birthdate: "",
    sex: "M",
    jobId: "3",
    email: "",
    address: "",
    zone: "A",
  });
  const [birthdateError, setBirthdateError] = useState("");
  const [originalData, setOriginalData] = useState(null);

  // Check if any field has changed
  const hasChanges = useMemo(() => {
    if (!originalData) return false;

    return (
      formData.firstName !== originalData.firstName ||
      formData.lastName !== originalData.lastName ||
      formData.birthdate !== originalData.birthdate ||
      formData.sex !== originalData.sex ||
      formData.jobId !== originalData.jobId ||
      formData.email !== originalData.email ||
      formData.address !== originalData.address ||
      formData.zone !== originalData.zone
    );
  }, [formData, originalData]);

  // Update form data when employee changes
  useEffect(() => {
    if (employee) {
      // Determine the employee's zone from their assigned location or explicit Zone
      const locationMatch = allLocations.find(
        (loc) => loc.Location_ID === employee.Location_ID
      );
      const employeeZone = locationMatch?.Zone || employee.Zone || ""; // default to empty so edits are detected

      const initialData = {
        firstName: employee.First_Name,
        lastName: employee.Last_Name,
        birthdate: formatDateForInput(employee.Birthdate),
        sex: employee.Sex,
        jobId: employee.Job_ID.toString(),
        email: employee.Email,
        address: employee.Address,
        zone: employeeZone,
      };
      setFormData(initialData);
      setOriginalData(initialData);
      setBirthdateError("");
    }
  }, [employee, allLocations]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (birthdateError) return;
    onUpdate(employee.Employee_ID, formData);
  };

  if (!employee) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>
            Update information for {employee.First_Name} {employee.Last_Name}.
            Salary will be updated based on job type.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editFirstName">First Name *</Label>
                <Input
                  id="editFirstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="editLastName">Last Name *</Label>
                <Input
                  id="editLastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="editEmail">Email *</Label>
              <Input
                id="editEmail"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="editJobId">Job Title *</Label>
              <Select
                value={formData.jobId}
                onValueChange={(value) =>
                  setFormData({ ...formData, jobId: value })
                }
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allJobTitles
                    .filter((j) => j.Job_ID !== 1 && j.Job_ID !== 2)
                    .map((job) => (
                      <SelectItem
                        key={job.Job_ID}
                        value={job.Job_ID.toString()}
                      >
                        {job.Title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editBirthdate">Birthdate *</Label>
                <Input
                  id="editBirthdate"
                  type="date"
                  value={formData.birthdate}
                  onChange={(e) => {
                    const dateValue = e.target.value;
                    setBirthdateError("");

                    setFormData({ ...formData, birthdate: dateValue });

                    if (!dateValue) return;

                    const [year, month, day] = dateValue.split("-");

                    if (
                      year &&
                      year.length === 4 &&
                      month &&
                      month.length === 2 &&
                      day &&
                      day.length === 2
                    ) {
                      const selectedDate = new Date(dateValue);
                      if (isNaN(selectedDate.getTime())) return;

                      const today = new Date();
                      const minDate = new Date();
                      const maxDate = new Date();

                      minDate.setFullYear(today.getFullYear() - 70);
                      maxDate.setFullYear(today.getFullYear() - 18);

                      if (selectedDate > maxDate) {
                        setBirthdateError(
                          "Employee must be at least 18 years old"
                        );
                        return;
                      }
                      if (selectedDate < minDate) {
                        setBirthdateError(
                          "Employee must be under 70 years old"
                        );
                        return;
                      }
                    }
                  }}
                  min={
                    new Date(
                      new Date().setFullYear(new Date().getFullYear() - 70)
                    )
                      .toISOString()
                      .split("T")[0]
                  }
                  max={
                    new Date(
                      new Date().setFullYear(new Date().getFullYear() - 18)
                    )
                      .toISOString()
                      .split("T")[0]
                  }
                  className={birthdateError ? "border-red-500" : ""}
                  required
                  onInvalid={(e) => e.preventDefault()}
                />
                {birthdateError && (
                  <p className="text-xs text-red-600 mt-0.5">
                    {birthdateError}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="editSex">Sex *</Label>
                <Select
                  value={formData.sex}
                  onValueChange={(value) =>
                    setFormData({ ...formData, sex: value })
                  }
                >
                  <SelectTrigger className="cursor-pointer">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Male</SelectItem>
                    <SelectItem value="F">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="editAddress">Address *</Label>
              <Input
                id="editAddress"
                placeholder="123 Main St, City, State ZIP"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="editZone">Zone Assignment *</Label>
              <Select
                value={formData.zone}
                onValueChange={(value) =>
                  setFormData({ ...formData, zone: value })
                }
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["A", "B", "C", "D"].map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      Zone {zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              disabled={!hasChanges || isSaving}
              className="w-full bg-blue-600 hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Add Animal Dialog Component
function AddAnimalDialog({
  isOpen,
  onOpenChange,
  onAdd,
  enclosures,
  isSaving,
}) {
  const [formData, setFormData] = useState({
    name: "",
    species: "",
    gender: "M",
    weight: "",
    birthday: "",
    enclosureId: "1",
    imageFile: null,
    healthStatus: "Good",
    feedingFrequency: "Daily",
    meals: "2",
  });
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, imageFile: file });
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Basic client-side validation
    if (!formData.name.trim() || !formData.species.trim()) {
      toast.error("Please provide animal name and species");
      return;
    }
    // Block negative weights at submission time — zero is allowed if the caller permits it
    if (formData.weight && Number(formData.weight) < 0) {
      toast.error("Weight cannot be negative");
      return;
    }
    if (formData.birthday) {
      const b = new Date(formData.birthday);
      const now = new Date();
      if (isNaN(b.getTime()) || b > now) {
        toast.error("Birthday must be a valid date in the past");
        return;
      }
    }

    onAdd(formData);
    setFormData({
      name: "",
      species: "",
      gender: "M",
      weight: "",
      birthday: "",
      enclosureId: "1",
      imageFile: null,
      healthStatus: "Good",
      feedingFrequency: "Daily",
      meals: "2",
    });
    setImagePreview(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-teal-600 hover:bg-teal-700 cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          Add Animal
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Animal</DialogTitle>
          <DialogDescription>
            Add a new animal to the WildWood Zoo collection.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="animalName">Animal Name *</Label>
              <Input
                id="animalName"
                placeholder="e.g., Luna"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="species">Species *</Label>
              <Input
                id="species"
                placeholder="e.g., African Elephant"
                value={formData.species}
                onChange={(e) =>
                  setFormData({ ...formData, species: e.target.value })
                }
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="animalGender">Gender *</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) =>
                  setFormData({ ...formData, gender: value })
                }
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                  <SelectItem value="U">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="weight">Weight (lbs) *</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="e.g., 250"
                value={formData.weight}
                min="0"
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") {
                    setFormData({ ...formData, weight: "" });
                    return;
                  }
                  const n = Number(v);
                  if (!Number.isNaN(n)) {
                    // Clamp negative values up to 0 so negative input is not retained
                    setFormData({
                      ...formData,
                      weight: String(Math.max(0, n)),
                    });
                  } else {
                    setFormData({ ...formData, weight: v });
                  }
                }}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="healthStatus">Health Status</Label>
              <Select
                value={formData.healthStatus}
                onValueChange={(value) =>
                  setFormData({ ...formData, healthStatus: value })
                }
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Excellent">Excellent</SelectItem>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Fair">Fair</SelectItem>
                  <SelectItem value="Needs Attention">
                    Needs Attention
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Vaccinated input removed per UI request */}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="feedingFrequency">Feeding Frequency</Label>
              <Select
                value={formData.feedingFrequency}
                onValueChange={(value) => {
                  // adjust default meals for common frequencies
                  const defaultMeals = value === "Daily" ? "2" : "1";
                  setFormData({
                    ...formData,
                    feedingFrequency: value,
                    meals: defaultMeals,
                  });
                }}
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Daily">Daily</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Bi-Weekly">Bi-Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="meals">Meals per cycle</Label>
              <Input
                id="meals"
                type="number"
                min="1"
                value={formData.meals}
                onChange={(e) =>
                  setFormData({ ...formData, meals: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="birthday">Birthday *</Label>
              <Input
                id="birthday"
                type="date"
                value={formData.birthday}
                onChange={(e) =>
                  setFormData({ ...formData, birthday: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="enclosureId">Habitat *</Label>
              <Select
                value={formData.enclosureId}
                onValueChange={(value) =>
                  setFormData({ ...formData, enclosureId: value })
                }
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {enclosures.map((enc) => (
                    <SelectItem
                      key={enc.Enclosure_ID}
                      value={enc.Enclosure_ID.toString()}
                    >
                      {enc.Enclosure_Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="animalImage">Animal Photo (Optional)</Label>
            <Input
              id="animalImage"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            <p className="text-sm text-gray-500 mt-1">
              Upload a photo of this animal.
            </p>
            {imagePreview && (
              <div className="relative inline-block mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={() => {
                    setImagePreview(null);
                    setFormData({ ...formData, imageFile: null });
                    // Clear the file input
                    const fileInput = document.getElementById("animalImage");
                    if (fileInput) fileInput.value = "";
                  }}
                  title="Remove image"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-teal-600 hover:bg-teal-700 cursor-pointer"
            disabled={isSaving}
          >
            {isSaving ? "Adding..." : "Add Animal"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Animal Dialog Component
function EditAnimalDialog({
  animal,
  isOpen,
  onOpenChange,
  onUpdate,
  onDelete,
  onRemoveImage,
  enclosures,
  isSaving,
}) {
  // Helper function to format date for input[type="date"]
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";

    // Parse the date string manually to avoid timezone issues
    // Remove 'T' and treat as local date (YYYY-MM-DD or YYYY-MM-DD HH:mm:ss)
    let dateStr = dateString.replace("T", " ").split(" ")[0]; // Get just the date part

    // If already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // Otherwise parse manually to avoid UTC conversion
    const parts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!parts) return "";

    return `${parts[1]}-${parts[2]}-${parts[3]}`;
  };

  const [formData, setFormData] = useState({
    name: animal?.Animal_Name || "",
    species: animal?.Species || "",
    gender: animal?.Gender || "M",
    weight: animal?.Weight?.toString() || "",
    birthday: formatDateForInput(animal?.Birthday) || "",
    enclosureId: animal?.Enclosure_ID?.toString() || "1",
    imageFile: null,
    removeImage: false, // Track if image should be removed
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [originalData, setOriginalData] = useState(null);

  // Check if any field has changed
  const hasChanges = useMemo(() => {
    if (!originalData) return false;

    const textFieldsChanged =
      formData.name !== originalData.name ||
      formData.species !== originalData.species ||
      formData.gender !== originalData.gender ||
      formData.weight !== originalData.weight ||
      formData.birthday !== originalData.birthday ||
      formData.enclosureId !== originalData.enclosureId;

    const imageChanged =
      formData.imageFile !== null || formData.removeImage === true;

    return textFieldsChanged || imageChanged;
  }, [formData, originalData]);

  // Update form data when animal changes
  useEffect(() => {
    if (animal) {
      const initialData = {
        name: animal.Animal_Name,
        species: animal.Species,
        gender: animal.Gender,
        weight: animal.Weight.toString(),
        birthday: formatDateForInput(animal.Birthday),
        enclosureId: animal.Enclosure_ID.toString(),
        imageFile: null,
        removeImage: false,
      };
      setFormData(initialData);
      setOriginalData(initialData);
      setImagePreview(null);
    }
  }, [animal]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, imageFile: file, removeImage: false });
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCurrentImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Mark image for removal - will be removed when user saves
    setFormData({ ...formData, removeImage: true, imageFile: null });
    setImagePreview(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Prevent negative weights on edit
    if (formData.weight && Number(formData.weight) < 0) {
      toast.error("Weight cannot be negative");
      return;
    }

    onUpdate(formData);
  };

  if (!animal) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Animal</DialogTitle>
          <DialogDescription>
            Update information for {animal.Animal_Name}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editAnimalName">Animal Name *</Label>
              <Input
                id="editAnimalName"
                placeholder="e.g., Luna"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="editSpecies">Species *</Label>
              <Input
                id="editSpecies"
                placeholder="e.g., African Elephant"
                value={formData.species}
                onChange={(e) =>
                  setFormData({ ...formData, species: e.target.value })
                }
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editAnimalGender">Gender *</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) =>
                  setFormData({ ...formData, gender: value })
                }
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                  <SelectItem value="U">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="editWeight">Weight (lbs) *</Label>
              <Input
                id="editWeight"
                type="number"
                step="0.1"
                placeholder="e.g., 250"
                value={formData.weight}
                min="0"
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") {
                    setFormData({ ...formData, weight: "" });
                    return;
                  }
                  const n = Number(v);
                  if (!Number.isNaN(n)) {
                    setFormData({
                      ...formData,
                      weight: String(Math.max(0, n)),
                    });
                  } else {
                    setFormData({ ...formData, weight: v });
                  }
                }}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editBirthday">Birthday *</Label>
              <Input
                id="editBirthday"
                type="date"
                value={formData.birthday}
                onChange={(e) =>
                  setFormData({ ...formData, birthday: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="editEnclosureId">Habitat *</Label>
              <Select
                value={formData.enclosureId}
                onValueChange={(value) =>
                  setFormData({ ...formData, enclosureId: value })
                }
              >
                <SelectTrigger className="cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {enclosures.map((enc) => (
                    <SelectItem
                      key={enc.Enclosure_ID}
                      value={enc.Enclosure_ID.toString()}
                    >
                      {enc.Enclosure_Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {animal?.Image_URL && !imagePreview && !formData.removeImage && (
            <div>
              <Label>Current Image</Label>
              <div className="flex items-center gap-3 mt-2">
                <img
                  src={animal.Image_URL}
                  alt={animal.Animal_Name}
                  className="h-32 w-32 object-cover rounded border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="h-8 w-8 rounded-full p-0"
                  onClick={handleRemoveCurrentImage}
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          <div>
            <Label htmlFor="editAnimalImage">
              {animal?.Image_URL && !formData.removeImage
                ? "Change Image"
                : "Add Animal Photo"}
            </Label>
            <Input
              id="editAnimalImage"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            <p className="text-sm text-gray-500 mt-1">
              Upload a new photo for this animal (JPG, PNG, WebP - max 5MB).
              {animal?.Image_URL && !formData.removeImage
                ? " Leave empty to keep current image."
                : ""}
            </p>
            {imagePreview && (
              <div className="flex items-center gap-3 mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="h-8 w-8 rounded-full p-0"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setImagePreview(null);
                    setFormData({ ...formData, imageFile: null });
                    // Clear the file input
                    const fileInput =
                      document.getElementById("editAnimalImage");
                    if (fileInput) fileInput.value = "";
                  }}
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={!hasChanges || isSaving}
              className="flex-1 bg-teal-600 hover:bg-teal-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="bg-red-50 border-red-300 text-red-600 hover:bg-red-100 cursor-pointer"
              onClick={() => onDelete(animal)}
              disabled={isSaving}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Animal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Activity Management Dialog Component
function ActivityManagementDialog({
  isOpen,
  onOpenChange,
  exhibit,
  activities,
  onSaveActivity,
  onDeleteActivity,
  isSaving,
}) {
  const [activity1Name, setActivity1Name] = useState("");
  const [activity1Description, setActivity1Description] = useState("");
  const [activity1Duration, setActivity1Duration] = useState(30);
  const [activity2Name, setActivity2Name] = useState("");
  const [activity2Description, setActivity2Description] = useState("");
  const [activity2Duration, setActivity2Duration] = useState(30);
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    if (activities && activities.length > 0) {
      const act1 = activities.find((a) => a.Activity_Order === 1);
      const act2 = activities.find((a) => a.Activity_Order === 2);

      setActivity1Name(act1?.Activity_Name || "");
      setActivity1Description(act1?.Activity_Description || "");
      setActivity1Duration(act1?.Duration || 30);
      setActivity2Name(act2?.Activity_Name || "");
      setActivity2Description(act2?.Activity_Description || "");
      setActivity2Duration(act2?.Duration || 30);
    } else {
      setActivity1Name("");
      setActivity1Description("");
      setActivity1Duration(30);
      setActivity2Name("");
      setActivity2Description("");
      setActivity2Duration(30);
    }
  }, [activities]);

  const handleSave1 = (e) => {
    e.preventDefault();
    if (
      activity1Name.trim() &&
      activity1Duration > 0 &&
      activity1Duration <= 90
    ) {
      onSaveActivity(1, activity1Name, activity1Description, activity1Duration);
    }
  };

  const handleSave2 = (e) => {
    e.preventDefault();
    if (
      activity2Name.trim() &&
      activity2Duration > 0 &&
      activity2Duration <= 90
    ) {
      onSaveActivity(2, activity2Name, activity2Description, activity2Duration);
    }
  };

  const handleDelete1 = () => {
    const act1 = activities.find((a) => a.Activity_Order === 1);
    if (act1) {
      // open custom confirmation dialog
      setPendingDelete({ id: act1.Activity_ID, name: act1.Activity_Name });
    }
  };

  const handleDelete2 = () => {
    const act2 = activities.find((a) => a.Activity_Order === 2);
    if (act2) {
      // open custom confirmation dialog
      setPendingDelete({ id: act2.Activity_ID, name: act2.Activity_Name });
    }
  };

  const activity1Exists = activities.some((a) => a.Activity_Order === 1);
  const activity2Exists = activities.some((a) => a.Activity_Order === 2);

  // Find original activity objects for comparison to detect changes
  const act1 = activities.find((a) => a.Activity_Order === 1);
  const act2 = activities.find((a) => a.Activity_Order === 2);

  const isActivity1Dirty = useMemo(() => {
    if (!activity1Exists) {
      return (
        activity1Name.trim() && activity1Duration > 0 && activity1Duration <= 90
      );
    }
    return (
      activity1Name.trim() !== (act1?.Activity_Name || "") ||
      activity1Description !== (act1?.Activity_Description || "") ||
      Number(activity1Duration) !== Number(act1?.Duration ?? 30)
    );
  }, [activity1Name, activity1Description, activity1Duration, activities]);

  const isActivity2Dirty = useMemo(() => {
    if (!activity2Exists) {
      return (
        activity2Name.trim() && activity2Duration > 0 && activity2Duration <= 90
      );
    }
    return (
      activity2Name.trim() !== (act2?.Activity_Name || "") ||
      activity2Description !== (act2?.Activity_Description || "") ||
      Number(activity2Duration) !== Number(act2?.Duration ?? 30)
    );
  }, [activity2Name, activity2Description, activity2Duration, activities]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Manage Activities - {exhibit?.exhibit_Name}
          </DialogTitle>
          <DialogDescription>
            Configure two activities for this exhibit: one for even days and one
            for odd days.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-6 py-4">
          {/* Activity 1 - Even Days */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  Activity 1
                </Badge>
                <span className="text-sm text-gray-600">Even Days</span>
              </h3>
              {activity1Exists && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete1}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                  disabled={isSaving}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <form onSubmit={handleSave1} className="space-y-3">
              <div>
                <Label htmlFor="activity1-name">Activity Name *</Label>
                <Input
                  id="activity1-name"
                  value={activity1Name}
                  onChange={(e) => setActivity1Name(e.target.value)}
                  placeholder="e.g., Lion Feeding Time"
                  required
                  disabled={isSaving}
                />
              </div>
              <div>
                <Label htmlFor="activity1-description">Description</Label>
                <Textarea
                  id="activity1-description"
                  value={activity1Description}
                  onChange={(e) => setActivity1Description(e.target.value)}
                  placeholder="Describe the activity..."
                  rows={3}
                  disabled={isSaving}
                />
              </div>
              <div>
                <Label htmlFor="activity1-duration">Duration (minutes) *</Label>
                <Input
                  id="activity1-duration"
                  type="number"
                  min="1"
                  max="90"
                  value={activity1Duration}
                  onChange={(e) =>
                    setActivity1Duration(parseInt(e.target.value) || 30)
                  }
                  placeholder="30"
                  required
                  disabled={isSaving}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be between 1 and 90 minutes
                </p>
              </div>
              <Button
                type="submit"
                disabled={
                  isSaving ||
                  !activity1Name.trim() ||
                  activity1Duration <= 0 ||
                  activity1Duration > 90 ||
                  (activity1Exists ? !isActivity1Dirty : false)
                }
                className="w-full bg-blue-600 hover:bg-blue-700 cursor-pointer"
              >
                <Save className="h-4 w-4 mr-2" />
                {activity1Exists ? "Update Activity 1" : "Add Activity 1"}
              </Button>
            </form>
          </div>

          {/* Activity 2 - Odd Days */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Activity 2
                </Badge>
                <span className="text-sm text-gray-600">Odd Days</span>
              </h3>
              {activity2Exists && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete2}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                  disabled={isSaving}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <form onSubmit={handleSave2} className="space-y-3">
              <div>
                <Label htmlFor="activity2-name">Activity Name *</Label>
                <Input
                  id="activity2-name"
                  value={activity2Name}
                  onChange={(e) => setActivity2Name(e.target.value)}
                  placeholder="e.g., Big Cat Talk"
                  required
                  disabled={isSaving}
                />
              </div>
              <div>
                <Label htmlFor="activity2-description">Description</Label>
                <Textarea
                  id="activity2-description"
                  value={activity2Description}
                  onChange={(e) => setActivity2Description(e.target.value)}
                  placeholder="Describe the activity..."
                  rows={3}
                  disabled={isSaving}
                />
              </div>
              <div>
                <Label htmlFor="activity2-duration">Duration (minutes) *</Label>
                <Input
                  id="activity2-duration"
                  type="number"
                  min="1"
                  max="90"
                  value={activity2Duration}
                  onChange={(e) =>
                    setActivity2Duration(parseInt(e.target.value) || 30)
                  }
                  placeholder="30"
                  required
                  disabled={isSaving}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be between 1 and 90 minutes
                </p>
              </div>
              <Button
                type="submit"
                disabled={
                  isSaving ||
                  !activity2Name.trim() ||
                  activity2Duration <= 0 ||
                  activity2Duration > 90 ||
                  (activity2Exists ? !isActivity2Dirty : false)
                }
                className="w-full bg-green-600 hover:bg-green-700 cursor-pointer"
              >
                <Save className="h-4 w-4 mr-2" />
                {activity2Exists ? "Update Activity 2" : "Add Activity 2"}
              </Button>
            </form>
          </div>
        </div>
        {/* Delete confirmation dialog for activities */}
        <AlertDialog
          open={pendingDelete !== null}
          onOpenChange={() => setPendingDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Activity</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete
                <strong> {pendingDelete?.name} </strong>
                {exhibit?.exhibit_Name ? `for ${exhibit.exhibit_Name}` : ""}?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="cursor-pointer" disabled={isSaving}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (pendingDelete) {
                    onDeleteActivity(pendingDelete.id);
                    setPendingDelete(null);
                  }
                }}
                className="bg-red-600 hover:bg-red-700 cursor-pointer"
                disabled={isSaving}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
