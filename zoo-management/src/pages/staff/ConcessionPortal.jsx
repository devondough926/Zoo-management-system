import { useState, useEffect } from "react";
import { useNavigate, UNSAFE_NavigationContext } from "react-router-dom"; // optional if router exists
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
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
  TrendingUp,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ZooLogo } from "../../components/ZooLogo";
import { ImageWithFallback } from "../../components/figma/ImageWithFallback";
import { useData } from "../../data/DataContext";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

export function ConcessionPortal({ user, onLogout }) {
  // ✅ Detect router context to avoid “useNavigate() outside Router” error
  let navigate;
  try {
    navigate = useNavigate();
  } catch {
    navigate = null;
  }

  const {
    concessionItems: menuItems,
    addConcessionItem,
    updateConcessionItem,
    deleteConcessionItem,
    purchases,
    purchaseConcessionItems,
  } = useData();

  const [dbItems, setDbItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch from backend if available
  useEffect(() => {
    async function fetchFromBackend() {
      try {
        const res = await fetch(`${API_BASE}/food`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setDbItems(data);
        }
      } catch (err) {
        console.warn("⚠️ Backend not reachable, using mock data.");
      } finally {
        setLoading(false);
      }
    }
    fetchFromBackend();
  }, []);

  const allStands = concessionStands;
  const [showRevenueAllTime, setShowRevenueAllTime] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", price: "", imageFile: null });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    price: "",
    standId: "1",
    imageFile: null,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // ✅ Revenue + Sales Stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayPurchaseConcessionItems = purchaseConcessionItems.filter((pci) => {
    const purchase = purchases.find((p) => p.Purchase_ID === pci.Purchase_ID);
    if (!purchase) return false;
    const purchaseDate = new Date(purchase.Purchase_Date);
    purchaseDate.setHours(0, 0, 0, 0);
    return purchaseDate.getTime() === today.getTime();
  });

  const todayRevenue = todayPurchaseConcessionItems.reduce(
    (sum, pci) => sum + pci.Unit_Price * pci.Quantity,
    0
  );
  const allTimeRevenue = purchaseConcessionItems.reduce(
    (sum, pci) => sum + pci.Unit_Price * pci.Quantity,
    0
  );
  const itemsSoldToday = todayPurchaseConcessionItems.reduce(
    (sum, pci) => sum + pci.Quantity,
    0
  );

  // ✅ Top & Bottom Items (Mock)
  const topItems = [
    { item: menuItems[17], quantity: 189, rank: 1 },
    { item: menuItems[0], quantity: 167, rank: 2 },
    { item: menuItems[6], quantity: 154, rank: 3 },
  ].filter((t) => t.item);

  const topSellingItemToday = topItems[0] || null;
  const totalItemCount = menuItems.length;
  const bottomItems = [
    { item: menuItems[19], quantity: 23, rank: totalItemCount },
    { item: menuItems[13], quantity: 31, rank: totalItemCount - 1 },
    { item: menuItems[8], quantity: 38, rank: totalItemCount - 2 },
  ].filter((t) => t.item);

  // ✅ CRUD Handlers
  const handleEditClick = (item) => {
    setEditingItem(item);
    setEditForm({
      name: item.Item_Name,
      price: item.Price.toString(),
      imageFile: null,
    });
    setEditDialogOpen(true);
  };

  const handleEditSave = () => {
    if (!editingItem) return;
    if (!editForm.name || !editForm.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    const imageUrl = editForm.imageFile
      ? URL.createObjectURL(editForm.imageFile)
      : editingItem.image;

    updateConcessionItem(editingItem.Concession_Item_ID, {
      Item_Name: editForm.name,
      Price: parseFloat(editForm.price),
      ...(imageUrl && { image: imageUrl }),
    });

    setEditDialogOpen(false);
    toast.success("Item updated successfully!");
  };

  const handleAddItem = () => {
    if (!addForm.name || !addForm.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    const imageUrl = addForm.imageFile
      ? URL.createObjectURL(addForm.imageFile)
      : undefined;

    const newItem = {
      Concession_Item_ID:
        Math.max(...menuItems.map((i) => i.Concession_Item_ID)) + 1,
      Stand_ID: parseInt(addForm.standId),
      Item_Name: addForm.name,
      Price: parseFloat(addForm.price),
      ...(imageUrl && { image: imageUrl }),
    };

    addConcessionItem(newItem);
    setAddDialogOpen(false);
    setAddForm({ name: "", price: "", standId: "1", imageFile: null });
    toast.success("New item added successfully!");
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;
    deleteConcessionItem(itemToDelete.Concession_Item_ID);
    setDeleteDialogOpen(false);
    setItemToDelete(null);
    toast.success("Item removed successfully!");
  };

  const allItems = dbItems.length > 0 ? dbItems : menuItems;
  const getImageSrc = (item) =>
    item.Image_URL
      ? item.Image_URL
      : item.image
      ? item.image
      : "/placeholder.png";

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Loading concession data...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <ZooLogo size={40} />
            <div>
              <h1 className="font-semibold text-xl">Staff Portal</h1>
              <p className="text-sm text-gray-600">Concession Stand Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-medium">
                Welcome, {user?.First_Name || "Concession"}{" "}
                {user?.Last_Name || "Account"}
              </p>
              <p className="text-sm text-gray-600">Concession Worker</p>
            </div>

            {/* ✅ Safe navigation (works with or without Router) */}
            <Button
              variant="outline"
              onClick={() =>
                navigate ? navigate("/food") : (window.location.href = "/food")
              }
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
      </header>

      {/* Dashboard Stats */}
      <div className="container mx-auto px-6 py-12">
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
                  ? allTimeRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })
                  : todayRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-gray-700">
                {showRevenueAllTime ? "All-Time Revenue" : "Today's Revenue"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl text-green-600 mb-2">{itemsSoldToday}</div>
              <p className="text-gray-700">Items Sold Today</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              {topSellingItemToday ? (
                <>
                  <div className="text-2xl text-green-600 mb-2">
                    {topSellingItemToday.item.Item_Name}
                  </div>
                  <p className="text-gray-700">Top-Selling Item Today</p>
                  <p className="text-sm text-gray-500">
                    ({topSellingItemToday.quantity} sold)
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
                Current Menu ({allItems.length} items)
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
              {allItems.map((item) => (
                <div
                  key={item.Concession_Item_ID}
                  className="flex items-center justify-between p-4 rounded-lg border hover:border-green-600 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      <ImageWithFallback
                        src={getImageSrc(item)}
                        alt={item.Item_Name}
                        className="w-full h-full object-cover"
                      />
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
                        ${parseFloat(item.Price).toFixed(2)}
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
      </div>
    </div>
  );
}
