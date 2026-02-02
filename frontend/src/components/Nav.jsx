import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { FaLocationDot } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import { IoCartOutline } from "react-icons/io5";
import { useSelector } from "react-redux";
import axios from "axios";
import { useDispatch } from "react-redux";
import { serverUrl } from "../App";
import { FaPlus } from "react-icons/fa";
import { TbReceiptRupee } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import {
  setUserData,
  setCurrentCity,
  logoutUser
} from "../redux/userSlice";

import { setMyShopData } from "../redux/ownerSlice";


const AvatarButton = ({ onClick, children }) => (
  <div
    role="button"
    tabIndex={0}
    onClick={onClick}
    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
    className="w-10 h-10 rounded-full flex items-center justify-center bg-[#ff4d2d] text-white text-[16px] shadow-md font-semibold cursor-pointer select-none"
  >
    {children}
  </div>
);

// Popup component rendered into body via Portal
function Popup({ anchorRect, onClose, displayName, onLogout }) {
  if (!anchorRect) return null;

  const top = Math.round(anchorRect.bottom + 8);
  const right = Math.round(window.innerWidth - anchorRect.right);

  const popup = (
    
    <div
      className="fixed nav-popup"
      style={{ top: `${top}px`, right: `${right}px`, zIndex: 9999 }}
      role="dialog"
    >
      <div className="w-[220px] bg-white shadow-2xl rounded-xl p-4 flex flex-col gap-2">
        <div className="text-[15px] font-semibold truncate">{displayName}</div>

        <button className="text-left text-sm text-gray-700 hover:text-[#ff4d2d]">
          Profile
        </button>

        <button className="md:hidden text-left text-sm text-gray-700 hover:text-[#ff4d2d]" onClick={() => navigate('my-orders')}>
          My Orders
        </button>

        <button
          onClick={onLogout}
          className="text-left text-sm text-red-500 hover:opacity-80"
        >
          Sign out
        </button>
      </div>
    </div>
  );

  return createPortal(popup, document.body);
}


const Nav = () => {
  const { userData, currentCity, cartItems } = useSelector(state => state.user);
  const { myShopData } = useSelector((state) => state.owner || {});
  const rawName = (userData?.fullName || "").trim();
  const userInitial = (rawName ? rawName.charAt(0).toUpperCase() : "U") || "U";
  const displayName = userData?.fullName || "Guest";

  const avatarRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/signout`, {
        withCredentials: true,
      });

      // 🔥 Clear redux
      dispatch(setUserData(null));
      dispatch(setCurrentCity(null));
      dispatch(setMyShopData(null));

      // 🔥 Clear local storage (agar use hota hai)
      localStorage.clear();

      // 🔥 Close menu
      setMenuOpen(false);

      // 🔥 Redirect
      navigate("/login");

    } catch (error) {
      console.error("Logout failed:", error);
    }
  };




  // compute anchor rect when opening, and update on resize/scroll
  const computeRect = useCallback(() => {
    const el = avatarRef.current;
    if (!el) return setAnchorRect(null);
    setAnchorRect(el.getBoundingClientRect());
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    computeRect();

    function handleDocClick(e) {
      const el = avatarRef.current;
      if (el && !el.contains(e.target)) {
        // If click happened outside avatar, we still need to ensure popup area is considered.
        // Since popup is in body, checks below will close as well when clicking outside.
        // We won't close here immediately because user might click popup; instead rely on global click close below.
      }
    }

    const onGlobalClick = (e) => {
      const el = avatarRef.current;
      // if click inside avatar -> keep
      if (el && el.contains(e.target)) return;
      // if click inside popup -> keep (popup rendered in body; we can't check here)
      // So we close unless the clicked element is inside popup container (use closest)
      const popupEl = (e.target && e.target.closest && e.target.closest(".nav-popup"));
      if (popupEl) return;
      setMenuOpen(false);
    };

    window.addEventListener("resize", computeRect);
    window.addEventListener("scroll", computeRect, true);
    document.addEventListener("click", onGlobalClick);

    return () => {
      window.removeEventListener("resize", computeRect);
      window.removeEventListener("scroll", computeRect, true);
      document.removeEventListener("click", onGlobalClick);
    };
  }, [menuOpen, computeRect]);

  // toggle handler assigned to avatar
  const toggleMenu = () => setMenuOpen((s) => !s);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-[#fff9f6] backdrop-blur-sm shadow-sm"
      aria-label="Main navigation"
    >
      <div className="max-w-[1200px] mx-auto flex items-center justify-between px-5 h-20">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-extrabold text-[#ff4d2d] select-none tracking-tight">
            Vingo
          </h1>
          <span className="hidden md:inline-block text-sm text-gray-500">
            delicious, delivered
          </span>
        </div>

        {/* Search / Location - visible on md+ */}
        {userData?.role === "user" && <div className="hidden md:flex md:w-[60%] lg:w-[40%] items-center h-[70px] bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex items-center w-[30%] gap-3 px-4 border-r border-gray-200">
            <FaLocationDot size={22} className="text-[#ff4d2d]" aria-hidden />
            <div className="truncate text-gray-700">{currentCity}</div>
          </div>

          <div className="flex items-center px-4 w-[70%]">
            <FaSearch size={20} className="text-[#ff4d2d] mr-3" aria-hidden />
            <input
              type="search"
              placeholder="Search delicious food..."
              className="w-full text-gray-700 outline-none text-sm placeholder-gray-400"
              aria-label="Search food"
            />
          </div>
        </div>}


        {/* Right controls */}
        <div className="flex items-center gap-4">

          {userData?.role === "owner" ? <>
            {myShopData && <><button className="hidden md:flex items-center gap-1 p-2 cursor-pointer rounded-full bg-[#ff4d2d]/10 text-[#ff4d2d]" onClick={() => navigate('/add-item')}>
              <FaPlus size={20} />
              <span>Add Food Item</span>
            </button>
              <button className="md:hidden flex items-center p-2 cursor-pointer rounded-full bg-[#ff4d2d]/10 text-[#ff4d2d]" onClick={() => navigate('/add-item')}>
                <FaPlus size={20} />
              </button></>}

            <div className="hidden md:flex items-center gap-2 cursor-pointer relative px-3 py-1 rounded-lg bg-[#ff4d2d]/10 text-[#ff4d2d] font-medium" >
              <TbReceiptRupee size={20} onClick={() => navigate('my-orders')} />
              <span onClick={() => navigate('my-orders')}>My Orders</span>
              <span className="absolute -right-2 -top-2 text-xs font-bold text-white bg-[#ff4d2d] rounded-full px-[6px] py-[1px]">0</span>
            </div>
            <div className="md:hidden flex items-center gap-2 cursor-pointer relative px-3 py-1 rounded-lg bg-[#ff4d2d]/10 text-[#ff4d2d] font-medium">
              <TbReceiptRupee size={20} />
              <span className="absolute -right-2 -top-2 text-xs font-bold text-white bg-[#ff4d2d] rounded-full px-[6px] py-[1px]">0</span>
            </div>
          </> : (
            <>
              <button
                type="button"
                className="relative p-2 rounded-md hover:bg-[#ff4d2d]/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]/40"
                aria-label="Cart" onClick={() => navigate("/cart")}
              >
                <IoCartOutline size={22} className="text-[#ff4d2d]" />
                <span className="absolute -right-2 -top-1 bg-white text-[#ff4d2d] text-xs font-semibold py-0.5 px-2 rounded-full shadow-sm">
                  {cartItems.length}
                </span>
              </button>

              {/* My Order button - hidden small */}
              <button
                className="hidden md:inline-block px-3 py-1 rounded-lg bg-[#ff4d2d]/10 text-[#ff4d2d] text-sm font-medium hover:bg-[#ff4d2d]/15 transition"
                aria-label="My Orders" onClick={() => navigate('/my-orders')}
              >
                My Order
              </button>
            </>
          )}

          {/* Cart */}


          {/* Avatar / Initial */}
          <div ref={avatarRef}>
            <AvatarButton onClick={() => { toggleMenu(); computeRect(); }}>
              {userInitial}
            </AvatarButton>
          </div>
        </div>
      </div>

      {/* Mobile search bar (under nav, small) */}
      {userData?.role === "user" && <div className="md:hidden bg-white border-t border-gray-100">
        <div className="max-w-[1200px] mx-auto px-5 py-2">
          <div className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 shadow-sm">
            <FaSearch size={16} className="text-[#ff4d2d]" aria-hidden />
            <input
              type="search"
              placeholder="Search delicious food..."
              className="w-full text-gray-700 outline-none text-sm placeholder-gray-400"
              aria-label="Mobile search"
            />
          </div>
        </div>
      </div>}

      {/* Render Portal popup */}
      {menuOpen && (
        <Popup
          anchorRect={anchorRect}
          onClose={() => setMenuOpen(false)}
          displayName={displayName}
          onLogout={handleLogout}
        />
      )}

    </nav>
  );
};

export default Nav;
// 7:01:29