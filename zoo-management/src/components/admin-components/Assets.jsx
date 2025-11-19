import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
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
  Calendar,
  Edit,
  Search,
  PawPrint,
  Building2,
  Filter,
  AlertCircle,
  Activity,
  Settings,
} from "lucide-react";
import { PaginationControls } from "../PaginationControls";

export function Assets({
  // Exhibit data and handlers
  allExhibitsDB,
  formatTime,
  handleManageActivities,
  setEditingExhibit,
  isSaving,

  // Animal management
  totalAnimals,
  isAddAnimalOpen,
  setIsAddAnimalOpen,
  handleAddAnimal,
  AddAnimalDialog,

  // Filter and search
  allEnclosures,
  animalExhibitFilter,
  setAnimalExhibitFilter,
  animalSearch,
  setAnimalSearch,
  animalsByExhibit,

  // Utilities
  formatDate,
  setEditingAnimal,

  // Health report
  animalVisibleColumns,
  toggleAnimalColumn,
  healthZoneFilter,
  setHealthZoneFilter,
  healthEnclosureFilter,
  setHealthEnclosureFilter,
  genderFilter,
  setGenderFilter,
  ageFilter,
  setAgeFilter,
  allLocations,
  allAnimalsDB,
  animalSortState,
  toggleAnimalSort,
  enclosureMap,
  displayedAnimals,
  animalCurrentPage,
  animalItemsPerPage,
  animalTotalPages,
  animalPaginationArray,
  handleAnimalPageChange,
}) {
  return (
    <>
      {/* Exhibit Management Section */}
      <section id="exhibits">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl text-gray-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-indigo-600" /> Exhibit Management
          </h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm mb-4">Manage zoo exhibits and displays</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {allExhibitsDB.map((exhibit) => (
                <Card
                  key={exhibit.Exhibit_ID}
                  className="p-4 bg-gray-100 border-2 border-gray-200"
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
                            className="text-xs bg-green-50 text-green-700 border-green-200"
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
                          <span>
                            • Activity Scheduled for{" "}
                            {formatTime(exhibit.Display_Time)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleManageActivities(exhibit)}
                        className="cursor-pointer text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        disabled={isSaving}
                        title="Manage Activities"
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
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

      {/* Animal Management Section */}
      <section id="animals">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl text-gray-900 flex items-center gap-2">
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
                <Label htmlFor="exhibit-filter" className="mb-2">
                  Filter by Exhibit
                </Label>
                <Select
                  value={
                    animalExhibitFilter === ""
                      ? ""
                      : animalExhibitFilter === "All"
                      ? "All"
                      : animalExhibitFilter.toString()
                  }
                  onValueChange={(value) =>
                    setAnimalExhibitFilter(
                      value === "All"
                        ? "All"
                        : value === "__NONE__"
                        ? ""
                        : value === ""
                        ? ""
                        : parseInt(value)
                    )
                  }
                >
                  <SelectTrigger id="exhibit-filter" className="cursor-pointer">
                    <SelectValue
                      placeholder="Select an exhibit"
                      className="text-italic"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="__NONE__"
                      className="text-muted-foreground"
                    >
                      No selection . . .
                    </SelectItem>
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
              {animalExhibitFilter && animalExhibitFilter !== "All" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAnimalExhibitFilter("")}
                  className="cursor-pointer mt-6"
                >
                  Clear Filter
                </Button>
              ) : (
                <div className="flex items-center gap-2 mt-6">
                  <Filter className="h-5 w-5 text-gray-600" />
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
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search by ID, or keywords"
                  value={animalSearch}
                  onChange={(e) => setAnimalSearch(e.target.value)}
                  className="w-64"
                />
                <Search className="h-4 w-4 text-gray-500" />
              </div>
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
                      className="overflow-hidden outline-1 border-teal-100"
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
                            const dateAddedString = animal.Date_Added
                              ? formatDate(animal.Date_Added)
                              : "N/A";

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
                                      Weight:{" "}
                                      {isFinite(Number(animal.Weight))
                                        ? Number(animal.Weight).toFixed(2)
                                        : animal.Weight}{" "}
                                      lbs • Born: {formatDate(animal.Birthday)}
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
                      {animalExhibitFilter
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
    </>
  );
}
