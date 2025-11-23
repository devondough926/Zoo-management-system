import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  ShoppingCart,
  ShoppingBag,
  MapPin,
  CreditCard,
  Gift,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../data/DataContext";
import LoadingWithIcon from "../components/ui/LoadingWithIcon";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { PaginationControls } from "../components/PaginationControls";
import { useHeroImage } from "../utils/heroImages";
import { generatePaginationArray } from "../utils/paginationHelper";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const categories = [
  "All",
  "Accessories & Souvenirs",
  "Apparel",
  "Toys & Plushies",
  "Decorations & Others",
];

const shopItems = [
  // Accessories & Souvenirs (8 items)
  {
    id: "acc1",
    name: "Zoo Logo Keychain",
    price: 8.99,
    category: "Accessories & Souvenirs",
  },
  {
    id: "acc2",
    name: "Wildlife Photo Magnet Set",
    price: 12.99,
    category: "Accessories & Souvenirs",
  },
  {
    id: "acc3",
    name: "Animal Sticker Collection",
    price: 5.99,
    category: "Accessories & Souvenirs",
  },
  {
    id: "acc4",
    name: "Safari Pin Badge Set",
    price: 14.99,
    category: "Accessories & Souvenirs",
  },
  {
    id: "acc5",
    name: "Elephant Charm Bracelet",
    price: 19.99,
    category: "Accessories & Souvenirs",
  },
  {
    id: "acc6",
    name: "Animal Print Tote Bag",
    price: 16.99,
    category: "Accessories & Souvenirs",
  },
  {
    id: "acc7",
    name: "Wildlife Postcard Set",
    price: 7.99,
    category: "Accessories & Souvenirs",
  },
  {
    id: "acc8",
    name: "Zoo Map & Guide Book",
    price: 11.99,
    category: "Accessories & Souvenirs",
  },

  // Apparel (8 items)
  { id: "app1", name: "Zoo Logo T-Shirt", price: 24.99, category: "Apparel" },
  {
    id: "app2",
    name: "Safari Adventure Hoodie",
    price: 44.99,
    category: "Apparel",
  },
  { id: "app3", name: "Animal Print Cap", price: 19.99, category: "Apparel" },
  { id: "app4", name: "Kids Zoo T-Shirt", price: 18.99, category: "Apparel" },
  {
    id: "app5",
    name: "Wildlife Sweatshirt",
    price: 39.99,
    category: "Apparel",
  },
  { id: "app6", name: "Safari Vest", price: 49.99, category: "Apparel" },
  { id: "app7", name: "Animal Crew Socks", price: 12.99, category: "Apparel" },
  { id: "app8", name: "Zoo Tank Top", price: 22.99, category: "Apparel" },

  // Toys & Plushies (8 items)
  {
    id: "toy1",
    name: "Elephant Plush Toy",
    price: 29.99,
    category: "Toys & Plushies",
  },
  {
    id: "toy2",
    name: "Lion Stuffed Animal",
    price: 32.99,
    category: "Toys & Plushies",
  },
  {
    id: "toy3",
    name: "Giraffe Cuddle Toy",
    price: 34.99,
    category: "Toys & Plushies",
  },
  {
    id: "toy4",
    name: "Tiger Stuffed Animal",
    price: 31.99,
    category: "Toys & Plushies",
  },
  {
    id: "toy5",
    name: "Monkey Plush Toy",
    price: 26.99,
    category: "Toys & Plushies",
  },
  {
    id: "toy6",
    name: "Koala Cuddle Buddy",
    price: 27.99,
    category: "Toys & Plushies",
  },
  { id: "toy7", name: "Bear Plush", price: 33.99, category: "Toys & Plushies" },
  {
    id: "toy8",
    name: "Zebra Plush",
    price: 29.99,
    category: "Toys & Plushies",
  },

  // Home Decor (8 items)
  {
    id: "home1",
    name: "Wildlife Canvas Print",
    price: 49.99,
    category: "Decorations & Others",
  },
  {
    id: "home2",
    name: "Animal Ceramic Mug",
    price: 14.99,
    category: "Decorations & Others",
  },
  {
    id: "home3",
    name: "Safari Throw Pillow",
    price: 24.99,
    category: "Decorations & Others",
  },
  {
    id: "home4",
    name: "Zoo Photo Frame",
    price: 18.99,
    category: "Decorations & Others",
  },
  {
    id: "home5",
    name: "Wildlife Poster Set",
    price: 29.99,
    category: "Decorations & Others",
  },
  {
    id: "home6",
    name: "Animal Coaster Set",
    price: 16.99,
    category: "Decorations & Others",
  },
  {
    id: "home7",
    name: "Safari Wall Clock",
    price: 34.99,
    category: "Decorations & Others",
  },
  {
    id: "home8",
    name: "Zoo Calendar",
    price: 12.99,
    category: "Decorations & Others",
  },
];

export function ShopPage({ addToCart, allowCartActions = true }) {
  const { items: dbItems } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const heroImage = useHeroImage("shop");

  const ITEMS_PER_PAGE = 12; // 4 columns × 3 rows

  // (Removed smoothScrollToTop per request)

  // Pricing is handled centrally in CartPage (member discount applied at checkout)

  // Convert database items to ShopItem format
  const shopItemsFromDb = dbItems
    .filter((item) => item && item.Item_ID && item.Item_Name && item.Price)
    .map((item) => ({
      id: item.Item_ID.toString(),
      name: item.Item_Name,
      price: parseFloat(item.Price),
      category: item.Category || "Uncategorized",
      image: item.Image_URL || item.image,
    }));

  const filteredItems =
    selectedCategory === "All"
      ? shopItemsFromDb
      : shopItemsFromDb.filter((item) => item.category === selectedCategory);

  // Paginated items
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, currentPage]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

  const isShopLoading = !dbItems || dbItems.length === 0;

  // Reset to page 1 when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  // (Removed automatic scrolling on pagination changes)

  // (Removed anchor/hash automatic scrolling per request)

  const handleAddToCart = async (product) => {
    if (!user) {
      // Prompt anonymous user to log in instead of navigating away
      toast.info("Please log in to add items to your cart.");
      return;
    }

    if (!allowCartActions) {
      toast.error("Adding items to cart is disabled for admin/staff users.");
      return;
    }

    if (addToCart) {
      // Fetch pricing with membership discount
      let originalPrice = product.price;
      let discountedPrice = product.price;
      let hasMembership = false;

      if (user && "Customer_ID" in user) {
        try {
          const productId =
            parseInt(product.id.replace(/\D/g, "")) ||
            Math.floor(Math.random() * 10000);
          const res = await fetch(
            `${API_BASE}/admin/pricing/membership-preview?customerId=${user.Customer_ID}&itemType=item&itemId=${productId}`
          );
          if (res.ok) {
            const data = await res.json();
            originalPrice = data.originalPrice;
            discountedPrice = data.discountedPrice;
            hasMembership = data.hasMembership;
          }
        } catch (err) {
          console.error("Failed to fetch membership pricing:", err);
        }
      }

      addToCart({
        id:
          parseInt(product.id.replace(/\D/g, "")) ||
          Math.floor(Math.random() * 10000),
        name: product.name,
        price: discountedPrice,
        originalPrice: originalPrice,
        hasMembership: hasMembership,
        type: "item",
        image: product.image,
      });
      toast.success(`Added ${product.name} to cart!`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isShopLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <LoadingWithIcon text="Loading shop items..." size={48} />
          </div>
        </div>
      )}
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 to-emerald-700 text-white py-16 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src={heroImage}
            alt="Zoo Gift Shop"
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

        {/* Content */}
        <div className="container mx-auto px-6 relative z-10">
          <h1 className="text-4xl md:text-5xl mb-4 drop-shadow-lg">
            Gift Shop
          </h1>
          <p className="text-xl text-green-100 max-w-2xl drop-shadow-md">
            Take home a piece of WildWood Zoo! Browse our collection of toys,
            apparel, souvenirs, and home decor.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-white border-b top-0 z-10 shadow-sm">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map((category) => (
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                variant={selectedCategory === category ? "default" : "outline"}
                className={`cursor-pointer transition-colors duration-150 ${
                  selectedCategory === category
                    ? "!bg-green-200 !text-black hover:!bg-green-300 border-green-200"
                    : "border-green-600 text-black hover:bg-green-50 bg-transparent"
                }`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section id="shop-section" className="py-16 pb-24">
        <div className="container mx-auto px-6">
          {/* Anchor for All Products scroll target */}
          <span id="all-products" />
          <h2 className="text-2xl mb-8 text-center">
            {selectedCategory === "All" ? "All Products" : selectedCategory}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
            {paginatedItems.map((product) => (
              <Card
                key={product.id}
                className="group overflow-hidden hover:shadow-lg transition-all will-change-transform hover:-translate-y-1 rounded-lg"
              >
                <div className="aspect-video w-full overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
                  {product.image ? (
                    <ImageWithFallback
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <ShoppingBag className="h-16 w-16 text-green-200" />
                  )}
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                  </div>
                  <p className="text-2xl text-green-600">
                    ${product.price.toFixed(2)}
                  </p>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary" className="mb-4">
                    {product.category}
                  </Badge>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 cursor-pointer"
                    onClick={() => handleAddToCart(product)}
                    disabled={user ? !allowCartActions : false}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {filteredItems.length > 0 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              paginationArray={generatePaginationArray(currentPage, totalPages)}
              alwaysShow={true}
            />
          )}
        </div>
      </section>

      {/* Shop Info */}
      <section className="py-16 bg-green-50">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl mb-4">Visit Our Gift Shop</h2>
            <p className="text-gray-600 mb-6">
              Our gift shop is located near the main entrance and is open during
              all zoo hours. Members receive exclusive discounts on all
              purchases!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white p-6 rounded-lg">
                <div className="flex justify-center text-green-600 mb-2">
                  <MapPin size={32} />
                </div>
                <p className="font-medium">Main Entrance</p>
                <p className="text-sm text-gray-600">Easy to find</p>
              </div>
              <div className="bg-white p-6 rounded-lg">
                <div className="flex justify-center text-green-600 mb-2">
                  <CreditCard size={32} />
                </div>
                <p className="font-medium">All Payments</p>
                <p className="text-sm text-gray-600">Cash & Card accepted</p>
              </div>
              <div className="bg-white p-6 rounded-lg">
                <div className="flex justify-center text-green-600 mb-2">
                  <Gift size={32} />
                </div>
                <p className="font-medium">Gift Wrapping</p>
                <p className="text-sm text-gray-600">Available upon request</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
