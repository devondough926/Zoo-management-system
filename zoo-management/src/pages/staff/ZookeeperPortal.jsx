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
import { ZooLogo } from "../../components/ZooLogo";

export function ZookeeperPortal({ user, onLogout }) {
  const [selectedHabitat, setSelectedHabitat] = useState(1);
  const [careDialogOpen, setCareDialogOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  
  // Real data from API
  const [stats, setStats] = useState({
    totalAnimals: 0,
    totalEnclosures: 0,
    animalsFedToday: 0,
    careLogsToday: 0
  });
  const [habitatAnimals, setHabitatAnimals] = useState([]);
  const [habitatStatus, setHabitatStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dialogFedStatus, setDialogFedStatus] = useState(false);

  // Fetch dashboard statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/zookeeper/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
    }
  };

  // Fetch animals by habitat/enclosure
  const fetchAnimalsByHabitat = async (enclosureId) => {
    if (!enclosureId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/zookeeper/enclosures/${enclosureId}/animals`);
      if (!response.ok) throw new Error('Failed to fetch animals');
      const data = await response.json();
      setHabitatAnimals(data);
    } catch (error) {
      console.error('Error fetching animals:', error);
      toast.error('Failed to load animals');
    } finally {
      setLoading(false);
    }
  };

  // Fetch habitat cleaning status
  const fetchHabitatStatus = async (enclosureId) => {
    if (!enclosureId) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/zookeeper/enclosures/${enclosureId}/status`);
      if (!response.ok) throw new Error('Failed to fetch habitat status');
      const data = await response.json();
      setHabitatStatus(data);
    } catch (error) {
      console.error('Error fetching habitat status:', error);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchStats();
  }, []);

  // Fetch animals and status when habitat changes
  useEffect(() => {
    if (selectedHabitat) {
      fetchAnimalsByHabitat(selectedHabitat);
      fetchHabitatStatus(selectedHabitat);
    }
  }, [selectedHabitat]);

  const selectedHabitatInfo = selectedHabitat
    ? enclosures.find((enc) => enc.Enclosure_ID === selectedHabitat)
    : null;

  const selectedAnimalInfo = selectedAnimal
    ? habitatAnimals.find((a) => a.Animal_ID === selectedAnimal)
    : null;

  const handleLogCare = (animalId) => {
    setSelectedAnimal(animalId);
    setDialogFedStatus(false); // Reset to default
    setCareDialogOpen(true);
  };

  const handleSaveCare = async () => {
    if (!selectedAnimal) return;

    try {
      // Create care log
      const response = await fetch('http://localhost:5000/api/zookeeper/care-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animalId: selectedAnimal,
          employeeId: user.Employee_ID || 200,
          activity: dialogFedStatus ? 'Animal fed' : 'Animal care logged',
          notes: dialogFedStatus ? 'Feeding completed' : 'General care completed'
        })
      });

      if (!response.ok) throw new Error('Failed to create care log');

      toast.success(`Care logged for ${selectedAnimalInfo?.Animal_Name}`);
      setCareDialogOpen(false);
      
      // Refresh data
      fetchAnimalsByHabitat(selectedHabitat);
      fetchStats();
    } catch (error) {
      console.error('Error saving care log:', error);
      toast.error('Failed to save care log');
    }
  };

  const toggleAnimalFed = () => {
    setDialogFedStatus(prev => !prev);
  };

  const toggleHabitatCleaned = async () => {
    if (!selectedHabitat) return;

    try {
      // Get first animal in this enclosure to link the log
      if (habitatAnimals.length === 0) {
        toast.error('No animals in this habitat to log cleaning');
        return;
      }

      // Create care log for habitat cleaning
      const response = await fetch('http://localhost:5000/api/zookeeper/care-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          animalId: habitatAnimals[0].Animal_ID, // Use first animal as reference
          employeeId: user.Employee_ID || 200,
          activity: 'Enclosure cleaning and maintenance',
          notes: `${selectedHabitatInfo?.Enclosure_Name} cleaned and sanitized`
        })
      });

      if (!response.ok) throw new Error('Failed to log cleaning');

      toast.success(`${selectedHabitatInfo?.Enclosure_Name} cleaning logged`);
      
      // Refresh data
      fetchHabitatStatus(selectedHabitat);
      fetchStats();
    } catch (error) {
      console.error('Error logging cleaning:', error);
      toast.error('Failed to log cleaning');
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
                    {stats.animalsFedToday}/{stats.totalAnimals}
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
                  <p className="text-sm text-gray-600">Care Logs Today</p>
                  <p className="text-2xl font-semibold text-teal-600">
                    {stats.careLogsToday}
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
                    {stats.totalEnclosures}
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
                    {habitatStatus?.lastCleaning ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-gray-400" />
                    )}
                    <div>
                      <p className="font-medium">Last Habitat Cleaning</p>
                      {habitatStatus?.lastCleaning ? (
                        <p className="text-sm text-gray-600">
                          Cleaned on:{" "}
                          {new Date(
                            habitatStatus.lastCleaning.Log_Date
                          ).toLocaleDateString()}{" "}
                          at{" "}
                          {new Date(
                            habitatStatus.lastCleaning.Log_Date
                          ).toLocaleTimeString()}
                          {" by "}
                          {habitatStatus.lastCleaning.First_Name} {habitatStatus.lastCleaning.Last_Name}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-600">No cleaning logged yet</p>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={toggleHabitatCleaned}
                    variant="default"
                    className="bg-green-600 hover:bg-green-700 cursor-pointer"
                  >
                    Log Cleaning
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
                            <Badge className="bg-blue-100 text-blue-800">
                              {animal.Species}
                            </Badge>
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
                            <p className="text-xs">
                              Health: {animal.Health_Status || 'Good'}
                            </p>
                            {animal.Weight && (
                              <p className="text-xs">
                                Weight: {animal.Weight} lbs
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
                )}
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
                  checked={dialogFedStatus}
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
                {selectedAnimalInfo?.Enclosure_Name}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Marking as:</strong>{" "}
                {dialogFedStatus ? "Fed" : "Care Logged"}
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