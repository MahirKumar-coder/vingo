import { useEffect, useState } from 'react' // useState aur useEffect add kiya
import { Navigate, Route, Routes } from 'react-router-dom'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import useGetCurrentUser from './hooks/useGetCurrentUser'
import { useSelector, useDispatch } from 'react-redux' // useDispatch add kiya
import { setUserData } from './redux/userSlice' // setUserData import kiya
import Home from './pages/Home'
import Nav from './components/Nav'
import useGetCity from './hooks/useGetCity'
import useGetMyShop from './hooks/useGetMyShop'
import CreateEditShop from './pages/createEditShop'
import MainLayout from './layouts/MainLayout'
import AddItem from './pages/AddItem'
import EditItem from './pages/editItem'
import useGetShopByCity from './hooks/useGetShopByCity'
import useGetItemsbyCity from './hooks/useGetItemsbyCity'

export const serverUrl = "http://localhost:8000"

function App() {
  const dispatch = useDispatch();

  // 1. Hook call ho raha hai (Server sync ke liye thik hai)
  const apiLoading = useGetCurrentUser();
  useGetCity();
  useGetMyShop();
  useGetShopByCity();
  useGetItemsbyCity();

  // 2. Redux se user nikala
  const { userData } = useSelector(state => state.user)

  // 3. Local loading state banaya taki hum tab tak wait karein jab tak storage check na ho jaye
  const [isAppReady, setIsAppReady] = useState(false);

  // --- FIX START: Refresh hone par turant Storage check karo ---
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    // Agar storage me user hai aur Redux khali hai, to Redux me daalo
    if (storedUser && !userData) {
      dispatch(setUserData(JSON.parse(storedUser)));
    }

    // Check complete ho gaya, ab app dikha sakte hain
    setIsAppReady(true);
  }, []); // [] ka matlab sirf ek baar chalega start me
  // --- FIX END ---


  // Agar App ready nahi hai ya API loading hai, to Spinner dikhao
  if (!isAppReady || apiLoading) {
    return (
      <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        {/* Yahan React Spinner laga sakte ho */}
        <h2>Loading...</h2>
      </div>
    )
  }

  return (
    <>
      <Routes>

        {/* AUTH ROUTES (NO NAVBAR) */}
        <Route path="/signin" element={!userData ? <SignIn /> : <Navigate to="/" />} />
        <Route path="/signup" element={!userData ? <SignUp /> : <Navigate to="/" />} />
        <Route path="/forgot-password" element={!userData ? <ForgotPassword /> : <Navigate to="/" />} />

        {/* ROUTES WITH NAVBAR */}
        <Route element={userData ? <MainLayout /> : <Navigate to="/signin" />}>
          <Route path="/" element={<Home />} />
        </Route>

        {/* ROUTE WITHOUT NAVBAR */}
        <Route
          path="/create-edit-shop"
          element={userData ? <CreateEditShop /> : <Navigate to="/signin" />}
        />
        <Route
          path="/add-item"
          element={userData ? <AddItem /> : <Navigate to="/signin" />}
        />
        <Route
          path="/edit-item/:itemId"
          element={userData ? <EditItem /> : <Navigate to="/signin" />}
        />

      </Routes>
    </>
  )
}

export default App