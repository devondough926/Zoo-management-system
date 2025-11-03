import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog.jsx";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Crown,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { useData } from "../data/DataContext";
import { usePricing } from "../data/PricingContext";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useHeroImage } from "../utils/heroImages";
import { purchasesAPI } from "../services/customerAPI";

export function CartPage({
  cart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
}) {
  const navigate = useNavigate();
  const {
    purchases,
    addPurchase,
    tickets,
    addTicket,
    addPurchaseItem,
    addPurchaseConcessionItem,
    memberships,
    addMembership,
    updateMembership,
  } = useData();
  const { membershipPrice } = usePricing();
  const { user } = useAuth();
  const heroImage = useHeroImage("cart");
  const [itemToRemove, setItemToRemove] = useState(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);

  // Check if current user has an active membership
  const hasMembership =
    user &&
    "Customer_ID" in user &&
    memberships.some(
      (m) => m.Customer_ID === user.Customer_ID && m.Membership_Status
    );

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Apply 10% member discount to items and food (not tickets or memberships)
  const memberDiscount = hasMembership
    ? cart
        .filter((item) => item.id < 9000 && item.type !== "ticket")
        .reduce((sum, item) => sum + item.price * item.quantity * 0.1, 0)
    : 0;

  const discountedSubtotal = subtotal - memberDiscount;
  const tax = discountedSubtotal * 0.08;
  const total = discountedSubtotal + tax;

  const handleIncreaseQuantity = (item) => {
    // Prevent increasing membership quantity beyond 1
    if (item.id === 9000) {
      toast.error("You can only have one membership in the cart!");
      return;
    }
    updateCartQuantity(item.id, item.type, item.quantity + 1);
  };

  const handleDecreaseQuantity = (item) => {
    if (item.quantity > 1) {
      updateCartQuantity(item.id, item.type, item.quantity - 1);
    } else {
      setItemToRemove({ id: item.id, type: item.type, name: item.name });
    }
  };

  const handleRemoveItem = (item) => {
    setItemToRemove({ id: item.id, type: item.type, name: item.name });
  };

  const confirmRemove = () => {
    if (itemToRemove) {
      removeFromCart(itemToRemove.id, itemToRemove.type);
      setItemToRemove(null);
    }
  };

  const confirmClearCart = () => {
    clearCart();
    setShowClearDialog(false);
  };

  const handleCheckout = () => {
    setShowCheckoutDialog(true);
  };

  const confirmCheckout = async () => {
    if (!user || !("Customer_ID" in user)) {
      toast.error("Please log in to complete your purchase");
      setShowCheckoutDialog(false);
      return;
    }

    const hasMembershipInCart = cart.some((item) => item.id === 9000);

    try {
      // Get current local datetime in ISO format
      const now = new Date();
      const localDatetime = new Date(
        now.getTime() - now.getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      // Prepare purchase data for backend
      const purchaseData = {
        customerId: user.Customer_ID,
        totalAmount: total,
        paymentMethod: "Card",
        purchaseDate: localDatetime,
        tickets: [],
        items: [],
        concessionItems: [],
        membership: null,
      };

      // Process cart items
      cart.forEach((item) => {
        if (item.type === "ticket") {
          const ticketType = item.name.split(" ")[0];
          purchaseData.tickets.push({
            ticketType: ticketType,
            price: item.price,
            quantity: item.quantity,
          });
        } else if (item.type === "item") {
          if (item.id === 9000) {
            // Handle membership
            purchaseData.membership = {
              price: membershipPrice,
            };
            purchaseData.items.push({
              itemId: item.id,
              quantity: item.quantity,
              unitPrice: membershipPrice,
            });
          } else {
            // Apply member discount to eligible gift shop items
            const unitPrice = hasMembership ? item.price * 0.9 : item.price;
            purchaseData.items.push({
              itemId: item.id,
              quantity: item.quantity,
              unitPrice: unitPrice,
            });
          }
        } else if (item.type === "food") {
          // Apply member discount to eligible food items
          const unitPrice = hasMembership ? item.price * 0.9 : item.price;
          purchaseData.concessionItems.push({
            concessionItemId: item.id,
            quantity: item.quantity,
            unitPrice: unitPrice,
          });
        }
      });

      // Call backend API to create purchase
      const response = await purchasesAPI.create(purchaseData);

      // Update local state as fallback
      const customerPurchases =
        purchases?.filter((p) => p.Customer_ID === user.Customer_ID) ?? [];
      const customerPurchaseNumber = customerPurchases.length + 1;

      // Add purchase to local state for immediate UI update
      addPurchase({
        Purchase_ID: response.purchaseId,
        Customer_ID: user.Customer_ID,
        Purchase_Date: response.purchase.Purchase_Date,
        Total_Amount: total,
        Payment_Method: "Card",
      });

      // Add items to local state
      cart.forEach((item) => {
        if (item.type === "ticket") {
          const ticketType = item.name.split(" ")[0];
          addTicket({
            Ticket_ID: Math.random(), // Backend creates actual IDs
            Purchase_ID: response.purchaseId,
            Ticket_Type: ticketType,
            Price: item.price,
            Quantity: item.quantity,
          });
        } else if (item.type === "item") {
          const unitPrice =
            item.id === 9000
              ? membershipPrice
              : hasMembership
              ? item.price * 0.9
              : item.price;
          addPurchaseItem({
            Purchase_ID: response.purchaseId,
            Item_ID: item.id,
            Quantity: item.quantity,
            Unit_Price: unitPrice,
          });
        } else if (item.type === "food") {
          const unitPrice = hasMembership ? item.price * 0.9 : item.price;
          addPurchaseConcessionItem({
            Purchase_ID: response.purchaseId,
            Concession_Item_ID: item.id,
            Quantity: item.quantity,
            Unit_Price: unitPrice,
          });
        }
      });

      // Update membership in local state if purchased
      if (hasMembershipInCart) {
        const existingMembership = memberships.find(
          (m) => m.Customer_ID === user.Customer_ID
        );

        const purchaseDate = new Date(response.purchase.Purchase_Date);
        const DAY_MS = 24 * 60 * 60 * 1000;
        let baseDate = purchaseDate;

        if (existingMembership && existingMembership.End_Date) {
          const existingEnd = new Date(existingMembership.End_Date);
          if (
            !isNaN(existingEnd.getTime()) &&
            existingEnd.getTime() > purchaseDate.getTime()
          ) {
            baseDate = existingEnd;
          }
        }

        const endDate = new Date(baseDate.getTime() + 365 * DAY_MS);
        const endDateIso = endDate.toISOString().slice(0, 10);

        if (existingMembership) {
          updateMembership(existingMembership.Customer_ID, {
            Membership_Status: true,
            Start_Date:
              existingMembership.Start_Date || response.purchase.Purchase_Date,
            End_Date: endDateIso,
            Price: membershipPrice,
          });
        } else {
          addMembership({
            Membership_ID:
              Math.max(...memberships.map((m) => m.Membership_ID), 0) + 1,
            Customer_ID: user.Customer_ID,
            Membership_Status: true,
            Start_Date: response.purchase.Purchase_Date,
            End_Date: endDateIso,
            Price: membershipPrice,
          });
        }
      }

      clearCart();
      setShowCheckoutDialog(false);
      toast.success(`Purchase confirmed! Order #${customerPurchaseNumber}`);
    } catch (error) {
      console.error("Checkout error:", error);

      // Fallback to local-only checkout if backend fails
      toast.warning("Using offline mode for checkout");

      const newPurchaseId =
        Math.max(...(purchases?.map((p) => p.Purchase_ID) ?? [0]), 0) + 1;
      const customerPurchases =
        purchases?.filter((p) => p.Customer_ID === user.Customer_ID) ?? [];
      const customerPurchaseNumber = customerPurchases.length + 1;

      let purchaseDateTime = new Date();

      if (customerPurchases.length > 0) {
        const mostRecentPurchase = customerPurchases.reduce(
          (latest, current) => {
            const latestTime = new Date(latest.Purchase_Date).getTime();
            const currentTime = new Date(current.Purchase_Date).getTime();
            return currentTime > latestTime ? current : latest;
          }
        );

        const mostRecentTime = new Date(
          mostRecentPurchase.Purchase_Date
        ).getTime();
        const currentTime = purchaseDateTime.getTime();

        if (currentTime <= mostRecentTime) {
          purchaseDateTime = new Date(mostRecentTime + 1000);
        }
      }

      const formatDateTime = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      };

      const newPurchase = {
        Purchase_ID: newPurchaseId,
        Customer_ID: user.Customer_ID,
        Purchase_Date: formatDateTime(purchaseDateTime),
        Total_Amount: total,
        Payment_Method: "Card",
      };

      addPurchase(newPurchase);

      let nextTicketId =
        Math.max(0, ...(tickets?.map((t) => t.Ticket_ID) ?? [0])) + 1;

      cart.forEach((item) => {
        if (item.type === "ticket") {
          const ticketType = item.name.split(" ")[0];
          addTicket({
            Ticket_ID: nextTicketId++,
            Purchase_ID: newPurchaseId,
            Ticket_Type: ticketType,
            Price: item.price,
            Quantity: item.quantity,
          });
        } else if (item.type === "item") {
          if (item.id === 9000) {
            addPurchaseItem({
              Purchase_ID: newPurchaseId,
              Item_ID: item.id,
              Quantity: item.quantity,
              Unit_Price: membershipPrice,
            });
          } else {
            const unitPrice = hasMembership ? item.price * 0.9 : item.price;
            addPurchaseItem({
              Purchase_ID: newPurchaseId,
              Item_ID: item.id,
              Quantity: item.quantity,
              Unit_Price: unitPrice,
            });
          }
        } else if (item.type === "food") {
          const concessionUnitPrice = hasMembership
            ? item.price * 0.9
            : item.price;
          addPurchaseConcessionItem({
            Purchase_ID: newPurchaseId,
            Concession_Item_ID: item.id,
            Quantity: item.quantity,
            Unit_Price: concessionUnitPrice,
          });
        }
      });

      if (hasMembershipInCart) {
        const existingMembership = memberships.find(
          (m) => m.Customer_ID === user.Customer_ID
        );

        const DAY_MS = 24 * 60 * 60 * 1000;
        let baseDate = purchaseDateTime;
        if (existingMembership && existingMembership.End_Date) {
          const existingEnd = new Date(existingMembership.End_Date);
          if (
            !isNaN(existingEnd.getTime()) &&
            existingEnd.getTime() > purchaseDateTime.getTime()
          ) {
            baseDate = existingEnd;
          }
        }

        const endDate = new Date(baseDate.getTime() + 365 * DAY_MS);
        const endDateIso = endDate.toISOString().slice(0, 10);

        if (existingMembership) {
          const startDateToUse =
            existingMembership.Start_Date || formatDateTime(purchaseDateTime);
          updateMembership(existingMembership.Customer_ID, {
            Membership_Status: true,
            Start_Date: startDateToUse,
            End_Date: endDateIso,
            Price: membershipPrice,
          });
        } else {
          const newMembershipId =
            Math.max(...memberships.map((m) => m.Membership_ID), 0) + 1;
          addMembership({
            Membership_ID: newMembershipId,
            Customer_ID: user.Customer_ID,
            Membership_Status: true,
            Start_Date: formatDateTime(purchaseDateTime),
            End_Date: endDateIso,
            Price: membershipPrice,
          });
        }
      }

      clearCart();
      setShowCheckoutDialog(false);
      toast.success(`Purchase confirmed! Order #${customerPurchaseNumber}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 to-emerald-700 text-white py-16 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src={heroImage}
            alt="Shopping Cart"
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

        {/* Content */}
        <div className="container mx-auto px-6 relative z-10">
          <h1 className="text-4xl md:text-5xl mb-4 drop-shadow-lg">
            Shopping Cart
          </h1>
          <p className="text-xl text-green-100 drop-shadow-md">
            Review your items and proceed to checkout
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Cart Items ({cart.length})</CardTitle>
                    {cart.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowClearDialog(true)}
                        className="text-red-600 border-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        Clear Cart
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {cart.length > 0 ? (
                    <div className="space-y-4">
                      {cart.map((item) => {
                        if (
                          !item ||
                          item.price === undefined ||
                          item.quantity === undefined
                        ) {
                          return null;
                        }

                        return (
                          <div
                            key={`${item.type}-${item.id}`}
                            className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200"
                          >
                            <div className="flex-1">
                              <h3 className="font-medium">{item.name}</h3>
                              <p className="text-sm text-gray-600">
                                ${item.price.toFixed(2)} each
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {item.id === 9000
                                  ? "Membership"
                                  : item.type === "ticket"
                                  ? "Ticket"
                                  : item.type === "food"
                                  ? "Food Item"
                                  : "Gift Shop Item"}
                              </p>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-300 px-2 py-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDecreaseQuantity(item)}
                                  className="h-6 w-6 p-0 cursor-pointer"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center font-medium">
                                  {item.quantity}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleIncreaseQuantity(item)}
                                  className="h-6 w-6 p-0 cursor-pointer"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>

                              <span className="text-lg text-green-600 font-semibold min-w-[80px] text-right">
                                ${(item.price * item.quantity).toFixed(2)}
                              </span>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(item)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">Your cart is empty</p>
                      <Button
                        className="bg-green-600 hover:bg-green-700 cursor-pointer"
                        onClick={() => navigate("/shop")}
                      >
                        Continue Shopping
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-700">
                      <span>Subtotal:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>

                    {hasMembership && memberDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4" />
                          <span>Member Discount (10%):</span>
                        </div>
                        <span>-${memberDiscount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-gray-700">
                      <span>Tax (8%):</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                      <span>Total:</span>
                      <span className="text-green-600">
                        ${total.toFixed(2)}
                      </span>
                    </div>

                    {hasMembership && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                        <div className="flex items-center gap-2 text-green-700 text-sm">
                          <Crown className="h-4 w-4" />
                          <span>Member discount applied!</span>
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 mt-6 cursor-pointer"
                      disabled={cart.length === 0}
                      onClick={handleCheckout}
                    >
                      Proceed to Checkout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <AlertDialog
        open={itemToRemove !== null}
        onOpenChange={() => setItemToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToRemove?.name}" from your
              cart?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              className="bg-red-600 hover:bg-red-700 cursor-pointer"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Cart?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all items from your cart? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClearCart}
              className="bg-red-600 hover:bg-red-700 cursor-pointer"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showCheckoutDialog}
        onOpenChange={setShowCheckoutDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
            <AlertDialogDescription>
              Review your order details and confirm your purchase.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {hasMembership && memberDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Member Discount (10%):</span>
                  <span>-${memberDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax (8%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total:</span>
                <span className="text-green-600">${total.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <span className="text-sm text-blue-700">
                Payment will be processed via card.
              </span>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCheckout}
              className="bg-green-600 hover:bg-green-700 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirm Purchase
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
