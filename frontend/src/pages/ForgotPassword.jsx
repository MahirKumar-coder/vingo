import React, { useState } from "react";
import axios from "axios";
import { IoIosArrowRoundBack } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { ClipLoader } from "react-spinners";

const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:8000";

// define your backend URL

const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSendOtp = async () => {
        setError(null);
        setLoading(true);

        if (!email) {
            setError("Please enter your email");
            setLoading(false);
            return;
        }

        // show exactly what URL we're hitting
        const url = `${serverUrl}/api/auth/send-otp`;
        console.log("Attempting POST to:", url, "payload:", { email });

        try {
            const res = await axios.post(url, { email }, { headers: { "Content-Type": "application/json" }, withCredentials: true });
            console.log("send-otp response:", res.status, res.data);
            setStep(2);
            setLoading(false);
        } catch (err) {
            console.error("send-otp error - status:", err?.response?.status);
            console.error("send-otp response body:", err?.response?.data);
            console.error("axios error message:", err.message);

            // Friendly UI message
            if (err?.response?.status === 404) {
                setError("OTP endpoint not found (404). Check backend route or serverUrl.");
            } else {
                setError(err?.response?.data?.message || "Failed to send OTP");
            }
           
        } finally {
            setLoading(false);
        }
    };


    const handleVerifyOtp = async () => {
        setError(null);
        if (!otp) return setError("Please enter the OTP");
        setLoading(true);
        try {
            const result = await axios.post(
                `${serverUrl}/api/auth/verify-otp`,
                { email, otp },
                { withCredentials: true }
            );
            console.log(result.data);
            setStep(3);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || "OTP verification failed");
            
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        setError(null);
        if (!newPassword || !confirmPassword) return setError("Fill both password fields");
        if (newPassword !== confirmPassword) return setError("Passwords do not match");
        setLoading(true);
        try {
            const result = await axios.post(
                `${serverUrl}/api/auth/reset-password`,
                { email, newPassword },
                { withCredentials: true }
            );
            console.log(result.data);
            navigate("/signin"); // navigate to signin after reset
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || "Password reset failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex w-full items-center justify-center min-h-screen p-4 bg-[#fff9f6]">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8">
                <div className="flex items-center gap-4 mb-4">
                    <IoIosArrowRoundBack
                        size={30}
                        className="text-[#ff4d2d] cursor-pointer"
                        onClick={() => navigate("/signin")}
                    />
                    <h1 className="text-2xl font-bold text-center text-[#ff4d2d]">Forgot Password</h1>
                </div>

                {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

                {step === 1 && (
                    <div>
                        <div className="mb-6">
                            <label htmlFor="email" className="block text-gray-700 font-medium mb-1">Email</label>
                            <input
                                id="email"
                                type="email"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                                placeholder="Enter your Email"
                                onChange={(e) => setEmail(e.target.value)}
                                value={email}
                                required
                            />
                        </div>
                        <button
                            type="button"
                            className="w-full font-semibold py-2 rounded-lg transition duration-200 bg-[#ff4d2d] text-white hover:bg-[#e64323] cursor-pointer"
                            onClick={handleSendOtp}
                            disabled={loading}
                        >
                            {loading ? <ClipLoader size={20} color="white" /> : "Send OTP"}
                        </button>
                        {error && <p className='text-red-500 text-center my-2.5'>*{error}</p>}

                    </div>
                )}

                {step === 2 && (
                    <div>
                        <div className="mb-6">
                            <label htmlFor="otp" className="block text-gray-700 font-medium mb-1">OTP</label>
                            <input
                                id="otp"
                                type="text"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                                placeholder="Enter OTP"
                                onChange={(e) => setOtp(e.target.value)}
                                value={otp}
                                required
                            />
                        </div>
                        <button
                            type="button"
                            className="w-full font-semibold py-2 rounded-lg transition duration-200 bg-[#ff4d2d] text-white hover:bg-[#e64323] cursor-pointer"
                            onClick={handleVerifyOtp}
                            disabled={loading}
                        >
                            {loading ? <ClipLoader size={20} color="white" /> : "Verify OTP"}
                        </button>
                        {error && <p className='text-red-500 text-center my-2.5'>*{error}</p>}

                    </div>
                )}

                {step === 3 && (
                    <div>
                        <div className="mb-6">
                            <label htmlFor="newPassword" className="block text-gray-700 font-medium mb-1">New Password</label>
                            <input
                                id="newPassword"
                                type="password"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                                placeholder="Enter New Password"
                                onChange={(e) => setNewPassword(e.target.value)}
                                value={newPassword}
                                required
                            />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-1">Confirm Password</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500"
                                placeholder="Confirm Password"
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                value={confirmPassword}
                                required
                            />
                        </div>
                        <button
                            type="button"
                            className="w-full font-semibold py-2 rounded-lg transition duration-200 bg-[#ff4d2d] text-white hover:bg-[#e64323] cursor-pointer"
                            onClick={handleResetPassword}
                            disabled={loading}
                        >
                            {loading ? <ClipLoader size={20} color="white" /> : "Reset Password"}
                        </button>
                        {error && <p className='text-red-500 text-center my-2.5'>*{error}</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
