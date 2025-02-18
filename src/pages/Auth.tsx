import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Eye, EyeOff, Mail, User, Lock, Building2, Home, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import ProfileSetup from "./ProfileSetup";

type ViewType =
  | "role"
  | "login"
  | "register"
  | "forgot-password"
  | "update-password"
  | "profile-setup";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  // Read view from query parameter; default to "login"
  const queryView = searchParams.get("view") as ViewType | null;
  const initialView = queryView || "login";
  const [view, setView] = useState<ViewType>(initialView);
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Alerts and loading
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const mouseRef = useRef(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Track mouse movement for the glow effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (mouseRef.current) {
        const element = mouseRef.current as HTMLDivElement;
        const rect = element.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Update query parameter whenever the view changes
  useEffect(() => {
    setSearchParams({ view });
  }, [view, setSearchParams]);

  // Reset certain states when switching views
  useEffect(() => {
    setError("");
    setSuccess("");
    setPassword("");
    setShowPassword(false);
  }, [view]);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (profile?.role === "seller") {
          navigate("/seller-dashboard");
        } else {
          navigate("/dashboard");
        }
      }
    };

    checkAuth();
  }, [navigate]);

  // Glow styles based on mouse position
  const getGlowStyles = () => {
    const lightGlow = `
      radial-gradient(circle 400px at ${mousePosition.x}px ${mousePosition.y}px, 
        rgba(30, 64, 175, 0.15), 
        rgba(59, 130, 246, 0.1), 
        transparent
      )
    `;

    const darkGlow = `
      radial-gradient(circle 400px at ${mousePosition.x}px ${mousePosition.y}px, 
        rgba(66, 153, 225, 0.15), 
        transparent
      )
    `;

    return {
      background: theme === "dark" ? darkGlow : lightGlow,
      opacity: 0.7,
    };
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // If on home page, redirect to auth with view set to "role"
    if (location.pathname === "/") {
      navigate("/auth?view=role");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await supabase.auth.signOut();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError) throw profileError;

      navigate(profile.role === "seller" ? "/seller-dashboard" : "/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!fullName.trim()) {
        throw new Error("Full name is required");
      }
      if (email !== confirmEmail) {
        throw new Error("Emails do not match");
      }
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      await supabase.auth.signOut();

      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!user) throw new Error("Failed to create user");

      const { error: profileError } = await supabase
        .from("profiles")
        .insert([
          {
            id: user.id,
            full_name: fullName,
            role: role,
          },
        ])
        .select()
        .single();

      if (profileError) throw profileError;

      setSuccess("Success! Please check your email to confirm your account.");

      setEmail("");
      setConfirmEmail("");
      setPassword("");
      setFullName("");
      setRegisteredUserId(user.id);
      setView("profile-setup");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSetupComplete = () => {
    navigate(role === "seller" ? "/seller-dashboard" : "/dashboard");
  };

  // Renders the role selection card
  const renderRoleSelection = () => (
    <Card className="relative overflow-hidden bg-white/50 dark:bg-black/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Choose your role</CardTitle>
        <CardDescription>Select how you want to use HomeHarmony</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={role} onValueChange={(value: "buyer" | "seller") => setRole(value)}>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 border border-blue-100 dark:border-white/10 rounded-xl hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors">
              <RadioGroupItem value="buyer" id="buyer" />
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-lg bg-blue-100/50 dark:bg-blue-900/20">
                  <Home className="h-5 w-5 text-blue-900 dark:text-primary" />
                </div>
                <Label htmlFor="buyer" className="flex-1 cursor-pointer">
                  <div className="font-semibold text-blue-900 dark:text-white">Property Buyer</div>
                  <div className="text-sm text-blue-800/70 dark:text-blue-200/70">
                    Browse and search for available properties
                  </div>
                </Label>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 border border-blue-100 dark:border-white/10 rounded-xl hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors">
              <RadioGroupItem value="seller" id="seller" />
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-lg bg-blue-100/50 dark:bg-blue-900/20">
                  <Building2 className="h-5 w-5 text-blue-900 dark:text-primary" />
                </div>
                <Label htmlFor="seller" className="flex-1 cursor-pointer">
                  <div className="font-semibold text-blue-900 dark:text-white">Property Seller</div>
                  <div className="text-sm text-blue-800/70 dark:text-blue-200/70">
                    List and manage your properties
                  </div>
                </Label>
              </div>
            </div>
          </div>
        </RadioGroup>

        <Button
          className="w-full bg-gradient-to-r from-blue-950 to-blue-800 dark:from-primary dark:to-blue-600 hover:shadow-lg hover:shadow-blue-600/20 dark:hover:shadow-primary/20"
          onClick={() => setView("register")}
        >
          Continue as {role === "buyer" ? "Buyer" : "Seller"}
        </Button>
      </CardContent>
    </Card>
  );

  // Renders the login card
  const renderLogin = () => (
    <Card className="relative overflow-hidden bg-white/50 dark:bg-black/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to your account to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Button
              type="button"
              variant="link"
              className="px-0 text-blue-900 dark:text-blue-400"
              onClick={() => setView("forgot-password")}
            >
              Forgot password?
            </Button>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-950 to-blue-800 dark:from-primary dark:to-blue-600 hover:shadow-lg hover:shadow-blue-600/20 dark:hover:shadow-primary/20"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  // Renders the register card
  const renderRegister = () => (
    <Card className="relative overflow-hidden bg-white/50 dark:bg-black/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Sign up as a {role} to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full-name">Full Name</Label>
            <div className="relative">
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="pl-10"
                required
              />
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-email">Email</Label>
            <div className="relative">
              <Input
                id="register-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-email">Confirm Email</Label>
            <div className="relative">
              <Input
                id="confirm-email"
                type="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                className="pl-10"
                required
              />
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="register-password">Password</Label>
            <div className="relative">
              <Input
                id="register-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
                minLength={6}
              />
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-950 to-blue-800 dark:from-primary dark:to-blue-600 hover:shadow-lg hover:shadow-blue-600/20 dark:hover:shadow-primary/20"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full border-blue-900/20 dark:border-white/20 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            onClick={() => setView("role")}
          >
            Change Role
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  return (
    <div ref={mouseRef} className="h-screen relative flex items-center justify-center overflow-hidden px-4">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-white to-blue-50/30 dark:from-background dark:via-background/95 dark:to-background" />
      <div className="pointer-events-none absolute inset-0 transition-opacity duration-300" style={getGlowStyles()} />
      <div className="absolute inset-0">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-100/50 dark:bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-50/50 dark:bg-blue-500/5 blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative w-full max-w-md mx-auto">
        {/* Back Button (only shown when not on login/role selection) */}
        {view !== "login" && view !== "role" && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
            <Button
              variant="ghost"
              onClick={() => setView(view === "register" ? "role" : "login")}
              className="group flex items-center text-blue-900 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
              Back
            </Button>
          </motion.div>
        )}

        {/* Alerts */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-4">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-4">
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Cards */}
        <AnimatePresence mode="wait">
          <motion.div key={view} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            {view === "profile-setup" && registeredUserId ? (
              <ProfileSetup userId={registeredUserId} userRole={role} onComplete={handleProfileSetupComplete} />
            ) : view === "role" ? (
              renderRoleSelection()
            ) : view === "register" ? (
              renderRegister()
            ) : (
              renderLogin()
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer Link */}
        {view === "login" && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-6 text-sm text-blue-900/60 dark:text-blue-200/60">
            Don't have an account?{" "}
            <Button variant="link" className="text-blue-900 dark:text-blue-400 p-0" onClick={() => setView("role")}>
              Create one
            </Button>
          </motion.p>
        )}
      </div>
    </div>
  );
}
