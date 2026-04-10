import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';

function Billing() {
  const location = useLocation();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  // Try to get bookingId from state or params
  const bookingId = location.state?.bookingId || location.search.replace('?id=', '');

  useEffect(() => {
    if (!bookingId) {
      navigate('/my-bookings');
      return;
    }
    const fetchBooking = async () => {
      try {
        const { data } = await api.get(`/bookings/${bookingId}`);
        setBooking(data.booking || data.data);
      } catch {
        setBooking(null);
      }
      setLoading(false);
    };
    fetchBooking();
  }, [bookingId, navigate]);

  if (loading) return <div className="text-center mt-10">Loading billing details...</div>;
  if (!booking) return <div className="text-center mt-10 text-red-600">Booking not found.</div>;

  return (
    <div className="max-w-xl mx-auto bg-white shadow-lg rounded-2xl p-8 mt-10 text-center">
      <div className="text-4xl mb-2">🎉</div>
      <h2 className="text-2xl font-bold mb-2 text-green-700">Payment Successful!</h2>
      <div className="text-lg font-semibold mb-4 text-blue-700">Hammayya! Your booking is confirmed. Cheers! 🥳</div>
      <h3 className="text-lg font-semibold mb-2">Booking Receipt</h3>
      <div className="mb-2">Booking ID: <span className="font-mono">{booking._id}</span></div>
      <div className="mb-2">Room: <span className="font-semibold">{booking.room?.title || booking.room}</span></div>
      <div className="mb-2">Check-in: {new Date(booking.fromDate).toLocaleDateString()}</div>
      <div className="mb-2">Check-out: {new Date(booking.toDate).toLocaleDateString()}</div>
      {typeof booking.grossAmount === 'number' && (
        <div className="mb-2">Initial Amount: <span className="font-semibold">₹{booking.grossAmount}</span></div>
      )}
      {typeof booking.discountAmount === 'number' && booking.discountAmount > 0 && (
        <div className="mb-2 text-green-700">Offer Discount: <span className="font-semibold">-₹{booking.discountAmount}</span></div>
      )}
      <div className="mb-2">Total Amount: <span className="font-bold">₹{booking.totalAmount}</span></div>
      <div className="mb-2">Payment Method: {booking.paymentMethod}</div>
      <div className="mb-2">Status: <span className="font-semibold text-green-600">{booking.status}</span></div>
      <button className="mt-6 bg-blue-600 text-white px-4 py-2 rounded" onClick={() => navigate('/my-bookings')}>Go to My Bookings</button>
    </div>
  );
}

export default Billing;
