import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaCalendar, FaMapMarkerAlt, FaTrash, FaCheckCircle } from "react-icons/fa";
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

const getBookingTitle = (booking) => {
  const room = getBookingRoom(booking);
  return room.title || booking?.roomTitle || "Hotel Room";
};

const getBookingSubtitle = (booking) => {
  const room = getBookingRoom(booking);
  return room.location || room.category || room.roomType || "Room details available";
};

const getBookingImage = (booking) => {
  const room = getBookingRoom(booking);
  return room.imageUrls?.[0] || fallbackRoomImage;
};

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
      fetchBookings();
    } catch {
      toast.error("Error cancelling booking");
    }
  };

  const getFilteredBookings = () => {
    const today = new Date();

    if (filter === "all") return bookings;

    if (filter === "active") {
      return bookings.filter(
        (booking) =>
          ["paid", "pending"].includes(booking.paymentStatus) &&
          new Date(booking.toDate) >= today &&
          booking.status !== "cancelled"
      );
    }

    if (filter === "completed") {
      return bookings.filter((booking) => new Date(booking.toDate) < today);
    }

    return bookings;
  };

  const filteredBookings = getFilteredBookings();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <h1 className="mb-2 text-4xl font-extrabold tracking-tight text-gray-800">My Bookings</h1>
          <p className="text-lg text-gray-500">Manage your reservations</p>
        </div>

        <div className="mb-10 flex flex-wrap justify-center gap-3">
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
                (booking) =>
                  ["paid", "pending"].includes(booking.paymentStatus) &&
                  new Date(booking.toDate) >= new Date() &&
                  booking.status !== "cancelled"
              ).length,
            },
            {
              id: "completed",
              label: "Completed",
              count: bookings.filter((booking) => new Date(booking.toDate) < new Date()).length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`rounded-full border px-6 py-2 text-base font-semibold shadow-sm transition-all ${
                filter === tab.id
                  ? "border-pink-600 bg-pink-600 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {filteredBookings.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-center text-gray-500 shadow">No bookings found</div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => {
              const today = new Date();
              const checkIn = new Date(booking.fromDate);
              const checkOut = new Date(booking.toDate);
              const room = getBookingRoom(booking);
              const bookingTitle = getBookingTitle(booking);
              const bookingSubtitle = getBookingSubtitle(booking);
              const bookingImage = getBookingImage(booking);

              const isCompleted = checkOut < today;
              const isActive =
                ["paid", "pending"].includes(booking.paymentStatus) &&
                today >= checkIn &&
                today <= checkOut &&
                booking.status !== "cancelled";
              const isUpcoming = today < checkIn && booking.status !== "cancelled";

              const paymentLabel =
                booking.status === "cancelled" ? "cancelled" : booking.paymentStatus || "pending";
              const paymentBadgeClass =
                paymentLabel === "paid"
                  ? "bg-green-500 text-white"
                  : paymentLabel === "cancelled"
                    ? "bg-red-500 text-white"
                    : "bg-yellow-400 text-gray-900";

              return (
                <div
                  key={booking._id}
                  className="rounded-2xl bg-white p-4 shadow transition hover:shadow-lg"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div className="flex gap-4">
                      <img
                        src={getSafeImageUrl(bookingImage, fallbackRoomImage)}
                        alt={bookingTitle}
                        className="h-24 w-24 rounded-lg object-cover"
                        onError={(e) => {
                          e.currentTarget.src = fallbackRoomImage;
                        }}
                      />

                      <div>
                        <h3 className="text-lg font-semibold">{bookingTitle}</h3>

                        <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                          <FaCalendar className="text-blue-500" />
                          {formatDate(booking.fromDate)} - {formatDate(booking.toDate)}
                        </p>

                        <p className="flex items-center gap-2 text-sm text-gray-500">
                          <FaMapMarkerAlt className="text-blue-500" />
                          {bookingSubtitle}
                        </p>

                        <div className="mt-2 flex gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              booking.status === "cancelled"
                                ? "bg-red-500 text-white"
                                : isCompleted
                                  ? "bg-gray-300 text-gray-900"
                                  : isActive
                                    ? "bg-green-500 text-white"
                                    : isUpcoming
                                      ? "bg-blue-500 text-white"
                                      : "bg-yellow-400 text-gray-900"
                            }`}
                          >
                            {booking.status === "cancelled"
                              ? "Cancelled"
                              : isCompleted
                                ? "Completed"
                                : isActive
                                  ? "Booked"
                                  : isUpcoming
                                    ? "Upcoming"
                                    : "Pending"}
                          </span>

                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${paymentBadgeClass}`}>
                            {paymentLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-xl font-bold text-blue-600">
                        Rs {Number(booking.totalAmount || 0).toLocaleString()}
                      </p>

                      <div className="mt-2">
                        {(isActive || isUpcoming) && (
                          <button
                            onClick={() => handleCancel(booking._id)}
                            className="flex items-center gap-1 text-sm text-red-500 hover:underline"
                          >
                            <FaTrash /> Cancel
                          </button>
                        )}

                        {isCompleted && (
                          <p className="flex items-center gap-1 text-sm text-green-600">
                            <FaCheckCircle /> Completed
                          </p>
                        )}

                        {booking.status === "cancelled" && <p className="text-sm text-red-500">Cancelled</p>}

                        <button
                          className="mt-1 block text-xs text-blue-600 underline"
                          onClick={() => navigate(`/booking/${booking._id}`)}
                          title="View booking details"
                        >
                          View Details
                        </button>

                        {isCompleted && room?._id && (
                          <a
                            href={`/rooms/${room._id}#reviews`}
                            className="mt-1 block text-xs text-blue-500 underline"
                            title="Leave a review"
                          >
                            Review this room
                          </a>
                        )}

                        <button
                          className="mt-1 text-xs text-gray-500 underline"
                          onClick={() => {
                            const startDate = String(booking.fromDate || "").slice(0, 10).replace(/-/g, "");
                            const endDate = String(booking.toDate || "").slice(0, 10).replace(/-/g, "");
                            const ics = [
                              "BEGIN:VCALENDAR",
                              "VERSION:2.0",
                              "BEGIN:VEVENT",
                              `SUMMARY=Hotel Booking: ${bookingTitle}`,
                              `DTSTART;VALUE=DATE:${startDate}`,
                              `DTEND;VALUE=DATE:${endDate}`,
                              `DESCRIPTION=Hotel stay at ${bookingTitle}`,
                              "END:VEVENT",
                              "END:VCALENDAR",
                            ].join("\r\n");

                            const blob = new Blob([ics], { type: "text/calendar" });
                            const url = URL.createObjectURL(blob);
                            const anchor = document.createElement("a");
                            anchor.href = url;
                            anchor.download = `booking-${booking._id}.ics`;
                            document.body.appendChild(anchor);
                            anchor.click();
                            document.body.removeChild(anchor);
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
