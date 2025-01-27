import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { PropertyList } from "@/components/PropertyList";
import { PropertyFilters } from "@/components/PropertyFilter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Dashboard() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [filters, setFilters] = useState({
    beds: 'any',
    baths: 'any',
    minSquareFeet: '',
    maxSquareFeet: '',
    priceRange: [0, 2000000], // Set to full range by default
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        navigate("/auth");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profileError || !profile) {
        navigate("/auth");
        return;
      }

      setUserRole(profile.role || null);
    };

    checkAuth();
  }, [navigate]);

  const handleFiltersChange = (newFilters: typeof filters) => {
    console.log('Applying filters:', newFilters); // For debugging
    setFilters(newFilters);
  };

  return (
    <div 
    className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {userRole === "seller" ? "My Listings" : "Available Properties"}
      </h1>

      <div className="space-y-6">
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            type="text"
            placeholder="Enter location (city, state, or ZIP)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full mt-1"
          />
        </div>

        <PropertyFilters 
  onFiltersChange={handleFiltersChange} // Use the handleFiltersChange function directly
/>
        <PropertyList
          location={location}
          filters={filters}
        />
      </div>
    </div>
  );
}