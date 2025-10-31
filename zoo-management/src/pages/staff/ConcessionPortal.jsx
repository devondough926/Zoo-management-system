import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ZooLogo } from "../../components/ZooLogo";
import { LogOut, Plus } from "lucide-react";
import { toast } from "sonner";

// ✅ Base API endpoint
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

export function ConcessionPortal({ user, onLogout }) {
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addForm, setAddForm] = useState({
    Stand_ID: "",
    name: "",
    price: "",
  });

  // ✅ Fetch food data on mount
  useEffect(() => {
    async function loadFood() {
      try {
        const res = await fetch(`${API_BASE}/food`);
        if (!res.ok) throw new Error("Failed to fetch food items");
        const data = await res.json();
        console.log("✅ Loaded concession data:", data.length, "items");
        console.table(data.slice(0, 3)); // preview a few
        setFoodItems(data);
      } catch (err) {
        console.error("❌ Error fetching food items:", err);
        setError("Could not load food items. Check backend connection.");
      } finally {
        setLoading(false);
      }
    }
    loadFood();
  }, []);

  // ✅ Add food item
  const handleAddItem = async () => {
    if (!addForm.name || !addForm.price || !addForm.Stand_ID) {
      toast.error("Please fill all fields (Stand ID, name, price)");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/food`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Stand_ID: parseInt(addForm.Stand_ID),
          Item_Name: addForm.name,
          Price: parseFloat(addForm.price),
        }),
      });

      if (!res.ok) throw new Error("Failed to add item");

      toast.success("✅ Item added successfully!");
      setAddForm({ Stand_ID: "", name: "", price: "" });

      const reload = await fetch(`${API_BASE}/food`);
      const data = await reload.json();
      setFoodItems(data);
    } catch (err) {
      console.error("❌ Add item error:", err);
      toast.error("Failed to add item.");
    }
  };

  // ✅ Delete food item
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/food/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete item");
      setFoodItems(foodItems.filter((i) => i.Concession_Item_ID !== id));
      toast.success("🗑️ Item deleted successfully!");
    } catch (err) {
      console.error("❌ Delete error:", err);
      toast.error("Failed to delete item.");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Loading concession data...
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-screen text-red-600">
        {error}
      </div>
    );

  // ✅ Group items by stand
  const grouped = foodItems.reduce((acc, item) => {
    if (!acc[item.Stand_Name]) acc[item.Stand_Name] = [];
    acc[item.Stand_Name].push(item);
    return acc;
  }, {});

  // ✅ Ensure URL renders or fallback
  const validImage = (url) => {
    if (!url) return "/placeholder.png";
    const clean = String(url).trim();
    return clean.startsWith("http") ? clean : "/placeholder.png";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
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
                Welcome, {user?.First_Name || "Staff"} {user?.Last_Name || ""}
              </p>
              <p className="text-sm text-gray-600">Concession Worker</p>
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
      </header>

      {/* Main */}
      <div className="container mx-auto px-6 py-10">
        {/* Add Form */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            Menu Items ({foodItems.length})
          </h2>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Stand ID"
              value={addForm.Stand_ID}
              onChange={(e) =>
                setAddForm({ ...addForm, Stand_ID: e.target.value })
              }
              className="border px-3 py-1 rounded-md text-sm w-20"
            />
            <input
              type="text"
              placeholder="Item name"
              value={addForm.name}
              onChange={(e) =>
                setAddForm({ ...addForm, name: e.target.value })
              }
              className="border px-3 py-1 rounded-md text-sm"
            />
            <input
              type="number"
              placeholder="Price"
              value={addForm.price}
              onChange={(e) =>
                setAddForm({ ...addForm, price: e.target.value })
              }
              className="border px-3 py-1 rounded-md text-sm w-24"
            />
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleAddItem}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        {/* Menu */}
        {Object.keys(grouped).map((stand) => (
          <div key={stand} className="mb-10">
            <h3 className="text-xl font-semibold mb-3 text-green-800">
              {stand}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {grouped[stand].map((item) => (
                <Card key={item.Concession_Item_ID} className="shadow-md">
                  <CardHeader>
                    <CardTitle>{item.Item_Name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <img
                      src={validImage(item.Image_URL)}
                      alt={item.Item_Name}
                      loading="eager"                // ✅ load immediately
                      decoding="sync"                // ✅ render immediately
                      fetchpriority="high"           // ✅ hint browser
                      onLoad={(e) =>
                        console.log("🟢 Loaded image:", e.target.src)
                      }
                      onError={(e) => {
                        console.warn("⚠️ Broken image:", e.target.src);
                        e.target.src = "/placeholder.png";
                      }}
                      className="w-full h-40 object-cover rounded-md mb-3 border border-gray-200 bg-gray-100"
                      style={{
                        display: "block",
                        minHeight: "10rem",
                        backgroundColor: "#eee",
                      }}
                    />
                    <p className="text-green-700 font-semibold mb-2">
                      ${parseFloat(item.Price).toFixed(2)}
                    </p>
                    <Button
                      variant="outline"
                      className="border-red-600 text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(item.Concession_Item_ID)}
                    >
                      Delete
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
