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
import {
  LogOut,
  Plus,
  ShoppingBag,
  DollarSign,
  Edit2,
  Upload,
  TrendingUp,
  Trash2,
  Box,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { toast } from "sonner";
import { ZooLogo } from "../../components/ZooLogo";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { useData } from "../../data/DataContext";

const giftShopCategories = [
  "Accessories & Souvenirs",
  "Apparel",
  "Toys & Plushies",
  "Decorations & Others",
];

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export function GiftShopPortal({ user, onLogout, onNavigate }) {
  const navigate = useNavigate();
  const {
    items: shopItems,
    addItem,
    updateItem,
    deleteItem,
    refreshItems,
    purchases,
    purchaseItems,
  } = useData();

  const [allShops, setAllShops] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showRevenueAllTime, setShowRevenueAllTime] = useState(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    category: giftShopCategories[0],
    imageFile: null,
  });

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    price: "",
    category: giftShopCategories[0],
    imageFile: null,
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // State for analytics data
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [itemsSoldToday, setItemsSoldToday] = useState(0);
  const [topSellingToday, setTopSellingToday] = useState(null);
  const [topItems, setTopItems] = useState([]);
  const [bottomItems, setBottomItems] = useState([]);
  const [allTimeRevenue, setAllTimeRevenue] = useState(0);

  // Fetch analytics data from backend
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const revenueResponse = await fetch(
          `${API_BASE}/shop/analytics/revenue/today`
        );
        if (revenueResponse.ok) {
          const data = await revenueResponse.json();
          setTodayRevenue(parseFloat(data.todayRevenue));
          setItemsSoldToday(parseInt(data.itemsSoldToday));
        }

        // Fetch top selling items (all time)
        const topSellingResponse = await fetch(
          `${API_BASE}/shop/analytics/top-selling`
        );
        if (topSellingResponse.ok) {
          const data = await topSellingResponse.json();
          setTopItems(
            data.map((item, index) => ({
              item: {
                Item_ID: item.Item_ID,
                Item_Name: item.Item_Name,
                Price: item.Price,
                Category: item.Category,
                Image_URL: item.Image_URL,
              },
              quantity: parseInt(item.totalSold),
              rank: index + 1,
            }))
          );
        }

        // Fetch top selling item today
        const topTodayResponse = await fetch(
          `${API_BASE}/shop/analytics/top-selling-today`
        );
        if (topTodayResponse.ok) {
          const data = await topTodayResponse.json();
          if (data.Item_Name) {
            setTopSellingToday({
              item: { Item_Name: data.Item_Name },
              quantity: parseInt(data.soldToday),
            });
          }
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }
    };
    // Try fetching analytics; if that fails or returns no data, compute from local context
    const tryFetchOrCompute = async () => {
      let fetched = false;
      try {
        await fetchAnalytics();
        fetched = true;
      } catch (err) {
        console.error(
          "Analytics fetch failed, will compute from context:",
          err
        );
      }

      // If fetch didn't populate values (or returned zeros), compute from purchases/purchaseItems
      const isTodayRevenueEmpty =
        !todayRevenue ||
        Number.isNaN(Number(todayRevenue)) ||
        todayRevenue === 0;
      const isItemsSoldEmpty = !itemsSoldToday || itemsSoldToday === 0;

      if (!fetched || (isTodayRevenueEmpty && isItemsSoldEmpty)) {
        try {
          // compute from purchases + purchaseItems provided by DataContext
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const purchaseIdsToday = new Set(
            purchases
              .filter((p) => {
                const d = new Date(p.Purchase_Date);
                d.setHours(0, 0, 0, 0);
                return d.getTime() === today.getTime();
              })
              .map((p) => p.Purchase_ID)
          );

          let revenue = 0;
          let itemsSold = 0;
          const soldById = {};

          purchaseItems.forEach((pi) => {
            if (!purchaseIdsToday.has(pi.Purchase_ID)) return;
            // skip sentinel IDs (mirrors backend behavior)
            if (pi.Item_ID === 9000) return;
            const qty = Number(pi.Quantity || 0);
            const price = Number(pi.Unit_Price || 0);
            revenue += qty * price;
            itemsSold += qty;
            soldById[pi.Item_ID] = (soldById[pi.Item_ID] || 0) + qty;
          });

          setTodayRevenue(Number(revenue.toFixed(2)));
          setItemsSoldToday(itemsSold);

          // derive top selling today from soldById
          const topEntry = Object.entries(soldById).sort(
            (a, b) => b[1] - a[1]
          )[0];
          if (topEntry) {
            const id = Number(topEntry[0]);
            const qty = Number(topEntry[1]);
            const item = shopItems.find((it) => it.Item_ID === id) || {
              Item_Name: `Item ${id}`,
            };
            setTopSellingToday({
              item: { Item_Name: item.Item_Name },
              quantity: qty,
            });
          }
        } catch (err) {
          console.error("Error computing analytics from context:", err);
        }
      }
    };

    tryFetchOrCompute();
  }, [shopItems, purchases, purchaseItems]);

  // Calculate all-time revenue from purchases
  useEffect(() => {
    const revenue = purchaseItems
      .filter((pi) => pi.Item_ID !== 9000)
      .reduce((sum, pi) => sum + pi.Unit_Price * pi.Quantity, 0);
    setAllTimeRevenue(revenue);
  }, [purchaseItems]);

  // Compute Top 3 and Bottom 3 selling items from local context (purchaseItems + shopItems)
  // Aggregate by Item_Name to handle items that were deleted and re-added
  useEffect(() => {
    try {
      // Build counts for each item name (not ID) to persist sales across delete/re-add
      const counts = {};
      purchaseItems.forEach((pi) => {
        const name = pi.Item_Name || pi.item_name || "Unknown";
        if (!name) return;
        const qty = Number(pi.Quantity ?? pi.quantity ?? 0) || 0;
        counts[name] = (counts[name] || 0) + qty;
      });

      // Map shop items to include computed quantity (default 0)
      const itemsWithCounts = shopItems.map((it) => ({
        item: it,
        quantity: counts[it.Item_Name] || 0,
      }));

      // Top 3 (most sold)
      const sortedDesc = [...itemsWithCounts].sort(
        (a, b) => b.quantity - a.quantity
      );
      const top3 = sortedDesc
        .slice(0, 3)
        .map((t, i) => ({ ...t, rank: i + 1 }));
      setTopItems(top3);

      // Bottom 3 (least sold) — include zero-sales items
      const sortedAsc = [...itemsWithCounts].sort(
        (a, b) => a.quantity - b.quantity
      );
      const bottom3 = sortedAsc.slice(0, 3).map((t, i) => ({
        ...t,
        rank: Math.max(shopItems.length - i, 1),
      }));
      setBottomItems(bottom3);
    } catch (err) {
      console.error("Error computing top/bottom items:", err);
      setTopItems([]);
      setBottomItems([]);
    }
  }, [shopItems, purchaseItems]);

  const topSellingItemToday = topSellingToday;

  const handleEditClick = (item) => {
    setEditingItem(item);
    setEditForm({
      name: item.Item_Name,
      price: item.Price.toString(),
      category: item.Category || giftShopCategories[0],
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
      // First update the item details
      const updatedItem = await updateItem(editingItem.Item_ID, {
        Item_Name: editForm.name,
        Price: parseFloat(editForm.price),
        Category: editForm.category,
      });

      // If there's an image file, upload it
      if (editForm.imageFile) {
        const formData = new FormData();
        formData.append("image", editForm.imageFile);

        const response = await fetch(
          `${API_BASE}/shop/items/${editingItem.Item_ID}/upload-image`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to upload image");
        }

        const itemWithImage = await response.json();

        // Update the item in the list with the new image URL
        await updateItem(editingItem.Item_ID, {
          Image_URL: itemWithImage.Image_URL,
        });
      }

      setEditDialogOpen(false);
      toast.success("Item updated successfully!");
    } catch (error) {
      toast.error("Failed to update item. Please try again.");
      console.error("Error updating item:", error);
    }
  };

  const handleAddItem = async () => {
    if (!addForm.name || !addForm.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    const newItem = {
      Item_Name: addForm.name,
      Price: parseFloat(addForm.price),
      Category: addForm.category,
      Shop_ID: 1,
    };

    try {
      const createdItem = await addItem(newItem);

      // If there's an image file, upload it
      if (addForm.imageFile && createdItem && createdItem.Item_ID) {
        const formData = new FormData();
        formData.append("image", addForm.imageFile);

        await fetch(
          `${API_BASE}/shop/items/${createdItem.Item_ID}/upload-image`,
          {
            method: "POST",
            body: formData,
          }
        );

        // Refresh the items list to show the new image
        await refreshItems();
      }

      setAddDialogOpen(false);
      setAddForm({
        name: "",
        price: "",
        category: giftShopCategories[0],
        imageFile: null,
      });

      toast.success("New item added successfully!");
    } catch (error) {
      toast.error("Failed to add item. Please try again.");
      console.error("Error adding item:", error);
    }
  };
  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      await deleteItem(itemToDelete.Item_ID);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      toast.success("Item removed successfully!");
    } catch (error) {
      toast.error("Failed to delete item. Please try again.");
      console.error("Error deleting item:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
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
                <p className="text-sm text-gray-600">Gift Shop Dashboard</p>
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
                aria-label="View Gift Shop"
                onClick={() =>
                  onNavigate ? onNavigate("shop") : navigate("/shop")
                }
                className="bg-green-600 text-white rounded-full px-3 py-1.5 shadow-sm hover:bg-green-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors duration-150"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                View Gift Shop
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

      <div className="container mx-auto px-6 py-12">
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
                      ? allTimeRevenue.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })
                      : todayRevenue.toLocaleString("en-US", {
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
              <p className="text-3xl text-green-600">{itemsSoldToday}</p>
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
              {topSellingItemToday ? (
                <p className="text-2xl text-teal-600">
                  {topSellingItemToday.item.Item_Name}
                </p>
              ) : (
                <p className="text-2xl text-teal-600">N/A</p>
              )}
              <p className="text-sm text-gray-500">
                {topSellingItemToday
                  ? `(${topSellingItemToday.quantity} sold)`
                  : ""}
              </p>
              <ShoppingBag
                className="h-10 w-10 absolute right-4 top-4"
                style={{ color: "rgba(13,148,136,0.16)" }}
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <ShoppingBag className="h-5 w-5 mr-2 text-green-600" />
                Current Inventory ({shopItems.length} items)
              </CardTitle>
              <div className="flex items-center gap-3">
                <Select
                  value={selectedCategory}
                  onValueChange={(v) => setSelectedCategory(v)}
                >
                  <SelectTrigger className="w-44 cursor-pointer">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Categories</SelectItem>
                    {giftShopCategories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  className="bg-green-600 text-white rounded-full px-3 py-1.5 shadow-sm hover:bg-green-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors duration-150"
                  onClick={() => setAddDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2 text-white" />
                  Add New Item
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
              {shopItems
                .filter((product) =>
                  selectedCategory === "All"
                    ? true
                    : String(product.Category) === String(selectedCategory)
                )
                .map((product) => (
                  <div
                    key={product.Item_ID}
                    className="flex items-center justify-between p-4 rounded-lg border hover:border-green-600 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {product.Image_URL || product.image ? (
                          <ImageWithFallback
                            src={product.Image_URL || product.image}
                            alt={product.Item_Name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ShoppingBag className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{product.Item_Name}</h3>
                        <p className="text-sm text-gray-600">
                          {product.Category || "Uncategorized"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-2xl font-semibold text-green-600">
                          ${parseFloat(product.Price).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(product)}
                          className="cursor-pointer border-transparent hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 focus:bg-blue-50 focus:border-blue-300 focus:text-blue-600 transition-colors"
                          aria-label="Edit item"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(product)}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
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
                    key={topItem.item.Item_ID}
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
                        {topItem.item.Image_URL || topItem.item.image ? (
                          <ImageWithFallback
                            src={topItem.item.Image_URL || topItem.item.image}
                            alt={topItem.item.Item_Name}
                            className="w-full h-full object-contain"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <ShoppingBag className="h-8 w-8 text-gray-400" />
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
                          Item #{topItem.item.Item_ID}
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
                    key={bottomItem.item.Item_ID}
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
                        {bottomItem.item.Image_URL || bottomItem.item.image ? (
                          <ImageWithFallback
                            src={
                              bottomItem.item.Image_URL || bottomItem.item.image
                            }
                            alt={bottomItem.item.Item_Name}
                            className="w-full h-full object-contain"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <ShoppingBag className="h-8 w-8 text-gray-400" />
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
                          Item #{bottomItem.item.Item_ID}
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Gift Shop Item</DialogTitle>
            <DialogDescription>
              Update the details of this gift shop item.
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
              <Label htmlFor="edit-category">Category *</Label>
              <select
                id="edit-category"
                value={editForm.category}
                onChange={(e) =>
                  setEditForm({ ...editForm, category: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                {giftShopCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
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

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Gift Shop Item</DialogTitle>
            <DialogDescription>
              Add a new item to the gift shop inventory.
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
              <Label htmlFor="add-category">Category *</Label>
              <select
                id="add-category"
                value={addForm.category}
                onChange={(e) =>
                  setAddForm({ ...addForm, category: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                {giftShopCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.Item_Name}" from
              the inventory? This action cannot be undone.
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
