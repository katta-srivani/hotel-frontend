import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FaHome, FaCalendarAlt, FaUser, FaInfoCircle, FaEnvelope, FaSignOutAlt } from "react-icons/fa";

const navLinks = [
  { to: "/", icon: <FaHome />, label: "Home" },
  { to: "/my-bookings", icon: <FaCalendarAlt />, label: "Bookings" },
  { to: "/about", icon: <FaInfoCircle />, label: "About" },
  { to: "/contact", icon: <FaEnvelope />, label: "Contact" },
  { to: "/profile", icon: <FaUser />, label: "Profile" },
];

function Sidebar({ onLogout }) {
  const location = useLocation();
  return (
    <aside className="h-screen w-20 md:w-56 bg-gray-900 text-white flex flex-col py-6 px-2 shadow-lg fixed top-0 left-0 z-40">
      <div className="flex items-center justify-center mb-10">
        <span className="text-2xl font-extrabold tracking-tight text-white">T</span>
      </div>
      <nav className="flex-1 flex flex-col gap-2">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition text-base font-medium hover:bg-gray-800/80 ${
              location.pathname === link.to ? "bg-gray-800/90" : ""
            }`}
          >
            <span className="text-lg">{link.icon}</span>
            <span className="hidden md:inline">{link.label}</span>
          </Link>
        ))}
      </nav>
      <button
        onClick={onLogout}
        className="flex items-center gap-3 px-4 py-3 rounded-lg mt-8 bg-gray-800/80 hover:bg-gray-700 text-red-400 font-semibold"
      >
        <FaSignOutAlt />
        <span className="hidden md:inline">Logout</span>
      </button>
    </aside>
  );
}

export default Sidebar;
