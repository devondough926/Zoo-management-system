import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Input } from "../../components/ui/input";
import { enclosures } from "../../data/mockData";
import {
  LogOut,
  Stethoscope,
  Activity,
  CheckCircle,
  XCircle,
  Syringe,
  PawPrint,
} from "lucide-react";
import { toast } from "sonner";
import { ZooLogo } from "../../components/ZooLogo";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export function VeterinarianPortal({ user, onLogout }) {
  const [selectedHabitat, setSelectedHabitat] = useState(1);
  const [vetDialogOpen, setVetDialogOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);

  // Real data from API
  const [stats, setStats] = useState({
    totalAnimals: 0,
    vaccinatedAnimals: 0,
    healthyAnimals: 0,
  });
  const [habitatAnimals, setHabitatAnimals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch dashboard statistics
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/veterinarian/stats`);
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to load statistics");
    }
  };

  // Fetch animals by habitat/enclosure
  const fetchAnimalsByHabitat = async (enclosureId) => {
    if (!enclosureId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/veterinarian/enclosures/${enclosureId}/animals`
      );
      if (!response.ok) throw new Error("Failed to fetch animals");
      const data = await response.json();
      setHabitatAnimals(data);
    } catch (error) {
      console.error("Error fetching animals:", error);
      toast.error("Failed to load animals");
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchStats();
  }, []);

  // Fetch animals when habitat changes
  useEffect(() => {
    if (selectedHabitat) {
      fetchAnimalsByHabitat(selectedHabitat);
    }
  }, [selectedHabitat]);

  const selectedHabitatInfo = selectedHabitat
    ? enclosures.find((enc) => enc.Enclosure_ID === selectedHabitat)
    : null;

  const selectedAnimalInfo = selectedAnimal
    ? habitatAnimals.find((a) => a.Animal_ID === selectedAnimal)
    : null;

  const handleLogVetCare = (animalId) => {
    setSelectedAnimal(animalId);
    setVetDialogOpen(true);
  };

  const handleSaveVetCare = async () => {
    if (!selectedAnimal || !selectedAnimalInfo) return;

    // It's OK if this is a role-based login where Employee_ID is not provided
    // we'll send null and the backend will store a NULL Employee_ID for the visit.
    if (!user) {
      console.error("No user in context", user);
      toast.error("Cannot save: missing user information");
      return;
    }

    setSaving(true);
    try {
      // Normalize vaccination value to boolean
      const isVaccinated =
        typeof selectedAnimalInfo.Is_Vaccinated === "boolean"
          ? selectedAnimalInfo.Is_Vaccinated
          : Number(selectedAnimalInfo.Is_Vaccinated) === 1;

      // Update animal health info
      const healthResponse = await fetch(
        `${API_BASE}/veterinarian/animals/${selectedAnimal}/health`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            healthStatus: selectedAnimalInfo.Health_Status,
            isVaccinated,
            weight: selectedAnimalInfo.Weight,
          }),
        }
      );

      if (!healthResponse.ok) {
        const errBody = await healthResponse.json().catch(() => ({}));
        console.error("Health update failed", errBody);
        toast.error(errBody.error || "Failed to update health info");
        setSaving(false);
        return;
      }

      // Only create a vet visit record if we have a concrete employee id.
      // For role-based logins that don't have Employee_ID, we'll skip creating
      // a visit row and just persist the animal health changes directly.
      let visitData = null;
      if (user.Employee_ID) {
        // Create vet visit record (include visitDate explicitly)
        const visitPayload = {
          animalId: selectedAnimal,
          employeeId: user.Employee_ID,
          visitDate: new Date().toISOString(),
          diagnosis: "Routine checkup completed",
          treatment: `Health status: ${selectedAnimalInfo.Health_Status}, Weight: ${selectedAnimalInfo.Weight} lbs`,
        };

        const visitResponse = await fetch(
          `${API_BASE}/veterinarian/vet-visits`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(visitPayload),
          }
        );

        if (!visitResponse.ok) {
          const errBody = await visitResponse.json().catch(() => ({}));
          console.error("Create visit failed", errBody);
          toast.error(errBody.error || "Failed to create vet visit");
          setSaving(false);
          return;
        }

        visitData = await visitResponse.json().catch(() => null);
        toast.success(
          `Vet record updated for ${selectedAnimalInfo?.Animal_Name}`
        );
      } else {
        // No employee id available — we intentionally do NOT create a vet visit.
        toast(
          `Animal updated directly in database for ${selectedAnimalInfo?.Animal_Name} (no employee assigned)`
        );
      }
      setVetDialogOpen(false);

      // Refresh data (re-fetch from server to keep authoritative state)
      await fetchAnimalsByHabitat(selectedHabitat);
      await fetchStats();
      setSaving(false);
      return visitData;
    } catch (error) {
      console.error("Error saving vet care:", error);
      toast.error("Failed to save vet record");
      setSaving(false);
    }
  };

  const toggleShotsGiven = () => {
    if (!selectedAnimal || !selectedAnimalInfo) return;
    setHabitatAnimals((prev) =>
      prev.map((animal) =>
        animal.Animal_ID === selectedAnimal
          ? { ...animal, Is_Vaccinated: animal.Is_Vaccinated ? 0 : 1 }
          : animal
      )
    );
  };

  const updateHealthStatus = (newStatus) => {
    if (!selectedAnimal) return;
    setHabitatAnimals((prev) =>
      prev.map((animal) =>
        animal.Animal_ID === selectedAnimal
          ? { ...animal, Health_Status: newStatus }
          : animal
      )
    );
  };

  const updateAge = (newAge) => {
    if (!selectedAnimal) return;
    const age = parseInt(newAge);
    if (isNaN(age)) return;
    setHabitatAnimals((prev) =>
      prev.map((animal) =>
        animal.Animal_ID === selectedAnimal ? { ...animal, Age: age } : animal
      )
    );
  };

  const updateWeight = (newWeight) => {
    if (!selectedAnimal) return;
    const weight = parseFloat(newWeight);
    if (isNaN(weight)) return;
    setHabitatAnimals((prev) =>
      prev.map((animal) =>
        animal.Animal_ID === selectedAnimal
          ? { ...animal, Weight: weight }
          : animal
      )
    );
  };

  const getHealthBadgeColor = (status) => {
    switch (status) {
      case "Excellent":
        return "bg-green-100 text-green-800";
      case "Good":
        return "bg-blue-100 text-blue-800";
      case "Fair":
        return "bg-yellow-100 text-yellow-800";
      case "Needs Attention":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ZooLogo size={40} />
              <div>
                <h1 className="font-semibold text-xl">Staff Portal</h1>
                <p className="text-sm text-gray-600">Veterinarian Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium">
                  Welcome, Dr. {user.First_Name} {user.Last_Name}
                </p>
                <p className="text-sm text-gray-600">{user.Job_Title?.Title}</p>
              </div>
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

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-green-600">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <PawPrint className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Animals</p>
                  <p className="text-2xl font-semibold text-green-600">
                    {stats.totalAnimals}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-600">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Syringe className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Vaccinated</p>
                  <p className="text-2xl font-semibold text-blue-600">
                    {stats.vaccinatedAnimals}/{stats.totalAnimals}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-teal-600">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Activity className="h-8 w-8 text-teal-600" />
                <div>
                  <p className="text-sm text-gray-600">Healthy Animals</p>
                  <p className="text-2xl font-semibold text-teal-600">
                    {stats.healthyAnimals}/{stats.totalAnimals}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Habitat Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Stethoscope className="h-5 w-5 mr-2 text-green-600" />
              Select Habitat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedHabitat?.toString()}
              onValueChange={(value) => setSelectedHabitat(Number(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a habitat to view animals..." />
              </SelectTrigger>
              <SelectContent>
                {enclosures.map((enclosure) => (
                  <SelectItem
                    key={enclosure.Enclosure_ID}
                    value={enclosure.Enclosure_ID.toString()}
                  >
                    {enclosure.Enclosure_Name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Animals in Selected Habitat */}
        {selectedHabitat && selectedHabitatInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-green-600" />
                Animals in {selectedHabitatInfo.Enclosure_Name} (
                {habitatAnimals.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-600">
                  Loading animals...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {habitatAnimals.map((animal) => {
                    return (
                      <div
                        key={animal.Animal_ID}
                        className="p-4 rounded-lg border hover:border-green-600 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-medium">
                              {animal.Animal_Name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {animal.Species}
                            </p>
                          </div>
                          <Badge
                            className={getHealthBadgeColor(
                              animal.Health_Status || "Good"
                            )}
                          >
                            {animal.Health_Status || "Good"}
                          </Badge>
                        </div>
                        <div className="text-sm space-y-2 text-gray-600 mb-3">
                          <div className="flex items-center justify-between">
                            <span>Age:</span>
                            <span className="font-medium">
                              {animal.Age || 0} years
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Weight:</span>
                            <span className="font-medium">
                              {animal.Weight || 0} lbs
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Vaccinated:</span>
                            {animal.Is_Vaccinated ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          {animal.Birthday && (
                            <p className="text-xs pt-1">
                              Birthday:{" "}
                              {new Date(animal.Birthday).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => handleLogVetCare(animal.Animal_ID)}
                          variant="outline"
                          size="sm"
                          className="w-full cursor-pointer"
                        >
                          <Stethoscope className="h-4 w-4 mr-2" />
                          Update Vet Info
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!selectedHabitat && (
          <Card>
            <CardContent className="py-12 text-center">
              <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Select a habitat to view and manage animal health records
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Vet Care Dialog */}
      <Dialog open={vetDialogOpen} onOpenChange={setVetDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Update Vet Record for {selectedAnimalInfo?.Animal_Name}
            </DialogTitle>
            <DialogDescription>
              Update veterinary information and health status
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Animal:</strong> {selectedAnimalInfo?.Animal_Name} (
                {selectedAnimalInfo?.Species})
              </p>
              <p className="text-sm text-blue-800">
                <strong>Gender:</strong>{" "}
                {selectedAnimalInfo?.Gender === "M"
                  ? "Male"
                  : selectedAnimalInfo?.Gender === "F"
                  ? "Female"
                  : "Unknown"}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Habitat:</strong> {selectedAnimalInfo?.Enclosure_Name}
              </p>
            </div>

            {/* Shots Given */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="shots-status" className="font-medium">
                  Vaccinations Up-to-Date
                </Label>
                <p className="text-sm text-gray-600">
                  All required shots have been administered
                </p>
              </div>
              <Switch
                id="shots-status"
                checked={selectedAnimalInfo?.Is_Vaccinated || false}
                onCheckedChange={toggleShotsGiven}
              />
            </div>

            {/* Health Status */}
            <div className="space-y-2">
              <Label>Health Status</Label>
              <Select
                value={selectedAnimalInfo?.Health_Status || "Good"}
                onValueChange={(value) => updateHealthStatus(value)}
              >
                <SelectTrigger>
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

            {/* Age */}
            <div className="space-y-2">
              <Label htmlFor="age">Age (years)</Label>
              <Input
                id="age"
                type="number"
                value={selectedAnimalInfo?.Age || 0}
                onChange={(e) => updateAge(e.target.value)}
                min="0"
                max="100"
              />
            </div>

            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                value={selectedAnimalInfo?.Weight || 0}
                onChange={(e) => updateWeight(e.target.value)}
                min="0"
                step="0.1"
              />
            </div>

            {/* Birthday */}
            {selectedAnimalInfo?.Birthday && (
              <div className="text-sm text-gray-600">
                Birthday:{" "}
                {new Date(selectedAnimalInfo.Birthday).toLocaleDateString()}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVetDialogOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveVetCare}
              className="bg-green-600 hover:bg-green-700 cursor-pointer"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
