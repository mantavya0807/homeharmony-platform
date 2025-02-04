import express from "express";
import cors from "cors";
import path from "path";
import stripeRouter from "./api/stripe";
import documentVerificationRouter from "./api/documentVerification";
import geminiRouter from "./api/gemini";
import propertyClicksRouter from "./api/propertyClicks";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const __dirname = path.resolve();

// Define allowed origins. You can include both your Supabase URL and your local dev URL.
const allowedOrigins = [
  process.env.VITE_PUBLIC_SUPABASE_URL || process.env.PROCESS_ID,
  "http://localhost:8080",
];

// Use CORS with a custom origin callback
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS: " + origin));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Mount API routes
app.use("/api/stripe", stripeRouter);
app.use("/api/verify-document", (req, res, next) => {
  console.log("[Server] Request URL:", req.url);
  next();
}, documentVerificationRouter);
app.use("/api/gemini", geminiRouter);
app.use("/api/property-clicks", propertyClicksRouter);

const PORT = process.env.PORT || 4000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
