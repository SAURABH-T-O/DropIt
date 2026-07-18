import express from "express";
import cors from "cors";
import shareRoutes from "./routes/share.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("DropIt Backend is running");
});

app.use("/api/shares", shareRoutes);

app.use(errorMiddleware);

export { app };