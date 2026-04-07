// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../utils/api";
import { FaSearch } from "react-icons/fa";
import RoomCard from "../components/Roomcard";

function Home() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  const [activeCategory, setActiveCategory] = useState("All");

  // 🔥 FILTER STATE
  const [filters, setFilters] = useState({
    keyword: searchParams.get("keyword") || "",
    fromDate: searchParams.get("fromDate") || "",
    toDate: searchParams.get("toDate") || "",
    guests: searchParams.get("guests") || "",
    roomType: searchParams.get("roomType") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    amenities: searchParams.get("amenities")
      ? searchParams.get("amenities").split(",")
      : [],
    rating: searchParams.get("rating") || "",
    sortBy: searchParams.get("sortBy") || "",
  });

  // 🚀 INITIAL LOAD
  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await api.get("/rooms/search");
      const data = res.data.rooms || res.data;
      setRooms(data);
      setFilteredRooms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 UPDATE URL
  const updateURL = (params) => {
    setSearchParams(params);
  };

  // 🔍 SEARCH
  const handleSearch = async () => {
    try {
      setLoading(true);

      const params = {};

      if (filters.keyword) params.keyword = filters.keyword;
      if (filters.roomType) params.roomType = filters.roomType;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;
      if (filters.rating) params.rating = filters.rating;
      if (filters.sortBy) params.sortBy = filters.sortBy;

      if (filters.amenities.length > 0) {
        params.amenities = filters.amenities.join(",");
      }

      updateURL(params);

      const res = await api.get("/rooms/search", { params });
      let data = res.data.rooms || res.data;

      // 👥 Guests filter
      if (filters.guests) {
        data = data.filter((r) => r.maxGuests >= Number(filters.guests));
      }

      setFilteredRooms(data);
    } catch (err) {
      console.error(err);
      setFilteredRooms([]);
    } finally {
      setLoading(false);
    }
  };

  // 🛎 Toggle Amenities
  const toggleAmenity = (key) => {
    setFilters((prev) => {
      const exists = prev.amenities.includes(key);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== key)
          : [...prev.amenities, key],
      };
    });
  };

  // ❌ CLEAR FILTERS
  const clearFilters = () => {
    setFilters({
      keyword: "",
      fromDate: "",
      toDate: "",
      guests: "",
      roomType: "",
      maxPrice: "",
      amenities: [],
      rating: "",
      sortBy: "",
    });
    setSearchParams({});
    fetchRooms();
  };

  // 🎯 CATEGORY LOGIC (FIXED)
  const categoryFilteredRooms =
    activeCategory === "All"
      ? filteredRooms
      : filteredRooms.filter((r) => {
          if (activeCategory === "Luxury") return r.pricePerNight > 5000;
          if (activeCategory === "Budget") return r.pricePerNight < 2000;
          if (activeCategory === "Popular") return (r.averageRating || 0) >= 4;
          return true;
        });

  const matchingCount = categoryFilteredRooms.length;

  return (
    <div className="bg-white min-h-screen">
      {/* HERO */}
      <div
        className="relative bg-cover bg-center py-24 px-4 md:px-8"
        style={{ backgroundImage: "url(https://images.unsplash.com/photo-1566073771259-6a8506099945)" }}
      >
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">Book Your Stay</h1>

          {/* 🔍 SEARCH BAR */}
          <div
            className="bg-white rounded-2xl flex flex-wrap gap-3 md:gap-4 justify-center items-center p-5 shadow-lg"
          >
            <input
              className="border border-gray-300 rounded px-3 py-2 w-32 md:w-40 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Search"
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
            />

            <input
              type="date"
              className="border border-gray-300 rounded px-3 py-2 w-32 md:w-40 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={filters.fromDate}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
            />

            <input
              type="date"
              className="border border-gray-300 rounded px-3 py-2 w-32 md:w-40 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={filters.toDate}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
            />

            <input
              type="number"
              placeholder="Guests"
              className="border border-gray-300 rounded px-3 py-2 w-20 md:w-28 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={filters.guests}
              onChange={(e) => setFilters({ ...filters, guests: e.target.value })}
            />

            <select
              className="border border-gray-300 rounded px-3 py-2 w-28 md:w-36 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={filters.roomType}
              onChange={(e) => setFilters({ ...filters, roomType: e.target.value })}
            >
              <option value="">Type</option>
              <option value="Standard">Standard</option>
              <option value="Deluxe">Deluxe</option>
              <option value="Suite">Suite</option>
            </select>

            <input
              type="number"
              placeholder="Max Price"
              className="border border-gray-300 rounded px-3 py-2 w-24 md:w-32 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            />

            {/* Amenities */}
            <div className="flex gap-2">
              {["wifi", "parking", "breakfast", "pool"].map((a) => (
                <label key={a} className="flex items-center gap-1 text-sm bg-blue-50 px-2 py-1 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.amenities.includes(a)}
                    onChange={() => toggleAmenity(a)}
                    className="accent-blue-500"
                  />
                  {a}
                </label>
              ))}
            </div>

            <select
              className="border border-gray-300 rounded px-3 py-2 w-24 md:w-28 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={filters.rating}
              onChange={(e) => setFilters({ ...filters, rating: e.target.value })}
            >
              <option value="">Rating</option>
              <option value="4">4★+</option>
              <option value="3">3★+</option>
            </select>

            <select
              className="border border-gray-300 rounded px-3 py-2 w-24 md:w-28 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
            >
              <option value="">Sort</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
              <option value="rating">Top Rated</option>
            </select>

            <button
              onClick={handleSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 transition"
            >
              <FaSearch />
            </button>

            <button
              onClick={clearFilters}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded transition"
            >
              Clear
            </button>
          </div>

          {/* ACTIVE FILTERS */}
          <div className="mt-3 flex flex-wrap gap-2 justify-center">
            {filters.amenities.map((a) => (
              <span
                key={a}
                className="mr-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ROOMS */}
      <div className="py-8 px-4 md:px-8">
        <h2 className="text-2xl font-semibold mb-4">{matchingCount} rooms found</h2>

        {loading && <p>Loading...</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {!loading && categoryFilteredRooms.length === 0 ? (
            <p className="col-span-full text-center text-gray-500">No rooms match your filters</p>
          ) : (
            categoryFilteredRooms.map((room) => (
              <RoomCard key={room._id} room={room} setRooms={setRooms} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;