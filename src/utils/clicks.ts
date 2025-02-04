import { supabase } from "@/integrations/supabase/client";
export async function trackClick(propertyId: string) {
  if (!propertyId) {
    return { success: false, error: "Property ID is required" };
  }

  try {
    // ✅ Check if property exists
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("click_count")
      .eq("id", propertyId)
      .single();

    if (propertyError) {
      console.error("[Supabase Error] Failed to fetch property:", propertyError);
      return { success: false, error: "Database error fetching property" };
    }

    if (!property) {
      return { success: false, error: "Property not found" };
    }

    // Calculate new click count
    const newClickCount = (property.click_count || 0) + 1;
    // Log the new click count
    console.log("New click count:", newClickCount);

    // ✅ Update click count in properties table
    const { error: updateError } = await supabase
      .from("properties")
      .update({
        click_count: newClickCount,
        last_click: new Date(),
      })
      .eq("id", propertyId);

    if (updateError) {
      console.error("[Supabase Error] Failed to update click count:", updateError);
      return { success: false, error: "Failed to update click count" };
    }

    return { success: true, message: "Click tracked successfully" };
  } catch (err) {
    console.error("[System Error] Unexpected error:", err);
    return { success: false, error: (err as Error).message || "Unexpected server error" };
  }
}
