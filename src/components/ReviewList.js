import React from 'react';
import { FaStar, FaUser } from 'react-icons/fa';

function ReviewList({ reviews, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg font-medium">
          No reviews yet. Be the first to review!
        </p>
      </div>
    );
  }

  const approvedReviews = reviews.filter((r) => r.isApproved !== false);

  return (
    <div className="space-y-6">

      {/* ===== SUMMARY ===== */}
      {approvedReviews.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 border">
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => {
                const avgRating = Math.round(
                  approvedReviews.reduce((sum, r) => sum + r.rating, 0) /
                    approvedReviews.length
                );
                return (
                  <FaStar
                    key={i}
                    className={`${
                      i < avgRating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                );
              })}
            </div>

            <span className="text-2xl font-bold text-gray-800">
              {(
                approvedReviews.reduce((sum, r) => sum + r.rating, 0) /
                approvedReviews.length
              ).toFixed(1)}
            </span>

            <span className="text-gray-500">
              ({approvedReviews.length} reviews)
            </span>
          </div>
        </div>
      )}

      {/* ===== REVIEWS ===== */}
      <div className="space-y-5">
        {approvedReviews.map((review) => (
          <div
            key={review._id}
            className="bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition duration-300"
          >
            {/* HEADER */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500 text-white rounded-full p-2">
                  <FaUser size={14} />
                </div>

                <div>
                  <p className="font-semibold text-gray-800">
                    {review.user?.name || 'Anonymous'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {review.createdAt
                      ? new Date(review.createdAt).toLocaleDateString()
                      : 'Recently'}
                  </p>
                </div>
              </div>

              {/* RATING */}
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <FaStar
                    key={i}
                    className={`${
                      i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                    size={14}
                  />
                ))}
              </div>
            </div>

            {/* COMMENT */}
            <p className="text-gray-600 text-sm leading-relaxed">
              {review.comment}
            </p>
          </div>
        ))}
      </div>

      {/* EMPTY APPROVED */}
      {approvedReviews.length === 0 && (
        <div className="text-center py-10 bg-gray-50 rounded-xl border">
          <p className="text-gray-500">No approved reviews yet</p>
        </div>
      )}
    </div>
  );
}

export default ReviewList;