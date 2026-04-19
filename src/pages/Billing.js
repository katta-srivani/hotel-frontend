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

  // Redirect to Gratitude page immediately after payment success
  // Remove auto-redirect to gratitude page so user can see the bill
  // useEffect(() => {
  //   if (!loading && booking) {
  //     navigate('/gratitude');
  //   }
  // }, [loading, booking, navigate]);

  if (loading) return <div className="text-center mt-10">Loading billing details...</div>;
  if (!booking) return <div className="text-center mt-10 text-red-600">Booking not found.</div>;

  return (
    <div className="max-w-sm mx-auto bg-white shadow-xl rounded-2xl mt-28 border border-blue-100 overflow-hidden">
      <div className="flex flex-col items-center pt-10 pb-4">
        <div className="bg-blue-100 rounded-full p-4 mb-3 shadow-sm">
          <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="#dbeafe"/><path strokeLinecap="round" strokeLinejoin="round" d="M8 12.5l3 3 5-5" /></svg>
        </div>
        <h2 className="text-2xl font-extrabold mb-1 text-green-700">Payment Successful</h2>
        <div className="text-base font-medium mb-2 text-gray-500">Your booking is confirmed.</div>
      </div>
      <div className="px-8 pb-8">
        <div className="space-y-4 text-gray-700 text-base">
          <div className="flex justify-between border-b pb-2"><span className="font-semibold">Booking ID:</span><span className="font-mono">{booking._id}</span></div>
          <div className="flex justify-between border-b pb-2"><span className="font-semibold">Room:</span><span>{booking.room?.title || booking.room}</span></div>
          <div className="flex justify-between border-b pb-2"><span className="font-semibold">Check-in:</span><span>{new Date(booking.fromDate).toLocaleDateString()}</span></div>
          <div className="flex justify-between border-b pb-2"><span className="font-semibold">Check-out:</span><span>{new Date(booking.toDate).toLocaleDateString()}</span></div>
          <div className="flex justify-between border-b pb-2"><span className="font-semibold">Total Amount:</span><span className="font-bold text-green-700">₹{booking.totalAmount}</span></div>
          <div className="flex justify-between border-b pb-2"><span className="font-semibold">Payment Method:</span><span className="capitalize">{booking.paymentMethod}</span></div>
          <div className="flex justify-between"><span className="font-semibold">Status:</span><span className="font-bold text-green-600">{booking.status}</span></div>
        </div>
        <div className="text-center text-blue-700 font-semibold text-base mt-8 mb-2">
          Thank you for booking with us!<br />
          <span className="text-green-700 font-bold">Travelerly Team</span>
        </div>
      </div>
    </div>
  );
}

export default Billing;
