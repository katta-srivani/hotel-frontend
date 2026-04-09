// src/components/RoomCard.jsx

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { FaStar, FaTimes, FaHeart } from "react-icons/fa";
import ReviewList from "./ReviewList";

function RoomCard({ room, setRooms }) {
  const navigate = useNavigate();

  // ================= REVIEW STATE =================
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  // Removed unused: reviewSubmitting, setReviewSubmitting
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");

  useEffect(() => {
    if (!room?._id) return;
    setReviewsLoading(true);
    api
      .get(`/reviews/${room._id}`)
      .then((res) => {
        setReviews(res.data.reviews || []);
        setReviewsLoading(false);
      })
      .catch(() => setReviewsLoading(false));
  }, [room?._id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError("");
    setReviewSuccess("");
    // removed setReviewSubmitting

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setReviewError("Please login first");
        return;
      }

      await api.post(
        "/reviews",
        { roomId: room._id, rating: reviewRating, comment: reviewComment }
      );

      setReviewSuccess("Review submitted! Pending approval.");
      setReviewRating(0);
      setReviewComment("");

      const res = await api.get(`/reviews/${room._id}`);
      setReviews(res.data.reviews || []);
    } catch (err) {
      setReviewError("Failed to submit review");
    }

    // removed setReviewSubmitting
  };

  // ================= FAVORITES =================
  const [isFavorite, setIsFavorite] = useState(false);
  // Removed unused: favoriteLoading, setFavoriteLoading

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!room?._id || !token) return;

    api
      .get("/users/favorites")
      .then((res) => {
        const favs = res.data.data || [];
        setIsFavorite(favs.some((f) => f._id === room._id));
      });
  }, [room?._id]);

  const handleToggleFavorite = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Login first");

    // removed setFavoriteLoading

    try {
      if (isFavorite) {
        await api.delete(`/users/remove-favorite/${room._id}`);
        setIsFavorite(false);
      } else {
        await api.post(`/users/add-favorite/${room._id}`);
        setIsFavorite(true);
      }
    } catch {
      alert("Failed");
    }

    // removed setFavoriteLoading
  };

  // ================= OTHER STATE =================
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookingCard, setShowBookingCard] = useState(false);

  const defaultImage =
    "https://via.placeholder.com/400x300/e5e7eb/999?text=Room";

  const imageUrl =
    room?.imageUrls?.[0] && !imageError
      ? room.imageUrls[0]
      : defaultImage;

  // ================= UI =================
  return (
    <div className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden flex flex-col relative">

      {/* IMAGE */}
      <div className="relative h-64 bg-gray-100 overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 animate-pulse bg-gray-200" />
        )}

        {/* Favorite */}
        <button
          onClick={handleToggleFavorite}
          className="absolute top-4 left-1/2 -translate-x-1/2 bg-white p-2 rounded-full shadow"
        >
          <FaHeart
            className={isFavorite ? "text-red-500" : "text-gray-400"}
          />
        </button>

        <img
          src={imageUrl}
          alt=""
          className="w-full h-full object-cover"
          onLoad={() => setIsLoading(false)}
          onError={() => setImageError(true)}
        />

        {/* Status */}
        <div className={`absolute top-3 right-3 px-3 py-1 text-xs rounded-full text-white ${
          room?.isCurrentlyBooked ? "bg-red-500" : "bg-green-500"
        }`}>
          {room?.isCurrentlyBooked ? "Booked" : "Available"}
        </div>

        {/* Rating */}
        <div className="absolute top-3 left-3 bg-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
          <FaStar className="text-pink-500" />
          {room?.rating || 4.5}
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-4 space-y-3">

        <h3 className="font-semibold text-sm">
          {room?.title}
        </h3>

        <p className="text-gray-500 text-xs">
          {room?.roomType}
        </p>

        <div className="flex justify-between text-sm font-medium">
          <span>₹{room?.pricePerNight} / night</span>
          <span>⭐ {room?.rating || 4.5}</span>
        </div>

        {/* BUTTONS */}
        <div className="flex gap-2">
          <Link
            to={`/rooms/${room?._id}`}
            className="flex-1 text-center bg-gray-100 py-2 rounded-lg text-sm"
          >
            Details
          </Link>

          <button
            disabled={room?.isCurrentlyBooked}
            onClick={() => {
              if (room?.isCurrentlyBooked) return;
              // Prepare booking data for Checkout
              const bookingData = {
                roomId: room?._id,
                checkInDate: new Date().toISOString().slice(0, 10), // default today
                checkOutDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10), // default tomorrow
                numberOfRooms: 1
              };
              sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
              navigate('/checkout');
            }}
            className={`flex-1 py-2 rounded-lg text-sm text-white ${room?.isCurrentlyBooked ? 'bg-gray-400 cursor-not-allowed' : 'bg-pink-500'}`}
          >
            {room?.isCurrentlyBooked ? 'Booked' : 'Book'}
          </button>
        </div>

        {/* REVIEWS */}
        <div className="pt-3 border-t">
          <ReviewList reviews={reviews} loading={reviewsLoading} />
        </div>

        {/* ADD REVIEW */}
        <form onSubmit={handleReviewSubmit} className="space-y-2">
          <div className="flex gap-1">
            {[1,2,3,4,5].map(star => (
              <FaStar
                key={star}
                onClick={() => setReviewRating(star)}
                className={`cursor-pointer ${
                  reviewRating >= star ? "text-yellow-400" : "text-gray-300"
                }`}
              />
            ))}
          </div>

          <textarea
            className="w-full border rounded-lg p-2 text-sm"
            value={reviewComment}
            onChange={(e)=>setReviewComment(e.target.value)}
            placeholder="Write review..."
          />

          <button className="w-full bg-green-500 text-white py-2 rounded-lg text-sm">
            Submit
          </button>

          {reviewError && <p className="text-red-500 text-xs">{reviewError}</p>}
          {reviewSuccess && <p className="text-green-500 text-xs">{reviewSuccess}</p>}
        </form>
      </div>

      {/* BOOKING MODAL */}
      {showBookingCard && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-5 rounded-xl w-[90%] max-w-md relative space-y-3">

            <FaTimes
              onClick={() => setShowBookingCard(false)}
              className="absolute top-3 right-3 cursor-pointer"
            />

            <h3 className="font-semibold">{room?.title}</h3>


            <button
              className="w-full bg-green-500 text-white py-2 rounded-lg"
              onClick={() => {
                setShowBookingCard(false);
                // Prepare booking data for Checkout (pay at hotel)
                const bookingData = {
                  roomId: room?._id,
                  checkInDate: new Date().toISOString().slice(0, 10),
                  checkOutDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
                  numberOfRooms: 1,
                  payMode: 'hotel'
                };
                sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
                navigate('/checkout');
              }}
            >
              Pay at Hotel
            </button>

            <button
              className="w-full bg-pink-500 text-white py-2 rounded-lg"
              onClick={() => {
                setShowBookingCard(false);
                // Prepare booking data for Checkout (pay online)
                const bookingData = {
                  roomId: room?._id,
                  checkInDate: new Date().toISOString().slice(0, 10),
                  checkOutDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
                  numberOfRooms: 1,
                  payMode: 'online'
                };
                sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
                navigate('/checkout');
              }}
            >
              Pay Online
            </button>

          </div>
        </div>
      )}
    </div>
  );
}

export default RoomCard;