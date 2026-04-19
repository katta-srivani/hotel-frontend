import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FaUser, FaSignOutAlt, FaMapMarkerAlt, FaBell
} from "react-icons/fa";
import api from "../utils/api";
import { AuthContext } from "../context/AuthContext";

function Navbar() {
  const { user, token, isAuthenticated, logout } = React.useContext(AuthContext);

  const [open, setOpen] = useState(false);


  // 🔔 Notification states
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const dropdownRef = useRef();
  const bellRef = useRef();

  const handleLogout = () => {
    console.log('Logout clicked');
    logout();
  };

  // ✅ Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications || res.data.data || []);
    } catch (err) {
      console.error("Notification error", err);
    }
  };

  // ✅ Mark as read
  const markAsRead = async (id) => {
    await api.put(`/notifications/${id}`);
    setNotifications(prev =>
      prev.map(n => n._id === id ? { ...n, isRead: true } : n)
    );
  };

  useEffect(() => {
    if (token) fetchNotifications();
  }, [token]);

  // Close dropdowns
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const getInitial = () => {
    const displayName = user?.firstName || user?.name || "";
    return displayName ? displayName.charAt(0).toUpperCase() : "U";
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <nav className="sticky top-0 z-30 bg-white/95 shadow-md backdrop-blur border-b border-gray-100">
      <div className="px-12 h-20 flex items-center justify-between gap-8">
        {/* LEFT - LOGO */}
        <Link to="/" className="flex items-center gap-2 min-w-[140px]">
          <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white">
            <FaMapMarkerAlt size={24} />
          </div>
          <span className="font-bold text-2xl tracking-tight text-gray-900">Travelerly</span>
        </Link>
        {/* CENTER - EMPTY (search bar moved to hero section) */}
        <div className="flex-1 flex justify-center"></div>
        {/* RIGHT - NAV LINKS & AVATAR */}
        <div className="flex items-center gap-10 min-w-[400px] justify-end">
          <div className="hidden md:flex gap-8 text-base font-semibold text-gray-600">
            <Link to="/" className="hover:text-rose-600 transition">Explore</Link>
            <Link to="/mybookings" className="hover:text-rose-600 transition">Bookings</Link>
            <Link to="/wishlist" className="hover:text-yellow-500 transition">Wishlist</Link>
            <Link to="/about" className="hover:text-rose-600 transition">About</Link>
            <Link to="/contact" className="hover:text-rose-600 transition">Contact</Link>
            {/* Admin Dashboard link visible only to admin users */}
            {user?.role === 'admin' && (
              <Link to="/admin/dashboard" className="hover:text-blue-700 text-blue-700 transition font-bold">Admin Dashboard</Link>
            )}
          </div>
          <button ref={bellRef} onClick={() => setShowNotifications((v) => !v)} className="relative p-2 rounded-full hover:bg-gray-100">
            <FaBell className="text-gray-500" size={22} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">{unreadCount}</span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-8 top-16 bg-white shadow-lg rounded-lg py-2 w-64 z-50 border border-gray-200">
              <div className="px-4 py-2 font-semibold text-gray-700 border-b">Notifications</div>
              {notifications.length === 0 ? (
                <div className="px-4 py-3 text-gray-400">No notifications</div>
              ) : notifications.map((n) => (
                <div key={n._id} className={`px-4 py-2 text-sm flex items-center gap-2 ${n.isRead ? 'text-gray-500' : 'text-gray-900 font-semibold'}`}
                  onClick={() => markAsRead(n._id)}
                >
                  {n.message}
                </div>
              ))}
            </div>
          )}
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="text-base font-semibold text-gray-900 hover:underline">Login</Link>
              <Link to="/register" className="bg-rose-500 text-white px-6 py-2 rounded-xl text-base font-semibold shadow hover:bg-rose-600 transition">
                Sign up
              </Link>
            </>
          ) : (
            <div className="relative flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-900 cursor-pointer border border-gray-300 shadow"
                  ref={dropdownRef}
                  onClick={() => setOpen((prev) => !prev)}
                >
                  {getInitial()}
                </div>
                {user?.role === 'admin' && (
                  <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-lg ml-1">Admin</span>
                )}
              </div>
              {open && (
                <div
                  className="absolute right-0 top-16 bg-white shadow-lg rounded-lg py-2 w-44 z-50 border border-gray-200"
                  onMouseDown={e => e.stopPropagation()}
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