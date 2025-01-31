import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Search, Share2, Coins, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Hero() {
  const navigate = useNavigate();

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const features = [
    {
      icon: <Search className="h-8 w-8 text-primary" />,
      title: "Find Subleases",
      description: "Browse verified subleases in your area with detailed information and photos."
    },
    {
      icon: <Share2 className="h-8 w-8 text-primary" />,
      title: "List Your Property",
      description: "Post your property for sublease and reach thousands of verified tenants."
    },
    {
      icon: <Coins className="h-8 w-8 text-primary" />,
      title: "Secure Payments",
      description: "Handle security deposits and rent payments safely through our platform."
    },
    {
      icon: <Calendar className="h-8 w-8 text-primary" />,
      title: "Flexible Terms",
      description: "Find short-term and long-term subleases that match your needs."
    }
  ];

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h1 
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6"
              {...fadeIn}
            >
              Simplify Your Sublease Journey
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl text-white/90 mb-8"
              {...fadeIn}
              transition={{ delay: 0.2 }}
            >
              One platform for all your subleasing needs. No more scrolling through social media or dealing with unreliable listings.
            </motion.p>

            <motion.div 
              className="flex flex-wrap gap-4 justify-center"
              {...fadeIn}
              transition={{ delay: 0.4 }}
            >
              <Button 
                size="lg" 
                onClick={() => navigate("/auth", { state: { initialView: "login" } })}
                className="bg-primary hover:bg-primary/90"
              >
                Find a Sublease
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/auth", { state: { initialView: "role" } })}
                className="bg-white/10 hover:bg-white/20 text-white border-white/30"
              >
                List Your Property
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gradient-to-b from-background to-background/95 relative z-20 py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-12"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="flex gap-6 items-start"
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
              >
                <div className="bg-primary/10 rounded-2xl p-4">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}