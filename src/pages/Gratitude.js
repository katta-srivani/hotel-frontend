import React from 'react';
import { useNavigate } from 'react-router-dom';

function Gratitude() {
  const navigate = useNavigate();

  return (
    <div className="max-w-xl mx-auto bg-white shadow-lg rounded-2xl p-8 mt-10 text-center">
      <div className="text-4xl mb-2">🙏</div>
      <h2 className="text-2xl font-bold mb-2 text-green-700">Thank You!</h2>
      <p className="text-gray-700 mb-6">Your payment and booking were completed successfully.</p>
      <div className="flex gap-3 justify-center">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => navigate('/my-bookings')}
        >
          Go to My Bookings
        </button>
        <button
          className="border border-gray-300 px-4 py-2 rounded"
          onClick={() => navigate('/')}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

export default Gratitude;
