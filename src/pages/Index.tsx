import { Hero } from "@/components/Hero";
import { PropertyCard } from "@/components/PropertyCard";

// Mock data for initial display
const FEATURED_PROPERTIES = [
  {
    id: 1,
    title: "Modern Downtown Apartment",
    price: 450000,
    location: "123 Main St, Downtown",
    beds: 2,
    baths: 2,
    sqft: 1200,
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80",
  },
  {
    id: 2,
    title: "Luxury Waterfront Villa",
    price: 1250000,
    location: "456 Ocean Drive",
    beds: 4,
    baths: 3,
    sqft: 2800,
    imageUrl: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80",
  },
  {
    id: 3,
    title: "Cozy Suburban Home",
    price: 350000,
    location: "789 Maple Avenue",
    beds: 3,
    baths: 2,
    sqft: 1800,
    imageUrl: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <main className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8">Featured Properties</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURED_PROPERTIES.map((property) => (
            <PropertyCard key={property.id} {...property} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;