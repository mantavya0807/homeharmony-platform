import React from 'react';
import { Hero } from "@/components/Hero";
import { PropertyList } from "@/components/PropertyList";

const Index = () => {
  return (
    // Set exact viewport height and prevent overflow
    <div className="h-screen overflow-hidden">
      {/* Hero component takes full height */}
      <div className="h-full">
        <Hero />
      </div>
    </div>
  );
};

export default Index;