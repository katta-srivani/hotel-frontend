import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FaUser, FaSignOutAlt, FaCalendarAlt,
  FaCog, FaBars, FaTimes, FaChevronDown,
  FaMapMarkerAlt, FaBell
} from "react-icons/fa";
import api from "../utils/api";
import { AuthContext } from "../context/AuthContext";

function Navbar() {
  const { user, token, isAuthenticated, logout } = React.useContext(AuthContext);

  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 🔔 Notification states
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const dropdownRef = useRef();
  const bellRef = useRef();

  const handleLogout = () => {
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
    <nav className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">

          {/* LOGO */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 shadow-md">
              <FaMapMarkerAlt className="text-white text-xl" />
            </div>
            <span className="text-xl font-extrabold text-gray-800">
              Travelerly
            </span>
          </Link>

          {/* CENTER */}
          <div className="hidden lg:flex items-center gap-10">
            <Link className="nav-link" to="/">Explore Hotels</Link>
            <a href="/#" className="nav-link">About</a>
            <a href="/#" className="nav-link">Contact</a>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4">

            {!isAuthenticated ? (
              <div className="flex gap-3">
                <Link to="/login" className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg">
                  Log In
                </Link>
                <Link to="/register" className="px-5 py-2 text-white rounded-lg bg-blue-600">
                  Sign Up
                </Link>
              </div>
            ) : (
              <>
                {/* 🔔 NOTIFICATION BELL */}
                <div className="relative" ref={bellRef}>
                  <div
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="cursor-pointer relative"
                  >
                    <FaBell className="text-xl text-gray-700" />

                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </div>

                  {/* DROPDOWN */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-3 w-80 bg-white shadow-xl rounded-xl p-3 border max-h-96 overflow-y-auto">
                      <h3 className="font-semibold mb-2">Notifications</h3>

                      {notifications.length === 0 ? (
                        <p className="text-gray-400 text-sm">No notifications</p>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n._id}
                            className={`p-2 mb-2 rounded cursor-pointer ${
                              n.isRead ? "bg-gray-100" : "bg-blue-50"
                            }`}
                            onClick={() => markAsRead(n._id)}
                          >
                            <p className="text-sm">{n.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* USER DROPDOWN */}
                <div className="relative" ref={dropdownRef}>
                  <div
                    onClick={() => setOpen(!open)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-600 text-white">
                      {getInitial()}
                    </div>
                    <FaChevronDown className={`text-xs ${open ? "rotate-180" : ""}`} />
                  </div>

                  {open && (
                    <div className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-xl border">
                      <div className="p-4 bg-gray-50 border-b">
                        <p className="font-semibold">{user?.firstName || user?.name || 'User'}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                      </div>

                      <DropdownLink to="/my-bookings" icon={<FaCalendarAlt />}>
                        My Bookings
                      </DropdownLink>

                      <DropdownLink to="/profile" icon={<FaUser />}>
                        Profile
                      </DropdownLink>

                      {user?.role === "admin" && (
                        <DropdownLink to="/admin/dashboard" icon={<FaCog />}>
                          Dashboard
                        </DropdownLink>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-5 py-3 text-red-600 hover:bg-red-50 flex items-center gap-3"
                      >
                        <FaSignOutAlt />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* MOBILE */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-blue-600 text-xl"
            >
              {mobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

const DropdownLink = ({ to, icon, children }) => (
  <Link
    to={to}
    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-100"
  >
    {icon}
    {children}
  </Link>
);

export default Navbar;