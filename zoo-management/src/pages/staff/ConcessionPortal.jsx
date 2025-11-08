import { useState, useEffect, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
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

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
  // Local state for concession stands fetched from backend
  const [allStands, setAllStands] = useState([]);
  // Selected stand filter ("All" shows all stands)
  const [selectedStand, setSelectedStand] = useState("All");

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

  // Fetch concession stands from backend on mount
  useEffect(() => {
    const fetchStands = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/concession-stands`);
        if (!res.ok) throw new Error("Failed to fetch concession stands");
        const data = await res.json();
        setAllStands(data);
      } catch (err) {
        console.error("❌ Failed to load concession stands:", err);
        toast.error("Failed to load concession stands");
      }
    };
    fetchStands();
  }, []);

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

  // Compute stats from context (purchaseConcessionItems) and menu items.
  // This avoids relying solely on the backend stats endpoint and will update
  // automatically when purchaseConcessionItems or menuItems change.
  useEffect(() => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // All-time revenue
      const allTimeRevenue = purchaseConcessionItems.reduce((sum, rec) => {
        const qty = Number(rec.Quantity ?? rec.quantity ?? 0);
        const price = Number(rec.Unit_Price ?? rec.unit_price ?? 0);
        return sum + qty * price;
      }, 0);

      // Today's purchases
      const purchaseIdsToday = new Set(
        purchases
          .filter((p) => {
            const d = new Date(p.Purchase_Date);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === today.getTime();
          })
          .map((p) => p.Purchase_ID)
      );

      const todaysConcessionItems = purchaseConcessionItems.filter((rec) =>
        purchaseIdsToday.has(rec.Purchase_ID)
      );

      const todayRevenue = todaysConcessionItems.reduce((sum, rec) => {
        const qty = Number(rec.Quantity ?? rec.quantity ?? 0);
        const price = Number(rec.Unit_Price ?? rec.unit_price ?? 0);
        return sum + qty * price;
      }, 0);

      const itemsSoldToday = todaysConcessionItems.reduce((sum, rec) => {
        return sum + (Number(rec.Quantity ?? rec.quantity ?? 0) || 0);
      }, 0);

      // Top selling item today
      const counts = {};
      todaysConcessionItems.forEach((rec) => {
        const id =
          rec.Concession_Item_ID ?? rec.concession_item_id ?? rec.Item_ID;
        const qty = Number(rec.Quantity ?? rec.quantity ?? 0) || 0;
        if (!id) return;
        counts[id] = (counts[id] || 0) + qty;
      });

      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      const topItemToday = top
        ? {
            Item_Name:
              (
                menuItems.find(
                  (m) => String(m.Concession_Item_ID) === String(top[0])
                ) || {}
              ).Item_Name || `Item ${top[0]}`,
            Quantity: Number(top[1]),
          }
        : null;

      setStats({
        todayRevenue: Number(todayRevenue.toFixed(2)),
        allTimeRevenue: Number(allTimeRevenue.toFixed(2)),
        itemsSoldToday,
        topItemToday,
      });
    } catch (err) {
      console.error("Error computing concession stats from context:", err);
      // as a fallback, try to call the backend endpoint so we still surface something
      (async () => {
        try {
          const res = await fetch(`${API_BASE}/stats/concession`);
          if (res.ok) {
            const data = await res.json();
            setStats(data);
          }
        } catch (e) {
          console.error("Fallback stats fetch failed:", e);
        }
      })();
    }
  }, [purchaseConcessionItems, menuItems, purchases]);

  // Fetch purchase concession items from backend and compute top/bottom sellers
  const [purchaseConcessionData, setPurchaseConcessionData] = useState([]);

  useEffect(() => {
    let mounted = true;
    const fetchPurchaseConcessions = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/purchase-concession-items`);
        if (!res.ok)
          throw new Error("Failed to fetch purchase concession items");
        const data = await res.json();
        if (mounted) setPurchaseConcessionData(data);
      } catch (err) {
        console.error("❌ Failed to load purchase concession items:", err);
        // don't spam the user with toasts here; stats already surface errors
      }
    };
    fetchPurchaseConcessions();

    // refresh periodically (30s) to keep dashboard up-to-date
    const interval = setInterval(fetchPurchaseConcessions, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Build sales totals by Concession_Item_ID
  const salesByItemId = useMemo(() => {
    const map = {};
    purchaseConcessionData.forEach((rec) => {
      const id =
        rec.Concession_Item_ID ?? rec.concession_item_id ?? rec.Item_ID;
      const qty = Number(rec.Quantity ?? rec.quantity ?? 0);
      if (!id) return;
      map[id] = (map[id] || 0) + (isNaN(qty) ? 0 : qty);
    });
    return map;
  }, [purchaseConcessionData]);

  // Combine menu items with their total sold counts (default 0 for unsold items)
  const itemsWithSales = useMemo(() => {
    return menuItems.map((it) => ({
      item: it,
      quantity: salesByItemId[it.Concession_Item_ID] || 0,
    }));
  }, [menuItems, salesByItemId]);

  // Top 3 sellers (highest quantity)
  const topItems = useMemo(() => {
    return [...itemsWithSales]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 3)
      .map((t, idx) => ({ ...t, rank: idx + 1 }))
      .filter((t) => t.item);
  }, [itemsWithSales]);

  // Bottom 3 sellers (lowest quantity)
  const bottomItems = useMemo(() => {
    return [...itemsWithSales]
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 3)
      .map((t, idx) => ({ ...t, rank: itemsWithSales.length - idx }))
      .filter((t) => t.item);
  }, [itemsWithSales]);

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

      const res = await fetch(
        `${API_BASE}/food/${editingItem.Concession_Item_ID}`,
        {
          method: "PUT",
          body: formData,
        }
      );

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
      toast.success("Item added!");
    } catch (err) {
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
      const res = await fetch(
        `${API_BASE}/food/${itemToDelete.Concession_Item_ID}`,
        {
          method: "DELETE",
        }
      );

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
      toast.error(err.message || "Failed to delete item");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header
        className="sticky top-0 z-50 shadow-sm border-b transition-colors duration-150 text-white"
        style={{ backgroundColor: "rgba(180, 255, 249)" }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ZooLogo size={64} />
              <div>
                <h1
                  className="font-semibold text-xl text-emerald-600"
                  style={{ color: "#059669" }}
                >
                  Staff Portal
                </h1>
                <p className="text-sm text-gray-600">
                  Concession Stand Dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p
                  className="font-medium text-emerald-600"
                  style={{ color: "#059669" }}
                >
                  Welcome, {user.First_Name} {user.Last_Name}
                </p>
                <p className="text-sm text-gray-600">Concession Worker</p>
              </div>
              <Button
                variant="default"
                size="sm"
                aria-label="View Food Menu"
                onClick={() => navigate("/food")}
                className="bg-green-600 text-white rounded-full px-3 py-1.5 shadow-sm hover:bg-green-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors duration-150"
              >
                <Coffee className="h-4 w-4 mr-2" />
                View Food Menu
              </Button>
              <Button
                variant="default"
                size="sm"
                aria-label="Logout"
                onClick={onLogout}
                className="bg-green-600 text-white rounded-full px-3 py-1.5 shadow-sm hover:bg-green-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors duration-150"
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
              <div className="flex items-center justify-between w-full">
                <CardTitle className="flex items-center">
                  <Coffee className="h-5 w-5 mr-2 text-green-600" />
                  Current Menu (
                  {
                    menuItems.filter((item) =>
                      selectedStand === "All"
                        ? true
                        : String(item.Stand_ID) === String(selectedStand)
                    ).length
                  }{" "}
                  items)
                </CardTitle>

                <div className="flex items-center gap-3">
                  <Select
                    value={selectedStand}
                    onValueChange={(value) => setSelectedStand(value)}
                  >
                    <SelectTrigger className="w-44 cursor-pointer">
                      <SelectValue placeholder="All Stands" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Stands</SelectItem>
                      {allStands.map((s) => (
                        <SelectItem
                          key={s.Stand_ID}
                          value={s.Stand_ID.toString()}
                        >
                          {s.Stand_Name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    className="bg-green-600 hover:bg-green-700 cursor-pointer"
                    onClick={() => setAddDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2 text-white" />
                    Add New Item
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {/** filter menu items by selected stand */}
              {menuItems
                .filter((item) =>
                  selectedStand === "All"
                    ? true
                    : String(item.Stand_ID) === String(selectedStand)
                )
                .map((item) => (
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
                          {allStands.find((s) => s.Stand_ID === item.Stand_ID)
                            ?.Stand_Name || "Unknown Location"}
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
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(item)}
                          className="cursor-pointer border-transparent hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 focus:bg-blue-50 focus:border-blue-300 focus:text-blue-600 transition-colors"
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
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
                        <p className="text-xs text-gray-500">
                          Item #{topItem.item.Concession_Item_ID}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {topItem.quantity} sold
                      </p>
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
                        <p className="text-xs text-gray-500">
                          Item #{bottomItem.item.Concession_Item_ID}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {bottomItem.quantity} sold
                      </p>
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
