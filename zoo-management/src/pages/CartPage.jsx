import { useState } from "react";
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
import { currentUser } from "../data/mockData";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { useData } from "../data/DataContext";
import { usePricing } from "../data/PricingContext";

export function CartPage({
  cart,
  removeFromCart,
  updateCartQuantity,
  clearCart,
  onNavigate,
}) {
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
  const [itemToRemove, setItemToRemove] = useState(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);

  // Check if current user has an active membership
  const hasMembership =
    currentUser &&
    "Customer_ID" in currentUser &&
    memberships.some(
      (m) => m.Customer_ID === currentUser.Customer_ID && m.Membership_Status
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

  const confirmCheckout = () => {
    if (!currentUser || !("Customer_ID" in currentUser)) {
      toast.error("Please log in to complete your purchase");
      setShowCheckoutDialog(false);
      return;
    }

    const hasMembershipInCart = cart.some((item) => item.id === 9000);
    const newPurchaseId =
      Math.max(...(purchases?.map((p) => p.Purchase_ID) ?? [0]), 0) + 1;
    const customerPurchases =
      purchases?.filter((p) => p.Customer_ID === currentUser.Customer_ID) ?? [];
    const customerPurchaseNumber = customerPurchases.length + 1;

    let purchaseDateTime = new Date();

    if (customerPurchases.length > 0) {
      const mostRecentPurchase = customerPurchases.reduce((latest, current) => {
        const latestTime = new Date(latest.Purchase_Date).getTime();
        const currentTime = new Date(current.Purchase_Date).getTime();
        return currentTime > latestTime ? current : latest;
      });

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
      Customer_ID: currentUser.Customer_ID,
      Purchase_Date: formatDateTime(purchaseDateTime),
      Total_Amount: total,
      Payment_Method: "Card",
    };

    addPurchase(newPurchase);

    // Prepare a starting Ticket_ID based on existing tickets so new tickets have unique IDs
    let nextTicketId =
      Math.max(0, ...(tickets?.map((t) => t.Ticket_ID) ?? [0])) + 1;

    cart.forEach((item) => {
      if (item.type === "ticket") {
        // Create a single ticket record per ticket type with Quantity set
        const ticketType = item.name.split(" ")[0];
        addTicket({
          Ticket_ID: nextTicketId++,
          Purchase_ID: newPurchaseId,
          Ticket_Type: ticketType,
          Price: item.price,
          Quantity: item.quantity,
        });
      } else if (item.type === "item") {
        // For gift shop items (including membership item id 9000), store unit price
        if (item.id === 9000) {
          // Memberships should not be shown as gift shop items
          addPurchaseItem({
            Purchase_ID: newPurchaseId,
            Item_ID: item.id,
            Quantity: item.quantity,
            Unit_Price: membershipPrice,
          });
        } else {
          // Apply member discount to eligible gift shop items
          const unitPrice = hasMembership ? item.price * 0.9 : item.price;
          addPurchaseItem({
            Purchase_ID: newPurchaseId,
            Item_ID: item.id,
            Quantity: item.quantity,
            Unit_Price: unitPrice,
          });
        }
      } else if (item.type === "food") {
        // Concession purchase items use Concession_Item_ID in the data model
        // Apply member discount to eligible food items
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
        (m) => m.Customer_ID === currentUser.Customer_ID
      );

      // Compute end date by extending the later of (existing end date) or (purchase date)
      const DAY_MS = 24 * 60 * 60 * 1000;
      // Determine base date to extend from: if current membership end is in future, extend from that; otherwise extend from purchase time
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
        // Preserve original Start_Date if present; otherwise set to purchase datetime
        const startDateToUse =
          existingMembership.Start_Date || formatDateTime(purchaseDateTime);
        // DataContext.updateMembership expects the customerId as the first arg
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
          Customer_ID: currentUser.Customer_ID,
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
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-green-600 to-emerald-700 text-white py-16">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl mb-4">Shopping Cart</h1>
          <p className="text-xl text-green-100">
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
                        onClick={() => onNavigate?.("shop")}
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
