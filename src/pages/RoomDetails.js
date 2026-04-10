import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";


function getDatesInRange(start, end) {
  const arr = [];
  let dt = new Date(start);
  while (dt <= end) {
    arr.push(new Date(dt));
    dt.setDate(dt.getDate() + 1);
  }
  return arr;
}

function RoomDetails() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  // Review state
  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewError, setReviewError] = useState(null);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [refreshReviews, setRefreshReviews] = useState(false);

  // Fetch reviews for this room
  useEffect(() => {
    setReviewLoading(true);
    setReviewError(null);
    api
      .get(`/reviews/${id}`)
      .then((res) => {
        setReviews(res.data.reviews || []);
      })
      .catch(() => {
        setReviewError("Failed to load reviews");
      })
      .finally(() => setReviewLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, refreshReviews]);

  // Submit a new review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await api.post("/reviews", {
        roomId: id,
        rating: newRating,
        comment: newComment,
      });
      toast.success(res?.data?.message || "Review submitted!");
      setNewRating(5);
      setNewComment("");
      setRefreshReviews((v) => !v);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to submit review"
      );
      // Log backend error details for debugging
      console.error("Review submit error:", err?.response?.data || err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showBookingForm, setShowBookingForm] = useState(false);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guests, setGuests] = useState(1);

  const [isBooked, setIsBooked] = useState(false);
  const [myBookingId, setMyBookingId] = useState(null);
  const [pendingBookingId, setPendingBookingId] = useState(null);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // 📦 Fetch room
  const fetchRoom = async () => {
    try {
      const res = await api.get(`/rooms/${id}`);
      setRoom(res.data.data || res.data);
    } catch (err) {
      toast.error("Failed to load room");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 📦 Fetch booking
  const fetchMyBooking = async () => {
    try {
      const res = await api.get("/bookings/my");
      const booking = res.data.bookings.find(
        (b) =>
          b.room._id === id &&
          b.status !== "cancelled" &&
          ["pending", "approved"].includes(b.status)
      );
      if (booking) {
        setIsBooked(true);
        setCurrentBooking(booking);
        if (booking.paymentStatus === "pending") {
          setPendingBookingId(booking._id);
        } else {
          setMyBookingId(booking._id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    if (user && id) fetchMyBooking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  // ⏳ Countdown timer only for pending online payment
  useEffect(() => {
    if (!currentBooking?.expiresAt || currentBooking?.paymentMethod === "cash")
      return; // ✅ skip COD

    const interval = setInterval(() => {
      const diff = new Date(currentBooking.expiresAt) - new Date();

      if (diff <= 0) {
        setTimeLeft("Expired");
        clearInterval(interval);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentBooking]);

  // ❌ Cancel Booking
  const handleCancelBooking = async () => {
    if (!myBookingId && !pendingBookingId) return;

    const confirmCancel = window.confirm(
      "Cancel booking?\n\n✔ Free cancellation before 24 hrs\n❌ Otherwise 20% charges"
    );

    if (!confirmCancel) return;

    setCancelLoading(true);
    try {
      const idToCancel = myBookingId || pendingBookingId;
      const res = await api.delete(`/bookings/${idToCancel}`);
      const refund = res.data?.refundAmount || 0;

      toast.success(
        refund > 0
          ? `Cancelled! Refund: ₹${refund}`
          : "Booking cancelled successfully"
      );

      setIsBooked(false);
      setMyBookingId(null);
      setPendingBookingId(null);
      setCurrentBooking(null);

      fetchMyBooking();
    } catch (err) {
      console.error(err);
      toast.error("Cancel failed");
    } finally {
      setCancelLoading(false);
    }
  };

  // ✅ Handle COD booking directly
  const handleCODBooking = async () => {
    if (!checkInDate || !checkOutDate) {
      toast.error("Select check-in and check-out dates");
      return;
    }
    try {
      const res = await api.post("/bookings/verify", {
        bookingData: {
          roomId: room._id,
          fromDate: checkInDate,
          toDate: checkOutDate,
          totalDays:
            (new Date(checkOutDate) - new Date(checkInDate)) /
            (1000 * 60 * 60 * 24),
          totalAmount: room.pricePerNight, // simple calculation
        },
        paymentMethod: "cash",
      });

      toast.success("Booking confirmed via COD!");
      setIsBooked(true);
      setCurrentBooking(res.data.booking);
      setMyBookingId(res.data.booking._id);
      setShowBookingForm(false);
    } catch (err) {
      console.error(err);
      toast.error("Booking failed");
    }
  };

  // Booked date ranges for disabling in date picker
  const [bookedRanges, setBookedRanges] = useState([]);

  // Fetch all approved bookings for this room
  useEffect(() => {
    if (!id) return;
    api.get(`/bookings/room/${id}`)
      .then(res => {
        setBookedRanges(res.data.bookings || []);
      })
      .catch(() => {
        setBookedRanges([]);
      });
  }, [id]);

  // Compute all booked dates for disabling in the date picker


  if (loading) return <p className="p-5">Loading...</p>;
  if (!room) return <p className="p-5">Room not found</p>;

  const amenityIcons = {
    wifi: "WiFi",
    parking: "Parking",
    breakfast: "Breakfast",
    pool: "Pool",
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
            {/* REVIEWS SECTION */}
            <div className="mb-8">
              <h2 className="font-semibold text-lg mb-2">Reviews</h2>
              {reviewLoading ? (
                <p>Loading reviews...</p>
              ) : reviewError ? (
                <p className="text-red-500">{reviewError}</p>
              ) : reviews.length === 0 ? (
                <p>No reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r._id} className="bg-gray-50 p-3 rounded shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">
                          {r.user?.name || "Anonymous"}
                        </span>
                        <span className="text-yellow-500 text-sm">
                          {"★".repeat(r.rating)}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-gray-700 text-sm">{r.comment}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ADD REVIEW FORM (only for logged-in users who booked) */}
            {isBooked && user && (
              <div className="mb-8">
                <h3 className="font-semibold mb-2">Add Your Review</h3>
                <form
                  className="flex flex-col gap-2 max-w-md"
                  onSubmit={handleSubmitReview}
                >
                  <label className="flex items-center gap-2">
                    <span>Rating:</span>
                    <select
                      value={newRating}
                      onChange={(e) => setNewRating(Number(e.target.value))}
                      className="border rounded px-2 py-1"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} Star{n > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <textarea
                    className="border rounded px-3 py-2"
                    rows={3}
                    placeholder="Write your review..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg mt-1 disabled:opacity-50"
                    disabled={submittingReview}
                  >
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </form>
              </div>
            )}
      {/* IMAGE GALLERY */}
      {room.imageUrls?.length > 0 && (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {room.imageUrls.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={room.title ? `${room.title} image ${idx + 1}` : `Room image ${idx + 1}`}
              className="rounded-lg w-full h-64 object-cover shadow"
            />
          ))}
        </div>
      )}

      {/* ROOM INFO */}
      <h1 className="text-3xl font-bold mb-2">{room.title}</h1>
      <p className="text-gray-600 mb-4">{room.description}</p>
      <div className="flex flex-wrap gap-4 mb-4 text-gray-700">
        <span className="bg-blue-50 px-3 py-1 rounded-full text-sm">
          ₹{room.pricePerNight} / night
        </span>
        {room.size && (
          <span className="bg-blue-50 px-3 py-1 rounded-full text-sm">
            Size: {room.size}
          </span>
        )}
        {room.bedType && (
          <span className="bg-blue-50 px-3 py-1 rounded-full text-sm">
            Bed: {room.bedType}
          </span>
        )}
        {room.view && (
          <span className="bg-blue-50 px-3 py-1 rounded-full text-sm">
            View: {room.view}
          </span>
        )}
        <span className="bg-blue-50 px-3 py-1 rounded-full text-sm">
          Max Guests: {room.maxGuests}
        </span>
      </div>

      {/* AMENITIES */}
      <div className="mb-6">
        <h2 className="font-semibold mb-2">Amenities</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(room.amenities || {}).map(
            ([key, value]) =>
              value && (
                <span
                  key={key}
                  className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs"
                >
                  {amenityIcons[key] || key}
                </span>
              )
          )}
        </div>
      </div>

      {/* BOOKING STATUS */}
      {isBooked && (
        <div className="mb-3">
          <span
            className={`px-4 py-2 rounded ${
              currentBooking?.status === "pending"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {currentBooking?.status === "pending"
              ? "Pending Payment"
              : "Booking Confirmed"}
          </span>
        </div>
      )}

      {/* ⏳ TIMER */}
      {pendingBookingId && timeLeft && (
        <p className="text-red-500 mt-2">⏳ Complete payment in: {timeLeft}</p>
      )}

      {/* 💳 RETRY PAYMENT */}
      {pendingBookingId && currentBooking?.paymentMethod !== "cash" && (
        <button
          className="bg-yellow-500 text-white px-5 py-2 rounded-lg mt-3"
          onClick={() =>
            (window.location.href = `/checkout?bookingId=${pendingBookingId}`)
          }
        >
          Complete Payment
        </button>
      )}

      {/* ❌ CANCEL BUTTON */}
      {(myBookingId || pendingBookingId) && (
        <div className="mt-3">
          <button
            className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
            onClick={handleCancelBooking}
            disabled={cancelLoading}
          >
            {cancelLoading ? "Cancelling..." : "Cancel Booking"}
          </button>
          <p className="text-xs text-gray-500 mt-1">
            Free cancellation before 24 hrs. After that, 20% charges apply.
          </p>
        </div>
      )}

      {/* BOOK BUTTON & FORM */}
      {!isBooked && (
        <>
          {!showBookingForm ? (
            <button
              className="mt-5 bg-blue-600 text-white px-6 py-2 rounded-lg"
              onClick={() => setShowBookingForm(true)}
            >
              Book Now
            </button>
          ) : (
            <form
              className="mt-5 bg-blue-50 p-4 rounded-lg flex flex-col gap-3 max-w-md"
              onSubmit={(e) => e.preventDefault()} // prevent default
            >
              <label className="flex flex-col gap-1">
                <span className="font-medium">Check-in Date</span>
                <input
                  type="date"
                  className="border rounded px-3 py-2"
                  min={new Date().toISOString().slice(0, 10)}
                  value={checkInDate}
                  onChange={e => setCheckInDate(e.target.value)}
                  required
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-medium">Check-out Date</span>
                <input
                  type="date"
                  className="border rounded px-3 py-2"
                  min={checkInDate || new Date().toISOString().slice(0, 10)}
                  value={checkOutDate}
                  onChange={e => setCheckOutDate(e.target.value)}
                  required
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-medium">Guests</span>
                <input
                  type="number"
                  className="border rounded px-3 py-2 w-24"
                  min={1}
                  max={room.maxGuests}
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  required
                />
              </label>

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  className="bg-green-600 text-white px-6 py-2 rounded-lg flex-1"
                  onClick={handleCODBooking} // ✅ direct COD booking
                >
                  Confirm Booking (COD)
                </button>
                <button
                  type="button"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg flex-1"
                  onClick={() => {
                    // Save booking and redirect to checkout
                    const bookingData = {
                      roomId: room._id,
                      checkInDate,
                      checkOutDate,
                      numberOfGuests: guests,
                      // Pre-fill empty guest details for Checkout.js
                      firstName: '',
                      lastName: '',
                      email: '',
                      phone: '',
                      address: '',
                      specialRequests: ''
                    };
                    sessionStorage.setItem(
                      "bookingData",
                      JSON.stringify(bookingData)
                    );
                    window.location.href = "/checkout";
                  }}
                >
                  Pay Online
                </button>
                <button
                  type="button"
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg flex-1"
                  onClick={() => setShowBookingForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}

export default RoomDetails;