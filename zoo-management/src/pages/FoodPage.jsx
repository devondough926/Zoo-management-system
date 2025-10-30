import { useState, useMemo } from "react";
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
import {
  currentUser,
  currentUserType,
  concessionStands,
} from "../data/mockData";
import { useData } from "../data/DataContext";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function FoodPage({ addToCart }) {
  const { concessionItems, memberships } = useData();

  // Zone mapping based on Location_ID from concessionStands in mockData
  // Stand 1 (Safari Grill) -> Location 1 -> Zone A
  // Stand 2 (Polar Cafe) -> Location 4 -> Zone D
  // Stand 3 (Rainforest Refreshments) -> Location 3 -> Zone C
  // Stand 4 (Desert Diner) -> Location 2 -> Zone B
  const standInfo = useMemo(() => {
    return [
      {
        id: 1,
        name: "Safari Grill",
        zone: "Zone A",
        specialty: "Burgers & Grilled Items",
      },
      {
        id: 2,
        name: "Polar Cafe",
        zone: "Zone D",
        specialty: "Ice Cream & Desserts",
      },
      {
        id: 3,
        name: "Rainforest Refreshments",
        zone: "Zone C",
        specialty: "Fresh & Healthy Options",
      },
      {
        id: 4,
        name: "Desert Diner",
        zone: "Zone B",
        specialty: "Pizza & Italian",
      },
    ];
  }, []);

  // Group items by stand
  const itemsByStand = useMemo(() => {
    return standInfo.map((stand) => {
      const standItems = concessionItems.filter(
        (item) => item.Stand_ID === stand.id
      );
      return {
        ...stand,
        items: standItems.map((item) => ({
          id: item.Concession_Item_ID,
          name: item.Item_Name,
          price: item.Price,
          image: item.image,
        })),
      };
    });
  }, [concessionItems, standInfo]);

  const [carouselIndices, setCarouselIndices] = useState({
    "Safari Grill": 0,
    "Polar Cafe": 0,
    "Rainforest Refreshments": 0,
    "Desert Diner": 0,
  });

  // Check if current user is a customer with active membership
  const hasMembership =
    currentUser && currentUserType === "customer" && memberships
      ? memberships.some(
          (m) =>
            m.Customer_ID === currentUser.Customer_ID && m.Membership_Status
        )
      : false;

  const handleNext = (standName, totalItems) => {
    setCarouselIndices((prev) => ({
      ...prev,
      [standName]: (prev[standName] + 1) % totalItems,
    }));
  };

  const handlePrev = (standName, totalItems) => {
    setCarouselIndices((prev) => ({
      ...prev,
      [standName]: prev[standName] === 0 ? totalItems - 1 : prev[standName] - 1,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 to-emerald-700 text-white py-16">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl mb-4">Food & Dining</h1>
          <p className="text-xl text-green-100 max-w-2xl">
            Refuel your adventure with delicious food and refreshing beverages
            from our concession stands throughout the zoo.
          </p>
        </div>
      </section>

      {/* Food Stands Info */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl mb-8 text-center">Our Concession Stands</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {itemsByStand.map((stand) => (
              <Card
                key={stand.name}
                className="text-center hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <CardTitle className="text-lg">{stand.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-green-600" />
                    {stand.zone}
                  </div>
                  <Badge className="bg-green-100 text-green-800 w-full justify-center">
                    {stand.specialty}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Menu by Stand with Carousel */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl mb-8 text-center">Full Menu</h2>
          <div className="space-y-12 max-w-6xl mx-auto">
            {itemsByStand.map((stand) => {
              const currentIndex = carouselIndices[stand.name];
              const displayedItems = stand.items.slice(
                currentIndex,
                currentIndex + 4
              );

              // If we don't have 4 items, wrap around
              if (displayedItems.length < 4 && stand.items.length > 0) {
                displayedItems.push(
                  ...stand.items.slice(0, 4 - displayedItems.length)
                );
              }

              return (
                <div key={stand.name}>
                  <div className="flex items-center justify-between mb-6 pb-2 border-b-2 border-green-600">
                    <h3 className="text-2xl">
                      {stand.name} ({stand.items.length})
                    </h3>
                    <Badge className="bg-green-100 text-green-800">
                      {stand.zone}
                    </Badge>
                  </div>

                  {stand.items.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">
                        No items available at this location yet.
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      {stand.items.length > 4 && (
                        <button
                          onClick={() =>
                            handlePrev(stand.name, stand.items.length)
                          }
                          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          aria-label="Previous items"
                        >
                          <ChevronLeft className="h-6 w-6 text-green-600" />
                        </button>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {displayedItems.map((item, idx) => (
                          <Card
                            key={`${stand.name}-${currentIndex}-${idx}`}
                            className="hover:shadow-md transition-shadow"
                          >
                            <div className="aspect-video w-full overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
                              {item.image ? (
                                <ImageWithFallback
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <UtensilsCrossed className="h-16 w-16 text-orange-200" />
                              )}
                            </div>
                            <CardContent className="pt-4">
                              <div className="flex flex-col gap-3">
                                <h4 className="font-medium text-lg">
                                  {item.name}
                                </h4>
                                <span className="text-xl text-green-600 font-semibold">
                                  ${item.price.toFixed(2)}
                                </span>
                                <Button
                                  className="w-full bg-green-600 hover:bg-green-700 cursor-pointer"
                                  onClick={() => {
                                    if (!currentUser) {
                                      toast.error(
                                        "Please log in to add items to cart"
                                      );
                                    } else if (addToCart) {
                                      addToCart({
                                        id: item.id,
                                        name: item.name,
                                        price: item.price,
                                        type: "food",
                                      });
                                      toast.success(
                                        `Added ${item.name} to cart!`
                                      );
                                    }
                                  }}
                                >
                                  Add to Cart
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {stand.items.length > 4 && (
                        <button
                          onClick={() =>
                            handleNext(stand.name, stand.items.length)
                          }
                          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          aria-label="Next items"
                        >
                          <ChevronRight className="h-6 w-6 text-green-600" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
