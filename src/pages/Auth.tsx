import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Auth() {
  const navigate = useNavigate();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState<"buyer" | "seller">("seller");
  
  // Form states
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_UP" && session) {
          const { error } = await supabase
            .from("profiles")
            .insert([
              {
                id: session.user.id,
                role: role,
                email: session.user.email,
                full_name: fullName
              },
            ]);

          if (error) {
            setError(error.message);
            return;
          }
        }

        if (event === "SIGNED_IN" && session) {
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
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, role, fullName]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!fullName.trim()) {
      setError("Full name is required");
      setLoading(false);
      return;
    }

    if (email !== confirmEmail) {
      setError("Emails do not match");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: role,
          full_name: fullName
        },
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setError("Check your email for the confirmation link!");
    }
    setLoading(false);
  };
  const renderRoleSelection = () => (
    <Card>
      <CardHeader>
        <CardTitle>Choose your role</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
      <RadioGroup 
  defaultValue={role} 
  onValueChange={(value: "buyer" | "seller") => {
    setRole(value);
    // Use the updated role value directly
    console.log(`Role changed to: ${value}`);
  }}
>
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
  onClick={() => {
    setIsRegistering(true);
            console.log(`Proceeding with ${role} registration`);
          }}
        >
          Continue with {role === 'buyer' ? 'Buyer' : 'Seller'} Registration
        </Button>
      </CardContent>
    </Card>
  );

  const renderAuthForm = () => (
    <Tabs defaultValue="register" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login" onClick={() => setIsRegistering(false)}>Login</TabsTrigger>
        <TabsTrigger value="register">Register as {role}</TabsTrigger>
      </TabsList>
      <TabsContent value="login">
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
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
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="register">
        <Card>
          <CardHeader>
            <CardTitle>Create {role === 'buyer' ? 'Buyer' : 'Seller'} Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input
                  id="full-name"
                  type="text"
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
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Registering as: <span className="font-semibold">{role}</span>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : `Create ${role} account`}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => setIsRegistering(false)}
              >
                Change Role
              </Button>
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
        <Alert variant={error.includes("confirmation link") ? "default" : "destructive"} className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {!isRegistering ? renderRoleSelection() : renderAuthForm()}
    </div>
  );
}