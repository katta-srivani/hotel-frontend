import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';

function Offers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await api.get('/offers');
        setOffers(res.data?.offers || []);
      } catch (error) {
        toast.error('Failed to load offers');
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  if (loading) {
    return <div className="p-6">Loading offers...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Special Offers</h1>
        <p className="text-gray-500 mt-2">Use these promo codes during checkout.</p>
      </div>

      {offers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-6 text-gray-500">No active offers right now.</div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {offers.map((offer) => {
            const discountLabel =
              offer.discountType === 'flat'
                ? `Flat Rs ${offer.discountValue} OFF`
                : `${offer.discountValue}% OFF`;

            return (
              <div
                key={offer._id}
                className="bg-white shadow-lg rounded-2xl p-5 border hover:shadow-xl transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{offer.code}</h2>
                    <p className="text-gray-600 mt-2">{discountLabel}</p>
                  </div>
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                    Active
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <p>Minimum booking amount: Rs {offer.minAmount || 0}</p>
                  {offer.maxDiscount ? <p>Maximum discount: Rs {offer.maxDiscount}</p> : null}
                  <p>Usage limit: {offer.usageLimit || 0}</p>
                  <p>Valid till: {new Date(offer.expiryDate).toLocaleDateString()}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(offer.code);
                    toast.success(`${offer.code} copied`);
                  }}
                  className="mt-5 w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700"
                >
                  Copy Code
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Offers;
