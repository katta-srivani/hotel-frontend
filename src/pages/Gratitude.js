import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaHome, FaBook } from 'react-icons/fa';
import api from '../utils/api';

function Gratitude() {
  const location = useLocation();
  const navigate = useNavigate();
  const title = location.state?.title || 'Booking Confirmed';
  const message =
    location.state?.message || 'Your booking for the selected room has been confirmed.';
  const bookingId = location.state?.bookingId || '';
  const notification = location.state?.notification || null;

  useEffect(() => {
    if (!notification) {
      window.dispatchEvent(new Event('app:notifications-updated'));
      return;
    }

    window.dispatchEvent(
      new CustomEvent('app:notification-created', {
        detail: { notification },
      })
    );
    window.dispatchEvent(new Event('app:notifications-updated'));

    api.get('/notifications').catch(() => {});
  }, [notification]);

  return (
    <div className="max-w-xl mx-auto bg-white shadow-lg rounded-2xl p-8 mt-10 text-center relative overflow-hidden">
      <div className="flex flex-col items-center">
        <FaCheckCircle className="text-green-500 text-6xl mb-2 animate-bounce" />
        <h2 className="text-3xl font-extrabold mb-2 text-green-700">{title}</h2>
        <p className="text-gray-700 mb-4 text-lg">{message}</p>
        <div className="flex gap-3 justify-center mt-6">
          {bookingId && (
            <button
              className="bg-slate-900 text-white px-5 py-2 rounded flex items-center gap-2 text-lg font-semibold shadow hover:bg-slate-800 transition"
              onClick={() => navigate(`/billing?id=${bookingId}`)}
            >
              <FaBook /> View PDF Invoice
            </button>
          )}
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
