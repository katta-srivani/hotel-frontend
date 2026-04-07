import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const res = await api.get('/favorites');
      setFavorites(res.data.favorites || []);
    } catch {
      setFavorites([]);
    }
    setLoading(false);
  };

  if (loading) return <div className="text-center mt-10">Loading favorites...</div>;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FaHeart className="text-red-500" /> My Favorite Rooms
      </h2>
      {favorites.length === 0 ? (
        <div className="text-gray-500">No favorites yet.</div>
      ) : (
        <div className="grid gap-6">
          {favorites.map(fav => (
            <div key={fav.room._id} className="bg-white rounded-xl shadow p-4 flex items-center gap-6">
              <img src={fav.room.imageUrls?.[0]} alt="Room" className="w-32 h-24 object-cover rounded-lg" />
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">{fav.room.title}</h3>
                <div className="text-gray-600 mb-1">{fav.room.description?.slice(0, 60)}...</div>
                <div className="text-blue-600 font-semibold">₹{fav.room.pricePerNight} / night</div>
              </div>
              <a href={`/rooms/${fav.room._id}`} className="bg-blue-600 text-white px-4 py-2 rounded-lg">View</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Favorites;
