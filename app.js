import express from "express";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import otherRoutes from "./routes/otherRoutes.js";
import ErrorMiddleware from "./middlewares/error.js";
import cookieParser from "cookie-parser";
import cors from "cors";

dotenv.config({
  path: "./config/config.env",
});

const app = express();

// Using Middlewares
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// Using Routes
app.use("/api/v1", userRoutes);
app.use("/api/v1/", courseRoutes);
app.use("/api/v1/", paymentRoutes);
app.use("/api/v1/", otherRoutes);

export default app;

app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

app.get("/", (req, res) =>
  res.send(
    `<h1>Website is Working. Click <a href=${process.env.FRONTEND_URL}>here</a> to visit the Frontend.`
  )
);

app.use(ErrorMiddleware);
