import React, { useEffect, useState } from "react";
import api from "../utils/api";

function Offers() {
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    const res = await api.get("/offers");
    setOffers(res.data.offers);
  };

  return (
    <div className="p-6 grid md:grid-cols-3 gap-6">
      {offers.map((offer) => (
        <div
          key={offer._id}
          className="bg-white shadow-lg rounded-2xl p-5 border hover:shadow-xl transition"
        >
          <h2 className="text-xl font-bold">{offer.title}</h2>

          <p className="text-gray-600 mt-2">{offer.description}</p>

          <div className="mt-3 text-green-600 font-semibold">
            {offer.discount}% OFF
          </div>

          <p className="text-sm text-gray-400 mt-2">
            Valid till: {new Date(offer.validTill).toDateString()}
          </p>

          <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700">
            Apply Offer
          </button>
        </div>
      ))}
    </div>
  );
}

export default Offers;