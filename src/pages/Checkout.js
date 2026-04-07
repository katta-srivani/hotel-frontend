// src/pages/Checkout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaLock, FaCheckCircle } from 'react-icons/fa';

function Checkout() {
        const [offers, setOffers] = useState([]);
    const [alreadyBooked, setAlreadyBooked] = useState(false);
    const [myBookingId, setMyBookingId] = useState(null);
    const navigate = useNavigate();
    const [bookingData, setBookingData] = useState(null);
    const [room, setRoom] = useState(null);

    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', phone: '', address: '', specialRequests: ''
    });

    const [paymentStep, setPaymentStep] = useState(false);
    const [cardDetails, setCardDetails] = useState({ number:'', expiry:'', cvv:'' });
    const [coupon, setCoupon] = useState('');
    const [discountedTotal, setDiscountedTotal] = useState(null);
    const [couponStatus, setCouponStatus] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const data = sessionStorage.getItem('bookingData');
        if (!data) navigate('/');
        const parsed = JSON.parse(data);
        setBookingData(parsed);
        // Pre-fill guest details if present in sessionStorage
        setFormData({
            firstName: parsed.firstName || '',
            lastName: parsed.lastName || '',
            email: parsed.email || '',
            phone: parsed.phone || '',
            address: parsed.address || '',
            specialRequests: parsed.specialRequests || ''
        });
        fetchRoom(parsed.roomId);

        // Fetch available offers
        const fetchOffers = async () => {
            try {
                const res = await api.get('/offers');
                setOffers(res.data.offers || []);
            } catch {
                setOffers([]);
            }
        };
        fetchOffers();

        const checkAlreadyBooked = async () => {
            try {
                const res = await api.get(`/bookings/my`);
                const myBookings = res.data.bookings || [];
                const found = myBookings.find(b =>
                    b.room === parsed.roomId &&
                    b.status !== 'cancelled' &&
                    new Date(parsed.checkInDate) >= new Date(b.fromDate) &&
                    new Date(parsed.checkInDate) <= new Date(b.toDate)
                );
                if (found) {
                    setAlreadyBooked(true);
                    setMyBookingId(found?._id);
                } else {
                    setAlreadyBooked(false);
                    setMyBookingId(null);
                }
            } catch {
                setAlreadyBooked(false);
                setMyBookingId(null);
            }
        };
        checkAlreadyBooked();
    }, [navigate]);

    const fetchRoom = async (roomId) => {
        try {
            const { data } = await api.get(`/rooms/${roomId}`);
            setRoom(data.data || data);
        } catch {
            toast.error('Failed to load room details');
        }
    };

    const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleCardChange = (e) => setCardDetails(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleGuestSubmit = (e) => {
        e.preventDefault();
        if (alreadyBooked) {
            toast.error('Room is already booked for these dates.');
            return;
        }
        const { firstName, lastName, email, phone } = formData;
        if (!firstName || !lastName || !email || !phone) {
            toast.error('Please fill all required fields');
            return;
        }
        if (!bookingData?.checkInDate || !bookingData?.checkOutDate) {
            toast.error('Please select check-in and check-out dates');
            return;
        }
        setPaymentStep(true);
    };

    const handleApplyCoupon = async () => {
        setLoading(true);
        try {
            const payload = {
                roomId: bookingData.roomId,
                fromDate: bookingData.checkInDate,
                toDate: bookingData.checkOutDate,
                guestDetails: formData,
                couponCode: coupon.trim() || undefined,
            };
            console.log('COUPON PAYLOAD', payload);
            const { data } = await api.post('/bookings', payload);
            if (data.bookingData && data.bookingData.totalAmount) {
                setDiscountedTotal(data.bookingData.totalAmount);
                setCouponStatus('Coupon applied!');
            } else {
                setDiscountedTotal(null);
                setCouponStatus('Invalid coupon');
            }
        } catch {
            setDiscountedTotal(null);
            setCouponStatus('Invalid coupon');
        }
        setLoading(false);
    };

    const validateBookingPayload = (method) => {
        if (!bookingData?.roomId || !bookingData?.checkInDate || !bookingData?.checkOutDate) {
            toast.error('Room, check-in, or check-out date missing.');
            return null;
        }
        const { firstName, lastName, email, phone } = formData;
        if (!firstName || !lastName || !email || !phone) {
            toast.error('Please fill all required guest fields.');
            return null;
        }
        // Always update bookingData with latest guest info
        setBookingData(prev => ({
            ...prev,
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            specialRequests: formData.specialRequests
        }));
        const guestDetails = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            address: formData.address?.trim() || '',
            specialRequests: formData.specialRequests?.trim() || ''
        };
        return {
            roomId: bookingData.roomId,
            fromDate: bookingData.checkInDate,
            toDate: bookingData.checkOutDate,
            guestDetails,
            paymentMethod: method,
            couponCode: coupon.trim() || undefined,
        };
    };

    const createBookingWithMethod = async (method) => {
        setLoading(true);
        const bookingPayload = validateBookingPayload(method);
        if (!bookingPayload) {
            setLoading(false);
            return null;
        }
        try {
            // For online payments, only get order and amount, do not create booking yet
            if (method === 'razorpay' || method === 'card') {
                const { data } = await api.post('/bookings', bookingPayload);
                setDiscountedTotal(data.bookingData?.totalAmount);
                setLoading(false);
                return data;
            } else {
                // For COD, create booking immediately
                const { data } = await api.post('/bookings/cod', bookingPayload);
                setDiscountedTotal(data.booking?.totalAmount);
                setLoading(false);
                return { booking: data.booking };
            }
        } catch (err) {
            setLoading(false);
            if (err.response && err.response.data && err.response.data.message) {
                toast.error(err.response.data.message);
            } else {
                toast.error('Booking creation failed');
            }
            return null;
        }
    };

    const handleRazorpay = async () => {
        if (!window.Razorpay) {
            toast.error("Razorpay script not loaded. Please check your internet connection or adblockers.");
            return;
        }
        const data = await createBookingWithMethod('razorpay');
        if (!data) return;
        const { order: razorpayOrder, key, bookingData: booking } = data;
        if (!razorpayOrder || !key || !booking) {
            toast.error('Booking/order not found. Fill guest details first.');
            return;
        }
        const safeAmount = Math.round((finalTotal || 0) * 100);
        if (safeAmount > 50000000) {
            toast.error("Total amount exceeds Razorpay's maximum limit (₹5,00,000). Please reduce your booking.");
            return;
        }
        if (safeAmount <= 0 || isNaN(safeAmount)) {
            toast.error("Invalid total amount for payment.");
            return;
        }
        const options = {
            key,
            amount: safeAmount,
            currency: "INR",
            name: "Hotel Booking",
            description: `Total: ₹${finalTotal}`,
            order_id: razorpayOrder.id,
            handler: async function (response) {
                try {
                    // Compose full bookingData for backend
                    const fullBookingData = {
                        roomId: booking.roomId,
                        fromDate: booking.fromDate,
                        toDate: booking.toDate,
                        totalAmount: booking.totalAmount,
                        totalDays: booking.totalDays,
                        coupon: booking.coupon || coupon || undefined
                    };
                    const res = await api.post(`/bookings/verify`, {
                        paymentId: response.razorpay_payment_id,
                        orderId: response.razorpay_order_id,
                        signature: response.razorpay_signature,
                        bookingData: fullBookingData,
                        paymentMethod: 'razorpay'
                    });
                    console.log('Verification response:', res.data);
                    const bookingId = res.data?.booking?._id;
                    if (bookingId) {
                        toast.success("Payment successful! Redirecting...", { duration: 1000 });
                        setTimeout(() => {
                            navigate("/billing", { state: { bookingId } });
                        }, 1000);
                    } else {
                        toast.success("Booking complete! View your bookings for details.", { duration: 1500 });
                        setTimeout(() => {
                            navigate("/my-bookings");
                        }, 1500);
                    }
                } catch {
                    toast.error('Payment verification failed');
                }
            },
            prefill: { email: formData.email, contact: formData.phone },
            modal: {
                ondismiss: function () {
                    toast.error('Payment was not completed. Please try again.');
                }
            }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
    };

    const handleCardPayment = async () => {
        if (!cardDetails.number || !/^\d{16}$/.test(cardDetails.number)) {
            toast.error('Enter a valid 16-digit card number');
            return;
        }
        if (!cardDetails.expiry || !/^\d{2}\/\d{2}$/.test(cardDetails.expiry)) {
            toast.error('Enter expiry as MM/YY');
            return;
        }
        if (!cardDetails.cvv || !/^\d{3}$/.test(cardDetails.cvv)) {
            toast.error('Enter a valid 3-digit CVV');
            return;
        }
        const data = await createBookingWithMethod('card');
        if (!data) return;
        try {
            // Compose full bookingData for backend
            const booking = data.bookingData || data.booking || {};
            const fullBookingData = {
    roomId: booking.roomId,
    fromDate: booking.fromDate,
    toDate: booking.toDate,
    totalAmount: booking.totalAmount,
    totalDays: booking.totalDays,
    guestDetails: booking.guestDetails || formData, // ✅ FIX
    coupon: booking.coupon || coupon || undefined
};
            const res = await api.post(`/bookings/verify`, {
                paymentMethod: 'card',
                paymentId: 'CARD_' + (booking._id || ''),
                bookingData: fullBookingData
            });
            console.log('Verification response:', res.data);
            const bookingId = res.data?.booking?._id;
            if (bookingId) {
                toast.success('Card payment successful! Redirecting...', { duration: 1000 });
                setTimeout(() => {
                    navigate("/billing", { state: { bookingId } });
                }, 1000);
            } else {
                toast.success("Booking complete! View your bookings for details.", { duration: 1500 });
                setTimeout(() => {
                    navigate("/my-bookings");
                }, 1500);
            }
        } catch {
            toast.error('Card payment failed');
        }
    };

    const handleCashPayment = async () => {
        const data = await createBookingWithMethod('cash');
        if (!data) return;
        try {
            console.log('Verification response:', data);
            const bookingId = data.booking?._id;
            if (bookingId) {
                toast.success('Booking confirmed! Pay at hotel. Redirecting...', { duration: 1000 });
                setTimeout(() => {
                    navigate("/billing", { state: { bookingId } });
                }, 1000);
            } else {
                toast.success("Booking complete! View your bookings for details.", { duration: 1500 });
                setTimeout(() => {
                    navigate("/my-bookings");
                }, 1500);
            }
        } catch {
            toast.error('Cash booking failed');
        }
    };

    if (!room || !bookingData) return <div className="text-center mt-10">Loading...</div>;

    const numberOfRooms = Number(bookingData?.numberOfRooms) || 1;
    const numberOfGuests = Number(bookingData?.numberOfGuests) || 1;
    const pricePerNight = Number(room?.pricePerNight) || 0;
    const checkIn = bookingData?.checkInDate ? new Date(bookingData.checkInDate) : new Date();
    const checkOut = bookingData?.checkOutDate ? new Date(bookingData.checkOutDate) : new Date(Date.now() + 86400000);
    const nights = Math.max(1, Math.ceil((checkOut - checkIn)/(1000*60*60*24)));
    const subtotal = pricePerNight * nights * numberOfRooms;
    const tax = Math.floor(subtotal * 0.05);
    const total = subtotal + tax;
    const finalTotal = discountedTotal !== null ? discountedTotal : total;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">

            {/* Back */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-blue-600 hover:underline mb-4"
            >
                <FaArrowLeft /> Back
            </button>

            {/* STEP 1: Guest Details */}
            {!paymentStep && (
                <div className="grid lg:grid-cols-3 gap-6">

                    {/* Left Form */}
                    <div className="lg:col-span-2 bg-white shadow-lg rounded-2xl p-6">
                        <h2 className="text-xl font-semibold mb-4">Guest Details</h2>
                        <form onSubmit={handleGuestSubmit} className="space-y-4">

                            {/* Dates */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Check-In *</label>
                                    <input
                                        type="date"
                                        value={bookingData?.checkInDate?.slice(0,10) || ''}
                                        onChange={e => setBookingData(prev => ({ ...prev, checkInDate: e.target.value }))}
                                        className="border p-2 rounded-lg w-full"
                                        min={new Date().toISOString().slice(0,10)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Check-Out *</label>
                                    <input
                                        type="date"
                                        value={bookingData?.checkOutDate?.slice(0,10) || ''}
                                        onChange={e => setBookingData(prev => ({ ...prev, checkOutDate: e.target.value }))}
                                        className="border p-2 rounded-lg w-full"
                                        min={bookingData?.checkInDate || new Date().toISOString().slice(0,10)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Offer Suggestions */}
                            {offers.length > 0 && (
                                <div className="mb-2">
                                    <div className="font-semibold text-sm mb-1 text-blue-700">Available Offers:</div>
                                    <div className="flex flex-wrap gap-2">
                                        {offers.map(offer => (
                                            <button
                                                key={offer._id}
                                                type="button"
                                                className="border border-blue-500 bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs hover:bg-blue-100"
                                                onClick={() => setCoupon(offer.code)}
                                                disabled={loading}
                                            >
                                                {offer.title || offer.code}: {offer.discount}% OFF
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Optional Coupon */}
                            <div className="flex gap-2 items-center mb-2">
                                <input
                                    type="text"
                                    placeholder="Coupon code (optional)"
                                    value={coupon}
                                    onChange={e => setCoupon(e.target.value.toUpperCase())}
                                    className="border p-2 rounded-lg w-full max-w-xs"
                                    disabled={loading}
                                />
                                <button type="button" onClick={handleApplyCoupon} className="bg-blue-500 text-white px-3 py-1 rounded" disabled={loading || !coupon}>Apply</button>
                                {couponStatus && <span className="text-green-600 text-sm">{couponStatus}</span>}
                            </div>

                            {/* Guest Info */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <input name="firstName" placeholder="First Name *" value={formData.firstName} onChange={handleChange} className="border p-2 rounded-lg w-full" />
                                <input name="lastName" placeholder="Last Name *" value={formData.lastName} onChange={handleChange} className="border p-2 rounded-lg w-full" />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <input name="email" placeholder="Email *" value={formData.email} onChange={handleChange} className="border p-2 rounded-lg w-full" />
                                <input name="phone" placeholder="Phone *" value={formData.phone} onChange={handleChange} className="border p-2 rounded-lg w-full" />
                            </div>
                            <textarea name="address" placeholder="Address (optional)" value={formData.address} onChange={handleChange} className="border p-2 rounded-lg w-full" />
                            <textarea name="specialRequests" placeholder="Special Requests" value={formData.specialRequests} onChange={handleChange} className="border p-2 rounded-lg w-full" />
                            <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2" disabled={loading || alreadyBooked}>
                                {alreadyBooked ? 'Already Booked' : (loading ? 'Processing...' : (<><FaLock /> Confirm Guest Details</>))}
                            </button>
                            {alreadyBooked && myBookingId && (
                                <button
                                    type="button"
                                    className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 mt-2"
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

                    {/* Right Summary */}
                    <div className="bg-white shadow-lg rounded-2xl p-6 sticky top-6 h-fit">
                        <h3 className="font-semibold mb-3">Booking Summary</h3>
                        <img src={room.imageUrls?.[0] || 'https://via.placeholder.com/200'} alt={room.title} className="rounded-lg mb-3" />
                        <p className="font-medium">{room.title}</p>
                        <p className="text-sm text-gray-500">{room.roomType}</p>
                        <p className="text-sm mt-2">{checkIn.toLocaleDateString()} - {checkOut.toLocaleDateString()}</p>
                        <p className="text-sm">{numberOfGuests} guests • {numberOfRooms} rooms</p>
                        <div className="border-t my-3"></div>
                        <div className="flex justify-between text-sm"><span>Subtotal</span><span>₹{subtotal}</span></div>
                        <div className="flex justify-between text-sm"><span>Tax</span><span>₹{tax}</span></div>
                        <div className="flex justify-between font-bold text-lg mt-2"><span>Total</span><span>₹{finalTotal}</span></div>
                        <div className="mt-4 flex items-center gap-2 text-green-600 text-sm"><FaCheckCircle /> Secure payment</div>
                    </div>
                </div>
            )}

            {/* STEP 2: Payment */}
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
                            <input name="number" placeholder="Card Number (16 digits)" className="border p-2 rounded-lg w-full" onChange={handleCardChange} maxLength={16}/>
                            <input name="expiry" placeholder="Expiry (MM/YY)" className="border p-2 rounded-lg w-full" onChange={handleCardChange} maxLength={5}/>
                            <input name="cvv" placeholder="CVV (3 digits)" className="border p-2 rounded-lg w-full" onChange={handleCardChange} maxLength={3}/>
                        </div>

                    </div>

                    <div className="bg-white shadow-lg rounded-2xl p-6 sticky top-6 h-fit">
                        <h3 className="font-semibold mb-3">Booking Summary</h3>
                        <p>{room.title}</p>
                        <p className="text-sm">{room.roomType}</p>
                        <div className="border-t my-3"></div>
                        <div className="flex justify-between font-bold"><span>Total</span><span>₹{finalTotal}</span></div>
                    </div>

                </div>
            )}

        </div>
    );
}

export default Checkout;