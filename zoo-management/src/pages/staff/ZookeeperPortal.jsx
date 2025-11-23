import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  LogOut,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  PawPrint,
  Sparkles,
  ClipboardCheck,
  Activity,
  X,
  Trash2,
  FastForward,
} from "lucide-react";
import { toast } from "sonner";
import { ZooLogo } from "../../components/ZooLogo";
import LoadingWithIcon from "../../components/ui/LoadingWithIcon";
import { CleaningCard } from "../../components/CleaningCard";
import { zookeeperAPI, employeeAPI } from "../../services/zookeeperAPI";
import { useWeather } from "../../contexts/WeatherContext";
import { usePageTitle } from "../../hooks/usePageTitle";

export function ZookeeperPortal({ user, onLogout }) {
  const toMySQLDatetime = (date) => {
    const pad = (n) => String(n).padStart(2, "0");
    // Use UTC to match server timezone expectations
    const y = date.getUTCFullYear();
    const m = pad(date.getUTCMonth() + 1);
    const d = pad(date.getUTCDate());
    const hh = pad(date.getUTCHours());
    const mm = pad(date.getUTCMinutes());
    const ss = pad(date.getUTCSeconds());
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  };
  const [feedingTasks, setFeedingTasks] = useState([]);
  const [cleaningSchedules, setCleaningSchedules] = useState([]);
  const [cleaningCardData, setCleaningCardData] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskNotes, setTaskNotes] = useState("");
  const [taskType, setTaskType] = useState("feeding");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  // State to force periodic re-renders so relative timestamps update
  const [now, setNow] = useState(Date.now());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [topAlertDismissed, setTopAlertDismissed] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);
  const [cleaningActionLoading, setCleaningActionLoading] = useState(false);

  const { selectedWeather } = useWeather();

  const weatherAlert = (() => {
    if (!selectedWeather) return null;
    const t = selectedWeather.type;
    if (["Rain", "Storm", "High Wind"].includes(t)) {
      return {
        title: "Weather Impact Information",
        detail: "Outdoor and Hybrid exhibits are closed for visitor safety.",
      };
    }
    if (t === "Snow") {
      return {
        title: "Weather Impact Information",
        detail: "Outdoor exhibits are closed for visitor safety.",
      };
    }
    if (["Extreme Heat", "Extreme Cold"].includes(t)) {
      return {
        title: "Weather Impact Information",
        detail: "All exhibits are closed for visitor safety.",
      };
    }
    return null;
  })();

  const notificationListHeight = useMemo(() => {
    const count = (notifications || []).length;
    if (count === 0) return "auto";
    if (count <= 4) return "auto";
    const itemApproxPx = 88; // approximate height per notification item
    const paddingPx = 24; // extra padding in the list
    const maxPx = 520; // maximum height before scrolling
    // Cap the visible height to roughly 4 items (so scrolling begins after 4)
    const calc = 4 * itemApproxPx + paddingPx;
    return Math.min(calc, maxPx);
  }, [notifications]);
  const [feedingSearchTerm, setFeedingSearchTerm] = useState("");
  const ALL_ENCLOSURES = "__ALL__";
  const [enclosureFilter, setEnclosureFilter] = useState(ALL_ENCLOSURES);
  const ALL_LEVELS = "__ALL_LEVELS__";
  const [feedingLevelFilter, setFeedingLevelFilter] = useState(ALL_LEVELS);

  useEffect(() => {
    loadAllData();
  }, []);

  // Update `now` every 10 seconds so `formatTimeAgo` refreshes on screen
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(id);
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadFeedingTasks(),
        loadCleaningSchedules(),
        loadCleaningCardData(),
        loadNotifications(),
        loadActivityLog(),
        loadEmployees(),
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setInitialLoadDone(true);
    }
  };

  const loadFeedingTasks = async () => {
    try {
      const tasks = await zookeeperAPI.getFeedingTasks();
      setFeedingTasks(tasks);
    } catch (error) {
      console.error("Error loading feeding tasks:", error);
      toast.error("Failed to load feeding tasks");
    }
  };

  const loadCleaningSchedules = async () => {
    try {
      const schedules = await zookeeperAPI.getCleaningSchedules();
      setCleaningSchedules(schedules);
    } catch (error) {
      console.error("Error loading cleaning schedules:", error);
      toast.error("Failed to load cleaning schedules");
    }
  };

  const loadCleaningCardData = async () => {
    try {
      const data = await zookeeperAPI.getCleaningCardData();
      setCleaningCardData(data);
    } catch (error) {
      console.error("Error loading cleaning card data:", error);
      toast.error("Failed to load cleaning card data");
    }
  };

  const loadNotifications = async () => {
    try {
      // Get cleaning card data to check for habitats at 100% progress
      const cleaningData = await zookeeperAPI.getCleaningCardData();
      const notifs = await zookeeperAPI.getNotifications({ range: "24hours" });

      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Filter for only new animals within 24 hours
      const newAnimalNotifs = (notifs || []).filter((n) => {
        if (n.type !== "new_animal") return false;
        const nDate = parseServerDate(n.timestamp);
        if (!nDate) return false;
        return nDate >= twentyFourHoursAgo && nDate <= now;
      });

      // Create cleaning due notifications for habitats at 100% progress
      const cleaningDueNotifs = (cleaningData || [])
        .filter((data) => {
          const cycleDays = data.cycle_days ?? data.cycleDays ?? 7;
          const daysRemaining = data.days_remaining ?? data.daysRemaining ?? 0;
          const daysPassed =
            data.days_passed ??
            data.daysPassed ??
            Math.max(0, cycleDays - daysRemaining);
          return daysPassed >= cycleDays; // 100% progress
        })
        .map((data) => ({
          id: `cleaning_due_${data.Enclosure_ID}`,
          type: "cleaning_due",
          message: `${data.Enclosure_Name} Ready for Cleaning`,
          details: `This habitat has reached its 7-day cleaning cycle and is ready to be cleaned.`,
          timestamp: new Date().toISOString(),
          enclosure_id: data.Enclosure_ID,
        }));

      // Sort notifications: new animals first (by timestamp, most recent first), then cleaning due
      const sortedNewAnimals = newAnimalNotifs.sort((a, b) => {
        const dateA = parseServerDate(a.timestamp);
        const dateB = parseServerDate(b.timestamp);
        return dateB - dateA; // most recent first
      });

      const allNotifications = [...sortedNewAnimals, ...cleaningDueNotifs];
      setNotifications(allNotifications);
    } catch (error) {
      toast.error("Failed to load notifications");
    }
  };

  const loadActivityLog = async () => {
    try {
      // Get all care logs from Animal_Care_Log table (includes maintenance logs for cleaning)
      const careLogs = await zookeeperAPI.getAllCareLogs({
        logTypes: "fed,maintenance,new",
        limit: 100,
      });

      // Map care logs to UI format
      const mappedCareLogs = (careLogs || []).map((l) => {
        let normalizedType = "other";
        const rawType = (l.Log_Type || "").toLowerCase();

        if (rawType === "fed") {
          normalizedType = "feeding";
        } else if (rawType === "maintenance") {
          normalizedType = "cleaning";
        } else if (rawType === "new") {
          normalizedType = "new_animal";
        }

        return {
          id: l.Log_ID,
          type: normalizedType,
          activity: l.Activity,
          animal_name: l.Animal_Name,
          enclosure_name: l.Enclosure_Name,
          employee_name:
            `${l.First_Name || ""} ${l.Last_Name || ""}`.trim() || "System",
          notes: l.Notes,
          timestamp: l.Log_Date,
        };
      });

      // Sort by timestamp (most recent first)
      const allLogs = mappedCareLogs.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      setActivityLog(allLogs);
    } catch (error) {
      console.error("Error loading activity log:", error);
      toast.error("Failed to load activity log");
    }
  };

  const loadEmployees = async () => {
    try {
      const emps = await employeeAPI.getZookeepers();
      setEmployees(emps || []);
    } catch (error) {
      console.error("Error loading employees:", error);
      toast.error("Failed to load employees");
    }
  };

  const handleFeedAnimal = (task) => {
    setSelectedTask(task);
    setTaskType("feeding");
    setTaskDialogOpen(true);
  };

  const handleCleanHabitat = async (habitatData) => {
    setCleaningActionLoading(true);
    try {
      await zookeeperAPI.markHabitatCleaned(
        habitatData.Enclosure_ID,
        user.Employee_ID,
        `Habitat cleaned by ${user.First_Name} ${user.Last_Name}`
      );
      toast.success(
        `${habitatData.Enclosure_Name} marked as cleaned successfully!`
      );
      await Promise.all([
        loadCleaningCardData(),
        loadActivityLog(),
        loadNotifications(),
      ]);
    } catch (error) {
      console.error("Error marking habitat as cleaned:", error);
      toast.error("Failed to mark habitat as cleaned");
    } finally {
      setCleaningActionLoading(false);
    }
  };

  const handleCancelCleaning = async (habitatData) => {
    setCleaningActionLoading(true);
    try {
      await zookeeperAPI.cancelCleaning(habitatData.Enclosure_ID, 1);
      toast.info(
        `Cleaning for ${habitatData.Enclosure_Name} postponed by 1 day`
      );
      await loadCleaningCardData();
    } catch (error) {
      console.error("Error cancelling cleaning:", error);
      toast.error("Failed to cancel cleaning");
    } finally {
      setCleaningActionLoading(false);
    }
  };

  const handleSkipCleaning = async (habitatData) => {
    setCleaningActionLoading(true);
    try {
      await zookeeperAPI.cancelCleaning(habitatData.Enclosure_ID, 1);
      toast.info(`Skipped 1 day for ${habitatData.Enclosure_Name}`);
      await loadCleaningCardData();
    } catch (error) {
      console.error("Error skipping cleaning:", error);
      toast.error("Failed to skip cleaning");
    } finally {
      setCleaningActionLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalAnimals = feedingTasks.length || 0;
    const fullyFed = feedingTasks.filter((t) => t.Status === "complete").length;
    const partiallyFed = feedingTasks.filter(
      (t) => t.Status === "partial"
    ).length;

    const totalHabitats = (cleaningCardData || []).length || 0;
    const cleanHabitats = (cleaningCardData || []).reduce((acc, data) => {
      const cycleDays = data.cycle_days ?? data.cycleDays ?? 7;
      const daysRemaining = data.days_remaining ?? data.daysRemaining ?? 0;
      const daysPassed =
        data.days_passed ??
        data.daysPassed ??
        Math.max(0, cycleDays - daysRemaining);
      // Clean Now is enabled when daysPassed >= 4; so a cleaned habitat is when it's disabled
      const cleanDisabled = cleaningActionLoading ? true : !(daysPassed >= 4);
      return acc + (cleanDisabled ? 1 : 0);
    }, 0);

    return {
      totalAnimals,
      fullyFed,
      partiallyFed,
      feedingProgress: totalAnimals
        ? Math.round((fullyFed / totalAnimals) * 100)
        : 0,
      totalHabitats,
      cleanHabitats,
      cleaningProgress: totalHabitats
        ? Math.round((cleanHabitats / totalHabitats) * 100)
        : 0,
    };
  }, [feedingTasks, cleaningCardData, cleaningActionLoading]);

  const filteredFeedingTasks = useMemo(() => {
    const term = (feedingSearchTerm || "").trim().toLowerCase();
    if (!term) return [...feedingTasks];

    return feedingTasks.filter((task) => {
      const idMatch = task.Animal_ID?.toString().toLowerCase().includes(term);
      const nameMatch = task.Animal_Name?.toLowerCase().includes(term);
      const speciesMatch = task.Species?.toLowerCase().includes(term);
      return idMatch || nameMatch || speciesMatch;
    });
  }, [feedingTasks, feedingSearchTerm]);

  const enclosureOptions = useMemo(() => {
    const set = new Set(
      (feedingTasks || []).map((t) => t.Enclosure_Name).filter(Boolean)
    );
    return Array.from(set).sort();
  }, [feedingTasks]);

  const cleanableCount = useMemo(() => {
    if (!cleaningCardData || cleaningCardData.length === 0) return 0;
    return cleaningCardData.reduce((acc, data) => {
      const cycleDays = data.cycle_days ?? data.cycleDays ?? 7;
      const daysRemaining = data.days_remaining ?? data.daysRemaining ?? 0;
      const daysPassed =
        data.days_passed ??
        data.daysPassed ??
        Math.max(0, cycleDays - daysRemaining);
      const cleanDisabled = cleaningActionLoading || !(daysPassed >= 4);
      return acc + (cleanDisabled ? 0 : 1);
    }, 0);
  }, [cleaningCardData, cleaningActionLoading]);

  const filteredThenEnclosure = useMemo(() => {
    if (enclosureFilter === "" || enclosureFilter === ALL_ENCLOSURES)
      return filteredFeedingTasks;
    return filteredFeedingTasks.filter(
      (t) => (t.Enclosure_Name || "") === enclosureFilter
    );
  }, [filteredFeedingTasks, enclosureFilter]);

  const filteredByLevel = useMemo(() => {
    if (feedingLevelFilter === "" || feedingLevelFilter === ALL_LEVELS)
      return filteredThenEnclosure;

    return filteredThenEnclosure.filter((t) => {
      const fed = Number(t.Fed_Today) || 0;
      const meals = Number(t.Meals_Per_Day) || 0;
      if (feedingLevelFilter === "empty") {
        // Empty means zero meals fed today
        return fed === 0;
      }
      if (feedingLevelFilter === "partial") {
        // Partial means fed at least once but not yet full
        return fed > 0 && fed < meals;
      }
      if (feedingLevelFilter === "full") {
        // Full means fed enough meals for the day
        return meals > 0 ? fed >= meals : fed > 0;
      }
      return true;
    });

    return filteredThenEnclosure;
  }, [filteredThenEnclosure, feedingLevelFilter]);

  const sortedFeedingTasks = useMemo(() => {
    const statusOrder = { unfed: 0, partial: 1, complete: 2 };
    return [...filteredByLevel].sort(
      (a, b) => (statusOrder[a.Status] ?? 99) - (statusOrder[b.Status] ?? 99)
    );
  }, [filteredByLevel]);

  const feedingListHeight = useMemo(() => {
    const count = (sortedFeedingTasks || []).length || 0;
    const cols =
      typeof window !== "undefined" && window.innerWidth >= 768 ? 2 : 1;
    const rows = Math.max(1, Math.ceil(count / cols));
    const approxItemHeight = 112; // estimate per item in px
    const rowGap = 12; // grid gap in px
    const padding = 24; // padding allowance
    const computed = rows * approxItemHeight + (rows - 1) * rowGap + padding;
    const minH = 120;
    const maxH = 720;
    return Math.min(maxH, Math.max(minH, computed));
  }, [sortedFeedingTasks.length]);
  const navigate = useNavigate();
  const location = useLocation();

  const allowedZookeeperTabs = ["feeding", "cleaning", "activity"];
  const [activeTab, setActiveTab] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(location.search);
        const tab = params.get("tab");
        if (tab && allowedZookeeperTabs.includes(tab)) return tab;
        return localStorage.getItem("zookeeper.activeTab") || "feeding";
      }
    } catch (e) {
      // ignore
    }
    return "feeding";
  });
  // Persist active tab and reflect it in the document title
  const zookeeperTabLabels = {
    feeding: "Feeding",
    cleaning: "Cleaning",
    activity: "Activity",
  };
  const zookeeperBaseTitle = "Zookeeper Portal";
  const zookeeperPageTitle = zookeeperTabLabels[activeTab]
    ? `${zookeeperBaseTitle} - ${zookeeperTabLabels[activeTab]}`
    : zookeeperBaseTitle;
  usePageTitle(zookeeperPageTitle);
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("zookeeper.activeTab", activeTab);
      }
    } catch (e) {
      // ignore
    }
  }, [activeTab]);

  // Keep the URL in sync with the active tab (query param: ?tab=...)
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

  // Show a small centered loading popup when switching tabs after initial load
  useEffect(() => {
    if (!initialLoadDone) return;
    setTabLoading(true);
    const t = setTimeout(() => setTabLoading(false), 300);
    return () => clearTimeout(t);
  }, [activeTab, initialLoadDone]);

  // Handle tab changes: wait for required data to load before switching
  const handleTabChange = async (tab) => {
    if (tab === activeTab) return;
    if (tabLoading) return;
    setPendingTab(tab);
    setTabLoading(true);
    try {
      if (tab === "feeding") {
        await Promise.all([loadFeedingTasks(), loadEmployees()]);
      } else if (tab === "cleaning") {
        await Promise.all([loadCleaningSchedules(), loadCleaningCardData()]);
      } else if (tab === "activity") {
        await loadActivityLog();
      }
      // small debounce to avoid flicker
      await new Promise((r) => setTimeout(r, 120));
    } catch (e) {
      console.warn("Tab preload failed:", e);
    } finally {
      setActiveTab(tab);
      setPendingTab(null);
      setTabLoading(false);
    }
  };
  const activityListRef = useRef(null);

  useEffect(() => {
    if (activeTab === "activity" && activityListRef.current) {
      try {
        activityListRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } catch (e) {
        // fallback: set focus
        activityListRef.current.focus?.();
      }
    }
  }, [activeTab]);

  // Pagination for Activity Log
  const [activityPage, setActivityPage] = useState(1);
  const ACTIVITY_PAGE_SIZE = 5;

  const dailyActivityLog = useMemo(() => {
    const today = new Date();
    const isSameLocalDay = (a, b) => {
      try {
        const da = new Date(a);
        const db = new Date(b);
        return (
          da.getFullYear() === db.getFullYear() &&
          da.getMonth() === db.getMonth() &&
          da.getDate() === db.getDate()
        );
      } catch (e) {
        return false;
      }
    };

    return (activityLog || []).filter(
      (l) => l && l.timestamp && isSameLocalDay(l.timestamp, today)
    );
  }, [activityLog]);

  const activityTotalPages = Math.max(
    1,
    Math.ceil((dailyActivityLog || []).length / ACTIVITY_PAGE_SIZE)
  );

  useEffect(() => {
    setActivityPage(1);
  }, [dailyActivityLog.length]);
  const handleFastForwardCleaning = async (enclosureId) => {
    try {
      // This would advance the countdown - for now just show message
      toast.info(
        "Fast forward feature - would advance cleaning countdown by 1 day"
      );
      // In a real implementation, you'd update the backend here
    } catch (error) {
      console.error("Error fast forwarding:", error);
      toast.error("Failed to fast forward");
    }
  };

  const getTriggerStyle = (val) => {
    const isActive = activeTab === val;
    const base = {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      borderRadius: "9999px",
      padding: "0.25rem 0.75rem",
      fontSize: "0.875rem",
      fontWeight: 600,
      cursor: "pointer",
      transition:
        "background-color 0.15s ease, color 0.15s ease, transform 0.12s ease",
      alignSelf: "center",
    };

    if (isActive) {
      // Per-tab active colors to match the stat cards
      const activeStyles = {
        feeding: {
          backgroundColor: "#fb923c", // orange-400
          color: "#ffffff",
          boxShadow: "0 2px 6px rgba(251,146,60,0.12)",
          border: "1px solid rgba(0,0,0,0.04)",
        },
        cleaning: {
          backgroundColor: "#10b981", // green-500
          color: "#ffffff",
          boxShadow: "0 2px 6px rgba(16,185,129,0.12)",
          border: "1px solid rgba(0,0,0,0.04)",
        },
        activity: {
          backgroundColor: "#3b82f6", // blue-500
          color: "#ffffff",
          boxShadow: "0 2px 6px rgba(59,130,246,0.12)",
          border: "1px solid rgba(0,0,0,0.04)",
        },
      };

      return {
        ...base,
        transform: "translateY(-1px)",
        ...(activeStyles[val] || activeStyles.activity),
      };
    }

    return {
      ...base,
      backgroundColor: "transparent",
      color: "#374151",
      border: "1px solid transparent",
      padding: "0.25rem 0.5rem",
    };
  };

  const handleSaveTask = async () => {
    if (!selectedTask) return;

    try {
      if (taskType === "feeding") {
        // Validate employee selection
        if (!selectedEmployeeId) {
          toast.error("Please select a zookeeper");
          return;
        }

        const feedingTask = selectedTask;
        const selectedEmployee = employees.find(
          (e) => e.Employee_ID === parseInt(selectedEmployeeId)
        );

        if (!selectedEmployee) {
          toast.error("Invalid employee selected");
          return;
        }

        // Create feeding log - let server timestamp with NOW() for accurate UTC time
        await zookeeperAPI.createCareLog({
          animalId: feedingTask.Animal_ID,
          employeeId: parseInt(selectedEmployeeId),
          activity: `Fed ${feedingTask.Animal_Name}`,
          logType: "fed",
          notes: taskNotes || null,
        });

        toast.success(`Feeding logged for ${feedingTask.Animal_Name}`, {
          description: `Fed by ${selectedEmployee.First_Name} ${selectedEmployee.Last_Name}`,
        });

        // Reload all data to update stats, feeding tasks, and activity log
        await Promise.all([
          loadFeedingTasks(),
          loadActivityLog(),
          loadNotifications(),
        ]);
      } else {
        // Create cleaning log
        const cleaningSchedule = selectedTask;

        // Find an animal in this enclosure to log against
        const enclosureAnimals = feedingTasks.filter(
          (t) => t.Enclosure_Name === cleaningSchedule.Enclosure_Name
        );

        if (enclosureAnimals.length === 0) {
          toast.error("No animals found in this enclosure");
          return;
        }

        await zookeeperAPI.createCareLog({
          animalId: enclosureAnimals[0].Animal_ID,
          employeeId: user.Employee_ID,
          activity: `Cleaned ${cleaningSchedule.Enclosure_Name}`,
          logType: "maintenance",
          notes: taskNotes || null,
        });

        toast.success(`${cleaningSchedule.Enclosure_Name} marked as cleaned`, {
          description: "7-day countdown started",
        });

        // Reload data
        await loadCleaningSchedules();
        await loadActivityLog();
      }

      setTaskDialogOpen(false);
      setSelectedTask(null);
      setTaskNotes("");
      setSelectedEmployeeId("");
    } catch (error) {
      console.error("Error saving task:", error);
      toast.error("Failed to save task");
    }
  };

  const handleDialogOpenChange = (open) => {
    setTaskDialogOpen(open);
    if (!open) {
      setSelectedTask(null);
      setTaskNotes("");
      setSelectedEmployeeId("");
    }
  };

  const formatTime = (dateString) => {
    const date = parseServerDate(dateString);
    if (!date) return "";
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDateTime = (dateString) => {
    const date = parseServerDate(dateString);
    if (!date) return "";
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  function parseServerDate(input) {
    if (!input) return null;
    if (input instanceof Date) return input;
    if (typeof input !== "string") return new Date(input);

    // If string ends with Z or has an explicit offset, parse directly
    if (/Z$/.test(input) || /[+-]\d{2}:?\d{2}$/.test(input)) {
      const d = new Date(input);
      return isNaN(d.getTime()) ? null : d;
    }

    // Detect MySQL DATETIME like '2025-11-15 12:35:46' and convert to UTC
    const m = input.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)$/);
    if (m) {
      const iso = `${m[1]}T${m[2]}Z`;
      const d = new Date(iso);
      return isNaN(d.getTime()) ? null : d;
    }

    // Fallback to default parsing
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  const formatMonthDay = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Never";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "Unknown";

    // Parse the date - handle both ISO strings and MySQL datetime strings
    let date;
    try {
      // If it's already a Date object, use it; otherwise parse the string
      date = dateString instanceof Date ? dateString : new Date(dateString);

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.error("Invalid date:", dateString);
        return "Invalid date";
      }
    } catch (e) {
      console.error("Error parsing date:", dateString, e);
      return "Invalid date";
    }

    const now = new Date();
    let diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 0) diffInSeconds = 0;

    // Seconds precision for very recent items
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

    // Show minutes and seconds for items less than an hour
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      const seconds = diffInSeconds % 60;
      return `${minutes}m ${seconds}s ago`;
    }

    // Show hours and minutes for items less than a day
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      const minutes = Math.floor((diffInSeconds % 3600) / 60);
      return `${hours}h ${minutes}m ago`;
    }

    // Show days and hours for items less than a week
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      const hours = Math.floor((diffInSeconds % 86400) / 3600);
      return `${days}d ${hours}h ago`;
    }

    return formatDate(dateString);
  };

  const getCleaningStatusColor = (daysRemaining) => {
    if (daysRemaining === 0) return "bg-red-600";
    if (daysRemaining <= 2) return "bg-orange-500";
    if (daysRemaining <= 4) return "bg-yellow-500";
    return "bg-green-600";
  };

  const saveDisabled = taskType === "feeding" && !selectedEmployeeId;

  // Always render main layout; show a small centered loading popup while loading

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Small centered loading popup for tab navigation */}
      {(tabLoading || loading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto bg-white rounded-lg shadow-lg px-6 py-6 w-56 text-center">
            <LoadingWithIcon text="Loading..." size={36} imgClassName="" />
          </div>
        </div>
      )}
      <style>{`
        .progress-animated-fill{
          position: relative;
          background: linear-gradient(90deg, var(--p-color) 0%, var(--p-color) 90%, rgba(var(--p-rgb),0.12) 100%);
          overflow: hidden;
        }

        .progress-animated-fill::before{
          content: "";
          position: absolute;
          top: 0;
          left: -40%;
          width: 40%;
          height: 100%;
          background: linear-gradient(90deg, rgba(var(--p-rgb),0.06) 0%, rgba(var(--p-rgb),0.12) 50%, rgba(var(--p-rgb),0.06) 100%);
          transform: skewX(-12deg);
          animation: prog-move 1.6s linear infinite;
          pointer-events: none;
        }

        .progress-animated-fill.no-fade{
          background: var(--p-color) !important;
        }

        .progress-animated-fill.no-fade::before{
          display: none !important;
        }

        @keyframes prog-move{
          from { transform: translateX(0) skewX(-12deg); }
          to { transform: translateX(140%) skewX(-12deg); }
        }

        .progress-track-frame{
          padding: 2px;
          border-radius: 9999px;
          background-color: #e5e7eb;
          border: 1px solid rgba(0,0,0,0.6);
          box-sizing: border-box;
          overflow: hidden;
        }
      `}</style>
      {/* Header - match other staff portals */}
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
                  className="font-semibold text-xl"
                  style={{ color: "#2E7D32" }}
                >
                  Staff Portal
                </h1>
                <p className="text-sm text-gray-600">Zookeeper Dashboard</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Popover
                open={notificationOpen}
                onOpenChange={setNotificationOpen}
              >
                <PopoverTrigger asChild>
                  <button
                    className="p-2 rounded-full transition-colors relative bg-transparent hover:bg-transparent active:bg-transparent focus:outline-none cursor-pointer overflow-visible"
                    aria-label="Notifications"
                  >
                    <Bell className="h-8 w-8 text-gray-700" />
                    {notifications.length > 0 && (
                      <span
                        className="absolute top-0 right-0 translate-x-1/3 -translate-y-1/3 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white  border-white pointer-events-none"
                        aria-hidden
                      >
                        <span style={{ fontSize: "13px" }}>
                          {notifications.length > 9
                            ? "9+"
                            : notifications.length}
                        </span>
                      </span>
                    )}
                  </button>
                </PopoverTrigger>

                <PopoverContent
                  align="end"
                  style={{ maxWidth: "24rem", width: "100%", padding: 0 }}
                >
                  <div
                    style={{
                      padding: "1rem",
                      borderBottom: "1px solid #e5e7eb",
                      background: "linear-gradient(to right, #dbeafe, #ccfbf1)",
                    }}
                  >
                    <div style={{ position: "relative" }}>
                      {notifications.length > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            right: "1rem",
                            top: "0.75rem",
                          }}
                        >
                          <Badge
                            style={{
                              backgroundColor: "#2563eb",
                              color: "#ffffff",
                            }}
                          >
                            {notifications.length}
                          </Badge>
                        </div>
                      )}
                      <div
                        style={{
                          textAlign: "left",
                          paddingLeft: "0.5rem",
                          paddingRight: "2.5rem",
                        }}
                      >
                        <h3 style={{ fontWeight: 600 }}>Notifications</h3>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#4b5563",
                            marginTop: "0.25rem",
                          }}
                        >
                          Active Alerts
                        </p>
                      </div>
                    </div>
                  </div>
                  <ScrollArea
                    className="w-full"
                    height={notificationListHeight}
                  >
                    {notifications.length === 0 ? (
                      <div
                        style={{
                          padding: "2rem",
                          textAlign: "center",
                          color: "#6b7280",
                        }}
                      >
                        <Bell
                          className="h-12 w-12 mx-auto mb-3"
                          style={{
                            color: "#9ca3af",
                            opacity: 0.5,
                          }}
                        />
                        <p style={{ fontWeight: 500 }}>No notifications</p>
                        <p style={{ fontSize: "0.875rem" }}>
                          You're all caught up!
                        </p>
                      </div>
                    ) : (
                      <div style={{ padding: "0.5rem" }}>
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            style={{
                              padding: "1rem",
                              paddingRight: "2rem",
                              marginBottom: "0.75rem",
                              borderRadius: "0.5rem",
                              border:
                                notif.type === "new_animal"
                                  ? "1px solid #bbf7d0"
                                  : "1px solid #a5f3fc",
                              backgroundColor:
                                notif.type === "new_animal"
                                  ? "#f0fdf4"
                                  : "#ecfeff",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "1rem",
                              }}
                            >
                              <div
                                style={{
                                  marginTop: "0.375rem",
                                  borderRadius: "9999px",
                                  padding: "0.5rem",
                                  backgroundColor:
                                    notif.type === "new_animal"
                                      ? "#dcfce7"
                                      : "#cffafe",
                                  color:
                                    notif.type === "new_animal"
                                      ? "#15803d"
                                      : "#0e7490",
                                }}
                              >
                                {notif.type === "new_animal" ? (
                                  <PawPrint className="h-6 w-6" />
                                ) : (
                                  <Sparkles className="h-6 w-6" />
                                )}
                              </div>
                              <div
                                style={{
                                  flex: 1,
                                  minWidth: 0,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: "0.5rem",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: 8,
                                      alignItems: "center",
                                    }}
                                  >
                                    <Badge
                                      variant="outline"
                                      style={{
                                        fontSize: "0.75rem",
                                      }}
                                    >
                                      {notif.type === "new_animal"
                                        ? "New Animal"
                                        : "Cleaning Due"}
                                    </Badge>
                                  </div>

                                  {/* Show timestamp only for new animal notifications */}
                                  {notif.type === "new_animal" && (
                                    <div
                                      style={{
                                        fontSize: "0.75rem",
                                        color: "#6b7280",
                                        marginLeft: 12,
                                      }}
                                    >
                                      {formatTimeAgo(notif.timestamp)}
                                    </div>
                                  )}
                                </div>
                                <p
                                  style={{
                                    fontSize: "1rem",
                                    fontWeight: 600,
                                    marginBottom: "0.25rem",
                                    color:
                                      notif.type === "new_animal"
                                        ? "#14532d"
                                        : "#164e63",
                                  }}
                                >
                                  {notif.message}
                                </p>
                                {notif.details && (
                                  <p
                                    style={{
                                      fontSize: "0.875rem",
                                      color: "#4b5563",
                                    }}
                                  >
                                    {notif.details}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              <div className="text-right">
                <p className="font-medium" style={{ color: "#2E7D32" }}>
                  {user.First_Name} {user.Last_Name}
                </p>
              </div>

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

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Top Weather Alert (centered) */}
        {weatherAlert && (
          <div className="mb-6 flex justify-center">
            <div className="w-full max-w-3xl">
              <Card className="rounded-lg shadow-sm border border-red-200 bg-red-100">
                <CardContent className="py-6 text-center">
                  <div className="flex flex-col items-center">
                    <AlertTriangle className="h-6 w-6 text-red-800 mb-2" />
                    <h3 className="font-semibold text-lg text-red-900">
                      {weatherAlert.title}
                    </h3>
                    <p className="text-sm text-red-800 mt-2 max-w-xl">
                      {weatherAlert.detail}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* New Animal Banner */}
        {notifications.some((n) => n.type === "new_animal") &&
          !topAlertDismissed && (
            <Card
              style={{
                marginBottom: "1.5rem",
                borderLeft: "4px solid #16a34a",
                background:
                  "linear-gradient(to right, #f0fdf4, #ccfbf1, #d1fae5)",
              }}
            >
              <CardContent style={{ padding: "1.5rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "1rem",
                      flex: 1,
                    }}
                  >
                    <div
                      style={{
                        borderRadius: "9999px",
                        padding: "0.75rem",
                        marginTop: "0.25rem",
                        backgroundColor: "#16a34a",
                      }}
                    >
                      <PawPrint
                        className="h-6 w-6"
                        style={{ color: "#ffffff" }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          marginBottom: "0.5rem",
                        }}
                      >
                        <h3
                          style={{
                            fontWeight: 600,
                            fontSize: "1.125rem",
                            color: "#14532d",
                          }}
                        >
                          {
                            notifications.find((n) => n.type === "new_animal")
                              ?.message
                          }
                        </h3>
                        <Badge
                          style={{
                            backgroundColor: "#16a34a",
                            color: "#ffffff",
                          }}
                        >
                          New
                        </Badge>
                      </div>
                      {notifications.find((n) => n.type === "new_animal")
                        ?.details && (
                        <p
                          style={{
                            fontSize: "0.875rem",
                            marginBottom: "0.5rem",
                            color: "#15803d",
                          }}
                        >
                          {
                            notifications.find((n) => n.type === "new_animal")
                              ?.details
                          }
                        </p>
                      )}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          fontSize: "0.75rem",
                          color: "#4b5563",
                        }}
                      >
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatTimeAgo(
                            notifications.find((n) => n.type === "new_animal")
                              ?.timestamp
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTopAlertDismissed(true)}
                    style={{
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "rgba(0,0,0,0.05)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <X className="h-5 w-5" style={{ color: "#6b7280" }} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        {/* Cleaning Due Banner */}
        {notifications.some((n) => n.type === "cleaning_due") && (
          <Card
            style={{
              marginBottom: "1.5rem",
              borderLeft: "4px solid #0891b2",
              background:
                "linear-gradient(to right, #ecfeff, #cffafe, #a5f3fc)",
            }}
          >
            <CardContent style={{ padding: "1.5rem" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "1rem",
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      borderRadius: "9999px",
                      padding: "0.75rem",
                      marginTop: "0.25rem",
                      backgroundColor: "#0891b2",
                    }}
                  >
                    <Sparkles
                      className="h-6 w-6"
                      style={{ color: "#ffffff" }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <h3
                        style={{
                          fontWeight: 600,
                          fontSize: "1.125rem",
                          color: "#164e63",
                        }}
                      >
                        {notifications.filter((n) => n.type === "cleaning_due")
                          .length > 1
                          ? `${
                              notifications.filter(
                                (n) => n.type === "cleaning_due"
                              ).length
                            } Habitats Ready for Cleaning`
                          : notifications.find((n) => n.type === "cleaning_due")
                              ?.message}
                      </h3>
                      <Badge
                        style={{
                          backgroundColor: "#dc2626",
                          color: "#ffffff",
                        }}
                      >
                        Overdue
                      </Badge>
                    </div>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        marginBottom: "0.5rem",
                        color: "#0e7490",
                      }}
                    >
                      {notifications.filter((n) => n.type === "cleaning_due")
                        .length > 1
                        ? `Multiple habitats have reached their 7-day cleaning cycle and need attention.`
                        : notifications.find((n) => n.type === "cleaning_due")
                            ?.details}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-4">
          <Card
            className="overflow-hidden shadow-sm"
            style={{
              borderLeft: "4px solid #16a34a",
              background: "linear-gradient(90deg,#ecfdf5 0%, #ffffff 100%)",
            }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Animals Fed
                  </p>
                  <p
                    className="text-3xl font-semibold"
                    style={{ color: "#166534" }}
                  >
                    {stats.fullyFed}/{stats.totalAnimals}
                  </p>
                  {/* Progress bar removed from stats card per request */}
                </div>
                <PawPrint
                  className="h-10 w-10"
                  style={{ color: "rgba(187,247,208,0.75)" }}
                />
              </div>
            </CardContent>
          </Card>

          <Card
            className="overflow-hidden shadow-sm"
            style={{
              borderLeft: "4px solid #d97706",
              background: "linear-gradient(90deg,#fffbeb 0%, #ffffff 100%)",
            }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Partial Feeding
                  </p>
                  <p
                    className="text-3xl font-semibold"
                    style={{ color: "#92400e" }}
                  >
                    {stats.partiallyFed}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Need more meals</p>
                </div>
                <Clock
                  className="h-10 w-10"
                  style={{ color: "rgba(253,230,138,0.75)" }}
                />
              </div>
            </CardContent>
          </Card>

          <Card
            className="overflow-hidden shadow-sm"
            style={{
              borderLeft: "4px solid #0d9488",
              background: "linear-gradient(90deg,#f0fdfa 0%, #ffffff 100%)",
            }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Cleaned Habitats
                  </p>
                  <p
                    className="text-3xl font-semibold"
                    style={{ color: "#0f766e" }}
                  >
                    {stats.cleanHabitats}/{stats.totalHabitats}
                  </p>
                  {/* Progress bar removed from stats card per request */}
                </div>
                <Sparkles
                  className="h-10 w-10"
                  style={{ color: "rgba(153,246,228,0.75)" }}
                />
              </div>
            </CardContent>
          </Card>

          <Card
            className="overflow-hidden shadow-sm"
            style={{
              borderLeft: "4px solid #2563eb",
              background: "linear-gradient(90deg,#eff6ff 0%, #ffffff 100%)",
            }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">
                    Activity Today
                  </p>
                  <p
                    className="text-3xl font-semibold"
                    style={{ color: "#1e40af" }}
                  >
                    {dailyActivityLog.length}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Tasks completed</p>
                </div>
                <Activity
                  className="h-10 w-10"
                  style={{ color: "rgba(191,219,254,0.75)" }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Tasks */}
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="space-y-6"
        >
          <TabsList
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "0.5rem",
              backgroundColor: "#f3f4f6",
              padding: "8px 10px",
              minHeight: "44px",
              boxSizing: "border-box",
              borderRadius: "9999px",
              border: "1px solid #e5e7eb",
              flexWrap: "wrap",
            }}
          >
            <TabsTrigger value="feeding" style={getTriggerStyle("feeding")}>
              <PawPrint className="h-4 w-4" />
              <span className="ml-2">
                Feeding ({stats.totalAnimals - stats.fullyFed})
              </span>
            </TabsTrigger>

            <TabsTrigger value="cleaning" style={getTriggerStyle("cleaning")}>
              <Sparkles className="h-4 w-4" />
              <span className="ml-2">Cleaning ({cleanableCount})</span>
            </TabsTrigger>

            <TabsTrigger value="activity" style={getTriggerStyle("activity")}>
              <ClipboardCheck className="h-4 w-4" />
              <span className="ml-2">Daily Log</span>
            </TabsTrigger>
          </TabsList>

          {/* Feeding Tasks Tab */}
          <TabsContent value="feeding" className="space-y-4">
            <Card className="bg-white">
              <CardHeader className="space-y-4">
                {/* Title/description container with enclosure filter to the right */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="flex items-center">
                      <PawPrint className="h-5 w-5 mr-2 text-[#4CAF50]" />
                      Animal Feeding Schedule
                    </CardTitle>
                    <CardDescription>
                      Feed animals according to their meal requirements. Most
                      animals need 2 meals per day. Some reptiles are fed
                      weekly.
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={enclosureFilter}
                      onValueChange={(val) => setEnclosureFilter(val)}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="All Enclosures" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_ENCLOSURES}>
                          All Enclosures
                        </SelectItem>
                        {enclosureOptions.map((enc) => (
                          <SelectItem key={enc} value={enc}>
                            {enc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={feedingLevelFilter}
                      onValueChange={(val) => setFeedingLevelFilter(val)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="All Levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_LEVELS}>All Levels</SelectItem>
                        <SelectItem value="empty"> Empty</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="full">Full</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Search input to the right of the enclosure dropdown */}
                    <div className="max-w-[240px]">
                      <Input
                        id="feeding-search"
                        type="search"
                        value={feedingSearchTerm}
                        onChange={(event) =>
                          setFeedingSearchTerm(event.target.value)
                        }
                        placeholder="Search by ID, keywords"
                        className="mt-1 h-8 text-sm"
                        autoComplete="off"
                      />
                    </div>
                  </div>
                </div>

                {/* Search removed for Feeding Schedule - enclosure filter remains */}
              </CardHeader>
              <CardContent>
                {/* feeding list: allow the ScrollArea to size-to-content up to a cap */}
                <ScrollArea className="pr-2" height={feedingListHeight}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-2">
                    {sortedFeedingTasks.length === 0 ? (
                      <div className="col-span-full rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
                        No animals to display.
                      </div>
                    ) : (
                      sortedFeedingTasks.map((task) => (
                        <div
                          key={task.Animal_ID}
                          style={{
                            padding: "1rem",
                            borderRadius: "0.5rem",
                            border: "1px solid #e6e6e6",
                            backgroundColor: "#ffffff",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                            transition: "all 0.15s ease",
                            ...(task.Status === "unfed"
                              ? { borderLeft: "4px solid #ef4444" }
                              : task.Status === "partial"
                              ? { borderLeft: "4px solid #f59e0b" }
                              : task.Status === "complete"
                              ? {
                                  borderLeft: "4px solid #10b981",
                                  opacity: 0.95,
                                }
                              : { borderLeft: "4px solid transparent" }),
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              justifyContent: "space-between",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "1rem",
                                flex: 1,
                              }}
                            >
                              {task.Image_URL && (
                                <img
                                  src={task.Image_URL}
                                  alt={task.Animal_Name}
                                  style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: 8,
                                    objectFit: "cover",
                                  }}
                                />
                              )}
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    marginBottom: 8,
                                  }}
                                >
                                  <h3 style={{ fontWeight: 600, margin: 0 }}>
                                    {task.Animal_Name}
                                  </h3>
                                  {/* Unified fed badge: always show fed count as Fed(x/y).
                                      Color the badge by status but keep the text consistent. */}
                                  <Badge
                                    style={
                                      task.Status === "complete"
                                        ? {
                                            backgroundColor: "#ecfdf5",
                                            color: "#065f46",
                                            border: "1px solid #d1fae5",
                                          }
                                        : task.Status === "partial"
                                        ? {
                                            backgroundColor: "#fffbeb",
                                            color: "#92400e",
                                            border: "1px solid #fef3c7",
                                          }
                                        : {
                                            backgroundColor: "#fff1f2",
                                            color: "#881337",
                                            border: "1px solid #fecdd3",
                                          }
                                    }
                                  >
                                    Fed ({task.Fed_Today}/{task.Meals_Per_Day})
                                  </Badge>
                                </div>
                                <div
                                  style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(2,1fr)",
                                    columnGap: 24,
                                    rowGap: 4,
                                    fontSize: "0.875rem",
                                    color: "#4b5563",
                                  }}
                                >
                                  <p style={{ margin: 0 }}>
                                    {task.Enclosure_Name}
                                  </p>
                                  <p style={{ margin: 0 }}>{task.Species}</p>
                                  <p style={{ margin: 0 }}>Zone: {task.Zone}</p>
                                  <p
                                    style={{
                                      margin: 0,
                                      textAlign: "left",
                                      color: "#047857",
                                    }}
                                  >
                                    Last fed:{" "}
                                    {task.Last_Fed_Time ? (
                                      formatDateTime(task.Last_Fed_Time)
                                    ) : (
                                      <span style={{ color: "#6b7280" }}>
                                        Never
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div
                              style={{
                                marginLeft: 16,
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              {task.Status !== "complete" ? (
                                <Button
                                  onClick={() => handleFeedAnimal(task)}
                                  size="sm"
                                  style={{
                                    backgroundColor: "#10b981",
                                    color: "#ffffff",
                                    border: "none",
                                    padding: "0.35rem 0.75rem",
                                    borderRadius: 6,
                                    display: "inlineFlex",
                                    alignItems: "center",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                                  }}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Feed Now
                                </Button>
                              ) : (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    color: "#059669",
                                  }}
                                >
                                  <CheckCircle2 className="h-5 w-5 mr-1" />
                                  <span style={{ fontSize: "0.875rem" }}>
                                    Complete
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cleaning Tasks Tab */}
          <TabsContent value="cleaning" className="space-y-4">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-[#008080]" />
                  Habitat Cleaning Schedule (7-Day Cycle)
                </CardTitle>
                <CardDescription>
                  Each habitat must be cleaned every 7 days. Track the countdown
                  and cleaning status below.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>Loading cleaning schedules...</p>
                  </div>
                ) : cleaningCardData.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No cleaning schedules available</p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2,1fr)",
                      gap: 16,
                    }}
                  >
                    {cleaningCardData.map((data) => (
                      <CleaningCard
                        key={data.Enclosure_ID}
                        data={data}
                        onClean={handleCleanHabitat}
                        onCancel={handleCancelCleaning}
                        onSkip={handleSkipCleaning}
                        loading={cleaningActionLoading}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ClipboardCheck className="h-5 w-5 mr-2 text-blue-600" />
                  Daily Log
                </CardTitle>
                <CardDescription>
                  Today's activities, including feeding, cleaning tasks, and new
                  animal arrivals.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dailyActivityLog.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No activities logged today</p>
                    <p className="text-sm">
                      Complete feeding or cleaning tasks to see them here
                    </p>
                  </div>
                ) : (
                  <div ref={activityListRef} tabIndex={-1}>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        paddingRight: 8,
                      }}
                    >
                      {dailyActivityLog
                        .slice(
                          (activityPage - 1) * ACTIVITY_PAGE_SIZE,
                          activityPage * ACTIVITY_PAGE_SIZE
                        )
                        .map((log) => (
                          <div
                            key={log.id}
                            style={{
                              padding: 16,
                              borderRadius: 8,
                              border: "1px solid rgba(0,0,0,0.08)",
                              backgroundColor: "#f9fafb",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: 12,
                                  flex: 1,
                                }}
                              >
                                {log.type === "feeding" ? (
                                  <div
                                    style={{
                                      backgroundColor: "#4CAF50",
                                      borderRadius: 9999,
                                      padding: 8,
                                    }}
                                  >
                                    <PawPrint className="h-4 w-4 text-white" />
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      backgroundColor: "#008080",
                                      borderRadius: 9999,
                                      padding: 8,
                                    }}
                                  >
                                    <Sparkles className="h-4 w-4 text-white" />
                                  </div>
                                )}
                                <div style={{ flex: 1 }}>
                                  <p style={{ fontWeight: 600 }}>
                                    {log.activity
                                      ? log.activity
                                      : log.type === "feeding"
                                      ? "Animal Fed"
                                      : "Habitat Cleaned"}
                                  </p>
                                  {log.animal_name &&
                                    (log.type === "feeding" ||
                                      log.type === "new_animal") && (
                                      <p
                                        style={{
                                          fontSize: 14,
                                          color: "#4b5563",
                                        }}
                                      >
                                        Animal: {log.animal_name}
                                      </p>
                                    )}
                                  <p style={{ fontSize: 14, color: "#4b5563" }}>
                                    Location: {log.enclosure_name}
                                  </p>
                                  {log.type === "feeding" &&
                                    log.employee_name && (
                                      <p
                                        style={{
                                          fontSize: 14,
                                          color: "#4b5563",
                                        }}
                                      >
                                        By: {log.employee_name}
                                      </p>
                                    )}
                                  {log.notes && (
                                    <p
                                      style={{
                                        fontSize: 14,
                                        color: "#4b5563",
                                        marginTop: 4,
                                        fontStyle: "italic",
                                      }}
                                    >
                                      "{log.notes}"
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span style={{ fontSize: 14, color: "#6b7280" }}>
                                {formatDateTime(log.timestamp)}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Pagination controls */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 12,
                      }}
                    >
                      <div style={{ color: "#6b7280", fontSize: 14 }}>
                        Page {activityPage} of {activityTotalPages}
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setActivityPage((p) => Math.max(1, p - 1))
                          }
                          disabled={activityPage <= 1}
                        >
                          Prev
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setActivityPage((p) =>
                              Math.min(activityTotalPages, p + 1)
                            )
                          }
                          disabled={activityPage >= activityTotalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Task Completion Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {taskType === "feeding" ? "Log Feeding" : "Log Cleaning"}
            </DialogTitle>
            <DialogDescription>
              {taskType === "feeding"
                ? `Record feeding for ${selectedTask?.Animal_Name}`
                : `Record cleaning for ${selectedTask?.Enclosure_Name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {taskType === "feeding" ? (
              <>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 space-y-2">
                  <p className="text-sm">
                    <strong>Animal:</strong> {selectedTask?.Animal_Name}
                  </p>
                  <p className="text-sm">
                    <strong>Species:</strong> {selectedTask?.Species}
                  </p>
                  <p className="text-sm">
                    <strong>Habitat:</strong> {selectedTask?.Enclosure_Name}
                  </p>
                  <p className="text-sm">
                    <strong>Meals Today:</strong> {selectedTask?.Fed_Today}/
                    {selectedTask?.Meals_Per_Day}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employee">Zookeeper</Label>
                  <Select
                    value={selectedEmployeeId}
                    onValueChange={setSelectedEmployeeId}
                  >
                    <SelectTrigger id="employee">
                      <SelectValue placeholder="Select zookeeper" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem
                          key={emp.Employee_ID}
                          value={emp.Employee_ID.toString()}
                        >
                          {emp.First_Name} {emp.Last_Name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
                <p className="text-sm">
                  <strong>Enclosure:</strong> {selectedTask?.Enclosure_Name}
                </p>
                <p className="text-sm">
                  <strong>Zone:</strong> {selectedTask?.Zone}
                </p>
                <p className="text-sm">
                  <strong>Size:</strong> {selectedTask?.Size?.toLocaleString()}{" "}
                  sq ft
                </p>
                <p className="text-sm text-orange-700">
                  <strong>Next cleaning due:</strong> 7 days from now
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder={
                  taskType === "feeding"
                    ? "Add any observations about the animal's feeding behavior..."
                    : "Add any notes about the cleaning or habitat condition..."
                }
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleSaveTask}
              disabled={saveDisabled}
              style={
                taskType === "feeding"
                  ? {
                      backgroundColor: "#4CAF50",
                      color: "#ffffff",
                      cursor: saveDisabled ? "not-allowed" : "pointer",
                      opacity: saveDisabled ? 0.5 : 1,
                      border: "none",
                    }
                  : {
                      backgroundColor: "#008080",
                      color: "#ffffff",
                      cursor: "pointer",
                      border: "none",
                    }
              }
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {taskType === "feeding" ? "Log Feeding" : "Start 7-Day Countdown"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
