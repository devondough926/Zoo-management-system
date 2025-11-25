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
  Box,
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

      // Top selling item today - aggregate by Item_Name to handle deleted/re-added items
      const counts = {};
      todaysConcessionItems.forEach((rec) => {
        const name = rec.Item_Name || "Unknown";
        const qty = Number(rec.Quantity ?? rec.quantity ?? 0) || 0;
        if (!name) return;
        counts[name] = (counts[name] || 0) + qty;
      });

      const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      const topItemToday = top
        ? {
            Item_Name: top[0],
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

  // Build sales totals by Item_Name (not by ID) to handle items that were deleted and re-added
  // This ensures we aggregate all sales for items with the same name, regardless of ID changes
  const salesByItemName = useMemo(() => {
    const map = {};
    purchaseConcessionItems.forEach((rec) => {
      const name = rec.Item_Name || "Unknown";
      const qty = Number(rec.Quantity ?? rec.quantity ?? 0);
      if (!name) return;
      map[name] = (map[name] || 0) + (isNaN(qty) ? 0 : qty);
    });
    return map;
  }, [purchaseConcessionItems]);

  // Combine menu items with their total sold counts (default 0 for unsold items)
  // Map by Item_Name to get cumulative sales across all versions of the item
  const itemsWithSales = useMemo(() => {
    return menuItems.map((it) => ({
      item: it,
      quantity: salesByItemName[it.Item_Name] || 0,
    }));
  }, [menuItems, salesByItemName]);

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
    <div className="min-h-screen bg-gray-100">
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
                  Welcome, {user.First_Name}
                </p>
                <p className="text-sm text-gray-600">{user.Last_Name}</p>
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
          <Card
            className="bg-white"
            style={{
              borderLeft: "4px solid #16a34a",
              background: "linear-gradient(90deg,#d1fae5 0%, #ffffff 100%)",
              overflow: "hidden",
            }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {showRevenueAllTime
                      ? "All-Time Revenue"
                      : "Today's Revenue"}
                  </p>
                  <p className="text-3xl text-green-600">
                    $
                    {showRevenueAllTime
                      ? stats.allTimeRevenue.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })
                      : stats.todayRevenue.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRevenueAllTime(!showRevenueAllTime)}
                    className="text-xs inline-flex items-center gap-1 px-2 py-1 rounded-full border border-transparent hover:bg-white/60 hover:border-gray-200 shadow-sm transition-colors"
                    aria-pressed={showRevenueAllTime}
                    title={
                      showRevenueAllTime
                        ? "Showing All-Time — click to switch to Today"
                        : "Showing Today — click to switch to All-Time"
                    }
                  >
                    <TrendingUp className="h-3 w-3" />
                    <span className="ml-1">
                      {showRevenueAllTime ? "Today" : "All Time"}
                    </span>
                  </Button>
                  <DollarSign
                    className="h-10 w-10"
                    style={{ color: "rgba(16,163,74,0.16)" }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="bg-white"
            style={{
              borderLeft: "4px solid #10b981",
              background: "linear-gradient(90deg,#f0fdf4 0%, #ffffff 100%)",
              overflow: "hidden",
            }}
          >
            <CardContent className="pt-6 text-center relative">
              <p className="text-sm text-gray-600">Items Sold Today</p>
              <p className="text-3xl text-green-600">{stats.itemsSoldToday}</p>
              <Box
                className="h-10 w-10 absolute right-4 top-4"
                style={{ color: "rgba(16,185,129,0.14)" }}
              />
            </CardContent>
          </Card>

          <Card
            className="bg-white"
            style={{
              borderLeft: "4px solid #0d9488",
              background: "linear-gradient(90deg,#ecfeff 0%, #ffffff 100%)",
              overflow: "hidden",
            }}
          >
            <CardContent className="pt-6 text-center relative">
              <p className="text-sm text-gray-600">Top-Selling Item Today</p>
              {stats.topItemToday ? (
                <p className="text-2xl text-teal-600">
                  {stats.topItemToday.Item_Name}
                </p>
              ) : (
                <p className="text-2xl text-teal-600">N/A</p>
              )}
              <p className="text-sm text-gray-500">
                {stats.topItemToday
                  ? `(${stats.topItemToday.Quantity} sold)`
                  : ""}
              </p>
              <Coffee
                className="h-10 w-10 absolute right-4 top-4"
                style={{ color: "rgba(13,148,136,0.16)" }}
              />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
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
                          aria-label="Edit item"
                        >
                          <Edit2 className="h-4 w-4" />
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
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "1rem",
                      borderRadius: "0.5rem",
                      background:
                        "linear-gradient(90deg,#d1fae5 0%, #ffffff 100%)",
                      border: "1px solid transparent",
                      transition: "border-color .15s ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 32,
                          height: 32,
                          borderRadius: 9999,
                          background: "#d1fae5",
                          color: "#16a34a",
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          flexShrink: 0,
                        }}
                      >
                        #{topItem.rank}
                      </div>
                      <div
                        style={{
                          width: 80,
                          height: 80,
                          background: "#f3f4f6",
                          borderRadius: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          flexShrink: 0,
                          padding: 8,
                        }}
                      >
                        {topItem.item.Image_URL ? (
                          <ImageWithFallback
                            src={topItem.item.Image_URL}
                            alt={topItem.item.Item_Name}
                            className="w-full h-full object-contain"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <Coffee className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3
                          style={{
                            fontWeight: 500,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {topItem.item.Item_Name}
                        </h3>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#6b7280",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Item #{topItem.item.Concession_Item_ID}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "0.875rem", color: "#374151" }}>
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
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "1rem",
                      borderRadius: "0.5rem",
                      background:
                        "linear-gradient(90deg,#fee2e2 0%, #ffffff 100%)",
                      border: "1px solid transparent",
                      transition: "border-color .15s ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 32,
                          height: 32,
                          borderRadius: 9999,
                          background: "#fee2e2",
                          color: "#dc2626",
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          flexShrink: 0,
                        }}
                      >
                        #{bottomItem.rank}
                      </div>
                      <div
                        style={{
                          width: 80,
                          height: 80,
                          background: "#f3f4f6",
                          borderRadius: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          flexShrink: 0,
                          padding: 8,
                        }}
                      >
                        {bottomItem.item.Image_URL ? (
                          <ImageWithFallback
                            src={bottomItem.item.Image_URL}
                            alt={bottomItem.item.Item_Name}
                            className="w-full h-full object-contain"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <Coffee className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3
                          style={{
                            fontWeight: 500,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {bottomItem.item.Item_Name}
                        </h3>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#6b7280",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Item #{bottomItem.item.Concession_Item_ID}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "0.875rem", color: "#374151" }}>
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
