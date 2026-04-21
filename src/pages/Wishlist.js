import React, { useEffect, useState } from "react";
import api from "../utils/api";
import RoomCard from "../components/Roomcard";

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWishlist() {
      try {
        const res = await api.get("/favorites", { params: { type: "wishlist" } });
        setWishlist(res.data.favorites || []);
      } catch {
        setWishlist([]);
      } finally {
        setLoading(false);
      }
    }
    fetchWishlist();
  }, []);

  if (loading) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">My Wishlist</h1>
      {wishlist.length === 0 ? (
        <div className="text-gray-400">No rooms in your wishlist yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {wishlist.map((item, idx) => (
            <RoomCard key={item.room?._id || idx} room={item.room} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Wishlist;
