import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaCalendar, FaMapMarkerAlt, FaUsers } from "react-icons/fa";
import api from "../utils/api";
import { fallbackRoomImage, getSafeImageUrl } from "../utils/image";

const formatDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : "TBD";
};

const getBookingRoom = (booking) => {
  const room = booking?.room;
  return room && typeof room === "object" ? room : {};
};

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
        setError("");
        const res = await api.get(`/bookings/${id}`);
        setBooking(res.data.booking || res.data.data || null);
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
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="mb-3 text-2xl font-bold text-red-500">Booking Not Found</h2>
        <p className="mb-4 text-gray-600">{error}</p>
        <button
          onClick={() => navigate("/mybookings")}
          className="rounded-lg bg-blue-600 px-5 py-2 text-white transition hover:bg-blue-700"
        >
          Back to My Bookings
        </button>
      </div>
    );
  }

  if (!booking) return null;

  const room = getBookingRoom(booking);
  const title = room.title || booking.roomTitle || "Hotel Room";
  const subtitle = room.location || room.category || room.roomType || "Room details available";
  const imageUrl = room.imageUrls?.[0] || fallbackRoomImage;
  const guestName =
    [booking.guestDetails?.firstName, booking.guestDetails?.lastName].filter(Boolean).join(" ") || "Guest";

  return (
    <div className="flex justify-center px-4 py-10">
      <div className="w-full max-w-3xl">
        <h2 className="mb-6 text-center text-2xl font-bold">Booking Details</h2>

        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <img
            src={getSafeImageUrl(imageUrl, fallbackRoomImage)}
            alt={title}
            className="h-64 w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = fallbackRoomImage;
            }}
          />

          <div className="p-6">
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">{title}</h3>
                <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  <FaMapMarkerAlt className="text-blue-500" />
                  {subtitle}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 px-4 py-3 text-left md:text-right">
                <p className="text-xs uppercase tracking-wide text-blue-600">Total Amount</p>
                <p className="text-2xl font-bold text-blue-700">
                  Rs {Number(booking.totalAmount || 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="mb-3 text-sm font-semibold text-gray-900">Stay Summary</p>
                <div className="space-y-3 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <FaCalendar className="text-blue-500" />
                    {formatDate(booking.fromDate)} - {formatDate(booking.toDate)}
                  </p>
                  <p className="flex items-center gap-2">
                    <FaUsers className="text-blue-500" />
                    {booking.totalDays || 0} night(s)
                  </p>
                  <p>Booking ID: {booking._id}</p>
                  <p className="capitalize">Status: {booking.status || "pending"}</p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="mb-3 text-sm font-semibold text-gray-900">Payment</p>
                <div className="space-y-3 text-sm text-gray-600">
                  <p className="capitalize">Method: {booking.paymentMethod || "pending"}</p>
                  <p
                    className={`font-medium capitalize ${
                      booking.paymentStatus === "paid" ? "text-green-600" : "text-amber-600"
                    }`}
                  >
                    Payment Status: {booking.paymentStatus || "pending"}
                  </p>
                  <p>Subtotal: Rs {Number(booking.subtotal || 0).toLocaleString()}</p>
                  <p>Tax: Rs {Number(booking.taxAmount || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 md:col-span-2">
                <p className="mb-3 text-sm font-semibold text-gray-900">Guest Details</p>
                <div className="grid gap-3 text-sm text-gray-600 md:grid-cols-2">
                  <p>Name: {guestName}</p>
                  <p>Email: {booking.guestDetails?.email || "-"}</p>
                  <p>Phone: {booking.guestDetails?.phone || "-"}</p>
                  <p>Guests Count: {booking.guestDetails?.guests || booking.guestDetails?.adults || 1}</p>
                  <p className="md:col-span-2">
                    Special Requests: {booking.guestDetails?.specialRequests || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/mybookings")}
            className="rounded-lg bg-gray-700 px-6 py-2 text-white transition hover:bg-gray-800"
          >
            Back to My Bookings
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingDetails;
