// controllers/auth.controllers.js
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import getToken from "../utils/token.js";
import { sendOtpMail } from "../utils/mail.js";

// --- HELPERS ---
// Production aur Localhost dono jagah chalne ke liye cookie options
const cookieOptions = {
  httpOnly: true,
  secure: true,       // 🔥 Zaroori: Render HTTPS use karta hai
  sameSite: "none",   // 🔥 Zaroori: Vercel aur Render alag domains hain
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

export const signup = async (req, res) => {
  console.log("SIGNUP REQUEST BODY RECEIVED:", req.body);
  try {
    let { fullName, email, password, mobile, role } = req.body;
    if (typeof mobile !== "string") mobile = String(mobile || "");

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists." });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    if (!mobile || mobile.length <= 10) {
      return res.status(400).json({ message: "Invalid mobile number." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      mobile,
      role,
      password: hashedPassword,
    });

    const token = await getToken(user._id);

    // ✅ Updated Cookie Settings
    res.cookie("token", token, cookieOptions);

    return res.status(201).json(user);
  } catch (error) {
    console.error("signup error:", error);
    return res.status(500).json({ message: "signup error", error: error.message });
  }
};

export const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User does not exist." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password." });

    const token = await getToken(user._id);

    // ✅ Updated Cookie Settings
    res.cookie("token", token, cookieOptions);

    return res.status(200).json(user);
  } catch (error) {
    console.error("signIn error:", error);
    return res.status(500).json({ message: "signIn error", error: error.message });
  }
};

export const signOut = async (_req, res) => {
  try {
    // Logout ke waqt bhi same settings honi chahiye tabhi clear hoga
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,     // 🔥 Match hona chahiye
      sameSite: "none", // 🔥 Match hona chahiye
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("signOut error:", error);
    return res.status(500).json({ message: "signOut error", error: error.message });
  }
};

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: "Email required." });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User does not exist." });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit
    user.resetOtp = otp;
    user.otpExpires = Date.now() + 5 * 60 * 1000;
    user.isOtpVerified = false;
    await user.save();

    try {
      await sendOtpMail(email, otp);
    } catch (mailErr) {
      console.error("Failed to send OTP email:", mailErr);
      return res.status(500).json({ message: "Failed to send OTP email", error: mailErr.message });
    }

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("send otp error", error);
    return res.status(500).json({ message: "send otp error", error: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP required." });

    const user = await User.findOne({ email });
    if (!user || user.resetOtp !== String(otp) || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    user.isOtpVerified = true;
    user.resetOtp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("verify otp error", error);
    return res.status(500).json({ message: "verify otp error", error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body || {};
    if (!email || !newPassword) return res.status(400).json({ message: "Email and newPassword required." });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User does not exist." });
    }

    if (!user.isOtpVerified) {
      return res.status(400).json({ message: "OTP not verified for this user." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.isOtpVerified = false;
    await user.save();

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("reset password error", error);
    return res.status(500).json({ message: "reset password error", error: error.message });
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { fullName, email, mobile, role } = req.body;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        fullName,
        email,
        mobile,
        role: role || "user",
        google_auth: true,
      });
    }

    const token = await getToken(user._id);

    // ✅ Updated Cookie Settings
    res.cookie("token", token, cookieOptions);

    return res.status(200).json(user);
  } catch (error) {
    console.error("Google Auth Error:", error);
    return res.status(500).json({ message: `googleAuth error: ${error.message}` });
  }
};