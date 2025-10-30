import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { loginAccounts, customers, getEmployeeRole } from "../data/mockData";
import { ArrowLeft } from "lucide-react";
import { ZooLogo } from "../components/ZooLogo";
import { toast } from "sonner";
import { authAPI } from "../services/customerAPI";

export function LoginPage({ onLogin, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginType, setLoginType] = useState("customer"); // 'employee' or 'customer'
  const [showSignup, setShowSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Signup form state
  const [signupData, setSignupData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleQuickLogin = (user, type) => {
    onLogin(user, type);
  };

  const handleFormLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (loginType === "employee") {
        // Employee login uses business-specific accounts
        const employee = loginAccounts.find((emp) => emp.Email === email);
        if (employee) {
          onLogin(employee, "employee");
          toast.success("Logged in successfully!");
        } else {
          toast.error("Invalid email or password");
        }
      } else {
        // Customer login tries backend first, then falls back to mock data
        try {
          const response = await authAPI.login(email, password);
          onLogin(response.customer, "customer");
          toast.success("Logged in successfully!");
        } catch (error) {
          // If backend fails, fall back to mock data
          const customer = customers.find((cust) => cust.Email === email);
          if (customer && customer.Customer_Password === password) {
            onLogin(customer, "customer");
            toast.success("Logged in successfully");
          } else {
            toast.error(error.message || "Invalid email or password");
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (signupData.password !== signupData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (signupData.password.length < 6) {
      toast.error("Password must be at least 6 characters long!");
      return;
    }

    setIsLoading(true);

    try {
      // Register with backend
      const response = await authAPI.register({
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        email: signupData.email,
        phone: signupData.phone,
        password: signupData.password,
      });

      toast.success("Account created successfully! Please log in to continue.");
      setShowSignup(false);
      setEmail(signupData.email);

      // Clear signup form
      setSignupData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      // Show error message if registration fails
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 text-white hover:bg-white/20"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        {/* Logo */}
        <div className="flex items-center justify-center space-x-3 mb-8">
          <ZooLogo size={60} className="bg-white rounded-full p-2" />
          <span className="text-4xl font-semibold text-white">
            WildWood Zoo
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Login/Signup Card - Simple Toggle */}
          <div>
            {!showSignup ? (
              // Login Form
              <Card>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>
                    Sign in to your Wildwood Zoo account
                  </CardDescription>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant={loginType === "customer" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLoginType("customer")}
                      className={loginType === "customer" ? "bg-green-600" : ""}
                    >
                      Customer
                    </Button>
                    <Button
                      variant={loginType === "employee" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setLoginType("employee")}
                      className={loginType === "employee" ? "bg-green-600" : ""}
                    >
                      Staff
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleFormLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={
                          loginType === "customer"
                            ? "customer@wildwoodzoo.com"
                            : "staff@wildwoodzoo.com"
                        }
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder={password ? "••••••••" : ""}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={isLoading}
                    >
                      {isLoading ? "Signing In..." : "Sign In"}
                    </Button>
                  </form>

                  {loginType === "customer" && (
                    <div className="mt-6 text-center">
                      <p className="text-sm text-gray-600">
                        Don't have an account?{" "}
                        <button
                          onClick={() => setShowSignup(true)}
                          className="text-teal-600 hover:text-teal-700 underline cursor-pointer font-medium"
                        >
                          Register
                        </button>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              // Signup Form
              <Card>
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>
                    Join Wildwood Zoo and enjoy exclusive benefits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={signupData.firstName}
                          onChange={(e) =>
                            setSignupData({
                              ...signupData,
                              firstName: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={signupData.lastName}
                          onChange={(e) =>
                            setSignupData({
                              ...signupData,
                              lastName: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="signupEmail">Email</Label>
                      <Input
                        id="signupEmail"
                        type="email"
                        value={signupData.email}
                        onChange={(e) =>
                          setSignupData({
                            ...signupData,
                            email: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone (Optional)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="555-0101"
                        value={signupData.phone}
                        onChange={(e) =>
                          setSignupData({
                            ...signupData,
                            phone: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="signupPassword">Password</Label>
                      <Input
                        id="signupPassword"
                        type="password"
                        value={signupData.password}
                        onChange={(e) =>
                          setSignupData({
                            ...signupData,
                            password: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={signupData.confirmPassword}
                        onChange={(e) =>
                          setSignupData({
                            ...signupData,
                            confirmPassword: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-teal-600 hover:bg-teal-700"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                      Already have an account?{" "}
                      <button
                        onClick={() => setShowSignup(false)}
                        className="text-green-600 hover:text-green-700 underline cursor-pointer font-medium"
                      >
                        Login
                      </button>
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Login Options */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Login (Demo Accounts)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {/* Customer Accounts */}
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Customer Accounts</h4>
                  {customers.map((customer) => (
                    <Button
                      key={customer.Customer_ID}
                      variant="outline"
                      className="w-full justify-start hover:bg-green-50 mb-2"
                      onClick={() => handleQuickLogin(customer, "customer")}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="text-left">
                          <p className="font-medium">
                            {customer.First_Name} {customer.Last_Name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {customer.Email}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-purple-100 text-purple-800"
                        >
                          Customer
                        </Badge>
                      </div>
                    </Button>
                  ))}
                </div>

                {/* Staff Accounts */}
                <div>
                  <h4 className="font-medium mb-2">Staff Accounts</h4>
                  {loginAccounts.map((employee) => (
                    <Button
                      key={employee.Employee_ID}
                      variant="outline"
                      className="w-full justify-start hover:bg-green-50 mb-2"
                      onClick={() => handleQuickLogin(employee, "employee")}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="text-left">
                          <p className="font-medium">
                            {employee.First_Name} {employee.Last_Name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {employee.Email}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={
                            getEmployeeRole(employee) === "Administrator"
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }
                        >
                          {getEmployeeRole(employee)}
                        </Badge>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
