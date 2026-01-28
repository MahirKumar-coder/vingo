// controllers/auth.controllers.js
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import getToken from "../utils/token.js";
import { sendOtpMail } from "../utils/mail.js";

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

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

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

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json(user);
  } catch (error) {
    console.error("signIn error:", error);
    return res.status(500).json({ message: "signIn error", error: error.message });
  }
};

export const signOut = async (_req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
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
    user.otpExpires = Date.now() + 5 * 60 * 1000; // <-- fixed Data.now() -> Date.now()
    user.isOtpVerified = false;
    await user.save();

    // send email (make sure sendOtpMail is implemented)
    try {
      await sendOtpMail(email, otp);
    } catch (mailErr) {
      console.error("Failed to send OTP email:", mailErr);
      // still return success if you prefer, or propagate error:
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

    // Optional: verify isOtpVerified === true before allowing reset
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
        role: role || "user", // Agar role frontend se nahi aaya toh default 'user'
        google_auth: true,    // 🔥 YEH LINE SABSE ZAROORI HAI. Iske bina error aayega.
      });
    }

    const token = await getToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(200).json(user);
  } catch (error) {
    console.error("Google Auth Error:", error); // Console log add kiya debugging ke liye
    return res.status(500).json({ message: `googleAuth error: ${error.message}` });
  }
};
