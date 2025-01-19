import { Hero } from "@/components/Hero";
import { PropertyList } from "@/components/PropertyList";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <main className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8">Featured Properties</h2>
        <PropertyList />
      </main>
    </div>
  );
};

export default Index;