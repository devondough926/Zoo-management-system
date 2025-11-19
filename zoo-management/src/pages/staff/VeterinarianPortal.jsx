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

  const toggleFlip = (id) => {
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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
          if (
            !lastVaccinationByAnimal[log.Animal_ID] ||
            new Date(ts) > new Date(lastVaccinationByAnimal[log.Animal_ID])
          ) {
            lastVaccinationByAnimal[log.Animal_ID] = ts;
          }
          const nextDue = new Date(
            new Date(ts).getTime() + 365 * 86400000
          ).toISOString();
          return {
            Vaccine_ID: `VACC-${log.Log_ID}`,
            Animal_ID: log.Animal_ID,
            Animal_Name: log.Animal_Name,
            Vaccine_Type:
              log.Activity.replace(/^Vaccination:\s*/i, "") || "Vaccination",
            Date_Administered: ts,
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
        if (
          !lastCheckupByAnimal[log.Animal_ID] ||
          new Date(ts) > new Date(lastCheckupByAnimal[log.Animal_ID])
        ) {
          lastCheckupByAnimal[log.Animal_ID] = ts;
        }
      });
      visits.forEach((v /** @type {any} */) => {
        if (v.Diagnosis) {
          const ts = v.Visit_Date;
          if (
            !lastCheckupByAnimal[v.Animal_ID] ||
            new Date(ts) > new Date(lastCheckupByAnimal[v.Animal_ID])
          ) {
            lastCheckupByAnimal[v.Animal_ID] = ts;
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

      // Add entries from medical/animal care logs.
      medicalLogs.forEach((log /** @type {any} */) => {
        const activity = (log.Activity || "").toString();
        const logTypeRaw = (log.Log_Type || log.LogType || "").toString();

        // Prefer the backend Log_Type if provided — normalize to our UI types.
        let type = "care"; // default fallback
        const lt = logTypeRaw.toLowerCase();
        if (lt) {
          if (lt === "medical") type = "medical";
          else if (lt === "fed" || lt === "fed" || lt === "feeding")
            type = "feeding";
          else if (lt === "vaccinated" || lt === "vaccination")
            type = "vaccination";
          else if (lt === "maintenance") type = "maintenance";
          else if (lt === "update" || lt === "new") {
            type = "care";
          }
        }

        // If backend Log_Type is absent or ambiguous, fall back to keyword heuristics
        if (!lt) {
          if (/vaccin/i.test(activity)) {
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

        medicalLogLocal.push({
          id: `MED-${log.Log_ID}`,
          type,
          timestamp: log.Log_Date,
          animal_name: log.Animal_Name,
          details: activity || "Care note",
          Notes: log.Notes || log.Notes || undefined,
          veterinarian_name: log.First_Name
            ? `${log.First_Name} ${log.Last_Name || ""}`.trim()
            : "Vet Staff",
          health_status: undefined,
        });
      });

      // Add entries from vet visit records
      visits.forEach((v /** @type {any} */) => {
        let type = "treatment";
        if (v.Diagnosis && /checkup|exam|routine/i.test(v.Diagnosis))
          type = "checkup";
        else if (v.Diagnosis && /status|update/i.test(v.Diagnosis))
          type = "health_update";
        medicalLogLocal.push({
          id: `VISIT-${v.Visit_ID}`,
          type,
          timestamp: v.Visit_Date,
          animal_name: v.Animal_Name,
          details: v.Diagnosis || v.Treatment || "Vet visit",
          Notes: v.Notes || v.Treatment || undefined,
          veterinarian_name: v.First_Name
            ? `${v.First_Name} ${v.Last_Name || ""}`.trim()
            : "Vet Staff",
          health_status: undefined,
        });
      });

      // Add vaccination logs to medical log as well
      vaccinationLogs.forEach((log /** @type {any} */) => {
        medicalLogLocal.push({
          id: `VACCLOG-${log.Log_ID}`,
          type: "vaccination",
          timestamp: log.Log_Date,
          animal_name: log.Animal_Name,
          details: log.Activity || "Vaccination",
          Notes: log.Notes || undefined,
          veterinarian_name: log.First_Name
            ? `${log.First_Name} ${log.Last_Name || ""}`.trim()
            : "Vet Staff",
          health_status: undefined,
        });
      });

      medicalLogLocal.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setHealthRecords(enrichedRecords);
      setVaccinationRecords(vaccinationRecordsLocal);
      setMedicalLog(medicalLogLocal);

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
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    loadData();
    return () => {
      isMountedRef.current = false;
    };
  }, [user.Employee_ID, user.Last_Name]);

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
        return "bg-green-100 text-green-800";
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

  // Today's medical logs memoized and responsive container height
  const todaysMedicalLogs = useMemo(() => {
    try {
      return (medicalLog || []).filter(
        (log) =>
          log &&
          log.timestamp &&
          isSameLocalDay(log.timestamp, new Date()) &&
          log.type === "medical"
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
      case "Good":
        return "bg-green-100 text-green-800 border-green-200";
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
          case "Good":
            return "bg-green-100 text-green-800 border-green-200";
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

  const confirmHealthUpdate = async () => {
    if (!selectedAnimal || !selectedHealthStatus) return;
    if (!selectedVetId) {
      toast.error("Please select the veterinarian who performed the update");
      return;
    }
    try {
      const backendStatus = uiToBackendHealth(selectedHealthStatus);
      await veterinarianAPI.updateAnimalHealthInfo(selectedAnimal.Animal_ID, {
        healthStatus: backendStatus,
      });
      await veterinarianAPI.createVetVisit({
        animalId: selectedAnimal.Animal_ID,
        employeeId: selectedVetId,
        diagnosis: `Health status update: ${selectedHealthStatus}`,
        treatment: healthNotes || null,
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

      setMedicalLog((prev) => [
        {
          id: `LOCAL-${Date.now()}`,
          type: "health_update",
          timestamp: new Date().toISOString(),
          animal_name: selectedAnimal.Animal_Name,
          details:
            healthNotes || `Health status updated to ${selectedHealthStatus}`,
          veterinarian_name: vetName,
          health_status: selectedHealthStatus,
        },
        ...prev,
      ]);
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

  const enclosureMap = useMemo(() => {
    const map = {};
    allEnclosures.forEach((enc) => {
      map[enc.Enclosure_ID] = enc;
    });
    return map;
  }, [allEnclosures]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

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

      // Prefer the backend-returned Log_Date (formatted as 'YYYY-MM-DD HH:mm:ss').
      // Convert it to an ISO string for consistent client-side usage. If the
      // backend doesn't return it for some reason, fall back to our local now.
      const savedLogDateRaw = response?.log?.Log_Date;
      const savedLogDate = savedLogDateRaw
        ? new Date(savedLogDateRaw).toISOString()
        : now.toISOString();
      F;

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
          onValueChange={setActiveTab}
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
              Analytics
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
                            <Badge
                              className={`${getHealthBadgeColor(
                                record.Backend_Health_Status ||
                                  uiToBackendHealth(record.Health_Status)
                              )} w-full justify-center`}
                            >
                              {backendToDisplayLabel(
                                record.Backend_Health_Status ||
                                  uiToBackendHealth(record.Health_Status)
                              )}
                            </Badge>
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
                              <Badge
                                className={`${getHealthBadgeColor(
                                  record.Backend_Health_Status ||
                                    uiToBackendHealth(record.Health_Status)
                                )} px-3 py-1 rounded-full`}
                              >
                                {backendToDisplayLabel(
                                  record.Backend_Health_Status ||
                                    uiToBackendHealth(record.Health_Status)
                                )}
                              </Badge>
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
                          <Badge className="bg-green-100 text-green-800 border-green-200">
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
                  style={{
                    maxHeight: `${MEDICAL_LIST_MAX_HEIGHT}px`,
                  }}
                >
                  <div className="space-y-3">
                    {todaysMedicalLogs.map((log) => (
                      <div
                        key={log.id}
                        style={{
                          padding: "1rem",
                          borderRadius: "0.5rem",
                          background:
                            "linear-gradient(to right, #eff6ff, #ecfeff)",
                          transition: "all 0.2s ease",
                          border: "1px solid #e5e7eb",
                          boxShadow: "none",
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">{getLogTypeIcon(log.type)}</div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {log.animal_name}
                                </p>
                                <p className="text-sm text-gray-700">
                                  {log.details}
                                </p>
                                {log.Notes && (
                                  <p className="text-sm text-gray-700 mt-3 pt-2 border-t border-transparent">
                                    {log.Notes}
                                  </p>
                                )}
                              </div>
                              {/* datetime shown at far right */}
                              <div className="text-xs text-gray-500 whitespace-nowrap ml-4">
                                {new Date(log.timestamp).toLocaleString()}
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
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="report" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl text-gray-900 flex items-center gap-2">
                <Activity className="h-6 w-6 text-red-500" /> Health Analytics
              </h2>
            </div>

            <Card>
              <div className="flex items-center justify-between">
                {(healthZoneFilter !== "All" && healthZoneFilter !== "None") ||
                (healthEnclosureFilter !== "All" &&
                  healthEnclosureFilter !== "None") ||
                (genderFilter !== "All" && genderFilter !== "None") ||
                (ageFilter !== "All" && ageFilter !== "None") ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setHealthZoneFilter("None");
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
                    <h3 className="font-semibold text-gray-700"></h3>
                  </div>
                )}
              </div>
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
              const filteredAnimals = (() => {
                // If Zone is explicitly set to 'None' (No selection), do not show any animals
                if (healthZoneFilter === "None") {
                  return [];
                }

                return allAnimalsDB.filter((animal) => {
                  // Zone filter
                  if (
                    healthZoneFilter !== "All" &&
                    healthZoneFilter !== "None"
                  ) {
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
                    healthEnclosureFilter !== "None" &&
                    animal.Enclosure_ID !== healthEnclosureFilter
                  )
                    return false;

                  // Gender filter
                  if (
                    genderFilter !== "All" &&
                    genderFilter !== "None" &&
                    animal.Gender !== genderFilter
                  )
                    return false;

                  // Age filter
                  if (ageFilter !== "All" && ageFilter !== "None") {
                    const age = calculateAge(animal.Birthday);
                    if (ageFilter === "0-2" && (age < 0 || age > 2))
                      return false;
                    if (ageFilter === "3-5" && (age < 3 || age > 5))
                      return false;
                    if (ageFilter === "6-10" && (age < 6 || age > 10))
                      return false;
                    if (ageFilter === "11+" && age < 11) return false;
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
