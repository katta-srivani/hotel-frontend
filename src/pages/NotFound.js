// src/pages/NotFound.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { FaHome, FaArrowRight } from "react-icons/fa";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 
      bg-gradient-to-br from-blue-600 to-blue-900">

      <div className="text-center text-white">

        {/* 404 */}
        <h1 className="text-[120px] md:text-[180px] font-bold drop-shadow-lg leading-none mb-4">
          404
        </h1>

        {/* Title */}
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          Page Not Found
        </h2>

        {/* Description */}
        <p className="text-lg opacity-90 max-w-md mx-auto mb-10 leading-relaxed">
          Sorry, the page you're looking for doesn't exist. Let's get you back on track.
        </p>

        {/* Buttons */}
        <div className="flex flex-wrap justify-center gap-4">

          {/* Home Button */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-6 py-3 rounded-full 
              bg-white text-blue-600 font-medium 
              hover:-translate-y-1 hover:shadow-lg transition"
          >
            <FaHome /> Back to Home
          </button>

          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-6 py-3 rounded-full 
              border-2 border-white text-white 
              bg-white/20 hover:bg-white/30 
              hover:-translate-y-1 transition"
          >
            <FaArrowRight /> Go Back
          </button>

        </div>

        {/* Footer */}
        <p className="mt-14 text-sm opacity-70">
          If you believe this is a mistake, please contact support.
        </p>

      </div>
    </div>
  );
}

export default NotFound;