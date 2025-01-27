import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Eye, EyeOff } from "lucide-react";

type ViewType = "role" | "login" | "register" | "forgot-password" | "update-password";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialView = (location.state?.initialView || "login") as ViewType;

  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ViewType>(initialView);
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  
  // Form states
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Reset states when switching views
  useEffect(() => {
    setError("");
    setSuccess("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
  }, [view]);

  // Check for password reset token
  useEffect(() => {
    const hash = location.hash;
    if (hash && hash.includes('type=recovery')) {
      setView('update-password');
    }
  }, [location]);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "http://localhost:8080/auth?view=reset-password",
      });

      if (error) throw error;

      setSuccess("If an account exists with this email, you will receive password reset instructions shortly.");
      setEmail("");
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });

      if (error) throw error;

      setSuccess("Password updated successfully! Redirecting to login...");
      setTimeout(() => {
        setView("login");
      }, 2000);
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
            role: role
          }
        }
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
            email: email
          }
        ])
        .select()
        .single();

      if (profileError) throw profileError;

      setSuccess("Success! Please check your email to confirm your account.");
      
      setEmail("");
      setConfirmEmail("");
      setPassword("");
      setFullName("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderLogin = () => (
    <Card>
      <CardHeader>
        <CardTitle>Login to your account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <Button 
            type="button" 
            variant="link" 
            className="p-0 h-auto font-normal"
            onClick={() => setView("forgot-password")}
          >
            Forgot your password?
          </Button>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderRegister = () => (
    <Card>
      <CardHeader>
        <CardTitle>Create {role} Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full-name">Full Name</Label>
            <Input
              id="full-name"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-email">Email</Label>
            <Input
              id="register-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-email">Confirm Email</Label>
            <Input
              id="confirm-email"
              type="email"
              placeholder="your@email.com"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="register-password">Password</Label>
            <div className="relative">
              <Input
                id="register-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Registering as: <span className="font-semibold">{role}</span>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              `Create ${role} account`
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            className="w-full" 
            onClick={() => setView("role")}
          >
            Change Role
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderRoleSelection = () => (
    <Card>
      <CardHeader>
        <CardTitle>Choose your role</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={role} onValueChange={(value: "buyer" | "seller") => setRole(value)}>
          <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
            <RadioGroupItem value="buyer" id="buyer" />
            <Label htmlFor="buyer" className="flex-1 cursor-pointer">
              <div className="font-semibold">Property Buyer</div>
              <div className="text-sm text-muted-foreground">I want to browse and buy properties</div>
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
            <RadioGroupItem value="seller" id="seller" />
            <Label htmlFor="seller" className="flex-1 cursor-pointer">
              <div className="font-semibold">Property Seller</div>
              <div className="text-sm text-muted-foreground">I want to list and sell properties</div>
            </Label>
          </div>
        </RadioGroup>
        <Button 
          className="w-full"
          onClick={() => setView("register")}
        >
          Continue as {role === "buyer" ? "Buyer" : "Seller"}
        </Button>
      </CardContent>
    </Card>
  );

  const renderForgotPassword = () => (
    <Card>
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          Enter your email address and we'll send you instructions to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-4">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              onClick={() => setView("login")}
            >
              Back to Login
            </Button>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Instructions"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const renderUpdatePassword = () => (
    <Card>
      <CardHeader>
        <CardTitle>Update Password</CardTitle>
        <CardDescription>
          Please enter your new password below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
    
    return (
      <div className="container max-w-md mx-auto mt-12 p-4">
        <h1 className="text-2xl font-bold mb-6 text-center">Welcome to HomeHarmony</h1>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        {view === "forgot-password" ? (
          renderForgotPassword()
        ) : view === "update-password" ? (
          renderUpdatePassword()
        ) : view === "role" ? (
          renderRoleSelection()
        ) : (
          <Tabs defaultValue={view} className="w-full" onValueChange={(v) => setView(v as ViewType)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register as {role}</TabsTrigger>
            </TabsList>
    
            <TabsContent value="login">{renderLogin()}</TabsContent>
            <TabsContent value="register">{renderRegister()}</TabsContent>
          </Tabs>
        )}
      </div>
    );
    }