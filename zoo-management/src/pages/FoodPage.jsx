import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  MapPin,
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useHeroImage } from "../utils/heroImages";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

export function FoodPage({ addToCart }) {
  const heroImage = useHeroImage("food");
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [carouselIndices, setCarouselIndices] = useState({});

  // ✅ Fetch food items
  useEffect(() => {
    async function fetchMenu() {
      try {
        const res = await fetch(`${API_BASE}/food`);
        if (!res.ok) throw new Error("Failed to fetch food data");
        const data = await res.json();
        setFoodItems(data);
      } catch (err) {
        console.error("❌ Food fetch error:", err);
        setError("Could not load menu. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchMenu();
  }, []);

  // ✅ Initialize carousel indices dynamically once data loads
  useEffect(() => {
    if (foodItems.length > 0) {
      const uniqueStands = [...new Set(foodItems.map((f) => f.Stand_Name))];
      const initialIndices = {};
      uniqueStands.forEach((stand) => {
        initialIndices[stand] = 0;
      });
      setCarouselIndices(initialIndices);
    }
  }, [foodItems]);

  // ✅ Zone & specialty mapping
  const standInfo = useMemo(
    () => ({
      1: { zone: "Zone A", specialty: "Burgers & Grilled Items" },
      2: { zone: "Zone B", specialty: "Pizza & Italian" },
      3: { zone: "Zone C", specialty: "Fresh & Healthy Options" },
      4: { zone: "Zone D", specialty: "Ice Cream & Desserts" },
    }),
    []
  );

  // ✅ Group items by stand name
  const grouped = useMemo(() => {
    const groups = {};
    foodItems.forEach((item) => {
      if (!groups[item.Stand_Name]) groups[item.Stand_Name] = [];
      groups[item.Stand_Name].push(item);
    });
    return groups;
  }, [foodItems]);

  const handleNext = (standName, total) => {
    setCarouselIndices((prev) => ({
      ...prev,
      [standName]: (prev[standName] + 1) % total,
    }));
  };

  const handlePrev = (standName, total) => {
    setCarouselIndices((prev) => ({
      ...prev,
      [standName]:
        prev[standName] === 0 ? total - 1 : prev[standName] - 1,
    }));
  };

  const validImage = (url) => {
    if (!url) return "/placeholder.png";
    const clean = String(url).trim();
    return clean.startsWith("http") ? clean : "/placeholder.png";
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Loading menu...
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-screen text-red-600">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 to-emerald-700 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src={heroImage}
            alt="Zoo Food and Dining"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom right, rgba(20, 83, 45, 0.55), rgba(6, 78, 59, 0.55))",
            }}
          />
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <h1 className="text-4xl md:text-5xl mb-4 drop-shadow-lg">
            Food & Dining
          </h1>
          <p className="text-xl text-green-100 max-w-2xl drop-shadow-md">
            Refuel your adventure with delicious meals and snacks from our
            concession stands throughout the zoo.
          </p>
        </div>
      </section>

      {/* Menu Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl mb-8 text-center font-bold text-green-800">
            Our Concession Stands
          </h2>

          {Object.keys(grouped).length === 0 ? (
            <div className="text-center text-gray-600 py-20">
              No food items available.
            </div>
          ) : (
            Object.entries(grouped).map(([standName, items]) => {
              const standMeta = standInfo[items[0]?.Stand_ID] || {};
              const currentIndex = carouselIndices[standName] || 0;

              // ✅ Correct carousel window
              const visibleCount = 4;
              const visibleItems = Array.from({ length: visibleCount }).map(
                (_, i) => items[(currentIndex + i) % items.length]
              );

              return (
                <div key={standName} className="mb-14">
                  <div className="flex items-center justify-between mb-6 pb-2 border-b-2 border-green-600">
                    <div>
                      <h3 className="text-2xl font-semibold text-green-800">
                        {standName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {standMeta.specialty} • {standMeta.zone}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      {standMeta.zone || "—"}
                    </Badge>
                  </div>

                  <div className="relative">
                    {items.length > visibleCount && (
                      <button
                        onClick={() => handlePrev(standName, items.length)}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 cursor-pointer"
                      >
                        <ChevronLeft className="h-6 w-6 text-green-600" />
                      </button>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {visibleItems.map((item, idx) => (
                        <Card
                          key={`${standName}-${idx}`}
                          className="hover:shadow-md transition-shadow"
                        >
                          <div className="aspect-video w-full overflow-hidden bg-gray-100">
                            <img
                              src={validImage(item.Image_URL)}
                              alt={item.Item_Name}
                              className="w-full h-full object-cover"
                              onError={(e) => (e.target.src = "/placeholder.png")}
                            />
                          </div>
                          <CardContent className="pt-4">
                            <h4 className="font-medium text-lg mb-1">
                              {item.Item_Name}
                            </h4>
                            <span className="text-xl text-green-600 font-semibold">
                              ${parseFloat(item.Price).toFixed(2)}
                            </span>
                            <Button
                              className="w-full mt-3 bg-green-600 hover:bg-green-700 cursor-pointer"
                              onClick={() => {
                                if (addToCart) {
                                  addToCart({
                                    id: item.Concession_Item_ID,
                                    name: item.Item_Name,
                                    price: item.Price,
                                    type: "food",
                                  });
                                  toast.success(`Added ${item.Item_Name} to cart!`);
                                }
                              }}
                            >
                              Add to Cart
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {items.length > visibleCount && (
                      <button
                        onClick={() => handleNext(standName, items.length)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 cursor-pointer"
                      >
                        <ChevronRight className="h-6 w-6 text-green-600" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
