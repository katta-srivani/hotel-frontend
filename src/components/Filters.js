import React from "react";

function Filters({ filters, setFilters }) {
  const handleAmenityChange = (e) => {
    const { value, checked } = e.target;

    let updated = [...filters.amenities];

    if (checked) {
      updated.push(value);
    } else {
      updated = updated.filter((item) => item !== value);
    }

    setFilters({ ...filters, amenities: updated });
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-md mb-5">
      <h2 className="text-lg font-semibold mb-3">Filters</h2>

      {/* 🛎 Amenities */}
      <div className="mb-4">
        <h3 className="font-medium">Amenities</h3>

        {["wifi", "parking", "breakfast", "pool"].map((item) => (
          <label key={item} className="block">
            <input
              type="checkbox"
              value={item}
              checked={filters.amenities.includes(item)}
              onChange={handleAmenityChange}
              className="mr-2"
            />
            {item}
          </label>
        ))}
      </div>

      {/* 💰 Price */}
      <div className="mb-4">
        <h3 className="font-medium">Price</h3>

        <input
          type="number"
          placeholder="Min"
          className="border p-1 mr-2"
          onChange={(e) =>
            setFilters({ ...filters, minPrice: e.target.value })
          }
        />

        <input
          type="number"
          placeholder="Max"
          className="border p-1"
          onChange={(e) =>
            setFilters({ ...filters, maxPrice: e.target.value })
          }
        />
      </div>

      {/* ⭐ Rating */}
      <div className="mb-4">
        <h3 className="font-medium">Rating</h3>

        <select
          onChange={(e) =>
            setFilters({ ...filters, rating: e.target.value })
          }
          className="border p-1"
        >
          <option value="">All</option>
          <option value="4">4★ & above</option>
          <option value="3">3★ & above</option>
        </select>
      </div>

      {/* 📊 Sort */}
      <div>
        <h3 className="font-medium">Sort</h3>

        <select
          onChange={(e) =>
            setFilters({ ...filters, sortBy: e.target.value })
          }
          className="border p-1"
        >
          <option value="">None</option>
          <option value="price_asc">Price Low → High</option>
          <option value="price_desc">Price High → Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>
    </div>
  );
}

export default Filters;