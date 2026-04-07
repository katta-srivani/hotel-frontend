import React, { useState, useEffect, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import api from '../utils/api';
import NotificationBell from '../components/NotificationBell';
import toast from 'react-hot-toast';
import {
  FaPlus, FaTrash, FaEdit, FaChartBar
} from 'react-icons/fa';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(false);

  const [rooms, setRooms] = useState([]);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editRoom, setEditRoom] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [unapprovedReviews, setUnapprovedReviews] = useState([]);
  const [offers, setOffers] = useState([]);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [editOffer, setEditOffer] = useState(null);
  const initialOfferState = {
    code: '',
    discountType: 'percentage',
    discountValue: '',
    minAmount: '',
    maxDiscount: '',
    expiryDate: '',
    usageLimit: 100,
    isActive: true,
  };
  const [offerForm, setOfferForm] = useState(initialOfferState);
  const [offerFormLoading, setOfferFormLoading] = useState(false);

  const [stats, setStats] = useState({
    totalRooms: 0,
    totalBookings: 0,
    totalRevenue: 0,
    roomsBooked: 0,
    roomsNotBooked: 0,
    roomsBookedToday: 0,
    roomsNotBookedToday: 0,
    paymentPending: 0,
    paymentCOD: 0,
    paymentRazorpay: 0
  });

  const [analytics, setAnalytics] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    bookingsPerDay: [], // [{date, count}]
    revenuePerDay: []   // [{date, revenue}]
  });

  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });

  const extractArray = (res) => {
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    if (Array.isArray(res?.data?.rooms)) return res.data.rooms;
    if (Array.isArray(res?.data?.bookings)) return res.data.bookings;
    return [];
  };

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {

      // Flattened logic to remove redundant nested blocks
      if (activeTab === 'rooms') {
        const res = await api.get('/rooms');
        setRooms(extractArray(res));
      } else if (activeTab === 'bookings') {
        const res = await api.get('/bookings/admin');
        setBookings(extractArray(res));
      } else if (activeTab === 'users') {
        const res = await api.get('/users');
        setUsers(Array.isArray(res?.data?.data) ? res.data.data : []);
      } else if (activeTab === 'stats') {
        const roomRes = await api.get('/rooms');
        const bookingRes = await api.get('/bookings/admin');
        const roomsData = extractArray(roomRes);
        const bookingsData = extractArray(bookingRes);
        const totalRevenue = bookingsData.reduce(
          (sum, b) => sum + (b.totalAmount || 0),
          0
        );
        // Get set of booked room IDs (all time)
        const bookedRoomIds = new Set(bookingsData.map(b => (b.room?._id || b.room)));
        const roomsBooked = roomsData.filter(r => bookedRoomIds.has(r._id)).length;
        const roomsNotBooked = roomsData.length - roomsBooked;
        // Booked for today
        const today = new Date();
        today.setHours(0,0,0,0);
        const bookedTodayIds = new Set(
          bookingsData
            .filter(b => {
              const from = b.fromDate ? new Date(b.fromDate) : null;
              const to = b.toDate ? new Date(b.toDate) : null;
              if (!from || !to) return false;
              // Check if today is within the booking range (inclusive)
              return from <= today && today <= to;
            })
            .map(b => (b.room?._id || b.room))
        );
        const roomsBookedToday = roomsData.filter(r => bookedTodayIds.has(r._id)).length;
        const roomsNotBookedToday = roomsData.length - roomsBookedToday;
        // Payment status tracking
        const paymentPending = bookingsData.filter(b => (b.paymentStatus || '').toLowerCase() === 'pending').length;
        const paymentCOD = bookingsData.filter(b => (b.paymentMethod || '').toLowerCase() === 'cod').length;
        const paymentRazorpay = bookingsData.filter(b => (b.paymentMethod || '').toLowerCase() === 'razorpay').length;
        setStats({
          totalRooms: roomsData.length,
          totalBookings: bookingsData.length,
          totalRevenue,
          roomsBooked,
          roomsNotBooked,
          roomsBookedToday,
          roomsNotBookedToday,
          paymentPending,
          paymentCOD,
          paymentRazorpay
        });
      } else if (activeTab === 'analytics') {
        const query = `?from=${dateRange.from || ''}&to=${dateRange.to || ''}`;
        const res = await api.get(`/bookings/admin/analytics${query}`);
        setAnalytics({
          totalBookings: res.data?.totalBookings || 0,
          totalRevenue: res.data?.totalRevenue || 0,
          bookingsPerDay: res.data?.bookingsPerDay || [],
          revenuePerDay: res.data?.revenuePerDay || [],
        });
      } else if (activeTab === 'reviews') {
        const res = await api.get('/reviews/admin/unapproved');
        setUnapprovedReviews(res.data?.reviews || []);
      } else if (activeTab === 'offers') {
        const res = await api.get('/offers');
        setOffers(res.data?.offers || []);
      }

    } catch (err) {
      console.error(err);
      toast.error('Failed to load data');
    }
    setLoading(false);
  }, [activeTab, dateRange]);

  useEffect(() => {
    fetchData();
  }, [activeTab, dateRange, fetchData]);

  // ACTIONS
  const handleDeleteRoom = async (id) => {
    if (!window.confirm('Delete this room?')) return;
    try {
      await api.delete(`/rooms/${id}`);
      setRooms(prev => prev.filter(r => r?._id !== id));
      toast.success('Room deleted');
    } catch (err) {
      toast.error('Failed to delete room');
    }
  };

  const handleAddRoom = () => {
    setEditRoom(null);
    setShowRoomModal(true);
  };

  const handleEditRoom = (room) => {
    setEditRoom(room);
    setShowRoomModal(true);
  };

  // Room form state
  const initialRoomState = {
    title: '',
    roomType: 'Standard',
    pricePerNight: '',
    description: '',
    maxGuests: '',
    bedType: '',
    size: '',
    view: '',
    amenities: { wifi: false, parking: false, breakfast: false, pool: false },
    imageUrls: '',
    isAvailable: true,
  };
  const [roomForm, setRoomForm] = useState(initialRoomState);
  const [roomFormLoading, setRoomFormLoading] = useState(false);

  useEffect(() => {
    if (showRoomModal) {
      if (editRoom) {
        setRoomForm({
          ...editRoom,
          imageUrls: Array.isArray(editRoom.imageUrls) ? editRoom.imageUrls.join(', ') : '',
          pricePerNight: editRoom.pricePerNight || '',
          maxGuests: editRoom.maxGuests || '',
        });
      } else {
        setRoomForm(initialRoomState);
      }
    }
    // eslint-disable-next-line
  }, [showRoomModal, editRoom]);

  const handleRoomFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('amenities.')) {
      const amenity = name.split('.')[1];
      setRoomForm((prev) => ({
        ...prev,
        amenities: { ...prev.amenities, [amenity]: checked },
      }));
    } else if (type === 'checkbox') {
      setRoomForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setRoomForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleRoomFormSubmit = async (e) => {
    e.preventDefault();
    setRoomFormLoading(true);
    try {
      const payload = {
        ...roomForm,
        pricePerNight: Number(roomForm.pricePerNight),
        maxGuests: Number(roomForm.maxGuests),
        imageUrls: roomForm.imageUrls.split(',').map((url) => url.trim()).filter(Boolean),
      };
      let res;
      if (editRoom) {
        res = await api.put(`/rooms/${editRoom._id}`, payload);
        setRooms((prev) => prev.map((r) => (r._id === editRoom._id ? res.data.data || res.data : r)));
        toast.success('Room updated');
      } else {
        res = await api.post('/rooms', payload);
        setRooms((prev) => [res.data.data || res.data, ...prev]);
        toast.success('Room added');
      }
      setShowRoomModal(false);
    } catch (err) {
      toast.error('Failed to save room');
    }
    setRoomFormLoading(false);
  };
      
      {activeTab === 'rooms' && (
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold">All Rooms</h2>
            <button onClick={handleAddRoom} className="bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1"><FaPlus /> Add Room</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left text-xs font-bold">Title</th>
                  <th className="p-2 text-left text-xs font-bold">Type</th>
                  <th className="p-2 text-left text-xs font-bold">Price</th>
                  <th className="p-2 text-left text-xs font-bold">Status (Today)</th>
                  <th className="p-2 text-left text-xs font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map(room => {
                  // Determine if this room is booked today
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const isBookedToday = bookings.some(b => {
                    const from = b.fromDate ? new Date(b.fromDate) : null;
                    const to = b.toDate ? new Date(b.toDate) : null;
                    const roomId = b.room?._id || b.room;
                    if (!from || !to) return false;
                    return roomId === room._id && from <= today && today <= to;
                  });
                  return (
                    <tr key={room._id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{room.title}</td>
                      <td className="p-2">{room.type}</td>
                      <td className="p-2">₹{room.price}</td>
                      <td className="p-2 font-semibold">
                        {isBookedToday ? <span className="text-green-600">Booked</span> : <span className="text-gray-500">Not Booked</span>}
                      </td>
                      <td className="p-2 flex gap-2">
                        <button
                          className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600 flex items-center gap-1"
                          title="Edit"
                          onClick={() => handleEditRoom(room)}
                        ><FaEdit /> Edit</button>
                        <button
                          className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 flex items-center gap-1"
                          title="Delete"
                          onClick={() => handleDeleteRoom(room._id)}
                        ><FaTrash /> Delete</button>
                      </td>
                    </tr>
                  );
                })}
                {rooms.length === 0 && (
                  <tr><td colSpan={4} className="p-4 text-center text-gray-500">No rooms found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Room Modal Form */}
          {showRoomModal && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow w-full max-w-md relative">
                <button className="absolute top-2 right-2 text-gray-500" onClick={() => setShowRoomModal(false)}>&times;</button>
                <h3 className="text-lg font-bold mb-4">{editRoom ? 'Edit Room' : 'Add Room'}</h3>
                <form onSubmit={handleRoomFormSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Title</label>
                    <input name="title" value={roomForm.title} onChange={handleRoomFormChange} className="border p-1 rounded w-full" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Room Type</label>
                    <select name="roomType" value={roomForm.roomType} onChange={handleRoomFormChange} className="border p-1 rounded w-full" required>
                      <option value="Standard">Standard</option>
                      <option value="Deluxe">Deluxe</option>
                      <option value="Suite">Suite</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Price Per Night</label>
                    <input name="pricePerNight" type="number" value={roomForm.pricePerNight} onChange={handleRoomFormChange} className="border p-1 rounded w-full" required min="1" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Description</label>
                    <textarea name="description" value={roomForm.description} onChange={handleRoomFormChange} className="border p-1 rounded w-full" required />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold mb-1">Max Guests</label>
                      <input name="maxGuests" type="number" value={roomForm.maxGuests} onChange={handleRoomFormChange} className="border p-1 rounded w-full" required min="1" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold mb-1">Bed Type</label>
                      <input name="bedType" value={roomForm.bedType} onChange={handleRoomFormChange} className="border p-1 rounded w-full" required />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold mb-1">Size</label>
                      <input name="size" value={roomForm.size} onChange={handleRoomFormChange} className="border p-1 rounded w-full" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold mb-1">View</label>
                      <input name="view" value={roomForm.view} onChange={handleRoomFormChange} className="border p-1 rounded w-full" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Amenities</label>
                    <div className="flex gap-2 flex-wrap">
                      {['wifi','parking','breakfast','pool'].map(a => (
                        <label key={a} className="flex items-center gap-1 text-xs">
                          <input type="checkbox" name={`amenities.${a}`} checked={roomForm.amenities[a]} onChange={handleRoomFormChange} /> {a.charAt(0).toUpperCase()+a.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Image URLs (comma separated)</label>
                    <input name="imageUrls" value={roomForm.imageUrls} onChange={handleRoomFormChange} className="border p-1 rounded w-full" required />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" name="isAvailable" checked={roomForm.isAvailable} onChange={handleRoomFormChange} /> Available
                    </label>
                  </div>
                  <div className="flex gap-2 justify-end mt-4">
                    <button type="button" className="px-4 py-1 rounded border" onClick={() => setShowRoomModal(false)} disabled={roomFormLoading}>Cancel</button>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded" disabled={roomFormLoading}>{roomFormLoading ? 'Saving...' : (editRoom ? 'Update' : 'Add')}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

  

  const handleApproveReview = async (id) => {
    await api.put(`/reviews/admin/approve/${id}`);
    setUnapprovedReviews(prev => prev.filter(r => r?._id !== id));
  };

  const handleDeleteReview = async (id) => {
    await api.delete(`/reviews/${id}`);
    setUnapprovedReviews(prev => prev.filter(r => r?._id !== id));
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(prev => prev.filter(u => u._id !== id));
      toast.success('User deleted');
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };


  const handleAddOffer = () => {
    setEditOffer(null);
    setShowOfferModal(true);
  };

  const handleEditOffer = (offer) => {
    setEditOffer(offer);
    setShowOfferModal(true);
  };

  const handleDeleteOffer = async (id) => {
    if (!window.confirm('Delete this offer?')) return;
    try {
      await api.delete(`/offers/${id}`);
      setOffers(prev => prev.filter(o => o._id !== id));
      toast.success('Offer deleted');
    } catch (err) {
      toast.error('Failed to delete offer');
    }
  };

  const handleOfferFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setOfferForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setOfferForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleOfferFormSubmit = async (e) => {
    e.preventDefault();
    setOfferFormLoading(true);
    try {
      const payload = {
        ...offerForm,
        discountValue: Number(offerForm.discountValue),
        minAmount: offerForm.minAmount ? Number(offerForm.minAmount) : 0,
        maxDiscount: offerForm.maxDiscount ? Number(offerForm.maxDiscount) : undefined,
        usageLimit: offerForm.usageLimit ? Number(offerForm.usageLimit) : 100,
      };
      let res;
      if (editOffer) {
        res = await api.put(`/offers/${editOffer._id}`, payload);
        setOffers((prev) => prev.map((o) => (o._id === editOffer._id ? res.data.offer : o)));
        toast.success('Offer updated');
      } else {
        res = await api.post('/offers', payload);
        setOffers((prev) => [res.data.offer, ...prev]);
        toast.success('Offer added');
      }
      setShowOfferModal(false);
    } catch (err) {
      toast.error('Failed to save offer');
    }
    setOfferFormLoading(false);
  };

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* HEADER */}
      <nav className="bg-blue-700 text-white shadow-md p-3 flex items-center gap-2 justify-between">
        <span className="flex items-center gap-2"><FaChartBar /> Admin Dashboard</span>
        <NotificationBell />
      </nav>

      {/* TABS */}
      <div className="flex gap-3 p-3 bg-white border-b flex-wrap">
        {['stats','rooms','amenities','bookings','users','analytics','reviews','offers'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`${activeTab === tab ? 'text-blue-700 border-b-2 border-blue-700' : ''}`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>
       {activeTab === 'rooms' && (
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold">All Rooms</h2>
            <button onClick={handleAddRoom} className="bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1"><FaPlus /> Add Room</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left text-xs font-bold">Title</th>
                  <th className="p-2 text-left text-xs font-bold">Type</th>
                  <th className="p-2 text-left text-xs font-bold">Price</th>
                  <th className="p-2 text-left text-xs font-bold">Status (Today)</th>
                  <th className="p-2 text-left text-xs font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map(room => {
                  // Determine if this room is booked today
                  const today = new Date();
                  today.setHours(0,0,0,0);
                  const isBookedToday = bookings.some(b => {
                    const from = b.fromDate ? new Date(b.fromDate) : null;
                    const to = b.toDate ? new Date(b.toDate) : null;
                    const roomId = b.room?._id || b.room;
                    if (!from || !to) return false;
                    return roomId === room._id && from <= today && today <= to;
                  });
                  return (
                    <tr key={room._id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{room.title}</td>
                      <td className="p-2">{room.type}</td>
                      <td className="p-2">₹{room.price}</td>
                      <td className="p-2 font-semibold">
                        {isBookedToday ? <span className="text-green-600">Booked</span> : <span className="text-gray-500">Not Booked</span>}
                      </td>
                      <td className="p-2 flex gap-2">
                        <button
                          className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600 flex items-center gap-1"
                          title="Edit"
                          onClick={() => handleEditRoom(room)}
                        ><FaEdit /> Edit</button>
                        <button
                          className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 flex items-center gap-1"
                          title="Delete"
                          onClick={() => handleDeleteRoom(room._id)}
                        ><FaTrash /> Delete</button>
                      </td>
                    </tr>
                  );
                })}
                {rooms.length === 0 && (
                  <tr><td colSpan={4} className="p-4 text-center text-gray-500">No rooms found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Room Modal Form */}
          {showRoomModal && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow w-full max-w-md relative">
                <button className="absolute top-2 right-2 text-gray-500" onClick={() => setShowRoomModal(false)}>&times;</button>
                <h3 className="text-lg font-bold mb-4">{editRoom ? 'Edit Room' : 'Add Room'}</h3>
                <form onSubmit={handleRoomFormSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Title</label>
                    <input name="title" value={roomForm.title} onChange={handleRoomFormChange} className="border p-1 rounded w-full" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Room Type</label>
                    <select name="roomType" value={roomForm.roomType} onChange={handleRoomFormChange} className="border p-1 rounded w-full" required>
                      <option value="Standard">Standard</option>
                      <option value="Deluxe">Deluxe</option>
                      <option value="Suite">Suite</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Price Per Night</label>
                    <input name="pricePerNight" type="number" value={roomForm.pricePerNight} onChange={handleRoomFormChange} className="border p-1 rounded w-full" required min="1" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Description</label>
                    <textarea name="description" value={roomForm.description} onChange={handleRoomFormChange} className="border p-1 rounded w-full" required />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold mb-1">Max Guests</label>
                      <input name="maxGuests" type="number" value={roomForm.maxGuests} onChange={handleRoomFormChange} className="border p-1 rounded w-full" required min="1" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold mb-1">Bed Type</label>
                      <input name="bedType" value={roomForm.bedType} onChange={handleRoomFormChange} className="border p-1 rounded w-full" required />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold mb-1">Size</label>
                      <input name="size" value={roomForm.size} onChange={handleRoomFormChange} className="border p-1 rounded w-full" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold mb-1">View</label>
                      <input name="view" value={roomForm.view} onChange={handleRoomFormChange} className="border p-1 rounded w-full" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Amenities</label>
                    <div className="flex gap-2 flex-wrap">
                      {['wifi','parking','breakfast','pool'].map(a => (
                        <label key={a} className="flex items-center gap-1 text-xs">
                          <input type="checkbox" name={`amenities.${a}`} checked={roomForm.amenities[a]} onChange={handleRoomFormChange} /> {a.charAt(0).toUpperCase()+a.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Image URLs (comma separated)</label>
                    <input name="imageUrls" value={roomForm.imageUrls} onChange={handleRoomFormChange} className="border p-1 rounded w-full" required />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" name="isAvailable" checked={roomForm.isAvailable} onChange={handleRoomFormChange} /> Available
                    </label>
                  </div>
                  <div className="flex gap-2 justify-end mt-4">
                    <button type="button" className="px-4 py-1 rounded border" onClick={() => setShowRoomModal(false)} disabled={roomFormLoading}>Cancel</button>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded" disabled={roomFormLoading}>{roomFormLoading ? 'Saving...' : (editRoom ? 'Update' : 'Add')}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* OFFERS TAB */}
      {activeTab === 'offers' && (
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold">Discount Codes / Offers</h2>
            <button onClick={handleAddOffer} className="bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1"><FaPlus /> Add Offer</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left text-xs font-bold">Code</th>
                  <th className="p-2 text-left text-xs font-bold">Type</th>
                  <th className="p-2 text-left text-xs font-bold">Value</th>
                  <th className="p-2 text-left text-xs font-bold">Min Amount</th>
                  <th className="p-2 text-left text-xs font-bold">Max Discount</th>
                  <th className="p-2 text-left text-xs font-bold">Expiry</th>
                  <th className="p-2 text-left text-xs font-bold">Usage</th>
                  <th className="p-2 text-left text-xs font-bold">Active</th>
                  <th className="p-2 text-left text-xs font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {offers.map(offer => (
                  <tr key={offer._id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-mono">{offer.code}</td>
                    <td className="p-2 capitalize">{offer.discountType}</td>
                    <td className="p-2">{offer.discountType === 'percentage' ? `${offer.discountValue}%` : `₹${offer.discountValue}`}</td>
                    <td className="p-2">₹{offer.minAmount || 0}</td>
                    <td className="p-2">{offer.maxDiscount ? `₹${offer.maxDiscount}` : '-'}</td>
                    <td className="p-2">{offer.expiryDate ? new Date(offer.expiryDate).toLocaleDateString() : ''}</td>
                    <td className="p-2">{offer.usedCount || 0} / {offer.usageLimit}</td>
                    <td className="p-2">{offer.isActive ? <span className="text-green-600">Yes</span> : <span className="text-red-600">No</span>}</td>
                    <td className="p-2 flex gap-2">
                      <button
                        className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600 flex items-center gap-1"
                        title="Edit"
                        onClick={() => handleEditOffer(offer)}
                      ><FaEdit /> Edit</button>
                      <button
                        className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 flex items-center gap-1"
                        title="Delete"
                        onClick={() => handleDeleteOffer(offer._id)}
                      ><FaTrash /> Delete</button>
                    </td>
                  </tr>
                ))}
                {offers.length === 0 && (
                  <tr><td colSpan={9} className="p-4 text-center text-gray-500">No offers found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Offer Modal Form */}
          {showOfferModal && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow w-full max-w-md relative">
                <button className="absolute top-2 right-2 text-gray-500" onClick={() => setShowOfferModal(false)}>&times;</button>
                <h3 className="text-lg font-bold mb-4">{editOffer ? 'Edit Offer' : 'Add Offer'}</h3>
                <form onSubmit={handleOfferFormSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Code</label>
                    <input name="code" value={offerForm.code} onChange={handleOfferFormChange} className="border p-1 rounded w-full font-mono" required disabled={!!editOffer} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Discount Type</label>
                    <select name="discountType" value={offerForm.discountType} onChange={handleOfferFormChange} className="border p-1 rounded w-full" required>
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat (₹)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Discount Value</label>
                    <input name="discountValue" type="number" value={offerForm.discountValue} onChange={handleOfferFormChange} className="border p-1 rounded w-full" required min="1" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Min Amount</label>
                    <input name="minAmount" type="number" value={offerForm.minAmount} onChange={handleOfferFormChange} className="border p-1 rounded w-full" min="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Max Discount (₹, for % type)</label>
                    <input name="maxDiscount" type="number" value={offerForm.maxDiscount} onChange={handleOfferFormChange} className="border p-1 rounded w-full" min="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Expiry Date</label>
                    <input name="expiryDate" type="date" value={offerForm.expiryDate} onChange={handleOfferFormChange} className="border p-1 rounded w-full" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Usage Limit</label>
                    <input name="usageLimit" type="number" value={offerForm.usageLimit} onChange={handleOfferFormChange} className="border p-1 rounded w-full" min="1" />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" name="isActive" checked={offerForm.isActive} onChange={handleOfferFormChange} /> Active
                    </label>
                  </div>
                  <div className="flex gap-2 justify-end mt-4">
                    <button type="button" className="px-4 py-1 rounded border" onClick={() => setShowOfferModal(false)} disabled={offerFormLoading}>Cancel</button>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded" disabled={offerFormLoading}>{offerFormLoading ? 'Saving...' : (editOffer ? 'Update' : 'Add')}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AMENITIES TABLE */}
      {activeTab === 'amenities' && (
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-bold mb-2">Room Amenities</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left text-xs font-bold">Room</th>
                  <th className="p-2 text-left text-xs font-bold">Wifi</th>
                  <th className="p-2 text-left text-xs font-bold">Parking</th>
                  <th className="p-2 text-left text-xs font-bold">Breakfast</th>
                  <th className="p-2 text-left text-xs font-bold">Pool</th>
                  <th className="p-2 text-left text-xs font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map(room => {
                  const amenities = room.amenities || {};
                  return (
                    <tr key={room._id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{room.title}</td>
                      <td className="p-2 text-center">{amenities.wifi ? '✔️' : '❌'}</td>
                      <td className="p-2 text-center">{amenities.parking ? '✔️' : '❌'}</td>
                      <td className="p-2 text-center">{amenities.breakfast ? '✔️' : '❌'}</td>
                      <td className="p-2 text-center">{amenities.pool ? '✔️' : '❌'}</td>
                      <td className="p-2 flex gap-2">
                        <button
                          className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600 flex items-center gap-1"
                          title="Edit"
                          onClick={() => handleEditRoom(room)}
                        ><FaEdit /> Edit</button>
                      </td>
                    </tr>
                  );
                })}
                {rooms.length === 0 && (
                  <tr><td colSpan={6} className="p-4 text-center text-gray-500">No rooms found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Reuse Room Modal for amenities editing */}
          {showRoomModal && editRoom && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow w-full max-w-md relative">
                <button className="absolute top-2 right-2 text-gray-500" onClick={() => setShowRoomModal(false)}>&times;</button>
                <h3 className="text-lg font-bold mb-4">Edit Amenities for {editRoom.title}</h3>
                <form onSubmit={handleRoomFormSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Amenities</label>
                    <div className="flex gap-2 flex-wrap">
                      {['wifi','parking','breakfast','pool'].map(a => (
                        <label key={a} className="flex items-center gap-1 text-xs">
                          <input type="checkbox" name={`amenities.${a}`} checked={roomForm.amenities[a]} onChange={handleRoomFormChange} /> {a.charAt(0).toUpperCase()+a.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end mt-4">
                    <button type="button" className="px-4 py-1 rounded border" onClick={() => setShowRoomModal(false)} disabled={roomFormLoading}>Cancel</button>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded" disabled={roomFormLoading}>{roomFormLoading ? 'Saving...' : 'Update'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* USERS TABLE */}
      {activeTab === 'users' && (
        <div className="p-6 space-y-6">
          <h2 className="text-lg font-bold mb-2">All Users</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left text-xs font-bold">Name</th>
                  <th className="p-2 text-left text-xs font-bold">Email</th>
                  <th className="p-2 text-left text-xs font-bold">Role</th>
                  <th className="p-2 text-left text-xs font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{u.name}</td>
                    <td className="p-2">{u.email}</td>
                    <td className="p-2 capitalize">{u.role}</td>
                    <td className="p-2">
                      <button
                        className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                        title="Delete"
                        onClick={() => handleDeleteUser(u._id)}
                      >Delete</button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={4} className="p-4 text-center text-gray-500">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="p-6">

        {loading && <p>Loading...</p>}

        {/* STATS */}
        {activeTab === 'stats' && (
          <div className="grid md:grid-cols-10 gap-6">
            <Card title="Total Rooms" value={stats.totalRooms} />
            <Card title="Rooms Booked (All)" value={stats.roomsBooked} />
            <Card title="Rooms Not Booked (All)" value={stats.roomsNotBooked} />
            <Card title="Rooms Booked Today" value={stats.roomsBookedToday} />
            <Card title="Rooms Not Booked Today" value={stats.roomsNotBookedToday} />
            <Card title="Bookings" value={stats.totalBookings} />
            <Card title="Pending Payments" value={stats.paymentPending} />
            <Card title="COD Bookings" value={stats.paymentCOD} />
            <Card title="Razorpay Bookings" value={stats.paymentRazorpay} />
            <Card title="Revenue" value={`₹${stats.totalRevenue}`} />
          </div>
        )}

        {/* BOOKINGS TABLE WITH FILTERS */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold mb-2">All Bookings</h2>
            {/* FILTERS */}
            <div className="flex flex-wrap gap-4 mb-4 items-end">
              <div>
                <label className="block text-xs font-semibold mb-1">From</label>
                <input type="date" value={dateRange.from || ''} onChange={e => setDateRange({...dateRange, from: e.target.value})} className="border p-1 rounded" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">To</label>
                <input type="date" value={dateRange.to || ''} onChange={e => setDateRange({...dateRange, to: e.target.value})} className="border p-1 rounded" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Status</label>
                <select className="border p-1 rounded" value={dateRange.status || ''} onChange={e => setDateRange({...dateRange, status: e.target.value})}>
                  <option value="">All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <button onClick={fetchData} className="bg-blue-600 text-white px-4 py-1 rounded">Apply</button>
            </div>
            {/* BOOKINGS TABLE */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded shadow">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left text-xs font-bold">Room</th>
                    <th className="p-2 text-left text-xs font-bold">User</th>
                    <th className="p-2 text-left text-xs font-bold">Check-In</th>
                    <th className="p-2 text-left text-xs font-bold">Check-Out</th>
                    <th className="p-2 text-left text-xs font-bold">Status</th>
                    <th className="p-2 text-left text-xs font-bold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings
                    .filter(b => {
                      // Date filter
                      const from = dateRange.from ? new Date(dateRange.from) : null;
                      const to = dateRange.to ? new Date(dateRange.to) : null;
                      const checkIn = b.fromDate ? new Date(b.fromDate) : null;
                      let dateOk = true;
                      if (from && checkIn && checkIn < from) dateOk = false;
                      if (to && checkIn && checkIn > to) dateOk = false;
                      // Status filter
                      let statusOk = true;
                      if (dateRange.status && b.status !== dateRange.status) statusOk = false;
                      return dateOk && statusOk;
                    })
                    .map(b => (
                      <tr key={b._id} className="border-b hover:bg-gray-50">
                        <td className="p-2">{b.room?.title || b.room}</td>
                        <td className="p-2">{b.user?.email || b.user}</td>
                        <td className="p-2">{b.fromDate ? new Date(b.fromDate).toLocaleDateString() : ''}</td>
                        <td className="p-2">{b.toDate ? new Date(b.toDate).toLocaleDateString() : ''}</td>
                        <td className="p-2 capitalize">{b.status}
                          {b.status === 'pending' && (
                            <span className="ml-2 inline-flex gap-1">
                              <button
                                className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                                title="Approve"
                                onClick={async () => {
                                  try {
                                    await api.put(`/bookings/${b._id}`, { status: 'approved' });
                                    toast.success('Booking approved');
                                    fetchData();
                                  } catch (err) {
                                    toast.error('Failed to approve');
                                  }
                                }}
                              >Approve</button>
                              <button
                                className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                                title="Reject"
                                onClick={async () => {
                                  if (!window.confirm('Reject (cancel) this booking?')) return;
                                  try {
                                    await api.put(`/bookings/${b._id}`, { status: 'cancelled' });
                                    toast.success('Booking cancelled');
                                    fetchData();
                                  } catch (err) {
                                    toast.error('Failed to cancel');
                                  }
                                }}
                              >Reject</button>
                            </span>
                          )}
                        </td>
                        <td className="p-2">₹{b.totalAmount}</td>
                      </tr>
                    ))}
                  {bookings.length === 0 && (
                    <tr><td colSpan={6} className="p-4 text-center text-gray-500">No bookings found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* ANALYTICS WITH CHARTS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* FILTER */}
            <div className="flex gap-4">
              <input type="date" onChange={e => setDateRange({...dateRange, from: e.target.value})}/>
              <input type="date" onChange={e => setDateRange({...dateRange, to: e.target.value})}/>
              <button onClick={fetchData} className="bg-blue-600 text-white px-4 py-1 rounded">
                Apply
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <Card title="Bookings" value={analytics.totalBookings}/>
              <Card title="Revenue" value={`₹${analytics.totalRevenue}`}/>
            </div>
            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded shadow">
                <h3 className="font-bold mb-2">Bookings Per Day</h3>
                <Line
                  data={{
                    labels: analytics.bookingsPerDay.map(d => d.date),
                    datasets: [{
                      label: 'Bookings',
                      data: analytics.bookingsPerDay.map(d => d.count),
                      borderColor: 'rgb(37, 99, 235)',
                      backgroundColor: 'rgba(37, 99, 235, 0.2)',
                    }],
                  }}
                  options={{ responsive: true, plugins: { legend: { display: false } } }}
                />
              </div>
              <div className="bg-white p-4 rounded shadow">
                <h3 className="font-bold mb-2">Revenue Per Day</h3>
                <Line
                  data={{
                    labels: analytics.revenuePerDay.map(d => d.date),
                    datasets: [{
                      label: 'Revenue',
                      data: analytics.revenuePerDay.map(d => d.revenue),
                      borderColor: 'rgb(16, 185, 129)',
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    }],
                  }}
                  options={{ responsive: true, plugins: { legend: { display: false } } }}
                />
              </div>
            </div>
          </div>
        )}

        {/* REVIEW MODERATION */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold mb-2">Pending Reviews</h2>
            {loading && <p>Loading reviews...</p>}
            {unapprovedReviews.length === 0 && !loading && (
              <p className="text-gray-500">No pending reviews.</p>
            )}
            <div className="space-y-4">
              {unapprovedReviews.map((review) => (
                <div key={review._id} className="bg-white p-4 rounded shadow flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <div className="font-semibold">Room: {review.room?.title || review.room}</div>
                    <div>By: {review.user?.email || review.user}</div>
                    <div>Rating: <span className="font-bold">{review.rating}</span></div>
                    <div className="italic">"{review.comment}"</div>
                  </div>
                  <div className="flex gap-2 mt-2 md:mt-0">
                    <button onClick={() => handleApproveReview(review._id)} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Approve</button>
                    <button onClick={() => handleDeleteReview(review._id)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const Card = ({ title, value }) => (
  <div className="bg-white p-5 rounded shadow">
    <p>{title}</p>
    <h2 className="text-xl font-bold">{value}</h2>
  </div>
);

export default AdminDashboard;