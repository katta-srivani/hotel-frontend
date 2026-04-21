import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
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

function Billing() {
  const location = useLocation();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const bookingId = location.state?.bookingId || new URLSearchParams(location.search).get('id');

  useEffect(() => {
    if (!bookingId) {
      navigate('/mybookings');
      return;
    }

    const fetchBooking = async () => {
      try {
        const { data } = await api.get(`/bookings/${bookingId}`);
        setBooking(data.booking || data.data);
      } catch {
        setBooking(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, navigate]);

  const invoiceData = useMemo(() => {
    if (!booking) {
      return null;
    }

    const guestName =
      `${booking.guestDetails?.firstName || ''} ${booking.guestDetails?.lastName || ''}`.trim() ||
      'Guest';

    return {
      guestName,
      roomTitle: booking.room?.title || booking.room || '-',
      checkIn: new Date(booking.fromDate).toLocaleDateString(),
      checkOut: new Date(booking.toDate).toLocaleDateString(),
      createdAt: booking.createdAt ? new Date(booking.createdAt).toLocaleString() : new Date().toLocaleString(),
      subtotal: booking.subtotal ?? booking.totalAmount,
      taxAmount: booking.taxAmount ?? 0,
      discountAmount: booking.discountAmount ?? 0,
    };
  }, [booking]);

  const handleDownloadPdf = () => {
    if (!booking || !invoiceData) {
      return;
    }

    import('jspdf')
      .then(({ jsPDF }) => {
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const pageWidth = doc.internal.pageSize.getWidth();
        const primary = [37, 99, 235];
        const dark = [17, 24, 39];
        const muted = [107, 114, 128];
        const light = [239, 246, 255];

        const drawLabelValue = (label, value, x, y, width = 78) => {
          doc.setTextColor(...muted);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.text(label, x, y);
          doc.setTextColor(...dark);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          const wrapped = doc.splitTextToSize(String(value || '-'), width);
          doc.text(wrapped, x, y + 5);
          return y + 5 + wrapped.length * 5;
        };

        doc.setFillColor(...primary);
        doc.rect(0, 0, pageWidth, 38, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text('Travelerly', 16, 16);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Hotel Booking Invoice', 16, 24);
        doc.text(`Generated: ${invoiceData.createdAt}`, 16, 30);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text('INVOICE', pageWidth - 16, 18, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Booking ID: ${booking._id}`, pageWidth - 16, 26, { align: 'right' });

        doc.setFillColor(...light);
        doc.roundedRect(14, 46, pageWidth - 28, 28, 4, 4, 'F');
        doc.setTextColor(...dark);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Billing Summary', 20, 56);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Guest: ${invoiceData.guestName}`, 20, 64);
        doc.text(`Room: ${invoiceData.roomTitle}`, 20, 70);
        doc.text(`Stay: ${invoiceData.checkIn} to ${invoiceData.checkOut}`, pageWidth - 20, 64, { align: 'right' });
        doc.text(`Status: ${booking.paymentStatus}`, pageWidth - 20, 70, { align: 'right' });

        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(14, 82, pageWidth - 28, 78, 4, 4, 'S');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...dark);
        doc.text('Guest And Booking Details', 20, 92);

        let detailsY = 104;
        detailsY = drawLabelValue('Guest Name', invoiceData.guestName, 20, detailsY);
        detailsY = drawLabelValue('Email', booking.guestDetails?.email || '-', 20, detailsY + 6);
        detailsY = drawLabelValue('Phone', booking.guestDetails?.phone || '-', 20, detailsY + 6);
        drawLabelValue('Address', booking.guestDetails?.address || '-', 20, detailsY + 6, 70);

        let bookingY = 104;
        bookingY = drawLabelValue('Room', invoiceData.roomTitle, 110, bookingY, 80);
        bookingY = drawLabelValue('Check-in', invoiceData.checkIn, 110, bookingY + 6, 80);
        bookingY = drawLabelValue('Check-out', invoiceData.checkOut, 110, bookingY + 6, 80);
        bookingY = drawLabelValue('Payment Method', booking.paymentMethod, 110, bookingY + 6, 80);
        drawLabelValue('Booking Status', booking.status, 110, bookingY + 6, 80);

        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, 168, pageWidth - 28, 56, 4, 4, 'F');
        doc.setTextColor(...dark);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Amount Details', 20, 180);

        const rows = [
          ['Subtotal', `Rs ${invoiceData.subtotal}`],
          ['Tax', `Rs ${invoiceData.taxAmount}`],
          ['Discount', `Rs ${invoiceData.discountAmount}`],
          ['Payment Status', booking.paymentStatus],
        ];

        let rowY = 190;
        rows.forEach(([label, value]) => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.text(label, 20, rowY);
          doc.text(String(value), pageWidth - 20, rowY, { align: 'right' });
          rowY += 8;
        });

        doc.setDrawColor(...primary);
        doc.line(20, 220, pageWidth - 20, 220);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(...primary);
        doc.text('Total Amount', 20, 229);
        doc.text(`Rs ${booking.totalAmount}`, pageWidth - 20, 229, { align: 'right' });

        doc.setTextColor(...muted);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(
          'This is a system-generated invoice for your hotel booking. Keep it for your records.',
          20,
          244
        );
        doc.text('Travelerly Team', pageWidth - 20, 280, { align: 'right' });

        doc.save(`billing-${booking._id}.pdf`);
      })
      .catch(() => {
        toast.error('Failed to generate PDF');
      });
  };

  const handleRazorpayPayment = async () => {
    if (!booking?._id) {
      return;
    }

    setPaymentLoading(true);

    try {
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      const { data } = await api.post(`/bookings/${booking._id}/payment-order`);

      if (!data?.order?.id || !data?.key) {
        throw new Error('Razorpay is not configured on the server');
      }

      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency || 'INR',
        name: 'Hotel Booking',
        description: booking.room?.title || 'Room booking payment',
        order_id: data.order.id,
        prefill: {
          name: invoiceData?.guestName || '',
          email: booking.guestDetails?.email || '',
          contact: booking.guestDetails?.phone || '',
        },
        theme: {
          color: '#2563eb',
        },
        handler: async (response) => {
          try {
            const verifyRes = await api.post(`/bookings/${booking._id}/verify-payment`, {
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
            });

            setBooking(verifyRes.data.booking);
            toast.success('Payment successful');
          } catch (err) {
            toast.error(err?.response?.data?.message || 'Payment verification failed');
          } finally {
            setPaymentLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setPaymentLoading(false);
      toast.error(err?.response?.data?.message || err.message || 'Failed to start payment');
    }
  };

  if (loading) {
    return <div className="text-center mt-10">Loading billing details...</div>;
  }

  if (!booking || !invoiceData) {
    return <div className="text-center mt-10 text-red-600">Booking not found.</div>;
  }

  const isPendingPayment = booking.paymentStatus !== 'paid' && booking.status !== 'cancelled';
  const paymentMethodLabel =
    booking.paymentMethod === 'online'
      ? booking.razorpayPaymentId
        ? 'Razorpay / Card'
        : 'Razorpay'
      : 'Cash';
  const paymentBadgeClass =
    booking.paymentStatus === 'paid'
      ? 'bg-emerald-100 text-emerald-700'
      : booking.paymentStatus === 'cancelled'
        ? 'bg-rose-100 text-rose-700'
        : 'bg-amber-100 text-amber-700';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_35%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/mybookings')}
            className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-white"
          >
            Back To My Bookings
          </button>
          <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-slate-500 shadow-sm">
            Generated {invoiceData.createdAt}
          </div>
        </div>

        <div className="overflow-hidden rounded-[32px] border border-blue-100 bg-white shadow-[0_24px_80px_rgba(37,99,235,0.12)]">
          <div className="bg-[linear-gradient(135deg,#1d4ed8_0%,#3b82f6_55%,#93c5fd_100%)] px-8 py-8 text-white">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="mb-3 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em]">
                  Travelerly Invoice
                </div>
                <h1 className="text-3xl font-black tracking-tight">Booking Receipt</h1>
                <p className="mt-2 max-w-xl text-sm text-blue-50">
                  This invoice is available for Razorpay, Card, and Cash bookings. You can
                  download it anytime and use it as your payment record.
                </p>
              </div>

              <div className="rounded-3xl bg-white/12 p-5 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-blue-100">Booking Id</p>
                <p className="mt-2 break-all font-mono text-sm">{booking._id}</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${paymentBadgeClass}`}>
                    {booking.paymentStatus}
                  </span>
                  <span className="rounded-full border border-white/25 px-3 py-1 text-xs font-semibold text-white/90">
                    {paymentMethodLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-8 py-8 lg:grid-cols-[1.3fr_0.9fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">Guest Details</h2>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Primary Guest
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Name</p>
                    <p className="mt-2 text-base font-bold text-slate-900">{invoiceData.guestName}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Email</p>
                    <p className="mt-2 text-base font-bold text-slate-900">{booking.guestDetails?.email || '-'}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Phone</p>
                    <p className="mt-2 text-base font-bold text-slate-900">{booking.guestDetails?.phone || '-'}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Address</p>
                    <p className="mt-2 text-base font-bold text-slate-900">
                      {booking.guestDetails?.address || 'No address provided'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">Stay Details</h2>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Reservation
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Room</p>
                    <p className="mt-2 text-base font-bold text-slate-900">{invoiceData.roomTitle}</p>
                    <p className="mt-1 text-sm text-slate-500">{booking.room?.roomType || 'Hotel Room'}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Stay Window</p>
                    <p className="mt-2 text-base font-bold text-slate-900">
                      {invoiceData.checkIn} to {invoiceData.checkOut}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{booking.totalDays} night(s)</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4 sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Special Requests</p>
                    <p className="mt-2 text-base font-bold text-slate-900">
                      {booking.guestDetails?.specialRequests || 'No special requests added'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-blue-100 bg-[linear-gradient(180deg,#eff6ff_0%,#ffffff_100%)] p-6">
                <h2 className="text-lg font-bold text-slate-900">Amount Summary</h2>
                <div className="mt-5 space-y-4 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-slate-900">Rs {invoiceData.subtotal}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tax</span>
                    <span className="font-semibold text-slate-900">Rs {invoiceData.taxAmount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Discount</span>
                    <span className="font-semibold text-emerald-700">Rs {invoiceData.discountAmount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Payment Method</span>
                    <span className="font-semibold text-slate-900">{paymentMethodLabel}</span>
                  </div>
                </div>
                <div className="mt-6 rounded-2xl bg-slate-900 px-5 py-4 text-white">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Total Amount</p>
                  <p className="mt-2 text-3xl font-black">Rs {booking.totalAmount}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-bold text-slate-900">Actions</h2>
                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="w-full rounded-2xl bg-slate-800 px-4 py-3 font-semibold text-white transition hover:bg-slate-900"
                  >
                    Download PDF Invoice
                  </button>

                  {isPendingPayment && (
                    <button
                      type="button"
                      onClick={handleRazorpayPayment}
                      className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
                      disabled={paymentLoading}
                    >
                      {paymentLoading ? 'Opening Razorpay...' : 'Pay Now Using Razorpay'}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => navigate('/mybookings')}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Back To My Bookings
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Invoice Note</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  This receipt is generated for Cash, Razorpay, and Card bookings. If the
                  booking is unpaid, you can reopen payment from this screen and continue with
                  Razorpay anytime before cancellation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Billing;
