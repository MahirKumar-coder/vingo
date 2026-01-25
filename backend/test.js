// test.js
import mongoose from "mongoose";
import "dotenv/config.js";

console.log("URI =", process.env.MONGO_URI);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MONGODB CONNECTED");
    process.exit(0);
  })
  .catch((err) => {
    console.log("❌ CONNECTION ERROR:", err.message);
    process.exit(1);
  });
