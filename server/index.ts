// server/index.ts

import express from "express";
import cors from "cors";
import path from "path";
import stripeRouter from "./api/stripe";
// import documentVerificationRouter from "./api/documentVerification"; // TEMPORARILY DISABLED - breaks Vercel build
import geminiRouter from "./api/gemini";
import propertyClicksRouter from "./api/propertyClicks";
import walkscoreRouter from "./api/walkscore";
import googlePlacesRouter from "./api/googlePlaces";
import googleTransitRouter from "./api/googleTransit";
import dotenv from "dotenv";

dotenv.config();

const app = express();
// Note: __dirname is already available in CommonJS (from tsconfig.server.json)
// No need to declare it

// CORS configuration - UPDATED
app.use(cors({
  origin: '*', // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));

// More explicit CORS handling for preflight requests
app.options('*', cors());

// Simple middleware to add CORS headers to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API routes
app.use("/api/property-clicks", propertyClicksRouter);
app.use("/api/stripe", stripeRouter);
// app.use("/api/verify-document", documentVerificationRouter); // TEMPORARILY DISABLED
app.use("/api/gemini", geminiRouter);
app.use("/api/walkscore", walkscoreRouter);
app.use("/api/google-places", googlePlacesRouter);
app.use("/api/google-transit", googleTransitRouter);

// Debug endpoint to verify CORS
app.get("/api/cors-test", (req, res) => {
  res.json({ success: true, message: "CORS is working correctly" });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

const PORT = process.env.PORT || 4000;

// Only start server in local development
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel serverless
export default app;