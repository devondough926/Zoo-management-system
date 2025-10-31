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
import { enclosures } from "../../data/mockData";
import {
  LogOut,
  ClipboardList,
  CheckCircle,
  XCircle,
  PawPrint,
  Home,
  Sparkles,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import { useData } from "../../data/DataContext";
import { ZooLogo } from "../../components/ZooLogo";

export function ZookeeperPortal({ user, onLogout }) {
  const { animals } = useData();
  const [selectedHabitat, setSelectedHabitat] = useState(1); // Default to first habitat
  const [careDialogOpen, setCareDialogOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);

  // Mock care statuses (in real app, would come from database)
  const [animalCareStatuses, setAnimalCareStatuses] = useState(() =>
    animals.map((animal) => ({
      animalId: animal.Animal_ID,
      fed: Math.random() > 0.5,
      lastFed: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    }))
  );

  const [habitatStatuses, setHabitatStatuses] = useState(() =>
    enclosures.map((enc) => ({
      enclosureId: enc.Enclosure_ID,
      cleaned: Math.random() > 0.3,
      lastCleaned: new Date(
        Date.now() - Math.random() * 86400000
      ).toISOString(),
    }))
  );

  // Sync care statuses when animals list changes
  useEffect(() => {
    setAnimalCareStatuses((prevStatuses) => {
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
          fed: false,
          lastFed: new Date().toISOString(),
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

  const selectedHabitatStatus = selectedHabitat
    ? habitatStatuses.find((status) => status.enclosureId === selectedHabitat)
    : null;

  const selectedAnimalInfo = selectedAnimal
    ? animals.find((a) => a.Animal_ID === selectedAnimal)
    : null;

  const selectedAnimalStatus = selectedAnimal
    ? animalCareStatuses.find((status) => status.animalId === selectedAnimal)
    : null;

  const handleLogCare = (animalId) => {
    setSelectedAnimal(animalId);
    setCareDialogOpen(true);
  };

  const handleSaveCare = () => {
    if (!selectedAnimal || !selectedAnimalStatus) return;

    // Update the status
    setAnimalCareStatuses((prev) =>
      prev.map((status) =>
        status.animalId === selectedAnimal
          ? { ...status, lastFed: new Date().toISOString() }
          : status
      )
    );

    toast.success(`Care logged for ${selectedAnimalInfo?.Animal_Name}`);
    setCareDialogOpen(false);
  };

  const toggleAnimalFed = () => {
    if (!selectedAnimal) return;
    setAnimalCareStatuses((prev) =>
      prev.map((status) =>
        status.animalId === selectedAnimal
          ? { ...status, fed: !status.fed }
          : status
      )
    );
  };

  const toggleHabitatCleaned = () => {
    if (!selectedHabitat) return;
    setHabitatStatuses((prev) =>
      prev.map((status) =>
        status.enclosureId === selectedHabitat
          ? {
              ...status,
              cleaned: !status.cleaned,
              lastCleaned: new Date().toISOString(),
            }
          : status
      )
    );
    toast.success(
      `${selectedHabitatInfo?.Enclosure_Name} cleaning status updated`
    );
  };

  // Calculate stats
  const totalAnimals = animals.length;
  const fedAnimals = animalCareStatuses.filter((s) => s.fed).length;
  const cleanedHabitats = habitatStatuses.filter((s) => s.cleaned).length;

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
                <p className="text-sm text-gray-600">Zookeeper Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium">
                  Welcome, {user.First_Name} {user.Last_Name}
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
                  <p className="text-sm text-gray-600">Animals Fed Today</p>
                  <p className="text-2xl font-semibold text-green-600">
                    {fedAnimals}/{totalAnimals}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-teal-600">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Sparkles className="h-8 w-8 text-teal-600" />
                <div>
                  <p className="text-sm text-gray-600">Habitats Cleaned</p>
                  <p className="text-2xl font-semibold text-teal-600">
                    {cleanedHabitats}/{enclosures.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-600">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Home className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Habitats</p>
                  <p className="text-2xl font-semibold text-yellow-600">
                    {enclosures.length}
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
              <ClipboardList className="h-5 w-5 mr-2 text-green-600" />
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

        {/* Selected Habitat Info */}
        {selectedHabitat && selectedHabitatInfo && (
          <div className="space-y-6">
            {/* Habitat Status */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedHabitatInfo.Enclosure_Name} - Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {selectedHabitatStatus?.cleaned ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium">Habitat Cleaned</p>
                      {selectedHabitatStatus?.lastCleaned && (
                        <p className="text-sm text-gray-600">
                          Last cleaned:{" "}
                          {new Date(
                            selectedHabitatStatus.lastCleaned
                          ).toLocaleDateString()}{" "}
                          at{" "}
                          {new Date(
                            selectedHabitatStatus.lastCleaned
                          ).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={toggleHabitatCleaned}
                    variant={
                      selectedHabitatStatus?.cleaned ? "outline" : "default"
                    }
                    className={
                      selectedHabitatStatus?.cleaned
                        ? ""
                        : "bg-green-600 hover:bg-green-700"
                    }
                  >
                    {selectedHabitatStatus?.cleaned
                      ? "Mark as Not Cleaned"
                      : "Mark as Cleaned"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Animals in Habitat */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-green-600" />
                  Animals in {selectedHabitatInfo.Enclosure_Name} (
                  {habitatAnimals.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {habitatAnimals.map((animal) => {
                    const careStatus = animalCareStatuses.find(
                      (s) => s.animalId === animal.Animal_ID
                    );
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
                          {careStatus?.fed ? (
                            <Badge className="bg-green-100 text-green-800">
                              Fed
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Not Fed</Badge>
                          )}
                        </div>
                        <div className="text-sm space-y-1 text-gray-600 mb-3">
                          <p>
                            Gender:{" "}
                            {animal.Gender === "M"
                              ? "Male"
                              : animal.Gender === "F"
                              ? "Female"
                              : "Unknown"}
                          </p>
                          {careStatus?.lastFed && (
                            <p className="text-xs">
                              Last fed:{" "}
                              {new Date(
                                careStatus.lastFed
                              ).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Button
                          onClick={() => handleLogCare(animal.Animal_ID)}
                          variant="outline"
                          size="sm"
                          className="w-full cursor-pointer"
                        >
                          <ClipboardList className="h-4 w-4 mr-2" />
                          Log Care
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!selectedHabitat && (
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Select a habitat to view and manage animal care
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Care Logging Dialog */}
      <Dialog open={careDialogOpen} onOpenChange={setCareDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Log Care for {selectedAnimalInfo?.Animal_Name}
            </DialogTitle>
            <DialogDescription>
              Update the care status for this animal
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="fed-status" className="font-medium">
                    Animal Fed
                  </Label>
                  <p className="text-sm text-gray-600">
                    Mark if this animal has been fed today
                  </p>
                </div>
                <Switch
                  id="fed-status"
                  checked={selectedAnimalStatus?.fed || false}
                  onCheckedChange={toggleAnimalFed}
                />
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Animal:</strong> {selectedAnimalInfo?.Animal_Name} (
                {selectedAnimalInfo?.Species})
              </p>
              <p className="text-sm text-blue-800">
                <strong>Habitat:</strong>{" "}
                {selectedAnimalInfo?.Enclosure?.Enclosure_Name}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Status:</strong>{" "}
                {selectedAnimalStatus?.fed ? "Fed" : "Not Fed"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCareDialogOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCare}
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
