// Removed type-only imports; mockData exports data arrays (e.g., customers, purchases)
import {
  ShoppingCart,
  Ticket,
  ShoppingBag,
  Calendar,
  Receipt,
  Eye,
  EyeOff,
  X,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { Crown } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { ScrollArea } from "../components/ui/scroll-area";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
// Removed type-only imports; use runtime values from context instead
import { useData } from "../data/DataContext";
import { authAPI } from "../services/customerAPI";

// Helper function to format numbers with commas
const formatNumber = (num) => {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export function CustomerDashboard({ user, onNavigate }) {
  const {
    purchases,
    tickets,
    purchaseItems,
    purchaseConcessionItems,
    memberships,
    items,
    concessionItems,
  } = useData();
  const customerPurchases = purchases
    .filter((p) => p.Customer_ID === user.Customer_ID)
    .sort(
      (a, b) =>
        new Date(b.Purchase_Date).getTime() -
        new Date(a.Purchase_Date).getTime()
    );
  const recentPurchases = customerPurchases.slice(0, 3);
  const membership =
    memberships.find(
      (m) => m.Customer_ID === user.Customer_ID && m.Membership_Status
    ) || null;

  // Backend connection state
  const [isBackendConnected, setIsBackendConnected] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check backend connection on mount
  useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    const connected = await authAPI.checkConnection();
    setIsBackendConnected(connected);
  };

  // Helper function to get customer-specific purchase number
  // Sorted chronologically (oldest = #1, newest = highest number)
  const getCustomerPurchaseNumber = (purchaseId) => {
    const sortedPurchases = purchases
      .filter((p) => p.Customer_ID === user.Customer_ID)
      .sort(
        (a, b) =>
          new Date(a.Purchase_Date).getTime() -
          new Date(b.Purchase_Date).getTime()
      );
    const index = sortedPurchases.findIndex(
      (p) => p.Purchase_ID === purchaseId
    );
    return index !== -1 ? index + 1 : sortedPurchases.length + 1;
  };

  // Edit Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user.First_Name,
    lastName: user.Last_Name,
    email: user.Email,
    phone: user.Phone,
  });

  // Password State
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Order History Dialog State
  const [orderHistoryOpen, setOrderHistoryOpen] = useState(false);

  // Purchase Detail Dialog State
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  const handleSaveProfile = async () => {
    setIsLoading(true);

    try {
      // Try to update profile via backend
      try {
        const response = await authAPI.updateProfile(user.Customer_ID, {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          email: profileData.email,
          phone: profileData.phone,
        });

        // Update local user object
        user.First_Name = response.customer.First_Name;
        user.Last_Name = response.customer.Last_Name;
        user.Email = response.customer.Email;
        user.Phone = response.customer.Phone;

        toast.success("Profile updated successfully!");
      } catch (error) {
        // Fallback: Update locally if backend fails
        user.First_Name = profileData.firstName;
        user.Last_Name = profileData.lastName;
        user.Email = profileData.email;
        user.Phone = profileData.phone;

        toast.success("Profile updated successfully!");
      }

      setIsEditingProfile(false);
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match!");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters!");
      return;
    }

    setIsLoading(true);

    try {
      // Try to change password via backend
      try {
        await authAPI.changePassword(user.Customer_ID, {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        });

        toast.success("Password changed successfully!");
      } catch (error) {
        // Fallback: Validate and update locally if backend fails
        if (
          user.Customer_Password &&
          user.Customer_Password !== passwordData.currentPassword
        ) {
          toast.error("Current password is incorrect!");
          setIsLoading(false);
          return;
        }

        // Update locally
        if (user.Customer_Password) {
          user.Customer_Password = passwordData.newPassword;
        }

        toast.success("Password changed successfully!");
      }

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsChangingPassword(false);
    } catch (error) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenewMembership = () => {
    // Navigate to tickets page membership section
    if (onNavigate) {
      onNavigate("tickets");
      // Scroll to memberships section after navigation
      setTimeout(() => {
        const membershipsSection = document.getElementById("memberships");
        if (membershipsSection) {
          membershipsSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
    }
  };

  // Check if membership is expired
  const isMembershipExpired = membership
    ? new Date(membership.End_Date) < new Date()
    : false;
  const membershipStatus = membership
    ? isMembershipExpired
      ? "Expired"
      : "Active"
    : "No Membership";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Backend Connection Status */}
      {isBackendConnected !== null && !isBackendConnected && (
        <Alert className="m-6 bg-amber-50 border-amber-200">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Backend not connected - Profile and password changes will only be
              saved locally
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-600 to-emerald-700 text-white py-16">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl mb-2">
            Welcome, {user.First_Name}!
          </h1>

          {/* Membership Status and Renewal */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center space-x-3">
              <span className="text-green-100">Membership Status:</span>
              {membership ? (
                <Badge
                  className={`${
                    isMembershipExpired
                      ? "bg-red-500"
                      : "bg-white text-green-700"
                  }`}
                >
                  {membershipStatus}
                </Badge>
              ) : (
                <Badge className="bg-gray-400 text-white">No Membership</Badge>
              )}
            </div>

            {membership && (
              <>
                <div className="flex items-center space-x-3">
                  <span className="text-green-100">Valid Until:</span>
                  <span
                    className={`font-medium ${
                      isMembershipExpired ? "text-red-200" : "text-white"
                    }`}
                  >
                    {new Date(membership.End_Date).toLocaleDateString()}
                  </span>
                </div>

                <Button
                  onClick={handleRenewMembership}
                  className="bg-white text-green-700 hover:bg-green-50 mt-2"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {isMembershipExpired
                    ? "Renew Membership"
                    : "Extend Membership"}
                </Button>
              </>
            )}

            {!membership && (
              <p className="text-green-100 text-sm">
                Become a member to enjoy exclusive benefits!
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => onNavigate && onNavigate("tickets")}
            >
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-600 transition-colors">
                  <Ticket className="h-8 w-8 text-green-600 group-hover:text-white" />
                </div>
                <h3 className="mb-2">Buy Tickets</h3>
                <p className="text-sm text-gray-600">
                  Purchase day passes or special event tickets
                </p>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => onNavigate && onNavigate("shop")}
            >
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-600 transition-colors">
                  <ShoppingBag className="h-8 w-8 text-green-600 group-hover:text-white" />
                </div>
                <h3 className="mb-2">Gift Shop</h3>
                <p className="text-sm text-gray-600">
                  Browse and buy gift shop items online
                </p>
              </CardContent>
            </Card>

            <Dialog open={orderHistoryOpen} onOpenChange={setOrderHistoryOpen}>
              <DialogTrigger asChild>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="pt-6 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-600 transition-colors">
                      <Receipt className="h-8 w-8 text-green-600 group-hover:text-white" />
                    </div>
                    <h3 className="mb-2">Order History</h3>
                    <p className="text-sm text-gray-600">
                      View all past purchases and receipts
                    </p>
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Order History</DialogTitle>
                  <DialogDescription>
                    View all past purchases and receipts
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[60vh] pr-4">
                  <div className="space-y-4">
                    {customerPurchases.length > 0 ? (
                      customerPurchases.map((purchase) => (
                        <div
                          key={purchase.Purchase_ID}
                          className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => {
                            setOrderHistoryOpen(false);
                            setSelectedPurchase(purchase);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <Badge variant="secondary">
                                  {purchase.Payment_Method}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {new Date(
                                    purchase.Purchase_Date
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">
                                Order #
                                {getCustomerPurchaseNumber(
                                  purchase.Purchase_ID
                                )}
                              </p>
                            </div>
                            <div className="text-right ml-6">
                              <p className="text-2xl text-green-600 font-semibold">
                                ${purchase.Total_Amount.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">No purchase history</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Recent Purchases */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl mb-6">Recent Purchases</h2>
          <div className="max-w-4xl">
            <Card>
              <CardContent className="p-6">
                {recentPurchases.length > 0 ? (
                  <div className="space-y-4">
                    {recentPurchases.map((purchase) => (
                      <div
                        key={purchase.Purchase_ID}
                        className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => setSelectedPurchase(purchase)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Badge variant="secondary">
                              {purchase.Payment_Method}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {new Date(
                                purchase.Purchase_Date
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            Order #
                            {getCustomerPurchaseNumber(purchase.Purchase_ID)}
                          </p>
                        </div>
                        <div className="text-right ml-6">
                          <p className="text-2xl text-green-600 font-semibold">
                            ${purchase.Total_Amount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No recent purchases</p>
                    <Button
                      className="mt-4 bg-green-600 hover:bg-green-700 cursor-pointer"
                      onClick={() => onNavigate && onNavigate("shop")}
                    >
                      Start Shopping
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Account Settings */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl mb-6">My Account</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Profile Information */}
                  {!isEditingProfile ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Customer ID
                        </label>
                        <p className="text-lg">#{user.Customer_ID}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Name
                        </label>
                        <p className="text-lg">
                          {user.First_Name} {user.Last_Name}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <p className="text-lg">{user.Email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Phone
                        </label>
                        <p className="text-lg">{user.Phone}</p>
                      </div>
                      <div className="pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditingProfile(true)}
                          className="cursor-pointer"
                        >
                          Edit Profile
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={profileData.firstName}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              firstName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={profileData.lastName}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              lastName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              email: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              phone: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="flex space-x-2 pt-4">
                        <Button
                          onClick={handleSaveProfile}
                          className="bg-green-600 hover:bg-green-700 cursor-pointer"
                          disabled={isLoading}
                        >
                          {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditingProfile(false);
                            setProfileData({
                              firstName: user.First_Name,
                              lastName: user.Last_Name,
                              email: user.Email,
                              phone: user.Phone,
                            });
                          }}
                          className="cursor-pointer"
                          disabled={isLoading}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Account Statistics Card */}
            <Card>
              <CardHeader>
                <CardTitle>Account Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Membership Info */}
                  {membership ? (
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-medium text-purple-900">
                          Active Membership
                        </p>
                        <Badge
                          className={`${
                            isMembershipExpired ? "bg-red-500" : "bg-green-600"
                          }`}
                        >
                          {membershipStatus}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">Start Date</p>
                          <p className="font-medium">
                            {new Date(
                              membership.Start_Date
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">End Date</p>
                          <p className="font-medium">
                            {new Date(membership.End_Date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Membership ID</p>
                          <p className="font-medium">
                            #{membership.Customer_ID}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Discount Benefits</p>
                          <p className="font-medium text-green-600">Applied</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
                      <Crown className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-600 mb-3">No Active Membership</p>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 cursor-pointer"
                        onClick={() => onNavigate && onNavigate("tickets")}
                      >
                        Get Membership
                      </Button>
                    </div>
                  )}

                  {/* Purchase Statistics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm text-gray-600 mb-1">
                        Total Purchases
                      </p>
                      <p className="text-2xl font-semibold text-green-600">
                        {customerPurchases.length}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                      <p className="text-2xl font-semibold text-blue-600">
                        $
                        {formatNumber(
                          customerPurchases.reduce(
                            (sum, p) => sum + p.Total_Amount,
                            0
                          )
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Password & Security Card */}
            <Card>
              <CardHeader>
                <CardTitle>Password & Security</CardTitle>
              </CardHeader>
              <CardContent>
                {!isChangingPassword ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={user.Customer_Password}
                        disabled
                        className="max-w-xs"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowPassword(!showPassword)}
                        className="cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setIsChangingPassword(true)}
                      className="cursor-pointer"
                    >
                      Change Password
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            currentPassword: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleChangePassword}
                        className="bg-green-600 hover:bg-green-700 cursor-pointer"
                        disabled={isLoading}
                      >
                        {isLoading ? "Updating..." : "Update Password"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordData({
                            currentPassword: "",
                            newPassword: "",
                            confirmPassword: "",
                          });
                        }}
                        className="cursor-pointer"
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Purchase Detail Dialog */}
      <Dialog
        open={selectedPurchase !== null}
        onOpenChange={() => setSelectedPurchase(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order #
              {selectedPurchase &&
                getCustomerPurchaseNumber(selectedPurchase.Purchase_ID)}{" "}
              -{" "}
              {selectedPurchase &&
                new Date(selectedPurchase.Purchase_Date).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-4">
            {selectedPurchase && (
              <div className="space-y-6">
                {/* Purchase Summary */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Order Number:</span>
                        <span className="font-medium">
                          #
                          {getCustomerPurchaseNumber(
                            selectedPurchase.Purchase_ID
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">
                          {new Date(
                            selectedPurchase.Purchase_Date
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Method:</span>
                        <Badge variant="secondary">
                          {selectedPurchase.Payment_Method}
                        </Badge>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex justify-between">
                          <span className="font-medium">Total Amount:</span>
                          <span className="text-2xl font-semibold text-green-600">
                            ${selectedPurchase.Total_Amount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tickets included in this purchase */}
                {(() => {
                  const purchaseTickets = tickets.filter(
                    (t) => t.Purchase_ID === selectedPurchase.Purchase_ID
                  );
                  return (
                    purchaseTickets.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-3">Tickets</h3>
                        <div className="space-y-2">
                          {(() => {
                            // Group tickets by type and compute totals
                            const grouped = purchaseTickets.reduce((acc, t) => {
                              const type = t.Ticket_Type || "Unknown";
                              const price = Number(t.Price) || 0;
                              const quantity = Number(t.Quantity) || 1;
                              if (!acc[type])
                                acc[type] = {
                                  Ticket_Type: type,
                                  count: 0,
                                  price,
                                };
                              acc[type].count += quantity;
                              acc[type].price = price;
                              return acc;
                            }, {});

                            return Object.values(grouped).map((g) => (
                              <Card key={g.Ticket_Type}>
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <p className="font-medium">
                                        {g.Ticket_Type} Ticket
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        Quantity: {g.count}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-semibold text-green-600">
                                        $
                                        {(Number(g.price) * g.count).toFixed(2)}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        ${Number(g.price).toFixed(2)} / per
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ));
                          })()}
                        </div>
                      </div>
                    )
                  );
                })()}

                {/* Membership included in this purchase */}
                {(() => {
                  const membershipItems = purchaseItems.filter(
                    (pi) =>
                      pi.Purchase_ID === selectedPurchase.Purchase_ID &&
                      pi.Item_ID === 9000
                  );
                  return (
                    membershipItems.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-3">Membership</h3>
                        <div className="space-y-2">
                          {membershipItems.map((purchaseItem, index) => (
                            <Card key={`membership-${index}`}>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="font-medium">
                                      Annual Membership
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Quantity: {purchaseItem.Quantity}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      1 Year Unlimited Access
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold text-green-600">
                                      $
                                      {(
                                        purchaseItem.Unit_Price *
                                        purchaseItem.Quantity
                                      ).toFixed(2)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      ${purchaseItem.Unit_Price.toFixed(2)} /
                                      per
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )
                  );
                })()}

                {/* Gift Shop Items included in this purchase */}
                {(() => {
                  const purchaseGiftItems = purchaseItems.filter(
                    (pi) =>
                      pi.Purchase_ID === selectedPurchase.Purchase_ID &&
                      pi.Item_ID !== 9000
                  );
                  return (
                    purchaseGiftItems.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-3">Gift Shop Items</h3>
                        <div className="space-y-2">
                          {purchaseGiftItems.map((purchaseItem) => {
                            const item = items.find(
                              (i) => i.Item_ID === purchaseItem.Item_ID
                            );
                            return (
                              <Card key={purchaseItem.Item_ID}>
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <p className="font-medium">
                                        {item?.Item_Name}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        Quantity: {purchaseItem.Quantity}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        Item ID: #{item?.Item_ID}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-semibold text-green-600">
                                        $
                                        {(
                                          purchaseItem.Unit_Price *
                                          purchaseItem.Quantity
                                        ).toFixed(2)}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        ${purchaseItem.Unit_Price.toFixed(2)} /
                                        per
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    )
                  );
                })()}

                {/* Concession Items included in this purchase */}
                {(() => {
                  const purchaseConcessions = purchaseConcessionItems.filter(
                    (pci) => pci.Purchase_ID === selectedPurchase.Purchase_ID
                  );
                  return (
                    purchaseConcessions.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-3">Food & Beverages</h3>
                        <div className="space-y-2">
                          {purchaseConcessions.map(
                            (purchaseConcession, index) => {
                              const item = concessionItems.find(
                                (ci) =>
                                  ci.Concession_Item_ID ===
                                  purchaseConcession.Concession_Item_ID
                              );
                              return (
                                <Card
                                  key={`${purchaseConcession.Concession_Item_ID}-${index}`}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <p className="font-medium">
                                          {item?.Item_Name}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          Quantity:{" "}
                                          {purchaseConcession.Quantity}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          Item ID: #{item?.Concession_Item_ID}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-semibold text-green-600">
                                          $
                                          {(
                                            purchaseConcession.Unit_Price *
                                            purchaseConcession.Quantity
                                          ).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          $
                                          {purchaseConcession.Unit_Price.toFixed(
                                            2
                                          )}{" "}
                                          / per
                                        </p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )
                  );
                })()}

                {/* Customer Info */}
                <div>
                  <h3 className="font-medium mb-3">Customer Information</h3>
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Customer ID:</span>
                          <span className="font-medium">
                            #{selectedPurchase.Customer_ID}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Name:</span>
                          <span className="font-medium">
                            {user.First_Name} {user.Last_Name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium">{user.Email}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
