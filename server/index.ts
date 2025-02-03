import express from "express";
import cors from "cors";
import stripeRouter from "./api/stripe";
import documentVerificationRouter from "./api/documentVerification";
import geminiRouter from "./api/gemini";
import propertyClicksRouter from "./api/propertyClicks"; // Import new router
import { fileURLToPath } from "url";
import { dirname } from "path";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(cors({
  origin: "*",
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
app.use("/api/property-clicks", propertyClicksRouter); // New property click route

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
