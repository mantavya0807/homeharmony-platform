import express from "express";
import cors from "cors";
import path from "path";
import stripeRouter from "./api/stripe";
import documentVerificationRouter from "./api/documentVerification";
import geminiRouter from "./api/gemini";
import propertyClicksRouter from "./api/propertyClicks";
import walkScoreRouter from "./api/walkscore";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const __dirname = path.resolve();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:8080",
  "https://sub-space.me"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/property-clicks", propertyClicksRouter);
app.use("/api/stripe", stripeRouter);
app.use("/api/verify-document", documentVerificationRouter);
app.use("/api/gemini", geminiRouter);
app.use("/api/walkscore", walkScoreRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Error:", err.stack);
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      error: "CORS Error",
      message: "Origin not allowed"
    });
  }
  res.status(err.status || 500).json({
    error: "Internal Server Error",
    message: err.message || "Something went wrong"
  });
});

const PORT = process.env.PORT || 4000;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Walk Score API endpoint: http://localhost:${PORT}/api/walkscore/score`);
  });
}

export default app;
