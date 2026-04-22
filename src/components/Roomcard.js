// src/components/RoomCard.jsx


import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { FaHeart, FaStar, FaRegStar } from "react-icons/fa";
import { fallbackRoomImage, getSafeImageUrl } from "../utils/image";



function RoomCard({ room }) {
  // ================= WISHLIST =================
  const [isWishlisted, setIsWishlisted] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!room?._id || !token) return;
    api.get("/favorites", { params: { type: "wishlist" } })
      .then((res) => {
        const favs = res.data.favorites || [];
        setIsWishlisted(favs.some((w) => w.room && w.room._id === room._id));
      })
      .catch(() => setIsWishlisted(false));
  }, [room?._id]);

  const handleToggleWishlist = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Login first");
    try {
      if (isWishlisted) {
        await api.delete(`/favorites/${room._id}`, { params: { type: "wishlist" } });
        setIsWishlisted(false);
      } else {
        await api.post("/favorites", { roomId: room._id, type: "wishlist" });
        setIsWishlisted(true);
      }
    } catch {
      alert("Failed");
    }
  };
  // ================= FAVORITES =================
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!room?._id || !token) return;

    api.get("/favorites", { params: { type: "favorite" } })
      .then((res) => {
        const favs = res.data.favorites || [];
        setIsFavorite(
          favs.some((f) => f.room && f.room._id === room._id)
        );
      })
      .catch(() => setIsFavorite(false));
  }, [room?._id]);

  const handleToggleFavorite = async () => {
    const token = localStorage.getItem("token");
    if (!token) return alert("Login first");

    try {
      if (isFavorite) {
        await api.delete(`/favorites/${room._id}`, { params: { type: "favorite" } });
        setIsFavorite(false);
      } else {
        await api.post("/favorites", { roomId: room._id, type: "favorite" });
        setIsFavorite(true);
      }
    } catch {
      alert("Failed");
    }
  };

  // ================= IMAGE =================
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);


  // Special images for beach view and favorites
  const beachImage = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80";
  const favImage = "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80";

  let imageUrl = fallbackRoomImage;
  if (room?.imageUrls?.[0] && !imageError) {
    imageUrl = getSafeImageUrl(room.imageUrls[0], fallbackRoomImage);
  } else if ((room?.view || room?.category || "").toLowerCase().includes("beach")) {
    imageUrl = beachImage;
  } else if (room?.isFavorite || isFavorite) {
    imageUrl = favImage;
  }

  // ================= UI =================
  return (
    <div className="bg-white rounded-3xl shadow-md hover:shadow-xl transition-all flex flex-col border border-gray-100 group hover:-translate-y-1 duration-200">

      {/* IMAGE */}
      <div className="relative h-64 bg-gray-100">
        {isLoading && (
          <div className="absolute inset-0 animate-pulse bg-gray-200" />
        )}

        <img
          src={imageUrl}
          alt="Room"
          className="w-full h-full object-cover rounded-2xl"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setImageError(true);
            setIsLoading(false);
          }}
        />


        {/* Favorite */}
        <button
          onClick={handleToggleFavorite}
          className="absolute top-4 right-4 bg-white p-2 rounded-full shadow"
        >
          <FaHeart
            className={isFavorite ? "text-rose-500" : "text-gray-300"}
          />
        </button>

        {/* Wishlist */}
        <button
          onClick={handleToggleWishlist}
          className="absolute top-4 left-4 bg-white p-2 rounded-full shadow"
          title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
        >
          {isWishlisted ? (
            <FaStar className="text-yellow-400" />
          ) : (
            <FaRegStar className="text-gray-300" />
          )}
        </button>

        {/* Rating */}
        <div className="absolute bottom-4 right-4 bg-white px-3 py-1 rounded-full text-xs flex items-center gap-1 shadow">
          <FaStar className="text-rose-500" />
          {room?.rating || 4.5}
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-5">
        <h3 className="font-semibold text-gray-900 truncate">
          {room?.title}
        </h3>

        <div className="flex justify-between items-center mt-2">
          <span className="text-lg font-bold">
            ₹{room?.pricePerNight}
            <span className="text-sm text-gray-500"> / night</span>
          </span>

          <Link
            to={`/rooms/${room?._id}`}
            className="px-4 py-2 rounded-xl bg-rose-500 text-white text-sm"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RoomCard;
