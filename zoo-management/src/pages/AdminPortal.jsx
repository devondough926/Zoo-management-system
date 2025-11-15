import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
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
  CreditCard,
  Map,
  Building2,
  Filter,
  AlertCircle,
  Activity,
} from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "../components/ui/popover";

// react-day-picker for calendar UI
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useData } from "../data/DataContext";
import { toast } from "sonner";
import { ZooLogo } from "../components/ZooLogo";
import { EditExhibitDialog } from "../components/ExhibitDialogs";
import { PaginationControls } from "../components/PaginationControls";
import { generatePaginationArray } from "../utils/paginationHelper";
import { usePricing } from "../data/PricingContext";
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
  const navigate = useNavigate();
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
  const [isLoading, setIsLoading] = useState(true);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isManageZoneOpen, setIsManageZoneOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [deleteConfirmEmployee, setDeleteConfirmEmployee] = useState(null);
  const [pendingSupervisor, setPendingSupervisor] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [revenueRange, setRevenueRange] = useState("all");
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
  const [activeTab, setActiveTab] = useState("overview");

  // Activity management state
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [selectedExhibitForActivities, setSelectedExhibitForActivities] =
    useState(null);
  const [exhibitActivities, setExhibitActivities] = useState([]);

  // set active tab and scroll to top for better navigation
  const handleSetActiveTab = (tab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined" && window.scrollTo) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Health Status Report Filters
  const [healthZoneFilter, setHealthZoneFilter] = useState("All");
  const [healthEnclosureFilter, setHealthEnclosureFilter] = useState("All");
  const [genderFilter, setGenderFilter] = useState("All");
  const [ageFilter, setAgeFilter] = useState("All");

  // Animal Management Filters

  // Map of enclosure id -> enclosure for quick lookup
  const enclosureMap = useMemo(() => {
    const m = {};
    (allEnclosures || []).forEach((e) => {
      if (e && typeof e.Enclosure_ID !== "undefined") m[e.Enclosure_ID] = e;
    });
    return m;
  }, [allEnclosures]);
  // start with no exhibit selected so the default animal list is empty
  const [animalExhibitFilter, setAnimalExhibitFilter] = useState("");
  const [animalSearch, setAnimalSearch] = useState("");

  // Transaction sort state: clicking a column header toggles asc -> desc -> none
  const [transactionSortState, setTransactionSortState] = useState({
    col: null,
    dir: null,
  });

  // Filter transactions by source/category (e.g., Ticket, Membership, Gift Shop, Food)
  const [transactionSource, setTransactionSource] = useState("All");

  // Transaction pagination state
  const [transactionCurrentPage, setTransactionCurrentPage] = useState(1);
  const [transactionItemsPerPage, setTransactionItemsPerPage] = useState(15);

  // Handle transaction pagination with scroll to top
  const handleTransactionPageChange = (page) => {
    setTransactionCurrentPage(page);
    // Scroll to the transactions section
    const transactionsSection = document.getElementById("transactions");
    if (transactionsSection) {
      transactionsSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // Animal pagination state
  const [animalCurrentPage, setAnimalCurrentPage] = useState(1);
  const [animalItemsPerPage, setAnimalItemsPerPage] = useState(15);

  // Handle animal pagination with scroll to top
  const handleAnimalPageChange = (page) => {
    setAnimalCurrentPage(page);
    // Scroll up to the Animals Details section header so users see the title and table.
    // Use window.scrollTo with an extra offset so the header appears lower in the
    // viewport (leaving some breathing room above it).
    const animalsSection = document.getElementById("animals-section");
    if (animalsSection && typeof window !== "undefined") {
      try {
        const rect = animalsSection.getBoundingClientRect();
        const extraGap = 100;
        const targetY = window.scrollY + rect.top - extraGap;
        window.scrollTo({ top: targetY, behavior: "smooth" });
        return;
      } catch (e) {
        // fall through to fallback
      }
    }

    // Fallback: scroll to the table element using scrollIntoView
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

  // Animal sort state: clicking a column header toggles asc -> desc -> none
  const [animalSortState, setAnimalSortState] = useState({
    col: null,
    dir: null,
  });

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
  // Per-job salary edit dialog (replaces the combined Edit Salaries dialog)
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
      ] = await Promise.all([
        locationAPI.getAll(),
        referenceAPI.getJobTitles(),
        referenceAPI.getEnclosures(),
        transactionAPI.getMemberships(),
        employeeAPI.getAll(),
        exhibitAPI.getAll(),
        animalAPI.getAll(),
      ]);

      setAllLocations(locationsData);
      setAllJobTitles(jobTitlesData);
      setAllEnclosures(enclosuresData);
      setAllMemberships(membershipsData);
      setAllEmployees(employeesData);
      setAllExhibitsDB(exhibitsData);
      setAllAnimalsDB(animalsData);

      await loadRevenueData();

      setLastUpdated(new Date());
      toast.success("Dashboard loaded successfully!");
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load data from database");
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
      toast.error("Failed to load data from database");
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
    } catch (error) {
      console.error("Error loading revenue data:", error);
      toast.error("Failed to load revenue data");
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

  // Convert backend TIME strings ("HH:MM:SS" or "HH:MM") to 12-hour display
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

  // Parse server-side DATETIME/ISO strings as UTC when timezone is not provided.
  // Accepts Date objects or strings like 'YYYY-MM-DD HH:MM:SS' and converts
  // MySQL-style datetimes to ISO UTC so the JS Date will represent the same
  // instant across client timezones.
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

    // Sort by last name
    return filtered.sort((a, b) => a.Last_Name.localeCompare(b.Last_Name));
  }, [allEmployees, staffSearch]);

  const displayAnimals = useMemo(() => {
    // If no exhibit selected, return empty list by default
    if (!animalExhibitFilter) return [];
    // start with animals for the selected exhibit (or all animals)
    const base =
      animalExhibitFilter === "All"
        ? allAnimalsDB
        : allAnimalsDB.filter(
            (animal) => animal.Enclosure_ID === animalExhibitFilter
          );

    // If there's a search term, filter the base list by ID, name, or species
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

  // Group animals by exhibit
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

  // Sort and display transactions
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
        // determine numeric or alpha
        const numA = Number(A);
        const numB = Number(B);
        if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
          return dir === "asc" ? numA - numB : numB - numA;
        } else {
          // alpha sort
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

  // Build a list of unique categories from the raw data for the Source filter
  const transactionCategories = useMemo(() => {
    const cats = new Set();
    (Array.isArray(detailedTransactions) ? detailedTransactions : []).forEach(
      (t) => cats.add(t?.Category ?? "Uncategorized")
    );
    return Array.from(cats);
  }, [detailedTransactions]);

  // Apply the selected Source filter on top of the sorted transactions
  const filteredTransactions = useMemo(() => {
    if (!Array.isArray(sortedTransactions)) return [];
    if (!transactionSource || transactionSource === "All")
      return sortedTransactions;
    return sortedTransactions.filter(
      (t) => (t?.Category ?? "Uncategorized") === transactionSource
    );
  }, [sortedTransactions, transactionSource]);

  // Apply pagination to filtered transactions
  const displayedTransactions = useMemo(() => {
    const startIndex = (transactionCurrentPage - 1) * transactionItemsPerPage;
    const endIndex = startIndex + transactionItemsPerPage;
    return filteredTransactions.slice(startIndex, endIndex);
  }, [filteredTransactions, transactionCurrentPage, transactionItemsPerPage]);

  // Calculate total pages for pagination
  const transactionTotalPages = useMemo(() => {
    return Math.ceil(filteredTransactions.length / transactionItemsPerPage);
  }, [filteredTransactions.length, transactionItemsPerPage]);

  // Generate pagination array
  const transactionPaginationArray = useMemo(() => {
    return generatePaginationArray(
      transactionCurrentPage,
      transactionTotalPages
    );
  }, [transactionCurrentPage, transactionTotalPages]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setTransactionCurrentPage(1);
  }, [transactionSource]);

  // Helper function to calculate age in years
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

  // Filter animals based on selected filters
  const filteredAnimals = useMemo(() => {
    return allAnimalsDB.filter((animal) => {
      // Zone filter
      if (healthZoneFilter !== "All") {
        const enclosure = allEnclosures.find(
          (e) => e.Enclosure_ID === animal.Enclosure_ID
        );
        const location = allLocations.find(
          (loc) => loc.Location_ID === enclosure?.Location_ID
        );
        if (location?.Zone !== healthZoneFilter) return false;
      }

      // Enclosure filter
      if (
        healthEnclosureFilter !== "All" &&
        animal.Enclosure_ID !== healthEnclosureFilter
      )
        return false;

      // Gender filter
      if (genderFilter !== "All" && animal.Gender !== genderFilter)
        return false;

      // Age filter
      if (ageFilter !== "All") {
        const age = calculateAge(animal.Birthday);
        if (ageFilter === "0-2" && (age < 0 || age > 2)) return false;
        if (ageFilter === "3-5" && (age < 3 || age > 5)) return false;
        if (ageFilter === "6-10" && (age < 6 || age > 10)) return false;
        if (ageFilter === "11+" && age < 11) return false;
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

  // Sort animals based on selected column
  const sortedAnimals = useMemo(() => {
    const data = [...filteredAnimals];

    if (animalSortState?.col) {
      const key = animalSortState.col;
      const dir = animalSortState.dir;
      data.sort((a, b) => {
        let A = a[key];
        let B = b[key];

        // Special handling for certain columns
        if (key === "Age") {
          A = calculateAge(a.Birthday);
          B = calculateAge(b.Birthday);
        } else if (key === "Enclosure_Name") {
          A = enclosureMap[a.Enclosure_ID]?.Enclosure_Name || "";
          B = enclosureMap[b.Enclosure_ID]?.Enclosure_Name || "";
        }

        // Handle numeric vs string sorting
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

  // Apply pagination to sorted animals
  const displayedAnimals = useMemo(() => {
    const startIndex = (animalCurrentPage - 1) * animalItemsPerPage;
    const endIndex = startIndex + animalItemsPerPage;
    return sortedAnimals.slice(startIndex, endIndex);
  }, [sortedAnimals, animalCurrentPage, animalItemsPerPage]);

  // Calculate total pages for animal pagination
  const animalTotalPages = useMemo(() => {
    return Math.ceil(sortedAnimals.length / animalItemsPerPage);
  }, [sortedAnimals.length, animalItemsPerPage]);

  // Generate animal pagination array
  const animalPaginationArray = useMemo(() => {
    return generatePaginationArray(animalCurrentPage, animalTotalPages);
  }, [animalCurrentPage, animalTotalPages]);

  // Reset to page 1 when animal filters change
  useEffect(() => {
    setAnimalCurrentPage(1);
  }, [healthZoneFilter, healthEnclosureFilter, genderFilter, ageFilter]);

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
                <p className="text-sm text-gray-600">
                  WildWood Zoo Management Dashboard
                </p>
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading data from database...</p>
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
                      className="inline-flex items-center space-x-2 px-3 py-1 rounded-md border bg-white hover:bg-gray-50 cursor-pointer"
                      aria-label="Open date range picker"
                    >
                      <Calendar className="h-5 w-5 text-gray-600" />
                      <span className="text-sm text-gray-700">
                        {getRangeLabel()}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[380px]">
                    <div className="flex">
                      {/* Left: Quick Ranges */}
                      <div className="w-28 border-r pr-3">
                        <ul className="space-y-2">
                          <li>
                            <button
                              onClick={() => {
                                setCustomRange({ from: null, to: null });
                                setRevenueRange("today");
                                setIsPopoverOpen(false);
                              }}
                              className="w-full text-left px-2 py-2 rounded hover:bg-gray-100"
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
                              className="w-full text-left px-2 py-2 rounded hover:bg-gray-100"
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
                              className="w-full text-left px-2 py-2 rounded hover:bg-gray-100"
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
                              className="w-full text-left px-2 py-2 rounded hover:bg-gray-100"
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
                              className="w-full text-left px-2 py-2 text-blue-600 rounded hover:bg-gray-100"
                            >
                              Reset
                            </button>
                          </li>
                        </ul>
                      </div>

                      {/* Right: react-day-picker range selector */}
                      <div className="flex-1 pl-3">
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
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-teal-600">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <PawPrint className="h-8 w-8 text-teal-600" />
                    <div>
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
                    <div>
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
                    <div>
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
                    return (
                      <div
                        key={stat.category}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center justify-center mb-3">
                          <IconComponent
                            className={`h-10 w-10 ${stat.color.replace(
                              "bg-",
                              "text-"
                            )}`}
                          />
                        </div>
                        <h3 className="font-medium text-center mb-2">
                          {stat.category}
                        </h3>
                        <p className="text-2xl font-semibold text-center text-green-600">
                          $
                          {stat.amount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Detailed Transactions Table */}
        {activeTab === "overview" && (
          <section id="transactions">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl text-gray-900 flex items-center gap-2">
                <Activity className="h-6 w-6" /> Transaction Details
              </h2>
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
                    <SelectItem value="All">All</SelectItem>
                    {transactionCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Card>
              <CardContent className="pt-6">
                {/* Strong scroll wrapper with inline overrides to force horizontal scroll */}
                <div
                  className="w-full rounded-md border"
                  style={{
                    overflowX: "auto",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  {/* inner container to avoid flex-parent min-width problems */}
                  <div className="min-w-0">
                    <Table
                      className="min-w-[900px] table-auto"
                      style={{
                        minWidth: "900px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <TableHeader className="bg-gray-100">
                        <TableRow>
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
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayedTransactions.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={9}
                              className="text-center py-8 text-gray-500"
                            >
                              No transactions found for the selected date range
                            </TableCell>
                          </TableRow>
                        ) : (
                          displayedTransactions.map((transaction, index) => (
                            <TableRow
                              key={`${transaction.Purchase_ID}-${index}`}
                            >
                              <TableCell className="font-medium">
                                #{transaction.Purchase_ID}
                              </TableCell>
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
                              <TableCell className="whitespace-nowrap">
                                {transaction.Customer_Name}
                              </TableCell>
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
                              <TableCell>
                                {transaction.Item_Description
                                  ? transaction.Item_Description.replace(
                                      /\s*\([^)]*\)\s*$/,
                                      ""
                                    )
                                  : ""}
                              </TableCell>
                              <TableCell className="text-center">
                                {transaction.Quantity}
                              </TableCell>
                              <TableCell className="text-right whitespace-nowrap">
                                ${parseFloat(transaction.Unit_Price).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right font-semibold text-green-600 whitespace-nowrap">
                                $
                                {parseFloat(transaction.Total_Amount).toFixed(
                                  2
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {transaction.Payment_Method}
                                </Badge>
                              </TableCell>
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
              <TrendingUp className="h-6 w-6" /> Analytics
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart - Ticket Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Ticket Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ticketStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis
                        allowDecimals={false}
                        domain={[0, ticketMax]}
                        label={{
                          value: "Amount",
                          angle: -90,
                          position: "insideLeft",
                        }}
                      />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="sold" fill="#4CAF50" name="Tickets Sold" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={revenueBreakdown.map((item) => ({
                          name: item.category,
                          value: item.amount,
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        // Only render the on-chart label when the slice is non-zero
                        label={({ name, percent }) => {
                          if (!percent || percent === 0) return null;
                          return `${name} — ${(percent * 100).toFixed(0)}%`;
                        }}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        <Cell fill="#4CAF50" />
                        <Cell fill="#9C27B0" />
                        <Cell fill="#2196F3" />
                        <Cell fill="#FF9800" />
                      </Pie>
                      <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
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
                <Ticket className="h-6 w-6" /> Tickets & Pricing
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
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border-2 border-green-300"
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
                    <div className="p-6 bg-gradient-to-br from-purple-50 via-purple-100 to-pink-50 rounded-xl border-2 border-purple-300">
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

        {/* Zone Overview */}
        {activeTab === "operations" && (
          <section id="zones">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl text-gray-900 flex items-center gap-2">
                <Map className="h-6 w-6" /> Zone Overview
              </h2>
            </div>
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {allLocations.map((location) => {
                    const supervisor = allEmployees.find(
                      (e) => e.Employee_ID === location.Supervisor_ID
                    );
                    const zoneEmployees = getZoneEmployees(location);
                    return (
                      <div
                        key={location.Zone}
                        className="relative p-4 bg-teal-50 rounded-lg border border-teal-200 shadow-sm"
                      >
                        {/* Zone initial badge top-right */}
                        <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold">
                          {String(location.Zone).charAt(0) || "?"}
                        </div>

                        {/* Description as the bold heading with view icon; Employees count below on the left */}
                        <div className="mb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg text-slate-900 max-w-[420px]">
                                {abbreviateNorth(location.Location_Description)}
                              </h3>
                            </div>
                          </div>

                          <p className="text-sm text-slate-700 mt-2">
                            <span className="font-medium">Employees:</span>{" "}
                            <span className="text-slate-600 inline-flex items-center">
                              {zoneEmployees.length}
                              <button
                                type="button"
                                onClick={() => setViewZoneEmployees(location)}
                                className="ml-2 p-1 rounded hover:bg-teal-100 text-teal-600 cursor-pointer"
                                aria-label={`View zone ${location.Zone} employees`}
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </span>
                          </p>
                        </div>

                        {/* Centered supervisor label + name (name larger) with edit button next to the name */}
                        <div className="flex flex-col items-center mb-2 text-center">
                          <p className="text-sm font-medium text-slate-700">
                            Supervisor:
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-base font-semibold text-slate-900">
                              {supervisor
                                ? `${supervisor.First_Name} ${supervisor.Last_Name}`
                                : "Unassigned"}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedZone(location);
                                setIsManageZoneOpen(true);
                                setSupervisorSearch("");
                              }}
                              className="p-1 rounded text-purple-600 cursor-pointer"
                              aria-label={`Change supervisor for zone ${location.Zone}`}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* View Zone Employees Dialog */}
            <Dialog
              open={viewZoneEmployees !== null}
              onOpenChange={() => setViewZoneEmployees(null)}
            >
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    Zone {viewZoneEmployees?.Zone} Employees
                  </DialogTitle>
                  <DialogDescription>
                    {abbreviateNorth(viewZoneEmployees?.Location_Description)}
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[500px] pr-4">
                  <div className="space-y-3">
                    {viewZoneEmployees &&
                    getZoneEmployees(viewZoneEmployees).length > 0 ? (
                      getZoneEmployees(viewZoneEmployees).map((emp) => (
                        <div
                          key={emp.Employee_ID}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {emp.Last_Name}, {emp.First_Name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {emp.Job_Title?.Title}
                              </p>
                              <p className="text-sm text-gray-600">
                                ID: {emp.Employee_ID}
                              </p>
                            </div>
                            <Badge className="bg-teal-100 text-teal-800">
                              {viewZoneEmployees.Supervisor_ID ===
                              emp.Employee_ID
                                ? "Supervisor"
                                : "Staff"}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No employees assigned to this zone
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </section>
        )}

        {/* Salary Management */}
        {activeTab === "operations" && (
          <section id="salary">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl text-gray-900 flex items-center gap-2">
                <DollarSign className="h-6 w-6" /> Salary Management
              </h2>
            </div>
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {allJobTitles
                    .filter((j) => j.Job_ID !== 1)
                    .map((job) => {
                      const avgSalary = salaries[job.Job_ID] || 0;
                      const displayTitle =
                        job.Job_ID === 2 ? "Supervisor" : job.Title;
                      return (
                        <div
                          key={job.Job_ID}
                          className="p-4 bg-blue-50 rounded-lg border border-blue-200 relative"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium mb-2">
                                {displayTitle}
                              </h3>
                              <p className="text-2xl font-semibold text-blue-600 mb-1">
                                ${avgSalary.toLocaleString()}
                              </p>
                            </div>
                            <button
                              onClick={() =>
                                handleJobSalaryDialogOpen(true, job.Job_ID)
                              }
                              className="ml-4 p-1 rounded cursor-pointer"
                              aria-label={`Edit ${displayTitle} salary`}
                            >
                              <Edit className="h-4 w-4 text-blue-600" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* Per-job Salary Dialog (opened from each job's Edit icon) */}
            <Dialog
              open={isJobSalaryOpen}
              onOpenChange={(open) =>
                // preserve selectedJobId when opening; clear when closing
                handleJobSalaryDialogOpen(open, open ? selectedJobId : null)
              }
            >
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    Edit{" "}
                    {selectedJobId
                      ? selectedJobId === 2
                        ? "Supervisor"
                        : allJobTitles.find((j) => j.Job_ID === selectedJobId)
                            ?.Title
                      : "Salary"}
                  </DialogTitle>
                  <DialogDescription>
                    Set the salary for this role. This will update all employees
                    in that role.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">$</span>
                    <Input
                      type="number"
                      step="1000"
                      value={tempJobSalary}
                      onChange={(e) =>
                        setTempJobSalary(parseFloat(e.target.value) || 0)
                      }
                      className="w-40"
                    />
                    <span className="text-gray-600">/year</span>
                  </div>
                  <Button
                    onClick={handleJobSalarySave}
                    className="bg-green-600 hover:bg-green-700 cursor-pointer"
                    disabled={
                      isSaving ||
                      (selectedJobId
                        ? parseFloat(tempJobSalary || 0) ===
                          parseFloat(salaries[selectedJobId] || 0)
                        : true)
                    }
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </section>
        )}

        {/* Employee Management */}
        {activeTab === "operations" && (
          <section id="employees">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl text-gray-900 flex items-center gap-2">
                <Users className="h-6 w-6" /> Staff Management
              </h2>
              <AddEmployeeDialog
                isOpen={isAddEmployeeOpen}
                onOpenChange={setIsAddEmployeeOpen}
                onAdd={handleAddEmployee}
                allEmployees={allEmployees}
                allJobTitles={allJobTitles}
                salaries={salaries}
                isSaving={isSaving}
              />
            </div>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">
                    Total Employees: {allEmployees.length}
                    {staffSearch.trim() && (
                      <span className="ml-2 text-blue-600">
                        (Showing {sortedEmployees.length} matching)
                      </span>
                    )}
                  </p>
                  <div className="relative w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by name or ID..."
                      value={staffSearch}
                      onChange={(e) => setStaffSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-3">
                    {sortedEmployees.length > 0 ? (
                      sortedEmployees.map((emp) => (
                        <div
                          key={emp.Employee_ID}
                          className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <p className="font-medium text-lg">
                                {emp.Last_Name}, {emp.First_Name}
                              </p>
                              <Badge
                                className={
                                  isSupervisor(emp)
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-green-100 text-green-800"
                                }
                              >
                                {getEmployeeTitle(emp)}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Email:</span>{" "}
                                {emp.Email}
                              </div>
                              <div>
                                <span className="font-medium">
                                  Employee ID:
                                </span>{" "}
                                {emp.Employee_ID}
                              </div>
                              <div>
                                <span className="font-medium">Zone:</span>{" "}
                                {getEmployeeZone(emp)}
                              </div>
                              <div>
                                <span className="font-medium">Birthdate:</span>{" "}
                                {formatDate(emp.Birthdate)}
                              </div>
                              <div>
                                <span className="font-medium">Sex:</span>{" "}
                                {emp.Sex}
                              </div>
                              <div>
                                <span className="font-medium">Salary:</span> $
                                {emp.Salary.toLocaleString()}
                              </div>
                              <div className="md:col-span-2">
                                <span className="font-medium">Address:</span>{" "}
                                {emp.Address}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingEmployee(emp)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                              disabled={isSaving}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirmEmployee(emp)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                              disabled={isSaving}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg text-gray-600">
                          No employees found
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          {staffSearch.trim()
                            ? `No employees match "${staffSearch}"`
                            : "No employees in the system"}
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </section>
        )}

        {activeTab === "assets" && (
          <section id="exhibits">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl text-gray-900 flex items-center gap-2">
                <Building2 className="h-6 w-6 text-indigo-600" /> Exhibit
                Management
              </h2>
            </div>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm mb-4">Manage zoo exhibits and displays</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {allExhibitsDB.map((exhibit) => (
                    <Card
                      key={exhibit.Exhibit_ID}
                      className="p-4 bg-gray-100 border-2 border-gray-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">
                              {exhibit.exhibit_Name}
                            </h3>
                            {exhibit.Location_Description && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-green-50 text-green-700 border-green-200"
                              >
                                {exhibit.Zone}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {exhibit.exhibit_Description || "No description"}
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                            {exhibit.Capacity && (
                              <span>Capacity: {exhibit.Capacity}</span>
                            )}
                            {exhibit.Display_Time && (
                              <span>
                                • Activity Scheduled for{" "}
                                {formatTime(exhibit.Display_Time)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleManageActivities(exhibit)}
                            className="cursor-pointer text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            disabled={isSaving}
                            title="Manage Activities"
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingExhibit(exhibit)}
                            className="cursor-pointer"
                            disabled={isSaving}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {activeTab === "assets" && (
          <section id="animals">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl text-gray-900 flex items-center gap-2">
                  <PawPrint className="h-6 w-6" /> Animal Management
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Total animals:{" "}
                  <span className="font-semibold text-green-700">
                    {totalAnimals}
                  </span>
                </p>
              </div>
              <AddAnimalDialog
                isOpen={isAddAnimalOpen}
                onOpenChange={setIsAddAnimalOpen}
                onAdd={handleAddAnimal}
                enclosures={allEnclosures}
                isSaving={isSaving}
              />
            </div>

            {/* Exhibit Filter */}
            <Card className="mb-4">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="exhibit-filter" className="mb-2">
                      Filter by Exhibit
                    </Label>
                    <Select
                      value={
                        animalExhibitFilter === ""
                          ? ""
                          : animalExhibitFilter === "All"
                          ? "All"
                          : animalExhibitFilter.toString()
                      }
                      onValueChange={(value) =>
                        setAnimalExhibitFilter(
                          value === "All"
                            ? "All"
                            : value === "__NONE__"
                            ? ""
                            : value === ""
                            ? ""
                            : parseInt(value)
                        )
                      }
                    >
                      <SelectTrigger
                        id="exhibit-filter"
                        className="cursor-pointer"
                      >
                        <SelectValue
                          placeholder="Select an exhibit"
                          className="text-italic"
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          value="__NONE__"
                          className="text-muted-foreground"
                        >
                          No selection . . .
                        </SelectItem>
                        <SelectItem value="All">All Exhibits</SelectItem>
                        {allEnclosures.map((enc) => (
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
                  {animalExhibitFilter && animalExhibitFilter !== "All" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAnimalExhibitFilter("")}
                      className="cursor-pointer mt-6"
                    >
                      Clear Filter
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 mt-6">
                      <Filter className="h-5 w-5 text-gray-600" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">
                    Manage zoo animals organized by their exhibits
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Search by ID, or keywords"
                      value={animalSearch}
                      onChange={(e) => setAnimalSearch(e.target.value)}
                      className="w-64"
                    />
                    <Search className="h-4 w-4 text-gray-500" />
                  </div>
                </div>
                <div
                  className={
                    Object.keys(animalsByExhibit).length > 2
                      ? "max-h-[600px] overflow-y-auto pr-4"
                      : ""
                  }
                >
                  <div className="space-y-4">
                    {Object.entries(animalsByExhibit).map(
                      ([exhibitName, animals]) => (
                        <Card
                          key={exhibitName}
                          className="overflow-hidden outline-1 border-teal-100"
                        >
                          <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-teal-600 rounded-lg">
                                  <Building2 className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-lg text-teal-800">
                                    {exhibitName}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    {animals.length}{" "}
                                    {animals.length === 1
                                      ? "animal"
                                      : "animals"}
                                  </p>
                                </div>
                              </div>
                              <Badge
                                variant="secondary"
                                className="bg-teal-100 text-teal-700 border-teal-300"
                              >
                                {animals.length}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                              {animals.map((animal) => {
                                const enclosure = allEnclosures.find(
                                  (e) => e.Enclosure_ID === animal.Enclosure_ID
                                );
                                const dateAddedString = animal.Date_Added
                                  ? formatDate(animal.Date_Added)
                                  : "N/A";

                                return (
                                  <div
                                    key={animal.Animal_ID}
                                    style={{
                                      padding: "1rem",
                                      background:
                                        "linear-gradient(to bottom right, #f0fdfa, #ecfeff)", // from-teal-50 to-cyan-50
                                      borderRadius: "0.5rem", // rounded-lg
                                      border: "1px solid #5eead4", // border-teal-300
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      transition: "box-shadow 0.2s ease-in-out", // transition-shadow
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.boxShadow =
                                        "0 4px 6px rgba(0, 0, 0, 0.1)"; // hover:shadow-md
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.boxShadow = "none";
                                    }}
                                  >
                                    <div className="flex items-center space-x-4">
                                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-teal-600 text-white flex-shrink-0 shadow-md">
                                        <PawPrint className="h-6 w-6" />
                                      </div>
                                      <div>
                                        <p className="font-semibold text-gray-800">
                                          {animal.Animal_Name}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          {animal.Species} •{" "}
                                          {animal.Gender === "M"
                                            ? "Male"
                                            : animal.Gender === "F"
                                            ? "Female"
                                            : "Unknown"}{" "}
                                          • ID: {animal.Animal_ID}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Weight:{" "}
                                          {isFinite(Number(animal.Weight))
                                            ? Number(animal.Weight).toFixed(2)
                                            : animal.Weight}{" "}
                                          lbs • Born:{" "}
                                          {formatDate(animal.Birthday)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Health: {animal.Health_Status} •
                                          Added: {dateAddedString}
                                        </p>
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="bg-blue-50 border-blue-300 text-blue-600 hover:bg-blue-100 cursor-pointer flex-shrink-0"
                                      onClick={() => setEditingAnimal(animal)}
                                      disabled={isSaving}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    )}

                    {Object.keys(animalsByExhibit).length === 0 && (
                      <div className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg text-gray-600">
                          No animals found
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          {animalExhibitFilter
                            ? "Try selecting a different exhibit"
                            : "Add animals to get started"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Animals Health Status Distribution Report */}
        {activeTab === "assets" && (
          <section id="health-status">
            <h2 className="text-2xl mb-6 text-gray-900 flex items-center gap-2">
              <Activity className="h-6 w-6 text-red-500" /> Animals Health
              Status Distribution
            </h2>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Filter Animals by Health Criteria</CardTitle>
                  {healthZoneFilter !== "All" ||
                  healthEnclosureFilter !== "All" ||
                  genderFilter !== "All" ||
                  ageFilter !== "All" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setHealthZoneFilter("All");
                        setHealthEnclosureFilter("All");
                        setGenderFilter("All");
                        setAgeFilter("All");
                      }}
                      className="cursor-pointer"
                    >
                      Reset All Filters
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Filter className="h-5 w-5 text-gray-600" />
                      <h3 className="font-semibold text-gray-700"></h3>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Zone Filter */}
                  <div>
                    <Label htmlFor="health-zone-filter">Zone</Label>
                    <Select
                      value={healthZoneFilter}
                      onValueChange={(value) => {
                        setHealthZoneFilter(value);
                        setHealthEnclosureFilter("All");
                      }}
                    >
                      <SelectTrigger
                        id="health-zone-filter"
                        className="cursor-pointer"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Zones</SelectItem>
                        <SelectItem value="A">Zone A</SelectItem>
                        <SelectItem value="B">Zone B</SelectItem>
                        <SelectItem value="C">Zone C</SelectItem>
                        <SelectItem value="D">Zone D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Enclosure Filter */}
                  <div>
                    <Label htmlFor="health-enclosure-filter">Enclosure</Label>
                    <Select
                      value={healthEnclosureFilter.toString()}
                      onValueChange={(value) =>
                        setHealthEnclosureFilter(
                          value === "All" ? "All" : parseInt(value)
                        )
                      }
                    >
                      <SelectTrigger
                        id="health-enclosure-filter"
                        className="cursor-pointer"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Enclosures</SelectItem>
                        {allEnclosures
                          .filter((enc) => {
                            if (healthZoneFilter === "All") return true;
                            const location = allLocations.find(
                              (loc) => loc.Location_ID === enc.Location_ID
                            );
                            return location?.Zone === healthZoneFilter;
                          })
                          .map((enc) => (
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

                  {/* Gender Filter */}
                  <div>
                    <Label htmlFor="gender-filter">Gender</Label>
                    <Select
                      value={genderFilter}
                      onValueChange={(value) => setGenderFilter(value)}
                    >
                      <SelectTrigger
                        id="gender-filter"
                        className="cursor-pointer"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Genders</SelectItem>
                        <SelectItem value="M">Male</SelectItem>
                        <SelectItem value="F">Female</SelectItem>
                        <SelectItem value="U">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Age Filter */}
                  <div>
                    <Label htmlFor="age-filter">Age Range (years)</Label>
                    <Select
                      value={ageFilter}
                      onValueChange={(value) => setAgeFilter(value)}
                    >
                      <SelectTrigger id="age-filter" className="cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Ages</SelectItem>
                        <SelectItem value="0-2">0-2 years</SelectItem>
                        <SelectItem value="3-5">3-5 years</SelectItem>
                        <SelectItem value="6-10">6-10 years</SelectItem>
                        <SelectItem value="11+">11+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filtered Charts - Dynamic based on filters */}
            {(() => {
              // Helper function to calculate age in years
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

              // Filter animals based on selected filters
              const filteredAnimals = allAnimalsDB.filter((animal) => {
                // Zone filter
                if (healthZoneFilter !== "All") {
                  const enclosure = allEnclosures.find(
                    (e) => e.Enclosure_ID === animal.Enclosure_ID
                  );
                  const location = allLocations.find(
                    (loc) => loc.Location_ID === enclosure?.Location_ID
                  );
                  if (location?.Zone !== healthZoneFilter) return false;
                }

                // Enclosure filter
                if (
                  healthEnclosureFilter !== "All" &&
                  animal.Enclosure_ID !== healthEnclosureFilter
                )
                  return false;

                // Gender filter
                if (genderFilter !== "All" && animal.Gender !== genderFilter)
                  return false;

                // Age filter
                if (ageFilter !== "All") {
                  const age = calculateAge(animal.Birthday);
                  if (ageFilter === "0-2" && (age < 0 || age > 2)) return false;
                  if (ageFilter === "3-5" && (age < 3 || age > 5)) return false;
                  if (ageFilter === "6-10" && (age < 6 || age > 10))
                    return false;
                  if (ageFilter === "11+" && age < 11) return false;
                }

                return true;
              });

              // Sort animals based on selected column
              const sortedAnimals = [...filteredAnimals].sort((a, b) => {
                if (!animalSortState.col) return 0;

                const key = animalSortState.col;
                const dir = animalSortState.dir;
                let A = a[key];
                let B = b[key];

                // Special handling for certain columns
                if (key === "Age") {
                  A = calculateAge(a.Birthday);
                  B = calculateAge(b.Birthday);
                } else if (key === "Enclosure_Name") {
                  A = enclosureMap[a.Enclosure_ID]?.Enclosure_Name || "";
                  B = enclosureMap[b.Enclosure_ID]?.Enclosure_Name || "";
                }

                // Handle numeric vs string sorting
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

              // canonical health status color map (used across cards and charts)
              const healthColors = {
                Excellent: "#06B6D4",
                Good: "#059669",
                Fair: "#F59E0B",
                "Needs Attention": "#EF4444", // Stored as "Needs Attention" in DB but displayed as "Critical"
              };

              // Helper to convert backend status to display label
              const backendToDisplayLabel = (backendStatus) => {
                if (backendStatus === "Needs Attention") return "Critical";
                return backendStatus;
              };

              // Health status distribution for pie chart
              const healthStatusData = [
                {
                  name: "Excellent",
                  value: sortedAnimals.filter(
                    (a) => a.Health_Status === "Excellent"
                  ).length,
                  fill: healthColors.Excellent,
                },
                {
                  name: "Good",
                  value: sortedAnimals.filter((a) => a.Health_Status === "Good")
                    .length,
                  fill: healthColors.Good,
                },
                {
                  name: "Fair",
                  value: sortedAnimals.filter((a) => a.Health_Status === "Fair")
                    .length,
                  fill: healthColors.Fair,
                },
                {
                  name: "Critical",
                  value: sortedAnimals.filter(
                    (a) => a.Health_Status === "Needs Attention"
                  ).length,
                  fill: healthColors["Needs Attention"],
                },
              ].filter((item) => item.value > 0);

              // Health by Exhibit (stacked bar) - replaces previous Vaccination pie
              const byExhibit = (() => {
                // Build a map of enclosureId -> counts per health status
                // Use globalThis.Map to avoid shadowing by imported `Map` icon
                const exhibitMap = new globalThis.Map();
                const statuses = [
                  "Excellent",
                  "Good",
                  "Fair",
                  "Needs Attention",
                ];

                // Initialize map entries for enclosures present in filteredAnimals
                filteredAnimals.forEach((a) => {
                  const id = a.Enclosure_ID;
                  if (!exhibitMap.has(id)) {
                    exhibitMap.set(id, {
                      enclosureId: id,
                      enclosureName: null,
                    });
                  }
                });

                // Populate enclosure names from allEnclosures
                for (const [id, entry] of exhibitMap.entries()) {
                  const enc = allEnclosures.find((e) => e.Enclosure_ID === id);
                  entry.enclosureName =
                    enc?.Enclosure_Name || `Enclosure ${id}`;
                  // initialize counts
                  statuses.forEach((s) => (entry[s] = 0));
                }

                // Count statuses
                filteredAnimals.forEach((a) => {
                  const id = a.Enclosure_ID;
                  const entry = exhibitMap.get(id);
                  if (!entry) return; // safeguard
                  const status = a.Health_Status || "Fair";
                  if (statuses.includes(status))
                    entry[status] = (entry[status] || 0) + 1;
                  else entry.Fair = (entry.Fair || 0) + 1;
                });

                // Convert to array and only keep exhibits with any animals
                return Array.from(exhibitMap.values()).filter((e) =>
                  statuses.some((s) => e[s] > 0)
                );
              })();

              return (
                <div className="mt-6 space-y-6">
                  {/* Summary Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Animals Health Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">
                            Total Animals
                          </p>
                          <p className="text-3xl font-semibold text-blue-600">
                            {sortedAnimals.length}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-teal-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">
                            Excellent
                          </p>
                          <p
                            className="text-3xl font-semibold"
                            style={{ color: healthColors.Excellent }}
                          >
                            {
                              sortedAnimals.filter(
                                (a) => a.Health_Status === "Excellent"
                              ).length
                            }
                          </p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Good</p>
                          <p
                            className="text-3xl font-semibold"
                            style={{ color: healthColors.Good }}
                          >
                            {
                              sortedAnimals.filter(
                                (a) => a.Health_Status === "Good"
                              ).length
                            }
                          </p>
                        </div>
                        <div
                          className="text-center p-4 rounded-lg"
                          style={{ backgroundColor: "#fefce8" }}
                        >
                          <p className="text-sm text-gray-600 mb-1">Fair</p>
                          <p
                            style={{
                              fontSize: "1.875rem",
                              fontWeight: 600,
                              color: healthColors.Fair,
                            }}
                          >
                            {
                              sortedAnimals.filter(
                                (a) => a.Health_Status === "Fair"
                              ).length
                            }
                          </p>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Critical</p>
                          <p
                            className="text-3xl font-semibold"
                            style={{ color: healthColors["Needs Attention"] }}
                          >
                            {
                              sortedAnimals.filter(
                                (a) => a.Health_Status === "Needs Attention"
                              ).length
                            }
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Animals Table */}
                  {/* Animals Details section header (separate from the table container) */}
                  <div id="animals-section" className="mb-2">
                    <h3 className="text-lg font-semibold">Animal Details</h3>
                  </div>
                  <Card id="animals">
                    <CardContent className="pt-2">
                      {/* Strong scroll wrapper for Animals table to force horizontal scroll */}
                      <div
                        className="w-full rounded-md border"
                        style={{
                          overflowX: "auto",
                          WebkitOverflowScrolling: "touch",
                        }}
                      >
                        <div className="min-w-0">
                          <Table
                            id="animal-table"
                            className="min-w-[900px] table-auto"
                            style={{ minWidth: "900px", whiteSpace: "nowrap" }}
                          >
                            <TableHeader className="bg-gray-100">
                              <TableRow>
                                <TableHead
                                  className="w-[80px] cursor-pointer select-none hover:bg-gray-50"
                                  onClick={() => toggleAnimalSort("Animal_ID")}
                                >
                                  ID
                                  {animalSortState.col === "Animal_ID" && (
                                    <span className="ml-1 text-xs">
                                      {animalSortState.dir === "asc"
                                        ? "▲"
                                        : "▼"}
                                    </span>
                                  )}
                                </TableHead>
                                <TableHead
                                  className="cursor-pointer select-none hover:bg-gray-50"
                                  onClick={() =>
                                    toggleAnimalSort("Animal_Name")
                                  }
                                >
                                  Name
                                  {animalSortState.col === "Animal_Name" && (
                                    <span className="ml-1 text-xs">
                                      {animalSortState.dir === "asc"
                                        ? "▲"
                                        : "▼"}
                                    </span>
                                  )}
                                </TableHead>
                                <TableHead
                                  className="cursor-pointer select-none hover:bg-gray-50"
                                  onClick={() => toggleAnimalSort("Species")}
                                >
                                  Species
                                  {animalSortState.col === "Species" && (
                                    <span className="ml-1 text-xs">
                                      {animalSortState.dir === "asc"
                                        ? "▲"
                                        : "▼"}
                                    </span>
                                  )}
                                </TableHead>
                                <TableHead
                                  className="cursor-pointer select-none hover:bg-gray-50"
                                  onClick={() => toggleAnimalSort("Gender")}
                                >
                                  Gender
                                  {animalSortState.col === "Gender" && (
                                    <span className="ml-1 text-xs">
                                      {animalSortState.dir === "asc"
                                        ? "▲"
                                        : "▼"}
                                    </span>
                                  )}
                                </TableHead>
                                <TableHead
                                  className="cursor-pointer select-none hover:bg-gray-50"
                                  onClick={() => toggleAnimalSort("Age")}
                                >
                                  Age
                                  {animalSortState.col === "Age" && (
                                    <span className="ml-1 text-xs">
                                      {animalSortState.dir === "asc"
                                        ? "▲"
                                        : "▼"}
                                    </span>
                                  )}
                                </TableHead>
                                <TableHead
                                  className="cursor-pointer select-none hover:bg-gray-50 text-center"
                                  onClick={() => toggleAnimalSort("Weight")}
                                >
                                  Weight (lbs)
                                  {animalSortState.col === "Weight" && (
                                    <span className="ml-1 text-xs">
                                      {animalSortState.dir === "asc"
                                        ? "▲"
                                        : "▼"}
                                    </span>
                                  )}
                                </TableHead>
                                <TableHead
                                  className="cursor-pointer select-none hover:bg-gray-50"
                                  onClick={() =>
                                    toggleAnimalSort("Health_Status")
                                  }
                                >
                                  Health Status
                                  {animalSortState.col === "Health_Status" && (
                                    <span className="ml-1 text-xs">
                                      {animalSortState.dir === "asc"
                                        ? "▲"
                                        : "▼"}
                                    </span>
                                  )}
                                </TableHead>
                                <TableHead
                                  className="cursor-pointer select-none hover:bg-gray-50"
                                  onClick={() =>
                                    toggleAnimalSort("Enclosure_Name")
                                  }
                                >
                                  Enclosure
                                  {animalSortState.col === "Enclosure_Name" && (
                                    <span className="ml-1 text-xs">
                                      {animalSortState.dir === "asc"
                                        ? "▲"
                                        : "▼"}
                                    </span>
                                  )}
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {displayedAnimals.length === 0 ? (
                                <TableRow>
                                  <TableCell
                                    colSpan={8}
                                    className="text-center py-8 text-gray-500"
                                  >
                                    No animals found for the current page
                                  </TableCell>
                                </TableRow>
                              ) : (
                                displayedAnimals.map((animal) => (
                                  <TableRow key={animal.Animal_ID}>
                                    <TableCell className="font-medium">
                                      #{animal.Animal_ID}
                                    </TableCell>
                                    <TableCell>{animal.Animal_Name}</TableCell>
                                    <TableCell>{animal.Species}</TableCell>
                                    <TableCell>{animal.Gender}</TableCell>
                                    <TableCell>
                                      {calculateAge(animal.Birthday)}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap text-center">
                                      {typeof animal.Weight !== "undefined" &&
                                      animal.Weight !== null &&
                                      isFinite(Number(animal.Weight))
                                        ? Number(animal.Weight).toFixed(2)
                                        : "—"}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        className={
                                          animal.Health_Status === "Good"
                                            ? "bg-green-50 text-green-700 border-green-200"
                                            : ""
                                        }
                                        style={
                                          animal.Health_Status === "Excellent"
                                            ? {
                                                backgroundColor: "#ECFEFF",
                                                color: "#0E7490",
                                                border: "1px solid #A5F3FC",
                                              }
                                            : animal.Health_Status === "Fair"
                                            ? {
                                                backgroundColor: "#FEFCE8",
                                                color: "#ad7f49ff",
                                                border: "1px solid #FEF08A",
                                              }
                                            : animal.Health_Status ===
                                              "Needs Attention"
                                            ? {
                                                backgroundColor: "#FEF2F2",
                                                color: "#B91C1C",
                                                border: "1px solid #FECACA",
                                              }
                                            : {}
                                        }
                                      >
                                        {backendToDisplayLabel(
                                          animal.Health_Status
                                        )}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {enclosureMap[animal.Enclosure_ID]
                                        ?.Enclosure_Name || "Unknown"}
                                    </TableCell>
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
                          {sortedAnimals.length > 0
                            ? (animalCurrentPage - 1) * animalItemsPerPage + 1
                            : 0}
                          -
                          {Math.min(
                            animalCurrentPage * animalItemsPerPage,
                            sortedAnimals.length
                          )}{" "}
                          of {sortedAnimals.length} animal
                          {sortedAnimals.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <PaginationControls
                        currentPage={animalCurrentPage}
                        totalPages={animalTotalPages}
                        onPageChange={handleAnimalPageChange}
                        paginationArray={animalPaginationArray}
                        className="mt-4"
                      />
                    </CardContent>
                  </Card>

                  {sortedAnimals.length === 0 ? (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center py-12">
                          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-lg text-gray-600">
                            No animals found matching the selected filters
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            Try adjusting your filter criteria
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* Charts Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Health Status Distribution - Pie Chart */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Health Status Distribution</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
                                <Pie
                                  data={healthStatusData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent }) =>
                                    `${name} — ${(percent * 100).toFixed(0)}%`
                                  }
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {healthStatusData.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={entry.fill}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        {/* Vaccination Status Distribution */}
                        {byExhibit.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle>Health by Exhibit</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                  data={byExhibit}
                                  margin={{ left: 0, right: 8 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  {/* show all ticks and render wrapped, rotated labels so long names fit */}
                                  <XAxis
                                    dataKey="enclosureName"
                                    interval={0}
                                    height={80}
                                    tick={({ x, y, payload }) => {
                                      const label = String(
                                        payload?.value || ""
                                      );
                                      // decide whether to rotate based on number of exhibits shown
                                      const rotate = byExhibit.length > 4; // rotate only when more than 4

                                      if (!rotate) {
                                        // simple horizontal single-line label centered under the tick
                                        return (
                                          <g
                                            transform={`translate(${x}, ${
                                              y + 16
                                            })`}
                                          >
                                            <text
                                              textAnchor="middle"
                                              fontSize={12}
                                            >
                                              {label}
                                            </text>
                                          </g>
                                        );
                                      }

                                      // rotated/wrapped label for long lists
                                      const maxChars = 18; // target chars per line
                                      let line1 = label;
                                      let line2 = "";
                                      if (label.length > maxChars) {
                                        const idx = label.lastIndexOf(
                                          " ",
                                          maxChars
                                        );
                                        if (idx > 0) {
                                          line1 = label.slice(0, idx);
                                          line2 = label.slice(idx + 1);
                                        } else {
                                          line1 = label.slice(0, maxChars);
                                          line2 = label.slice(maxChars);
                                        }
                                      }

                                      return (
                                        <g
                                          transform={`translate(${x}, ${
                                            y + 10
                                          })`}
                                        >
                                          <text
                                            textAnchor="end"
                                            fontSize={12}
                                            transform="rotate(-45)"
                                          >
                                            <tspan x={0} dy={0}>
                                              {line1}
                                            </tspan>
                                            {line2 && (
                                              <tspan x={0} dy={12}>
                                                {line2}
                                              </tspan>
                                            )}
                                          </text>
                                        </g>
                                      );
                                    }}
                                  />
                                  <YAxis allowDecimals={false} />
                                  <Tooltip />
                                  <Legend />
                                  <Bar
                                    dataKey="Excellent"
                                    stackId="a"
                                    fill={healthColors.Excellent}
                                  />
                                  <Bar
                                    dataKey="Good"
                                    stackId="a"
                                    fill={healthColors.Good}
                                  />
                                  <Bar
                                    dataKey="Fair"
                                    stackId="a"
                                    fill={healthColors.Fair}
                                  />
                                  <Bar
                                    dataKey="Needs Attention"
                                    name="Critical"
                                    stackId="a"
                                    fill={healthColors["Needs Attention"]}
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
          </section>
        )}

        {/* Zone Supervisor Assignment Dialog */}
        <Dialog
          open={isManageZoneOpen}
          onOpenChange={(open) => {
            setIsManageZoneOpen(open);
            if (!open) setSupervisorSearch("");
          }}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Manage Zone Supervisor</DialogTitle>
              <DialogDescription>
                {selectedZone &&
                  `Select a supervisor for Zone ${
                    selectedZone.Zone
                  }: ${abbreviateNorth(selectedZone.Location_Description)}`}
              </DialogDescription>
            </DialogHeader>

            {/* Current Supervisor Display */}
            {selectedZone &&
              (() => {
                const currentSupervisor = allEmployees.find(
                  (e) => e.Employee_ID === selectedZone.Supervisor_ID
                );
                return currentSupervisor ? (
                  <div className="p-4 bg-purple-100 border-2 border-purple-300 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          Current Supervisor
                        </p>
                        <p className="font-medium text-lg">
                          {currentSupervisor.Last_Name},{" "}
                          {currentSupervisor.First_Name}
                        </p>
                        <div className="flex items-center gap-6 text-sm text-gray-600 mt-1">
                          <span>ID: {currentSupervisor.Employee_ID}</span>
                          <span>Sex: {currentSupervisor.Sex}</span>
                          <span>
                            DOB: {formatDate(currentSupervisor.Birthdate)}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="bg-red-50 border-red-300 text-red-600 hover:bg-red-100 cursor-pointer"
                        onClick={() =>
                          handleAssignSupervisor(selectedZone.Location_ID, null)
                        }
                        disabled={isSaving}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-100 border-2 border-gray-300 rounded-lg">
                    <p className="text-gray-600 text-center">
                      No supervisor currently assigned
                    </p>
                  </div>
                );
              })()}

            {/* Search Bar */}
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name or ID..."
                value={supervisorSearch}
                onChange={(e) => setSupervisorSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="max-h-[400px] pr-4">
              <div className="space-y-2">
                {/* Employee List */}
                <p className="text-sm text-gray-600 mb-2 px-1">
                  Select new supervisor:
                </p>
                {filteredEmployeesForSupervisor.map((employee) => (
                  <button
                    key={employee.Employee_ID}
                    className="w-full p-4 border rounded-lg text-left hover:bg-purple-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() =>
                      selectedZone && setPendingSupervisor(employee)
                    }
                    disabled={isSaving}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-medium flex-shrink-0">
                        {employee.Last_Name}, {employee.First_Name}
                      </p>
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span>ID: {employee.Employee_ID}</span>
                        <span>Sex: {employee.Sex}</span>
                        <span>DOB: {formatDate(employee.Birthdate)}</span>
                      </div>
                    </div>
                  </button>
                ))}

                {filteredEmployeesForSupervisor.length === 0 &&
                  supervisorSearch && (
                    <div className="text-center py-8 text-gray-500">
                      No employees found matching "{supervisorSearch}"
                    </div>
                  )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={deleteConfirmEmployee !== null}
          onOpenChange={() => setDeleteConfirmEmployee(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Employee</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{" "}
                <strong>
                  {deleteConfirmEmployee?.First_Name}{" "}
                  {deleteConfirmEmployee?.Last_Name}
                </strong>{" "}
                from the system? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="cursor-pointer" disabled={isSaving}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  deleteConfirmEmployee &&
                  handleDeleteEmployee(deleteConfirmEmployee)
                }
                className="bg-red-600 hover:bg-red-700 cursor-pointer"
                disabled={isSaving}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isSaving ? "Deleting..." : "Delete Employee"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Confirm Supervisor Assignment */}
        <AlertDialog
          open={pendingSupervisor !== null}
          onOpenChange={() => setPendingSupervisor(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Assign Supervisor</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to assign
                <strong>
                  {" "}
                  {pendingSupervisor?.First_Name} {pendingSupervisor?.Last_Name}
                </strong>{" "}
                as the supervisor for Zone {selectedZone?.Zone}?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="cursor-pointer" disabled={isSaving}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (selectedZone && pendingSupervisor) {
                    handleAssignSupervisor(
                      selectedZone.Location_ID,
                      pendingSupervisor.Employee_ID
                    );
                  }
                  setPendingSupervisor(null);
                }}
                className="bg-green-600 hover:bg-green-700 cursor-pointer"
                disabled={isSaving}
              >
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Employee Dialog */}
        <EditEmployeeDialog
          employee={editingEmployee}
          isOpen={editingEmployee !== null}
          onOpenChange={(open) => !open && setEditingEmployee(null)}
          onUpdate={handleUpdateEmployee}
          allJobTitles={allJobTitles}
          allLocations={allLocations}
          salaries={salaries}
          isSaving={isSaving}
        />

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
      // Find the zone for this employee based on their supervisor
      const employeeZone =
        allLocations.find((loc) => loc.Supervisor_ID === employee.Supervisor_ID)
          ?.Zone || "A";

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
