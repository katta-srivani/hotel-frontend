// (removed duplicate React import)
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCheckCircle, FaHome, FaBook } from 'react-icons/fa';
import Confetti from 'react-confetti';
import React, { useEffect, useState } from 'react';

function Gratitude() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showConfetti, setShowConfetti] = useState(true);
  // Optionally, get booking summary from location.state
  const booking = location.state?.booking;

  useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-xl mx-auto bg-white shadow-lg rounded-2xl p-8 mt-10 text-center relative overflow-hidden">
      {/* Confetti removed for error debugging */}
      <div className="flex flex-col items-center">
        <FaCheckCircle className="text-green-500 text-6xl mb-2 animate-bounce" />
        <h2 className="text-3xl font-extrabold mb-2 text-green-700">Thank You!</h2>
        <p className="text-gray-700 mb-4 text-lg">Your payment and booking were completed successfully.</p>
        {/* Booking Summary removed to fix React child error */}
        <div className="flex gap-3 justify-center mt-6">
          <button
            className="bg-blue-600 text-white px-5 py-2 rounded flex items-center gap-2 text-lg font-semibold shadow hover:bg-blue-700 transition"
            onClick={() => navigate('/mybookings')}
          >
            <FaBook /> My Bookings
          </button>
          <button
            className="border border-gray-300 px-5 py-2 rounded flex items-center gap-2 text-lg font-semibold hover:bg-gray-100 transition"
            onClick={() => navigate('/')}
          >
            <FaHome /> Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default Gratitude;
