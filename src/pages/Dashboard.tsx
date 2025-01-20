import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { PropertyList } from "@/components/PropertyList";

export default function Dashboard() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [location, setLocation] = useState<string>(""); // State for location input

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      setUserRole(profile?.role || null);
    };

    checkAuth();
  }, [navigate]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {userRole === "seller" ? "My Listings" : "Available Properties"}
      </h1>
      <form
        onSubmit={(e) => {
          e.preventDefault(); // Prevent form submission
        }}
        className="mb-4"
      >
        <input
          type="text"
          placeholder="Enter location (city, state, or ZIP)"
          value={location}
          onChange={(e) => setLocation(e.target.value)} // Update location state
          className="border px-4 py-2 rounded w-full"
        />
      </form>
      <PropertyList location={location} /> {/* Pass location as prop */}
    </div>
  );
}
