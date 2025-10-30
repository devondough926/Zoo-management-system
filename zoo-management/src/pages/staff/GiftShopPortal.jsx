import { useState } from "react";
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
import { giftShops } from "../../data/mockData";
import {
  LogOut,
  Plus,
  ShoppingBag,
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

const giftShopCategories = [
  "Accessories & Souvenirs",
  "Apparel",
  "Toys & Plushies",
  "Decorations & Others",
];

export function GiftShopPortal({ user, onLogout, onNavigate }) {
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
                  <p className="text-sm text-gray-600">Gift Shop Dashboard (Demo disabled)</p>
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
  const {
    items: shopItems,
    addItem,
    updateItem,
    deleteItem,
    purchases,
    purchaseItems,
  } = useData();
  // All gift shops under management (Gift Shop Worker manages all shops)
  const allShops = giftShops;
  const [showRevenueAllTime, setShowRevenueAllTime] = useState(false);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    price: "",
    category: giftShopCategories[0],
    imageFile: null,
  });

  // Add dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    price: "",
    category: giftShopCategories[0],
    imageFile: null,
  });

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Calculate revenue from actual purchases
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayPurchaseItems = purchaseItems.filter((pi) => {
    const purchase = purchases.find((p) => p.Purchase_ID === pi.Purchase_ID);
    if (!purchase || pi.Item_ID === 9000) return false; // Exclude memberships
    const purchaseDate = new Date(purchase.Purchase_Date);
    purchaseDate.setHours(0, 0, 0, 0);
    return purchaseDate.getTime() === today.getTime();
  });

  const todayRevenue = todayPurchaseItems.reduce(
    (sum, pi) => sum + pi.Unit_Price * pi.Quantity,
    0
  );
  const allTimeRevenue = purchaseItems
    .filter((pi) => pi.Item_ID !== 9000)
    .reduce((sum, pi) => sum + pi.Unit_Price * pi.Quantity, 0);
  const itemsSoldToday = todayPurchaseItems.reduce(
    (sum, pi) => sum + pi.Quantity,
    0
  );

  // Top selling items with mock quantities (top 3 only)
  const topItems = [
    { item: shopItems[0], quantity: 156, rank: 1 }, // Plush Elephant
    { item: shopItems[1], quantity: 143, rank: 2 }, // Zoo T-Shirt
    { item: shopItems[5], quantity: 128, rank: 3 }, // Plush Tiger
  ].filter((t) => t.item); // Filter out any undefined items

  // Get top selling item today
  const topSellingItemToday = topItems[0] || null;

  // Bottom selling items with mock quantities (bottom 3 only)
  // Note: ShopPage has 32 items (8 per category × 4 categories), but mockData.items only has initial 8
  // We use 32 as the total to match the public shop page
  const totalItemCount = 32;
  const actualItemCount = shopItems.length;
  const bottomItems =
    actualItemCount >= 3
      ? [
          {
            item: shopItems[Math.min(7, actualItemCount - 1)],
            quantity: 18,
            rank: totalItemCount,
          }, // Last place
          {
            item: shopItems[Math.min(3, actualItemCount - 2)],
            quantity: 27,
            rank: totalItemCount - 1,
          }, // 2nd to last
          {
            item: shopItems[Math.min(4, actualItemCount - 3)],
            quantity: 35,
            rank: totalItemCount - 2,
          }, // 3rd to last
        ].filter((t) => t.item)
      : []; // Filter out any undefined items

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

  const handleEditSave = () => {
    if (!editingItem) return;

    if (!editForm.name || !editForm.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Create a URL for the image file if provided, otherwise keep existing image
    const imageUrl = editForm.imageFile
      ? URL.createObjectURL(editForm.imageFile)
      : editingItem.image;

    updateItem(editingItem.Item_ID, {
      Item_Name: editForm.name,
      Price: parseFloat(editForm.price),
      ...(imageUrl && { image: imageUrl }),
      Category: editForm.category,
    });

    setEditDialogOpen(false);
    toast.success("Item updated successfully!");
  };

  const handleAddItem = () => {
    if (!addForm.name || !addForm.price) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Create a URL for the image file if provided
    const imageUrl = addForm.imageFile
      ? URL.createObjectURL(addForm.imageFile)
      : undefined;

    const newItem = {
      Item_ID: Math.max(...shopItems.map((i) => i.Item_ID)) + 1,
      Shop_ID: 1, // Default to first shop
      Item_Name: addForm.name,
      Price: parseFloat(addForm.price),
      Category: addForm.category,
      ...(imageUrl && { image: imageUrl }),
    };

    addItem(newItem);
    setAddDialogOpen(false);
    setAddForm({
      name: "",
      price: "",
      category: giftShopCategories[0],
      imageFile: null,
    });
    toast.success("New item added successfully!");
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;

    deleteItem(itemToDelete.Item_ID);
    setDeleteDialogOpen(false);
    setItemToDelete(null);
    toast.success("Item removed successfully!");
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
                <p className="text-sm text-gray-600">Gift Shop Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-medium">
                  Welcome, {user.First_Name} {user.Last_Name}
                </p>
                <p className="text-sm text-gray-600">Gift Shop Worker</p>
              </div>
              <Button
                variant="outline"
                onClick={() => onNavigate("shop")}
                className="border-teal-600 text-teal-600 cursor-pointer"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                View Gift Shop
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
                  ? allTimeRevenue.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })
                  : todayRevenue.toLocaleString("en-US", {
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
                {itemsSoldToday}
              </div>
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

        {/* Current Inventory */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <ShoppingBag className="h-5 w-5 mr-2 text-green-600" />
                Current Inventory ({shopItems.length} items)
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
              {shopItems.map((product) => (
                <div
                  key={product.Item_ID}
                  className="flex items-center justify-between p-4 rounded-lg border hover:border-green-600 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {product.image ? (
                        <ImageWithFallback
                          src={product.image}
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
                        ${product.Price.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(product)}
                        className="cursor-pointer"
                      >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
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
                    key={topItem.item.Item_ID}
                    className="flex items-center justify-between p-4 rounded-lg border hover:border-green-600 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600 font-bold">
                        #{topItem.rank}
                      </div>
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {topItem.item.image ? (
                          <ImageWithFallback
                            src={topItem.item.image}
                            alt={topItem.item.Item_Name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ShoppingBag className="h-8 w-8 text-gray-400" />
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
                    key={bottomItem.item.Item_ID}
                    className="flex items-center justify-between p-4 rounded-lg border hover:border-red-600 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600 font-bold">
                        #{bottomItem.rank}
                      </div>
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {bottomItem.item.image ? (
                          <ImageWithFallback
                            src={bottomItem.item.image}
                            alt={bottomItem.item.Item_Name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ShoppingBag className="h-8 w-8 text-gray-400" />
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

      {/* Add New Item Dialog */}
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

      {/* Delete Confirmation Dialog */}
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
