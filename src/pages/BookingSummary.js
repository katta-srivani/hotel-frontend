// src/pages/BookingSummary.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { FaCalendar, FaMapMarkerAlt, FaUsers } from "react-icons/fa";

function BookingSummary() {
  const location = useLocation();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const bookingData = location.state;

  useEffect(() => {
    if (!bookingData) {
      setError("Booking data not found. Please start booking again.");
      setLoading(false);
      return;
    }

    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/bookings/${bookingData._id}`);
        setBooking(res.data.booking);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-3">
          Failed to Complete Booking
        </h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const checkInDate = new Date(booking.fromDate).toLocaleDateString();
  const checkOutDate = new Date(booking.toDate).toLocaleDateString();

  return (
    <div className="flex justify-center py-10 px-4">
      <div className="w-full max-w-xl">
        <h2 className="text-2xl font-bold mb-6 text-center">
          Booking Summary
        </h2>

        {/* Card */}
        <div className="bg-white shadow-lg rounded-2xl p-6">
          <h5 className="text-lg font-semibold mb-4">
            {booking.room.title}
          </h5>

          <div className="space-y-2 text-gray-600">
            <p className="flex items-center gap-2">
              <FaCalendar className="text-blue-500" />
              {checkInDate} - {checkOutDate}
            </p>

            <p className="flex items-center gap-2">
              <FaUsers className="text-blue-500" />
              {booking.totalDays} night(s)
            </p>

            <p className="flex items-center gap-2">
              <FaMapMarkerAlt className="text-blue-500" />
              {booking.room.roomType}
            </p>
          </div>

          <hr className="my-4" />

          <p className="font-bold text-lg">
            Total Amount: ₹{booking.totalAmount}
          </p>

          <p
            className={`mt-2 font-medium ${
              booking.paymentStatus === "paid"
                ? "text-green-600"
                : "text-red-500"
            }`}
          >
            Payment Status: {booking.paymentStatus || "pending"}
          </p>
        </div>

        {/* Actions */}
        {booking.paymentStatus !== "paid" && (
          <div className="text-center mt-6">
            <p className="text-yellow-500 mb-3">
              Your booking is not completed. Please complete payment.
            </p>
            <button
              onClick={() =>
                navigate("/payment", { state: { bookingId: booking._id } })
              }
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Complete Payment
            </button>
          </div>
        )}

        {booking.paymentStatus === "paid" && (
          <div className="text-center mt-6">
            <p className="text-green-600 mb-3 font-medium">
              Booking confirmed! 🎉
            </p>
            <button
              onClick={() => navigate("/my-bookings")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              View My Bookings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingSummary;