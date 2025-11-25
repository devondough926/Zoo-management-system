import { useState, useEffect, useMemo, useRef } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Input } from "../../components/ui/input";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "../../components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Calendar } from "lucide-react";
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
import { veterinarianAPI } from "../../services/veterinarianAPI";
import { employeeAPI } from "../../services/zookeeperAPI";
import { animalAPI, locationAPI, referenceAPI } from "../../services/adminAPI";
import {
  LogOut,
  Stethoscope,
  Activity,
  Heart,
  Syringe,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  PawPrint,
  FileText,
  Settings,
  Search,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { PaginationControls } from "../../components/PaginationControls";
import { ZooLogo } from "../../components/ZooLogo";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import LoadingWithIcon from "../../components/ui/LoadingWithIcon";

const flipStyles = `
.flip-card { perspective: 1000px; width: 100%; position: relative; }
.flip-card .flipper { position: relative; width: 100%; transform-style: preserve-3d; transition: transform 0.45s ease; }
.flip-card.flipped .flipper { transform: rotateY(180deg); }
.flip-card .front, .flip-card .back { backface-visibility: hidden; -webkit-backface-visibility: hidden; transform-style: preserve-3d; width: 100%; box-sizing: border-box; }
.flip-card .front, .flip-card .back { min-height: 360px; }
.flip-card .front { position: relative; z-index: 2; }
.flip-card .back { position: absolute; inset: 0; transform: rotateY(180deg); display: flex; flex-direction: column; justify-content: flex-start; z-index: 1; }
.flip-card .front .aspect-square { aspect-ratio: 1 / 1 !important; max-height: 220px; width: 100%; }
.flip-card .front .aspect-square img, .flip-card .front .aspect-square > img { height: 100% !important; width: 100% !important; object-fit: cover !important; }
`;

/**
 * Veterinarian portal component - displays animal health, vaccinations and logs.
 * Keeps JSDoc typedefs for clarity.
 */
/** @typedef {{Animal_ID:number;Animal_Name:string;Species:string;Gender:'M'|'F'|'U';Age:number;Weight:number|null;Health_Status:'Healthy'|'Under Observation'|'Sick'|'Injured'|'Critical';Backend_Health_Status:string;Last_Checkup?:string;Vaccinated:boolean;Last_Vaccination?:string;Next_Vaccination_Due?:string;Enclosure_Name:string;Zone:string;Image_URL?:string}} AnimalHealthRecord */

/** @typedef {{Vaccine_ID:string;Animal_ID:number;Animal_Name:string;Vaccine_Type:string;Date_Administered:string;Next_Due_Date:string;Administered_By:number;Notes?:string}} VaccinationRecord */

/** @typedef {{id:string|number;type:'checkup'|'vaccination'|'health_update'|'treatment';timestamp:string;animal_name:string;details:string;veterinarian_name:string;health_status?:string}} MedicalLogEntry */

/**
 * Veterinarian Portal Component
 * @param {{ user: { Employee_ID:number; First_Name:string; Last_Name:string; Job_Title?:{Title?:string} }, onLogout: () => void }} props
 */
export function VeterinarianPortal(
  props
) /** @type {{ user: any; onLogout: Function }} */
{
  const { user, onLogout } = props;
  const [healthRecords, setHealthRecords] = useState([]);
  const [vaccinationRecords, setVaccinationRecords] = useState([]);
  const [medicalLog, setMedicalLog] = useState([]);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [animalDetailOpen, setAnimalDetailOpen] = useState(false);
  const [healthDialogOpen, setHealthDialogOpen] = useState(false);
  const [vaccinationDialogOpen, setVaccinationDialogOpen] = useState(false);
  const [confirmVaccinationOpen, setConfirmVaccinationOpen] = useState(false);
  const [selectedHealthStatus, setSelectedHealthStatus] = useState("");
  const [healthNotes, setHealthNotes] = useState("");
  const [vets, setVets] = useState([]);
  const [selectedVetId, setSelectedVetId] = useState(null);
  const [vaccinationNotes, setVaccinationNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);
  const ALL_ENCLOSURES = "__ALL__";
  const [enclosureFilter, setEnclosureFilter] = useState(ALL_ENCLOSURES);
  const [filterHealthStatus, setFilterHealthStatus] = useState("all");
  const BACKEND_HEALTH_STATUSES = [
    "Excellent",
    "Good",
    "Fair",
    "Needs Attention",
  ];

  const backendToDisplayLabel = (backendStatus) => {
    if (backendStatus === "Needs Attention") return "Critical";
    return backendStatus;
  };
  const [vetSearchTerm, setVetSearchTerm] = useState("");
  const [attentionListOpen, setAttentionListOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const allowedVetTabs = ["animals", "vaccinations", "logs", "report"];
  const [activeTab, setActiveTab] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(location.search);
        const tab = params.get("tab");
        if (tab && allowedVetTabs.includes(tab)) return tab;
        return localStorage.getItem("vet.activeTab") || "animals";
      }
    } catch (e) {
      // ignore
    }
    return "animals";
  });

  // Persist active tab and set page title to include tab
  const vetTabLabels = {
    animals: "Animals",
    vaccinations: "Vaccinations",
    logs: "Logs",
    report: "Report",
  };
  const vetBaseTitle = "Veterinarian Portal";
  const vetPageTitle = vetTabLabels[activeTab]
    ? `${vetBaseTitle} - ${vetTabLabels[activeTab]}`
    : vetBaseTitle;
  usePageTitle(vetPageTitle);
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("vet.activeTab", activeTab);
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [flippedCards, setFlippedCards] = useState({});

  const [allAnimalsDB, setAllAnimalsDB] = useState([]);
  const [allEnclosures, setAllEnclosures] = useState([]);
  const [allLocations, setAllLocations] = useState([]);
  const [healthZoneFilter, setHealthZoneFilter] = useState("None");
  const [healthEnclosureFilter, setHealthEnclosureFilter] = useState("All");
  const [genderFilter, setGenderFilter] = useState("All");
  const [ageFilter, setAgeFilter] = useState("All");
  const [animalSearch, setAnimalSearch] = useState("");

  // New filter states for Health Report tab
  const [vaccinationStatusFilter, setVaccinationStatusFilter] = useState("All");
  const [weightRangeFilter, setWeightRangeFilter] = useState("All");
  const [speciesFilter, setSpeciesFilter] = useState("All");
  const [reportHealthStatusFilter, setReportHealthStatusFilter] =
    useState("All");

  // Applied filter states - these are the actual filters used for data filtering
  const [appliedHealthZoneFilter, setAppliedHealthZoneFilter] =
    useState("None");
  const [appliedHealthEnclosureFilter, setAppliedHealthEnclosureFilter] =
    useState("All");
  const [appliedGenderFilter, setAppliedGenderFilter] = useState("All");
  const [appliedAgeFilter, setAppliedAgeFilter] = useState("All");
  const [appliedVaccinationStatusFilter, setAppliedVaccinationStatusFilter] =
    useState("All");
  const [appliedWeightRangeFilter, setAppliedWeightRangeFilter] =
    useState("All");
  const [appliedSpeciesFilter, setAppliedSpeciesFilter] = useState("All");
  const [appliedReportHealthStatusFilter, setAppliedReportHealthStatusFilter] =
    useState("All");
  const [appliedDateRangeFilter, setAppliedDateRangeFilter] = useState({
    from: null,
    to: null,
  });
  const [dateRangeFilter, setDateRangeFilter] = useState({
    from: null,
    to: null,
  });
  const [dateRangePreset, setDateRangePreset] = useState("all");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState({ from: null, to: null });
  const [prevDateRange, setPrevDateRange] = useState({ from: null, to: null });
  const [animalSortState, setAnimalSortState] = useState({
    col: null,
    dir: "asc",
  });
  const [animalCurrentPage, setAnimalCurrentPage] = useState(1);
  const [animalItemsPerPage] = useState(10);
  const [animalVisibleColumns, setAnimalVisibleColumns] = useState({
    animalId: true,
    name: true,
    species: true,
    age: true,
    weight: true,
    gender: true,
    enclosure: true,
    healthStatus: true,
  });

  // When the applied filters change (after the user clicks Apply), reset
  // the Animal Details table pagination back to page 1 so results are visible.
  useEffect(() => {
    setAnimalCurrentPage(1);
  }, [
    appliedHealthZoneFilter,
    appliedHealthEnclosureFilter,
    appliedGenderFilter,
    appliedAgeFilter,
    appliedVaccinationStatusFilter,
    appliedWeightRangeFilter,
    appliedSpeciesFilter,
    appliedReportHealthStatusFilter,
    appliedDateRangeFilter,
  ]);

  // Check if date range can be applied (different from current)
  const canApplyDate = useMemo(() => {
    if (!tempDateRange || !tempDateRange.from || !tempDateRange.to)
      return false;
    // Allow single-day selections (start === end) as valid ranges
    // Check if different from current dateRangeFilter
    if (!dateRangeFilter.from || !dateRangeFilter.to) return true;
    return (
      tempDateRange.from.getTime() !== dateRangeFilter.from.getTime() ||
      tempDateRange.to.getTime() !== dateRangeFilter.to.getTime()
    );
  }, [tempDateRange, dateRangeFilter]);

  const toggleFlip = (id) => {
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Check if any filter has changed from the applied state
  const hasFilterChanges = useMemo(() => {
    return (
      healthZoneFilter !== appliedHealthZoneFilter ||
      healthEnclosureFilter !== appliedHealthEnclosureFilter ||
      genderFilter !== appliedGenderFilter ||
      ageFilter !== appliedAgeFilter ||
      vaccinationStatusFilter !== appliedVaccinationStatusFilter ||
      weightRangeFilter !== appliedWeightRangeFilter ||
      speciesFilter !== appliedSpeciesFilter ||
      reportHealthStatusFilter !== appliedReportHealthStatusFilter ||
      dateRangeFilter.from !== appliedDateRangeFilter.from ||
      dateRangeFilter.to !== appliedDateRangeFilter.to
    );
  }, [
    healthZoneFilter,
    appliedHealthZoneFilter,
    healthEnclosureFilter,
    appliedHealthEnclosureFilter,
    genderFilter,
    appliedGenderFilter,
    ageFilter,
    appliedAgeFilter,
    vaccinationStatusFilter,
    appliedVaccinationStatusFilter,
    weightRangeFilter,
    appliedWeightRangeFilter,
    speciesFilter,
    appliedSpeciesFilter,
    reportHealthStatusFilter,
    appliedReportHealthStatusFilter,
    dateRangeFilter,
    appliedDateRangeFilter,
  ]);

  const getVetTriggerStyle = (val) => {
    // Compact base styles for tab pills; active pill gets filled background
    const isActive = activeTab === val;
    const base = {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      borderRadius: "9999px",
      fontSize: "0.875rem",
      fontWeight: 600,
      cursor: "pointer",
      transition:
        "background-color 0.15s ease, color 0.15s ease, transform 0.12s ease",
      alignSelf: "center",
    };

    const colorMap = {
      animals: { text: "#16a34a", ring: "rgba(16,163,74,0.12)" },
      vaccinations: { text: "#0ea5a4", ring: "rgba(14,165,164,0.12)" },
      logs: { text: "#06b6d4", ring: "rgba(6,182,212,0.12)" },
      report: { text: "#10b981", ring: "rgba(16,185,129,0.12)" },
    };

    if (isActive) {
      // Filled active pill (color background + white text) with soft shadow — like Zookeeper
      const styles = {
        animals: {
          backgroundColor: "#16a34a",
          color: "#ffffff",
          boxShadow: "0 2px 6px rgba(16,163,74,0.12)",
          border: "1px solid rgba(0,0,0,0.04)",
        },
        vaccinations: {
          backgroundColor: "#0ea5a4",
          color: "#ffffff",
          boxShadow: "0 2px 6px rgba(14,165,164,0.12)",
          border: "1px solid rgba(0,0,0,0.04)",
        },
        logs: {
          backgroundColor: "#06b6d4",
          color: "#ffffff",
          boxShadow: "0 2px 6px rgba(6,182,212,0.12)",
          border: "1px solid rgba(0,0,0,0.04)",
        },
        report: {
          backgroundColor: "#10b981",
          color: "#ffffff",
          boxShadow: "0 2px 6px rgba(16,185,129,0.12)",
          border: "1px solid rgba(0,0,0,0.04)",
        },
      };

      return {
        ...base,
        transform: "translateY(-1px)",
        ...(styles[val] || styles.animals),
      };
    }

    return {
      ...base,
      backgroundColor: "transparent",
      color: "#374151",
      border: "1px solid transparent",
      paddingLeft: "0.5rem",
      paddingRight: "0.5rem",
    };
  };

  const backendToUIHealth = (raw) => {
    const backendValues = ["Excellent", "Good", "Fair", "Needs Attention"];
    if (backendValues.includes(raw)) return raw;

    switch (raw) {
      case "Healthy":
        return "Good";
      case "Under Observation":
        return "Fair";
      case "Sick":
      case "Injured":
      case "Critical":
        return "Needs Attention";
      default:
        return "Fair";
    }
  };

  const uiToBackendHealth = (ui) => {
    const backendValues = ["Excellent", "Good", "Fair", "Needs Attention"];
    if (backendValues.includes(ui)) return ui;

    switch (ui) {
      case "Healthy":
        return "Good";
      case "Under Observation":
        return "Fair";
      case "Sick":
      case "Injured":
      case "Critical":
        return "Needs Attention";
      default:
        return "Fair";
    }
  };

  // Helper to get date range based on preset
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

  const sortedVets = useMemo(() => {
    return (vets || []).slice().sort((a, b) => {
      const aLast = (a.lastName || "").toString().toLowerCase();
      const bLast = (b.lastName || "").toString().toLowerCase();
      if (aLast === bLast) {
        const aFirst = (a.firstName || "").toString().toLowerCase();
        const bFirst = (b.firstName || "").toString().toLowerCase();
        return aFirst.localeCompare(bFirst);
      }
      return aLast.localeCompare(bLast);
    });
  }, [vets]);

  const isMountedRef = useRef(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        animals,
        visits,
        vaccinationLogs,
        medicalLogs,
        animalsRes,
        enclosuresRes,
        locationsRes,
      ] = await Promise.all([
        veterinarianAPI.getAllAnimals(),
        veterinarianAPI.getAllVetVisits(),
        veterinarianAPI.getVaccinationLogs(),
        veterinarianAPI.getMedicalLogs(),
        animalAPI.getAll(),
        referenceAPI.getEnclosures(),
        locationAPI.getAll(),
      ]);

      if (!isMountedRef.current) return;

      // Set Analytics data (support both direct-array responses and { success, data } wrappers)
      if (Array.isArray(animalsRes)) {
        setAllAnimalsDB(animalsRes);
      } else if (
        animalsRes &&
        animalsRes.success &&
        Array.isArray(animalsRes.data)
      ) {
        setAllAnimalsDB(animalsRes.data);
      }

      if (Array.isArray(enclosuresRes)) {
        setAllEnclosures(enclosuresRes);
      } else if (
        enclosuresRes &&
        enclosuresRes.success &&
        Array.isArray(enclosuresRes.data)
      ) {
        setAllEnclosures(enclosuresRes.data);
      }

      if (Array.isArray(locationsRes)) {
        setAllLocations(locationsRes);
      } else if (
        locationsRes &&
        locationsRes.success &&
        Array.isArray(locationsRes.data)
      ) {
        setAllLocations(locationsRes.data);
      }

      // Build health records from animals
      const records = animals.map((a /** @type {any} */) => {
        return {
          Animal_ID: a.Animal_ID,
          Animal_Name: a.Animal_Name,
          Species: a.Species,
          Gender: a.Gender,
          Age: a.Age ?? 0,
          Weight: a.Weight ?? null,
          Health_Status: backendToUIHealth(a.Health_Status),
          Backend_Health_Status: a.Health_Status,
          Vaccinated: !!a.Is_Vaccinated,
          Enclosure_Name: a.Enclosure_Name,
          Zone: a.Zone || "Unknown",
          Image_URL: a.Image_URL,
        };
      });

      // Build vaccination records from Animal_Care_Log (Log_Type='vaccinated')
      const lastVaccinationByAnimal = {};
      const vaccinationRecordsLocal = vaccinationLogs.map(
        (log /** @type {any} */) => {
          const ts = log.Log_Date;
          const parsedTs = parseServerDate(ts);
          // store normalized ISO for last-vaccination comparisons
          const tsIso = parsedTs ? parsedTs.toISOString() : ts;
          if (
            !lastVaccinationByAnimal[log.Animal_ID] ||
            (parsedTs &&
              new Date(tsIso).getTime() >
                new Date(lastVaccinationByAnimal[log.Animal_ID]).getTime())
          ) {
            lastVaccinationByAnimal[log.Animal_ID] = tsIso;
          }
          const nextDue = parsedTs
            ? new Date(parsedTs.getTime() + 365 * 86400000).toISOString()
            : undefined;
          return {
            Vaccine_ID: `VACC-${log.Log_ID}`,
            Animal_ID: log.Animal_ID,
            Animal_Name: log.Animal_Name,
            Vaccine_Type:
              log.Activity.replace(/^Vaccination:\s*/i, "") || "Vaccination",
            Date_Administered: tsIso,
            Next_Due_Date: nextDue,
            Administered_By: log.Employee_ID || 0,
            Notes: log.Notes || undefined,
          };
        }
      );

      // Build last checkup map from medical logs and vet visits
      const lastCheckupByAnimal = {};
      medicalLogs.forEach((log /** @type {any} */) => {
        const ts = log.Log_Date;
        const parsedTs = parseServerDate(ts);
        const tsIso = parsedTs ? parsedTs.toISOString() : ts;
        if (
          !lastCheckupByAnimal[log.Animal_ID] ||
          (parsedTs &&
            new Date(tsIso).getTime() >
              new Date(lastCheckupByAnimal[log.Animal_ID]).getTime())
        ) {
          lastCheckupByAnimal[log.Animal_ID] = tsIso;
        }
      });
      visits.forEach((v /** @type {any} */) => {
        if (v.Diagnosis) {
          const ts = v.Visit_Date;
          const parsedTs = parseServerDate(ts);
          const tsIso = parsedTs ? parsedTs.toISOString() : ts;
          if (
            !lastCheckupByAnimal[v.Animal_ID] ||
            (parsedTs &&
              new Date(tsIso).getTime() >
                new Date(lastCheckupByAnimal[v.Animal_ID]).getTime())
          ) {
            lastCheckupByAnimal[v.Animal_ID] = tsIso;
          }
        }
      });

      const enrichedRecords = records.map((r /** @type {any} */) => {
        const lastVacc = lastVaccinationByAnimal[r.Animal_ID];
        return {
          ...r,
          Last_Checkup: lastCheckupByAnimal[r.Animal_ID],
          Last_Vaccination: lastVacc,
          Next_Vaccination_Due: lastVacc
            ? new Date(
                new Date(lastVacc).getTime() + 365 * 86400000
              ).toISOString()
            : undefined,
        };
      });

      // Build medical log from Animal_Care_Log (medical) + vet visit records
      const medicalLogLocal = [];

      // First pass: identify all trigger-generated health status updates (with arrows)
      // These are authoritative and should suppress app-generated "update" entries
      const triggerHealthUpdates = new Map(); // key: animal_name-minute, value: log
      medicalLogs.forEach((log /** @type {any} */) => {
        const activity = (log.Activity || "").toString();
        const logTypeRaw = (log.Log_Type || log.LogType || "").toString();

        // Trigger entries have Log_Type='update' and contain an arrow
        if (logTypeRaw.toLowerCase() === "update" && /\u2192/.test(activity)) {
          const parsed = parseServerDate(log.Log_Date);
          if (parsed) {
            const key = `${log.Animal_Name}-${Math.floor(
              parsed.getTime() / 60000
            )}`;
            triggerHealthUpdates.set(key, log);
          }
        }
      });

      // Add entries from medical/animal care logs.
      medicalLogs.forEach((log /** @type {any} */) => {
        const activity = (log.Activity || "").toString();
        const logTypeRaw = (log.Log_Type || log.LogType || "").toString();

        // Prefer the backend Log_Type if provided — normalize to our UI types.
        // IMPORTANT: We only use `type` values that actually exist in UI filters/rendering.
        // Supported UI types: "medical", "health_update", "treatment", "checkup",
        // "vaccination", "feeding", "maintenance".
        let type = "medical"; // sensible default for vet portal
        const lt = logTypeRaw.toLowerCase();
        if (lt) {
          if (lt === "medical") type = "medical";
          else if (lt === "fed" || lt === "feeding") type = "feeding";
          else if (lt === "vaccinated" || lt === "vaccination")
            type = "vaccination";
          else if (lt === "maintenance") type = "maintenance";
          else if (lt === "update") {
            // Check if it's a health status update
            if (/health\s+status/i.test(activity)) {
              type = "health_update";
            }
          }
        }

        // If backend Log_Type is absent or ambiguous, fall back to keyword heuristics
        if (!lt) {
          if (/health\s+status\s+(update|change)/i.test(activity)) {
            type = "health_update";
          } else if (/vaccin/i.test(activity)) {
            type = "vaccination";
          } else if (/feed|fed|feeding/i.test(activity)) {
            type = "feeding";
          } else if (
            /treat|treatment|medic|injection|surgery|ill|injur|sick|diagnos|checkup|exam/i.test(
              activity
            )
          ) {
            type = "medical";
          } else if (
            /clean|groom|enclosure|habitat|water|food prep/i.test(activity)
          ) {
            type = "care";
          }
        }

        // Skip app-generated "health status update" entries if a trigger entry exists
        // for the same animal at the same time (the trigger entry has the arrow format)
        if (lt === "medical" && /health\s+status\s+update/i.test(activity)) {
          const parsed = parseServerDate(log.Log_Date);
          if (parsed) {
            const key = `${log.Animal_Name}-${Math.floor(
              parsed.getTime() / 60000
            )}`;
            if (triggerHealthUpdates.has(key)) {
              return; // Skip this entry - the trigger version is more informative
            }
          }
        }

        {
          const parsed = parseServerDate(log.Log_Date);

          // Extract the *updated* health status from activity text so the badge
          // always reflects the status after the arrow transition.
          let healthStatus = undefined;
          if (type === "health_update") {
            const arrowMatch = activity.match(/\u2192\s*([^,]+)/); // "Good  Excellent"
            if (arrowMatch && arrowMatch[1]) {
              healthStatus = backendToUIHealth(arrowMatch[1].trim());
            } else {
              const statusMatch = activity.match(
                /health\s+status\s+(?:update|changed?):\s*(\w+)/i
              );
              if (statusMatch && statusMatch[1]) {
                healthStatus = backendToUIHealth(statusMatch[1]);
              }
            }
          }

          // Prefer actual employee name when available; otherwise fall back
          // to a generic staff label with the ID.
          const vetName = log.First_Name
            ? `${log.First_Name} ${log.Last_Name || ""}`.trim()
            : log.Employee_ID
            ? `Staff ${log.Employee_ID}`
            : "Vet Staff";

          medicalLogLocal.push({
            id: `MED-${log.Log_ID}`,
            type,
            timestamp: parsed ? parsed.toISOString() : log.Log_Date,
            animal_name: log.Animal_Name,
            details: activity || "Care note",
            Notes: log.Notes || log.Notes || undefined,
            veterinarian_name: vetName,
            health_status: healthStatus,
          });
        }
      });

      // Add entries from vet visit records
      // Skip vet visits that are health status updates if a trigger-generated
      // log already exists (to avoid duplicates from app-initiated updates)
      visits.forEach((v /** @type {any} */) => {
        let type = "treatment";
        if (v.Diagnosis && /checkup|exam|routine/i.test(v.Diagnosis))
          type = "checkup";
        else if (v.Diagnosis && /status|update/i.test(v.Diagnosis))
          type = "health_update";

        // Skip health_update visits if we already have a trigger log for the same event
        if (type === "health_update") {
          const parsed = parseServerDate(v.Visit_Date);
          if (parsed) {
            const key = `${v.Animal_Name}-${Math.floor(
              parsed.getTime() / 60000
            )}`;
            if (triggerHealthUpdates.has(key)) {
              return; // Skip this visit - already logged by trigger with arrow format
            }
          }
        }

        {
          const parsed = parseServerDate(v.Visit_Date);
          medicalLogLocal.push({
            id: `VISIT-${v.Visit_ID}`,
            type,
            timestamp: parsed ? parsed.toISOString() : v.Visit_Date,
            animal_name: v.Animal_Name,
            details: v.Diagnosis || v.Treatment || "Vet visit",
            Notes: v.Notes || v.Treatment || undefined,
            veterinarian_name: v.First_Name
              ? `${v.First_Name} ${v.Last_Name || ""}`.trim()
              : "Vet Staff",
            health_status: undefined,
          });
        }
      });

      // Add vaccination logs to medical log as well
      vaccinationLogs.forEach((log /** @type {any} */) => {
        {
          const parsed = parseServerDate(log.Log_Date);
          medicalLogLocal.push({
            id: `VACCLOG-${log.Log_ID}`,
            type: "vaccination",
            timestamp: parsed ? parsed.toISOString() : log.Log_Date,
            animal_name: log.Animal_Name,
            details: log.Activity || "Vaccination",
            Notes: log.Notes || undefined,
            veterinarian_name: log.First_Name
              ? `${log.First_Name} ${log.Last_Name || ""}`.trim()
              : "Vet Staff",
            health_status: undefined,
          });
        }
      });

      // Collapse paired update/medical rows into a single entry.
      // We group by animal, sort by Log ID descending, and merge adjacent
      // "medical" (app) and "health_update" (trigger) logs.
      // This handles multiple updates per day correctly.
      const mergedLog = [];

      // Helper to extract numeric ID from "MED-123"
      const getLogId = (idStr) => {
        if (typeof idStr === "string" && idStr.startsWith("MED-")) {
          return parseInt(idStr.replace("MED-", ""), 10);
        }
        return 0;
      };

      // Deduplicate entries by their unique ID first
      const seenIds = new Set();
      const deduplicatedLogs = medicalLogLocal.filter((entry) => {
        if (seenIds.has(entry.id)) {
          return false; // Skip duplicate
        }
        seenIds.add(entry.id);
        return true;
      });

      // Additional deduplication: For health_update entries with the same animal name
      // and exact timestamp, keep only ONE (prefer the one with arrow)
      const finalDeduplicated = [];
      const seenHealthUpdates = new Set(); // key: "animal_name-timestamp"

      // Sort entries: prioritize trigger entries (with arrows) over vet visit entries
      const sortedLogs = [...deduplicatedLogs].sort((a, b) => {
        // First sort by timestamp (newest first)
        const ta = parseServerDate(a.timestamp);
        const tb = parseServerDate(b.timestamp);
        const timeDiff = (tb ? tb.getTime() : 0) - (ta ? ta.getTime() : 0);
        if (timeDiff !== 0) return timeDiff;

        // For same timestamp, prioritize entries with arrows (trigger entries)
        if (a.type === "health_update" && b.type === "health_update") {
          const aHasArrow = /\u2192/.test(a.details);
          const bHasArrow = /\u2192/.test(b.details);
          if (aHasArrow && !bHasArrow) return -1;
          if (!aHasArrow && bHasArrow) return 1;
        }
        return 0;
      });

      sortedLogs.forEach((entry) => {
        // For health_update entries, create a unique key from animal name + timestamp
        if (entry.type === "health_update") {
          const key = `${entry.animal_name}-${entry.timestamp}`;

          if (seenHealthUpdates.has(key)) {
            // Skip this duplicate - already have a health update for this exact animal + time
            return;
          }

          // Mark this combination as seen
          seenHealthUpdates.add(key);
        }

        finalDeduplicated.push(entry);
      });

      // Group by animal name
      const logsByAnimal = {};
      finalDeduplicated.forEach((entry) => {
        if (!logsByAnimal[entry.animal_name]) {
          logsByAnimal[entry.animal_name] = [];
        }
        logsByAnimal[entry.animal_name].push(entry);
      });

      // Process each animal's logs
      Object.values(logsByAnimal).forEach((animalLogs) => {
        // Sort by Log ID descending (newest first)
        // For non-MED logs (VISIT, VACCLOG), we use timestamp as fallback or keep them separate?
        // Actually, let's sort by timestamp first, then ID to be safe,
        // but for the specific merge case, ID is the strongest signal of "same event".
        animalLogs.sort((a, b) => {
          const idA = getLogId(a.id);
          const idB = getLogId(b.id);
          if (idA > 0 && idB > 0) {
            return idB - idA; // Descending ID
          }
          // Fallback to timestamp
          const tb = parseServerDate(b.timestamp);
          const ta = parseServerDate(a.timestamp);
          return (tb ? tb.getTime() : 0) - (ta ? ta.getTime() : 0);
        });

        const processedIndices = new Set();

        for (let i = 0; i < animalLogs.length; i++) {
          if (processedIndices.has(i)) continue;

          const current = animalLogs[i];
          let merged = current;

          // Try to find a partner to merge with
          // We look at the next item (i+1)
          if (i + 1 < animalLogs.length) {
            const next = animalLogs[i + 1];

            // Check if they are a pair of (medical + health_update)
            // They should be close in ID (e.g. within 5) and same animal (already grouped)
            const idCurr = getLogId(current.id);
            const idNext = getLogId(next.id);

            const isPair =
              idCurr > 0 &&
              idNext > 0 &&
              Math.abs(idCurr - idNext) <= 5 && // Close IDs
              ((current.type === "medical" && next.type === "health_update") ||
                (current.type === "health_update" && next.type === "medical"));

            if (isPair) {
              // Merge them
              const medicalRow = current.type === "medical" ? current : next;
              const updateRow =
                current.type === "health_update" ? current : next;

              // Prefer updateRow details (arrow text)
              // Prefer medicalRow timestamp and vet (local time, real user)
              // Prefer updateRow health status if it has the arrow target, else medicalRow status

              // Check for arrow in updateRow details
              const hasArrow = /\u2192/.test(updateRow.details || "");
              const details = hasArrow ? updateRow.details : medicalRow.details;

              merged = {
                ...medicalRow, // Base on medical row for timestamp/vet
                details: details,
                health_status:
                  updateRow.health_status || medicalRow.health_status,
              };

              processedIndices.add(i + 1); // Skip next
            }
          }

          mergedLog.push(merged);
        }
      });

      mergedLog.sort((a, b) => {
        const tb = parseServerDate(b.timestamp);
        const ta = parseServerDate(a.timestamp);
        const tbms = tb ? tb.getTime() : 0;
        const tams = ta ? ta.getTime() : 0;
        return tbms - tams;
      });

      setHealthRecords(enrichedRecords);
      setVaccinationRecords(vaccinationRecordsLocal);
      setMedicalLog(mergedLog);

      // Load employees and filter veterinarians for the vaccination dialog
      try {
        const employees = await employeeAPI.getAll();
        const vetsList = (employees || [])
          .filter((emp) => emp.Job_ID === 3)
          .map((emp) => ({
            id: emp.Employee_ID,
            firstName: emp.First_Name || "",
            lastName: emp.Last_Name || "",
            name: `${emp.First_Name || ""} ${emp.Last_Name || ""}`.trim(),
            title: emp.Job_Title?.Title || "",
          }))
          .sort((a, b) => (a.lastName || "").localeCompare(b.lastName || ""));

        setVets(vetsList);
      } catch (e) {
        // non-fatal — still continue if employees fail to load
        console.warn("Failed to load veterinarians:", e);
      }
    } catch (err) {
      console.error("[VeterinarianPortal] Failed to load data", err);
    } finally {
      setLoading(false);
      setInitialLoadDone(true);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    loadData();
    return () => {
      isMountedRef.current = false;
    };
  }, [user.Employee_ID, user.Last_Name]);

  // Show small popup when switching tabs after initial load
  useEffect(() => {
    if (!initialLoadDone) return;
    setTabLoading(true);
    const t = setTimeout(() => setTabLoading(false), 300);
    return () => clearTimeout(t);
  }, [activeTab, initialLoadDone]);

  // Handle tab changes by preloading necessary data then switching
  const handleTabChange = async (tab) => {
    if (tab === activeTab) return;
    if (tabLoading) return;
    setPendingTab(tab);
    setTabLoading(true);
    try {
      // For now, reload main data bundle to ensure tab content has data
      await loadData();
      // avoid flicker
      await new Promise((r) => setTimeout(r, 120));
    } catch (e) {
      console.warn("Vet tab preload failed:", e);
    } finally {
      setActiveTab(tab);
      setPendingTab(null);
      setTabLoading(false);
    }
  };

  const filteredHealthRecords = useMemo(() => {
    const term = (vetSearchTerm || "").trim().toLowerCase();
    return healthRecords.filter((record /** @type {any} */) => {
      // Search match (id, name, species)
      if (term) {
        const idMatch = record.Animal_ID
          ? record.Animal_ID.toString().toLowerCase().includes(term)
          : false;
        const nameMatch = (record.Animal_Name || "")
          .toLowerCase()
          .includes(term);
        const speciesMatch = (record.Species || "")
          .toLowerCase()
          .includes(term);
        if (!(idMatch || nameMatch || speciesMatch)) return false;
      }

      const enclosureMatch =
        enclosureFilter === ALL_ENCLOSURES ||
        (record.Enclosure_Name || "") === enclosureFilter;
      // Filter by backend health status so the dropdown matches DB enums.
      // healthRecords store both UI label (Health_Status) and Backend_Health_Status.
      const healthMatch =
        filterHealthStatus === "all" ||
        (record.Backend_Health_Status || record.Health_Status) ===
          filterHealthStatus;
      return enclosureMatch && healthMatch;
    });
  }, [healthRecords, enclosureFilter, filterHealthStatus, vetSearchTerm]);

  const getLogTypeIcon = (type) => {
    switch (type) {
      case "checkup":
        return <Stethoscope className="h-4 w-4 text-blue-600" />;
      case "vaccination":
        return <Syringe className="h-4 w-4 text-green-600" />;
      case "health_update":
        return <Activity className="h-4 w-4 text-orange-600" />;
      case "treatment":
        return <Heart className="h-4 w-4" style={{ color: "#dc2626" }} />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getLogTypeBadge = (type) => {
    switch (type) {
      case "checkup":
        return "bg-blue-100 text-blue-800";
      case "vaccination":
        return "bg-emerald-100 text-emerald-800";
      case "health_update":
        return "bg-orange-100 text-orange-800";
      case "treatment":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isSameLocalDay = (a, b) => {
    try {
      const da = parseServerDate(a);
      const db = parseServerDate(b instanceof Date ? b.toISOString() : b);
      if (!da || !db) return false;
      return (
        da.getFullYear() === db.getFullYear() &&
        da.getMonth() === db.getMonth() &&
        da.getDate() === db.getDate()
      );
    } catch (e) {
      return false;
    }
  };

  // Today's medical logs memoized and responsive container height
  const todaysMedicalLogs = useMemo(() => {
    try {
      // Include medical, health_update, treatment, checkup, and vaccination types
      const medicalTypes = [
        "medical",
        "health_update",
        "treatment",
        "checkup",
        "vaccination",
      ];
      return (medicalLog || []).filter(
        (log) =>
          log &&
          log.timestamp &&
          isSameLocalDay(log.timestamp, new Date()) &&
          medicalTypes.includes(log.type)
      );
    } catch (e) {
      return [];
    }
  }, [medicalLog]);

  // Allow the log container to size naturally to its content, but cap its
  // visible height so it becomes scrollable after a threshold. This gives
  // dynamic sizing for small lists and a scroll for long lists.
  const MEDICAL_LIST_MAX_HEIGHT = 800; // px

  const enclosureOptions = useMemo(() => {
    const s = new Set();
    healthRecords.forEach((r) => {
      if (r.Enclosure_Name) s.add(r.Enclosure_Name);
    });
    return Array.from(s);
  }, [healthRecords]);

  const stats = useMemo(() => {
    const totalAnimals = healthRecords.length;

    // Count using backend health enums: Excellent, Good, Fair, Needs Attention
    const counts = {
      Excellent: 0,
      Good: 0,
      Fair: 0,
      "Needs Attention": 0,
    };

    healthRecords.forEach((r) => {
      const backend =
        r.Backend_Health_Status || uiToBackendHealth(r.Health_Status || "");
      if (counts[backend] !== undefined) counts[backend]++;
      else counts["Fair"]++;
    });

    const excellent = counts["Excellent"];
    const good = counts["Good"];
    const fair = counts["Fair"];
    const needsAttention = counts["Needs Attention"];
    const fullyVaccinated = healthRecords.filter((r) => r.Vaccinated).length;
    const vaccinationsDue = healthRecords.filter((r) => {
      if (!r.Next_Vaccination_Due) return false;
      const dueDate = new Date(r.Next_Vaccination_Due);
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 86400000);
      return dueDate <= thirtyDaysFromNow;
    }).length;

    const poorCount = fair + needsAttention;
    return {
      totalAnimals,
      excellent,
      good,
      fair,
      needsAttention,
      poorCount,
      fullyVaccinated,
      vaccinationsDue,
      // healthPercentage is defined as Excellent+Good
      healthPercentage:
        totalAnimals > 0 ? ((excellent + good) / totalAnimals) * 100 : 0,
      poorPercentage: totalAnimals > 0 ? (poorCount / totalAnimals) * 100 : 0,
      vaccinationPercentage:
        totalAnimals > 0 ? (fullyVaccinated / totalAnimals) * 100 : 0,
      statusCounts: counts,
      statusPercentages: {
        Excellent: totalAnimals > 0 ? (excellent / totalAnimals) * 100 : 0,
        Good: totalAnimals > 0 ? (good / totalAnimals) * 100 : 0,
        Fair: totalAnimals > 0 ? (fair / totalAnimals) * 100 : 0,
        "Needs Attention":
          totalAnimals > 0 ? (needsAttention / totalAnimals) * 100 : 0,
      },
    };
  }, [healthRecords]);

  const animalsNeedingAttention = useMemo(() => {
    return healthRecords.filter((r) => {
      const backend =
        r.Backend_Health_Status || uiToBackendHealth(r.Health_Status || "");
      return backend === "Needs Attention";
    });
  }, [healthRecords]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredHealthRecords.length / pageSize)
  );

  const paginatedHealthRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredHealthRecords.slice(start, start + pageSize);
  }, [filteredHealthRecords, currentPage, pageSize]);

  const getHealthBadgeColor = (backendStatus) => {
    // Expect backendStatus to be one of BACKEND_HEALTH_STATUSES
    switch (backendStatus) {
      case "Excellent":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Good":
        return "bg-green-50 text-green-700 border-green-200";
      case "Fair":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Needs Attention":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        // Fallback: if a UI label was passed (e.g. 'Sick'), map it to backend
        if (!backendStatus) return "bg-gray-100 text-gray-800 border-gray-200";
        const mapped = uiToBackendHealth(backendStatus);
        switch (mapped) {
          case "Excellent":
            return "bg-emerald-50 text-emerald-700 border-emerald-200";
          case "Good":
            return "bg-green-50 text-green-700 border-green-200";
          case "Fair":
            return "bg-yellow-100 text-yellow-800 border-yellow-200";
          case "Needs Attention":
            return "bg-red-100 text-red-800 border-red-200";
          default:
            return "bg-gray-100 text-gray-800 border-gray-200";
        }
    }
  };

  const handleAnimalClick = (record) => {
    // Keep backward-compatible behavior: toggle detail dialog if needed
    setSelectedAnimal(record);
    setAnimalDetailOpen(true);
  };

  const handleUpdateHealth = (record) => {
    // Close any detail dialog and open the update health dialog
    setAnimalDetailOpen(false);
    setSelectedAnimal(record);
    // Pre-select the current backend health status so the select shows it
    const currentBackend =
      record.Backend_Health_Status || uiToBackendHealth(record.Health_Status);
    setSelectedHealthStatus(currentBackend || "");
    // Pre-select the current user as the veterinarian performing the update
    setSelectedVetId(user.Employee_ID || null);
    setHealthNotes("");
    setHealthDialogOpen(true);
  };

  const handleApplyVaccination = (record) => {
    setAnimalDetailOpen(false);
    setSelectedAnimal(record);
    // default selected veterinarian to currently logged-in user if they appear in the vets list
    setSelectedVetId(user.Employee_ID || null);
    // reset any previous notes when opening the vaccination dialog
    setVaccinationNotes("");
    setVaccinationDialogOpen(true);
  };

  const formatLocalTimestamp = (date = new Date()) => {
    const pad = (val) => String(val).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
      date.getSeconds()
    )}`;
  };

  const confirmHealthUpdate = async () => {
    if (!selectedAnimal || !selectedHealthStatus) return;
    if (!selectedVetId) {
      toast.error("Please select the veterinarian who performed the update");
      return;
    }
    try {
      const backendStatus = uiToBackendHealth(selectedHealthStatus);
      // Update animal health - the database trigger will automatically create
      // the medical log entry, so we don't need to call createVetVisit
      await veterinarianAPI.updateAnimalHealthInfo(selectedAnimal.Animal_ID, {
        healthStatus: backendStatus,
        employeeId: selectedVetId,
        notes: healthNotes || null,
      });

      setHealthRecords((prev) =>
        prev.map((r) =>
          r.Animal_ID === selectedAnimal.Animal_ID
            ? {
                ...r,
                Health_Status: selectedHealthStatus,
                Backend_Health_Status: backendStatus,
                Last_Checkup: new Date().toISOString(),
              }
            : r
        )
      );

      // Resolve vet display name from vets list (fallback to staff id)
      const vetName =
        (vets.find((v) => v.id === selectedVetId) || {}).name ||
        `Staff ${selectedVetId}`;

      // Do not optimistically add a separate local log entry; rely on the
      // database-triggered entries and reload from the backend so each
      // health update appears exactly once.
      toast.success(`Health status updated for ${selectedAnimal.Animal_Name}`, {
        description: `Status: ${selectedHealthStatus}`,
      });
      // Refresh data so the Medical Logs tab reflects the backend truth
      try {
        await loadData();
      } catch (e) {
        // non-fatal — we already updated optimistically
        console.warn("Failed to refresh medical logs after health update", e);
      }
    } catch (err) {
      console.error("Failed to update health", err);
      toast.error("Failed to update health status");
    } finally {
      setHealthDialogOpen(false);
      setSelectedAnimal(null);
      setSelectedVetId(null);
    }
  };

  const openVaccinationConfirmation = () => {
    if (!selectedVetId) {
      toast.error("Please select the administering veterinarian");
      return;
    }
    setVaccinationDialogOpen(false);
    setConfirmVaccinationOpen(true);
  };

  const toggleAnimalColumn = (col) => {
    if (col === "all") {
      const allChecked = Object.values(animalVisibleColumns).every((v) => v);
      const newState = {};
      Object.keys(animalVisibleColumns).forEach((k) => {
        newState[k] = !allChecked;
      });
      setAnimalVisibleColumns(newState);
    } else {
      setAnimalVisibleColumns((prev) => ({ ...prev, [col]: !prev[col] }));
    }
  };

  const toggleAnimalSort = (col) => {
    setAnimalSortState((prev) => {
      if (prev.col === col) {
        return { col, dir: prev.dir === "asc" ? "desc" : "asc" };
      }
      return { col, dir: "asc" };
    });
  };

  const handleAnimalPageChange = (page) => {
    setAnimalCurrentPage(page);
  };

  const handleApplyFilters = () => {
    setAppliedHealthZoneFilter(healthZoneFilter);
    setAppliedHealthEnclosureFilter(healthEnclosureFilter);
    setAppliedGenderFilter(genderFilter);
    setAppliedAgeFilter(ageFilter);
    setAppliedVaccinationStatusFilter(vaccinationStatusFilter);
    setAppliedWeightRangeFilter(weightRangeFilter);
    setAppliedSpeciesFilter(speciesFilter);
    setAppliedReportHealthStatusFilter(reportHealthStatusFilter);
    setAppliedDateRangeFilter(dateRangeFilter);
  };

  const enclosureMap = useMemo(() => {
    const map = {};
    allEnclosures.forEach((enc) => {
      map[enc.Enclosure_ID] = enc;
    });
    return map;
  }, [allEnclosures]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = parseServerDate(dateString);
    if (!date) return "N/A";
    return date.toLocaleDateString();
  };

  function parseServerDate(input) {
    if (!input) return null;
    if (input instanceof Date) return input;
    if (typeof input !== "string") return new Date(input);

    // If string ends with Z or has an explicit offset, let Date parse it
    // and convert to the user's local time zone.
    if (/Z$/.test(input) || /[+-]\d{2}:?\d{2}$/.test(input)) {
      const d = new Date(input);
      return isNaN(d.getTime()) ? null : d;
    }

    // Detect MySQL DATETIME like '2025-11-24 20:41:16' or '2025-11-24T20:41:16'
    // and treat it as a local time (no timezone shift).
    const m = input.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)$/);
    if (m) {
      const isoLocal = `${m[1]}T${m[2]}`; // interpreted as local time
      const d = new Date(isoLocal);
      return isNaN(d.getTime()) ? null : d;
    }

    // Fallback to default parsing
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  const confirmVaccination = async () => {
    if (!selectedAnimal || !selectedVetId) return;
    const now = new Date();
    const nextDue = new Date(now.getTime() + 365 * 86400000);
    try {
      // Create vaccination log using the new endpoint.
      // Send an explicit UTC ISO timestamp (logDate) so the backend stores
      // the exact client-side time the action was taken. The backend will
      // still accept this and return the persisted Log_Date which we then
      // convert to ISO for consistent local rendering.
      const response = await veterinarianAPI.createVaccinationLog({
        animalId: selectedAnimal.Animal_ID,
        employeeId: selectedVetId,
        vaccine: "Vaccination",
        notes: vaccinationNotes || "Vaccination administered",
        markVaccinated: true,
        logDate: now.toISOString(),
      });

      // Prefer the backend-returned Log_Date (ISO-8601 UTC string). Convert
      // it to an ISO string for consistent client-side usage. If the backend
      // doesn't return it for some reason, fall back to our local now.
      // Convert it to an ISO string for consistent client-side usage. If the
      // backend doesn't return it for some reason, fall back to our local now.
      const savedLogDateRaw = response?.log?.Log_Date;
      const savedLogDate = savedLogDateRaw
        ? (
            parseServerDate(savedLogDateRaw) || new Date(savedLogDateRaw)
          ).toISOString()
        : now.toISOString();

      const newVaccination = {
        Vaccine_ID: `VAC-${response.log.Log_ID}`,
        Animal_ID: selectedAnimal.Animal_ID,
        Animal_Name: selectedAnimal.Animal_Name,
        Vaccine_Type: "Vaccination",
        Date_Administered: savedLogDate,
        Next_Due_Date: new Date(
          new Date(savedLogDate).getTime() + 365 * 86400000
        ).toISOString(),
        Administered_By: selectedVetId,
        Notes: vaccinationNotes || "Vaccination administered",
      };

      setVaccinationRecords((prev) => [newVaccination, ...prev]);
      setHealthRecords((prev) =>
        prev.map((r) =>
          r.Animal_ID === selectedAnimal.Animal_ID
            ? {
                ...r,
                Vaccinated: true,
                Last_Vaccination: now.toISOString(),
                Next_Vaccination_Due: nextDue.toISOString(),
              }
            : r
        )
      );

      const vetName =
        (vets.find((v) => v.id === selectedVetId) || {}).name ||
        `Staff ${selectedVetId}`;
      setMedicalLog((prev) => [
        {
          id: `VACCLOG-${response.log.Log_ID}`,
          type: "vaccination",
          // use the persisted date if available so UI matches backend
          timestamp: savedLogDate,
          animal_name: selectedAnimal.Animal_Name,
          details: `Vaccination administered`,
          veterinarian_name: vetName,
        },
        ...prev,
      ]);
      toast.success(
        `Vaccination administered to ${selectedAnimal.Animal_Name}`,
        {
          description: `Next due: ${nextDue.toLocaleDateString()}`,
        }
      );
      // Refresh data so Vaccinations and Medical Logs reflect backend records
      try {
        await loadData();
      } catch (e) {
        console.warn("Failed to refresh data after vaccination", e);
      }
    } catch (err) {
      console.error("Failed vaccination", err);
      toast.error("Failed to apply vaccination");
    } finally {
      setConfirmVaccinationOpen(false);
      setSelectedAnimal(null);
      setSelectedVetId(null);
      setVaccinationNotes("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {(tabLoading || loading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto bg-white rounded-lg shadow-lg px-6 py-6 w-56 text-center">
            <LoadingWithIcon text="Loading..." size={36} imgClassName="" />
          </div>
        </div>
      )}
      <style>{flipStyles}</style>
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
                <p className="text-sm text-gray-600">Veterinarian Dashboard</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium" style={{ color: "#2E7D32" }}>
                  {user.First_Name} {user.Last_Name}
                </p>
                <p className="text-sm text-gray-600">{user.Job_Title?.Title}</p>
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
        {/* Animals requiring attention */}
        {stats.needsAttention > 0 && (
          <Alert className="bg-red-50 border border-red-200 mb-8 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <AlertTriangle className="h-5 w-5 text-red-700" />
              </div>
              <AlertDescription className="text-red-800">
                <div className="flex flex-col">
                  <button
                    onClick={() => setAttentionListOpen(true)}
                    className="text-left font-bold text-red-700 hover:text-red-900 underline-offset-2 underline cursor-pointer"
                  >
                    {stats.needsAttention} animal
                    {stats.needsAttention > 1 ? "s" : ""}
                  </button>
                  <p className="text-sm text-red-800 mt-1">
                    {stats.needsAttention === 1 ? "requires" : "require"}{" "}
                    immediate attention
                  </p>
                </div>
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card
            className="bg-white"
            style={{
              borderLeft: "4px solid #16a34a",
              background: "linear-gradient(90deg,#ecfdf5 0%, #ffffff 100%)",
              overflow: "hidden",
            }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Animals</p>
                  <p className="text-3xl text-green-600">
                    {stats.totalAnimals}
                  </p>
                </div>
                <PawPrint
                  className="h-10 w-10"
                  style={{ color: "rgba(16,163,74,0.2)" }}
                />
              </div>
            </CardContent>
          </Card>

          <Card
            className="bg-white"
            style={{
              borderLeft: "4px solid #10b981",
              background: "linear-gradient(90deg,#f0fdf4 0%, #ffffff 100%)",
              overflow: "hidden",
            }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Healthy</p>
                  <p className="text-3xl text-green-600">
                    {((stats.excellent || 0) + (stats.good || 0)).toString()}
                  </p>
                  <p className="text-xs text-gray-500">Excellent, Good</p>
                </div>
                {/* Use inline color with alpha to ensure the soft, muted icon color appears correctly */}
                <Heart
                  className="h-10 w-10"
                  style={{ color: "rgba(16,163,74,0.2)" }}
                />
              </div>
            </CardContent>
          </Card>

          <Card
            className="bg-white"
            style={{
              borderLeft: "4px solid #0d9488",
              background: "linear-gradient(90deg,#ecfeff 0%, #ffffff 100%)",
              overflow: "hidden",
            }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Vaccinated</p>
                  <p className="text-3xl text-teal-600">
                    {stats.fullyVaccinated}
                  </p>
                  <p className="text-xs text-gray-500">
                    {stats.vaccinationPercentage.toFixed(0)}% coverage
                  </p>
                </div>
                <Syringe
                  className="h-10 w-10"
                  style={{ color: "rgba(16,163,74,0.2)" }}
                />
              </div>
            </CardContent>
          </Card>

          <Card
            className="bg-white"
            style={{
              borderLeft: "4px solid #f97316",
              background: "linear-gradient(90deg,#fff7ed 0%, #ffffff 100%)",
              overflow: "hidden",
            }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Poor</p>
                  <p className="text-3xl text-orange-600">
                    {typeof stats.poorCount === "number"
                      ? stats.poorCount
                      : "—"}
                  </p>
                  <p className="text-xs text-gray-500">Fair, Critical</p>
                </div>
                <CheckCircle2
                  className="h-10 w-10"
                  style={{ color: "rgba(249,115,22,0.2)" }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          style={{ display: "block", marginBottom: 24 }}
        >
          <TabsList
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "0.75rem",
              backgroundColor: "#f3f4f6",
              padding: "8px 10px",
              marginBottom: 16,
              minHeight: 44,
              boxSizing: "border-box",
              borderRadius: 9999,
              border: "1px solid #e5e7eb",
              flexWrap: "wrap",
            }}
          >
            <TabsTrigger value="animals" style={getVetTriggerStyle("animals")}>
              <Stethoscope style={{ width: 16, height: 16, marginRight: 8 }} />
              Animal Health
            </TabsTrigger>
            <TabsTrigger
              value="vaccinations"
              style={getVetTriggerStyle("vaccinations")}
            >
              <Syringe style={{ width: 16, height: 16, marginRight: 8 }} />
              Vaccinations
            </TabsTrigger>
            <TabsTrigger value="logs" style={getVetTriggerStyle("logs")}>
              <ClipboardCheck
                style={{ width: 16, height: 16, marginRight: 8 }}
              />
              Medical Logs
            </TabsTrigger>
            <TabsTrigger value="report" style={getVetTriggerStyle("report")}>
              <FileText style={{ width: 16, height: 16, marginRight: 8 }} />
              Health Report
            </TabsTrigger>
          </TabsList>

          {/* Animals Health Tab */}
          <TabsContent value="animals" className="space-y-6">
            {/* Filters */}
            <Card className="bg-white">
              {/* make header height consistent and center children vertically */}
              <CardHeader className="grid auto-rows-min grid-rows-[auto] items-center gap-0 px-6 py-4">
                <div className="flex items-center justify-between gap-4 w-full">
                  <div className="flex-none">
                    <div className="max-w-[200px] flex items-center">
                      <Input
                        id="vet-search"
                        type="search"
                        value={vetSearchTerm}
                        onChange={(e) => setVetSearchTerm(e.target.value)}
                        placeholder="Search by ID, keywords"
                        className="h-8 text-sm w-full"
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Select
                      value={enclosureFilter}
                      onValueChange={setEnclosureFilter}
                    >
                      <SelectTrigger className="w-56">
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

                    <div>
                      <Select
                        value={filterHealthStatus}
                        onValueChange={setFilterHealthStatus}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          {BACKEND_HEALTH_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {backendToDisplayLabel(s)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Animals Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {paginatedHealthRecords.map((record) => (
                <Card
                  key={record.Animal_ID}
                  className="bg-white hover:shadow-lg transition-all cursor-pointer hover:scale-105"
                  onClick={() => toggleFlip(record.Animal_ID)}
                >
                  <CardContent className="p-0 [&:last-child]:pb-0">
                    {/* Flip container: front = summary, back = detail (was previously in the dialog) */}
                    <div
                      className={`flip-card ${
                        flippedCards[record.Animal_ID] ? "flipped" : ""
                      }`}
                    >
                      <div className="flipper">
                        <div className="front p-4">
                          <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-gray-100">
                            <ImageWithFallback
                              src={record.Image_URL || ""}
                              alt={record.Animal_Name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium truncate">
                                  {record.Animal_Name}
                                </h3>
                                <p className="text-sm text-gray-600 truncate">
                                  {record.Species}
                                </p>
                              </div>
                            </div>
                            {(() => {
                              const mapped =
                                record.Backend_Health_Status ||
                                uiToBackendHealth(record.Health_Status);
                              if (mapped === "Excellent") {
                                return (
                                  <Badge
                                    style={{
                                      display: "block",
                                      width: "100%",
                                      textAlign: "center",
                                      backgroundColor: "#ecfdf5", // emerald-50
                                      color: "#065f46", // emerald-700
                                      border: "1px solid #bbf7d0", // emerald-200
                                      borderRadius: "0.375rem",
                                      padding: "0.25rem 0",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {backendToDisplayLabel(mapped)}
                                  </Badge>
                                );
                              }
                              if (mapped === "Good") {
                                return (
                                  <Badge
                                    style={{
                                      display: "block",
                                      width: "100%",
                                      textAlign: "center",
                                      backgroundColor: "#f0fdf4", // green-50
                                      color: "#166534", // green-800
                                      border: "1px solid #bbf7d0",
                                      borderRadius: "0.375rem",
                                      padding: "0.25rem 0",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {backendToDisplayLabel(mapped)}
                                  </Badge>
                                );
                              }
                              return (
                                <Badge
                                  className={`${getHealthBadgeColor(
                                    mapped
                                  )} w-full justify-center`}
                                >
                                  {backendToDisplayLabel(mapped)}
                                </Badge>
                              );
                            })()}
                          </div>
                        </div>

                        <div className="back p-4">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                              <ImageWithFallback
                                src={record.Image_URL || ""}
                                alt={record.Animal_Name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold truncate">
                                {record.Animal_Name}
                              </h3>
                              <p className="text-sm text-gray-600 truncate">
                                {record.Species}
                              </p>
                            </div>
                            <div className="self-start">
                              {(() => {
                                const mapped =
                                  record.Backend_Health_Status ||
                                  uiToBackendHealth(record.Health_Status);
                                if (mapped === "Excellent") {
                                  return (
                                    <Badge
                                      style={{
                                        display: "inline-block",
                                        backgroundColor: "#ecfdf5", // emerald-50
                                        color: "#065f46", // emerald-700
                                        border: "1px solid #bbf7d0",
                                        padding: "0.25rem 0.75rem",
                                        borderRadius: "9999px",
                                        fontWeight: 600,
                                        fontSize: "0.875rem",
                                      }}
                                    >
                                      {backendToDisplayLabel(mapped)}
                                    </Badge>
                                  );
                                }
                                if (mapped === "Good") {
                                  return (
                                    <Badge
                                      style={{
                                        display: "inline-block",
                                        backgroundColor: "#f0fdf4", // green-50
                                        color: "#166534", // green-800
                                        border: "1px solid #bbf7d0",
                                        padding: "0.25rem 0.75rem",
                                        borderRadius: "9999px",
                                        fontWeight: 600,
                                        fontSize: "0.875rem",
                                      }}
                                    >
                                      {backendToDisplayLabel(mapped)}
                                    </Badge>
                                  );
                                }
                                return (
                                  <Badge
                                    className={`${getHealthBadgeColor(
                                      mapped
                                    )} px-3 py-1 rounded-full`}
                                  >
                                    {backendToDisplayLabel(mapped)}
                                  </Badge>
                                );
                              })()}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-3 text-sm text-gray-700">
                            <div>
                              <p className="text-xs text-gray-500">Age</p>
                              <p className="font-medium">
                                {record.Age ?? "-"} years
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Weight</p>
                              <p className="font-medium">
                                {record.Weight ?? "-"} lbs
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Gender</p>
                              <p className="font-medium">
                                {record.Gender === "M"
                                  ? "Male"
                                  : record.Gender === "F"
                                  ? "Female"
                                  : "Unknown"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Zone</p>
                              <p className="font-medium">{record.Zone}</p>
                            </div>
                          </div>

                          <div className="border-t pt-3 mb-3 text-sm text-gray-700">
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-600">Habitat</p>
                              <p className="text-right">
                                {record.Enclosure_Name}
                              </p>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-sm text-gray-600">
                                Vaccinated
                              </p>
                              {record.Vaccinated ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <AlertTriangle className="h-5 w-5 text-orange-600" />
                              )}
                            </div>
                            {/* Last checkup removed per UI request */}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              className="flex items-center justify-center gap-2 px-3 py-2 rounded-md font-semibold bg-white text-green-800 border border-green-200 hover:bg-green-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateHealth(record);
                              }}
                            >
                              <Activity className="h-4 w-4 text-green-700" />
                              Update Health
                            </Button>

                            <Button
                              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md font-semibold bg-white text-teal-700 border border-teal-300 ${
                                record.Vaccinated
                                  ? "cursor-default opacity-60"
                                  : "hover:bg-teal-50 shadow-sm"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApplyVaccination(record);
                              }}
                              disabled={record.Vaccinated}
                            >
                              <Syringe className="h-4 w-4 text-teal-700" />
                              Vaccinate
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="mt-4">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => setCurrentPage(p)}
              />
            </div>

            {filteredHealthRecords.length === 0 && (
              <Card className="bg-white">
                <CardContent className="py-12 text-center">
                  <PawPrint className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No animals found with the selected filters
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Vaccinations Tab */}
          <TabsContent value="vaccinations" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center text-teal-600">
                  <Syringe className="h-5 w-5 mr-2 text-teal-600" />
                  Vaccination Records
                </CardTitle>
                <CardDescription>
                  Recent vaccination history and upcoming schedules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {vaccinationRecords.map((record) => (
                      <div
                        key={record.Vaccine_ID}
                        style={{
                          padding: "1rem",
                          borderRadius: "0.5rem",
                          background:
                            "linear-gradient(to right, #f0fdfa, #ecfeff)",
                          transition: "all 0.2s ease",
                          border: "1px solid #e5e7eb",
                          boxShadow: "none",
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {record.Animal_Name}
                            </p>
                            <p className="text-sm text-gray-700">
                              {record.Vaccine_Type}
                            </p>
                            <p className="text-xs text-gray-600">
                              By:{" "}
                              {(
                                vets.find(
                                  (v) => v.id === record.Administered_By
                                ) || {}
                              ).name || `Staff ${record.Administered_By}`}
                            </p>
                          </div>
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            Administered
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-3">
                          <div>
                            <p className="text-xs">Date Administered</p>
                            <p className="font-medium text-gray-900">
                              {new Date(
                                record.Date_Administered
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs">Next Due Date</p>
                            <p className="font-medium text-gray-900">
                              {new Date(
                                record.Next_Due_Date
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {record.Notes && (
                          <p className="text-sm text-gray-600 mt-2 pt-2 border-t">
                            <span className="font-medium">Notes:</span>{" "}
                            {record.Notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medical Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="flex items-center text-cyan-600">
                  <ClipboardCheck className="h-5 w-5 mr-2 text-cyan-600" />
                  Daily Medical Log
                </CardTitle>
                <CardDescription>
                  Records of animal health activity for today.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea
                  height={
                    todaysMedicalLogs.length > 6
                      ? MEDICAL_LIST_MAX_HEIGHT
                      : undefined
                  }
                  style={{
                    maxHeight: MEDICAL_LIST_MAX_HEIGHT,
                    overflowY: "auto",
                  }}
                >
                  <div className="space-y-3">
                    {todaysMedicalLogs.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <ClipboardCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">
                          No medical logs recorded today.
                        </p>
                        <p className="text-xs mt-1">
                          Health updates will appear here.
                        </p>
                      </div>
                    ) : (
                      todaysMedicalLogs.map((log) => (
                        <div
                          key={log.id}
                          style={{
                            padding: "1rem",
                            borderRadius: "0.5rem",
                            background:
                              "linear-gradient(to right, #f0fdfa, #ecfeff)",
                            transition: "all 0.2s ease",
                            border: "1px solid #e5e7eb",
                            boxShadow: "none",
                          }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {log.animal_name}
                              </p>
                              <p className="text-sm text-gray-700">
                                {log.details}
                              </p>
                            </div>
                            <div className="text-xs text-gray-600 text-right ml-4 whitespace-nowrap">
                              {(() => {
                                const d = parseServerDate(log.timestamp);
                                return d ? d.toLocaleString() : "N/A";
                              })()}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                            <span>By: {log.veterinarian_name}</span>
                            {log.health_status && (
                              <>
                                <span>•</span>
                                <Badge
                                  className={getHealthBadgeColor(
                                    uiToBackendHealth(log.health_status || "")
                                  )}
                                >
                                  {backendToDisplayLabel(
                                    uiToBackendHealth(log.health_status || "")
                                  )}
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="report" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl text-gray-900 flex items-center gap-2">
                <Activity className="h-6 w-6 text-red-500" /> Analytics
              </h2>

              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Date added:</span>
                <Popover
                  open={isDatePickerOpen}
                  onOpenChange={(open) => {
                    if (open) {
                      setTempDateRange(dateRangeFilter);
                      setPrevDateRange(dateRangeFilter);
                    }
                    setIsDatePickerOpen(open);
                  }}
                >
                  <PopoverTrigger asChild>
                    <button
                      aria-label="Open date range picker"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-white text-sm"
                      style={{ borderColor: "#e5e7eb" }}
                    >
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-700">
                        {dateRangePreset === "today" && "Today"}
                        {dateRangePreset === "week" && "Past Week"}
                        {dateRangePreset === "month" && "Past Month"}
                        {dateRangePreset === "all" && "All Time"}
                        {dateRangePreset === "custom" &&
                          dateRangeFilter.from &&
                          dateRangeFilter.to && (
                            <>
                              {new Date(
                                dateRangeFilter.from
                              ).toLocaleDateString()}{" "}
                              -{" "}
                              {new Date(
                                dateRangeFilter.to
                              ).toLocaleDateString()}
                            </>
                          )}
                      </span>
                    </button>
                  </PopoverTrigger>

                  <PopoverContent
                    className="w-auto p-0"
                    align="end"
                    style={{ width: "450px" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ display: "flex" }}>
                      {/* Quick Ranges */}
                      <div
                        style={{
                          width: "160px",
                          borderRight: "1px solid #e5e7eb",
                          paddingRight: "0.75rem",
                          padding: "1rem",
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
                                const range = getDateRangeFromPreset("today");
                                setDateRangeFilter(range);
                                setTempDateRange(range);
                                setDateRangePreset("today");
                                setIsDatePickerOpen(false);
                              }}
                              style={{
                                width: "100%",
                                textAlign: "left",
                                padding: "0.5rem",
                                borderRadius: "0.375rem",
                                border: "none",
                                background:
                                  dateRangePreset === "today"
                                    ? "#f3f4f6"
                                    : "transparent",
                                cursor: "pointer",
                                fontSize: "0.875rem",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Today
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => {
                                const range = getDateRangeFromPreset("week");
                                setDateRangeFilter(range);
                                setTempDateRange(range);
                                setDateRangePreset("week");
                                setIsDatePickerOpen(false);
                              }}
                              style={{
                                width: "100%",
                                textAlign: "left",
                                padding: "0.5rem",
                                borderRadius: "0.375rem",
                                border: "none",
                                background:
                                  dateRangePreset === "week"
                                    ? "#f3f4f6"
                                    : "transparent",
                                cursor: "pointer",
                                fontSize: "0.875rem",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Past Week
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => {
                                const range = getDateRangeFromPreset("month");
                                setDateRangeFilter(range);
                                setTempDateRange(range);
                                setDateRangePreset("month");
                                setIsDatePickerOpen(false);
                              }}
                              style={{
                                width: "100%",
                                textAlign: "left",
                                padding: "0.5rem",
                                borderRadius: "0.375rem",
                                border: "none",
                                background:
                                  dateRangePreset === "month"
                                    ? "#f3f4f6"
                                    : "transparent",
                                cursor: "pointer",
                                fontSize: "0.875rem",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Past Month
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => {
                                const range = getDateRangeFromPreset("all");
                                setDateRangeFilter(range);
                                setTempDateRange(range);
                                setDateRangePreset("all");
                                setIsDatePickerOpen(false);
                              }}
                              style={{
                                width: "100%",
                                textAlign: "left",
                                padding: "0.5rem",
                                borderRadius: "0.375rem",
                                border: "none",
                                background:
                                  dateRangePreset === "all"
                                    ? "#f3f4f6"
                                    : "transparent",
                                cursor: "pointer",
                                fontSize: "0.875rem",
                                whiteSpace: "nowrap",
                              }}
                            >
                              All Time
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => {
                                const range = getDateRangeFromPreset("all");
                                setDateRangeFilter(range);
                                setTempDateRange(range);
                                setDateRangePreset("all");
                                setIsDatePickerOpen(false);
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

                      {/* Calendar Picker */}
                      <div style={{ flex: 1, padding: "1rem" }}>
                        <DayPicker
                          mode="range"
                          selected={tempDateRange}
                          onSelect={(range) => {
                            if (!range) return;
                            if (range?.from) {
                              const sel = {
                                from: range.from,
                                to: range.to || range.from,
                              };
                              setTempDateRange(sel);
                            }
                          }}
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
                            onClick={() =>
                              setTempDateRange({ from: null, to: null })
                            }
                          >
                            Clear
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              if (!canApplyDate) return;
                              setDateRangeFilter(tempDateRange);
                              setDateRangePreset("custom");
                              setIsDatePickerOpen(false);
                            }}
                            disabled={!canApplyDate}
                            className={`${
                              canApplyDate
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-green-200 cursor-not-allowed"
                            } text-white`}
                            title={
                              !canApplyDate
                                ? "Select a date range (at least two different dates) to apply"
                                : "Apply selected date range"
                            }
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Card>
              <div className="flex items-center justify-between">
                {/* left placeholder so right-side button aligns to the right */}
                <div />
              </div>
              <CardContent className="pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
                        <SelectItem
                          value="None"
                          className="text-muted-foreground"
                        >
                          No selection . . .
                        </SelectItem>
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
                          value === "All"
                            ? "All"
                            : value === "None"
                            ? "None"
                            : parseInt(value)
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
                            // If user selected 'All' zones, show all enclosures.
                            if (healthZoneFilter === "All") return true;
                            // If user selected 'None' (explicitly no selection),
                            // do not populate enclosure list (only the 'All Enclosures' item will remain).
                            if (healthZoneFilter === "None") return false;
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

                  {/* Vaccination Status Filter */}
                  <div>
                    <Label htmlFor="vaccination-status-filter">
                      Vaccination Status
                    </Label>
                    <Select
                      value={vaccinationStatusFilter}
                      onValueChange={(value) =>
                        setVaccinationStatusFilter(value)
                      }
                    >
                      <SelectTrigger
                        id="vaccination-status-filter"
                        className="cursor-pointer"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Animals</SelectItem>
                        <SelectItem value="Vaccinated">Vaccinated</SelectItem>
                        <SelectItem value="Not Vaccinated">
                          Not Vaccinated
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Weight Range Filter */}
                  <div>
                    <Label htmlFor="weight-range-filter">
                      Weight Range (lbs)
                    </Label>
                    <Select
                      value={weightRangeFilter}
                      onValueChange={(value) => setWeightRangeFilter(value)}
                    >
                      <SelectTrigger
                        id="weight-range-filter"
                        className="cursor-pointer"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Weights</SelectItem>
                        <SelectItem value="0-50">0-50 lbs</SelectItem>
                        <SelectItem value="51-100">51-100 lbs</SelectItem>
                        <SelectItem value="101-200">101-200 lbs</SelectItem>
                        <SelectItem value="201-500">201-500 lbs</SelectItem>
                        <SelectItem value="501+">501+ lbs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Species Filter */}
                  <div>
                    <Label htmlFor="species-filter">Species</Label>
                    <Select
                      value={speciesFilter}
                      onValueChange={(value) => setSpeciesFilter(value)}
                    >
                      <SelectTrigger
                        id="species-filter"
                        className="cursor-pointer"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <div
                          style={{
                            maxHeight: 260,
                            overflowY: "auto",
                            paddingRight: 6,
                          }}
                        >
                          <SelectItem value="All">All Species</SelectItem>
                          {Array.from(
                            new Set(allAnimalsDB.map((a) => a.Species))
                          )
                            .sort()
                            .map((species) => (
                              <SelectItem key={species} value={species}>
                                {species}
                              </SelectItem>
                            ))}
                        </div>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Health Status Filter */}
                  <div>
                    <Label htmlFor="report-health-status-filter">
                      Health Status
                    </Label>
                    <Select
                      value={reportHealthStatusFilter}
                      onValueChange={(value) =>
                        setReportHealthStatusFilter(value)
                      }
                    >
                      <SelectTrigger
                        id="report-health-status-filter"
                        className="cursor-pointer"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Statuses</SelectItem>
                        {BACKEND_HEALTH_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {backendToDisplayLabel(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t mt-4 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Reset current selections and applied filters to defaults
                      setHealthZoneFilter("None");
                      setHealthEnclosureFilter("All");
                      setGenderFilter("All");
                      setAgeFilter("All");
                      setVaccinationStatusFilter("All");
                      setWeightRangeFilter("All");
                      setSpeciesFilter("All");
                      setReportHealthStatusFilter("All");
                      setDateRangeFilter({ from: null, to: null });
                      setTempDateRange({ from: null, to: null });
                      setDateRangePreset("all");
                      setAppliedHealthZoneFilter("None");
                      setAppliedHealthEnclosureFilter("All");
                      setAppliedGenderFilter("All");
                      setAppliedAgeFilter("All");
                      setAppliedVaccinationStatusFilter("All");
                      setAppliedWeightRangeFilter("All");
                      setAppliedSpeciesFilter("All");
                      setAppliedReportHealthStatusFilter("All");
                      setAppliedDateRangeFilter({ from: null, to: null });
                    }}
                    className="cursor-pointer"
                  >
                    Reset All
                  </Button>

                  <Button
                    onClick={handleApplyFilters}
                    disabled={!hasFilterChanges}
                    className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply
                  </Button>
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

              // Filter animals based on applied filters
              const filteredAnimals = (() => {
                // If Zone is explicitly set to 'None' (No selection), do not show any animals
                if (appliedHealthZoneFilter === "None") {
                  return [];
                }

                return allAnimalsDB.filter((animal) => {
                  // Zone filter
                  if (
                    appliedHealthZoneFilter !== "All" &&
                    appliedHealthZoneFilter !== "None"
                  ) {
                    const enclosure = allEnclosures.find(
                      (e) => e.Enclosure_ID === animal.Enclosure_ID
                    );
                    const location = allLocations.find(
                      (loc) => loc.Location_ID === enclosure?.Location_ID
                    );
                    if (location?.Zone !== appliedHealthZoneFilter)
                      return false;
                  }

                  // Enclosure filter
                  if (
                    appliedHealthEnclosureFilter !== "All" &&
                    appliedHealthEnclosureFilter !== "None" &&
                    animal.Enclosure_ID !== appliedHealthEnclosureFilter
                  )
                    return false;

                  // Gender filter
                  if (
                    appliedGenderFilter !== "All" &&
                    appliedGenderFilter !== "None" &&
                    animal.Gender !== appliedGenderFilter
                  )
                    return false;

                  // Age filter
                  if (
                    appliedAgeFilter !== "All" &&
                    appliedAgeFilter !== "None"
                  ) {
                    const age = calculateAge(animal.Birthday);
                    if (ageFilter === "0-2" && (age < 0 || age > 2))
                      return false;
                    if (ageFilter === "3-5" && (age < 3 || age > 5))
                      return false;
                    if (ageFilter === "6-10" && (age < 6 || age > 10))
                      return false;
                    if (ageFilter === "11+" && age < 11) return false;
                  }

                  // Vaccination Status filter
                  if (appliedVaccinationStatusFilter !== "All") {
                    const healthRecord = healthRecords.find(
                      (hr) => hr.Animal_ID === animal.Animal_ID
                    );
                    if (
                      appliedVaccinationStatusFilter === "Vaccinated" &&
                      !healthRecord?.Vaccinated
                    )
                      return false;
                    if (
                      appliedVaccinationStatusFilter === "Not Vaccinated" &&
                      healthRecord?.Vaccinated
                    )
                      return false;
                  }

                  // Weight Range filter
                  if (appliedWeightRangeFilter !== "All" && animal.Weight) {
                    const weight = animal.Weight;
                    if (
                      appliedWeightRangeFilter === "0-50" &&
                      (weight < 0 || weight > 50)
                    )
                      return false;
                    if (
                      appliedWeightRangeFilter === "51-100" &&
                      (weight < 51 || weight > 100)
                    )
                      return false;
                    if (
                      appliedWeightRangeFilter === "101-200" &&
                      (weight < 101 || weight > 200)
                    )
                      return false;
                    if (
                      appliedWeightRangeFilter === "201-500" &&
                      (weight < 201 || weight > 500)
                    )
                      return false;
                    if (appliedWeightRangeFilter === "501+" && weight < 501)
                      return false;
                  }

                  // Species filter
                  if (
                    appliedSpeciesFilter !== "All" &&
                    animal.Species !== appliedSpeciesFilter
                  )
                    return false;

                  // Health Status filter
                  if (appliedReportHealthStatusFilter !== "All") {
                    if (
                      animal.Health_Status !== appliedReportHealthStatusFilter
                    )
                      return false;
                  }

                  // Date Range filter (based on Date_Added)
                  if (
                    appliedDateRangeFilter.from ||
                    appliedDateRangeFilter.to
                  ) {
                    if (!animal.Date_Added) return false;

                    const animalDate = new Date(animal.Date_Added);
                    animalDate.setHours(0, 0, 0, 0);

                    if (appliedDateRangeFilter.from) {
                      const fromDate = new Date(appliedDateRangeFilter.from);
                      fromDate.setHours(0, 0, 0, 0);
                      if (animalDate < fromDate) return false;
                    }

                    if (appliedDateRangeFilter.to) {
                      const toDate = new Date(appliedDateRangeFilter.to);
                      toDate.setHours(23, 59, 59, 999);
                      if (animalDate > toDate) return false;
                    }
                  }

                  return true;
                });
              })();

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

              // canonical health status color map
              const healthColors = {
                Excellent: "#06B6D4",
                Good: "#059669",
                Fair: "#F59E0B",
                "Needs Attention": "#EF4444",
              };

              // Helper to convert backend status to display label
              const backendToDisplayLabelLocal = (backendStatus) => {
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

              // Health by Exhibit (stacked bar)
              const byExhibit = (() => {
                const exhibitMap = new globalThis.Map();
                const statuses = [
                  "Excellent",
                  "Good",
                  "Fair",
                  "Needs Attention",
                ];

                filteredAnimals.forEach((a) => {
                  const id = a.Enclosure_ID;
                  if (!exhibitMap.has(id)) {
                    exhibitMap.set(id, {
                      enclosureId: id,
                      enclosureName: null,
                    });
                  }
                });

                for (const [id, entry] of exhibitMap.entries()) {
                  const enc = allEnclosures.find((e) => e.Enclosure_ID === id);
                  entry.enclosureName =
                    enc?.Enclosure_Name || `Enclosure ${id}`;
                  statuses.forEach((s) => (entry[s] = 0));
                }

                filteredAnimals.forEach((a) => {
                  const id = a.Enclosure_ID;
                  const entry = exhibitMap.get(id);
                  if (!entry) return;
                  const status = a.Health_Status || "Fair";
                  if (statuses.includes(status))
                    entry[status] = (entry[status] || 0) + 1;
                  else entry.Fair = (entry.Fair || 0) + 1;
                });

                return Array.from(exhibitMap.values()).filter((e) =>
                  statuses.some((s) => e[s] > 0)
                );
              })();

              // Pagination for animal table
              const animalTotalPages = Math.max(
                1,
                Math.ceil(
                  sortedAnimals.filter((a) => {
                    const searchLower = animalSearch.toLowerCase();
                    return (
                      a.Animal_Name?.toLowerCase().includes(searchLower) ||
                      a.Species?.toLowerCase().includes(searchLower) ||
                      String(a.Animal_ID).includes(searchLower)
                    );
                  }).length / animalItemsPerPage
                )
              );

              const displayedAnimals = sortedAnimals
                .filter((a) => {
                  const searchLower = animalSearch.toLowerCase();
                  return (
                    a.Animal_Name?.toLowerCase().includes(searchLower) ||
                    a.Species?.toLowerCase().includes(searchLower) ||
                    String(a.Animal_ID).includes(searchLower)
                  );
                })
                .slice(
                  (animalCurrentPage - 1) * animalItemsPerPage,
                  animalCurrentPage * animalItemsPerPage
                );

              const animalPaginationArray = Array.from(
                { length: animalTotalPages },
                (_, i) => i + 1
              );

              return (
                <div className="mt-6 space-y-6">
                  {/* Summary Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                  <section id="animal-details" className="mt-6">
                    <>
                      <div
                        id="animals-section"
                        className="flex items-center justify-between mb-2"
                      >
                        <h3 className="text-lg font-semibold">
                          Animal Details
                        </h3>
                        <div className="flex items-center gap-3">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Settings className="h-4 w-4 mr-2" />
                                Columns
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
                                      id="animal-col-all"
                                      checked={Object.values(
                                        animalVisibleColumns
                                      ).every((v) => v)}
                                      onCheckedChange={() =>
                                        toggleAnimalColumn("all")
                                      }
                                    />
                                    <label
                                      htmlFor="animal-col-all"
                                      className="text-sm font-medium cursor-pointer"
                                    >
                                      All
                                    </label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="animal-col-animalId"
                                      checked={animalVisibleColumns.animalId}
                                      onCheckedChange={() =>
                                        toggleAnimalColumn("animalId")
                                      }
                                    />
                                    <label
                                      htmlFor="animal-col-animalId"
                                      className="text-sm cursor-pointer"
                                    >
                                      Animal ID
                                    </label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="animal-col-name"
                                      checked={animalVisibleColumns.name}
                                      onCheckedChange={() =>
                                        toggleAnimalColumn("name")
                                      }
                                    />
                                    <label
                                      htmlFor="animal-col-name"
                                      className="text-sm cursor-pointer"
                                    >
                                      Name
                                    </label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="animal-col-species"
                                      checked={animalVisibleColumns.species}
                                      onCheckedChange={() =>
                                        toggleAnimalColumn("species")
                                      }
                                    />
                                    <label
                                      htmlFor="animal-col-species"
                                      className="text-sm cursor-pointer"
                                    >
                                      Species
                                    </label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="animal-col-age"
                                      checked={animalVisibleColumns.age}
                                      onCheckedChange={() =>
                                        toggleAnimalColumn("age")
                                      }
                                    />
                                    <label
                                      htmlFor="animal-col-age"
                                      className="text-sm cursor-pointer"
                                    >
                                      Age
                                    </label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="animal-col-weight"
                                      checked={animalVisibleColumns.weight}
                                      onCheckedChange={() =>
                                        toggleAnimalColumn("weight")
                                      }
                                    />
                                    <label
                                      htmlFor="animal-col-weight"
                                      className="text-sm cursor-pointer"
                                    >
                                      Weight
                                    </label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="animal-col-gender"
                                      checked={animalVisibleColumns.gender}
                                      onCheckedChange={() =>
                                        toggleAnimalColumn("gender")
                                      }
                                    />
                                    <label
                                      htmlFor="animal-col-gender"
                                      className="text-sm cursor-pointer"
                                    >
                                      Gender
                                    </label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="animal-col-enclosure"
                                      checked={animalVisibleColumns.enclosure}
                                      onCheckedChange={() =>
                                        toggleAnimalColumn("enclosure")
                                      }
                                    />
                                    <label
                                      htmlFor="animal-col-enclosure"
                                      className="text-sm cursor-pointer"
                                    >
                                      Enclosure
                                    </label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id="animal-col-healthStatus"
                                      checked={
                                        animalVisibleColumns.healthStatus
                                      }
                                      onCheckedChange={() =>
                                        toggleAnimalColumn("healthStatus")
                                      }
                                    />
                                    <label
                                      htmlFor="animal-col-healthStatus"
                                      className="text-sm cursor-pointer"
                                    >
                                      Health Status
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>

                          <div className="relative w-80">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search by name or species..."
                              value={animalSearch}
                              onChange={(e) => setAnimalSearch(e.target.value)}
                              className="pl-10"
                              style={{ background: "white" }}
                            />
                          </div>
                        </div>
                      </div>
                      <Card id="animals">
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
                                id="animal-table"
                                className="min-w-[900px] table-auto"
                                style={{
                                  minWidth: "900px",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <TableHeader className="bg-gray-100">
                                  <TableRow>
                                    {animalVisibleColumns.animalId && (
                                      <TableHead
                                        className="w-[80px] cursor-pointer select-none hover:bg-gray-50"
                                        onClick={() =>
                                          toggleAnimalSort("Animal_ID")
                                        }
                                      >
                                        ID
                                        {animalSortState.col ===
                                          "Animal_ID" && (
                                          <span className="ml-1 text-xs">
                                            {animalSortState.dir === "asc"
                                              ? "▲"
                                              : "▼"}
                                          </span>
                                        )}
                                      </TableHead>
                                    )}
                                    {animalVisibleColumns.name && (
                                      <TableHead
                                        className="cursor-pointer select-none hover:bg-gray-50"
                                        onClick={() =>
                                          toggleAnimalSort("Animal_Name")
                                        }
                                      >
                                        Name
                                        {animalSortState.col ===
                                          "Animal_Name" && (
                                          <span className="ml-1 text-xs">
                                            {animalSortState.dir === "asc"
                                              ? "▲"
                                              : "▼"}
                                          </span>
                                        )}
                                      </TableHead>
                                    )}
                                    {animalVisibleColumns.species && (
                                      <TableHead
                                        className="cursor-pointer select-none hover:bg-gray-50"
                                        onClick={() =>
                                          toggleAnimalSort("Species")
                                        }
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
                                    )}
                                    {animalVisibleColumns.gender && (
                                      <TableHead
                                        className="cursor-pointer select-none hover:bg-gray-50"
                                        onClick={() =>
                                          toggleAnimalSort("Gender")
                                        }
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
                                    )}
                                    {animalVisibleColumns.age && (
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
                                    )}
                                    {animalVisibleColumns.weight && (
                                      <TableHead
                                        className="cursor-pointer select-none hover:bg-gray-50 text-center"
                                        onClick={() =>
                                          toggleAnimalSort("Weight")
                                        }
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
                                    )}
                                    {animalVisibleColumns.healthStatus && (
                                      <TableHead
                                        className="cursor-pointer select-none hover:bg-gray-50"
                                        onClick={() =>
                                          toggleAnimalSort("Health_Status")
                                        }
                                      >
                                        Health Status
                                        {animalSortState.col ===
                                          "Health_Status" && (
                                          <span className="ml-1 text-xs">
                                            {animalSortState.dir === "asc"
                                              ? "▲"
                                              : "▼"}
                                          </span>
                                        )}
                                      </TableHead>
                                    )}
                                    {animalVisibleColumns.enclosure && (
                                      <TableHead
                                        className="cursor-pointer select-none hover:bg-gray-50"
                                        onClick={() =>
                                          toggleAnimalSort("Enclosure_Name")
                                        }
                                      >
                                        Enclosure
                                        {animalSortState.col ===
                                          "Enclosure_Name" && (
                                          <span className="ml-1 text-xs">
                                            {animalSortState.dir === "asc"
                                              ? "▲"
                                              : "▼"}
                                          </span>
                                        )}
                                      </TableHead>
                                    )}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {displayedAnimals.length === 0 ? (
                                    <TableRow>
                                      <TableCell
                                        colSpan={
                                          Object.values(
                                            animalVisibleColumns
                                          ).filter(Boolean).length + 1
                                        }
                                        className="text-center py-8 text-gray-500"
                                      >
                                        No animals found for the current page
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    displayedAnimals.map((animal) => (
                                      <TableRow key={animal.Animal_ID}>
                                        {animalVisibleColumns.animalId && (
                                          <TableCell className="font-medium">
                                            #{animal.Animal_ID}
                                          </TableCell>
                                        )}
                                        {animalVisibleColumns.name && (
                                          <TableCell>
                                            {animal.Animal_Name}
                                          </TableCell>
                                        )}
                                        {animalVisibleColumns.species && (
                                          <TableCell>
                                            {animal.Species}
                                          </TableCell>
                                        )}
                                        {animalVisibleColumns.gender && (
                                          <TableCell>{animal.Gender}</TableCell>
                                        )}
                                        {animalVisibleColumns.age && (
                                          <TableCell>
                                            {calculateAge(animal.Birthday)}
                                          </TableCell>
                                        )}
                                        {animalVisibleColumns.weight && (
                                          <TableCell className="whitespace-nowrap text-center">
                                            {typeof animal.Weight !==
                                              "undefined" &&
                                            animal.Weight !== null &&
                                            isFinite(Number(animal.Weight))
                                              ? Number(animal.Weight).toFixed(2)
                                              : "—"}
                                          </TableCell>
                                        )}
                                        {animalVisibleColumns.healthStatus && (
                                          <TableCell>
                                            <Badge
                                              variant="outline"
                                              className={
                                                animal.Health_Status === "Good"
                                                  ? "bg-green-50 text-green-700 border-green-200"
                                                  : ""
                                              }
                                              style={
                                                animal.Health_Status ===
                                                "Excellent"
                                                  ? {
                                                      backgroundColor:
                                                        "#ECFEFF",
                                                      color: "#0E7490",
                                                      border:
                                                        "1px solid #A5F3FC",
                                                    }
                                                  : animal.Health_Status ===
                                                    "Fair"
                                                  ? {
                                                      backgroundColor:
                                                        "#FEFCE8",
                                                      color: "#ad7f49ff",
                                                      border:
                                                        "1px solid #FEF08A",
                                                    }
                                                  : animal.Health_Status ===
                                                    "Needs Attention"
                                                  ? {
                                                      backgroundColor:
                                                        "#FEF2F2",
                                                      color: "#B91C1C",
                                                      border:
                                                        "1px solid #FECACA",
                                                    }
                                                  : {}
                                              }
                                            >
                                              {backendToDisplayLabelLocal(
                                                animal.Health_Status
                                              )}
                                            </Badge>
                                          </TableCell>
                                        )}
                                        {animalVisibleColumns.enclosure && (
                                          <TableCell>
                                            {enclosureMap[animal.Enclosure_ID]
                                              ?.Enclosure_Name || "Unknown"}
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
                              {sortedAnimals.length > 0
                                ? (animalCurrentPage - 1) * animalItemsPerPage +
                                  1
                                : 0}
                              -
                              {Math.min(
                                animalCurrentPage * animalItemsPerPage,
                                sortedAnimals.filter((a) => {
                                  const searchLower =
                                    animalSearch.toLowerCase();
                                  return (
                                    a.Animal_Name?.toLowerCase().includes(
                                      searchLower
                                    ) ||
                                    a.Species?.toLowerCase().includes(
                                      searchLower
                                    ) ||
                                    String(a.Animal_ID).includes(searchLower)
                                  );
                                }).length
                              )}{" "}
                              of{" "}
                              {
                                sortedAnimals.filter((a) => {
                                  const searchLower =
                                    animalSearch.toLowerCase();
                                  return (
                                    a.Animal_Name?.toLowerCase().includes(
                                      searchLower
                                    ) ||
                                    a.Species?.toLowerCase().includes(
                                      searchLower
                                    ) ||
                                    String(a.Animal_ID).includes(searchLower)
                                  );
                                }).length
                              }{" "}
                              animal
                              {sortedAnimals.filter((a) => {
                                const searchLower = animalSearch.toLowerCase();
                                return (
                                  a.Animal_Name?.toLowerCase().includes(
                                    searchLower
                                  ) ||
                                  a.Species?.toLowerCase().includes(
                                    searchLower
                                  ) ||
                                  String(a.Animal_ID).includes(searchLower)
                                );
                              }).length !== 1
                                ? "s"
                                : ""}
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
                    </>
                  </section>
                  {sortedAnimals.length === 0 ? (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center py-12">
                          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-700">
                          Visual Analysis
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Health Status Distribution - Pie Chart */}
                        <Card>
                          <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50">
                            <CardTitle className="flex items-center gap-2">
                              <Heart className="h-5 w-5 text-green-600" />
                              Health Status Distribution
                            </CardTitle>
                            <CardDescription>
                              Overview of animal health by status
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-6">
                            <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
                                <Pie
                                  data={healthStatusData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={{
                                    stroke: "#6b7280",
                                    strokeWidth: 1,
                                  }}
                                  label={({ name, percent }) => {
                                    if (!percent || percent === 0) return null;
                                    return `${name} — ${(percent * 100).toFixed(
                                      0
                                    )}%`;
                                  }}
                                  outerRadius={100}
                                  innerRadius={45}
                                  fill="#8884d8"
                                  dataKey="value"
                                  paddingAngle={2}
                                >
                                  {healthStatusData.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={entry.fill}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "#ffffff",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "0.5rem",
                                  }}
                                  formatter={(value) => [`${value}`, "Count"]}
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

                        {/* Health by Exhibit */}
                        {byExhibit.length > 0 && (
                          <Card>
                            <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50">
                              <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-green-600" />
                                Health by Exhibit
                              </CardTitle>
                              <CardDescription>
                                Health counts grouped by exhibit
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                              <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                  data={byExhibit}
                                  margin={{ left: 0, right: 8 }}
                                >
                                  <defs>
                                    <linearGradient
                                      id="excellentGradient"
                                      x1="0"
                                      y1="0"
                                      x2="0"
                                      y2="1"
                                    >
                                      <stop
                                        offset="5%"
                                        stopColor={healthColors.Excellent}
                                        stopOpacity={0.85}
                                      />
                                      <stop
                                        offset="95%"
                                        stopColor={healthColors.Excellent}
                                        stopOpacity={0.35}
                                      />
                                    </linearGradient>
                                    <linearGradient
                                      id="goodGradient"
                                      x1="0"
                                      y1="0"
                                      x2="0"
                                      y2="1"
                                    >
                                      <stop
                                        offset="5%"
                                        stopColor={healthColors.Good}
                                        stopOpacity={0.85}
                                      />
                                      <stop
                                        offset="95%"
                                        stopColor={healthColors.Good}
                                        stopOpacity={0.35}
                                      />
                                    </linearGradient>
                                    <linearGradient
                                      id="fairGradient"
                                      x1="0"
                                      y1="0"
                                      x2="0"
                                      y2="1"
                                    >
                                      <stop
                                        offset="5%"
                                        stopColor={healthColors.Fair}
                                        stopOpacity={0.85}
                                      />
                                      <stop
                                        offset="95%"
                                        stopColor={healthColors.Fair}
                                        stopOpacity={0.35}
                                      />
                                    </linearGradient>
                                    <linearGradient
                                      id="criticalGradient"
                                      x1="0"
                                      y1="0"
                                      x2="0"
                                      y2="1"
                                    >
                                      <stop
                                        offset="5%"
                                        stopColor={
                                          healthColors["Needs Attention"]
                                        }
                                        stopOpacity={0.85}
                                      />
                                      <stop
                                        offset="95%"
                                        stopColor={
                                          healthColors["Needs Attention"]
                                        }
                                        stopOpacity={0.35}
                                      />
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#e5e7eb"
                                  />
                                  <XAxis
                                    dataKey="enclosureName"
                                    interval={0}
                                    height={80}
                                    stroke="#6b7280"
                                    style={{ fontSize: "0.875rem" }}
                                    tick={({ x, y, payload }) => {
                                      const label = String(
                                        payload?.value || ""
                                      );
                                      const rotate = byExhibit.length > 4;

                                      if (!rotate) {
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

                                      const maxChars = 18;
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
                                  <YAxis
                                    allowDecimals={false}
                                    stroke="#6b7280"
                                    style={{ fontSize: "0.875rem" }}
                                  />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: "#ffffff",
                                      border: "1px solid #e5e7eb",
                                      borderRadius: "0.5rem",
                                    }}
                                  />
                                  <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: "0.875rem" }}
                                  />
                                  <Bar
                                    dataKey="Excellent"
                                    stackId="a"
                                    fill="url(#excellentGradient)"
                                  />
                                  <Bar
                                    dataKey="Good"
                                    stackId="a"
                                    fill="url(#goodGradient)"
                                  />
                                  <Bar
                                    dataKey="Fair"
                                    stackId="a"
                                    fill="url(#fairGradient)"
                                  />
                                  <Bar
                                    dataKey="Needs Attention"
                                    name="Critical"
                                    stackId="a"
                                    fill="url(#criticalGradient)"
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Animal Detail Popup */}
      <Dialog open={animalDetailOpen} onOpenChange={setAnimalDetailOpen}>
        <DialogContent className="mx-auto w-full max-w-[600px] rounded-lg shadow-lg">
          <DialogHeader>
            <div className="flex items-start gap-4">
              <div className="w-28 h-28 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                <ImageWithFallback
                  src={selectedAnimal?.Image_URL || ""}
                  alt={selectedAnimal?.Animal_Name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-2xl truncate">
                  {selectedAnimal?.Animal_Name}
                </DialogTitle>
                <DialogDescription className="text-base mt-1 text-gray-600 truncate">
                  {selectedAnimal?.Species}
                </DialogDescription>
              </div>
              <div className="self-start">
                <Badge
                  className={`${getHealthBadgeColor(
                    selectedAnimal?.Backend_Health_Status ||
                      uiToBackendHealth(selectedAnimal?.Health_Status || "")
                  )} px-3 py-1 rounded-full`}
                >
                  {backendToDisplayLabel(
                    selectedAnimal?.Backend_Health_Status ||
                      uiToBackendHealth(selectedAnimal?.Health_Status || "")
                  )}
                </Badge>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Age</p>
                <p className="text-xl">{selectedAnimal?.Age} years</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Weight</p>
                <p className="text-xl">{selectedAnimal?.Weight} lbs</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Gender</p>
                <p className="text-xl">
                  {selectedAnimal?.Gender === "M" ? "Male" : "Female"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Zone</p>
                <p className="text-xl">{selectedAnimal?.Zone}</p>
              </div>
            </div>

            {/* Habitat */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">Habitat</p>
                <p className="text-right">{selectedAnimal?.Enclosure_Name}</p>
              </div>

              {/* Vaccinated Status */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Vaccinated</p>
                {selectedAnimal?.Vaccinated ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                )}
              </div>
            </div>

            {/* Last checkup removed from dialog */}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                onClick={() =>
                  selectedAnimal && handleUpdateHealth(selectedAnimal)
                }
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-md font-semibold bg-white text-green-800 border border-green-200 hover:bg-green-50"
              >
                <Activity className="h-4 w-4 text-green-700" />
                Update Health
              </Button>
              <Button
                onClick={() =>
                  selectedAnimal && handleApplyVaccination(selectedAnimal)
                }
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md font-semibold bg-white text-teal-700 border border-teal-300 ${
                  selectedAnimal?.Vaccinated
                    ? "cursor-default opacity-60"
                    : "hover:bg-teal-50 shadow-sm"
                }`}
                disabled={selectedAnimal?.Vaccinated}
              >
                <Syringe className="h-4 w-4 text-teal-700" />
                Vaccinate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Health Status Dialog */}
      <Dialog open={healthDialogOpen} onOpenChange={setHealthDialogOpen}>
        <DialogContent className="mx-auto w-full max-w-[500px] rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle>Update Health Status</DialogTitle>
            <DialogDescription>
              Modify the health status for {selectedAnimal?.Animal_Name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Animal Info */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-800">
                <strong>Animal:</strong> {selectedAnimal?.Animal_Name} (
                {selectedAnimal?.Species})
              </p>
              <p className="text-sm text-gray-800">
                <strong>Current Status:</strong> {selectedAnimal?.Health_Status}
              </p>
              <p className="text-sm text-gray-800">
                <strong>Location:</strong> {selectedAnimal?.Enclosure_Name},
                Zone {selectedAnimal?.Zone}
              </p>
            </div>

            {/* Health Status Selection */}
            <div className="space-y-2">
              <Label>New Health Status</Label>
              <Select
                value={selectedHealthStatus}
                onValueChange={setSelectedHealthStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select health status" />
                </SelectTrigger>
                <SelectContent>
                  {/* Use backend enum values to match the database. Disable the current status so it's not clickable. */}
                  {BACKEND_HEALTH_STATUSES.map((status) => {
                    const isCurrent =
                      (selectedAnimal &&
                        (selectedAnimal.Backend_Health_Status ||
                          uiToBackendHealth(selectedAnimal.Health_Status))) ===
                      status;
                    return (
                      <SelectItem
                        key={status}
                        value={status}
                        disabled={isCurrent}
                      >
                        {backendToDisplayLabel(status)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Veterinarian selection (required) */}
            <div className="space-y-2">
              <Label>Performed By *</Label>
              <Select
                value={selectedVetId ? String(selectedVetId) : ""}
                onValueChange={(val) =>
                  setSelectedVetId(val ? Number(val) : null)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select veterinarian" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-auto">
                  {(sortedVets || []).map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      <span className="font-mono mr-2">#{v.id}</span>
                      <span>
                        {v.lastName ? `${v.lastName}, ${v.firstName}` : v.name}
                        {v.title ? ` — ${v.title}` : ""}
                      </span>
                    </SelectItem>
                  ))}
                  {(vets || []).length === 0 && (
                    <div className="p-3 text-sm text-gray-500">
                      No veterinarians found
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Enter any observations or treatment notes..."
                value={healthNotes}
                onChange={(e) => setHealthNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={confirmHealthUpdate}
              className="bg-green-600 hover:bg-green-700 cursor-pointer"
              disabled={
                !selectedHealthStatus ||
                !selectedVetId ||
                (selectedAnimal &&
                  (selectedAnimal.Backend_Health_Status ||
                    uiToBackendHealth(selectedAnimal.Health_Status)) ===
                    selectedHealthStatus)
              }
            >
              <Activity className="h-4 w-4 mr-2" />
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply Vaccination Dialog */}
      <Dialog
        open={vaccinationDialogOpen}
        onOpenChange={setVaccinationDialogOpen}
      >
        <DialogContent className="mx-auto w-full max-w-[500px] rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle>Apply Vaccination</DialogTitle>
            <DialogDescription>
              Administer a vaccine to {selectedAnimal?.Animal_Name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Animal Info */}
            <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
              <p className="text-sm text-teal-800">
                <strong>Animal:</strong> {selectedAnimal?.Animal_Name} (
                {selectedAnimal?.Species})
              </p>
              <p className="text-sm text-teal-800">
                <strong>Age:</strong> {selectedAnimal?.Age} years |{" "}
                <strong>Weight:</strong> {selectedAnimal?.Weight} lbs
              </p>
              {selectedAnimal?.Last_Vaccination && (
                <p className="text-sm text-teal-800">
                  <strong>Last Vaccination:</strong>{" "}
                  {new Date(
                    selectedAnimal.Last_Vaccination
                  ).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Administering Veterinarian (search + select) */}
            <div className="space-y-2">
              <Label>Administered By *</Label>
              <Select
                value={selectedVetId ? String(selectedVetId) : ""}
                onValueChange={(val) =>
                  setSelectedVetId(val ? Number(val) : null)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select veterinarian" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-auto">
                  {(sortedVets || []).map((v) => (
                    <SelectItem key={v.id} value={String(v.id)}>
                      <span className="font-mono mr-2">#{v.id}</span>
                      <span>
                        {v.lastName ? `${v.lastName}, ${v.firstName}` : v.name}
                        {v.title ? ` — ${v.title}` : ""}
                      </span>
                    </SelectItem>
                  ))}
                  {(vets || []).length === 0 && (
                    <div className="p-3 text-sm text-gray-500">
                      No veterinarians found
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            {/* Notes (optional) */}
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Enter any notes about the vaccine, dosage, or observations..."
                value={vaccinationNotes}
                onChange={(e) => setVaccinationNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={openVaccinationConfirmation}
              className="bg-teal-600 hover:bg-teal-700 cursor-pointer"
              disabled={!selectedVetId}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vaccination Confirmation Alert Dialog */}
      <AlertDialog
        open={confirmVaccinationOpen}
        onOpenChange={setConfirmVaccinationOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Syringe className="h-5 w-5 text-teal-600" />
              Confirm Vaccination
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p>
                You are about to administer a vaccination to{" "}
                <strong>{selectedAnimal?.Animal_Name}</strong>
                {selectedVetId ? (
                  <span>
                    {" "}
                    by{" "}
                    <strong>
                      {(vets.find((v) => v.id === selectedVetId) || {}).name}
                    </strong>
                  </span>
                ) : null}
                .
              </p>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Please verify:</strong>
                </p>
                <ul className="text-sm text-yellow-800 list-disc list-inside mt-2 space-y-1">
                  <li>Correct animal identification</li>
                  <li>Appropriate vaccine dosage</li>
                  <li>No contraindications present</li>
                  <li>Proper storage and handling</li>
                </ul>
              </div>
              <p className="text-sm">
                This action will be recorded in the medical log and update the
                animal's vaccination status.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmVaccination}
              className="bg-teal-600 hover:bg-teal-700 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirm & Administer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Animals Needing Attention Dialog */}
      <Dialog open={attentionListOpen} onOpenChange={setAttentionListOpen}>
        <DialogContent className="mx-auto w-full max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-6 w-6" />
              Animals Requiring Immediate Attention
            </DialogTitle>
            <DialogDescription>
              {stats.needsAttention} animal
              {stats.needsAttention > 1 ? "s are" : " is"} currently in need of
              medical care
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[500px] pr-4">
            <div className="space-y-3">
              {animalsNeedingAttention.map((animal) => (
                <div
                  key={animal.Animal_ID}
                  className="p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Animal Image */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      <ImageWithFallback
                        src={animal.Image_URL || ""}
                        alt={animal.Animal_Name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Animal Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h4 className="font-medium text-lg">
                            {animal.Animal_Name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {animal.Species}
                          </p>
                        </div>
                        <Badge
                          className={getHealthBadgeColor(
                            animal.Backend_Health_Status ||
                              uiToBackendHealth(animal.Health_Status)
                          )}
                        >
                          {backendToDisplayLabel(
                            animal.Backend_Health_Status ||
                              uiToBackendHealth(animal.Health_Status)
                          )}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Zone:</span>{" "}
                          {animal.Zone}
                        </div>
                        <div>
                          <span className="text-gray-600">Enclosure:</span>{" "}
                          {animal.Enclosure_Name}
                        </div>
                        <div>
                          <span className="text-gray-600">Age:</span>{" "}
                          {animal.Age} years
                        </div>
                        <div>
                          <span className="text-gray-600">Gender:</span>{" "}
                          {animal.Gender === "M" ? "Male" : "Female"}
                        </div>
                      </div>

                      {/* Last checkup removed from card */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Close button intentionally removed — use the header X to dismiss */}
        </DialogContent>
      </Dialog>
    </div>
  );
}
