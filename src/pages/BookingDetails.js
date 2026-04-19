import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { FaCalendar, FaMapMarkerAlt, FaUsers } from "react-icons/fa";

function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/bookings/${id}`);
        setBooking(res.data.booking);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

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
        <h2 className="text-2xl font-bold text-red-500 mb-3">Booking Not Found</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => navigate("/mybookings")}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Back to My Bookings
        </button>
      </div>
    );
  }

  if (!booking) return null;

  const checkInDate = new Date(booking.fromDate).toLocaleDateString();
  const checkOutDate = new Date(booking.toDate).toLocaleDateString();

  return (
    <div className="flex justify-center py-10 px-4">
      <div className="w-full max-w-xl">
        <h2 className="text-2xl font-bold mb-6 text-center">Booking Details</h2>
        <div className="bg-white shadow-lg rounded-2xl p-6">
          <h5 className="text-lg font-semibold mb-4">{booking.room?.title}</h5>
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
              {booking.room?.roomType}
            </p>
            <p className="text-sm">Guests: {booking.guestDetails?.firstName} {booking.guestDetails?.lastName} ({booking.guestDetails?.email}, {booking.guestDetails?.phone})</p>
            <p className="text-sm">Special Requests: {booking.guestDetails?.specialRequests || "-"}</p>
          </div>
          <hr className="my-4" />
          <p className="font-bold text-lg">Total Amount: ₹{booking.totalAmount}</p>
          <p className={`mt-2 font-medium ${booking.paymentStatus === "paid" ? "text-green-600" : "text-red-500"}`}>
            Payment Status: {booking.paymentStatus || "pending"}
          </p>
        </div>
        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/mybookings")}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Back to My Bookings
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingDetails;
