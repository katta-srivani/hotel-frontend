import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaCheckCircle, FaLock } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { fallbackRoomImage, getSafeImageUrl } from '../utils/image';

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

const notifyEmailStatus = (status) => {
  if (!status || status === 'skipped') {
    return;
  }

  if (status === 'sent') {
    toast.success('Confirmation email sent');
    return;
  }

  if (status === 'partial') {
    toast('Confirmation email sent to some recipients only');
    return;
  }

  toast.error('Payment was recorded, but the confirmation email was not accepted by the mail server');
};

const notifyPaymentSuccessStatus = (emailStatus, notificationCreated) => {
  if (emailStatus === 'sent') {
    toast.success(
      notificationCreated === false
        ? 'Payment successful. Confirmation email sent.'
        : 'Payment successful. Confirmation email sent and notification created.'
    );
    return;
  }

  if (emailStatus === 'partial') {
    toast.success(
      notificationCreated === false
        ? 'Payment successful. Email sent to some recipients.'
        : 'Payment successful. Notification created and email sent to some recipients.'
    );
    return;
  }

  toast.success(
    notificationCreated === false
      ? 'Payment successful.'
      : 'Payment successful. Notification created.'
  );
  notifyEmailStatus(emailStatus);
};

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
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    specialRequests: '',
  });

  const effectivePricing = pricing || localPricing;

  const syncPricingPreview = async (payload) => {
    const previewPayload = payload || buildPayload();

    if (!previewPayload) {
      return null;
    }

    const { data } = await api.post('/bookings', previewPayload);
    const booking = data?.bookingData;

    if (booking) {
      setPricing({
        subtotal: booking.subtotal,
        taxAmount: booking.taxAmount,
        grossAmount: booking.grossAmount,
        discountAmount: booking.discountAmount || 0,
        payableTotal: booking.totalAmount,
      });
    }

    return booking || null;
  };

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
    const taxAmount = Math.round(subtotal * 0.05);
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
        firstName: parsed.guestDetails?.firstName || parsed.firstName || '',
        lastName: parsed.guestDetails?.lastName || parsed.lastName || '',
        email: parsed.guestDetails?.email || parsed.email || '',
        phone: parsed.guestDetails?.phone || parsed.phone || '',
        address: parsed.guestDetails?.address || parsed.address || '',
        specialRequests: parsed.guestDetails?.specialRequests || parsed.specialRequests || '',
      });

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

    if (!bookingData.checkInDate || !bookingData.checkOutDate) {
      return null;
    }

    const checkIn = new Date(bookingData.checkInDate);
    const checkOut = new Date(bookingData.checkOutDate);
    if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime()) || checkOut <= checkIn) {
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

    const payload = buildPayload();

    if (!payload) {
      toast.error('Please fill all required guest details');
      return;
    }

    setLoading(true);
    syncPricingPreview(payload)
      .then(() => {
        setPaymentStep(true);
      })
      .catch((err) => {
        toast.error(err?.response?.data?.message || 'Failed to prepare booking summary');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleCancelBooking = async () => {
    if (!myBookingId) {
      toast.error('No booking ID found. Cannot cancel.');
      return;
    }

    try {
      const { data } = await api.delete(`/bookings/${myBookingId}`);
      toast.success('Booking cancelled');
      if (data?.notification) {
        window.dispatchEvent(
          new CustomEvent('app:notification-created', {
            detail: { notification: data.notification },
          })
        );
      }
      window.dispatchEvent(new Event('app:notifications-updated'));
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
      await syncPricingPreview(payload);
      const { data } = await api.post('/bookings', {
        ...payload,
        paymentMethod: 'cash',
      });

      toast.success('Cash booking confirmed');
      notifyEmailStatus(data?.emailStatus);
      if (data?.notification) {
        window.dispatchEvent(
          new CustomEvent('app:notification-created', {
            detail: { notification: data.notification },
          })
        );
      }
      window.dispatchEvent(new Event('app:notifications-updated'));
      sessionStorage.removeItem('bookingData');
      navigate('/gratitude', {
        state: {
          title: 'Booking Confirmed, Payment Pending',
          message:
            'Your cash booking has been created, and you can complete the payment using Razorpay whenever you are ready.',
          bookingId: data?.booking?._id || '',
        },
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to confirm cash booking');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleOnlinePayment = async (provider = 'Razorpay') => {
    const payload = buildPayload();

    if (!payload) {
      toast.error('Please fill all required guest details');
      return;
    }

    setSelectedPayment('Online');
    setPaymentProcessing(true);

    try {
      await syncPricingPreview(payload);
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        throw new Error('Failed to load Razorpay checkout');
      }

      const { data } = await api.post('/bookings', {
        ...payload,
        paymentMethod: 'online',
      });

      notifyEmailStatus(data?.emailStatus);
      if (data?.notification) {
        window.dispatchEvent(
          new CustomEvent('app:notification-created', {
            detail: { notification: data.notification },
          })
        );
      }

      if (!data?.order?.id || !data?.key) {
        throw new Error('Razorpay is not configured on the server');
      }

      if (data?.bookingData?.bookingId) {
        sessionStorage.setItem(
          'bookingData',
          JSON.stringify({
            ...bookingData,
            bookingId: data.bookingData.bookingId,
          })
        );
      }

      const pendingBookingId = data?.bookingId || data?.booking?._id || data?.bookingData?.bookingId || bookingData?.bookingId;

      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency || 'INR',
        name: 'Hotel Booking',
        description:
          provider === 'Card'
            ? `${room?.title || 'Room booking'} - Card Payment`
            : `${room?.title || 'Room booking'} - Razorpay Payment`,
        order_id: data.order.id,
        prefill: {
          name: `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
          email: formData.email || '',
          contact: formData.phone || '',
        },
        theme: {
          color: '#2563eb',
        },
        handler: async (response) => {
          try {
            const verifyPayload = {
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            };

            const verifyRes = pendingBookingId
              ? await api.post(`/bookings/${pendingBookingId}/verify-payment`, verifyPayload)
              : await api.post('/bookings/verify', {
                  ...verifyPayload,
                  bookingData: data.bookingData,
                });

            let ensuredNotification = verifyRes?.data?.notification || null;
            const verifiedBookingId = verifyRes.data?.booking?._id || '';
            if (!ensuredNotification && verifiedBookingId) {
              try {
                const notificationRes = await api.post(
                  `/notifications/payment-success/${verifiedBookingId}`
                );
                ensuredNotification = notificationRes?.data?.notification || null;
              } catch (notificationError) {
                console.error(
                  'Failed to ensure payment notification:',
                  notificationError?.response?.data || notificationError.message
                );
              }
            }

            let ensuredEmailStatus = verifyRes?.data?.emailStatus || null;
            if (ensuredEmailStatus !== 'sent' && verifiedBookingId) {
              try {
                const emailRes = await api.post(
                  `/bookings/${verifiedBookingId}/resend-confirmation-email`
                );
                ensuredEmailStatus = emailRes?.data?.emailStatus || ensuredEmailStatus;
              } catch (emailError) {
                console.error(
                  'Failed to ensure booking confirmation email:',
                  emailError?.response?.data || emailError.message
                );
              }
            }

            notifyPaymentSuccessStatus(
              ensuredEmailStatus,
              verifyRes?.data?.notificationCreated ?? Boolean(ensuredNotification)
            );
            if (ensuredNotification) {
              window.dispatchEvent(
                new CustomEvent('app:notification-created', {
                  detail: { notification: ensuredNotification },
                })
              );
            }
            window.dispatchEvent(new Event('app:notifications-updated'));
            await api.get('/notifications');
            sessionStorage.removeItem('bookingData');
            navigate('/gratitude', {
              state: {
                title: 'Booking Confirmed',
                message: `Your booking for ${room?.title || 'the selected room'} is confirmed.`,
                bookingId: verifyRes.data?.booking?._id || '',
                notification: ensuredNotification,
                notificationCreated:
                  verifyRes.data?.notificationCreated ?? Boolean(ensuredNotification),
              },
            });
          } catch (err) {
            toast.error(err?.response?.data?.message || 'Payment verification failed');
          } finally {
            setPaymentProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setPaymentProcessing(false);
      toast.error(err?.response?.data?.message || err.message || 'Failed to start payment');
    }
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
              src={getSafeImageUrl(room?.imageUrls?.[0], fallbackRoomImage)}
              alt={room?.title || 'Room'}
              className="rounded-lg mb-3"
              onError={(e) => {
                e.currentTarget.src = fallbackRoomImage;
              }}
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
            <h2 className="text-xl font-semibold mb-4">Payment Method</h2>

            <div className="space-y-4">
              <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">Cash</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Pay directly at the hotel during check-in.
                    </p>
                  </div>
                  <span className="rounded-full bg-yellow-200 px-3 py-1 text-xs font-semibold text-yellow-800">
                    Available
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCashPayment}
                  className="w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600"
                  disabled={paymentProcessing}
                >
                  {paymentProcessing && selectedPayment === 'Cash'
                    ? 'Processing...'
                    : 'Proceed to Payment'}
                </button>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">Pay Online</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Choose Razorpay or Card to pay securely online.
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-200 px-3 py-1 text-xs font-semibold text-blue-800">
                    Online
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleOnlinePayment('Razorpay')}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                    disabled={paymentProcessing}
                  >
                    {paymentProcessing && selectedPayment === 'Online'
                      ? 'Opening Razorpay...'
                      : 'Razorpay'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOnlinePayment('Card')}
                    className="w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800"
                    disabled={paymentProcessing}
                  >
                    {paymentProcessing && selectedPayment === 'Online'
                      ? 'Opening Card Payment...'
                      : 'Card'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-lg rounded-2xl p-6 sticky top-6 h-fit">
            <h3 className="font-semibold mb-3">Booking Summary</h3>
            <img
              src={getSafeImageUrl(room?.imageUrls?.[0], fallbackRoomImage)}
              alt={room?.title || 'Room'}
              className="rounded-lg mb-3"
              onError={(e) => {
                e.currentTarget.src = fallbackRoomImage;
              }}
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
