import React, { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import { FaStar, FaRegStar } from "react-icons/fa";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Helper to get all dates between two dates (inclusive)
function getDatesBetween(start, end) {
  const arr = [];
  let dt = new Date(start);
  while (dt <= new Date(end)) {
    arr.push(dt.toISOString().slice(0, 10));
    dt.setDate(dt.getDate() + 1);
  }
  return arr;
}

function toLocalDate(value) {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDateValue(date) {
  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function RoomDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  // Wishlist toggle handler
  const handleToggleWishlist = async () => {
    if (!user) return toast.error("Login first");
    try {
      if (isWishlisted) {
        await api.delete(`/favorites/${room._id}`, { params: { type: "wishlist" } });
        setIsWishlisted(false);
        toast.success("Removed from wishlist");
      } else {
        await api.post("/favorites", { roomId: room._id, type: "wishlist" });
        setIsWishlisted(true);
        toast.success("Added to wishlist");
      }
    } catch (err) {
      toast.error("Failed to update wishlist");
    }
  };
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  // const [codLoading, setCodLoading] = useState(false); // Removed COD
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guests, setGuests] = useState(1);
  const [unavailableDates, setUnavailableDates] = useState([]);
  // Duplicate booking state declarations removed
  const [timeLeft, setTimeLeft] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [guestInfo, setGuestInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    specialRequests: ''
  });
  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewError, setReviewError] = useState(null);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [refreshReviews, setRefreshReviews] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const unavailableDateSet = useMemo(
    () => new Set(unavailableDates),
    [unavailableDates]
  );

  // Submit a new review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }
    setSubmittingReview(true);
    try {
      let res;
      if (userReview) {
        res = await api.put(`/reviews/${userReview._id}`, {
          roomId: id,
          rating: newRating,
          comment: newComment,
        });
        toast.success(res?.data?.message || "Review updated!");
      } else {
        res = await api.post("/reviews", {
          roomId: id,
          rating: newRating,
          comment: newComment,
        });
        toast.success(res?.data?.message || "Review submitted!");
      }
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

  
  useEffect(() => {
    async function fetchUnavailable() {
      try {
        const res = await api.get(`/bookings/room/${id}`);
        // Assume backend returns array of bookings with fromDate, toDate
        const bookings = res.data.bookings || [];
        let dates = [];
        bookings.forEach(b => {
          if (b.status !== "cancelled") {
            dates = dates.concat(getDatesBetween(b.fromDate, b.toDate));
          }
        });
        // Only keep today and future dates
        const today = new Date().toISOString().slice(0, 10);
        const filtered = dates.filter(date => date >= today);
        setUnavailableDates(filtered);
      } catch {
        setUnavailableDates([]);
      }
    }
    fetchUnavailable();
  }, [id]);

  const [isBooked, setIsBooked] = useState(false);
  const [myBookingId, setMyBookingId] = useState(null);
  const [pendingBookingId, setPendingBookingId] = useState(null);
  const [currentBooking, setCurrentBooking] = useState(null);
  const saveBookingAndGoToCheckout = (preferredPayment) => {
    const bookingData = {
      roomId: room._id,
      checkInDate,
      checkOutDate,
      numberOfGuests: guests,
      firstName: guestInfo.firstName,
      lastName: guestInfo.lastName,
      email: guestInfo.email,
      phone: guestInfo.phone,
      address: guestInfo.address,
      specialRequests: guestInfo.specialRequests,
      preferredPayment,
    };

    sessionStorage.setItem("bookingData", JSON.stringify(bookingData));
    navigate('/checkout');
  };

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

  // Fetch reviews
  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await api.get(`/reviews/${id}`);
        setReviews(res.data.reviews || []);
        if (user) {
          const userRev = res.data.reviews.find(r => r.user._id === user._id);
          setUserReview(userRev || null);
          if (userRev) {
            setNewRating(userRev.rating || 5);
            setNewComment(userRev.comment || "");
          }
        }
      } catch (err) {
        setReviewError("Failed to load reviews");
      } finally {
        setReviewLoading(false);
      }
    }
    if (id) fetchReviews();
  }, [id, user, refreshReviews]);

  // Fetch wishlist status
  useEffect(() => {
    async function fetchWishlist() {
      if (!user) return;
      try {
        const res = await api.get('/favorites', { params: { type: 'wishlist' } });
        const isWish = res.data.favorites.some(f => f.room._id === id);
        setIsWishlisted(isWish);
      } catch (err) {
        // ignore
      }
    }
    fetchWishlist();
  }, [user, id]);

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

  // ...existing code...

  // Booked date ranges for disabling in date picker



  if (loading) return <div className="flex justify-center items-center min-h-[40vh]"><span className="text-lg text-gray-500">Loading...</span></div>;
  if (!room) return <div className="flex justify-center items-center min-h-[40vh]"><span className="text-lg text-red-400">Room not found</span></div>;

  const amenityIcons = {
    wifi: "WiFi",
    parking: "Parking",
    breakfast: "Breakfast",
    pool: "Pool",
  };
  const checkInDateValue = checkInDate ? toLocalDate(checkInDate) : null;
  const checkOutDateValue = checkOutDate ? toLocalDate(checkOutDate) : null;
  const canSelectCheckInDate = (date) => {
    const today = toLocalDate(new Date());
    const formatted = formatDateValue(date);
    return date >= today && !unavailableDateSet.has(formatted);
  };
  const canSelectCheckOutDate = (date) => {
    if (!checkInDateValue) {
      return false;
    }

    if (date <= checkInDateValue) {
      return false;
    }

    let cursor = new Date(checkInDateValue);
    cursor.setDate(cursor.getDate() + 1);

    while (cursor <= date) {
      if (unavailableDateSet.has(formatDateValue(cursor))) {
        return false;
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    return true;
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
            {/* REVIEWS SECTION */}
            <div className="mb-8">
              <h2 className="font-bold text-xl mb-4">Reviews</h2>
              {reviewLoading ? (
                <p>Loading reviews...</p>
              ) : reviewError ? (
                <p className="text-red-500">{reviewError}</p>
              ) : reviews.length === 0 ? (
                <p className="text-gray-400">No reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r._id} className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex gap-4 items-start">
                      {/* Avatar Initial */}
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-700 text-lg">
                        {((r.user?.firstName || r.user?.name || "A").charAt(0)).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            {[r.user?.firstName, r.user?.lastName].filter(Boolean).join(" ") || r.user?.name || "Anonymous"}
                          </span>
                          <span className="flex items-center text-rose-500 text-sm">
                            {Array.from({ length: r.rating }).map((_, i) => (
                              <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><polygon points="10,1 12.59,7.36 19.51,7.64 14,12.14 15.82,18.99 10,15.27 4.18,18.99 6,12.14 0.49,7.64 7.41,7.36"/></svg>
                            ))}
                          </span>
                          <span className="text-xs text-gray-400 ml-2">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-gray-700 text-sm leading-relaxed">{r.comment}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ADD/UPDATE REVIEW FORM (all logged-in users, only once, can update) */}
            {user && (
              <div className="mb-8">
                <h3 className="font-semibold mb-3 text-lg">{userReview ? "Update Your Review" : "Add Your Review"}</h3>
                <form
                  className="flex flex-col gap-3 max-w-md bg-white border border-gray-100 rounded-xl shadow-sm p-5"
                  onSubmit={handleSubmitReview}
                >
                  <label className="flex items-center gap-2 font-medium text-gray-700">
                    <span>Rating:</span>
                    <select
                      value={newRating}
                      onChange={(e) => setNewRating(Number(e.target.value))}
                      className="border rounded px-2 py-1 focus:ring-rose-500 focus:border-rose-500"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} Star{n > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <textarea
                    className="border rounded px-3 py-2 focus:ring-rose-500 focus:border-rose-500"
                    rows={3}
                    placeholder="Write your review..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2 rounded-lg mt-1 font-semibold transition disabled:opacity-50"
                    disabled={submittingReview}
                  >
                    {submittingReview ? (userReview ? "Updating..." : "Submitting...") : (userReview ? "Update Review" : "Submit Review")}
                  </button>
                </form>
              </div>
            )}
      {/* IMAGE GALLERY */}
      {room.imageUrls?.length > 0 && (
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {room.imageUrls.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={room.title ? `${room.title} image ${idx + 1}` : `Room image ${idx + 1}`}
              className="rounded-2xl w-full h-64 object-cover shadow-lg border border-gray-100"
            />
          ))}
        </div>
      )}

      {/* ROOM INFO + WISHLIST BUTTON */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2 text-gray-900 tracking-tight">{room.title}</h1>
          <p className="text-gray-600 mb-4 text-lg">{room.description}</p>
          <div className="flex flex-wrap gap-3 mb-2">
            <span className="bg-rose-50 text-rose-600 px-4 py-1 rounded-full text-base font-semibold shadow-sm border border-rose-100">
              ₹{room.pricePerNight} <span className="text-xs font-normal">/ night</span>
            </span>
            {room.size && (
              <span className="bg-blue-50 px-3 py-1 rounded-full text-sm border border-blue-100">Size: {room.size}</span>
            )}
            {room.bedType && (
              <span className="bg-blue-50 px-3 py-1 rounded-full text-sm border border-blue-100">Bed: {room.bedType}</span>
            )}
            {room.view && (
              <span className="bg-blue-50 px-3 py-1 rounded-full text-sm border border-blue-100">View: {room.view}</span>
            )}
            <span className="bg-blue-50 px-3 py-1 rounded-full text-sm border border-blue-100">Max Guests: {room.maxGuests}</span>
          </div>
        </div>
        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          className="ml-4 flex items-center gap-2 px-4 py-2 rounded-xl border border-yellow-300 bg-yellow-50 text-yellow-700 font-semibold shadow hover:bg-yellow-100 transition"
          title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          {isWishlisted ? <FaStar className="text-yellow-400" /> : <FaRegStar className="text-gray-300" />}
          {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
        </button>
      </div>

      {/* AMENITIES */}
      <div className="mb-8">
        <h2 className="font-semibold mb-2 text-lg text-gray-900">Amenities</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(room.amenities || {}).filter(([, value]) => value).length === 0 && (
            <span className="text-gray-400 text-sm">No amenities listed.</span>
          )}
          {Object.entries(room.amenities || {}).map(
            ([key, value]) =>
              value && (
                <span
                  key={key}
                  className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs border border-green-100 shadow-sm"
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
          {/* Room Availability Calendar */}
          <div className="mb-4">
            <h3 className="font-semibold text-base mb-2">Unavailable Dates</h3>
            {unavailableDates.length === 0 ? (
              <span className="text-gray-400 text-sm">All dates available!</span>
            ) : (
              <div className="flex flex-wrap gap-2">
                {unavailableDates.map(date => (
                  <span key={date} className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs border border-red-200">{date}</span>
                ))}
              </div>
            )}
          </div>
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
                <DatePicker
                  selected={checkInDateValue}
                  onChange={(date) => {
                    const selected = formatDateValue(date);
                    setCheckInDate(selected);
                    if (checkOutDate && selected && checkOutDate <= selected) {
                      setCheckOutDate("");
                    }
                  }}
                  minDate={new Date()}
                  filterDate={canSelectCheckInDate}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select check-in date"
                  className="border rounded px-3 py-2 w-full"
                  required
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-medium">Check-out Date</span>
                <DatePicker
                  selected={checkOutDateValue}
                  onChange={(date) => {
                    setCheckOutDate(formatDateValue(date));
                  }}
                  minDate={checkInDateValue ? new Date(checkInDateValue.getTime() + 86400000) : new Date()}
                  filterDate={canSelectCheckOutDate}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select check-out date"
                  className="border rounded px-3 py-2 w-full"
                  required
                  disabled={!checkInDateValue}
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
              {/* Guest Info Fields */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="First Name *"
                  value={guestInfo.firstName}
                  onChange={e => setGuestInfo(g => ({ ...g, firstName: e.target.value }))}
                  className="border rounded px-3 py-2"
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name *"
                  value={guestInfo.lastName}
                  onChange={e => setGuestInfo(g => ({ ...g, lastName: e.target.value }))}
                  className="border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="email"
                  placeholder="Email *"
                  value={guestInfo.email}
                  onChange={e => setGuestInfo(g => ({ ...g, email: e.target.value }))}
                  className="border rounded px-3 py-2"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone *"
                  value={guestInfo.phone}
                  onChange={e => setGuestInfo(g => ({ ...g, phone: e.target.value }))}
                  className="border rounded px-3 py-2"
                  required
                />
              </div>
              <input
                type="text"
                placeholder="Address (optional)"
                value={guestInfo.address}
                onChange={e => setGuestInfo(g => ({ ...g, address: e.target.value }))}
                className="border rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Special Requests (optional)"
                value={guestInfo.specialRequests}
                onChange={e => setGuestInfo(g => ({ ...g, specialRequests: e.target.value }))}
                className="border rounded px-3 py-2"
              />
              {/* Payment choice buttons */}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg flex-1"
                  onClick={() => saveBookingAndGoToCheckout("online")}
                >
                  Pay Online
                </button>
                <button
                  type="button"
                  className="bg-yellow-500 text-white px-6 py-2 rounded-lg flex-1 hover:bg-yellow-600"
                  onClick={() => saveBookingAndGoToCheckout("cash")}
                >
                  Pay At Hotel
                </button>
                <button
                  type="button"
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg"
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
