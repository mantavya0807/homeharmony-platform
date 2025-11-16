import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Search, Share2, Coins, Calendar, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from 'next-themes';

export default function Hero() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      icon: <Search className="h-8 w-8" />,
      title: "Find Subleases",
      description: "Browse verified subleases in your area with detailed information and photos."
    },
    {
      icon: <Share2 className="h-8 w-8" />,
      title: "List Your Property",
      description: "Post your property for sublease and reach thousands of verified tenants."
    },
    {
      icon: <Coins className="h-8 w-8" />,
      title: "Secure Payments",
      description: "Handle security deposits and rent payments safely through our platform."
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: "Flexible Terms",
      description: "Find short-term and long-term subleases that match your needs."
    }
  ];

  const getGlowStyles = () => {
    const lightGlow = `
      radial-gradient(circle 400px at ${mousePosition.x}px ${mousePosition.y}px, 
        rgba(30, 64, 175, 0.15), 
        rgba(59, 130, 246, 0.1), 
        transparent
      )
    `;
    
    const darkGlow = `
      radial-gradient(circle 400px at ${mousePosition.x}px ${mousePosition.y}px, 
        rgba(66, 153, 225, 0.15), 
        transparent
      )
    `;
    
    return {
      background: theme === 'dark' ? darkGlow : lightGlow,
      opacity: isHovered ? 1 : 0.7,
    };
  };

  return (
    <div ref={heroRef} className="relative min-h-screen overflow-hidden">
      {/* Background gradient and glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      
      {/* Light mode specific decorative gradients */}
      {theme !== 'dark' && (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-50 via-transparent to-transparent opacity-70" />
      )}
      
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={getGlowStyles()}
      />

      {/* Main content */}
      <div className="relative pt-32 container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mx-auto max-w-3xl text-center"
        >
          <h1 
            className="text-6xl font-bold leading-tight drop-shadow-sm text-blue-900 dark:text-white"
            style={theme ? {
              backgroundImage: theme === 'dark' 
                ? 'linear-gradient(to right, hsl(var(--primary)), rgb(37 99 235))' 
                : 'linear-gradient(to right, rgb(23 37 84), rgb(30 64 175), rgb(37 99 235))',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent'
            } : undefined}
          >
            Your Perfect Sublease Awaits
          </h1>

          <motion.p
            className="mt-6 text-xl text-blue-950/80 dark:text-muted-foreground font-medium"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            Find your ideal temporary home or list your property with our secure,
            verified sublease marketplace.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {/* Button to sign in */}
            <Button
              size="lg"
              className="group relative overflow-hidden bg-gradient-to-r from-blue-950 to-blue-800 dark:from-primary dark:to-blue-600 px-8 py-6 transition-all hover:shadow-lg hover:shadow-blue-600/20 dark:hover:shadow-primary/20"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={() => navigate("/login")}
            >
              <span className="relative z-10 text-white font-medium">Get Started</span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-800 to-blue-600 dark:from-blue-600 dark:to-primary opacity-0 group-hover:opacity-100"
                initial={{ x: "-100%" }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              />
              <ArrowRight className="relative z-10 ml-2 h-5 w-5 text-white transition-transform group-hover:translate-x-1" />
            </Button>

            {/* Button to list property */}
            <Button
              size="lg"
              variant="outline"
              className="px-8 py-6 bg-white/50 dark:bg-transparent border-blue-900/20 dark:border-white/20 hover:border-blue-800 hover:bg-blue-50 dark:hover:border-primary dark:hover:bg-primary/10 text-blue-900 hover:text-blue-900 dark:text-white dark:hover:text-white backdrop-blur-sm"
              onClick={() => navigate("/register")}
            >
              List Your Property
            </Button>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <div className="mt-32 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.8 + index * 0.1,
                ease: "easeOut",
              }}
              className="group rounded-xl border border-blue-100 dark:border-white/10 bg-white/50 dark:bg-card/50 backdrop-blur-sm p-6 transition-all hover:shadow-lg hover:shadow-blue-100 dark:hover:shadow-primary/5 hover:bg-white dark:hover:bg-card"
            >
              <div className="mb-4 w-14 h-14 rounded-xl bg-gradient-to-br from-blue-50 to-white dark:from-primary/10 dark:to-transparent p-3 text-blue-900 dark:text-primary transition-all duration-200 group-hover:bg-gradient-to-br group-hover:from-blue-900 group-hover:to-blue-800 dark:group-hover:from-primary dark:group-hover:to-primary/90 group-hover:text-white group-hover:scale-110">
                {feature.icon}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-blue-900 dark:text-white">{feature.title}</h3>
              <p className="text-sm text-blue-800/70 dark:text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Decorative elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gradient-to-br from-blue-100 to-transparent dark:from-primary/10 dark:to-transparent blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-tr from-blue-50 to-transparent dark:from-blue-500/10 dark:to-transparent blur-3xl" />
      </div>
    </div>
  );
}
