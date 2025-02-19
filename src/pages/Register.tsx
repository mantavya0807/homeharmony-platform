// Register.tsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  Building2,
  Home,
  Loader2,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export default function Register() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [step, setStep] = useState(1); // 1 for role selection, 2 for form
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Form states
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Password validation states
  const [validations, setValidations] = useState({
    length: false,
    number: false,
    specialChar: false,
    match: false,
  });

  // Toggle states for showing passwords
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Mouse tracking for glow effect
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Update password validations
  useEffect(() => {
    setValidations({
      length: formData.password.length >= 8,
      number: /\d/.test(formData.password),
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
      match:
        formData.password === formData.confirmPassword &&
        formData.password !== "",
    });
  }, [formData.password, formData.confirmPassword]);

  const handleRoleSelect = () => {
    setStep(2);
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError("Full name is required");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!validations.length || !validations.number || !validations.specialChar) {
      setError("Password does not meet requirements");
      return false;
    }
    if (!validations.match) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      await supabase.auth.signOut();

      const {
        data: { user },
        error: signUpError,
      } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
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
            full_name: formData.fullName,
            role: role,
          },
        ])
        .select()
        .single();

      if (profileError) throw profileError;

      setSuccess("Success! Please check your email to confirm your account.");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getGlowStyles = () => {
    const lightGlow = `
      radial-gradient(circle 300px at ${mousePosition.x}px ${mousePosition.y}px, 
        rgba(30, 64, 175, 0.15), 
        rgba(59, 130, 246, 0.1), 
        transparent
      )
    `;
    const darkGlow = `
      radial-gradient(circle 300px at ${mousePosition.x}px ${mousePosition.y}px, 
        rgba(66, 153, 225, 0.15), 
        transparent
      )
    `;
    return {
      background: theme === "dark" ? darkGlow : lightGlow,
      opacity: 0.7,
    };
  };

  return (
    <div
      ref={containerRef}
      className="h-screen relative flex items-center justify-center overflow-hidden px-4"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-white to-blue-50/30 dark:from-background dark:via-background/95 dark:to-background" />
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={getGlowStyles()}
      />
      <div className="absolute inset-0">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-100/50 dark:bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-50/50 dark:bg-blue-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4"
            >
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4"
            >
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="relative overflow-hidden bg-white/50 dark:bg-black/20 backdrop-blur-sm shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  Create your account
                </CardTitle>
                <CardDescription className="text-sm">
                  Sign up to get started
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 pb-4">
                {step === 1 ? (
                  <RadioGroup
                    value={role}
                    onValueChange={(value: "buyer" | "seller") =>
                      setRole(value)
                    }
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-4 p-3 border border-blue-100 dark:border-white/10 rounded-xl hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors">
                      <RadioGroupItem value="buyer" id="buyer" />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-blue-100/50 dark:bg-blue-900/20">
                          <Home className="h-5 w-5 text-blue-900 dark:text-primary" />
                        </div>
                        <Label htmlFor="buyer" className="flex-1 cursor-pointer">
                          <div className="font-semibold text-blue-900 dark:text-white">
                            Property Buyer
                          </div>
                          <div className="text-sm text-blue-800/70 dark:text-blue-200/70">
                            Browse and search for available properties
                          </div>
                        </Label>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 p-3 border border-blue-100 dark:border-white/10 rounded-xl hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors">
                      <RadioGroupItem value="seller" id="seller" />
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-blue-100/50 dark:bg-blue-900/20">
                          <Building2 className="h-5 w-5 text-blue-900 dark:text-primary" />
                        </div>
                        <Label htmlFor="seller" className="flex-1 cursor-pointer">
                          <div className="font-semibold text-blue-900 dark:text-white">
                            Property Seller
                          </div>
                          <div className="text-sm text-blue-800/70 dark:text-blue-200/70">
                            List and manage your properties
                          </div>
                        </Label>
                      </div>
                    </div>

                    <Button
                      onClick={handleRoleSelect}
                      className="w-full mt-4 bg-gradient-to-r from-blue-950 to-blue-800 dark:from-primary dark:to-blue-600"
                    >
                      Continue as {role === "buyer" ? "Buyer" : "Seller"}
                    </Button>
                  </RadioGroup>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-3">
                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          value={formData.fullName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              fullName: e.target.value,
                            })
                          }
                          placeholder="Full Name"
                          className="pl-10"
                          required
                        />
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              email: e.target.value,
                            })
                          }
                          placeholder="Email"
                          className="pl-10"
                          required
                        />
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                          placeholder="Password"
                          className="pl-10 pr-20"
                          required
                        />
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        {/* Tooltip for password requirements */}
                        <div className="absolute right-10 top-1/2 -translate-y-1/2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs">
                                <div>• At least 8 characters</div>
                                <div>• At least one number</div>
                                <div>• At least one special character</div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        {/* Show/Hide toggle */}
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              confirmPassword: e.target.value,
                            })
                          }
                          placeholder="Confirm Password"
                          className="pl-10 pr-10"
                          required
                        />
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {formData.confirmPassword && (
                        <div className="text-xs">
                          {validations.match ? (
                            <span className="text-green-500">
                              Passwords match
                            </span>
                          ) : (
                            <span className="text-red-500">
                              Passwords do not match
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-950 to-blue-800 dark:from-primary dark:to-blue-600"
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
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mt-6 text-sm text-blue-900/60 dark:text-blue-200/60"
        >
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-900 dark:text-blue-400 hover:underline font-medium"
          >
            Sign in
          </Link>
        </motion.p>

        {/* Step navigation */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-center"
          >
            <Button
              variant="link"
              onClick={() => setStep(1)}
              className="text-sm text-blue-900/60 dark:text-blue-200/60 hover:text-blue-900 dark:hover:text-blue-400"
            >
              ← Back to role selection
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
