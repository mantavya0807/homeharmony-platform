/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GEMINI_API_KEY: string;
    readonly VITE_GOOGLE_MAPS_API_KEY: string;
    readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
    readonly VITE_API_URL?: string;
    readonly VITE_APP_URL?: string;
    // Add other env variables here if needed
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }