
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  FormEvent,
} from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HousingComplexesFilter } from "@/components/HousingComplexesFilter";
import { ComplexCard } from "@/components/ComplexCard";

/* ---------------- Debounce Hook ---------------- */
function useDebounce<T extends (...args: any[]) => void>(func: T, delay: number) {
  const timeoutRef = useRef<number | null>(null);

  const debouncedFunction = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        func(...args);
      }, delay);
    },
    [func, delay]
  );
  return debouncedFunction;
}

/* ---------------- Animated Loader Component ---------------- */
const Loader = () => (
  <div className="flex items-center justify-center h-64">
    <motion.div className="flex space-x-2">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="w-4 h-4 bg-blue-500 dark:bg-blue-300 rounded-full"
          animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.5, 1] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.div>
  </div>
);

/* ---------------- Review Modal Component ---------------- */
function ReviewModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, reviewText: string) => void;
}) {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(rating, reviewText);
    setRating(0);
    setReviewText("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6 md:p-8 bg-white dark:bg-gray-800 border border-blue-500 rounded-xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Submit Your Review
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label className="block mb-1 font-semibold">Rating (0-5)</Label>
            <Input
              type="number"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              min={0}
              max={5}
              step={0.5}
              className="w-full border border-blue-500 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>
          <div>
            <Label className="block mb-1 font-semibold">Review</Label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full p-3 border border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-300"
          >
            Submit Review
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Main HousingComplexes Component ---------------- */
export default function HousingComplexes() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme } = useTheme();

  // States for complexes, loading, user role, and filters
  const [complexes, setComplexes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [filters, setFilters] = useState({ search: "", amenities: [] });

  // States for review modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [currentReviewComplexId, setCurrentReviewComplexId] =
    useState<string | null>(null);

  // Mouse position for background glow
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const complexesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // If you want the glow to follow the cursor across the entire window,
      // you can remove complexesRef.current's bounding rect usage.
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Create a dynamic glow effect that follows the cursor across the entire page
  const getGlowStyles = () => {
    const lightGlow = `radial-gradient(circle 700px at ${mousePosition.x}px ${mousePosition.y}px, rgba(66, 153, 225, 0.3), transparent 80%)`;
    const darkGlow = `radial-gradient(circle 700px at ${mousePosition.x}px ${mousePosition.y}px, rgba(30, 58, 138, 0.3), transparent 80%)`;
    return {
      background: theme === "dark" ? darkGlow : lightGlow,
      transition: "background 0.3s ease",
    };
  };

  /* ---------------- Fetch Complexes (with properties count) ---------------- */
  const fetchComplexes = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch housing complexes with related reviews and photos.
      let query = supabase
        .from("housing_complexes")
        .select(
          `
          *,
          housing_complex_reviews (
            id, rating, review_text, created_at, user_id,
            profiles ( full_name )
          ),
          housing_complex_photos (
            id, photo_url, created_at
          )
          `
        );

      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,city.ilike.%${filters.search}%,state.ilike.%${filters.search}%,zip_code.ilike.%${filters.search}%`
        );
      }

      // If you have amenities columns, filter them here:
      // filters.amenities.forEach((amenity: string) => {
      //   query = query.eq(amenity.toLowerCase(), true);
      // });

      const { data: complexesData, error } = await query;
      if (error) throw error;

      // Fetch properties data.
      const { data: propertiesData, error: propertiesError } = await supabase
        .from("properties")
        .select("*");
      if (propertiesError) throw propertiesError;

      // Group properties by housing_complex_id.
      const groupedProperties = (propertiesData || []).reduce(
        (acc: Record<string, any[]>, prop: any) => {
          const complexId = prop.housing_complex_id;
          if (complexId) {
            if (!acc[complexId]) {
              acc[complexId] = [];
            }
            acc[complexId].push(prop);
          }
          return acc;
        },
        {}
      );

      // Map complexes with reviews, average rating, and associated properties.
      const complexesWithDetails = (complexesData || []).map((complex: any) => {
        const reviews =
          complex.housing_complex_reviews?.map((review: any) => ({
            id: review.id,
            rating: review.rating,
            review_text: review.review_text,
            created_at: review.created_at,
            user: { full_name: review.profiles?.full_name || "Anonymous" },
          })) || [];
        const average_rating =
          reviews.length > 0
            ? reviews.reduce((acc: number, rev: any) => acc + rev.rating, 0) /
              reviews.length
            : 0;
        return {
          ...complex,
          reviews,
          average_rating,
          properties: groupedProperties[complex.id] || [],
        };
      });

      setComplexes(complexesWithDetails);
    } catch (error: any) {
      console.error("Error fetching complexes:", error);
      toast({
        title: "Error",
        description: "Failed to load housing complexes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  const debouncedFetchComplexes = useDebounce(fetchComplexes, 600);

  useEffect(() => {
    debouncedFetchComplexes();
  }, [filters, debouncedFetchComplexes]);

  useEffect(() => {
    const getUserRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserRole(user ? "buyer" : null);
    };
    getUserRole();
  }, []);

  // ---------------- Handle Review Submission ----------------
  const handleReviewSubmit = async (rating: number, reviewText: string) => {
    if (!currentReviewComplexId) return;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to submit a review",
          variant: "destructive",
        });
        return;
      }
      const { error } = await supabase.from("housing_complex_reviews").insert({
        complex_id: currentReviewComplexId,
        user_id: user.id,
        rating: rating,
        review_text: reviewText,
      });
      if (error) throw error;
      toast({
        title: "Success",
        description: "Review submitted successfully",
      });
      fetchComplexes();
      setReviewModalOpen(false);
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    }
  };

  return (
    <div
      ref={complexesRef}
      className="min-h-screen bg-gradient-to-b from-blue-50/50 via-background to-background dark:from-background dark:to-background pt-20 pb-8"
    >
      {/* Full-Page Background Glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={getGlowStyles()}
      />

      {/* Main Content */}
      <div className="container mx-auto px-2 md:px-4 lg:px-8 relative z-10">
        <motion.h1
          className="mb-8 text-center text-4xl font-extrabold bg-gradient-to-r from-blue-800 via-blue-600 to-blue-400 bg-clip-text text-transparent drop-shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Housing Complexes
        </motion.h1>

        {/* Filters Section */}
        <motion.div
          className="relative z-10 mb-6"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <HousingComplexesFilter filters={filters} onFilterChange={setFilters} />
        </motion.div>

        {/* Review Modal for Buyers */}
        {userRole === "buyer" && (
          <ReviewModal
            isOpen={reviewModalOpen}
            onClose={() => setReviewModalOpen(false)}
            onSubmit={handleReviewSubmit}
          />
        )}

        {/* Complexes Grid / Loader */}
        {loading ? (
          <Loader />
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { delayChildren: 0.3, staggerChildren: 0.1 },
              },
            }}
          >
            {complexes.map((complex) => (
              <motion.div
                key={complex.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <ComplexCard
                  complex={complex}
                  userRole={userRole}
                  onSelect={fetchComplexes}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Decorative Background Elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-blue-100 to-transparent dark:from-blue-500/10 dark:to-transparent blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-tr from-blue-50 to-transparent dark:from-blue-500/10 dark:to-transparent blur-3xl" />
      </div>
    </div>
  );
}
