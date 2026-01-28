// config/db.js
import mongoose from "mongoose";

export default async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI missing in .env");

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    maxPoolSize: 10,
    family: 4, // 🔥 Ye line add kar (Force IPv4)
  });
  console.log("✅ MongoDB connected:", mongoose.connection.host);
}
