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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
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
import { useData } from "../data/DataContext";
import { toast } from "sonner";
import { ZooLogo } from "../components/ZooLogo";
import { EditExhibitDialog } from "../components/ExhibitDialogs";
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
  const [isLoading, setIsLoading] = useState(true);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isManageZoneOpen, setIsManageZoneOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [deleteConfirmEmployee, setDeleteConfirmEmployee] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [revenueRange, setRevenueRange] = useState("all");
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

  // Health Status Report Filters
  const [healthZoneFilter, setHealthZoneFilter] = useState("All");
  const [healthEnclosureFilter, setHealthEnclosureFilter] = useState("All");
  const [genderFilter, setGenderFilter] = useState("All");
  const [ageFilter, setAgeFilter] = useState("All");

  // Animal Management Filters
  const [animalExhibitFilter, setAnimalExhibitFilter] = useState("All");

  const [salaries, setSalaries] = useState({
    2: 72000,
    3: 72000,
    4: 45000,
    5: 32000,
    6: 35000,
  });

  const [tempSalaries, setTempSalaries] = useState({ ...salaries });
  const [isPricingManagementOpen, setIsPricingManagementOpen] = useState(false);
  const [tempTicketPrices, setTempTicketPrices] = useState({ ...ticketPrices });
  const [tempMembershipPrice, setTempMembershipPrice] =
    useState(membershipPrice);

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
      const { startDate, endDate } = getDateRange(revenueRange);
      const revenue = await analyticsAPI.getRevenue(startDate, endDate);
      setRevenueData(revenue);
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

    let dateStr = dateString.replace("T", " ").split(" ")[0];
    const parts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!parts) return "Invalid Date";

    const [, year, month, day] = parts;
    return `${month}/${day}/${year}`;
  };

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
    if (animalExhibitFilter === "All") {
      return allAnimalsDB;
    }
    return allAnimalsDB.filter(
      (animal) => animal.Enclosure_ID === animalExhibitFilter
    );
  }, [allAnimalsDB, animalExhibitFilter]);

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

  const ticketRevenue = revenueData?.ticketRevenue || 0;
  const membershipRevenue = revenueData?.membershipRevenue || 0;
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

  const handlePricingDialogOpen = (open) => {
    if (open) {
      // Reset temp prices to current prices when opening
      setTempTicketPrices({ ...ticketPrices });
      setTempMembershipPrice(membershipPrice);
    }
    setIsPricingManagementOpen(open);
  };

  const handlePricingSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      // Update pricing in database
      await pricingAPI.updatePricing(tempTicketPrices, tempMembershipPrice);

      // Update actual pricing state using context
      updateTicketPrices(tempTicketPrices);
      updateMembershipPrice(tempMembershipPrice);

      setIsPricingManagementOpen(false);
      toast.success("Pricing updated successfully!");
    } catch (error) {
      console.error("Error updating pricing:", error);
      toast.error("Failed to update pricing");
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
        isVaccinated: formData.isVaccinated || false,
        enclosureId: parseInt(formData.enclosureId),
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

  const getRangeLabel = () => {
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
    }
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
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ZooLogo size={40} />
              <div>
                <h1 className="font-semibold text-xl">Admin Portal</h1>
                <p className="text-sm text-gray-600">
                  WildWood Zoo Management Dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium">Welcome, Administrator</p>
                <p className="text-sm text-gray-600">Full System Access</p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="border-teal-600 text-teal-600 cursor-pointer"
              >
                <Home className="h-4 w-4 mr-2" />
                View Public Site
              </Button>
              <Button
                variant="outline"
                onClick={onLogout}
                className="border-green-600 text-green-600 cursor-pointer"
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
      <div className="container mx-auto px-6 py-12 space-y-8">
        {/* Revenue Range Filter */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl flex items-center gap-2">
              <BarChart3 className="h-6 w-6" /> Overview Statistics
            </h2>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600 italic">
                Last Updated: {formatLastUpdated()}
              </span>
              <Calendar className="h-5 w-5 text-gray-600" />
              <Select
                value={revenueRange}
                onValueChange={(value) => setRevenueRange(value)}
              >
                <SelectTrigger className="w-[180px] cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Past Week</SelectItem>
                  <SelectItem value="month">Past Month</SelectItem>
                  <SelectItem value="year">Past Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
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
                    <p className="text-sm text-gray-600">Total Revenue</p>
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
                    <p className="text-sm text-gray-600">Total Animals</p>
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
                    <p className="text-sm text-gray-600">Total Staff</p>
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
                    <p className="text-sm text-gray-600">Active Memberships</p>
                    <p className="text-2xl font-semibold text-purple-600">
                      {formatNumber(activeMemb)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Revenue Breakdown */}
        <section id="revenue">
          <h2 className="text-2xl mb-6 flex items-center gap-2">
            <DollarSign className="h-6 w-6" /> Revenue Breakdown
          </h2>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* Ticket Sales */}
        <section id="tickets">
          <h2 className="text-2xl mb-6 flex items-center gap-2">
            <Ticket className="h-6 w-6" /> Ticket Sales
          </h2>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {ticketStats.map((stat) => (
                  <div
                    key={stat.type}
                    className="text-center p-4 bg-green-50 rounded-lg"
                  >
                    <p className="text-sm text-gray-600 mb-1">{stat.type}</p>
                    <p className="text-2xl font-semibold text-green-600">
                      {formatNumber(stat.sold)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Revenue Analytics Charts */}
        <section id="analytics">
          <h2 className="text-2xl mb-6 flex items-center gap-2">
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
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
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

        {/* Pricing Management */}
        <section id="pricing">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl flex items-center gap-2">
              <CreditCard className="h-6 w-6" /> Pricing Management
            </h2>
            <Button
              className="bg-purple-600 hover:bg-purple-700 cursor-pointer"
              onClick={() => handlePricingDialogOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Manage Prices
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
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
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border-2 border-green-300 hover:shadow-md transition-shadow"
                      >
                        <span className="text-gray-800 font-medium capitalize">
                          {type}
                        </span>
                        <span className="font-bold text-green-700 text-lg">
                          ${price.toFixed(2)}
                        </span>
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
                  <div className="p-6 bg-gradient-to-br from-purple-50 via-purple-100 to-pink-50 rounded-xl border-2 border-purple-300 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-800 font-semibold text-lg">
                        Annual Membership
                      </span>
                      <span className="font-bold text-purple-700 text-2xl">
                        ${membershipPrice.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 bg-white/50 p-2 rounded-lg">
                      Unlimited year-round access + benefits
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Management Dialog */}
          <Dialog
            open={isPricingManagementOpen}
            onOpenChange={handlePricingDialogOpen}
          >
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Manage Ticket & Membership Prices</DialogTitle>
                <DialogDescription>
                  Update pricing for tickets and memberships. Changes will be
                  reflected immediately.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Ticket Prices */}
                <div>
                  <h3 className="font-semibold text-lg mb-4 text-green-700">
                    Day Pass Ticket Prices
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(tempTicketPrices).map(([type, price]) => (
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
                    ))}
                  </div>
                </div>

                {/* Membership Price */}
                <div>
                  <h3 className="font-semibold text-lg mb-4 text-purple-700">
                    Annual Membership Price
                  </h3>
                  <div className="space-y-2 max-w-sm">
                    <Label htmlFor="membership-price" className="text-gray-700">
                      Annual Membership
                    </Label>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">$</span>
                      <Input
                        id="membership-price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={tempMembershipPrice}
                        onChange={(e) =>
                          setTempMembershipPrice(
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="flex-1"
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      Unlimited year-round access + member benefits
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  onClick={handlePricingSave}
                  className="bg-green-600 hover:bg-green-700 cursor-pointer"
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </section>

        {/* Zone Overview */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl flex items-center gap-2">
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
                      className="p-4 bg-teal-50 rounded-lg border border-teal-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">
                          Zone {location.Zone}
                        </h3>
                        <Badge className="bg-teal-600">{location.Zone}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {location.Location_Description}
                      </p>
                      <p className="text-sm mb-1">
                        <span className="font-medium">Supervisor:</span>{" "}
                        {supervisor
                          ? `${supervisor.First_Name} ${supervisor.Last_Name}`
                          : "Unassigned"}
                      </p>
                      <p className="text-sm mb-3">
                        <span className="font-medium">Employees:</span>{" "}
                        {zoneEmployees.length}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-teal-600 text-teal-600 hover:bg-teal-50 cursor-pointer"
                          onClick={() => setViewZoneEmployees(location)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-purple-600 text-purple-600 hover:bg-purple-50 cursor-pointer"
                          onClick={() => {
                            setSelectedZone(location);
                            setIsManageZoneOpen(true);
                            setSupervisorSearch("");
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Supervisor
                        </Button>
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
                  {viewZoneEmployees?.Location_Description}
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
                            {viewZoneEmployees.Supervisor_ID === emp.Employee_ID
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

        {/* Salary Management */}
        <section id="salary">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl flex items-center gap-2">
              <DollarSign className="h-6 w-6" /> Salary Management
            </h2>
            <Button
              className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
              onClick={() => handleSalaryDialogOpen(true)}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Manage Salaries
            </Button>
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
                        className="p-4 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <h3 className="font-medium mb-2">{displayTitle}</h3>
                        <p className="text-2xl font-semibold text-blue-600 mb-1">
                          ${avgSalary.toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>

          {/* Salary Management Dialog */}
          <Dialog
            open={isSalaryManagementOpen}
            onOpenChange={handleSalaryDialogOpen}
          >
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Manage Employee Salaries</DialogTitle>
                <DialogDescription>
                  Update salaries for each job type. Changes will apply to all
                  employees in that role.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {allJobTitles
                  .filter((j) => j.Job_ID !== 1)
                  .map((job) => {
                    const displayTitle =
                      job.Job_ID === 2 ? "Supervisor" : job.Title;
                    const displayDescription =
                      job.Job_ID === 2
                        ? "Zone supervision and operations"
                        : job.Description;
                    return (
                      <div
                        key={job.Job_ID}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h3 className="font-medium">{displayTitle}</h3>
                          <p className="text-sm text-gray-600">
                            {displayDescription}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            step="1000"
                            value={tempSalaries[job.Job_ID] || 0}
                            onChange={(e) =>
                              setTempSalaries((prev) => ({
                                ...prev,
                                [job.Job_ID]: parseFloat(e.target.value) || 0,
                              }))
                            }
                            className="w-32"
                          />
                          <span className="text-gray-600">$/year</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
              <div className="flex justify-end mt-4">
                <Button
                  onClick={handleSalarySave}
                  className="bg-green-600 hover:bg-green-700 cursor-pointer"
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </section>

        {/* Employee Management */}
        <section id="employees">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl flex items-center gap-2">
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
                              <span className="font-medium">Employee ID:</span>{" "}
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

        <section id="exhibits">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl flex items-center gap-2">
              <Building2 className="h-6 w-6 text-indigo-600" /> Exhibit
              Management
            </h2>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-4">
                Manage zoo exhibits and displays
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {allExhibitsDB.map((exhibit) => (
                  <Card
                    key={exhibit.Exhibit_ID}
                    className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200"
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
                              className="text-xs bg-blue-50 text-blue-700 border-blue-200"
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
                            <span>• {exhibit.Display_Time}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
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

        <section id="animals">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl flex items-center gap-2">
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
                  <Label htmlFor="exhibit-filter">Filter by Exhibit</Label>
                  <Select
                    value={
                      animalExhibitFilter === "All"
                        ? "All"
                        : animalExhibitFilter.toString()
                    }
                    onValueChange={(value) =>
                      setAnimalExhibitFilter(
                        value === "All" ? "All" : parseInt(value)
                      )
                    }
                  >
                    <SelectTrigger
                      id="exhibit-filter"
                      className="cursor-pointer"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
                {animalExhibitFilter !== "All" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAnimalExhibitFilter("All")}
                    className="cursor-pointer mt-6"
                  >
                    Clear Filter
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 mt-6">
                    <Filter className="h-5 w-5 text-gray-600" />
                    <span className="font-semibold text-gray-700">Filter</span>
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
                        className="overflow-hidden border-2 border-teal-200"
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
                                  {animals.length === 1 ? "animal" : "animals"}
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
                              const daysAgo = (animal.Animal_ID * 13) % 365;
                              const dateAdded = new Date();
                              dateAdded.setDate(dateAdded.getDate() - daysAgo);
                              const dateAddedString = formatDate(
                                dateAdded.toISOString().split("T")[0]
                              );

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
                                        Weight: {animal.Weight} lbs • Born:{" "}
                                        {formatDate(animal.Birthday)}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Health: {animal.Health_Status} • Added:{" "}
                                        {dateAddedString}
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
                      <p className="text-lg text-gray-600">No animals found</p>
                      <p className="text-sm text-gray-500 mt-2">
                        {animalExhibitFilter !== "All"
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

        {/* Animals Health Status Distribution Report */}
        <section id="health-status">
          <h2 className="text-2xl mb-6 flex items-center gap-2">
            <Activity className="h-6 w-6 text-red-500" /> Animals Health Status
            Distribution
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
                    <h3 className="font-semibold text-gray-700">Filters</h3>
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
                if (ageFilter === "6-10" && (age < 6 || age > 10)) return false;
                if (ageFilter === "11+" && age < 11) return false;
              }

              return true;
            });

            // Health status distribution for pie chart
            const healthStatusData = [
              {
                name: "Excellent",
                value: filteredAnimals.filter(
                  (a) => a.Health_Status === "Excellent"
                ).length,
                fill: "#10B981",
              },
              {
                name: "Good",
                value: filteredAnimals.filter((a) => a.Health_Status === "Good")
                  .length,
                fill: "#4CAF50",
              },
              {
                name: "Fair",
                value: filteredAnimals.filter((a) => a.Health_Status === "Fair")
                  .length,
                fill: "#F59E0B",
              },
              {
                name: "Needs Attention",
                value: filteredAnimals.filter(
                  (a) => a.Health_Status === "Needs Attention"
                ).length,
                fill: "#EF4444",
              },
            ].filter((item) => item.value > 0);

            // Vaccination Status Distribution
            const vaccinationData = [
              {
                name: "Vaccinated",
                value: filteredAnimals.filter((a) => a.Is_Vaccinated).length,
                fill: "#10B981",
              },
              {
                name: "Not Vaccinated",
                value: filteredAnimals.filter((a) => !a.Is_Vaccinated).length,
                fill: "#EF4444",
              },
            ].filter((item) => item.value > 0);

            return (
              <div className="mt-6 space-y-6">
                {/* Summary Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Filtered Results Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">
                          Total Animals
                        </p>
                        <p className="text-3xl font-semibold text-blue-600">
                          {filteredAnimals.length}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Excellent</p>
                        <p className="text-3xl font-semibold text-green-600">
                          {
                            filteredAnimals.filter(
                              (a) => a.Health_Status === "Excellent"
                            ).length
                          }
                        </p>
                      </div>
                      <div className="text-center p-4 bg-teal-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Good</p>
                        <p className="text-3xl font-semibold text-teal-600">
                          {
                            filteredAnimals.filter(
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
                            color: "#a16207",
                          }}
                        >
                          {
                            filteredAnimals.filter(
                              (a) => a.Health_Status === "Fair"
                            ).length
                          }
                        </p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">
                          Needs Attention
                        </p>
                        <p className="text-3xl font-semibold text-red-600">
                          {
                            filteredAnimals.filter(
                              (a) => a.Health_Status === "Needs Attention"
                            ).length
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {filteredAnimals.length === 0 ? (
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
                                label={({ name, value, percent }) =>
                                  `${name}: ${value} (${(percent * 100).toFixed(
                                    0
                                  )}%)`
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
                      {vaccinationData.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle>Vaccination Status</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                              <PieChart>
                                <Pie
                                  data={vaccinationData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, value, percent }) =>
                                    `${name}: ${value} (${(
                                      percent * 100
                                    ).toFixed(0)}%)`
                                  }
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {vaccinationData.map((entry, index) => (
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
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </section>

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
                  `Select a supervisor for Zone ${selectedZone.Zone}: ${selectedZone.Location_Description}`}
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
                      selectedZone &&
                      handleAssignSupervisor(
                        selectedZone.Location_ID,
                        employee.Employee_ID
                      )
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
          Employee
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
              {isSaving ? "Saving..." : "Save Changes"}
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
    onAdd(formData);
    setFormData({
      name: "",
      species: "",
      gender: "M",
      weight: "",
      birthday: "",
      enclosureId: "1",
      imageFile: null,
    });
    setImagePreview(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-teal-600 hover:bg-teal-700 cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          Animal
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
                onChange={(e) =>
                  setFormData({ ...formData, weight: e.target.value })
                }
                required
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
              Upload a photo of this animal (JPG, PNG, WebP - max 5MB). If not
              provided, a default species image will be used.
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
                onChange={(e) =>
                  setFormData({ ...formData, weight: e.target.value })
                }
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
              {isSaving ? "Saving..." : "Save Changes"}
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
