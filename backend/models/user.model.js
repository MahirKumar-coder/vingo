import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    // Change 1: Conditional Required
    // Password tabhi chahiye jab google_auth FALSE ho (matlab normal signup)
    required: function() {
      return !this.google_auth; 
    }
  },
  mobile: {
    type: String,
    // Change 2: Conditional Required
    // Google se aksar mobile number nahi aata, isliye isse bhi conditional karein
    required: function() {
      return !this.google_auth; 
    }
  },
  role: {
    type: String,
    enum: ["user", "owner", "deliveryBoy"],
    // Change 3: Default value add karein
    // Agar Google se login ho raha hai toh role specify nahi hoga, isliye default 'user' rakhein
    default: "user", 
    required: true,
  },
  google_auth: {
    // Change 4: Yeh field add karein taaki pata chale user Google se aaya hai
    type: Boolean,
    default: false
  },
  resetOtp:{
    type: String
  },
  isOtpVerified:{
    type: Boolean,
    default: false
  },
  otpExpires:{
    type: Date
  }
}, { timestamps: true });

const User = mongoose.model("User", userSchema);
export default User;