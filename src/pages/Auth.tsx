import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type ViewType = "role" | "login" | "register";

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialView = (location.state?.initialView || "role") as ViewType;

  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ViewType>(initialView);
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  
  // Form states
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Get user role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        
        // Redirect based on role
        if (profile?.role === "seller") {
          navigate("/seller-dashboard");
        } else {
          navigate("/dashboard");
        }
      }
    };
    
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    // Update view when initialView changes
    if (location.state?.initialView) {
      setView(location.state.initialView);
    }
  }, [location.state?.initialView]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Clear any existing session first
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

      // Navigate based on role
      if (profile.role === "seller") {
        navigate("/seller-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
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
      // Validation
      if (!fullName.trim()) {
        throw new Error("Full name is required");
      }
      if (email !== confirmEmail) {
        throw new Error("Emails do not match");
      }
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      // Clear any existing session first
      await supabase.auth.signOut();

      // Create new user
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

      // Create profile
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

      setError("Success! Please check your email to confirm your account.");
      
      // Clear form
      setEmail("");
      setConfirmEmail("");
      setPassword("");
      setFullName("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

  const renderAuthForm = () => (
    <Tabs defaultValue={view} className="w-full" onValueChange={(v) => setView(v as ViewType)}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Login</TabsTrigger>
        <TabsTrigger value="register">Register as {role}</TabsTrigger>
      </TabsList>

      <TabsContent value="login">
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
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
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
      </TabsContent>

      <TabsContent value="register">
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
                <Input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
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
              {view !== "role" && (
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => setView("role")}
                >
                  Change Role
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );

  return (
    <div className="container max-w-md mx-auto mt-12 p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Welcome to HomeHarmony</h1>
      {error && (
        <Alert 
          variant={error.includes("check your email") ? "default" : "destructive"} 
          className="mb-4"
        >
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {view === "role" ? renderRoleSelection() : renderAuthForm()}
    </div>
  );
}