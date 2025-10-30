import { useState, useMemo, useEffect } from "react";
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
  employeeRecords,
  locations,
  jobTitles,
  enclosures,
} from "../data/mockData";
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

// API Base URL for direct fetch calls (for image uploads)
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export function AdminPortal({ user, onLogout, onNavigate }) {
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
  const [editingExhibit, setEditingExhibit] = useState(null);
  const [isAddAnimalOpen, setIsAddAnimalOpen] = useState(false);
  const [deleteConfirmAnimal, setDeleteConfirmAnimal] = useState(null);
  const [editingAnimal, setEditingAnimal] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Loading state for async save/update operations
  const [isSaving, setIsSaving] = useState(false);

  // Salary state for each job type (5 shared login roles)
  const [salaries, setSalaries] = useState({
    2: 72000, // Supervisor
    3: 72000, // Veterinarian
    4: 45000, // Zookeeper
    5: 32000, // Concession Worker
    6: 35000, // Gift Shop Worker
  });

  // Temporary salary state for editing
  const [tempSalaries, setTempSalaries] = useState({ ...salaries });

  // Pricing state for tickets and memberships
  const [isPricingManagementOpen, setIsPricingManagementOpen] = useState(false);
  const [tempTicketPrices, setTempTicketPrices] = useState({ ...ticketPrices });
  const [tempMembershipPrice, setTempMembershipPrice] =
    useState(membershipPrice);

  // Load all data from database on mount
  useEffect(() => {
    loadAllData();
  }, []);

  // Reload revenue data when range changes
  useEffect(() => {
    if (!isLoading) {
      loadRevenueData();
    }
  }, [revenueRange]);

  const loadAllData = async () => {
    try {
      setIsLoading(true);

      // Load all data in parallel
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

      // Load revenue data
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

  // Update supervisor salaries on mount and when locations change
  useEffect(() => {
    setAllEmployees((prevEmployees) =>
      prevEmployees.map((emp) => {
        // Check if this employee is a supervisor of any zone
        const isSupervisor = allLocations.some(
          (loc) => loc.Supervisor_ID === emp.Employee_ID
        );

        if (isSupervisor) {
          // Employee is a supervisor, use supervisor salary
          return { ...emp, Salary: salaries[2] };
        }
        return emp;
      })
    );
  }, []); // Only run on mount

  // Helper function to filter data by date range
  const filterByDateRange = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();

    // Reset time parts to compare just dates
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

  // Helper function to format date as MM/DD/YYYY
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Helper function to format numbers with commas
  const formatNumber = (num) => {
    return num.toLocaleString("en-US");
  };

  // Helper function to format last updated time
  const formatLastUpdated = () => {
    const hours = lastUpdated.getHours();
    const minutes = String(lastUpdated.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  // Helper function to check if employee is a supervisor
  const isSupervisor = (emp) => {
    return allLocations.some((loc) => loc.Supervisor_ID === emp.Employee_ID);
  };

  // Helper function to get employee's display title (with Supervisor override)
  const getEmployeeTitle = (emp) => {
    if (isSupervisor(emp)) {
      return "Supervisor";
    }
    return emp.Title || "Unknown";
  };

  // Helper function to get employee zone
  const getEmployeeZone = (emp) => {
    // If employee has a direct zone assignment, show it
    if (emp.Zone) return `Zone ${emp.Zone}`;

    // Check if employee is a supervisor of a zone
    const supervisedZone = allLocations.find(
      (loc) => loc.Supervisor_ID === emp.Employee_ID
    );
    if (supervisedZone) return `Zone ${supervisedZone.Zone}`;

    // Otherwise, find zone by supervisor chain
    const supervisor = allEmployees.find(
      (e) => e.Employee_ID === emp.Supervisor_ID
    );
    if (supervisor) {
      const supZone = allLocations.find(
        (loc) => loc.Supervisor_ID === supervisor.Employee_ID
      );
      if (supZone) return `Zone ${supZone.Zone}`;
    }

    return "Not Assigned";
  };

  // Sort employees alphabetically by last name
  const sortedEmployees = useMemo(() => {
    return [...allEmployees].sort((a, b) =>
      a.Last_Name.localeCompare(b.Last_Name)
    );
  }, [allEmployees]);

  const displayAnimals = allAnimalsDB;

  // Calculate statistics from database with revenue data from API
  const ticketRevenue = revenueData?.ticketRevenue || 0;
  const membershipRevenue = revenueData?.membershipRevenue || 0;
  const giftShopRevenue = revenueData?.giftShopRevenue || 0;
  const foodRevenue = revenueData?.foodRevenue || 0;
  const totalRevenue = revenueData?.totalRevenue || 0;

  const totalAnimals = displayAnimals.length;
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

  // Ticket stats from revenue data
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

      // Reload employees and locations
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

      // Show specific error message if available
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
        supervisorId: zoneLocation ? zoneLocation.Supervisor_ID : null,
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
        supervisorId: zoneLocation ? zoneLocation.Supervisor_ID : null,
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

  // ============================================
  // EXHIBIT HANDLERS
  // ============================================

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

      // Reload exhibits to get fresh data
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

  // ============================================
  // ANIMAL HANDLERS
  // ============================================

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

      // Reload animals to get fresh data including updated image URL
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

      // Reload animals to get fresh data
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

      // Also delete from context
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
    return allEmployees.filter((emp) => {
      if (location.Supervisor_ID === emp.Employee_ID) return true;
      const supervisor = allEmployees.find(
        (e) => e.Employee_ID === emp.Supervisor_ID
      );
      if (supervisor && location.Supervisor_ID === supervisor.Employee_ID)
        return true;
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
                onClick={() => onNavigate("home")}
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
            <h2 className="text-2xl">📊 Overview Statistics</h2>
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
          <h2 className="text-2xl mb-6">💰 Revenue Breakdown</h2>
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
          <h2 className="text-2xl mb-6">🎫 Ticket Sales</h2>
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

        {/* Pricing Management */}
        <section id="pricing">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl">💳 Pricing Management</h2>
            <Button
              className="bg-purple-600 hover:bg-purple-700 cursor-pointer"
              onClick={() => handlePricingDialogOpen(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Prices
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Ticket Prices */}
                <div>
                  <h3 className="font-semibold mb-3 text-green-700">
                    Day Pass Tickets
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(ticketPrices).map(([type, price]) => (
                      <div
                        key={type}
                        className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                      >
                        <span className="text-gray-700">{type}</span>
                        <span className="font-semibold text-green-600">
                          ${price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Membership Price */}
                <div>
                  <h3 className="font-semibold mb-3 text-purple-700">
                    Annual Membership
                  </h3>
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700">Annual Membership</span>
                      <span className="font-semibold text-purple-600 text-xl">
                        ${membershipPrice.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
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

        {/* Revenue Analytics Charts */}
        <section id="analytics">
          <h2 className="text-2xl mb-6">📈 Analytics</h2>
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

        {/* Zone Overview */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl">🗺️ Zone Overview</h2>
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
            <h2 className="text-2xl">💵 Salary Management</h2>
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
                {jobTitles
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
                {jobTitles
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
            <h2 className="text-2xl">👥 Staff Management</h2>
            <AddEmployeeDialog
              isOpen={isAddEmployeeOpen}
              onOpenChange={setIsAddEmployeeOpen}
              onAdd={handleAddEmployee}
              allEmployees={allEmployees}
              salaries={salaries}
              isSaving={isSaving}
            />
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-4">
                Total Employees: {allEmployees.length}
              </p>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {sortedEmployees.map((emp) => (
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
                            <span className="font-medium">Sex:</span> {emp.Sex}
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
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </section>

        {/* Exhibit Management */}
        <section id="exhibits">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl">🏛️ Exhibit Management</h2>
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
                    className="p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">
                            {exhibit.exhibit_Name}
                          </h3>
                          {exhibit.Location_Description && (
                            <Badge variant="outline" className="text-xs">
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

        {/* Animal Management */}
        <section id="animals">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl">🐾 Animal Management</h2>
            <AddAnimalDialog
              isOpen={isAddAnimalOpen}
              onOpenChange={setIsAddAnimalOpen}
              onAdd={handleAddAnimal}
              enclosures={allEnclosures}
              isSaving={isSaving}
            />
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-4">
                Manage zoo animals and their habitats
              </p>
              <ScrollArea className="h-[400px]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {displayAnimals.map((animal, index) => {
                    const enclosure = allEnclosures.find(
                      (e) => e.Enclosure_ID === animal.Enclosure_ID
                    );
                    // Generate a mock date added (based on animal ID for consistency)
                    const daysAgo = (animal.Animal_ID * 13) % 365; // Pseudo-random but consistent
                    const dateAdded = new Date();
                    dateAdded.setDate(dateAdded.getDate() - daysAgo);
                    const dateAddedString = formatDate(
                      dateAdded.toISOString().split("T")[0]
                    );

                    return (
                      <div
                        key={animal.Animal_ID}
                        className="p-4 bg-teal-50 rounded-lg border border-teal-200 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-teal-600 text-white flex-shrink-0">
                            <PawPrint className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{animal.Animal_Name}</p>
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
                              Habitat: {enclosure?.Enclosure_Name || "Unknown"}{" "}
                              • Added: {dateAddedString}
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
              </ScrollArea>
            </CardContent>
          </Card>
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
                  {jobTitles
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
  allLocations,
  salaries,
  isSaving,
}) {
  // Helper function to format date for input[type="date"]
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
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
                  {jobTitles
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
    // Handle both ISO format and MySQL date format
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    // Return YYYY-MM-DD format
    return date.toISOString().split("T")[0];
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
