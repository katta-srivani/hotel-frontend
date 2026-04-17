
// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../utils/api";
import RoomCard from "../components/Roomcard";


function Home() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Dropdown state for amenities
  const [amenitiesDropdownOpen, setAmenitiesDropdownOpen] = useState(false);
  const amenitiesList = [
    { value: "wifi", label: "WiFi" },
    { value: "pool", label: "Pool" },
    { value: "parking", label: "Parking" },
    { value: "ac", label: "AC" },
    { value: "tv", label: "TV" },
    { value: "breakfast", label: "Breakfast" },
    { value: "spa", label: "Spa" },
    { value: "gym", label: "Gym" },
  ];

  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [sortOrder, setSortOrder] = useState(""); // "low-high" or "high-low"
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const categories = [
    { key: "", label: "All", icon: "🌐" },
    { key: "luxury", label: "Luxury", icon: "💎" },
    { key: "standard", label: "Standard", icon: "🏠" },
    { key: "deluxe", label: "Deluxe", icon: "🛏️" },
    { key: "suite", label: "Suite", icon: "🏨" },
    { key: "villa", label: "Villa", icon: "🏡" },
    
    
  ];
  // Filters state
  const [filters, setFilters] = useState({
    keyword: searchParams.get("keyword") || "",
    fromDate: "",
    toDate: "",
    guests: "",
    category: "",
    amenities: [], // multiple amenities
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      const dropdown = document.querySelector('.amenities-dropdown-menu');
      if (dropdown && !dropdown.contains(e.target)) {
        setAmenitiesDropdownOpen(false);
      }
    };
    if (amenitiesDropdownOpen) {
      document.addEventListener('mousedown', handler);
    } else {
      document.removeEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [amenitiesDropdownOpen]);

  // 🚀 FETCH ROOMS (PAGINATION)
  const fetchRooms = async (pageNum = 1) => {
    try {
      setLoading(true);

      const res = await api.get("/rooms/search", {
        params: { page: pageNum, limit: 8 },
      });

      const data = res.data.rooms || res.data;

      if (pageNum === 1) {
        setRooms(data);
        setFilteredRooms(data);
      } else {
        setRooms((prev) => [...prev, ...data]);
        setFilteredRooms((prev) => [...prev, ...data]);
      }

      setHasMore(data.length > 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms(1);
  }, []);

  // 🔍 SEARCH
  const handleSearch = async () => {
    try {
      setLoading(true);
      const params = {
        keyword: filters.keyword,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        guests: filters.guests,
        category: filters.category,
        amenities: filters.amenities.join(","),
      };
      setSearchParams(params);
      const res = await api.get("/rooms/search", { params });
      let result = res.data.rooms || res.data;
      setFilteredRooms(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 CATEGORY FILTER
  const handleCategory = (cat) => {
    // Find the display label for the selected category key
    const catObj = categories.find(c => c.key === cat);
    const filterValue = catObj ? catObj.label : cat;
    setFilters((prev) => ({ ...prev, category: filterValue }));
  };

  // Run search when category changes
  useEffect(() => {
    if (filters.category) {
      handleSearchWithCategory(filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category]);

  // Helper to trigger search with category and apply sorting
  const handleSearchWithCategory = async (newFilters) => {
    try {
      setLoading(true);
      const params = {
        keyword: newFilters.keyword,
        fromDate: newFilters.fromDate,
        toDate: newFilters.toDate,
        guests: newFilters.guests,
        category: newFilters.category,
      };
      setSearchParams(params);
      const res = await api.get("/rooms/search", { params });
      let result = res.data.rooms || res.data;
      if (newFilters.category && newFilters.category.toLowerCase() !== "all") {
        const cat = newFilters.category.toLowerCase();
        if (cat === "luxury") {
          // Luxury: roomType 'Suite' AND view is 'Ocean'
          result = result.filter(room => (room.roomType || "").toLowerCase() === "suite" && room.view && room.view.trim().toLowerCase() === "ocean");
        } else if (cat === "standard") {
          result = result.filter(room => (room.roomType || "").toLowerCase() === "standard");
        } else if (cat === "deluxe") {
          result = result.filter(room => (room.roomType || "").toLowerCase() === "deluxe");
        } else if (cat === "suite") {
          result = result.filter(room => (room.roomType || "").toLowerCase() === "suite");
        } else if (cat === "villa") {
          // Villa: match title or roomType
          result = result.filter(room => (room.title || "").toLowerCase().includes("villa") || (room.roomType || "").toLowerCase() === "villa");
        }
      }
      // Apply price sorting if selected
      if (sortOrder === "low-high") {
        result = [...result].sort((a, b) => (a.pricePerNight || 0) - (b.pricePerNight || 0));
      } else if (sortOrder === "high-low") {
        result = [...result].sort((a, b) => (b.pricePerNight || 0) - (a.pricePerNight || 0));
      }
      setFilteredRooms(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Sort handler
  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
  };

  // Re-apply sorting when sortOrder changes
  useEffect(() => {
    let sortedRooms = [...filteredRooms];
    if (sortOrder === "low-high") {
      sortedRooms.sort((a, b) => (a.pricePerNight || 0) - (b.pricePerNight || 0));
    } else if (sortOrder === "high-low") {
      sortedRooms.sort((a, b) => (b.pricePerNight || 0) - (a.pricePerNight || 0));
    }
    setFilteredRooms(sortedRooms);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortOrder]);

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section with background image and overlay */}
      <div className="relative flex justify-center items-center py-16 px-2 border-b border-gray-100 bg-gray-100" style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '420px',
      }}>
        <div className="absolute inset-0 bg-black/40 z-0" />
        <div className="w-full max-w-3xl rounded-3xl shadow-2xl bg-white/90 flex flex-col items-center p-10 border-4 border-rose-100 relative overflow-hidden z-10 backdrop-blur-md">
          <div className="absolute inset-0 pointer-events-none rounded-3xl border-4 border-rose-200 opacity-30" style={{zIndex:0}}></div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-rose-600 mb-3 text-center tracking-tight drop-shadow">Find Your Perfect Stay</h1>
          <p className="text-lg text-gray-600 mb-6 text-center">Book top hotels, resorts, and more with <span className="font-bold text-rose-500">Travelerly</span>.</p>
            <div className="flex flex-wrap items-center bg-white border border-rose-200 rounded-2xl shadow-lg px-6 py-6 max-w-3xl w-full mt-4 gap-2" style={{ minHeight: 72, zIndex:1 }}>
              <button
                className="mr-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full h-12 w-12 flex items-center justify-center shadow transition border-none"
                style={{ minWidth: 48, minHeight: 48, boxShadow: '0 2px 8px 0 rgb(0 0 0 / 8%)' }}
                onClick={handleSearch}
                aria-label="Search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                </svg>
              </button>
              {/* Where */}
              <div className="flex flex-col items-start px-5 py-2 focus:outline-none">
                <span className="text-xs font-semibold text-gray-700">Where</span>
                <input
                  type="text"
                  placeholder="Search destinations"
                  className="text-sm text-gray-900 bg-transparent focus:outline-none"
                  value={filters.keyword}
                  onChange={e => setFilters(f => ({ ...f, keyword: e.target.value }))}
                />
              </div>
              <span className="h-8 w-px bg-gray-200 mx-1" />
              {/* Check in */}
              <div className="flex flex-col items-start px-4 py-2 focus:outline-none">
                <span className="text-xs font-semibold text-gray-700">Check in</span>
                <input
                  type="date"
                  className="text-sm text-gray-900 bg-transparent focus:outline-none"
                  value={filters.fromDate}
                  onChange={e => setFilters(f => ({ ...f, fromDate: e.target.value }))}
                />
              </div>
              <span className="h-8 w-px bg-gray-200 mx-1" />
              {/* Check out */}
              <div className="flex flex-col items-start px-4 py-2 focus:outline-none">
                <span className="text-xs font-semibold text-gray-700">Check out</span>
                <input
                  type="date"
                  className="text-sm text-gray-900 bg-transparent focus:outline-none"
                  value={filters.toDate}
                  onChange={e => setFilters(f => ({ ...f, toDate: e.target.value }))}
                />
              </div>
              <span className="h-8 w-px bg-gray-200 mx-1" />
              {/* Who */}
              <div className="flex flex-col items-start px-4 py-2 pr-10 focus:outline-none">
                <span className="text-xs font-semibold text-gray-700">Who</span>
                <input
                  type="number"
                  min="1"
                  placeholder="Add guests"
                  className="text-sm text-gray-900 bg-transparent focus:outline-none w-24"
                  value={filters.guests}
                  onChange={e => setFilters(f => ({ ...f, guests: e.target.value }))}
                />
              </div>
              {/* Amenities (custom dropdown with checkboxes) */}
              <div className="flex flex-col items-start px-4 py-2 focus:outline-none relative min-w-[160px]">
                <span className="text-xs font-semibold text-gray-700 mb-1">Amenities</span>
                <button
                  type="button"
                  className="flex items-center justify-between w-full border border-gray-200 rounded px-3 py-2 bg-white text-sm text-gray-900 shadow-sm min-w-[140px]"
                  onClick={() => setAmenitiesDropdownOpen(open => !open)}
                  tabIndex={0}
                >
                  {filters.amenities.length > 0
                    ? amenitiesList.filter(a => filters.amenities.includes(a.value)).map(a => a.label).join(", ")
                    : "Select amenities"}
                  <svg className="ml-2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {amenitiesDropdownOpen && (
                  <div className="absolute z-20 mt-1 left-0 w-full bg-white border border-gray-200 rounded shadow-lg max-h-56 overflow-y-auto">
                    {amenitiesList.map(am => (
                      <label key={am.value} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          value={am.value}
                          checked={filters.amenities.includes(am.value)}
                           onChange={e => {
                             const checked = e.target.checked;
                             setFilters(f => ({
                               ...f,
                               amenities: checked
                                 ? [...f.amenities, am.value]
                                 : f.amenities.filter(a => a !== am.value)
                             }));
                             setAmenitiesDropdownOpen(false);
                           }}
                          className="mr-2"
                        />
                        {am.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {/* (Dropdown close logic is handled in the main function body useEffect) */}
            </div>
        </div>
      </div>

      {/* Category Filter - Airbnb style with Filters, Toggle, and Price Sort */}
      <div className="flex items-center gap-2 overflow-x-auto px-6 py-5 bg-white sticky top-0 z-10 shadow-sm border-b border-gray-100">
        <div className="flex gap-2">
          {categories.map((cat) => {
            // Active state should match the display label, not the key
            const active = filters.category === cat.label;
            return (
              <button
                key={cat.key}
                onClick={() => handleCategory(cat.key)}
                className={`flex flex-col items-center justify-center px-5 py-2 rounded-full whitespace-nowrap text-xs font-semibold transition border min-w-[90px] shadow-sm ${
                  active
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200"
                }`}
              >
                <span className="text-xl mb-1">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
        {/* Right side: Filters, Toggle, and Price Sort */}
        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white shadow-sm">
            <span className="text-xs font-semibold text-gray-700">Display total before taxes</span>
            <label className="inline-flex relative items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-rose-400 peer-checked:bg-rose-500 transition-all"></div>
              <div className="absolute left-1 top-1 bg-white w-3 h-3 rounded-full shadow peer-checked:translate-x-4 transition-all"></div>
            </label>
          </div>
          {/* Price Sort Dropdown */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white shadow-sm">
            <span className="text-xs font-semibold text-gray-700">Sort by price</span>
            <select
              value={sortOrder}
              onChange={handleSortChange}
              className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none"
            >
              <option value="">Default</option>
              <option value="low-high">Low to High</option>
              <option value="high-low">High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Room Grid */}
      <div className="max-w-7xl mx-auto px-6 py-10 relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {filteredRooms.map((room, index) => (
            <RoomCard key={`${room._id}-${index}`} room={room} />
          ))}
          {/* Skeleton Loading */}
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
        {!hasMore && (
          <p className="text-center text-gray-300 mt-8 text-base font-medium">
            No more rooms
          </p>
        )}
        {/* Show Map Button */}
        <button className="fixed lg:absolute bottom-8 right-8 bg-white border border-gray-200 shadow-lg rounded-full px-6 py-3 flex items-center gap-2 text-gray-900 font-semibold hover:bg-gray-50 z-40">
          <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={2} stroke='currentColor' className='w-5 h-5'><path strokeLinecap='round' strokeLinejoin='round' d='M9 20l-5.447-2.724A2 2 0 013 15.382V6.618a2 2 0 011.105-1.789l6-3a2 2 0 011.79 0l6 3A2 2 0 0021 6.618v8.764a2 2 0 01-1.105 1.789L15 20' /></svg>
          Show map
        </button>
      </div>
    </div>
  );
}

export default Home;