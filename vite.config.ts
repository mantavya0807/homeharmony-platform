// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import express from "express";
import stripeRouter from "./server/api/stripe";
import documentVerificationRouter from "./server/api/documentVerification";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    middleware: [
      (req, res, next) => {
        if (req.url?.startsWith("/api/stripe")) {
          req.url = req.url.replace("/api", "");
          return express().use("/stripe", stripeRouter)(req, res, next);
        }
        if (req.url?.startsWith("/api/verify-document")) {
          req.url = req.url.replace("/api", "");
          return express().use(documentVerificationRouter)(req, res, next);
        }
        next();
      },
    ],
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
