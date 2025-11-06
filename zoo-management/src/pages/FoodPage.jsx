import { useState, useMemo, useEffect, useRef } from "react";
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
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../data/DataContext";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { preloadImages } from "../utils/imagePreloader";
import { useHeroImage } from "../utils/heroImages";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

export function FoodPage({ addToCart, allowCartActions = true }) {
  const { memberships } = useData();
  const { user, userType } = useAuth();
  const heroImage = useHeroImage("food");
  const [concessionItems, setConcessionItems] = useState([]);

  useEffect(() => {
    const fetchConcessionItems = async () => {
      try {
        const res = await fetch(`${API_BASE}/food`);
        if (!res.ok) throw new Error("Failed to fetch food items");
        const data = await res.json();
        setConcessionItems(data);
      } catch (err) {
        console.error("❌ Failed to load food items:", err);
        toast.error("Failed to load food items");
      }
    };
    fetchConcessionItems();
  }, []);

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
        zone: "Zone B",
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
        zone: "Zone D",
        specialty: "Pizza & Italian",
      },
    ];
  }, []);

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
          image: item.Image_URL || null,
        })),
      };
    });
  }, [concessionItems, standInfo]);

  const [carouselIndices, setCarouselIndices] = useState({});
  const [carouselNoTransition, setCarouselNoTransition] = useState({});
  const [carouselAnimating, setCarouselAnimating] = useState({});
  const carouselTimersRef = useRef({});

  // Preload initial visible images for each stand and initialize carousel indices
  useEffect(() => {
    if (!itemsByStand || itemsByStand.length === 0) return;
    const toPreload = [];
    const initialIndices = {};

    itemsByStand.forEach((stand) => {
      const slidesPerView = Math.min(4, stand.items.length || 4);
      if (stand.items.length > 0) {
        // initial visible real items are the first `slidesPerView` items
        const urls = stand.items
          .slice(0, slidesPerView)
          .map((it) => it.image)
          .filter(Boolean);
        toPreload.push(...urls);
        // default index should point to the offset start (after cloned head)
        initialIndices[stand.name] = slidesPerView;
      }
    });

    if (toPreload.length > 0) {
      // preload with a small timeout to avoid blocking render
      Promise.race([
        preloadImages(toPreload, "high"),
        new Promise((res) => setTimeout(res, 80)),
      ]);
    }

    // Set any missing carousel indices to their initial offsetStart
    setCarouselIndices((prev) => ({ ...initialIndices, ...prev }));
  }, [itemsByStand]);

  const hasMembership =
    user && userType === "customer" && memberships
      ? memberships.some(
          (m) => m.Customer_ID === user.Customer_ID && m.Membership_Status
        )
      : false;

  const handleNext = (standName, totalItems, allItems) => {
    // Prevent starting a new transition while one is in progress for this stand
    if (carouselAnimating[standName]) return;
    const current = carouselIndices[standName];
    const slidesPerView = Math.min(4, totalItems);
    // If state hasn't been initialized yet, default to the offset start
    const offsetStart = slidesPerView;
    const curr = typeof current === "number" ? current : offsetStart;
    const n = totalItems;
    const newIndex = curr + 1;

    // Build carousel items for preload (slice real items according to visual window)
    const realStart = (((newIndex - offsetStart) % n) + n) % n; // normalize
    const displayed = [];
    for (let i = 0; i < slidesPerView; i++) {
      displayed.push(allItems[(realStart + i) % n]);
    }
    const urls = displayed.map((it) => it?.image).filter(Boolean);

    // Begin transition: mark animating and clear any previous timers
    setCarouselAnimating((p) => ({ ...p, [standName]: true }));
    if (carouselTimersRef.current[standName]) {
      clearTimeout(carouselTimersRef.current[standName]);
    }
    // Move with transition
    setCarouselNoTransition((p) => ({ ...p, [standName]: false }));
    setCarouselIndices((prev) => ({ ...prev, [standName]: newIndex }));

    // If we've moved into the cloned tail (indices >= offsetStart + n), snap back to the corresponding real index
    const transitionMs = 620; // a little > duration-600
    const clonedTailStart = offsetStart + n; // first index of cloned head (after real items)
    if (newIndex >= clonedTailStart) {
      const normalized = (((newIndex - offsetStart) % n) + n) % n; // 0..n-1
      const target = offsetStart + normalized;
      // After transition completes, snap without transition to the target real index
      const snapTimer = setTimeout(() => {
        setCarouselNoTransition((p) => ({ ...p, [standName]: true }));
        setCarouselIndices((prev) => ({ ...prev, [standName]: target }));
        // Re-enable transitions for future slides
        setTimeout(
          () => setCarouselNoTransition((p) => ({ ...p, [standName]: false })),
          20
        );
      }, transitionMs);
      // Ensure animating is cleared after the snap completes
      const finishTimer = setTimeout(() => {
        setCarouselAnimating((p) => ({ ...p, [standName]: false }));
        delete carouselTimersRef.current[standName];
      }, transitionMs + 80);
      carouselTimersRef.current[standName] = finishTimer;
    }
    // If we didn't schedule a snap (normal in-range move), schedule clearing animating after the transition
    if (newIndex < clonedTailStart) {
      const finishTimer = setTimeout(() => {
        setCarouselAnimating((p) => ({ ...p, [standName]: false }));
        delete carouselTimersRef.current[standName];
      }, transitionMs + 30);
      carouselTimersRef.current[standName] = finishTimer;
    }

    Promise.race([
      preloadImages(urls, "high"),
      new Promise((res) => setTimeout(res, 150)),
    ]);
  };

  const handlePrev = (standName, totalItems, allItems) => {
    // Prevent starting a new transition while one is in progress for this stand
    if (carouselAnimating[standName]) return;
    const current = carouselIndices[standName];
    const slidesPerView = Math.min(4, totalItems);
    const offsetStart = slidesPerView;
    const curr = typeof current === "number" ? current : offsetStart;
    const n = totalItems;
    const newIndex = curr - 1;

    // Build displayed items for preload
    const realStart = (((newIndex - offsetStart) % n) + n) % n;
    const displayed = [];
    for (let i = 0; i < slidesPerView; i++) {
      displayed.push(allItems[(realStart + i) % n]);
    }
    const urls = displayed.map((it) => it?.image).filter(Boolean);

    // Begin transition: mark animating and clear previous timers
    setCarouselAnimating((p) => ({ ...p, [standName]: true }));
    if (carouselTimersRef.current[standName]) {
      clearTimeout(carouselTimersRef.current[standName]);
    }
    // Move with transition
    setCarouselNoTransition((p) => ({ ...p, [standName]: false }));
    setCarouselIndices((prev) => ({ ...prev, [standName]: newIndex }));

    // If we've moved into the cloned head (indices < offsetStart), snap to the corresponding real index at the end
    const transitionMs = 620;
    if (newIndex < offsetStart) {
      const normalized = (((newIndex - offsetStart) % n) + n) % n; // 0..n-1
      const target = offsetStart + normalized; // this maps into the real range
      const snapTimer = setTimeout(() => {
        setCarouselNoTransition((p) => ({ ...p, [standName]: true }));
        setCarouselIndices((prev) => ({ ...prev, [standName]: target }));
        // Re-enable transitions for future slides
        setTimeout(
          () => setCarouselNoTransition((p) => ({ ...p, [standName]: false })),
          20
        );
      }, transitionMs);
      const finishTimer = setTimeout(() => {
        setCarouselAnimating((p) => ({ ...p, [standName]: false }));
        delete carouselTimersRef.current[standName];
      }, transitionMs + 80);
      carouselTimersRef.current[standName] = finishTimer;
    } else {
      const finishTimer = setTimeout(() => {
        setCarouselAnimating((p) => ({ ...p, [standName]: false }));
        delete carouselTimersRef.current[standName];
      }, transitionMs + 30);
      carouselTimersRef.current[standName] = finishTimer;
    }

    Promise.race([
      preloadImages(urls, "high"),
      new Promise((res) => setTimeout(res, 150)),
    ]);
  };

  // We intentionally do not scroll. Preload-then-switch logic is handled
  // in handleNext/handlePrev so visuals update after images begin loading.

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="relative bg-gradient-to-br from-green-600 to-emerald-700 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src={heroImage}
            alt="Zoo Food and Dining"
            className="w-full h-full object-cover"
            priority={true}
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
            Refuel your adventure with delicious food and refreshing beverages
            from our concession stands throughout the zoo.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl mb-8 text-center">Our Concession Stands</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {itemsByStand.map((stand) => (
              <Card
                key={stand.name}
                style={{
                  textAlign: "center",
                  overflow: "hidden",
                  borderRadius: "0.5rem",
                  // Outer card should be green now (was amber)
                  backgroundColor: "#ecfdf5",
                  border: "1px solid #d1fae5",
                  transition: "box-shadow 0.2s ease-in-out",
                }}
              >
                {/* Name header area should be amber */}
                <CardHeader style={{ backgroundColor: "#fffbeb" }}>
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

      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl mb-8 text-center">Full Menu</h2>
          <div className="space-y-12 max-w-6xl mx-auto">
            {itemsByStand.map((stand) => {
              const slidesPerView = Math.min(4, stand.items.length || 4);
              const offsetStart = slidesPerView;

              // Build carousel items with cloned head/tail for seamless looping when there are more items than view
              let carouselItems = stand.items;
              if (stand.items.length > slidesPerView) {
                carouselItems = [
                  ...stand.items.slice(-slidesPerView),
                  ...stand.items,
                  ...stand.items.slice(0, slidesPerView),
                ];
              }

              // Use offsetStart as initial index when not yet initialized
              const currentIndex =
                typeof carouselIndices[stand.name] === "number"
                  ? carouselIndices[stand.name]
                  : offsetStart;

              const noTransition = carouselNoTransition[stand.name];

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
                      {/* Prev button */}
                      {stand.items.length > 4 && (
                        <button
                          onClick={() =>
                            handlePrev(
                              stand.name,
                              stand.items.length,
                              stand.items
                            )
                          }
                          className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg transition-colors ${
                            carouselAnimating[stand.name]
                              ? "opacity-60 cursor-not-allowed"
                              : "hover:bg-gray-100 cursor-pointer"
                          }`}
                          aria-label="Previous items"
                          disabled={!!carouselAnimating[stand.name]}
                        >
                          <ChevronLeft className="h-6 w-6 text-green-600" />
                        </button>
                      )}

                      {/* Sliding track */}
                      <div className="overflow-hidden">
                        <div
                          className={`flex will-change-transform ${
                            noTransition
                              ? ""
                              : "transition-transform duration-600 ease-in-out"
                          }`}
                          style={{
                            transform: `translateX(-${
                              (currentIndex || 0) * (100 / slidesPerView)
                            }%)`,
                          }}
                        >
                          {carouselItems.map((item, slideIdx) => (
                            <div
                              key={`${stand.name}-slide-${slideIdx}`}
                              className="flex-none px-2"
                              style={{
                                flex: `0 0 calc(100% / ${slidesPerView})`,
                              }}
                            >
                              <Card className="hover:shadow-md transition-shadow overflow-hidden rounded-lg">
                                <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
                                  {item && item.image ? (
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
                                      {item?.name}
                                    </h4>
                                    <span className="text-xl text-green-600 font-semibold">
                                      ${parseFloat(item?.price || 0).toFixed(2)}
                                    </span>
                                    <Button
                                      className="w-full bg-green-600 hover:bg-green-700 cursor-pointer"
                                      onClick={() => {
                                        if (!user) {
                                          toast.info(
                                            "Please log in to add items to your cart."
                                          );
                                          return;
                                        }
                                        if (!allowCartActions) {
                                          toast.error(
                                            "Adding items to cart is disabled for admin/staff users."
                                          );
                                          return;
                                        }
                                        if (addToCart && item) {
                                          addToCart({
                                            id: item.id,
                                            name: item.name,
                                            price: item.price,
                                            type: "food",
                                            image: item.image,
                                          });
                                          toast.success(
                                            `Added ${item.name} to cart!`
                                          );
                                        }
                                      }}
                                      disabled={
                                        user ? !allowCartActions : false
                                      }
                                    >
                                      Add to Cart
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Next button */}
                      {stand.items.length > 4 && (
                        <button
                          onClick={() =>
                            handleNext(
                              stand.name,
                              stand.items.length,
                              stand.items
                            )
                          }
                          className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg transition-colors ${
                            carouselAnimating[stand.name]
                              ? "opacity-60 cursor-not-allowed"
                              : "hover:bg-gray-100 cursor-pointer"
                          }`}
                          aria-label="Next items"
                          disabled={!!carouselAnimating[stand.name]}
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
