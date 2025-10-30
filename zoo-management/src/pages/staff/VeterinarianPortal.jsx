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
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useData } from "../../data/DataContext";
import { ZooLogo } from "../../components/ZooLogo";

export function VeterinarianPortal({ user, onLogout }) {
  const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
  if (!USE_MOCK) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <ZooLogo size={40} />
                <div>
                  <h1 className="font-semibold text-xl">Staff Portal</h1>
                  <p className="text-sm text-gray-600">Veterinarian Dashboard (Demo disabled)</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="outline" onClick={onLogout} className="border-green-600 text-green-600">
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-12">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent>
                <h2 className="text-lg font-semibold mb-2">Demo data disabled</h2>
                <p className="text-sm text-gray-600">
                  This staff portal uses mock/demo data for local development. To enable the demo UI set <code>VITE_USE_MOCK=true</code> in your frontend environment (.env.local) and restart the dev server.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  const { animals } = useData();
  const [selectedHabitat, setSelectedHabitat] = useState(1); // Default to first habitat
  const [vetDialogOpen, setVetDialogOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);

  // Mock vet statuses (in real app, would come from database)
  const [animalVetStatuses, setAnimalVetStatuses] = useState(() =>
    animals.map((animal, idx) => ({
      animalId: animal.Animal_ID,
      shotsGiven: Math.random() > 0.4,
      lastVaccination: new Date(
        Date.now() - Math.random() * 180 * 86400000
      ).toISOString(),
      healthStatus: ["Excellent", "Good", "Fair", "Needs Attention"][
        Math.floor(Math.random() * 4)
      ],
      age: Math.floor(Math.random() * 15) + 1,
      weight: Math.floor(Math.random() * 500) + 50,
      lastCheckup: new Date(
        Date.now() - Math.random() * 30 * 86400000
      ).toISOString(),
    }))
  );

  // Sync vet statuses when animals list changes
  useEffect(() => {
    setAnimalVetStatuses((prevStatuses) => {
      const existingStatusMap = new Map(
        prevStatuses.map((s) => [s.animalId, s])
      );
      return animals.map((animal) => {
        if (existingStatusMap.has(animal.Animal_ID)) {
          return existingStatusMap.get(animal.Animal_ID);
        }
        // New animal - create default status
        return {
          animalId: animal.Animal_ID,
          shotsGiven: false,
          lastVaccination: new Date().toISOString(),
          healthStatus: "Good",
          age: 1,
          weight: 100,
          lastCheckup: new Date().toISOString(),
        };
      });
    });
  }, [animals]);

  // Get animals for selected habitat
  const habitatAnimals = selectedHabitat
    ? animals.filter((animal) => animal.Enclosure_ID === selectedHabitat)
    : [];

  const selectedHabitatInfo = selectedHabitat
    ? enclosures.find((enc) => enc.Enclosure_ID === selectedHabitat)
    : null;

  const selectedAnimalInfo = selectedAnimal
    ? animals.find((a) => a.Animal_ID === selectedAnimal)
    : null;

  const selectedAnimalStatus = selectedAnimal
    ? animalVetStatuses.find((status) => status.animalId === selectedAnimal)
    : null;

  const handleLogVetCare = (animalId) => {
    setSelectedAnimal(animalId);
    setVetDialogOpen(true);
  };

  const handleSaveVetCare = () => {
    if (!selectedAnimal || !selectedAnimalStatus) return;

    // Update the status
    setAnimalVetStatuses((prev) =>
      prev.map((status) =>
        status.animalId === selectedAnimal
          ? { ...status, lastCheckup: new Date().toISOString() }
          : status
      )
    );

    toast.success(`Vet record updated for ${selectedAnimalInfo?.Animal_Name}`);
    setVetDialogOpen(false);
  };

  const toggleShotsGiven = () => {
    if (!selectedAnimal) return;
    setAnimalVetStatuses((prev) =>
      prev.map((status) =>
        status.animalId === selectedAnimal
          ? {
              ...status,
              shotsGiven: !status.shotsGiven,
              lastVaccination: !status.shotsGiven
                ? new Date().toISOString()
                : status.lastVaccination,
            }
          : status
      )
    );
  };

  const updateHealthStatus = (newStatus) => {
    if (!selectedAnimal) return;
    setAnimalVetStatuses((prev) =>
      prev.map((status) =>
        status.animalId === selectedAnimal
          ? { ...status, healthStatus: newStatus }
          : status
      )
    );
  };

  const updateAge = (newAge) => {
    if (!selectedAnimal) return;
    const age = parseInt(newAge);
    if (isNaN(age)) return;
    setAnimalVetStatuses((prev) =>
      prev.map((status) =>
        status.animalId === selectedAnimal ? { ...status, age } : status
      )
    );
  };

  const updateWeight = (newWeight) => {
    if (!selectedAnimal) return;
    const weight = parseFloat(newWeight);
    if (isNaN(weight)) return;
    setAnimalVetStatuses((prev) =>
      prev.map((status) =>
        status.animalId === selectedAnimal ? { ...status, weight } : status
      )
    );
  };

  // Calculate stats
  const totalAnimals = animals.length;
  const vaccinatedAnimals = animalVetStatuses.filter(
    (s) => s.shotsGiven
  ).length;
  const healthyAnimals = animalVetStatuses.filter(
    (s) => s.healthStatus === "Excellent" || s.healthStatus === "Good"
  ).length;

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
                    {totalAnimals}
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
                    {vaccinatedAnimals}/{totalAnimals}
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
                    {healthyAnimals}/{totalAnimals}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {habitatAnimals.map((animal) => {
                  const vetStatus = animalVetStatuses.find(
                    (s) => s.animalId === animal.Animal_ID
                  );
                  return (
                    <div
                      key={animal.Animal_ID}
                      className="p-4 rounded-lg border hover:border-green-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium">{animal.Animal_Name}</h3>
                          <p className="text-sm text-gray-600">
                            {animal.Species}
                          </p>
                        </div>
                        <Badge
                          className={getHealthBadgeColor(
                            vetStatus?.healthStatus || "Good"
                          )}
                        >
                          {vetStatus?.healthStatus}
                        </Badge>
                      </div>
                      <div className="text-sm space-y-2 text-gray-600 mb-3">
                        <div className="flex items-center justify-between">
                          <span>Age:</span>
                          <span className="font-medium">
                            {vetStatus?.age} years
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Weight:</span>
                          <span className="font-medium">
                            {vetStatus?.weight} lbs
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Vaccinated:</span>
                          {vetStatus?.shotsGiven ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        {vetStatus?.lastCheckup && (
                          <p className="text-xs pt-1">
                            Last checkup:{" "}
                            {new Date(
                              vetStatus.lastCheckup
                            ).toLocaleDateString()}
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
                <strong>Habitat:</strong>{" "}
                {selectedAnimalInfo?.Enclosure?.Enclosure_Name}
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
                checked={selectedAnimalStatus?.shotsGiven || false}
                onCheckedChange={toggleShotsGiven}
              />
            </div>

            {/* Health Status */}
            <div className="space-y-2">
              <Label>Health Status</Label>
              <Select
                value={selectedAnimalStatus?.healthStatus}
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
                value={selectedAnimalStatus?.age || 0}
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
                value={selectedAnimalStatus?.weight || 0}
                onChange={(e) => updateWeight(e.target.value)}
                min="0"
                step="0.1"
              />
            </div>

            {/* Last Vaccination Date */}
            {selectedAnimalStatus?.lastVaccination && (
              <div className="text-sm text-gray-600">
                Last vaccination:{" "}
                {new Date(
                  selectedAnimalStatus.lastVaccination
                ).toLocaleDateString()}
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
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
