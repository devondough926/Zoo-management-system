import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { concessionStands } from "../../data/mockData";
import {
  LogOut,
  Plus,
  Coffee,
  DollarSign,
  Edit2,
  Upload,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ZooLogo } from "../../components/ZooLogo";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { useData } from "../../data/DataContext";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

export function ConcessionPortal({ user, onLogout }) {
  const navigate = useNavigate();
  const {
    concessionItems: menuItemsFromContext,
    addConcessionItem,
    updateConcessionItem,
    deleteConcessionItem,
    purchases,
    purchaseConcessionItems,
  } = useData();
  
  // Local state for menu items fetched from backend
  const [menuItems, setMenuItems] = useState([]);
  
  // Fetch menu items from backend on mount and when menuItemsFromContext changes
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch(`${API_BASE}/food`);
        if (!res.ok) throw new Error("Failed to fetch menu");
        const data = await res.json();
        setMenuItems(data);
      } catch (err) {
        console.error("❌ Failed to load menu:", err);
        toast.error("Failed to load food items");
      }
    };
    fetchMenu();
  }, []); // Only fetch on mount
  
  // All concession stands under management (Concession Worker manages all 4 stands)
  const allStands = concessionStands;
  const [showRevenueAllTime, setShowRevenueAllTime] = useState(false);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    imageFile: null,
  });

  // Add dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    price: "",
    standId: "1",
    imageFile: null,
  });

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Stats state for real backend data
  const [stats, setStats] = useState({
    todayRevenue: 0,
    allTimeRevenue: 0,
    itemsSoldToday: 0,
    topItemToday: null,
  });

  // Fetch stats from backend on mount and periodically
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/stats/concession`);
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("❌ Failed to load stats:", err);
        toast.error("Failed to load statistics");
      }
    };

    // Fetch immediately
    fetchStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);

    return () => clearInterval(interval);
  }, []);

  // Top selling items with mock quantities (top 3 only)
  // Note: These are still using mock data for the "Top 3 Selling Items" section
  // The "Top-Selling Item Today" card uses real data from stats.topItemToday
  const topItems = [
    { item: menuItems[17], quantity: 189, rank: 1 }, // Spaghetti & Meatballs
    { item: menuItems[0], quantity: 167, rank: 2 }, // Classic Cheeseburger
    { item: menuItems[6], quantity: 154, rank: 3 }, // Chocolate Sundae
  ].filter((t) => t.item); // Filter out any undefined items

  // Bottom selling items with mock quantities (bottom 3 only)
  const totalItemCount = menuItems.length;
  const bottomItems = [
    { item: menuItems[19], quantity: 23, rank: totalItemCount }, // Italian Sub - last place
    { item: menuItems[13], quantity: 31, rank: totalItemCount - 1 }, // Green Smoothie - 2nd to last
    { item: menuItems[8], quantity: 38, rank: totalItemCount - 2 }, // Frozen Lemonade - 3rd to last
  ].filter((t) => t.item); // Filter out any undefined items

  const handleEditClick = (item) => {
    setEditingItem(item);
    setEditForm({
      name: item.Item_Name,
      price: item.Price.toString(),
      imageFile: null,
    });
    setEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingItem) return;

    if (!editForm.name || !editForm.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("Item_Name", editForm.name);
      formData.append("Price", editForm.price);
      if (editForm.imageFile) {
        formData.append("image", editForm.imageFile);
      }

      const res = await fetch(`${API_BASE}/food/${editingItem.Concession_Item_ID}`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Update failed");
      }

      // Refresh menu to get updated Image_URL from backend
      const updated = await fetch(`${API_BASE}/food`);
      const newList = await updated.json();
      setMenuItems(newList);

      setEditDialogOpen(false);
      toast.success("Item updated successfully!");
    } catch (err) {
      console.error("❌ Error updating item:", err);
      toast.error(err.message || "Failed to update item");
    }
  };

  const handleAddItem = async () => {
    if (!addForm.name || !addForm.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("Item_Name", addForm.name);
      formData.append("Price", addForm.price);
      formData.append("Stand_ID", addForm.standId);
      if (addForm.imageFile) {
        formData.append("image", addForm.imageFile);
      }

      const res = await fetch(`${API_BASE}/food`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Upload failed");
      }

      // Refresh menu to get the new item with Image_URL from backend
      const updated = await fetch(`${API_BASE}/food`);
      const newList = await updated.json();
      setMenuItems(newList);

      setAddDialogOpen(false);
      setAddForm({ name: "", price: "", standId: "1", imageFile: null });
      toast.success("✅ Item added!");
    } catch (err) {
      console.error("❌ Error adding item:", err);
      toast.error(err.message || "Failed to add item");
    }
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      const res = await fetch(`${API_BASE}/food/${itemToDelete.Concession_Item_ID}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Delete failed");
      }

      // Refresh menu to reflect deletion
      const updated = await fetch(`${API_BASE}/food`);
      const newList = await updated.json();
      setMenuItems(newList);

      setDeleteDialogOpen(false);
      setItemToDelete(null);
      toast.success("Item removed successfully!");
    } catch (err) {
      console.error("❌ Error deleting item:", err);
      toast.error(err.message || "Failed to delete item");
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
                <p className="text-sm text-gray-600">
                  Concession Stand Dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium">
                  Welcome, {user.First_Name} {user.Last_Name}
                </p>
                <p className="text-sm text-gray-600">Concession Worker</p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate("/food")}
                className="border-teal-600 text-teal-600 cursor-pointer"
              >
                <Coffee className="h-4 w-4 mr-2" />
                View Food Menu
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

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        {/* Stats Dashboard - Moved to Top */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-6 w-6 text-green-600" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRevenueAllTime(!showRevenueAllTime)}
                  className="text-xs cursor-pointer"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {showRevenueAllTime ? "Today" : "All Time"}
                </Button>
              </div>
              <div className="text-3xl text-green-600 mb-2">
                $
                {showRevenueAllTime
                  ? stats.allTimeRevenue.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })
                  : stats.todayRevenue.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
              </div>
              <p className="text-gray-700">
                {showRevenueAllTime ? "All-Time Revenue" : "Today's Revenue"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl text-green-600 mb-2">
                {stats.itemsSoldToday}
              </div>
              <p className="text-gray-700">Items Sold Today</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              {stats.topItemToday ? (
                <>
                  <div className="text-2xl text-green-600 mb-2">
                    {stats.topItemToday.Item_Name}
                  </div>
                  <p className="text-gray-700">Top-Selling Item Today</p>
                  <p className="text-sm text-gray-500">
                    ({stats.topItemToday.Quantity} sold)
                  </p>
                </>
              ) : (
                <>
                  <div className="text-2xl text-green-600 mb-2">N/A</div>
                  <p className="text-gray-700">Top-Selling Item Today</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Current Menu */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Coffee className="h-5 w-5 mr-2 text-green-600" />
                Current Menu ({menuItems.length} items)
              </CardTitle>
              <Button
                className="bg-green-600 hover:bg-green-700 cursor-pointer"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {menuItems.map((item) => (
                <div
                  key={item.Concession_Item_ID}
                  className="flex items-center justify-between p-4 rounded-lg border hover:border-green-600 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {item.Image_URL ? (
                        <ImageWithFallback
                          src={item.Image_URL}
                          alt={item.Item_Name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Coffee className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{item.Item_Name}</h3>
                      <p className="text-sm text-gray-600">
                        {concessionStands.find(
                          (s) => s.Stand_ID === item.Stand_ID
                        )?.Stand_Name || "Unknown Location"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-green-600">
                        ${parseFloat(item.Price || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(item)}
                        className="cursor-pointer"
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(item)}
                        className="cursor-pointer border-red-600 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Selling Items Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Top Selling Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Top 3 Selling Items
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topItems.map((topItem) => (
                  <div
                    key={topItem.item.Concession_Item_ID}
                    className="flex items-center justify-between p-4 rounded-lg border hover:border-green-600 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600 font-bold">
                        #{topItem.rank}
                      </div>
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {topItem.item.Image_URL ? (
                          <ImageWithFallback
                            src={topItem.item.Image_URL}
                            alt={topItem.item.Item_Name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Coffee className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">
                          {topItem.item.Item_Name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {topItem.quantity} sold
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Bottom Selling Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-red-600 transform rotate-180" />
                  Bottom 3 Selling Items
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {bottomItems.map((bottomItem) => (
                  <div
                    key={bottomItem.item.Concession_Item_ID}
                    className="flex items-center justify-between p-4 rounded-lg border hover:border-red-600 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600 font-bold">
                        #{bottomItem.rank}
                      </div>
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {bottomItem.item.Image_URL ? (
                          <ImageWithFallback
                            src={bottomItem.item.Image_URL}
                            alt={bottomItem.item.Item_Name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Coffee className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">
                          {bottomItem.item.Item_Name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {bottomItem.quantity} sold
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
            <DialogDescription>
              Update the details of this menu item.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Item Name *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                placeholder="Enter item name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price *</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={editForm.price}
                onChange={(e) =>
                  setEditForm({ ...editForm, price: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-image">Image File (Optional)</Label>
              <Input
                id="edit-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setEditForm({ ...editForm, imageFile: file });
                }}
              />
              <p className="text-sm text-gray-500">
                Upload a new image to replace the current one (optional)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              className="bg-green-600 hover:bg-green-700"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Item Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Menu Item</DialogTitle>
            <DialogDescription>
              Add a new item to the concession stand menu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Item Name *</Label>
              <Input
                id="add-name"
                value={addForm.name}
                onChange={(e) =>
                  setAddForm({ ...addForm, name: e.target.value })
                }
                placeholder="Enter item name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-price">Price *</Label>
              <Input
                id="add-price"
                type="number"
                step="0.01"
                value={addForm.price}
                onChange={(e) =>
                  setAddForm({ ...addForm, price: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-location">Location *</Label>
              <select
                id="add-location"
                value={addForm.standId}
                onChange={(e) =>
                  setAddForm({ ...addForm, standId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                {allStands.map((stand) => (
                  <option key={stand.Stand_ID} value={stand.Stand_ID}>
                    {stand.Stand_Name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-image">Image File (Optional)</Label>
              <Input
                id="add-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setAddForm({ ...addForm, imageFile: file });
                }}
              />
              <p className="text-sm text-gray-500">
                Upload an image for the item (optional)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddItem}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.Item_Name}" from
              the menu? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
