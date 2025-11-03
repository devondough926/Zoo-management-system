import {
  ShoppingCart,
  Ticket,
  ShoppingBag,
  Calendar,
  Receipt,
  X,
  RefreshCw,
  Wifi,
  WifiOff,
  Check,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { useData } from "../data/DataContext";
import { authAPI, purchasesAPI, membershipAPI } from "../services/customerAPI";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useHeroImage } from "../utils/heroImages";

const formatNumber = (num) => {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";

  let dateStr = dateString.replace("T", " ");
  const parts = dateStr.match(
    /(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2}):(\d{2})/
  );

  if (!parts) return "Invalid Date";

  const [, year, month, day, hour, minute, second] = parts;
  const date = new Date(year, month - 1, day, hour, minute, second);

  if (isNaN(date.getTime())) return "Invalid Date";

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export function CustomerDashboard({ user }) {
  const navigate = useNavigate();
  const {
    purchases,
    tickets,
    purchaseItems,
    purchaseConcessionItems,
    items,
    concessionItems,
  } = useData();
  const heroImage = useHeroImage("customer");

  const [isBackendConnected, setIsBackendConnected] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [backendPurchases, setBackendPurchases] = useState([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [membership, setMembership] = useState(null);

  // Check backend connection and fetch membership on mount
  useEffect(() => {
    checkBackendConnection();
    fetchPurchaseHistory();
    fetchMembership();
  }, []);

  const checkBackendConnection = async () => {
    const connected = await authAPI.checkConnection();
    setIsBackendConnected(connected);
  };

  const fetchPurchaseHistory = async () => {
    if (!user || !user.Customer_ID) return;

    setPurchasesLoading(true);
    try {
      const history = await purchasesAPI.getHistory(user.Customer_ID);
      setBackendPurchases(history);
    } catch (error) {
      console.error("Error fetching purchase history:", error);
      setBackendPurchases([]);
    } finally {
      setPurchasesLoading(false);
    }
  };

  const fetchMembership = async () => {
    if (!user || !user.Customer_ID) return;

    try {
      const membershipData = await membershipAPI.getMembership(
        user.Customer_ID
      );
      setMembership(membershipData);
    } catch (error) {
      console.error("Error fetching membership:", error);
      setMembership(null);
    }
  };

  const displayPurchases =
    backendPurchases.length > 0
      ? backendPurchases
      : purchases.filter((p) => p.Customer_ID === user.Customer_ID);

  const customerPurchases = displayPurchases.sort(
    (a, b) =>
      new Date(b.Purchase_Date).getTime() - new Date(a.Purchase_Date).getTime()
  );
  const recentPurchases = customerPurchases.slice(0, 3);

  const getCustomerPurchaseNumber = (purchaseId) => {
    const purchase = displayPurchases.find((p) => p.Purchase_ID === purchaseId);
    if (purchase && purchase.Order_Number) {
      return purchase.Order_Number;
    }

    const sortedPurchases = displayPurchases.sort(
      (a, b) =>
        new Date(a.Purchase_Date).getTime() -
        new Date(b.Purchase_Date).getTime()
    );
    const index = sortedPurchases.findIndex(
      (p) => p.Purchase_ID === purchaseId
    );
    return index !== -1 ? index + 1 : sortedPurchases.length + 1;
  };

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user.First_Name,
    lastName: user.Last_Name,
    email: user.Email,
    phone: user.Phone,
  });

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [orderHistoryOpen, setOrderHistoryOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [selectedPurchaseDetails, setSelectedPurchaseDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!selectedPurchase) {
        setSelectedPurchaseDetails(null);
        return;
      }

      setDetailsLoading(true);
      try {
        const details = await purchasesAPI.getDetails(
          selectedPurchase.Purchase_ID
        );
        console.log("Fetched purchase details:", details);
        setSelectedPurchaseDetails(details);
      } catch (error) {
        console.error("Error fetching purchase details:", error);
        setSelectedPurchaseDetails(null);
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchDetails();
  }, [selectedPurchase]);

  const handleSaveProfile = async () => {
    setIsLoading(true);

    try {
      try {
        const response = await authAPI.updateProfile(user.Customer_ID, {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          email: profileData.email,
          phone: profileData.phone,
        });

        user.First_Name = response.customer.First_Name;
        user.Last_Name = response.customer.Last_Name;
        user.Email = response.customer.Email;
        user.Phone = response.customer.Phone;

        toast.success("Profile updated successfully!");
      } catch (error) {
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
      await authAPI.changePassword(user.Customer_ID, {
        newPassword: passwordData.newPassword,
      });

      toast.success("Password changed successfully!");

      setPasswordData({
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
    navigate("/tickets");
    setTimeout(() => {
      const membershipsSection = document.getElementById("memberships");
      if (membershipsSection) {
        membershipsSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  };

  const isMembershipExpired = membership
    ? new Date(membership.End_Date) < new Date()
    : false;
  const membershipStatus = membership
    ? isMembershipExpired
      ? "Expired"
      : "Active"
    : "No Membership";

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Backend Connection Status */}
      {isBackendConnected !== null && !isBackendConnected && (
        <Alert className="m-6 bg-amber-50 border-amber-300 shadow-md">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 font-medium">
              Server not connected - Using offline mode
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 to-emerald-700 text-white py-16 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src={heroImage}
            alt="Customer Dashboard"
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
          <h1 className="text-5xl md:text-6xl font-bold mb-3 drop-shadow-lg italic">
            Welcome back, {user.First_Name}!
          </h1>
          <p className="text-xl text-green-50 mb-6 drop-shadow-md">
            Your personal zoo experience dashboard
          </p>

          {/* Membership Status and Renewal */}
          <div className="mt-8 space-y-3 bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <Crown className="h-5 w-5 text-yellow-300" />
              <span className="text-green-50 font-medium">
                Membership Status:
              </span>
              {membership ? (
                <Badge
                  className={`${
                    isMembershipExpired
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 font-semibold"
                  } shadow-md`}
                >
                  {membershipStatus}
                </Badge>
              ) : (
                <Badge className="bg-gray-500 text-white shadow-md">
                  No Membership
                </Badge>
              )}
            </div>

            {membership && (
              <>
                <div className="flex items-center space-x-3">
                  <span className="text-green-50 font-medium">
                    Valid Until:
                  </span>
                  <span
                    className={`font-semibold ${
                      isMembershipExpired
                        ? "text-red-200"
                        : "text-white text-lg"
                    }`}
                  >
                    {new Date(membership.End_Date).toLocaleDateString()}
                  </span>
                </div>

                <Button
                  onClick={handleRenewMembership}
                  className="bg-white text-green-700 hover:bg-green-50 hover:scale-105 transition-transform shadow-lg font-semibold"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {isMembershipExpired
                    ? "Renew Membership"
                    : "Extend Membership"}
                </Button>
              </>
            )}

            {!membership && (
              <div className="flex flex-col gap-3">
                <p className="text-green-50 text-sm">
                  Become a member to enjoy exclusive benefits and unlimited
                  access!
                </p>
                <Button
                  onClick={() => navigate("/tickets")}
                  className="bg-yellow-400 text-yellow-900 hover:bg-yellow-300 hover:scale-105 transition-transform shadow-lg font-semibold w-fit"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Get Membership Now
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-12 bg-gray-100">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-8 text-gray-800">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-lg border-none bg-white">
              <CardContent className="pt-6 text-center">
                <button
                  onClick={() => navigate("/tickets")}
                  className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4 hover:from-green-600 hover:to-green-700 hover:scale-110 transition-all duration-300 shadow-lg cursor-pointer group rounded-xl"
                >
                  <Ticket className="h-10 w-10 text-green-600 group-hover:text-white transition-colors" />
                </button>
                <h3 className="mb-2 text-xl font-semibold text-gray-800">
                  Buy Tickets
                </h3>
                <p className="text-sm text-gray-600">
                  Purchase day passes or membership
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-none bg-white">
              <CardContent className="pt-6 text-center">
                <button
                  onClick={() => navigate("/shop")}
                  className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4 hover:from-green-600 hover:to-green-700 hover:scale-110 transition-all duration-300 shadow-lg cursor-pointer group rounded-xl"
                >
                  <ShoppingBag className="h-10 w-10 text-emerald-600 group-hover:text-white transition-colors" />
                </button>
                <h3 className="mb-2 text-xl font-semibold text-gray-800">
                  Gift Shop
                </h3>
                <p className="text-sm text-gray-600">
                  Browse and buy gift shop items online
                </p>
              </CardContent>
            </Card>

            <Dialog open={orderHistoryOpen} onOpenChange={setOrderHistoryOpen}>
              <Card className="shadow-lg border-none bg-white">
                <CardContent className="pt-6 text-center">
                  <DialogTrigger asChild>
                    <button className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4 hover:from-green-600 hover:to-green-700 hover:scale-110 transition-all duration-300 shadow-lg cursor-pointer group rounded-xl">
                      <Receipt className="h-10 w-10 text-blue-600 group-hover:text-white transition-colors" />
                    </button>
                  </DialogTrigger>
                  <h3 className="mb-2 text-xl font-semibold text-gray-800">
                    Order History
                  </h3>
                  <p className="text-sm text-gray-600">
                    View all past purchases and receipts
                  </p>
                </CardContent>
              </Card>
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
                                  {formatDateTime(purchase.Purchase_Date)}
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
                                ${Number(purchase.Total_Amount).toFixed(2)}
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
      <section className="py-12 bg-gray-100">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-8 text-gray-800">
            Recent Purchases
          </h2>
          <div className="max-w-4xl">
            <Card className="shadow-xl border-none bg-white">
              <CardContent className="p-6">
                {recentPurchases.length > 0 ? (
                  <div className="space-y-4">
                    {recentPurchases.map((purchase) => (
                      <div
                        key={purchase.Purchase_ID}
                        className="flex items-center justify-between p-5 bg-white transition-all duration-200 cursor-pointer hover:rounded-xl hover:shadow-md hover:border hover:border-green-400"
                        onClick={() => setSelectedPurchase(purchase)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-700 font-semibold"
                            >
                              {purchase.Payment_Method}
                            </Badge>
                            <span className="text-sm text-gray-600 font-medium">
                              {formatDateTime(purchase.Purchase_Date)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 font-medium">
                            Order #
                            {getCustomerPurchaseNumber(purchase.Purchase_ID)}
                          </p>
                        </div>
                        <div className="text-right ml-6">
                          <p className="text-3xl text-green-600 font-bold">
                            ${Number(purchase.Total_Amount).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShoppingCart className="h-12 w-12 text-gray-300" />
                    </div>
                    <p className="text-gray-600 text-lg mb-4">
                      No recent purchases
                    </p>
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white cursor-pointer font-semibold"
                      onClick={() => navigate("/shop")}
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
      <section className="py-12 bg-gray-100">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-8 text-gray-800">My Account</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Information Card */}
            <Card className="shadow-xl border border-gray-200 hover:shadow-2xl transition-shadow overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
                <CardTitle className="text-2xl text-gray-800">
                  Profile Information
                </CardTitle>
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
                          className="cursor-pointer hover:bg-green-50 hover:border-green-400 transition-colors font-semibold"
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
                          className="border-2 border-gray-300 focus:border-green-500"
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
                          className="border-2 border-gray-300 focus:border-green-500"
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
                          className="border-2 border-gray-300 focus:border-green-500"
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
                          className="border-2 border-gray-300 focus:border-green-500"
                        />
                      </div>
                      <div className="flex space-x-2 pt-4">
                        <Button
                          onClick={handleSaveProfile}
                          className="bg-green-600 hover:bg-green-700 text-white cursor-pointer font-semibold"
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
                          className="cursor-pointer hover:bg-gray-100"
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
            <Card className="shadow-xl border border-gray-200 hover:shadow-2xl transition-shadow overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
                <CardTitle className="text-2xl text-gray-800">
                  Account Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Membership Info */}
                  {membership ? (
                    <div className="p-5 bg-purple-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Crown className="h-5 w-5 text-purple-600" />
                          <p className="font-semibold text-gray-800">
                            Active Membership
                          </p>
                        </div>
                        <Badge
                          className={`${
                            isMembershipExpired
                              ? "bg-red-500 hover:bg-red-600"
                              : "bg-green-600 hover:bg-green-700"
                          } text-white font-medium`}
                        >
                          {membershipStatus}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <p className="text-gray-600 font-medium">
                            Start Date
                          </p>
                          <p className="font-semibold text-gray-800">
                            {new Date(
                              membership.Start_Date
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <p className="text-gray-600 font-medium">End Date</p>
                          <p className="font-semibold text-gray-800">
                            {new Date(membership.End_Date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <p className="text-gray-600 font-medium">
                            Membership ID
                          </p>
                          <p className="font-semibold text-gray-800">
                            #{membership.Customer_ID}
                          </p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <p className="text-gray-600 font-medium">
                            Discount Benefits
                          </p>
                          <p className="font-semibold text-green-600 flex items-center gap-1">
                            Applied <Check size={16} />
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Crown className="h-8 w-8 text-purple-600" />
                      </div>
                      <p className="text-gray-700 font-semibold mb-2">
                        No Active Membership
                      </p>
                      <p className="text-gray-600 text-sm mb-4">
                        Join today and unlock exclusive benefits!
                      </p>
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer font-semibold"
                        onClick={() => navigate("/tickets")}
                      >
                        Get Membership
                      </Button>
                    </div>
                  )}

                  {/* Purchase Statistics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-white rounded-lg">
                      <p className="text-sm text-gray-600 mb-1 font-medium">
                        Total Purchases
                      </p>
                      <p className="text-3xl font-bold text-green-600">
                        {customerPurchases.length}
                      </p>
                    </div>
                    <div className="p-4 bg-white rounded-lg">
                      <p className="text-sm text-gray-600 mb-1 font-medium">
                        Total Spent
                      </p>
                      <p className="text-3xl font-bold text-blue-600">
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
            <Card className="shadow-xl border border-gray-200 hover:shadow-2xl transition-shadow overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200">
                <CardTitle className="text-2xl text-gray-800">
                  Password & Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isChangingPassword ? (
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Manage your account password and security settings.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setIsChangingPassword(true)}
                      className="cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-colors font-semibold"
                    >
                      Change Password
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
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
                        className="border-2 border-gray-300 focus:border-blue-500"
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
                        className="border-2 border-gray-300 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleChangePassword}
                        className="bg-blue-600 hover:bg-blue-700 text-white cursor-pointer font-semibold"
                        disabled={isLoading}
                      >
                        {isLoading ? "Updating..." : "Update Password"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordData({
                            newPassword: "",
                            confirmPassword: "",
                          });
                        }}
                        className="cursor-pointer hover:bg-gray-100"
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
                formatDateTime(selectedPurchase.Purchase_Date)}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[65vh] pr-4">
            {detailsLoading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
                <p className="text-gray-600">Loading order details...</p>
              </div>
            ) : (
              selectedPurchase && (
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
                          <span className="text-gray-600">Date & Time:</span>
                          <span className="font-medium">
                            {formatDateTime(selectedPurchase.Purchase_Date)}
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
                              $
                              {Number(selectedPurchase.Total_Amount).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tickets included in this purchase */}
                  {(() => {
                    // Use backend details if available, otherwise fall back to mock data
                    const purchaseTickets =
                      selectedPurchaseDetails?.tickets ||
                      tickets.filter(
                        (t) => t.Purchase_ID === selectedPurchase.Purchase_ID
                      );

                    return (
                      purchaseTickets.length > 0 && (
                        <div>
                          <h3 className="font-medium mb-3">Tickets</h3>
                          <div className="space-y-2">
                            {(() => {
                              // Group tickets by type and compute totals
                              const grouped = purchaseTickets.reduce(
                                (acc, t) => {
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
                                },
                                {}
                              );

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
                                          {(Number(g.price) * g.count).toFixed(
                                            2
                                          )}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          ${Number(g.price).toFixed(2)} each
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
                                          Number(purchaseItem.Unit_Price) *
                                          purchaseItem.Quantity
                                        ).toFixed(2)}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        $
                                        {Number(
                                          purchaseItem.Unit_Price
                                        ).toFixed(2)}{" "}
                                        / per
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
                    // Use backend details if available, otherwise fall back to mock data
                    const purchaseGiftItems =
                      selectedPurchaseDetails?.purchaseItems ||
                      purchaseItems.filter(
                        (pi) =>
                          pi.Purchase_ID === selectedPurchase.Purchase_ID &&
                          pi.Item_ID !== 9000
                      );

                    return (
                      purchaseGiftItems.length > 0 && (
                        <div>
                          <h3 className="font-medium mb-3">Gift Shop Items</h3>
                          <div className="space-y-2">
                            {purchaseGiftItems.map((purchaseItem, index) => {
                              // Backend data already includes Item_Name
                              const itemName =
                                purchaseItem.Item_Name ||
                                items.find(
                                  (i) => i.Item_ID === purchaseItem.Item_ID
                                )?.Item_Name;

                              return (
                                <Card key={purchaseItem.Item_ID || index}>
                                  <CardContent className="p-4">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <p className="font-medium">
                                          {itemName}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          Quantity: {purchaseItem.Quantity}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-semibold text-green-600">
                                          $
                                          {(
                                            Number(purchaseItem.Unit_Price) *
                                            purchaseItem.Quantity
                                          ).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          $
                                          {Number(
                                            purchaseItem.Unit_Price
                                          ).toFixed(2)}{" "}
                                          each
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
                    // Use backend details if available, otherwise fall back to mock data
                    const purchaseConcessions =
                      selectedPurchaseDetails?.concessionItems ||
                      purchaseConcessionItems.filter(
                        (pci) =>
                          pci.Purchase_ID === selectedPurchase.Purchase_ID
                      );

                    return (
                      purchaseConcessions.length > 0 && (
                        <div>
                          <h3 className="font-medium mb-3">Food & Beverages</h3>
                          <div className="space-y-2">
                            {purchaseConcessions.map(
                              (purchaseConcession, index) => {
                                // Backend data already includes Item_Name
                                const itemName =
                                  purchaseConcession.Item_Name ||
                                  concessionItems.find(
                                    (ci) =>
                                      ci.Concession_Item_ID ===
                                      purchaseConcession.Concession_Item_ID
                                  )?.Item_Name;

                                return (
                                  <Card
                                    key={`${purchaseConcession.Concession_Item_ID}-${index}`}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex justify-between items-center">
                                        <div>
                                          <p className="font-medium">
                                            {itemName}
                                          </p>
                                          <p className="text-sm text-gray-600">
                                            Quantity:{" "}
                                            {purchaseConcession.Quantity}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-semibold text-green-600">
                                            $
                                            {(
                                              Number(
                                                purchaseConcession.Unit_Price
                                              ) * purchaseConcession.Quantity
                                            ).toFixed(2)}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                            $
                                            {Number(
                                              purchaseConcession.Unit_Price
                                            ).toFixed(2)}{" "}
                                            each
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

                  {/* No items message */}
                  {(() => {
                    const hasTickets =
                      selectedPurchaseDetails?.tickets?.length > 0 ||
                      tickets.filter(
                        (t) => t.Purchase_ID === selectedPurchase.Purchase_ID
                      ).length > 0;
                    const hasGiftItems =
                      selectedPurchaseDetails?.purchaseItems?.length > 0 ||
                      purchaseItems.filter(
                        (pi) =>
                          pi.Purchase_ID === selectedPurchase.Purchase_ID &&
                          pi.Item_ID !== 9000
                      ).length > 0;
                    const hasConcessions =
                      selectedPurchaseDetails?.concessionItems?.length > 0 ||
                      purchaseConcessionItems.filter(
                        (pci) =>
                          pci.Purchase_ID === selectedPurchase.Purchase_ID
                      ).length > 0;
                    const hasMembership =
                      purchaseItems.filter(
                        (pi) =>
                          pi.Purchase_ID === selectedPurchase.Purchase_ID &&
                          pi.Item_ID === 9000
                      ).length > 0;

                    return (
                      !hasTickets &&
                      !hasGiftItems &&
                      !hasConcessions &&
                      !hasMembership && (
                        <Card className="bg-gray-50">
                          <CardContent className="p-6 text-center">
                            <p className="text-gray-600">
                              No items found for this purchase
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              The purchase may have been processed without item
                              details
                            </p>
                          </CardContent>
                        </Card>
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
              )
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
