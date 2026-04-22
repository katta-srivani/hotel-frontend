// src/pages/MyBookings.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";
import { FaCalendar, FaMapMarkerAlt, FaTrash, FaCheckCircle } from "react-icons/fa";
import { fallbackRoomImage, getSafeImageUrl } from "../utils/image";

function MyBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchBookings = async () => {
    try {
      const res = await api.get("/bookings/my", { params: { includeAll: true } });
      setBookings(res.data.bookings || []);
    } catch (err) {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;

    try {
      const { data } = await api.delete(`/bookings/${id}`);
      toast.success("Booking cancelled");
      if (data?.notification) {
        window.dispatchEvent(
          new CustomEvent("app:notification-created", {
            detail: { notification: data.notification },
          })
        );
      }
      window.dispatchEvent(new Event("app:notifications-updated"));
      // Fetch latest bookings from backend for accuracy
      fetchBookings();
    } catch {
      toast.error("Error cancelling booking");
    }
  };

  const getFilteredBookings = () => {
    const today = new Date();

    if (filter === "all") return bookings;

    if (filter === "active")
      return bookings.filter(
        b =>
          b.paymentStatus === "paid" &&
          new Date(b.toDate) >= today &&
          b.status !== "cancelled"
      );

    if (filter === "completed")
      return bookings.filter(b => new Date(b.toDate) < today);

    return bookings;
  };

  const filteredBookings = getFilteredBookings();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2 tracking-tight">My Bookings</h1>
          <p className="text-lg text-gray-500">Manage your reservations</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {[
            {
              id: "all",
              label: "All",
              count: bookings.length,
            },
            {
              id: "active",
              label: "Active",
              count: bookings.filter(
                b =>
                  b.paymentStatus === "paid" &&
                  new Date(b.toDate) >= new Date() &&
                  b.status !== "cancelled"
              ).length,
            },
            {
              id: "completed",
              label: "Completed",
              count: bookings.filter(
                b => new Date(b.toDate) < new Date()
              ).length,
            },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-6 py-2 rounded-full text-base font-semibold shadow-sm border transition-all
                ${filter === tab.id
                  ? "bg-pink-600 text-white border-pink-600"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"}`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Empty */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
            No bookings found
          </div>
        ) : (

          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const today = new Date();
              const checkIn = new Date(booking.fromDate);
              const checkOut = new Date(booking.toDate);

              const isCompleted = checkOut < today;
              const isActive =
                booking.paymentStatus === "paid" &&
                today >= checkIn &&
                today <= checkOut &&
                booking.status !== "cancelled";

              const isUpcoming = today < checkIn && booking.status !== "cancelled";
              const paymentLabel =
                booking.status === "cancelled"
                  ? "cancelled"
                  : booking.paymentStatus || "pending";
              const paymentBadgeClass =
                paymentLabel === "paid"
                  ? "bg-green-500 text-white"
                  : paymentLabel === "cancelled"
                    ? "bg-red-500 text-white"
                    : "bg-yellow-400";

              return (
                <div
                  key={booking._id}
                  className="bg-white rounded-2xl shadow hover:shadow-lg transition p-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                    {/* LEFT */}
                    <div className="flex gap-4">
                      {booking.room?.imageUrls?.[0] && (
                        <img
                          src={getSafeImageUrl(booking.room.imageUrls[0], fallbackRoomImage)}
                          alt=""
                          className="w-24 h-24 object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.src = fallbackRoomImage;
                          }}
                        />
                      )}

                      <div>
                        <h3 className="font-semibold text-lg">
                          {booking.room?.title}
                        </h3>

                        <p className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <FaCalendar className="text-blue-500" />
                          {checkIn.toLocaleDateString()} - {checkOut.toLocaleDateString()}
                        </p>

                        <p className="flex items-center gap-2 text-sm text-gray-500">
                          <FaMapMarkerAlt className="text-blue-500" />
                          {booking.room?.category || booking.room?.roomType || "Hotel Room"}
                        </p>

                        {/* Status */}
                        <div className="flex gap-2 mt-2">
                          <span className={`px-3 py-1 text-xs rounded-full font-medium
                            ${booking.status === "cancelled"
                              ? "bg-red-500 text-white"
                              : isCompleted ? "bg-gray-300"
                              : isActive ? "bg-green-500 text-white"
                              : isUpcoming ? "bg-blue-500 text-white"
                              : "bg-yellow-400"}`}>
                            {booking.status === "cancelled"
                              ? "Cancelled"
                              : isCompleted ? "Completed"
                              : isActive ? "Booked"
                              : isUpcoming ? "Upcoming"
                              : "Pending"}
                          </span>

                          <span className={`px-3 py-1 text-xs rounded-full font-medium
                            ${paymentBadgeClass}`}>
                            {paymentLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT */}
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-xl font-bold text-blue-600">
                        ₹{booking.totalAmount}
                      </p>

                      <div className="mt-2">
                        {(isActive || isUpcoming) && (
                          <button
                            onClick={() => handleCancel(booking._id)}
                            className="text-red-500 text-sm flex items-center gap-1 hover:underline"
                          >
                            <FaTrash /> Cancel
                          </button>
                        )}

                        {isCompleted && (
                          <p className="text-green-600 text-sm flex items-center gap-1">
                            <FaCheckCircle /> Completed
                          </p>
                        )}

                        {booking.status === "cancelled" && (
                          <p className="text-red-500 text-sm">
                            Cancelled
                          </p>
                        )}


                        {/* View Details button for all bookings */}
                        <button
                          className="text-xs text-blue-600 underline block mt-1"
                          onClick={() => navigate(`/booking/${booking._id}`)}
                          title="View booking details"
                        >
                          View Details
                        </button>

                        {/* Direct link to review the room */}
                        {isCompleted && booking.room?._id && (
                          <a
                            href={`/rooms/${booking.room._id}#reviews`}
                            className="text-blue-500 text-xs underline block mt-1"
                            title="Leave a review"
                          >
                            Review this room
                          </a>
                        )}

                        {/* Add to calendar integration (ICS download) */}
                        <button
                          className="text-xs text-gray-500 underline mt-1"
                          onClick={() => {
                            const ics = [
                              'BEGIN:VCALENDAR',
                              'VERSION:2.0',
                              'BEGIN:VEVENT',
                              `SUMMARY=Hotel Booking: ${booking.room?.title}`,
                              `DTSTART;VALUE=DATE:${booking.fromDate.replace(/-/g, '')}`,
                              `DTEND;VALUE=DATE:${booking.toDate.replace(/-/g, '')}`,
                              `DESCRIPTION=Hotel stay at ${booking.room?.title}`,
                              'END:VEVENT',
                              'END:VCALENDAR'
                            ].join('\r\n');
                            const blob = new Blob([ics], { type: 'text/calendar' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `booking-${booking._id}.ics`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }}
                        >
                          Add to Calendar
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

        )}
      </div>
    </div>
  );
}

export default MyBookings;
