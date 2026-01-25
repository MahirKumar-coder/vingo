import React, { useState } from 'react'
// --- FIX: 'react-icons' imports ko hata diya gaya hai ---
// Ab hum inline SVG ka istemal karenge (neeche define kiya gaya hai)
import { useNavigate } from "react-router-dom";
import axios from "axios"
import { auth } from '../../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { ClipLoader } from 'react-spinners';
import { useDispatch } from 'react-redux';
import { setUserData } from '../redux/userSlice';

// --- FIX: Icon components ko inline SVG se banaya gaya hai ---

// Google Icon SVG
const IconGoogle = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="inline-block">
    <path fill="#4285F4" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
    <path fill="#34A853" d="M6.306 14.691c-1.996 3.467-3.238 7.42-3.238 11.637C3.068 30.31 4.31 34.263 6.306 37.731l6.09-4.701C11.08 31.063 10 27.675 10 24c0-3.675 1.08-7.063 2.396-9.928l-6.09-4.701z" />
    <path fill="#FBBC05" d="M24 10c-3.22 0-6.14.96-8.68 2.65l6.09 4.7c1.32-1.02 2.9-1.6 4.59-1.6s3.27.58 4.59 1.6l6.09-4.7C30.14 10.96 27.22 10 24 10z" />
    <path fill="#EA4335" d="M24 36c-3.22 0-6.14-.96-8.68-2.65l6.09-4.7c1.32 1.02 2.9 1.6 4.59 1.6s3.27-.58 4.59-1.6l6.09 4.7C30.14 35.04 27.22 36 24 36z" />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
);

// Eye Icon SVG
const IconEye = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.618-2.228C4.306 4.306 6.035 3.5 8 3.5c1.965 0 3.694.806 5.209 2.272A13.133 13.133 0 0 1 14.828 8c-.817 1.17-1.96 2.035-3.22 2.722C9.694 11.694 7.965 12.5 8 12.5c-1.965 0-3.694-.806-5.209-2.272A13.133 13.133 0 0 1 1.172 8z" />
    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z" />
  </svg>
);

// Eye Slash Icon SVG
const IconEyeSlash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.94 5.94 0 0 1 8 3.5c2.12 0 3.879.806 5.209 2.272A13.133 13.133 0 0 1 14.828 8c-.817 1.17-1.96 2.035-3.22 2.722l.713.713zm-4.34-2.785a2.5 2.5 0 0 0-3.536-3.536l.707.707a1.5 1.5 0 0 1 2.121 2.121l.707.707z" />
    <path d="M10.79 12.912l-1.614-1.615a3.5 3.5 0 0 1-4.474-4.474l-1.615-1.614A7.028 7.028 0 0 0 1 8s3 5.5 8 5.5a7.027 7.027 0 0 0 1.79-.213zm-2.179-1.222a4.5 4.5 0 0 0 5.09-5.09l-1.32-1.32a3.5 3.5 0 0 0-4.474-4.474L8.71 3.12l-1.222 1.222a4.5 4.5 0 0 0 5.09 5.09l.417-.416zM.146 1.146a.5.5 0 0 1 .708 0l14 14a.5.5 0 0 1-.708.708l-14-14a.5.5 0 0 1 0-.708z" />
  </svg>
);


const SignIn = () => {
  const primaryColor = "#ff4d2d";
  const hoverColor = "#e64323";
  const bgColor = "#fff9f6";
  const borderColor = "#ddd";

  // --- FIX 1: 'useNavigate' hook ko call karna zaroori hai () ---
  const navigate = useNavigate()

  // --- FIX 2: 'serverUrl' ko define karo ---
  // Apne backend server ka sahi URL yahaan daalo.
  // Agar tumhara backend port 8000 par chal raha hai toh yeh sahi hai.
  const serverUrl = "http://localhost:8000"

  const [showPassword, setShowPassword] = useState(false)


  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()


  const handleSignIn = async () => {
    setLoading(true)
    try {
      const result = await axios.post(`${serverUrl}/api/auth/signin`, {
        email, password
      }, { withCredentials: true })

      // --- FIX 1: Ye lines add karo (Data browser me save karne ke liye) ---
      // Dhyan dena: result.data ke andar user object kahan hai, us hisab se set karna.
      // Agar result.data pura user object hai to niche wala code sahi hai.
      // Agar result.data.user hai, to JSON.stringify(result.data.user) likhna.
      localStorage.setItem("user", JSON.stringify(result.data));

      // Agar token alag se aa raha hai result.data.token me, to use bhi save karo
      if (result.data.token) {
        localStorage.setItem("token", result.data.token);
      }
      // ---------------------------------------------------------------------

      dispatch(setUserData(result.data))

      // --- FIX 2: Navigate ko uncomment karo ---
      navigate("/") // Ya jahan bhejna hai wahan ka path

    } catch (error) {
      // Error handling badhiya hai
      setErr(error?.response?.data?.message || "Something went wrong")
      setLoading(false)
    } finally {
      // Loading band karna achi practice hai
      setLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    try {
      const { data } = await axios.post(`${serverUrl}/api/auth/google-auth`, {
        email: result.user.email,
      }, { withCredentials: true })
      dispatch(setUserData(data))
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div className='min-h-screen w-full flex items-center justify-center p-4' style={{ backgroundColor: bgColor }}>
      <div className={`bg-white rounded-xl shadow-lg w-full max-w-md p-8 border `} style={{
        border: `1px solid ${borderColor}`
      }}>
        <h1 className={`text-3xl font-bold mb-2 `} style={{ color: primaryColor }}>Vingo</h1>
        <p className='text-gray-600 mb-8'>SignIn to your accout to get stated with delicious food deliveries</p>



        {/* email */}

        <div className='mb-4'>
          <label htmlFor="email" className="block text-gray-700 font-medium mb-1">Email</label>
          <input type="text" className='w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500' placeholder='Enter your Email' style={{ border: `1px solid ${borderColor}` }} onChange={(e) => setEmail(e.target.value)} value={email} required />
        </div>



        {/* password */}

        <div className='mb-4'>
          <label htmlFor="password" className="block text-gray-700 font-medium mb-1">Password</label>
          <div className='relative'>
            <input type={`${showPassword ? "text" : "password"}`} className='w-full border rounded-lg px-3 py-2 focus:outline-none ' placeholder='Enter your Password' style={{ border: `1px solid ${borderColor}` }} onChange={(e) => setPassword(e.target.value)} value={password} required />
            {/* --- FIX: Icon components ko badal diya gaya hai --- */}
            <button className='absolute right-3 cursor-pointer top-3.5 text-gray-500' onClick={() => setShowPassword(prev => !prev)}>{!showPassword ? <IconEye /> : <IconEyeSlash />}</button>
          </div>
        </div>
        <div className='text-right mb-4 text-[#ff4d2d] font-medium cursor-pointer' onClick={() => navigate("/forgot-password")}>
          Forgot password?
        </div>



        <button className={`w-full font-semibold py-2 rounded-lg transition duration-200 bg-[#ff4d2d] text-white hover:bg-[#e64323] cursor-pointer`} onClick={handleSignIn} disabled={loading} >
          {loading ? <ClipLoader size={20} color='white' /> : "Sign In"}
        </button>
        {err && <p className='text-red-500 text-center my-2.5'>*{err}</p>}

        <button className='w-full mt-4 flex items-center justify-center gap-2 border rounded-lg px-4 py-2 transition cursor-pointer duration-200 border-gray-400 hover:bg-gray-100' onClick={handleGoogleAuth}>
          {/* --- FIX: Icon component ko badal diya gaya hai --- */}
          <IconGoogle />
          <span>Sign In with Google</span>
        </button>
        <p className='text-center mt-6 cursor-pointer' onClick={() => navigate("/signup")}>Want to create new Account SignUp ? <span className='text-[#ff4d2d]'>Sign Up</span></p>
      </div>
    </div>
  )
}

export default SignIn