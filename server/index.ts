import express from "express";
import cors from "cors";
import path from "path";
import stripeRouter from "./api/stripe";
import documentVerificationRouter from "./api/documentVerification";
import geminiRouter from "./api/gemini";
import propertyClicksRouter from "./api/propertyClicks";
import dotenv from "dotenv";
import walkscorerouter from "./api/walkscore";

dotenv.config();

const app = express();
const __dirname = path.resolve();

// Define allowed origins. You can include both your Supabase URL and your local dev URL.
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:8080',
  'https://sub-space.me',
  '*'
];

// Use CORS with a custom origin callback
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API routes
app.use("/api/property-clicks", propertyClicksRouter);
app.use("/api/stripe", stripeRouter);
app.use("/api/verify-document", documentVerificationRouter);
app.use("/api/gemini", geminiRouter);
app.use("/api/walkscore", walkscorerouter);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

const PORT = process.env.PORT || 4000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;