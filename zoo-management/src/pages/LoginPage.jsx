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
import { ZooLogo } from "../components/ZooLogo";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/customerAPI";

export function LoginPage({ onLogin }) {
  const navigate = useNavigate();
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

  const handleFormLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (loginType === "employee") {
        // Employee login
        const response = await authAPI.loginEmployee(email, password);
        onLogin(response.employee, "employee", response.role);
        toast.success("Logged in successfully!");
      } else {
        // Customer login
        const response = await authAPI.login(email, password);
        onLogin(response.customer, "customer", null);
        toast.success("Logged in successfully!");
      }
    } catch (error) {
      toast.error(error.message || "Invalid email or password");
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
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 p-6 relative">
      {/* Back to Home Button - Top Left */}
      <Button
        variant="ghost"
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 text-gray-800 bg-transparent hover:text-green-600 hover:bg-transparent transition-colors z-10 font-medium"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>

      {/* Centered Container */}
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-sm">
          {/* Logo with drop shadow for standout effect */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="drop-shadow-2xl">
              <ZooLogo size={60} className="filter drop-shadow-lg" />
            </div>
            <span className="text-3xl font-bold text-white mt-3 drop-shadow-lg">
              WildWood Zoo
            </span>
            <p className="text-white/90 text-sm mt-1">
              Sign in to your account
            </p>
          </div>

          {/* Login/Signup Card - Centered */}
          {!showSignup ? (
            // Login Form
            <Card className="shadow-2xl">
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
            <Card className="shadow-2xl">
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
      </div>
    </div>
  );
}
