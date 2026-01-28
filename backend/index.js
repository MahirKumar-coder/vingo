import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]); // 🔥 SABSE PEHLE

import express from "express";
import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import shopRouter from "./routes/shop.routes.js";
import itemRouter from "./routes/item.routes.js";

const app = express();
const port = process.env.PORT || 8000;

// middlewares
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: ["http://localhost:5173", "https://vingo-cyan.vercel.app"],
  credentials: true,
}));

// routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/shop", shopRouter);
app.use("/api/item", itemRouter);

// DB connect
console.log("My URI is:", process.env.MONGO_URI);

try {
  await connectDB();
  console.log("✅ MongoDB connected");
} catch (err) {
  console.error("❌ MongoDB connect failed:", err.message);
  process.exit(1);
}

app.listen(port, () => {
  console.log(`✅ Server started at port ${port}`);
});
