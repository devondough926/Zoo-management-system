import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { locations } from "../../data/mockData";
import { LogOut, Users, Building2, BarChart3 } from "lucide-react";
import { ZooLogo } from "../../components/ZooLogo";

const zoneEmployees = [
  { id: "1", name: "Mike Johnson", role: "Zookeeper", status: "On Duty" },
  { id: "2", name: "Sarah Thompson", role: "Veterinarian", status: "On Duty" },
  { id: "3", name: "David Lee", role: "Zookeeper", status: "On Duty" },
  { id: "4", name: "Emily Chen", role: "Maintenance", status: "Break" },
  { id: "5", name: "Robert Garcia", role: "Zookeeper", status: "On Duty" },
];

const zoneAssets = [
  {
    type: "Enclosure",
    name: "African Savanna",
    status: "Operational",
    capacity: "95%",
  },
  {
    type: "Enclosure",
    name: "Predator Pavilion",
    status: "Operational",
    capacity: "88%",
  },
  {
    type: "Attraction",
    name: "Safari Walk",
    status: "Operational",
    visitors: "142 today",
  },
  { type: "Shop", name: "Savanna Gift Shop", status: "Open", sales: "$845" },
  { type: "Stand", name: "Safari Grill", status: "Open", sales: "$2,145" },
];

export function ManagerPortal({ user, onLogout }) {
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
                  <p className="text-sm text-gray-600">Manager Dashboard (Demo disabled)</p>
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

  const myLocation = locations[0]; // In real app, would be based on employee location
  const myZone = `Zone ${myLocation.Zone}`;
  const employeeCount = zoneEmployees.length;

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
                <p className="text-sm text-gray-600">Zone Manager Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium">
                  Welcome, {user.First_Name} {user.Last_Name}
                </p>
                <p className="text-sm text-gray-600">
                  {user.Job_Title?.Title} - {myZone}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={onLogout}
                className="border-green-600 text-green-600"
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
        {/* Zone Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Building2 className="h-8 w-8 text-green-600" />
                <div>
                  <h2 className="text-2xl font-semibold">{myZone}</h2>
                  <p className="text-gray-600">Your Zone</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-green-600" />
                <div>
                  <h2 className="text-2xl font-semibold text-green-600">
                    {employeeCount}
                  </h2>
                  <p className="text-gray-600">Employees in Zone</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-8 w-8 text-green-600" />
                <div>
                  <h2 className="text-2xl font-semibold text-green-600">
                    {zoneAssets.length}
                  </h2>
                  <p className="text-gray-600">Total Assets</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Zone Team */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-green-600" />
                  Zone Team ({employeeCount})
                </CardTitle>
                <Button className="bg-green-600 hover:bg-green-700">
                  View Team
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {zoneEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:border-green-600 transition-colors"
                  >
                    <div>
                      <h3 className="font-medium">{employee.name}</h3>
                      <p className="text-sm text-gray-600">{employee.role}</p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        employee.status === "On Duty"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {employee.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Zone Assets */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-green-600" />
                  Zone Assets ({zoneAssets.length})
                </CardTitle>
                <Button className="bg-green-600 hover:bg-green-700">
                  View Zone Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {zoneAssets.map((asset, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg border hover:border-green-600 transition-colors"
                  >
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {asset.type}
                        </Badge>
                        <h3 className="font-medium">{asset.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        {"capacity" in asset
                          ? `Capacity: ${asset.capacity}`
                          : "visitors" in asset
                          ? asset.visitors
                          : "sales" in asset
                          ? `Sales: ${asset.sales}`
                          : ""}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      {asset.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl text-green-600 mb-2">98%</div>
              <p className="text-gray-700">Zone Operational Status</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl text-green-600 mb-2">$12.5K</div>
              <p className="text-gray-700">Zone Revenue Today</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl text-green-600 mb-2">847</div>
              <p className="text-gray-700">Visitors Today</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl text-green-600 mb-2">3</div>
              <p className="text-gray-700">Pending Tasks</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
