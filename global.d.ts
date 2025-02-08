interface ImportMetaEnv {
    // List your env variables here, for example:
    VITE_PUBLIC_SUPABASE_URL: string;
    VITE_PUBLIC_SUPABASE_ANON_KEY: string;
    VITE_STRIPE_PUBLISHABLE_KEY: string;
    // Add any other environment variables you use
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  