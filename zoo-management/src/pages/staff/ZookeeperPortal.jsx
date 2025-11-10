import { useState, useEffect, useMemo, useRef } from "react";
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
import { CleaningCard } from "../../components/CleaningCard";
import { zookeeperAPI, employeeAPI } from "../../services/zookeeperAPI";

export function ZookeeperPortal({ user, onLogout }) {
  // Helper: format a Date to MySQL DATETIME string 'YYYY-MM-DD HH:MM:SS'
  const toMySQLDatetime = (date) => {
    const pad = (n) => String(n).padStart(2, "0");
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
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
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [topAlertDismissed, setTopAlertDismissed] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cleaningActionLoading, setCleaningActionLoading] = useState(false);
  const [feedingSearchTerm, setFeedingSearchTerm] = useState("");
  const ALL_ENCLOSURES = "__ALL__";
  const [enclosureFilter, setEnclosureFilter] = useState(ALL_ENCLOSURES);
  const ALL_LEVELS = "__ALL_LEVELS__";
  const [feedingLevelFilter, setFeedingLevelFilter] = useState(ALL_LEVELS);

  useEffect(() => {
    loadAllData();
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
      const notifs = await zookeeperAPI.getNotifications();
      setNotifications(notifs || []);
    } catch (error) {
      console.error("Error loading notifications:", error);
      toast.error("Failed to load notifications");
    }
  };

  const loadActivityLog = async () => {
    try {
      // Request only the log types we want from backend, with filtering server-side
      const logs = await zookeeperAPI.getAllCareLogs({
        logTypes: "fed,maintenance,new",
        limit: 100,
      });

      // Map backend response to UI format
      const mapped = (logs || []).map((l) => {
        // Map Log_Type to normalized type names
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

      setActivityLog(mapped);
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
      await Promise.all([loadCleaningCardData(), loadActivityLog()]);
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

    // Use cleaningCardData (the same data used to compute "Clean Now" items)
    // so the stats align with the tab's cleanable count.
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

  // Count how many habitats are eligible for "Clean Now"
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

    // Prefer numeric checks (Fed_Today vs Meals_Per_Day) to be robust.
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
  const [activeTab, setActiveTab] = useState("feeding");
  const activityListRef = useRef(null);

  // Scroll into view when user switches to the Activity tab
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
  const activityTotalPages = Math.max(
    1,
    Math.ceil((activityLog || []).length / ACTIVITY_PAGE_SIZE)
  );

  // Reset to first page when activity data changes
  useEffect(() => {
    setActivityPage(1);
  }, [activityLog.length]);
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

  // Helper to compute inline styles for tab triggers based on active state
  // Produces a compact pill-style tab. Active tab is filled teal with white text.
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

    // Inactive: transparent with muted text so active pill stands out
    // Use shorthand padding to avoid mixing with paddingLeft/paddingRight
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

        // Create feeding log (include client timestamp formatted for MySQL)
        await zookeeperAPI.createCareLog({
          animalId: feedingTask.Animal_ID,
          employeeId: parseInt(selectedEmployeeId),
          activity: `Fed ${feedingTask.Animal_Name}`,
          logType: "fed",
          notes: taskNotes || null,
          logDate: toMySQLDatetime(new Date()),
        });

        toast.success(`Feeding logged for ${feedingTask.Animal_Name}`, {
          description: `Fed by ${selectedEmployee.First_Name} ${selectedEmployee.Last_Name}`,
        });

        // Reload data to get updated counts from backend
        await loadFeedingTasks();
        await loadActivityLog();
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
          logDate: toMySQLDatetime(new Date()),
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

  // Reset dialog fields when it closes (clears selection and typed input)
  const handleDialogOpenChange = (open) => {
    setTaskDialogOpen(open);
    if (!open) {
      setSelectedTask(null);
      setTaskNotes("");
      setSelectedEmployeeId("");
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
    const date = new Date(dateString);
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

  // Whether the primary save button in the task dialog should be disabled
  const saveDisabled = taskType === "feeding" && !selectedEmployeeId;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5DC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4CAF50] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
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
              {/* Notifications Bell - bell clickable only, badge outside (non-interactive) */}
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

                <PopoverContent className="w-96 p-0" align="end">
                  <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-teal-50">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Recent Notifications</h3>
                      <Badge className="bg-blue-600">
                        {notifications.length}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Past Week</p>
                  </div>
                  <ScrollArea
                    className="w-full"
                    height={
                      notifications.length === 0
                        ? "auto"
                        : notifications.length <= 2
                        ? 300
                        : notifications.length <= 4
                        ? 400
                        : 500
                    }
                  >
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Bell className="h-12 w-12 mx-auto mb-3 text-gray-400 opacity-50" />
                        <p className="font-medium">No notifications</p>
                        <p className="text-sm">You're all caught up!</p>
                      </div>
                    ) : (
                      <div className="p-2">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-3 mb-2 rounded-lg border ${
                              notif.type === "new_animal"
                                ? "bg-green-50 border-green-200"
                                : "bg-orange-50 border-orange-200"
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div
                                className={`mt-0.5 ${
                                  notif.type === "new_animal"
                                    ? "text-green-600"
                                    : "text-orange-600"
                                }`}
                              >
                                {notif.type === "new_animal" ? (
                                  <PawPrint className="h-5 w-5" />
                                ) : (
                                  <Sparkles className="h-5 w-5" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {notif.type === "new_animal"
                                      ? "New Animal"
                                      : "Cleaning Due"}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {formatTimeAgo(notif.timestamp)}
                                  </span>
                                </div>
                                <p
                                  className={`text-sm font-medium mb-1 ${
                                    notif.type === "new_animal"
                                      ? "text-green-900"
                                      : "text-orange-900"
                                  }`}
                                >
                                  {notif.message}
                                </p>
                                {notif.details && (
                                  <p className="text-xs text-gray-600">
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
        {/* Latest Notification */}
        {notifications.length > 0 && !topAlertDismissed && (
          <Card
            className={`mb-6 border-l-4 ${
              notifications[0].type === "new_animal"
                ? "border-l-green-600 bg-gradient-to-r from-green-50 via-teal-50 to-emerald-50"
                : "border-l-orange-600 bg-gradient-to-r from-orange-50 via-yellow-50 to-amber-50"
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div
                    className={`rounded-full p-3 ${
                      notifications[0].type === "new_animal"
                        ? "bg-green-600"
                        : "bg-orange-600"
                    }`}
                  >
                    {notifications[0].type === "new_animal" ? (
                      <PawPrint className="h-6 w-6 text-white" />
                    ) : (
                      <Sparkles className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3
                        className={`font-semibold text-lg ${
                          notifications[0].type === "new_animal"
                            ? "text-green-900"
                            : "text-orange-900"
                        }`}
                      >
                        {notifications[0].message}
                      </h3>
                      <Badge
                        className={
                          notifications[0].type === "new_animal"
                            ? "bg-green-600 text-white"
                            : "bg-orange-600 text-white"
                        }
                      >
                        New
                      </Badge>
                    </div>
                    {notifications[0].details && (
                      <p
                        className={`text-sm mb-2 ${
                          notifications[0].type === "new_animal"
                            ? "text-green-700"
                            : "text-orange-700"
                        }`}
                      >
                        {notifications[0].details}
                      </p>
                    )}
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimeAgo(notifications[0].timestamp)}</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTopAlertDismissed(true)}
                  className="cursor-pointer hover:bg-black/5 shrink-0"
                >
                  <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                </Button>
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
                  <div
                    className="mt-3 h-2 w-full overflow-hidden rounded-full"
                    style={{ backgroundColor: "#e5e7eb" }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${stats.feedingProgress}%`,
                        borderRadius: "9999px",
                        transition: "width 0.3s ease",
                        background:
                          "linear-gradient(90deg, #16a34a 0%, rgba(187,247,208,0.75) 60%, #ecfdf5 100%)",
                      }}
                    />
                  </div>
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
                    Clean Habitats
                  </p>
                  <p
                    className="text-3xl font-semibold"
                    style={{ color: "#0f766e" }}
                  >
                    {stats.cleanHabitats}/{stats.totalHabitats}
                  </p>
                  <div
                    className="mt-3 h-2 w-full overflow-hidden rounded-full"
                    style={{ backgroundColor: "#e5e7eb" }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${stats.cleaningProgress}%`,
                        borderRadius: "9999px",
                        transition: "width 0.3s ease",
                        background:
                          "linear-gradient(90deg, #0d9488 0%, rgba(153,246,228,0.75) 60%, #f0fdfa 100%)",
                      }}
                    />
                  </div>
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
                    Activity Past Week
                  </p>
                  <p
                    className="text-3xl font-semibold"
                    style={{ color: "#1e40af" }}
                  >
                    {activityLog.length}
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
          onValueChange={setActiveTab}
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
              <span className="ml-2">Weekly Log</span>
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
                {/* fixed feeding list height and internal scrolling */}
                <ScrollArea className="pr-2" height={720}>
                  <div className="space-y-3 pr-2">
                    {sortedFeedingTasks.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
                        No animals to display.
                      </div>
                    ) : (
                      sortedFeedingTasks.map((task) => (
                        <div
                          key={task.Animal_ID}
                          className={`p-4 rounded-lg border transition-all ${
                            task.Status === "unfed"
                              ? "border-red-300 bg-red-50"
                              : task.Status === "complete"
                              ? "border-green-300 bg-green-50 opacity-60"
                              : ""
                          }`}
                          style={
                            task.Status === "partial"
                              ? {
                                  border: "1px solid #fdba74",
                                  backgroundColor: "#fff7ed",
                                }
                              : undefined
                          }
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4 flex-1">
                              {task.Image_URL && (
                                <img
                                  src={task.Image_URL}
                                  alt={task.Animal_Name}
                                  className="w-16 h-16 rounded-lg object-cover"
                                />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h3 className="font-medium">
                                    {task.Animal_Name}
                                  </h3>
                                  {/* Unified fed badge: always show fed count as Fed(x/y).
                                      Color the badge by status but keep the text consistent. */}
                                  <Badge
                                    className={
                                      task.Status === "complete"
                                        ? "bg-green-100 text-green-800 border-green-200"
                                        : task.Status === "partial"
                                        ? "bg-orange-100 text-orange-800 border-orange-200"
                                        : "bg-red-100 text-red-800 border-red-200"
                                    }
                                  >
                                    Fed ({task.Fed_Today}/{task.Meals_Per_Day})
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600">
                                  <p>ID # {task.Animal_ID}</p>
                                  <p>{task.Enclosure_Name}</p>
                                  <p>{task.Species}</p>
                                  <p>Zone: {task.Zone}</p>
                                  <p className="col-span-2 text-green-700">
                                    Last fed:{" "}
                                    {task.Last_Fed_Time ? (
                                      formatDateTime(task.Last_Fed_Time)
                                    ) : (
                                      <span className="text-gray-500">
                                        Never
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="ml-4">
                              {task.Status !== "complete" ? (
                                <Button
                                  onClick={() => handleFeedAnimal(task)}
                                  className="bg-green-600 hover:bg-green-700 cursor-pointer"
                                  size="sm"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Feed Now
                                </Button>
                              ) : (
                                <div className="flex items-center text-green-700">
                                  <CheckCircle2 className="h-5 w-5 mr-1" />
                                  <span className="text-sm">Complete</span>
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
                    {cleaningCardData.map((data) => {
                      const progressPercent = Math.min(
                        100,
                        data.progress_percent ?? 0
                      );
                      const daysRemaining =
                        data.days_remaining ?? data.daysRemaining ?? 0;
                      const status = data.status || "";
                      const cycleDays = data.cycle_days ?? data.cycleDays ?? 7;
                      const daysPassed =
                        data.days_passed ??
                        data.daysPassed ??
                        Math.max(0, cycleDays - daysRemaining);

                      const progressColor =
                        daysRemaining === 0 || status === "Overdue"
                          ? "#dc2626"
                          : daysRemaining <= 2 || status === "Due Soon"
                          ? "#f97316"
                          : daysRemaining === 3
                          ? "#fbbf24"
                          : "#16a34a";

                      const daysColor =
                        daysRemaining === 0
                          ? "#b91c1c"
                          : daysRemaining <= 2
                          ? "#b45309"
                          : daysRemaining === 3
                          ? "#92400e"
                          : "#0f766e";

                      // Clean Now becomes available after at least 4 days have passed
                      const cleanDisabled =
                        cleaningActionLoading || !(daysPassed >= 4);

                      return (
                        <div
                          key={data.Enclosure_ID}
                          style={{
                            boxShadow: "0 8px 24px rgba(2,6,23,0.08)",
                            border: "1px solid rgba(0,0,0,0.06)",
                            borderRadius: 8,
                            // light subtle teal background to make the card stand out from the page
                            background:
                              "linear-gradient(180deg,#ecfdf5 0%, #ffffff 100%)",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              padding: 16,
                              borderBottom: "1px solid rgba(0,0,0,0.04)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                              }}
                            >
                              <h3
                                style={{
                                  margin: 0,
                                  fontSize: 16,
                                  fontWeight: 600,
                                }}
                              >
                                {data.Enclosure_Name}
                              </h3>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  fontSize: 13,
                                  color: "#4b5563",
                                }}
                              >
                                <span>Zone: {data.Zone}</span>
                                <span>
                                  Size: {data.Size?.toLocaleString()} sq ft
                                </span>
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              padding: 16,
                              display: "flex",
                              flexDirection: "column",
                              gap: 12,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                color: "#4b5563",
                                fontSize: 13,
                              }}
                            >
                              <div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "#6b7280",
                                    fontStyle: "italic",
                                  }}
                                >
                                  Last cleaned:
                                </div>
                                <div
                                  style={{ fontWeight: 600, color: "#111827" }}
                                >
                                  {formatDate(data.last_cleaned)}
                                </div>
                              </div>
                              <div style={{ textAlign: "right" }}>
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "#6b7280",
                                    fontStyle: "italic",
                                  }}
                                >
                                  Next due:
                                </div>
                                <div
                                  style={{ fontWeight: 600, color: "#111827" }}
                                >
                                  {formatDate(data.next_due)}
                                </div>
                              </div>
                            </div>

                            <div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  marginBottom: 8,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 13,
                                    color: "#374151",
                                    fontWeight: 600,
                                  }}
                                >
                                  Cleaning Cycle Progress
                                </span>
                                {/* Unbolded days-remaining text */}
                                <span
                                  style={{ fontWeight: 400, color: daysColor }}
                                >
                                  {daysRemaining} day
                                  {daysRemaining !== 1 ? "s" : ""} remaining
                                </span>
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <div
                                  style={{
                                    flex: 1,
                                    height: 10,
                                    borderRadius: 9999,
                                    backgroundColor: "#e5e7eb",
                                    overflow: "hidden",
                                  }}
                                >
                                  <div
                                    style={{
                                      height: "100%",
                                      width: `${progressPercent}%`,
                                      backgroundColor: progressColor,
                                      borderRadius: 9999,
                                      transition: "width 0.3s ease",
                                    }}
                                  />
                                </div>

                                {data.last_cleaned &&
                                  data.days_remaining > 0 && (
                                    <button
                                      onClick={() => handleSkipCleaning(data)}
                                      disabled={cleaningActionLoading}
                                      aria-label="Skip one day"
                                      style={{
                                        padding: 6,
                                        borderRadius: 6,
                                        background: "transparent",
                                        border: "none",
                                        cursor: cleaningActionLoading
                                          ? "not-allowed"
                                          : "pointer",
                                      }}
                                    >
                                      <FastForward
                                        style={{
                                          height: 14,
                                          width: 14,
                                          color: "#2563eb",
                                        }}
                                      />
                                    </button>
                                  )}
                              </div>
                            </div>

                            <div
                              style={{ display: "flex", gap: 8, paddingTop: 6 }}
                            >
                              <button
                                onClick={() => handleCleanHabitat(data)}
                                disabled={cleanDisabled}
                                title={
                                  cleanDisabled
                                    ? daysPassed < 4
                                      ? `Available after ${
                                          4 - daysPassed
                                        } more day${
                                          4 - daysPassed !== 1 ? "s" : ""
                                        }`
                                      : "Action in progress"
                                    : "Clean"
                                }
                                style={{
                                  flex: 1,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: 8,
                                  padding: "8px 10px",
                                  borderRadius: 8,
                                  backgroundColor: cleanDisabled
                                    ? "#9ae6b4"
                                    : "#059669",
                                  color: cleanDisabled ? "#065f46" : "#ffffff",
                                  border: "none",
                                  boxShadow: cleanDisabled
                                    ? "none"
                                    : "0 4px 12px rgba(5,150,105,0.12)",
                                  cursor: cleanDisabled
                                    ? "not-allowed"
                                    : "pointer",
                                  fontWeight: 600,
                                  fontSize: 14,
                                }}
                              >
                                <CheckCircle2
                                  style={{
                                    height: 14,
                                    width: 14,
                                    color: cleanDisabled
                                      ? "#065f46"
                                      : "#ffffff",
                                  }}
                                />
                                {cleanDisabled ? "Cleaned" : "Clean Now"}
                              </button>

                              <button
                                onClick={() => handleCancelCleaning(data)}
                                disabled={cleaningActionLoading}
                                style={{
                                  padding: "8px 10px",
                                  borderRadius: 8,
                                  backgroundColor: "transparent",
                                  border: "1px solid #e5e7eb",
                                  color: "#374151",
                                  cursor: cleaningActionLoading
                                    ? "not-allowed"
                                    : "pointer",
                                  fontWeight: 500,
                                  fontSize: 14,
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
                  Weekly Log
                </CardTitle>
                <CardDescription>
                  All activities, including feeding, cleaning tasks, and new
                  animal arrivals.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activityLog.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No activities logged in the past week</p>
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
                      {activityLog
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
                                  {log.animal_name && (
                                    <p
                                      style={{ fontSize: 14, color: "#4b5563" }}
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
            {/* Cancel button removed per request - dialog can still be closed via overlay or ESC */}
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
