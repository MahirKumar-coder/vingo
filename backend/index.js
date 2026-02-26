import dns from "dns";
// 🔥 Node.js 17+ aksar 'localhost' ko IPv6 (::1) par resolve karta hai,
// jisse MongoDB connection fail ho sakta hai. Ye fix force karta hai IPv4 (8.8.8.8).
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

// Config Files
import connectDB from "./config/db.js";

// Routes Imports
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import shopRouter from "./routes/shop.routes.js";
import itemRouter from "./routes/item.routes.js";
import orderRouter from "./routes/order.routes.js";
import http from "http"
import { socketHandler } from "./socket.js";

// Load Env Vars
dotenv.config();

const app = express();
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://vingo-cyan.vercel.app"
    ],
    credentials: true,
    methods: ['POST', 'GET']
  }
})

app.set("io", io)

const PORT = process.env.PORT || 8000;

// ✅ 1. Middlewares
app.use(express.json()); // JSON data handle karne ke liye
app.use(cookieParser()); // Cookies read karne ke liye
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://vingo-cyan.vercel.app"
  ],
  credentials: true, // Cookies allow karne ke liye zaroori hai
  methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
}));

// ✅ 2. Health Check Route (Optional but Good)
app.get("/", (req, res) => {
  res.send("API is working fine 🚀");
});

// ✅ 3. Routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/shop", shopRouter);
app.use("/api/item", itemRouter);
app.use("/api/order", orderRouter);

socketHandler(io)

// ✅ 4. Global Error Handler (App crash hone se bachayega)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("❌ Error:", message);
  res.status(statusCode).json({
    success: false,
    message,
  });
});

// ✅ 5. Server Startup Function (Best Practice)
const startServer = async () => {
  try {
    await connectDB();
    console.log("✅ MongoDB Connected Successfully");

    server.listen(PORT, () => {
      console.log(`🚀 Server started at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Database Connection Failed:", error.message);
    process.exit(1); // Agar DB connect nahi hua to process band kar do
  }
};

startServer();