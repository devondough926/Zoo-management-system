import {
  ShoppingCart,
  Ticket,
  ShoppingBag,
  Calendar,
  Receipt,
  X,
  RefreshCw,
  Wifi,
  WifiOff,
  Check,
  Crown,
  UtensilsCrossed,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import LoadingWithIcon from "../components/ui/LoadingWithIcon";

import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { ScrollArea } from "../components/ui/scroll-area";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useData } from "../data/DataContext";
import {
  authAPI,
  purchasesAPI,
  membershipAPI,
  activitiesAPI,
} from "../services/customerAPI";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useHeroImage } from "../utils/heroImages";
import { formatPhone, normalizePhone } from "../utils/phone";
import { useWeather } from "../contexts/WeatherContext";

const formatNumber = (num) => {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";

  // Remove 'T' and extract components
  let dateStr = dateString.replace("T", " ");
  const parts = dateStr.match(
    /(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2}):(\d{2})/
  );

  if (!parts) return "Invalid Date";

  const [, year, month, day, hour, minute, second] = parts;

  // Parse components as integers
  const yearNum = parseInt(year);
  const monthNum = parseInt(month);
  const dayNum = parseInt(day);
  const hourNum = parseInt(hour);
  const minuteNum = parseInt(minute);

  // Format month name
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthName = monthNames[monthNum - 1];

  // Convert to 12-hour format
  const isPM = hourNum >= 12;
  const hour12 = hourNum % 12 || 12;
  const ampm = isPM ? "PM" : "AM";

  // Format: Nov 4, 2025, 12:29 PM
  return `${monthName} ${dayNum}, ${yearNum}, ${hour12}:${minute} ${ampm}`;
};

// Format simple time strings like "14:00" or "14:00:00" to 12-hour with am/pm
const formatTime12 = (timeStr) => {
  if (!timeStr) return "";
  // Extract HH:MM
  const m = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!m) return timeStr;
  let hh = parseInt(m[1], 10);
  const mm = m[2];
  const isPM = hh >= 12;
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  const ampm = isPM ? "PM" : "AM";
  return `${hour12}:${mm} ${ampm}`;
};

export function CustomerDashboard({ user }) {
  const navigate = useNavigate();
  const {
    purchases,
    tickets,
    purchaseItems,
    purchaseConcessionItems,
    items,
    concessionItems,
  } = useData();
  const heroImage = useHeroImage("customer");
  const { selectedWeather, isExhibitClosed, getClosureReason } = useWeather();

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

  const [isBackendConnected, setIsBackendConnected] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [backendPurchases, setBackendPurchases] = useState([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [membership, setMembership] = useState(null);
  const [activeActivities, setActiveActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const activeFetchRef = useRef({ isFetching: false, intervalId: null });

  // Keep a sorted copy of active activities ordered by their start time
  const parseTimeToToday = (timeStr) => {
    if (!timeStr) return null;
    const now = new Date();
    timeStr = String(timeStr).trim();
    // Match 12-hour with AM/PM
    const ampm = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(timeStr);
    let hours = 0,
      minutes = 0;
    if (ampm) {
      hours = parseInt(ampm[1], 10);
      minutes = parseInt(ampm[2], 10);
      const isPM = ampm[3].toUpperCase() === "PM";
      if (isPM && hours < 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
    } else {
      // 24-hour format like 15:00 or 15:00:00
      const parts = timeStr.split(":");
      hours = parseInt(parts[0] || 0, 10);
      minutes = parseInt(parts[1] || 0, 10);
    }

    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0
    );
  };

  const sortedActiveActivities = useMemo(() => {
    if (!Array.isArray(activeActivities) || activeActivities.length === 0)
      return [];
    return [...activeActivities].sort((a, b) => {
      const aStart = parseTimeToToday(a.start_time || a.Display_Time || "");
      const bStart = parseTimeToToday(b.start_time || b.Display_Time || "");
      if (!aStart && !bStart) return 0;
      if (!aStart) return 1;
      if (!bStart) return -1;
      return aStart.getTime() - bStart.getTime();
    });
  }, [activeActivities]);

  // Check backend connection and fetch membership on mount
  useEffect(() => {
    checkBackendConnection();
    fetchPurchaseHistory();
    fetchMembership();

    // Poll active activities at a reasonable interval (30s) and skip polling
    // when the tab is hidden to avoid excessive background requests/logging.
    const poll = async () => {
      if (activeFetchRef.current.isFetching) return;
      // Skip polling when tab is not visible
      if (typeof document !== "undefined" && document.hidden) return;
      activeFetchRef.current.isFetching = true;
      try {
        const activities = await activitiesAPI.getActive();
        setActiveActivities(activities || []);
      } catch (err) {
        console.error("Error polling active activities:", err);
      } finally {
        activeFetchRef.current.isFetching = false;
      }
    };

    // Run immediately then start interval (30s)
    poll();
    const id = setInterval(poll, 60000);
    activeFetchRef.current.intervalId = id;

    return () => {
      clearInterval(id);
      activeFetchRef.current.intervalId = null;
      activeFetchRef.current.isFetching = false;
    };
  }, []);

  const checkBackendConnection = async () => {
    const connected = await authAPI.checkConnection();
    setIsBackendConnected(connected);
  };

  const fetchPurchaseHistory = async () => {
    if (!user || !user.Customer_ID) return;

    setPurchasesLoading(true);
    try {
      const history = await purchasesAPI.getHistory(user.Customer_ID);
      setBackendPurchases(history);
    } catch (error) {
      console.error("Error fetching purchase history:", error);
      setBackendPurchases([]);
    } finally {
      setPurchasesLoading(false);
    }
  };

  const fetchMembership = async () => {
    if (!user || !user.Customer_ID) return;

    try {
      const membershipData = await membershipAPI.getMembership(
        user.Customer_ID
      );
      setMembership(membershipData);
    } catch (error) {
      console.error("Error fetching membership:", error);
      setMembership(null);
    }
  };

  const fetchActiveActivities = async () => {
    setActivitiesLoading(true);
    try {
      const activities = await activitiesAPI.getActive();
      setActiveActivities(activities || []);
    } catch (error) {
      console.error("Error fetching active activities:", error);
      setActiveActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Countdown state for each active activity (keyed by index)
  const [countdowns, setCountdowns] = useState({});

  const formatRemaining = (seconds) => {
    if (seconds <= 0) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0)
      return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Update countdowns every second based on activeActivities
  useEffect(() => {
    let mounted = true;
    const update = () => {
      const now = new Date();
      const map = {};
      // Use sortedActiveActivities so countdown indexes align with rendered order
      sortedActiveActivities.forEach((a, i) => {
        const startDate = parseTimeToToday(
          a.start_time || a.Display_Time || a.Display_Time
        );
        const duration =
          parseInt(a.duration_minutes || a.Duration || 0, 10) || 0;
        if (!startDate || !duration) {
          map[i] = "--:--";
          return;
        }
        const endDate = new Date(startDate.getTime() + duration * 60000);
        const remainingSec = Math.max(0, Math.floor((endDate - now) / 1000));
        map[i] = remainingSec > 0 ? formatRemaining(remainingSec) : "Ended";
      });
      if (mounted) setCountdowns(map);
    };

    update();
    const id = setInterval(update, 1000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [activeActivities]);

  const computeEndLabel = (a) => {
    const sd = parseTimeToToday(
      a.start_time || a.Display_Time || a.Display_Time
    );
    const duration = parseInt(a.duration_minutes || a.Duration || 0, 10) || 0;
    if (!sd || !duration) return a.end_time || "";
    const end = new Date(sd.getTime() + duration * 60000);
    return end.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const displayPurchases =
    backendPurchases.length > 0
      ? backendPurchases
      : purchases.filter((p) => p.Customer_ID === user.Customer_ID);

  const customerPurchases = displayPurchases.sort(
    (a, b) =>
      new Date(b.Purchase_Date).getTime() - new Date(a.Purchase_Date).getTime()
  );
  const recentPurchases = customerPurchases.slice(0, 3);

  const getCustomerPurchaseNumber = (purchaseId) => {
    const purchase = displayPurchases.find((p) => p.Purchase_ID === purchaseId);
    if (purchase && purchase.Order_Number) {
      return purchase.Order_Number;
    }

    const sortedPurchases = displayPurchases.sort(
      (a, b) =>
        new Date(a.Purchase_Date).getTime() -
        new Date(b.Purchase_Date).getTime()
    );
    const index = sortedPurchases.findIndex(
      (p) => p.Purchase_ID === purchaseId
    );
    return index !== -1 ? index + 1 : sortedPurchases.length + 1;
  };

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user.First_Name,
    lastName: user.Last_Name,
    email: user.Email,
    phone: formatPhone(user.Phone || ""),
  });

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [orderHistoryOpen, setOrderHistoryOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [selectedPurchaseDetails, setSelectedPurchaseDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!selectedPurchase) {
        setSelectedPurchaseDetails(null);
        return;
      }

      setDetailsLoading(true);
      try {
        const details = await purchasesAPI.getDetails(
          selectedPurchase.Purchase_ID
        );
        setSelectedPurchaseDetails(details);
      } catch (error) {
        console.error("Error fetching purchase details:", error);
        setSelectedPurchaseDetails(null);
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchDetails();
  }, [selectedPurchase]);

  const handleSaveProfile = async () => {
    setIsLoading(true);

    try {
      try {
        const response = await authAPI.updateProfile(user.Customer_ID, {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          email: profileData.email,
          // send only digits to backend
          phone: normalizePhone(profileData.phone) || null,
        });

        user.First_Name = response.customer.First_Name;
        user.Last_Name = response.customer.Last_Name;
        user.Email = response.customer.Email;
        user.Phone = response.customer.Phone;

        toast.success("Profile updated successfully!");
      } catch (error) {
        user.First_Name = profileData.firstName;
        user.Last_Name = profileData.lastName;
        user.Email = profileData.email;
        user.Phone = profileData.phone;

        toast.success("Profile updated successfully!");
      }

      setIsEditingProfile(false);
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match!");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters!");
      return;
    }

    setIsLoading(true);

    try {
      await authAPI.changePassword(user.Customer_ID, {
        newPassword: passwordData.newPassword,
      });

      toast.success("Password changed successfully!");

      setPasswordData({
        newPassword: "",
        confirmPassword: "",
      });
      setIsChangingPassword(false);
    } catch (error) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenewMembership = () => {
    navigate("/tickets");
    setTimeout(() => {
      const membershipsSection = document.getElementById("memberships");
      if (membershipsSection) {
        membershipsSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  const isMembershipExpired = membership
    ? new Date(membership.End_Date) < new Date()
    : false;
  const membershipStatus = membership
    ? isMembershipExpired
      ? "Expired"
      : "Active"
    : "No Membership";

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Backend Connection Status */}
      {isBackendConnected !== null && !isBackendConnected && (
        <Alert className="m-6 bg-amber-50 border-amber-300 shadow-md">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 font-medium">
              Server not connected - Using offline mode
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 to-emerald-700 text-white py-16 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src={heroImage}
            alt="Customer Dashboard"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom right, rgba(20, 83, 45, 0.55), rgba(6, 78, 59, 0.55))",
            }}
          />
        </div>

        {/* Content */}
        <div className="container mx-auto px-6 relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-3 drop-shadow-lg italic">
            Welcome back, {user.First_Name}!
          </h1>
          <p className="text-xl text-green-50 mb-6 drop-shadow-md">
            Your personal zoo experience dashboard
          </p>

          {/* Membership Status and Renewal */}
          <div className="mt-8 space-y-3 bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <Crown className="h-5 w-5 text-yellow-300" />
              <span className="text-green-50 font-medium">
                Membership Status:
              </span>
              {membership ? (
                <Badge
                  className={`${
                    isMembershipExpired
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 font-semibold"
                  } shadow-md`}
                >
                  {membershipStatus}
                </Badge>
              ) : (
                <Badge className="bg-gray-500 text-white shadow-md">
                  No Membership
                </Badge>
              )}
            </div>

            {membership && (
              <>
                <div className="flex items-center space-x-3">
                  <span className="text-green-50 font-medium">
                    Valid Until:
                  </span>
                  <span
                    className={`font-semibold ${
                      isMembershipExpired
                        ? "text-red-200"
                        : "text-white text-lg"
                    }`}
                  >
                    {new Date(membership.End_Date).toLocaleDateString()}
                  </span>
                </div>

                <Button
                  onClick={handleRenewMembership}
                  className="bg-white text-green-700 hover:bg-green-50 hover:scale-105 transition-transform shadow-lg font-semibold"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {isMembershipExpired
                    ? "Renew Membership"
                    : "Extend Membership"}
                </Button>
              </>
            )}

            {!membership && (
              <div className="flex flex-col gap-3">
                <p className="text-green-50 text-sm">
                  Become a member to enjoy exclusive benefits and unlimited
                  access!
                </p>
                <Button
                  onClick={() => navigate("/tickets")}
                  className="bg-yellow-400 text-yellow-900 hover:bg-yellow-300 hover:scale-105 transition-transform shadow-lg font-semibold w-fit"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Get Membership Now
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Today's Activities Banner */}
      {/* Weather Alert - persistent (shows even when there are no active activities) */}
      {weatherAlert && (
        <div
          style={{
            paddingTop: 24,
            paddingBottom: 0,
            background: "#f3f4f6",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div style={{ maxWidth: 880, width: "100%", padding: "0 24px" }}>
            <Card className="rounded-lg shadow-sm border border-red-200 bg-red-100">
              <CardContent className="py-6 text-center">
                <div className="flex flex-col items-center">
                  <AlertTriangle className="h-6 w-6 text-red-800 mb-2 pt-1" />
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

      {!activitiesLoading && activeActivities.length > 0 && (
        <>
          <section
            style={{ paddingTop: 24, paddingBottom: 24, background: "#f3f4f6" }}
          >
            <div
              style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 12,
                  paddingTop: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Calendar
                    style={{ height: 24, width: 24, color: "#b45309" }}
                  />
                  <h2
                    style={{
                      fontSize: 20,
                      margin: 0,
                      color: "#0f172a",
                      fontWeight: 700,
                      textAlign: "center",
                    }}
                  >
                    Happening Now!
                  </h2>
                </div>
              </div>

              {/* keyframes for pulsing dot (inline) */}
              <style>{`@keyframes pulse {0%{transform:scale(1);opacity:1}50%{transform:scale(1.6);opacity:.5}100%{transform:scale(1);opacity:1}}`}</style>

              <div style={{ height: 0 }} />

              {/* Render cards separately so we can insert countdown logic below */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    activeActivities.length === 1
                      ? "minmax(280px,720px)"
                      : "repeat(auto-fit,minmax(280px,1fr))",
                  gap: 16,
                  marginTop: 12,
                  justifyContent:
                    activeActivities.length === 1 ? "center" : undefined,
                }}
              >
                {/* color map for activity cards (based on enclosure type) */}
                {sortedActiveActivities.map((activity, idx) => {
                  const cardColors = {
                    Outdoor: "#60a5fa", // blue
                    Hybrid: "#f97316", // orange
                    Indoor: "#34d399", // green
                    Unknown: "#94a3b8",
                  };

                  const color =
                    cardColors[activity.enclosure_type] || cardColors.Unknown;

                  // Determine if this activity's exhibit is closed
                  const serverClosed = Boolean(activity.is_closed);
                  const weatherClosed = isExhibitClosed({
                    Enclosure_Type: activity.enclosure_type,
                  });
                  const isClosed = serverClosed || weatherClosed;
                  return (
                    <div
                      key={idx}
                      style={{
                        background: "#fff",
                        borderRadius: 12,
                        padding: 18,
                        boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
                        position: "relative",
                        overflow: "hidden",
                        border: "1px solid rgba(15,23,42,0.04)",
                        borderLeft: `6px solid ${color}`,
                      }}
                    >
                      {/* CLOSED Banner - Diagonal across top right */}
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
                            title={
                              getClosureReason({
                                Enclosure_Type: activity.enclosure_type,
                              }) || "Closed"
                            }
                          >
                            CLOSED
                          </div>
                        </div>
                      )}

                      {/* Card content with conditional blur */}
                      <div
                        style={{
                          filter: isClosed ? "blur(2px)" : "none",
                          transition: "filter 0.18s ease",
                          pointerEvents: isClosed ? "none" : "auto",
                        }}
                      >
                        {/* Live badge top-right */}
                        <div
                          style={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              background: "#dc2626",
                              borderRadius: 8,
                              boxShadow: "0 0 8px rgba(220,38,38,0.6)",
                              animation: "pulse 1.5s infinite",
                            }}
                          />
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#dc2626",
                            }}
                          >
                            LIVE
                          </div>
                        </div>

                        <h3
                          style={{
                            margin: "8px 0 10px 0",
                            fontSize: 18,
                            color: "#0f172a",
                            fontWeight: 700,
                          }}
                        >
                          {activity.activity_name}
                        </h3>
                        {activity.activity_description && (
                          <div
                            style={{
                              color: "#475569",
                              fontSize: 14,
                              marginBottom: 8,
                            }}
                          >
                            {activity.activity_description}
                          </div>
                        )}

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            marginBottom: 8,
                            color: "#0f172a",
                            fontWeight: 600,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-start",
                            }}
                          >
                            <div style={{ fontSize: 12, color: "#94a3b8" }}>
                              Location
                            </div>
                            <div style={{ fontSize: 14 }}>
                              {activity.exhibit_name}
                              {activity.location
                                ? ` — Zone ${activity.location}`
                                : ""}
                            </div>
                          </div>
                          <div
                            style={{ marginLeft: "auto", textAlign: "right" }}
                          >
                            <div style={{ fontSize: 12, color: "#94a3b8" }}>
                              Ends in
                            </div>
                            <div
                              style={{
                                fontSize: 16,
                                fontWeight: 700,
                                color: "#dc2626",
                              }}
                            >
                              {countdowns[idx] || "--:--"}
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            borderTop: "1px solid #f1f5f9",
                            paddingTop: 10,
                            fontSize: 13,
                            color: "#64748b",
                          }}
                        >
                          <div>
                            Started:{" "}
                            <strong style={{ color: "#0f172a" }}>
                              {formatTime12(
                                activity.start_time ||
                                  activity.Display_Time ||
                                  ""
                              )}
                            </strong>
                          </div>
                          <div>
                            Ends:{" "}
                            <strong style={{ color: "#0f172a" }}>
                              {activity.end_time || computeEndLabel(activity)}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* subtle separator to replace the previous thick bottom border */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div
              style={{
                width: "90%",
                maxWidth: 1100,
                height: 1,
                background:
                  "linear-gradient(90deg, rgba(15,23,42,0.06), rgba(15,23,42,0.02))",
                margin: "12px 0",
                borderRadius: 2,
              }}
            />
          </div>
        </>
      )}

      {/* Quick Actions */}
      <section className="py-12 bg-gray-100">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-8 text-gray-800">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-lg border-none bg-white">
              <CardContent className="pt-6 text-center">
                <button
                  onClick={() => navigate("/tickets")}
                  className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4 hover:from-green-600 hover:to-green-700 hover:scale-110 transition-all duration-300 shadow-lg cursor-pointer group rounded-xl"
                >
                  <Ticket className="h-10 w-10 text-green-600 group-hover:text-white transition-colors" />
                </button>
                <h3 className="mb-2 text-xl font-semibold text-gray-800">
                  Buy Tickets
                </h3>
                <p className="text-sm text-gray-600">
                  Purchase day passes or membership
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-none bg-white">
              <CardContent className="pt-6 text-center">
                <button
                  onClick={() => navigate("/shop")}
                  className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4 hover:from-green-600 hover:to-green-700 hover:scale-110 transition-all duration-300 shadow-lg cursor-pointer group rounded-xl"
                >
                  <ShoppingBag className="h-10 w-10 text-emerald-600 group-hover:text-white transition-colors" />
                </button>
                <h3 className="mb-2 text-xl font-semibold text-gray-800">
                  Gift Shop
                </h3>
                <p className="text-sm text-gray-600">
                  Browse and buy gift shop items online
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-none bg-white">
              <CardContent className="pt-6 text-center">
                <button
                  onClick={() => navigate("/food")}
                  className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4 hover:from-green-600 hover:to-green-700 hover:scale-110 transition-all duration-300 shadow-lg cursor-pointer group rounded-xl"
                >
                  <UtensilsCrossed className="h-10 w-10 text-orange-600 group-hover:text-white transition-colors" />
                </button>
                <h3 className="mb-2 text-xl font-semibold text-gray-800">
                  Order Food
                </h3>
                <p className="text-sm text-gray-600">
                  Browse menu and order from concession stands
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent Purchases */}
      <section className="py-12 bg-gray-100">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-800">
              Recent Purchases
            </h2>
            <Dialog open={orderHistoryOpen} onOpenChange={setOrderHistoryOpen}>
              <DialogTrigger asChild>
                <button className="text-gray-900 hover:text-green-600 hover:underline cursor-pointer transition-colors">
                  View All
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[70vh] p-0">
                <div className="flex flex-col h-full max-h-[70vh]">
                  <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
                    <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <ShoppingCart className="h-6 w-6 text-green-600" />
                      Order History
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                      View all past purchases and receipts
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="flex-1 overflow-y-auto px-6 py-4">
                    <div className="space-y-4">
                      {customerPurchases.length > 0 ? (
                        customerPurchases.map((purchase) => (
                          <Card
                            key={purchase.Purchase_ID}
                            className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer bg-white hover:bg-gray-50"
                            onClick={() => {
                              setOrderHistoryOpen(false);
                              setSelectedPurchase(purchase);
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <Badge
                                    variant="secondary"
                                    className="bg-green-100 text-green-700 font-semibold px-3 py-1"
                                  >
                                    {purchase.Payment_Method}
                                  </Badge>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="h-4 w-4" />
                                    {formatDateTime(purchase.Purchase_Date)}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Receipt className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm font-medium text-gray-700">
                                    Order #
                                    {getCustomerPurchaseNumber(
                                      purchase.Purchase_ID
                                    )}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-green-600 mb-1">
                                  ${Number(purchase.Total_Amount).toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-500 uppercase tracking-wide">
                                  Total Amount
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <div className="flex items-center justify-between text-sm text-gray-600">
                                <span>Click to view details</span>
                                <ChevronRight className="h-4 w-4" />
                              </div>
                            </div>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-16">
                          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingCart className="h-10 w-10 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-700 mb-2">
                            No Purchase History
                          </h3>
                          <p className="text-gray-500 max-w-sm mx-auto">
                            You haven't made any purchases yet. Start exploring
                            our zoo and make your first purchase!
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="max-w-4xl">
            <Card className="shadow-xl border-none bg-white">
              <CardContent className="p-6">
                {recentPurchases.length > 0 ? (
                  <div className="space-y-4">
                    {recentPurchases.map((purchase) => (
                      <div
                        key={purchase.Purchase_ID}
                        className="flex items-center justify-between p-5 bg-white transition-all duration-200 cursor-pointer hover:rounded-xl hover:shadow-md hover:border hover:border-green-400"
                        onClick={() => setSelectedPurchase(purchase)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-700 font-semibold"
                            >
                              {purchase.Payment_Method}
                            </Badge>
                            <span className="text-sm text-gray-600 font-medium">
                              {formatDateTime(purchase.Purchase_Date)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 font-medium">
                            Order #
                            {getCustomerPurchaseNumber(purchase.Purchase_ID)}
                          </p>
                        </div>
                        <div className="text-right ml-6">
                          <p className="text-2xl text-green-600 font-bold">
                            ${Number(purchase.Total_Amount).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShoppingCart className="h-12 w-12 text-gray-300" />
                    </div>
                    <p className="text-gray-600 text-lg mb-4">
                      No recent purchases
                    </p>
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white cursor-pointer font-semibold"
                      onClick={() => navigate("/shop")}
                    >
                      Start Shopping
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Account Settings */}
      <section className="py-12 bg-gray-100">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-8 text-gray-800">My Account</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Information Card */}
            <Card className="shadow-xl border border-gray-200 hover:shadow-2xl transition-shadow overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
                <CardTitle className="text-2xl text-gray-800">
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Profile Information */}
                  {!isEditingProfile ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Customer ID
                        </label>
                        <p className="text-lg">#{user.Customer_ID}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Name
                        </label>
                        <p className="text-lg">
                          {user.First_Name} {user.Last_Name}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <p className="text-lg">{user.Email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Phone
                        </label>
                        <p className="text-lg">{formatPhone(user.Phone)}</p>
                      </div>
                      <div className="pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditingProfile(true)}
                          className="cursor-pointer hover:bg-green-50 hover:border-green-400 transition-colors font-semibold"
                        >
                          Edit Profile
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={profileData.firstName}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              firstName: e.target.value,
                            })
                          }
                          className="border-2 border-gray-300 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={profileData.lastName}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              lastName: e.target.value,
                            })
                          }
                          className="border-2 border-gray-300 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              email: e.target.value,
                            })
                          }
                          className="border-2 border-gray-300 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          maxLength={14}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              phone: formatPhone(e.target.value),
                            })
                          }
                          className="border-2 border-gray-300 focus:border-green-500"
                        />
                      </div>
                      <div className="flex space-x-2 pt-4">
                        <Button
                          onClick={handleSaveProfile}
                          className="bg-green-600 hover:bg-green-700 text-white cursor-pointer font-semibold"
                          disabled={isLoading}
                        >
                          {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditingProfile(false);
                            setProfileData({
                              firstName: user.First_Name,
                              lastName: user.Last_Name,
                              email: user.Email,
                              phone: user.Phone,
                            });
                          }}
                          className="cursor-pointer hover:bg-gray-100"
                          disabled={isLoading}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Account Statistics Card */}
            <Card className="shadow-xl border border-gray-200 hover:shadow-2xl transition-shadow overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
                <CardTitle className="text-2xl text-gray-800">
                  Account Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Membership Info */}
                  {membership ? (
                    <div className="p-5 bg-purple-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Crown className="h-5 w-5 text-purple-600" />
                          <p className="font-semibold text-gray-800">
                            Active Membership
                          </p>
                        </div>
                        <Badge
                          className={`${
                            isMembershipExpired
                              ? "bg-red-500 hover:bg-red-600"
                              : "bg-green-600 hover:bg-green-700"
                          } text-white font-medium`}
                        >
                          {membershipStatus}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <p className="text-gray-600 font-medium">
                            Start Date
                          </p>
                          <p className="font-semibold text-gray-800">
                            {new Date(
                              membership.Start_Date
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <p className="text-gray-600 font-medium">End Date</p>
                          <p className="font-semibold text-gray-800">
                            {new Date(membership.End_Date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <p className="text-gray-600 font-medium">
                            Membership ID
                          </p>
                          <p className="font-semibold text-gray-800">
                            #{membership.Customer_ID}
                          </p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <p className="text-gray-600 font-medium">
                            Discount Benefits
                          </p>
                          <p className="font-semibold text-green-600 flex items-center gap-1">
                            Applied <Check size={16} />
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Crown className="h-8 w-8 text-purple-600" />
                      </div>
                      <p className="text-gray-700 font-semibold mb-2">
                        No Active Membership
                      </p>
                      <p className="text-gray-600 text-sm mb-4">
                        Join today and unlock exclusive benefits!
                      </p>
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer font-semibold"
                        onClick={() => navigate("/tickets")}
                      >
                        Unlock Benefits
                      </Button>
                    </div>
                  )}

                  {/* Purchase Statistics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      className="rounded-lg border border-gray-200 shadow-sm"
                      style={{
                        padding: "1rem",
                        backgroundColor: "white",
                        borderRadius: "0.5rem",
                        border: "1px solid #e5e7eb",
                        borderLeft: "4px solid #16a34a",
                      }}
                    >
                      <p className="text-sm text-gray-600 mb-1 font-medium">
                        Total Purchases
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {customerPurchases.length}
                      </p>
                    </div>
                    <div
                      className="rounded-lg border border-gray-200 shadow-sm"
                      style={{
                        padding: "1rem",
                        backgroundColor: "white",
                        borderRadius: "0.5rem",
                        borderLeft: "4px solid #2563eb",
                      }}
                    >
                      <p className="text-sm text-gray-600 mb-1 font-medium">
                        Total Spent
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        $
                        {formatNumber(
                          customerPurchases.reduce(
                            (sum, p) => sum + p.Total_Amount,
                            0
                          )
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Password & Security Card */}
            <Card className="shadow-xl border border-gray-200 hover:shadow-2xl transition-shadow overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200">
                <CardTitle className="text-2xl text-gray-800">
                  Password & Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isChangingPassword ? (
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Manage your account password and security settings.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setIsChangingPassword(true)}
                      className="cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-colors font-semibold"
                    >
                      Change Password
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        className="border-2 border-gray-300 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="border-2 border-gray-300 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleChangePassword}
                        className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer font-semibold"
                        disabled={isLoading}
                      >
                        {isLoading ? "Updating..." : "Update Password"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordData({
                            newPassword: "",
                            confirmPassword: "",
                          });
                        }}
                        className="cursor-pointer hover:bg-gray-100"
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Purchase Detail Dialog */}
      <Dialog
        open={selectedPurchase !== null}
        onOpenChange={() => setSelectedPurchase(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order #
              {selectedPurchase &&
                getCustomerPurchaseNumber(selectedPurchase.Purchase_ID)}{" "}
              -{" "}
              {selectedPurchase &&
                formatDateTime(selectedPurchase.Purchase_Date)}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-4">
            {detailsLoading ? (
              <div className="text-center py-12">
                <LoadingWithIcon text="Loading order details..." size={48} />
              </div>
            ) : (
              selectedPurchase && (
                <div className="space-y-6">
                  {/* Purchase Summary */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Order Number:</span>
                          <span className="font-medium">
                            #
                            {getCustomerPurchaseNumber(
                              selectedPurchase.Purchase_ID
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Date & Time:</span>
                          <span className="font-medium">
                            {formatDateTime(selectedPurchase.Purchase_Date)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment Method:</span>
                          <Badge variant="secondary">
                            {selectedPurchase.Payment_Method}
                          </Badge>
                        </div>

                        <div className="border-t pt-4">
                          <div className="flex justify-between">
                            <span className="font-medium">Total Amount:</span>
                            <span className="text-2xl font-semibold text-green-600">
                              $
                              {Number(selectedPurchase.Total_Amount).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tickets included in this purchase */}
                  {(() => {
                    // Use backend details if available, otherwise fall back to mock data
                    const purchaseTickets =
                      selectedPurchaseDetails?.tickets ||
                      tickets.filter(
                        (t) => t.Purchase_ID === selectedPurchase.Purchase_ID
                      );

                    return (
                      purchaseTickets.length > 0 && (
                        <div>
                          <h3 className="font-medium mb-3">Tickets</h3>
                          <div className="space-y-2">
                            {(() => {
                              // Group tickets by type and compute totals
                              const grouped = purchaseTickets.reduce(
                                (acc, t) => {
                                  const type = t.Ticket_Type || "Unknown";
                                  const price = Number(t.Price) || 0;
                                  const quantity = Number(t.Quantity) || 1;
                                  if (!acc[type])
                                    acc[type] = {
                                      Ticket_Type: type,
                                      count: 0,
                                      price,
                                    };
                                  acc[type].count += quantity;
                                  acc[type].price = price;
                                  return acc;
                                },
                                {}
                              );

                              return Object.values(grouped).map((g) => (
                                <Card key={g.Ticket_Type}>
                                  <CardContent className="p-4">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <p className="font-medium">
                                          {g.Ticket_Type} Ticket
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          Quantity: {g.count}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-semibold text-green-600">
                                          $
                                          {(Number(g.price) * g.count).toFixed(
                                            2
                                          )}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          ${Number(g.price).toFixed(2)} each
                                        </p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ));
                            })()}
                          </div>
                        </div>
                      )
                    );
                  })()}

                  {/* Membership included in this purchase */}
                  {(() => {
                    // Check if backend provided membership details
                    const membershipData = selectedPurchaseDetails?.membership;

                    // Fallback: detect membership by item name in purchaseItems
                    const allItems =
                      selectedPurchaseDetails?.purchaseItems ||
                      purchaseItems.filter(
                        (pi) => pi.Purchase_ID === selectedPurchase.Purchase_ID
                      );

                    const membershipItems = allItems.filter((pi) =>
                      /membership/i.test(pi.Item_Name || "")
                    );

                    // Show membership section if we have either backend membership data or membership items
                    const hasMembership =
                      membershipData || membershipItems.length > 0;

                    return (
                      hasMembership && (
                        <div>
                          <h3 className="font-medium mb-3">Membership</h3>
                          <div className="space-y-2">
                            {membershipData ? (
                              // Use backend membership data
                              <Card>
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <p className="font-medium">
                                        Annual Membership
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        1 Year Unlimited Access
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Valid until:{" "}
                                        {new Date(
                                          membershipData.End_Date
                                        ).toLocaleDateString()}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Status:{" "}
                                        <span
                                          className={
                                            membershipData.Membership_Status ===
                                            "Active"
                                              ? "text-green-600 font-semibold"
                                              : "text-red-600"
                                          }
                                        >
                                          {membershipData.Membership_Status}
                                        </span>
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-semibold text-green-600">
                                        $
                                        {Number(membershipData.Price).toFixed(
                                          2
                                        )}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Annual Fee
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ) : (
                              // Fallback to item-based membership display
                              membershipItems.map((purchaseItem, index) => (
                                <Card key={`membership-${index}`}>
                                  <CardContent className="p-4">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <p className="font-medium">
                                          Annual Membership
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          Quantity: {purchaseItem.Quantity}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          1 Year Unlimited Access
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-semibold text-green-600">
                                          $
                                          {(
                                            Number(purchaseItem.Unit_Price) *
                                            purchaseItem.Quantity
                                          ).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          $
                                          {Number(
                                            purchaseItem.Unit_Price
                                          ).toFixed(2)}{" "}
                                          / per
                                        </p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))
                            )}
                          </div>
                        </div>
                      )
                    );
                  })()}

                  {/* Gift Shop Items included in this purchase */}
                  {(() => {
                    // Use backend details if available, otherwise fall back to mock data
                    const purchaseGiftItems =
                      selectedPurchaseDetails?.purchaseItems ||
                      purchaseItems.filter(
                        (pi) =>
                          pi.Purchase_ID === selectedPurchase.Purchase_ID &&
                          !/membership/i.test(pi.Item_Name || "")
                      );

                    return (
                      purchaseGiftItems.length > 0 && (
                        <div>
                          <h3 className="font-medium mb-3">Gift Shop Items</h3>
                          <div className="space-y-2">
                            {purchaseGiftItems.map((purchaseItem, index) => {
                              // Backend data already includes Item_Name
                              const itemName =
                                purchaseItem.Item_Name ||
                                items.find(
                                  (i) => i.Item_ID === purchaseItem.Item_ID
                                )?.Item_Name;

                              return (
                                <Card key={purchaseItem.Item_ID || index}>
                                  <CardContent className="p-4">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <p className="font-medium">
                                          {itemName}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          Quantity: {purchaseItem.Quantity}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-semibold text-green-600">
                                          $
                                          {(
                                            Number(purchaseItem.Unit_Price) *
                                            purchaseItem.Quantity
                                          ).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          $
                                          {Number(
                                            purchaseItem.Unit_Price
                                          ).toFixed(2)}{" "}
                                          each
                                        </p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      )
                    );
                  })()}

                  {/* Concession Items included in this purchase */}
                  {(() => {
                    // Use backend details if available, otherwise fall back to mock data
                    const purchaseConcessions =
                      selectedPurchaseDetails?.concessionItems ||
                      purchaseConcessionItems.filter(
                        (pci) =>
                          pci.Purchase_ID === selectedPurchase.Purchase_ID
                      );

                    return (
                      purchaseConcessions.length > 0 && (
                        <div>
                          <h3 className="font-medium mb-3">Food & Beverages</h3>
                          <div className="space-y-2">
                            {purchaseConcessions.map(
                              (purchaseConcession, index) => {
                                // Backend data already includes Item_Name
                                const itemName =
                                  purchaseConcession.Item_Name ||
                                  concessionItems.find(
                                    (ci) =>
                                      ci.Concession_Item_ID ===
                                      purchaseConcession.Concession_Item_ID
                                  )?.Item_Name;

                                return (
                                  <Card
                                    key={`${purchaseConcession.Concession_Item_ID}-${index}`}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <p className="font-medium">
                                            {itemName}
                                          </p>
                                          <p className="text-sm text-gray-600">
                                            Quantity:{" "}
                                            {purchaseConcession.Quantity}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-semibold text-green-600">
                                            $
                                            {(
                                              Number(
                                                purchaseConcession.Unit_Price
                                              ) * purchaseConcession.Quantity
                                            ).toFixed(2)}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            $
                                            {Number(
                                              purchaseConcession.Unit_Price
                                            ).toFixed(2)}{" "}
                                            each
                                          </p>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )
                    );
                  })()}

                  {/* No items message */}
                  {(() => {
                    const hasTickets =
                      selectedPurchaseDetails?.tickets?.length > 0 ||
                      tickets.filter(
                        (t) => t.Purchase_ID === selectedPurchase.Purchase_ID
                      ).length > 0;
                    const hasGiftItems =
                      selectedPurchaseDetails?.purchaseItems?.length > 0 ||
                      purchaseItems.filter(
                        (pi) =>
                          pi.Purchase_ID === selectedPurchase.Purchase_ID &&
                          !/membership/i.test(pi.Item_Name || "")
                      ).length > 0;
                    const hasConcessions =
                      selectedPurchaseDetails?.concessionItems?.length > 0 ||
                      purchaseConcessionItems.filter(
                        (pci) =>
                          pci.Purchase_ID === selectedPurchase.Purchase_ID
                      ).length > 0;
                    const hasMembership = (
                      selectedPurchaseDetails?.purchaseItems ||
                      purchaseItems.filter(
                        (pi) => pi.Purchase_ID === selectedPurchase.Purchase_ID
                      )
                    ).some((pi) => /membership/i.test(pi.Item_Name || ""));

                    return (
                      !hasTickets &&
                      !hasGiftItems &&
                      !hasConcessions &&
                      !hasMembership && (
                        <Card className="bg-gray-50">
                          <CardContent className="p-6 text-center">
                            <p className="text-gray-600">
                              No items found for this purchase
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              The purchase may have been processed without item
                              details
                            </p>
                          </CardContent>
                        </Card>
                      )
                    );
                  })()}

                  {/* Customer Info */}
                  <div>
                    <h3 className="font-medium mb-3">Customer Information</h3>
                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Customer ID:</span>
                            <span className="font-medium">
                              #{selectedPurchase.Customer_ID}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Name:</span>
                            <span className="font-medium">
                              {user.First_Name} {user.Last_Name}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Email:</span>
                            <span className="font-medium">{user.Email}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
