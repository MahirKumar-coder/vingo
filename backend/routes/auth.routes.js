// routes/auth.routes.js
import express from "express";
import { googleAuth, resetPassword, sendOtp, signIn, signOut, signup, verifyOtp } from "../controllers/auth.controllers.js";

const authRouter = express.Router();
authRouter.post("/signup", signup);
authRouter.post("/signin", signIn);
authRouter.get("/signout", signOut);

// CHANGED: use POST for endpoints that expect JSON bodies
authRouter.post("/send-otp", sendOtp);
authRouter.post("/verify-otp", verifyOtp);
authRouter.post("/reset-password", resetPassword);
authRouter.post("/google-auth", googleAuth);

export default authRouter;
