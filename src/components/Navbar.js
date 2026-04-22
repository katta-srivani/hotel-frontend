import React, { useState, useEffect, useRef, useContext } from "react";
import { Link } from "react-router-dom";
import { FaUser, FaSignOutAlt, FaMapMarkerAlt } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

function Navbar() {
  const { user, isAuthenticated, logout } = useContext(AuthContext);

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const getInitial = () => {
    const displayName = user?.firstName || user?.name || "";
    return displayName ? displayName.charAt(0).toUpperCase() : "U";
  };

  return (
    <nav className="sticky top-0 z-30 bg-white/95 shadow-md backdrop-blur border-b border-gray-100">
      <div className="px-12 h-20 flex items-center justify-between gap-8">
        <Link to="/" className="flex items-center gap-2 min-w-[140px]">
          <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white">
            <FaMapMarkerAlt size={24} />
          </div>
          <span className="font-bold text-2xl tracking-tight text-gray-900">Travelerly</span>
        </Link>

        <div className="flex-1 flex justify-center"></div>

        <div className="flex items-center gap-10 min-w-[400px] justify-end">
          <div className="hidden md:flex gap-8 text-base font-semibold text-gray-600">
            <Link to="/" className="hover:text-rose-600 transition">Explore</Link>
            <Link to="/offers" className="hover:text-rose-600 transition">Offers</Link>
            <Link to="/mybookings" className="hover:text-rose-600 transition">Bookings</Link>
            <Link to="/wishlist" className="hover:text-yellow-500 transition">Wishlist</Link>
            <Link to="/about" className="hover:text-rose-600 transition">About</Link>
            <Link to="/contact" className="hover:text-rose-600 transition">Contact</Link>
            {user?.role === "admin" && (
              <Link to="/admin/dashboard" className="hover:text-blue-700 text-blue-700 transition font-bold">
                Admin Dashboard
              </Link>
            )}
          </div>

          {!isAuthenticated ? (
            <>
              <Link to="/login" className="text-base font-semibold text-gray-900 hover:underline">
                Login
              </Link>
              <Link
                to="/register"
                className="bg-rose-500 text-white px-6 py-2 rounded-xl text-base font-semibold shadow hover:bg-rose-600 transition"
              >
                Sign up
              </Link>
            </>
          ) : (
            <div className="relative flex items-center gap-3">
              <NotificationBell />
              <div className="flex items-center gap-2">
                <div
                  className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-900 cursor-pointer border border-gray-300 shadow"
                  ref={dropdownRef}
                  onClick={() => setOpen((prev) => !prev)}
                >
                  {getInitial()}
                </div>
                {user?.role === "admin" && (
                  <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-lg ml-1">
                    Admin
                  </span>
                )}
              </div>

              {open && (
                <div
                  className="absolute right-0 top-16 bg-white shadow-lg rounded-lg py-2 w-44 z-50 border border-gray-200"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <Link to="/profile" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-gray-900">
                    <FaUser /> Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-100 text-red-600"
                  >
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
