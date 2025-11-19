import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { ScrollArea } from "../ui/scroll-area";
import {
  Users,
  Trash2,
  Eye,
  Edit,
  Search,
  Save,
  Map,
  DollarSign,
} from "lucide-react";

export function Operations({
  allLocations,
  allEmployees,
  getZoneEmployees,
  abbreviateNorth,
  formatDate,
  setViewZoneEmployees,
  viewZoneEmployees,
  setSelectedZone,
  setIsManageZoneOpen,
  setSupervisorSearch,
  allJobTitles,
  salaries,
  handleJobSalaryDialogOpen,
  isJobSalaryOpen,
  selectedJobId,
  tempJobSalary,
  setTempJobSalary,
  handleJobSalarySave,
  isSaving,
  staffSearch,
  setStaffSearch,
  sortedEmployees,
  isSupervisor,
  getEmployeeTitle,
  getEmployeeZone,
  setEditingEmployee,
  setDeleteConfirmEmployee,
  isManageZoneOpen,
  selectedZone,
  supervisorSearch,
  filteredEmployeesForSupervisor,
  setPendingSupervisor,
  handleAssignSupervisor,
  deleteConfirmEmployee,
  handleDeleteEmployee,
  pendingSupervisor,
  editingEmployee,
  handleUpdateEmployee,
  EditEmployeeDialog,
  isAddEmployeeOpen,
  setIsAddEmployeeOpen,
  handleAddEmployee,
  AddEmployeeDialog,
  staffJobFilter,
  setStaffJobFilter,
}) {
  return (
    <>
      <section id="zones">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl text-gray-900 flex items-center gap-2">
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
                    className="relative p-4 bg-teal-50 rounded-lg shadow-sm"
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: 0,
                        height: 6,
                        background:
                          "linear-gradient(to bottom,#0ea5a4,#34d399)",
                        borderTopLeftRadius: "0.5rem",
                        borderTopRightRadius: "0.5rem",
                      }}
                    />
                    {/* Zone initial badge top-right */}
                    <div className="absolute top-4 right-4 h-8 w-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold">
                      {String(location.Zone).charAt(0) || "?"}
                    </div>

                    {/* Description as the bold heading with view icon; Employees count below on the left */}
                    <div className="mb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg text-slate-900 max-w-[420px]">
                            {abbreviateNorth(location.Location_Description)}
                          </h3>
                        </div>
                      </div>

                      <p className="text-sm text-slate-700 mt-2">
                        <span className="font-medium">Employees:</span>{" "}
                        <span className="text-slate-600 inline-flex items-center">
                          {zoneEmployees.length}
                          <button
                            type="button"
                            onClick={() => setViewZoneEmployees(location)}
                            className="ml-2 p-1 rounded hover:bg-teal-100 text-teal-600 cursor-pointer"
                            aria-label={`View zone ${location.Zone} employees`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </span>
                      </p>
                    </div>

                    {/* Centered supervisor label + name (name larger) with edit button next to the name */}
                    <div className="flex flex-col items-center mb-2 text-center">
                      <p className="text-sm font-medium text-slate-700">
                        Supervisor:
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-base font-semibold text-slate-900">
                          {supervisor
                            ? `${supervisor.First_Name} ${supervisor.Last_Name}`
                            : "Unassigned"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedZone(location);
                            setIsManageZoneOpen(true);
                            setSupervisorSearch("");
                          }}
                          className="p-1 rounded text-purple-600 cursor-pointer"
                          aria-label={`Change supervisor for zone ${location.Zone}`}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
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
                {abbreviateNorth(viewZoneEmployees?.Location_Description)}
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
          <h2 className="text-2xl text-gray-900 flex items-center gap-2">
            <DollarSign className="h-6 w-6" /> Salary Management
          </h2>
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
                      className="p-4 bg-blue-50 rounded-lg relative"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium mb-2">{displayTitle}</h3>
                          <p className="text-2xl font-semibold text-blue-600 mb-1">
                            ${avgSalary.toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleJobSalaryDialogOpen(true, job.Job_ID)
                          }
                          className="ml-4 p-1 rounded cursor-pointer"
                          aria-label={`Edit ${displayTitle} salary`}
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Per-job Salary Dialog (opened from each job's Edit icon) */}
        <Dialog
          open={isJobSalaryOpen}
          onOpenChange={(open) =>
            // preserve selectedJobId when opening; clear when closing
            handleJobSalaryDialogOpen(open, open ? selectedJobId : null)
          }
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                Edit{" "}
                {selectedJobId
                  ? selectedJobId === 2
                    ? "Supervisor"
                    : allJobTitles.find((j) => j.Job_ID === selectedJobId)
                        ?.Title
                  : "Salary"}
              </DialogTitle>
              <DialogDescription>
                Set the salary for this role. This will update all employees in
                that role.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">$</span>
                <Input
                  type="number"
                  step="1000"
                  value={tempJobSalary}
                  onChange={(e) =>
                    setTempJobSalary(parseFloat(e.target.value) || 0)
                  }
                  className="w-40"
                />
                <span className="text-gray-600">/year</span>
              </div>
              <Button
                onClick={handleJobSalarySave}
                className="bg-green-600 hover:bg-green-700 cursor-pointer"
                disabled={
                  isSaving ||
                  (selectedJobId
                    ? parseFloat(tempJobSalary || 0) ===
                      parseFloat(salaries[selectedJobId] || 0)
                    : true)
                }
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </section>

      {/* Employee Management */}
      <section id="employees">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl text-gray-900 flex items-center gap-2">
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
              <div className="flex items-center gap-3">
                <Select
                  value={staffJobFilter}
                  onValueChange={setStaffJobFilter}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by job title" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      className="text-popover-foreground"
                      value="No Selection"
                    >
                      No Selection
                    </SelectItem>
                    <SelectItem
                      className="text-popover-foreground"
                      value="None"
                    >
                      All
                    </SelectItem>
                    {allJobTitles
                      .filter((job) => job.Job_ID !== 1)
                      .map((job) => (
                        <SelectItem
                          className="text-popover-foreground"
                          key={job.Job_ID}
                          value={job.Job_ID.toString()}
                        >
                          {job.Title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
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
            </div>
            {sortedEmployees.length > 0 ? (
              <ScrollArea className="pr-4" height={600}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sortedEmployees.map((emp) => (
                    <div
                      key={emp.Employee_ID}
                      className="w-full flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
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
            ) : (
              <div className="space-y-3">
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg text-gray-600">No employees found</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {staffSearch.trim()
                      ? `No employees match "${staffSearch}"`
                      : "No employees in the system"}
                  </p>
                </div>
              </div>
            )}
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
                `Select a supervisor for Zone ${
                  selectedZone.Zone
                }: ${abbreviateNorth(selectedZone.Location_Description)}`}
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
                  onClick={() => selectedZone && setPendingSupervisor(employee)}
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

      {/* Confirm Supervisor Assignment */}
      <AlertDialog
        open={pendingSupervisor !== null}
        onOpenChange={() => setPendingSupervisor(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign Supervisor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to assign
              <strong>
                {" "}
                {pendingSupervisor?.First_Name} {pendingSupervisor?.Last_Name}
              </strong>{" "}
              as the supervisor for Zone {selectedZone?.Zone}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer" disabled={isSaving}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedZone && pendingSupervisor) {
                  handleAssignSupervisor(
                    selectedZone.Location_ID,
                    pendingSupervisor.Employee_ID
                  );
                }
                setPendingSupervisor(null);
              }}
              className="bg-green-600 hover:bg-green-700 cursor-pointer"
              disabled={isSaving}
            >
              Confirm
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
    </>
  );
}
