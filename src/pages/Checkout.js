import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaCheckCircle, FaLock } from 'react-icons/fa';

function Checkout() {
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [bookingData, setBookingData] = useState(null);
  const [alreadyBooked, setAlreadyBooked] = useState(false);
  const [myBookingId, setMyBookingId] = useState(null);
  const [offers, setOffers] = useState([]);

  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState(false);

  const [coupon, setCoupon] = useState('');
  const [couponStatus, setCouponStatus] = useState('');
  const [pricing, setPricing] = useState(null);

  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '' });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    specialRequests: '',
  });

  useEffect(() => {
    const init = async () => {
      const stored = sessionStorage.getItem('bookingData');
      if (!stored) {
        navigate('/', { replace: true });
        return;
      }

      let parsed;
      try {
        parsed = JSON.parse(stored);
      } catch {
        sessionStorage.removeItem('bookingData');
        navigate('/', { replace: true });
        return;
      }

      if (!parsed?.roomId || !parsed?.checkInDate || !parsed?.checkOutDate) {
        sessionStorage.removeItem('bookingData');
        navigate('/', { replace: true });
        return;
      }

      setBookingData(parsed);
      setFormData((prev) => ({
        ...prev,
        firstName: parsed.firstName || '',
        lastName: parsed.lastName || '',
        email: parsed.email || '',
        phone: parsed.phone || '',
        address: parsed.address || '',
        specialRequests: parsed.specialRequests || '',
      }));

      try {
        const [{ data: roomRes }, { data: offerRes }] = await Promise.all([
          api.get(`/rooms/${parsed.roomId}`),
          api.get('/offers'),
        ]);

        setRoom(roomRes.data || roomRes);
        setOffers(offerRes.offers || []);
      } catch {
        setPageError('Failed to load room or offers. Please try again.');
      } finally {
        setPageLoading(false);
      }

      try {
        const { data } = await api.get('/bookings/my');
        const myBookings = data.bookings || [];
        const found = myBookings.find((b) => {
          const roomId = b.room?._id || b.room;
          return (
            roomId === parsed.roomId &&
            b.status !== 'cancelled' &&
            new Date(parsed.checkInDate) >= new Date(b.fromDate) &&
            new Date(parsed.checkInDate) <= new Date(b.toDate)
          );
        });

        setAlreadyBooked(Boolean(found));
        setMyBookingId(found?._id || null);
      } catch {
        setAlreadyBooked(false);
        setMyBookingId(null);
      }
    };

    init();
  }, [navigate]);

  const localPricing = useMemo(() => {
    if (!bookingData || !room) return null;

    const numberOfRooms = Number(bookingData.numberOfRooms) || 1;
    const pricePerNight = Number(room.pricePerNight) || 0;
    const checkIn = new Date(bookingData.checkInDate);
    const checkOut = new Date(bookingData.checkOutDate);
    const nights = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));

    const subtotal = pricePerNight * nights * numberOfRooms;
    const taxAmount = Math.round(subtotal * 0.05);
    const grossAmount = subtotal + taxAmount;

    return {
      nights,
      subtotal,
      taxAmount,
      grossAmount,
      discountAmount: 0,
      payableTotal: grossAmount,
    };
  }, [bookingData, room]);

  const effectivePricing = pricing || localPricing;

  // Validation helpers
  const validateName = (name) => /^[A-Za-z]{2,}( [A-Za-z]+)*$/.test(name.trim());
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => /^\d{10}$/.test(phone);

  const onGuestSubmit = (e) => {
    e.preventDefault();
    if (alreadyBooked) {
      toast.error('Room is already booked for these dates.');
      return;
    }
    const { firstName, lastName, email, phone } = formData;
    if (!validateName(firstName)) {
      toast.error('Enter a valid first name (letters only, min 2 chars)');
      return;
    }
    if (!validateName(lastName)) {
      toast.error('Enter a valid last name (letters only, min 2 chars)');
      return;
    }
    if (!validateEmail(email)) {
      toast.error('Enter a valid email address');
      return;
    }
    if (!validatePhone(phone)) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }
    setPaymentStep(true);
  };

  // Always include coupon code in payload
  const buildPayload = () => {
    if (!bookingData) return null;

    const guestDetails = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: (formData.address || '').trim(),
      specialRequests: (formData.specialRequests || '').trim(),
    };

    if (!guestDetails.firstName || !guestDetails.lastName || !guestDetails.email || !guestDetails.phone) {
      return null;
    }

    return {
      roomId: bookingData.roomId,
      fromDate: bookingData.checkInDate,
      toDate: bookingData.checkOutDate,
      guestDetails,
      couponCode: coupon.trim() || undefined,
    };
  };

  const applyPricingFromBookingData = (bData) => {
    if (!bData) return;

    setPricing({
      subtotal: bData.subtotal,
      taxAmount: bData.taxAmount,
      grossAmount: bData.grossAmount,
      discountAmount: bData.discountAmount || 0,
      payableTotal: bData.totalAmount,
    });
  };

  const handleApplyCoupon = async () => {
    const payload = buildPayload();
    if (!payload) {
      toast.error('Please fill guest details first');
      return;
    }

    setLoading(true);
    setCouponStatus('');
    try {
      const { data } = await api.post('/bookings', payload);
      applyPricingFromBookingData(data.bookingData);
      setCouponStatus(`Coupon applied! You saved Rs ${data.bookingData?.discountAmount || 0}`);
    } catch (err) {
      setPricing(null);
      setCouponStatus(err?.response?.data?.message || 'Invalid coupon');
    } finally {
      setLoading(false);
    }
  };

  const createBookingOrder = async () => {
    const payload = buildPayload();
    if (!payload) {
      toast.error('Please fill required guest fields');
      return null;
    }

    const { data } = await api.post('/bookings', payload);
    applyPricingFromBookingData(data.bookingData);
    return data;
  };

  // Always redirect after successful booking/payment
  const redirectOnSuccess = (bookingId) => {
    if (bookingId) {
      navigate('/billing', { state: { bookingId } });
    } else {
      navigate('/gratitude');
    }
  };

  const handleRazorpay = async () => {
    if (!window.Razorpay) {
      toast.error('Razorpay script not loaded');
      return;
    }
    try {
      setLoading(true);
      const orderData = await createBookingOrder();
      if (!orderData?.order || !orderData?.bookingData) {
        toast.error('Unable to create payment order');
        return;
      }
      const amountToPay = Number(orderData.bookingData.totalAmount || 0);
      if (!amountToPay || amountToPay <= 0) {
        toast.error('Invalid payment amount');
        return;
      }
      const options = {
        key: orderData.key,
        amount: Math.round(amountToPay * 100),
        currency: 'INR',
        name: 'Hotel Booking',
        description: `Total: Rs ${amountToPay}`,
        order_id: orderData.order.id,
        prefill: {
          email: formData.email,
          contact: formData.phone,
        },
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/bookings/verify', {
              paymentMethod: 'razorpay',
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              bookingData: {
                ...orderData.bookingData,
                guestDetails: {
                  firstName: formData.firstName,
                  lastName: formData.lastName,
                  email: formData.email,
                  phone: formData.phone,
                  address: formData.address,
                  specialRequests: formData.specialRequests,
                },
                coupon: coupon.trim() || undefined,
              },
            });
            toast.success('Payment successful!');
            redirectOnSuccess(verifyRes.data?.booking?._id);
          } catch {
            toast.error('Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => toast.error('Payment was not completed'),
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Booking creation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayment = async () => {
    if (!/^\d{16}$/.test(cardDetails.number)) {
      toast.error('Enter a valid 16-digit card number');
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiry)) {
      toast.error('Enter expiry as MM/YY');
      return;
    }
    if (!/^\d{3}$/.test(cardDetails.cvv)) {
      toast.error('Enter valid 3-digit CVV');
      return;
    }
    try {
      setLoading(true);
      const orderData = await createBookingOrder();
      if (!orderData?.bookingData) {
        toast.error('Unable to create booking order');
        return;
      }
      const verifyRes = await api.post('/bookings/verify', {
        paymentMethod: 'card',
        paymentId: `CARD_${Date.now()}`,
        bookingData: {
          ...orderData.bookingData,
          guestDetails: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            specialRequests: formData.specialRequests,
          },
          coupon: coupon.trim() || undefined,
        },
      });
      toast.success('Card payment successful!');
      redirectOnSuccess(verifyRes.data?.booking?._id);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Card payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCashPayment = async () => {
    try {
      setLoading(true);
      const orderData = await createBookingOrder();
      if (!orderData?.bookingData) {
        toast.error('Unable to create booking order');
        return;
      }
      const verifyRes = await api.post('/bookings/verify', {
        paymentMethod: 'cash',
        bookingData: {
          ...orderData.bookingData,
          guestDetails: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            specialRequests: formData.specialRequests,
          },
          coupon: coupon.trim() || undefined,
        },
      });
      toast.success('Booking confirmed!');
      redirectOnSuccess(verifyRes.data?.booking?._id);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Cash booking failed');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) return <div className="text-center mt-10">Loading...</div>;

  if (pageError) {
    return (
      <div className="text-center mt-10 px-4">
        <p className="text-red-600 mb-4">{pageError}</p>
        <button
          onClick={() => navigate('/', { replace: true })}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Back To Home
        </button>
      </div>
    );
  }

  if (!room || !bookingData || !effectivePricing) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-blue-600 hover:underline mb-4"
      >
        <FaArrowLeft /> Back
      </button>

      {!paymentStep && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white shadow-lg rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Guest Details</h2>
            <form onSubmit={onGuestSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Check-In *</label>
                  <input
                    type="date"
                    value={bookingData.checkInDate?.slice(0, 10) || ''}
                    onChange={(e) => setBookingData((prev) => ({ ...prev, checkInDate: e.target.value }))}
                    className="border p-2 rounded-lg w-full"
                    min={new Date().toISOString().slice(0, 10)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Check-Out *</label>
                  <input
                    type="date"
                    value={bookingData.checkOutDate?.slice(0, 10) || ''}
                    onChange={(e) => setBookingData((prev) => ({ ...prev, checkOutDate: e.target.value }))}
                    className="border p-2 rounded-lg w-full"
                    min={bookingData.checkInDate || new Date().toISOString().slice(0, 10)}
                    required
                  />
                </div>
              </div>

              {offers.length > 0 && (
                <div>
                  <div className="font-semibold text-sm mb-1 text-blue-700">Available Offers:</div>
                  <div className="flex flex-wrap gap-2">
                    {offers.map((offer) => (
                      <button
                        key={offer._id}
                        type="button"
                        className="border border-blue-500 bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs hover:bg-blue-100"
                        onClick={() => setCoupon(offer.code)}
                        disabled={loading}
                      >
                        {offer.code}: {offer.discountType === 'flat'
                          ? `Rs ${offer.discountValue ?? offer.flatDiscount ?? 0} OFF`
                          : `${offer.discountValue ?? offer.discountPercentage ?? 0}% OFF`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Coupon code (optional)"
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  className="border p-2 rounded-lg w-full max-w-xs"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="bg-blue-500 text-white px-3 py-1 rounded"
                  disabled={loading || !coupon}
                >
                  Apply
                </button>
                {couponStatus && <span className="text-green-600 text-sm">{couponStatus}</span>}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <input name="firstName" placeholder="First Name *" value={formData.firstName} onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))} className="border p-2 rounded-lg w-full" />
                <input name="lastName" placeholder="Last Name *" value={formData.lastName} onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))} className="border p-2 rounded-lg w-full" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <input name="email" placeholder="Email *" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} className="border p-2 rounded-lg w-full" />
                <input name="phone" placeholder="Phone *" value={formData.phone} onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))} className="border p-2 rounded-lg w-full" />
              </div>
              <textarea name="address" placeholder="Address (optional)" value={formData.address} onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))} className="border p-2 rounded-lg w-full" />
              <textarea name="specialRequests" placeholder="Special Requests" value={formData.specialRequests} onChange={(e) => setFormData((p) => ({ ...p, specialRequests: e.target.value }))} className="border p-2 rounded-lg w-full" />

              <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2" disabled={loading || alreadyBooked}>
                {alreadyBooked ? 'Already Booked' : (loading ? 'Processing...' : (<><FaLock /> Confirm Guest Details</>))}
              </button>

              {alreadyBooked && myBookingId && (
                <button
                  type="button"
                  className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                  onClick={async () => {
                    try {
                      await api.delete(`/bookings/${myBookingId}`);
                      toast.success('Booking cancelled');
                      setAlreadyBooked(false);
                      setMyBookingId(null);
                    } catch {
                      toast.error('Failed to cancel booking');
                    }
                  }}
                >
                  Cancel Booking
                </button>
              )}
            </form>
          </div>

          <div className="bg-white shadow-lg rounded-2xl p-6 sticky top-6 h-fit">
            <h3 className="font-semibold mb-3">Booking Summary</h3>
            <img src={room.imageUrls?.[0] || 'https://via.placeholder.com/200'} alt={room.title} className="rounded-lg mb-3" />
            <p className="font-medium">{room.title}</p>
            <p className="text-sm text-gray-500">{room.roomType}</p>
            <div className="border-t my-3" />
            <div className="flex justify-between text-sm"><span>Room Amount</span><span>Rs {effectivePricing.subtotal}</span></div>
            <div className="flex justify-between text-sm"><span>Tax</span><span>Rs {effectivePricing.taxAmount}</span></div>
            <div className="flex justify-between text-sm"><span>Initial Amount</span><span>Rs {effectivePricing.grossAmount}</span></div>
            <div className="flex justify-between text-sm text-green-700"><span>Offer Discount</span><span>-Rs {effectivePricing.discountAmount}</span></div>
            <div className="flex justify-between font-bold text-lg mt-2"><span>Total Payable</span><span>Rs {effectivePricing.payableTotal}</span></div>
            <div className="mt-4 flex items-center gap-2 text-green-600 text-sm"><FaCheckCircle /> Secure payment</div>
          </div>
        </div>
      )}

      {paymentStep && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white shadow-lg rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
            <div className="flex gap-2 mb-4">
              <button onClick={handleRazorpay} className={`border px-4 py-2 rounded-lg hover:bg-gray-100 ${loading ? 'opacity-50' : ''}`} disabled={loading}>Razorpay</button>
              <button onClick={handleCardPayment} className={`border px-4 py-2 rounded-lg hover:bg-gray-100 ${loading ? 'opacity-50' : ''}`} disabled={loading}>Card</button>
              <button onClick={handleCashPayment} className={`border px-4 py-2 rounded-lg hover:bg-gray-100 ${loading ? 'opacity-50' : ''}`} disabled={loading}>Cash</button>
            </div>

            <div className="space-y-2">
              <input name="number" placeholder="Card Number (16 digits)" className="border p-2 rounded-lg w-full" onChange={(e) => setCardDetails((p) => ({ ...p, number: e.target.value }))} maxLength={16} />
              <input name="expiry" placeholder="Expiry (MM/YY)" className="border p-2 rounded-lg w-full" onChange={(e) => setCardDetails((p) => ({ ...p, expiry: e.target.value }))} maxLength={5} />
              <input name="cvv" placeholder="CVV (3 digits)" className="border p-2 rounded-lg w-full" onChange={(e) => setCardDetails((p) => ({ ...p, cvv: e.target.value }))} maxLength={3} />
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-2xl p-6 sticky top-6 h-fit">
            <h3 className="font-semibold mb-3">Booking Summary</h3>
            <p>{room.title}</p>
            <p className="text-sm">{room.roomType}</p>
            <div className="border-t my-3" />
            <div className="flex justify-between text-sm"><span>Initial Amount</span><span>Rs {effectivePricing.grossAmount}</span></div>
            <div className="flex justify-between text-sm text-green-700"><span>Offer Discount</span><span>-Rs {effectivePricing.discountAmount}</span></div>
            <div className="flex justify-between font-bold"><span>Total Payable</span><span>Rs {effectivePricing.payableTotal}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Checkout;
