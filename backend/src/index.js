import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import { startCleanupJob } from "./tasks/cleanupExpiredShares.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    startCleanupJob();
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
  });