// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { FaBuilding, FaGem, FaGlobe, FaHotel, FaHome, FaSearch } from "react-icons/fa";
import api from "../utils/api";
import RoomCard from "../components/Roomcard";

function Home() {
  const [amenitiesDropdownOpen, setAmenitiesDropdownOpen] = useState(false);
  const [allRooms, setAllRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState("");
  const [filters, setFilters] = useState({
    keyword: "",
    fromDate: "",
    toDate: "",
    guests: "",
    minPrice: "",
    maxPrice: "",
    category: "",
    amenities: [],
  });

  const amenitiesList = [
    { value: "wifi", label: "WiFi" },
    { value: "pool", label: "Pool" },
    { value: "parking", label: "Parking" },
    { value: "breakfast", label: "Breakfast" },
  ];

  const categories = [
    { key: "", label: "All", icon: FaGlobe, color: "text-sky-500" },
    { key: "luxury", label: "Luxury", icon: FaGem, color: "text-amber-500" },
    { key: "standard", label: "Standard", icon: FaHotel, color: "text-emerald-500" },
    { key: "deluxe", label: "Deluxe", icon: FaBuilding, color: "text-violet-500" },
    { key: "suite", label: "Suite", icon: FaBuilding, color: "text-rose-500" },
    { key: "villa", label: "Villa", icon: FaHome, color: "text-orange-500" },
  ];

  useEffect(() => {
    const handler = (e) => {
      const dropdown = document.querySelector(".amenities-dropdown-menu");
      if (dropdown && !dropdown.contains(e.target)) {
        setAmenitiesDropdownOpen(false);
      }
    };

    if (amenitiesDropdownOpen) {
      document.addEventListener("mousedown", handler);
    } else {
      document.removeEventListener("mousedown", handler);
    }

    return () => document.removeEventListener("mousedown", handler);
  }, [amenitiesDropdownOpen]);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        setLoading(true);

        const hasDateRange = Boolean(filters.fromDate && filters.toDate);
        const res = hasDateRange
          ? await api.get("/rooms/search", {
              params: {
                fromDate: filters.fromDate,
                toDate: filters.toDate,
              },
            })
          : await api.get("/rooms");

        const rooms = hasDateRange
          ? res.data?.rooms || []
          : Array.isArray(res.data)
            ? res.data
            : [];
        setAllRooms(rooms);
      } catch (err) {
        console.error("Failed to load rooms:", err.response?.data || err.message);
        setAllRooms([]);
      } finally {
        setLoading(false);
      }
    };

    loadRooms();
  }, [filters.fromDate, filters.toDate]);

  const matchesText = (room, text) => {
    if (!text) return true;
    const haystack = [
      room?.title,
      room?.description,
      room?.view,
      room?.location,
      room?.category,
      room?.roomType,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(text.toLowerCase());
  };

  const matchesCategory = (room, category) => {
    if (!category) return true;

    const haystack = [
      room?.title,
      room?.description,
      room?.view,
      room?.location,
      room?.category,
      room?.roomType,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const keywordMap = {
      luxury: ["luxury", "suite", "premium", "ocean"],
      standard: ["standard", "basic", "comfort"],
      deluxe: ["deluxe", "city", "mountain", "premium"],
      suite: ["suite", "family", "executive"],
      villa: ["villa", "garden", "resort"],
    };

    return (keywordMap[category.toLowerCase()] || [category.toLowerCase()]).some(
      (keyword) => haystack.includes(keyword)
    );
  };

  const matchesAmenities = (room, selectedAmenities) => {
    if (!selectedAmenities.length) return true;
    const roomAmenities = room?.amenities || {};
    return selectedAmenities.every((amenity) => Boolean(roomAmenities[amenity]));
  };

  const matchesGuests = (room, guests) => {
    if (!guests) return true;
    const requiredGuests = Number(guests);
    if (Number.isNaN(requiredGuests)) return true;
    return Number(room?.maxGuests || 0) >= requiredGuests;
  };

  const matchesPrice = (room, minPrice, maxPrice) => {
    const price = Number(room?.pricePerNight || 0);
    const min = minPrice === "" ? null : Number(minPrice);
    const max = maxPrice === "" ? null : Number(maxPrice);

    if (min !== null && !Number.isNaN(min) && price < min) {
      return false;
    }

    if (max !== null && !Number.isNaN(max) && price > max) {
      return false;
    }

    return true;
  };

  const matchesDateRange = (room) => {
    if (!filters.fromDate && !filters.toDate) return true;
    const status = String(room?.isAvailable ?? room?.isActive ?? true);
    return status !== "false";
  };

  const displayedRooms = allRooms
    .filter((room) =>
      matchesText(room, filters.keyword) &&
      matchesCategory(room, filters.category) &&
      matchesAmenities(room, filters.amenities) &&
      matchesGuests(room, filters.guests) &&
      matchesPrice(room, filters.minPrice, filters.maxPrice) &&
      matchesDateRange(room)
    )
    .sort((a, b) => {
      if (sortOrder === "low-high") {
        return Number(a?.pricePerNight || 0) - Number(b?.pricePerNight || 0);
      }

      if (sortOrder === "high-low") {
        return Number(b?.pricePerNight || 0) - Number(a?.pricePerNight || 0);
      }

      return 0;
    });

  const handleSearch = (event) => {
    event?.preventDefault?.();
  };

  const handleCategory = (cat) => {
    setFilters({
      keyword: "",
      fromDate: "",
      toDate: "",
      guests: "",
      minPrice: "",
      maxPrice: "",
      amenities: [],
      category: cat,
    });
  };

  return (
    <div className="bg-white min-h-screen">
      <div
        className="relative flex justify-center items-center py-16 px-2 border-b border-gray-100 bg-gray-100"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "420px",
        }}
      >
        <div className="absolute inset-0 bg-black/40 z-0" />
        <div className="relative z-10 flex w-full max-w-4xl flex-col items-center overflow-hidden rounded-[40px] border border-white/30 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(255,247,248,0.92)_100%)] p-8 shadow-[0_28px_90px_rgba(15,23,42,0.28)] backdrop-blur-md md:p-10">
          <div className="pointer-events-none absolute inset-0 rounded-[40px] border border-white/40" style={{ zIndex: 0 }} />
          <div className="pointer-events-none absolute -top-16 right-[-60px] h-44 w-44 rounded-full bg-rose-200/35 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-[-40px] h-40 w-40 rounded-full bg-orange-200/30 blur-3xl" />
          <h1 className="mb-3 text-center text-4xl font-extrabold tracking-tight text-rose-600 drop-shadow md:text-5xl">
            Find Your Perfect Stay
          </h1>
          <p className="mb-6 max-w-2xl text-center text-lg text-gray-600">
            Book top hotels, resorts, and more with{" "}
            <span className="font-bold text-rose-500">Travelerly</span>.
          </p>

          <form
            className="w-full max-w-5xl"
            style={{ zIndex: 1 }}
            onSubmit={handleSearch}
          >
            <div className="flex flex-col gap-3">
              <div className="rounded-full border border-white/70 bg-white p-2 shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
                <div className="grid items-center rounded-full bg-white md:grid-cols-[1.7fr_1fr_1fr_0.9fr_auto]">
                  <div className="flex min-h-[74px] flex-col justify-center rounded-full px-6 py-3 md:border-r md:border-gray-200">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Where</span>
                    <input
                      type="text"
                      placeholder="Search destinations"
                      className="mt-1 w-full bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none"
                      value={filters.keyword}
                      onChange={(e) => setFilters((f) => ({ ...f, keyword: e.target.value }))}
                    />
                  </div>

                  <div className="flex min-h-[74px] flex-col justify-center px-6 py-3 md:border-r md:border-gray-200">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Check in</span>
                    <input
                      type="date"
                      className="mt-1 w-full bg-transparent text-sm font-medium text-gray-900 focus:outline-none"
                      value={filters.fromDate}
                      onChange={(e) => setFilters((f) => ({ ...f, fromDate: e.target.value }))}
                    />
                  </div>

                  <div className="flex min-h-[74px] flex-col justify-center px-6 py-3 md:border-r md:border-gray-200">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Check out</span>
                    <input
                      type="date"
                      className="mt-1 w-full bg-transparent text-sm font-medium text-gray-900 focus:outline-none"
                      value={filters.toDate}
                      onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value }))}
                    />
                  </div>

                  <div className="flex min-h-[74px] flex-col justify-center px-6 py-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Who</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="Add guests"
                      className="mt-1 w-full bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none"
                      value={filters.guests}
                      onChange={(e) => setFilters((f) => ({ ...f, guests: e.target.value }))}
                    />
                  </div>

                  <div className="flex items-center justify-end px-3 py-3">
                    <button
                      type="submit"
                      className="flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f43f5e_0%,#e11d48_100%)] text-white shadow-[0_14px_30px_rgba(225,29,72,0.28)] transition hover:scale-[1.03] hover:brightness-105"
                      aria-label="Search"
                    >
                      <FaSearch className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-[0.85fr_0.85fr_1.2fr]">
                <div className="flex min-h-[62px] flex-col justify-center rounded-2xl border border-white/60 bg-white/92 px-5 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Min price</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className="mt-1 w-full bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none"
                    value={filters.minPrice}
                    onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
                  />
                </div>

                <div className="flex min-h-[62px] flex-col justify-center rounded-2xl border border-white/60 bg-white/92 px-5 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Max price</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Any"
                    className="mt-1 w-full bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
                  />
                </div>

                <div className="relative flex min-h-[62px] flex-col justify-center rounded-2xl border border-white/60 bg-white/92 px-5 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur">
                  <span className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Amenities</span>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-100"
                    onClick={() => setAmenitiesDropdownOpen((open) => !open)}
                    tabIndex={0}
                  >
                    {filters.amenities.length > 0
                      ? amenitiesList
                          .filter((a) => filters.amenities.includes(a.value))
                          .map((a) => a.label)
                          .join(", ")
                      : "Select amenities"}
                    <svg className="ml-2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {amenitiesDropdownOpen && (
                    <div className="amenities-dropdown-menu absolute left-0 top-full z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl">
                      {amenitiesList.map((am) => (
                        <label key={am.value} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm">
                          <input
                            type="checkbox"
                            value={am.value}
                            checked={filters.amenities.includes(am.value)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFilters((f) => ({
                                ...f,
                                amenities: checked
                                  ? [...f.amenities, am.value]
                                  : f.amenities.filter((a) => a !== am.value),
                              }));
                            }}
                            className="mr-2"
                          />
                          {am.label}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto px-6 py-5 bg-white sticky top-0 z-10 shadow-sm border-b border-gray-100">
        <div className="flex gap-2">
          {categories.map((cat) => {
            const active = filters.category === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => handleCategory(cat.key)}
                className={`flex flex-col items-center justify-center px-5 py-2 rounded-full whitespace-nowrap text-xs font-semibold transition border min-w-[90px] shadow-sm ${
                  active ? "bg-gray-900 text-white border-gray-900" : "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200"
                }`}
              >
                <cat.icon
                  className={`text-xl mb-1 ${active ? "text-white" : cat.color}`}
                  aria-hidden="true"
                />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white shadow-sm">
            <span className="text-xs font-semibold text-gray-700">Display total before taxes</span>
            <label className="inline-flex relative items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-rose-400 peer-checked:bg-rose-500 transition-all" />
              <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full shadow peer-checked:translate-x-4 transition-all" />
            </label>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white shadow-sm">
            <span className="text-xs font-semibold text-gray-700">Sort by price</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none"
            >
              <option value="">Default</option>
              <option value="low-high">Low to High</option>
              <option value="high-low">High to Low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {!loading && displayedRooms.length > 0 &&
            displayedRooms.map((room) => <RoomCard key={room._id} room={room} />)}

          {loading &&
            [...Array(4)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-white rounded-2xl p-5 space-y-3 border border-gray-200 shadow"
              >
                <div className="h-40 bg-gray-100 rounded-xl" />
                <div className="h-4 bg-gray-100 w-2/3 rounded" />
                <div className="h-4 bg-gray-100 w-1/2 rounded" />
              </div>
            ))}
        </div>

        {!loading && displayedRooms.length === 0 && (
          <p className="text-center text-gray-500 mt-8 text-base font-medium">
            No rooms match this filter
          </p>
        )}

        <button className="fixed lg:absolute bottom-8 right-8 bg-white border border-gray-200 shadow-lg rounded-full px-6 py-3 flex items-center gap-2 text-gray-900 font-semibold hover:bg-gray-50 z-40">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A2 2 0 013 15.382V6.618a2 2 0 011.105-1.789l6-3a2 2 0 011.79 0l6 3A2 2 0 0021 6.618v8.764a2 2 0 01-1.105 1.789L15 20" />
          </svg>
          Show map
        </button>
      </div>
    </div>
  );
}

export default Home;
