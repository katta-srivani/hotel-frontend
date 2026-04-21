import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaCheckCircle, FaLock } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

function Checkout() {
  const { isAuthenticated, loading: authLoading } = useContext(AuthContext);
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
  const [localPricing, setLocalPricing] = useState({
    subtotal: 0,
    taxAmount: 0,
    grossAmount: 0,
    discountAmount: 0,
    payableTotal: 0,
  });

  const [selectedPayment, setSelectedPayment] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
  });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    specialRequests: '',
  });

  const effectivePricing = pricing || localPricing;

  useEffect(() => {
    if (!bookingData || !room) {
      return;
    }

    const nights =
      bookingData.checkInDate && bookingData.checkOutDate
        ? Math.max(
            1,
            Math.ceil(
              (new Date(bookingData.checkOutDate) - new Date(bookingData.checkInDate)) /
                (1000 * 60 * 60 * 24)
            )
          )
        : 1;

    const pricePerNight = Number(room.pricePerNight || 0);
    const subtotal = pricePerNight * nights;
    const taxAmount = Math.round(subtotal * 0.12);
    const grossAmount = subtotal + taxAmount;
    const discountAmount = 0;
    const payableTotal = grossAmount - discountAmount;

    setLocalPricing({
      subtotal,
      taxAmount,
      grossAmount,
      discountAmount,
      payableTotal,
    });
  }, [bookingData, room]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error('Please login to continue booking.');
      navigate('/login', { replace: true });
      return;
    }

    const init = async () => {
      const stored = sessionStorage.getItem('bookingData');

      if (!stored) {
        setPageError('No booking data found.');
        setPageLoading(false);
        return;
      }

      const parsed = JSON.parse(stored);
      setBookingData(parsed);
      setFormData({
        firstName: parsed.firstName || '',
        lastName: parsed.lastName || '',
        email: parsed.email || '',
        phone: parsed.phone || '',
        address: parsed.address || '',
        specialRequests: parsed.specialRequests || '',
      });

      if (parsed.preferredPayment === 'cash') {
        setPaymentStep(true);
        setSelectedPayment('Cash');
      }

      if (Array.isArray(parsed.offers)) {
        setOffers(parsed.offers);
      }

      if (parsed?.roomId) {
        try {
          const { data } = await api.get(`/rooms/${parsed.roomId}`);
          setRoom(data.data || data);
        } catch (err) {
          setRoom(null);
          toast.error('Failed to load room details');
        }
      }

      setPageLoading(false);
    };

    init();
  }, [authLoading, isAuthenticated, navigate]);

  const buildPayload = () => {
    if (!bookingData) {
      return null;
    }

    const guest = formData;
    if (!guest.firstName || !guest.lastName || !guest.email || !guest.phone) {
      return null;
    }

    return {
      roomId: bookingData.roomId,
      fromDate: bookingData.checkInDate,
      toDate: bookingData.checkOutDate,
      guestDetails: {
        firstName: guest.firstName.trim(),
        lastName: guest.lastName.trim(),
        email: guest.email.trim(),
        phone: guest.phone.trim(),
        address: guest.address?.trim() || '',
        specialRequests: guest.specialRequests?.trim() || '',
      },
      couponCode: coupon.trim() || undefined,
    };
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
      const booking = data?.bookingData;

      if (booking) {
        setPricing({
          subtotal: booking.subtotal,
          taxAmount: booking.taxAmount,
          grossAmount: booking.grossAmount,
          discountAmount: booking.discountAmount || 0,
          payableTotal: booking.totalAmount,
        });
        setCouponStatus(`Saved Rs ${booking.discountAmount || 0}`);
      }
    } catch (err) {
      setPricing(null);
      setCouponStatus(err?.response?.data?.message || 'Invalid coupon');
    } finally {
      setLoading(false);
    }
  };

  const onGuestSubmit = (e) => {
    e.preventDefault();

    if (!buildPayload()) {
      toast.error('Please fill all required guest details');
      return;
    }

    setPaymentStep(true);
  };

  const handleCancelBooking = async () => {
    if (!myBookingId) {
      toast.error('No booking ID found. Cannot cancel.');
      return;
    }

    try {
      await api.delete(`/bookings/${myBookingId}`);
      toast.success('Booking cancelled');
      setAlreadyBooked(false);
      setMyBookingId(null);
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error('Booking not found or already cancelled.');
      } else {
        toast.error('Failed to cancel booking');
      }
    }
  };

  const handleCashPayment = async () => {
      const payload = buildPayload();

    if (!payload) {
      toast.error('Please fill all required guest details');
      return;
    }

    setSelectedPayment('Cash');
    setPaymentProcessing(true);

    try {
      const { data } = await api.post('/bookings', {
        ...payload,
        paymentMethod: 'cash',
      });

      toast.success('Cash booking confirmed');
      sessionStorage.removeItem('bookingData');
      navigate(`/billing?id=${data?.booking?._id}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to confirm cash booking');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleRazorpayPayment = async (source = 'Razorpay') => {
    const payload = buildPayload();

    if (!payload) {
      toast.error('Please fill all required guest details');
      return;
    }

    setSelectedPayment(source);
    setPaymentProcessing(true);

    try {
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      const { data } = await api.post('/bookings', {
        ...payload,
        paymentMethod: 'online',
      });

      if (!data?.order?.id || !data?.key) {
        throw new Error('Razorpay is not configured on the server');
      }

      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency || 'INR',
        name: 'Hotel Booking',
        description: room?.title || 'Room booking payment',
        order_id: data.order.id,
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          contact: formData.phone,
        },
        notes: {
          roomId: bookingData?.roomId || '',
          checkInDate: bookingData?.checkInDate || '',
          checkOutDate: bookingData?.checkOutDate || '',
        },
        theme: {
          color: '#2563eb',
        },
        handler: async (response) => {
          try {
            const verifyRes = await api.post('/bookings/verify', {
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              bookingData: data.bookingData,
            });

            toast.success('Payment successful and booking confirmed');
            sessionStorage.removeItem('bookingData');
            navigate(`/billing?id=${verifyRes.data?.booking?._id}`);
          } catch (err) {
            toast.error(err?.response?.data?.message || 'Payment verification failed');
          } finally {
            setPaymentProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentProcessing(false);
            toast.error('Payment cancelled');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setPaymentProcessing(false);
      toast.error(err?.response?.data?.message || err.message || 'Failed to start Razorpay');
    }
  };

  const handleCardPayment = () => {
    if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv) {
      toast.error('Please fill card details');
      return;
    }

    handleRazorpayPayment('Card');
  };

  if (pageLoading) {
    return <div className="max-w-6xl mx-auto px-4 py-8">Loading checkout...</div>;
  }

  if (pageError) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-red-600">{pageError}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-blue-600 hover:underline mb-4"
      >
        <FaArrowLeft /> Back
      </button>

      {!paymentStep ? (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white shadow-lg rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Guest Details</h2>

            <form onSubmit={onGuestSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Check-In *</label>
                  <input
                    type="date"
                    value={bookingData?.checkInDate ? bookingData.checkInDate.slice(0, 10) : ''}
                    onChange={(e) =>
                      setBookingData((prev) => ({ ...prev, checkInDate: e.target.value }))
                    }
                    className="border p-2 rounded-lg w-full"
                    min={new Date().toISOString().slice(0, 10)}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Check-Out *</label>
                  <input
                    type="date"
                    value={bookingData?.checkOutDate ? bookingData.checkOutDate.slice(0, 10) : ''}
                    onChange={(e) =>
                      setBookingData((prev) => ({ ...prev, checkOutDate: e.target.value }))
                    }
                    className="border p-2 rounded-lg w-full"
                    min={
                      bookingData?.checkInDate
                        ? bookingData.checkInDate.slice(0, 10)
                        : new Date().toISOString().slice(0, 10)
                    }
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
                        key={offer._id || offer.code}
                        type="button"
                        className="border border-blue-500 bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs hover:bg-blue-100"
                        onClick={() => setCoupon(offer.code)}
                        disabled={loading}
                      >
                        {offer.code}:{' '}
                        {offer.discountType === 'flat'
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
                <input
                  name="firstName"
                  placeholder="First Name *"
                  value={formData.firstName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                  className="border p-2 rounded-lg w-full"
                />
                <input
                  name="lastName"
                  placeholder="Last Name *"
                  value={formData.lastName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                  className="border p-2 rounded-lg w-full"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <input
                  name="email"
                  placeholder="Email *"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="border p-2 rounded-lg w-full"
                />
                <input
                  name="phone"
                  placeholder="Phone *"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="border p-2 rounded-lg w-full"
                />
              </div>

              <textarea
                name="address"
                placeholder="Address (optional)"
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                className="border p-2 rounded-lg w-full"
              />

              <textarea
                name="specialRequests"
                placeholder="Special Requests"
                value={formData.specialRequests}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, specialRequests: e.target.value }))
                }
                className="border p-2 rounded-lg w-full"
              />

              <button
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                disabled={loading || alreadyBooked}
              >
                {alreadyBooked ? (
                  'Already Booked'
                ) : loading ? (
                  'Processing...'
                ) : (
                  <>
                    <FaLock /> Confirm Guest Details
                  </>
                )}
              </button>

              {alreadyBooked && myBookingId && (
                <button
                  type="button"
                  className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
                  onClick={handleCancelBooking}
                >
                  Cancel Booking
                </button>
              )}
            </form>
          </div>

          <div className="bg-white shadow-lg rounded-2xl p-6 sticky top-6 h-fit">
            <h3 className="font-semibold mb-3">Booking Summary</h3>
            <img
              src={
                room?.imageUrls
                  ? room.imageUrls[0] || 'https://via.placeholder.com/200'
                  : 'https://via.placeholder.com/200'
              }
              alt={room?.title || 'Room'}
              className="rounded-lg mb-3"
            />
            <p className="font-medium">{room?.title || ''}</p>
            <p className="text-sm text-gray-500">{room?.roomType || ''}</p>
            <div className="border-t my-3" />
            <div className="flex justify-between text-sm">
              <span>Room Amount</span>
              <span>Rs {effectivePricing.subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span>Rs {effectivePricing.taxAmount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Initial Amount</span>
              <span>Rs {effectivePricing.grossAmount}</span>
            </div>
            <div className="flex justify-between text-sm text-green-700">
              <span>Offer Discount</span>
              <span>-Rs {effectivePricing.discountAmount}</span>
            </div>
            <div className="flex justify-between font-bold text-lg mt-2">
              <span>Total Payable</span>
              <span>Rs {effectivePricing.payableTotal}</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-green-600 text-sm">
              <FaCheckCircle /> Secure payment
            </div>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white shadow-lg rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-4">Select Payment Method</h2>

            <div className="space-y-4">
              <button
                type="button"
                onClick={handleRazorpayPayment}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                disabled={paymentProcessing}
              >
                {paymentProcessing && selectedPayment === 'Razorpay'
                  ? 'Processing...'
                  : 'Pay with Razorpay'}
              </button>

              <div className="border rounded-lg p-4 space-y-3">
                <button
                  type="button"
                  onClick={() => setSelectedPayment('Card')}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  disabled={paymentProcessing}
                >
                  Pay with Card
                </button>

                {selectedPayment === 'Card' && (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Card Number"
                      value={cardDetails.number}
                      onChange={(e) =>
                        setCardDetails((prev) => ({ ...prev, number: e.target.value }))
                      }
                      className="border p-2 rounded-lg w-full"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardDetails.expiry}
                        onChange={(e) =>
                          setCardDetails((prev) => ({ ...prev, expiry: e.target.value }))
                        }
                        className="border p-2 rounded-lg w-full"
                      />
                      <input
                        type="password"
                        placeholder="CVV"
                        value={cardDetails.cvv}
                        onChange={(e) =>
                          setCardDetails((prev) => ({ ...prev, cvv: e.target.value }))
                        }
                        className="border p-2 rounded-lg w-full"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCardPayment}
                      className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                      disabled={paymentProcessing}
                    >
                      {paymentProcessing && selectedPayment === 'Card'
                        ? 'Processing...'
                        : 'Confirm Card Payment'}
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleCashPayment}
                className="w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600"
                disabled={paymentProcessing}
              >
                {paymentProcessing && selectedPayment === 'Cash'
                  ? 'Processing...'
                  : 'Pay with Cash'}
              </button>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-2xl p-6 sticky top-6 h-fit">
            <h3 className="font-semibold mb-3">Booking Summary</h3>
            <img
              src={
                room?.imageUrls
                  ? room.imageUrls[0] || 'https://via.placeholder.com/200'
                  : 'https://via.placeholder.com/200'
              }
              alt={room?.title || 'Room'}
              className="rounded-lg mb-3"
            />
            <p className="font-medium">{room?.title || ''}</p>
            <p className="text-sm text-gray-500">{room?.roomType || ''}</p>
            <div className="border-t my-3" />
            <div className="flex justify-between text-sm">
              <span>Room Amount</span>
              <span>Rs {effectivePricing.subtotal}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span>Rs {effectivePricing.taxAmount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Initial Amount</span>
              <span>Rs {effectivePricing.grossAmount}</span>
            </div>
            <div className="flex justify-between text-sm text-green-700">
              <span>Offer Discount</span>
              <span>-Rs {effectivePricing.discountAmount}</span>
            </div>
            <div className="flex justify-between font-bold text-lg mt-2">
              <span>Total Payable</span>
              <span>Rs {effectivePricing.payableTotal}</span>
            </div>
            <div className="mt-4 flex items-center gap-2 text-green-600 text-sm">
              <FaCheckCircle /> Secure payment
            </div>
          </div>
        </div>
      )}
    </div>
  );

}

export default Checkout;
