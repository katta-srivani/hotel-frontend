// src/components/RoomReviews.jsx
import { useEffect, useState } from "react";
import api from "../utils/api";

export default function RoomReviews({ roomId, newReview }) {
  const [reviews, setReviews] = useState([]);
  const [avg, setAvg] = useState(0);

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/reviews/${roomId}`);
      const data = res.data.data || res.data.reviews || res.data || [];

      setReviews(data);

      if (data.length > 0) {
        const total = data.reduce((acc, r) => acc + r.rating, 0);
        setAvg((total / data.length).toFixed(1));
      } else {
        setAvg(0);
      }
    } catch (err) {
      console.error("Review fetch error", err);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [roomId]);

  useEffect(() => {
    if (newReview) {
      setReviews((prev) => {
        const updated = [newReview, ...prev];
        const total = updated.reduce((acc, r) => acc + r.rating, 0);
        setAvg((total / updated.length).toFixed(1));
        return updated;
      });
    }
  }, [newReview]);

  return (
    <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">

      {/* ⭐ Average */}
      <div className="flex items-center justify-between mb-4">
        <h5 className="text-lg font-semibold flex items-center gap-2">
          <span className="text-yellow-400 text-xl">★</span>
          {avg}
          <span className="text-gray-500 text-sm font-normal">
            · {reviews.length} reviews
          </span>
        </h5>
      </div>

      {/* List */}
      {reviews.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">
          No reviews yet
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r._id}
              className="border-b border-gray-200 pb-4 last:border-none"
            >
              <div className="flex items-center justify-between mb-1">
                <strong className="text-gray-800 text-sm font-semibold">
                  {r.user?.name || "User"}
                </strong>

                {/* Stars */}
                <div className="text-yellow-400 text-sm">
                  {"★".repeat(r.rating)}
                </div>
              </div>

              <p className="text-gray-600 text-sm leading-relaxed">
                {r.comment}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}