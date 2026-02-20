import React, { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

const LoginPage = () => {
  const { login, user } = useAuth(); // Add user to check if already logged in
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formKey, setFormKey] = useState(0); // Key to force re-render when needed
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const mountTime = useRef(Date.now());

  // Restore values from sessionStorage on mount
  useEffect(() => {
    const savedEmail = sessionStorage.getItem('login_email');
    const savedPassword = sessionStorage.getItem('login_password');
    
    if (savedEmail) {
      console.log("📧 Restored email from sessionStorage:", savedEmail);
      setEmail(savedEmail);
    }
    if (savedPassword) {
      console.log("🔒 Restored password from sessionStorage");
      setPassword(savedPassword);
    }
  }, []);

  // Save values to sessionStorage when they change
  useEffect(() => {
    if (email) {
      sessionStorage.setItem('login_email', email);
    }
  }, [email]);

  useEffect(() => {
    if (password) {
      sessionStorage.setItem('login_password', password);
    }
  }, [password]);

  // Clear sessionStorage on successful login
  useEffect(() => {
    if (error === "" && isLoading === false && email && password) {
      // Check if login was successful (no error and not loading)
      const timer = setTimeout(() => {
        // Only clear if we're not in an error state
        if (!error) {
          sessionStorage.removeItem('login_email');
          sessionStorage.removeItem('login_password');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [error, isLoading, email, password]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      console.log("User already logged in, redirecting to dashboard...");
      window.location.href = '/';
    }
  }, [user]);

  // Debug: Component mounting
  useEffect(() => {
    console.log("🚀 LoginPage mounted at:", new Date().toISOString());
    console.log("🚀 Mount time:", Date.now() - mountTime.current, "ms since init");
    return () => {
      console.log("🔴 LoginPage unmounted at:", new Date().toISOString());
    };
  }, []);

  // Debug: Monitor email state changes
  useEffect(() => {
    console.log("📧 Email state changed:", email);
  }, [email]);

  // Debug: Monitor password state changes
  useEffect(() => {
    console.log("🔒 Password state changed:", password ? "***" : "(empty)");
  }, [password]);

  // Debug: Monitor error state changes
  useEffect(() => {
    console.log("❌ Error state changed:", error);
  }, [error]);

  // Debug: Monitor loading state changes
  useEffect(() => {
    console.log("⏳ Loading state changed:", isLoading);
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsLoading(true);
    setError("");
    
    // Store current values
    const currentEmail = email;
    const currentPassword = password;
    
    console.log("Submitting with:", { email: currentEmail, password: "***" });
    
    try {
      const res = await api.post("/login", { email: currentEmail, password: currentPassword });
      login(res.data.token, res.data.user);
      
      // Redirect to dashboard after successful login
      console.log("Login successful, redirecting to dashboard...");
      window.location.href = '/';
    } catch (err: any) {
      console.log("Login failed, keeping email:", currentEmail);
      setError("Invalid email or password");
      
      // Force restore values after a tick
      setTimeout(() => {
        setEmail(currentEmail);
        setPassword(currentPassword);
        // Force re-render to ensure values stick
        setFormKey(prev => prev + 1);
      }, 10);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log("Email changed:", value);
    setEmail(value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              <span className="text-blue-600">CIT</span> Asset Manager
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Sign in to start your session
            </p>
          </CardHeader>
          <CardContent>
            <form key={`form-${formKey}`} onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    ref={emailInputRef}
                    key={`email-${formKey}`}
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={handleEmailChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    ref={passwordInputRef}
                    key={`password-${formKey}`}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={handlePasswordChange}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
