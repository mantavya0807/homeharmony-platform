// import { useState, useRef } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import { supabase } from "@/integrations/supabase/client";
// import { useTheme } from "next-themes";
// import { motion } from "framer-motion";
// import AnimatedLoginForm from "@/components/AnimatedLoginForm";

// export default function Login() {
//   const navigate = useNavigate();
//   const { theme } = useTheme();
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string>("");

//   // Mouse tracking for glow effect
//   const containerRef = useRef<HTMLDivElement>(null);
//   const [isHovered, setIsHovered] = useState(false);
//   const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

//   const getGlowStyles = () => {
//     const lightGlow = `
//       radial-gradient(circle 300px at ${mousePosition.x}px ${mousePosition.y}px, 
//         rgba(30, 64, 175, 0.15), 
//         rgba(59, 130, 246, 0.1), 
//         transparent
//       )
//     `;
    
//     const darkGlow = `
//       radial-gradient(circle 300px at ${mousePosition.x}px ${mousePosition.y}px, 
//         rgba(66, 153, 225, 0.15), 
//         transparent
//       )
//     `;

//     return {
//       background: theme === "dark" ? darkGlow : lightGlow,
//       opacity: isHovered ? 1 : 0.7,
//     };
//   };

//   const handleLogin = async (email: string, password: string) => {
//     setLoading(true);
//     setError("");

//     try {
//       await supabase.auth.signOut();
//       const { data, error: signInError } = await supabase.auth.signInWithPassword({
//         email,
//         password,
//       });

//       if (signInError) throw signInError;

//       const { data: profile, error: profileError } = await supabase
//         .from("profiles")
//         .select("role")
//         .eq("id", data.user.id)
//         .single();

//       if (profileError) throw profileError;

//       navigate(profile.role === "seller" ? "/seller-dashboard" : "/dashboard");
//     } catch (err: any) {
//       setError(err.message);
//       throw err; // Re-throw to trigger the fail animation
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div 
//       ref={containerRef} 
//       className="h-screen relative flex items-center justify-center overflow-hidden px-4"
//       onMouseEnter={() => setIsHovered(true)}
//       onMouseLeave={() => setIsHovered(false)}
//     >
//       {/* Background Effects */}
//       <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-white to-blue-50/30 dark:from-background dark:via-background/95 dark:to-background" />
//       <div className="pointer-events-none absolute inset-0 transition-opacity duration-300" style={getGlowStyles()} />
//       <div className="absolute inset-0">
//         <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-100/50 dark:bg-primary/5 blur-3xl" />
//         <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-50/50 dark:bg-blue-500/5 blur-3xl" />
//       </div>

//       <div className="relative w-full max-w-md mx-auto">
//         <AnimatedLoginForm
//           onSubmit={handleLogin}
//           error={error}
//           loading={loading}
//           onForgotPassword={() => navigate("/forgot-password")}
//         />

//         <motion.p
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           className="text-center mt-6 text-sm text-blue-900/60 dark:text-blue-200/60"
//         >
//           Don't have an account?{" "}
//           <Link
//             to="/register"
//             className="text-blue-900 dark:text-blue-400 hover:underline font-medium"
//           >
//             Create one
//           </Link>
//         </motion.p>
//       </div>
//     </div>
//   );
// }

import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import AnimatedLoginForm from "@/components/AnimatedLoginForm";

export default function Login() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Mouse tracking for glow effect
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const getGlowStyles = () => {
    const lightGlow = `
      radial-gradient(circle 300px at ${mousePosition.x}px ${mousePosition.y}px, 
        rgba(30, 64, 175, 0.15), 
        rgba(59, 130, 246, 0.1), 
        transparent
      )
    `;
    
    const darkGlow = `
      radial-gradient(circle 300px at ${mousePosition.x}px ${mousePosition.y}px, 
        rgba(66, 153, 225, 0.15), 
        transparent
      )
    `;

    return {
      background: theme === "dark" ? darkGlow : lightGlow,
      opacity: isHovered ? 1 : 0.7,
    };
  };

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError("");

    try {
      // Just to clear any existing session
      await supabase.auth.signOut();

      // Attempt to sign in
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Check the user’s role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profileError) throw profileError;

      // Navigate based on role
      navigate(profile.role === "seller" ? "/seller-dashboard" : "/dashboard");
    } catch (err: any) {
      setError(err.message);
      throw err; // Re-throw to trigger the fail animation in AnimatedLoginForm
    } finally {
      setLoading(false);
    }
  };

  // Track mouse movement
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="h-screen relative flex items-center justify-center overflow-hidden px-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-white to-blue-50/30 dark:from-background dark:via-background/95 dark:to-background" />
      <div className="pointer-events-none absolute inset-0 transition-opacity duration-300" style={getGlowStyles()} />
      <div className="absolute inset-0">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-100/50 dark:bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-50/50 dark:bg-blue-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md mx-auto">
        <AnimatedLoginForm
          onSubmit={handleLogin}
          error={error}
          loading={loading}
          onForgotPassword={() => navigate("/forgot-password")}
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mt-6 text-sm text-blue-900/60 dark:text-blue-200/60"
        >
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="text-blue-900 dark:text-blue-400 hover:underline font-medium"
          >
            Create one
          </Link>
        </motion.p>
      </div>
    </div>
  );
}
