// src/components/HousingComplexes.tsx

import React, { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, Star, StarHalf } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useNavigate } from "react-router-dom"
import { StarIcon } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import ImageGallery from '@/components/ImageGallery' // Custom component for image gallery

// Define all possible amenities
const AMENITIES = {
  has_swimming_pool: "Swimming Pool",
  has_gym: "Gym",
  has_clubhouse: "Clubhouse",
  has_business_center: "Business Center",
  has_community_room: "Community Room",
  has_gated_entry: "Gated Entry",
  has_security_cameras: "Security Cameras",
  has_doorman: "Doorman",
  has_playground: "Playground",
  has_bbq_area: "BBQ Area",
  has_dog_park: "Dog Park",
  has_tennis_court: "Tennis Court",
  has_basketball_court: "Basketball Court",
  has_elevator: "Elevator",
  has_parking_garage: "Parking Garage",
  has_package_room: "Package Room",
  has_laundry_facility: "Laundry Facility",
  has_bike_storage: "Bike Storage",
  has_sauna: "Sauna",
  has_spa: "Spa",
  has_yoga_studio: "Yoga Studio",
  has_movie_theater: "Movie Theater",
  has_game_room: "Game Room",
}

// Interfaces for TypeScript
interface Review {
  id: string
  rating: number
  review_text: string
  created_at: string
  user: {
    full_name: string
  }
}

interface HousingComplexPhoto {
  id: string
  complex_id: string
  photo_url: string
  created_at: string
}

interface Property {
  id: string
  title: string
  description: string | null
  price: number
  property_type: "house" | "apartment" | "condo" | "townhouse"
  bedrooms: number
  bathrooms: number
  square_feet: number
  address: string
  city: string
  state: string
  zip_code: string
  images: string[] | null
  created_at: string
  updated_at: string
}

interface HousingComplex {
  id: string
  name: string
  description: string
  address: string
  city: string
  state: string
  zip_code: string
  // Amenities as separate boolean fields
  has_swimming_pool: boolean
  has_gym: boolean
  has_clubhouse: boolean
  has_business_center: boolean
  has_community_room: boolean
  has_gated_entry: boolean
  has_security_cameras: boolean
  has_doorman: boolean
  has_playground: boolean
  has_bbq_area: boolean
  has_dog_park: boolean
  has_tennis_court: boolean
  has_basketball_court: boolean
  has_elevator: boolean
  has_parking_garage: boolean
  has_package_room: boolean
  has_laundry_facility: boolean
  has_bike_storage: boolean
  has_sauna: boolean
  has_spa: boolean
  has_yoga_studio: boolean
  has_movie_theater: boolean
  has_game_room: boolean
  average_rating: number
  reviews: Review[]
  housing_complex_photos: HousingComplexPhoto[]
}

export default function HousingComplexes() {
  const [complexes, setComplexes] = useState<HousingComplex[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedComplex, setSelectedComplex] = useState<HousingComplex | null>(null)
  const [selectedComplexProperties, setSelectedComplexProperties] = useState<Property[]>([])
  const { toast } = useToast()
  const [newReview, setNewReview] = useState({ rating: 0, review_text: "" })
  const [submittingReview, setSubmittingReview] = useState(false)
  const navigate = useNavigate()
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    fetchComplexes()
  }, [])

  useEffect(() => {
    const getUserRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()
        if (error) {
          console.error("Error fetching user role:", error)
          return
        }
        setUserRole(profile?.role)
      }
    }
    getUserRole()
  }, [])

  // 1. Fetch housing complexes + their reviews and photos
  const fetchComplexes = async () => {
    try {
      const { data: complexData, error: complexError } = await supabase
        .from("housing_complexes")
        .select(`
          *,
          housing_complex_reviews (
            id,
            rating,
            review_text,
            created_at,
            user_id,
            profiles (
              full_name
            )
          ),
          housing_complex_photos (
            id,
            photo_url,
            created_at
          )
        `)

      if (complexError) throw complexError

      // Calculate average rating and format reviews
      const complexesWithDetails = complexData.map((complex: any) => ({
        ...complex,
        reviews: complex.housing_complex_reviews.map((review: any) => ({
          id: review.id,
          rating: review.rating,
          review_text: review.review_text,
          created_at: review.created_at,
          user: {
            full_name: review.profiles?.full_name || "Anonymous",
          },
        })),
        average_rating:
          complex.housing_complex_reviews.length > 0
            ? complex.housing_complex_reviews.reduce(
                (acc: number, review: any) => acc + review.rating,
                0
              ) / complex.housing_complex_reviews.length
            : 0,
      }))

      setComplexes(complexesWithDetails)
    } catch (error: any) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Failed to load housing complexes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 2. Fetch properties for a specific housing complex
  const fetchPropertiesForComplex = async (complexId: string) => {
    try {
      const { data: propertiesData, error: propertiesError } = await supabase
        .from("properties")
        .select(`
          id,
          title,
          description,
          price,
          property_type,
          bedrooms,
          bathrooms,
          square_feet,
          address,
          city,
          state,
          zip_code,
          images,
          created_at,
          updated_at
        `)
        .eq("housing_complex_id", complexId) // Ensure this matches your schema

      if (propertiesError) throw propertiesError
      setSelectedComplexProperties(propertiesData as Property[])
    } catch (error: any) {
      console.error("Error fetching properties:", error)
      toast({
        title: "Error",
        description: "Failed to load properties",
        variant: "destructive",
      })
    }
  }

  // 3. Handler for when a complex is selected
  const handleComplexSelect = (complex: HousingComplex) => {
    setSelectedComplex(complex)
    fetchPropertiesForComplex(complex.id)
  }

  // 4. Submit a new review
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedComplex) return

    try {
      setSubmittingReview(true)
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session || userRole !== "buyer") {
        toast({
          title: "Not allowed",
          description: "Only buyers can submit reviews",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase.from("housing_complex_reviews").insert([
        {
          complex_id: selectedComplex.id, // Ensure this matches your schema
          user_id: session.user.id,
          rating: newReview.rating,
          review_text: newReview.review_text,
        },
      ])

      if (error) throw error

      // Refresh data to show new review
      await fetchComplexes()
      setNewReview({ rating: 0, review_text: "" })

      toast({
        title: "Success",
        description: "Review submitted successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      })
    } finally {
      setSubmittingReview(false)
    }
  }

  // Display rating stars (read-only)
  const RatingStars = ({ rating }: { rating: number }) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating - fullStars >= 0.5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-4 w-4 fill-primary text-primary" />
        ))}
        {hasHalfStar && <StarHalf className="h-4 w-4 text-primary" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-muted-foreground" />
        ))}
        <span className="ml-2 text-sm">({rating.toFixed(1)})</span>
      </div>
    )
  }

  // Star rating input for writing a review
  const StarRatingInput = ({
    rating,
    onRatingChange,
  }: {
    rating: number
    onRatingChange: (rating: number) => void
  }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className="focus:outline-none"
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            <StarIcon
              className={`h-6 w-6 ${
                star <= rating
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Our Housing Complexes</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {complexes.map((complex) => (
          <Card key={complex.id} className="group hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">{complex.name}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    {complex.city}, {complex.state}
                  </CardDescription>
                </div>
                <RatingStars rating={complex.average_rating} />
              </div>
            </CardHeader>
            <CardContent>
              {/* Display multiple images if available */}
              {complex.housing_complex_photos.length > 0 ? (
                <ImageGallery photos={complex.housing_complex_photos.map(photo => photo.photo_url)} />
              ) : (
                <img
                  src={
                    "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=600"
                  }
                  alt={`${complex.name} Photo`}
                  className="w-full h-40 object-cover rounded-md mb-4"
                />
              )}

              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {complex.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(AMENITIES).map(([key, label]) => (
                  complex[key as keyof HousingComplex] && (
                    <Badge key={key} variant="secondary">
                      {label}
                    </Badge>
                  )
                ))}
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleComplexSelect(complex)}
                  >
                    View Details & Reviews
                  </Button>
                </DialogTrigger>

                {/* Only open Dialog for the selected complex */}
                {selectedComplex && selectedComplex.id === complex.id && (
                  <DialogContent
                    className="max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col"
                    aria-describedby="dialog-description"
                  >
                    {/* Add the sticky header */}
                    <div className="sticky top-0 bg-background z-10 border-b pb-4">
                      <DialogHeader>
                        <DialogTitle className="text-2xl">{selectedComplex.name}</DialogTitle>
                        {/* Visually hidden description for accessibility */}
                        <p id="dialog-description" className="sr-only">
                          Details and reviews for {selectedComplex.name}
                        </p>
                      </DialogHeader>
                    </div>

                    {/* Combined Reviews and Details Form */}
                    <div className="p-4 space-y-6">
                      {/* About Section */}
                      <div>
                        <h3 className="font-semibold text-lg mb-2">About</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedComplex.description}
                        </p>
                      </div>

                      {/* Location Section */}
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Location</h3>
                        <p className="text-sm text-muted-foreground">{selectedComplex.address}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedComplex.city}, {selectedComplex.state} {selectedComplex.zip_code}
                        </p>
                      </div>

                      {/* Amenities Section */}
                      <div>
                        <h3 className="font-semibold text-lg mb-2">Amenities</h3>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(AMENITIES).map(([key, label]) => (
                            selectedComplex[key as keyof HousingComplex] && (
                              <Badge key={key} variant="outline">
                                {label}
                              </Badge>
                            )
                          ))}
                        </div>
                      </div>

                      {/* Properties Section */}
                      <div>
                        <h3 className="font-semibold text-lg mb-4">Properties</h3>
                        {selectedComplexProperties.length > 0 ? (
                          <Table className="w-full border text-sm text-left text-gray-700">
                            <TableHeader className="bg-gray-50">
                              <TableRow>
                                <TableHead className="px-4 py-2 font-medium uppercase">
                                  Title
                                </TableHead>
                                <TableHead className="px-4 py-2 font-medium uppercase">
                                  Type
                                </TableHead>
                                <TableHead className="px-4 py-2 font-medium uppercase">
                                  Bedrooms
                                </TableHead>
                                <TableHead className="px-4 py-2 font-medium uppercase">
                                  Bathrooms
                                </TableHead>
                                <TableHead className="px-4 py-2 font-medium uppercase">
                                  Price
                                </TableHead>
                                <TableHead className="px-4 py-2 font-medium uppercase">
                                  Square Feet
                                </TableHead>
                                <TableHead className="px-4 py-2 font-medium uppercase">
                                  Address
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedComplexProperties.map((property) => (
                                <TableRow
                                  key={property.id}
                                  className="hover:bg-gray-100 cursor-pointer transition-colors"
                                  onClick={() => navigate(`/properties/${property.id}`)}
                                >
                                  <TableCell className="px-4 py-2">
                                    {property.title}
                                  </TableCell>
                                  <TableCell className="px-4 py-2 capitalize">
                                    {property.property_type}
                                  </TableCell>
                                  <TableCell className="px-4 py-2">
                                    {property.bedrooms}
                                  </TableCell>
                                  <TableCell className="px-4 py-2">
                                    {property.bathrooms}
                                  </TableCell>
                                  <TableCell className="px-4 py-2">
                                    ${property.price.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="px-4 py-2">
                                    {property.square_feet.toLocaleString()} sqft
                                  </TableCell>
                                  <TableCell className="px-4 py-2">
                                    {property.address}, {property.city}, {property.state} {property.zip_code}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No properties available.
                          </p>
                        )}
                      </div>

                      {/* Reviews Section */}
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-semibold text-lg">Reviews</h3>
                          <RatingStars rating={selectedComplex.average_rating} />
                        </div>

                        <div className="space-y-6">
                          {/* Reviews List */}
                          {selectedComplex.reviews.length > 0 ? (
                            <div className="space-y-4">
                              {selectedComplex.reviews.map((review) => (
                                <Card key={review.id} className="bg-gray-50">
                                  <CardHeader className="flex justify-between items-center">
                                    <CardTitle className="text-sm font-medium">
                                      {review.user.full_name}
                                    </CardTitle>
                                    <RatingStars rating={review.rating} />
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                      {review.review_text}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                      {new Date(review.created_at).toLocaleDateString()}
                                    </p>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No reviews yet.
                            </p>
                          )}

                          {/* Only show review form for buyers */}
                          {userRole === "buyer" && (
                            <div className="border-t pt-6">
                              <h3 className="font-semibold text-lg mb-4">
                                Write a Review
                              </h3>
                              <form onSubmit={handleReviewSubmit} className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="rating">Rating</Label>
                                  <StarRatingInput
                                    rating={newReview.rating}
                                    onRatingChange={(rating) =>
                                      setNewReview((prev) => ({
                                        ...prev,
                                        rating,
                                      }))
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="review_text">Review</Label>
                                  <Textarea
                                    id="review_text"
                                    value={newReview.review_text}
                                    onChange={(e) =>
                                      setNewReview((prev) => ({
                                        ...prev,
                                        review_text: e.target.value,
                                      }))
                                    }
                                    placeholder="Write your review here..."
                                    required
                                    className="resize-none"
                                  />
                                </div>
                                <Button
                                  type="submit"
                                  disabled={
                                    submittingReview || newReview.rating === 0
                                  }
                                  className="w-full flex items-center justify-center"
                                >
                                  {submittingReview ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Submitting...
                                    </>
                                  ) : (
                                    "Submit Review"
                                  )}
                                </Button>
                              </form>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                )}
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
