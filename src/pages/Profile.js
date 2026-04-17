import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  FaUser,
  FaPhone,
  FaHome,
  FaGlobe,
  FaEnvelope,
  FaEdit,
  FaSave
} from 'react-icons/fa';

function Profile() {
  const { user, updateProfile } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || '',
    address: user?.address || '',
    state: user?.state || '',
    zipCode: user?.zipCode || '',
    country: user?.country || '',
    amenities: user?.amenities || [],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await api.put('/users/update-profile', formData);
      updateProfile(res.data.data || res.data);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // User Activity Log (simple localStorage-based)
  const [activityLog, setActivityLog] = useState([]);
  React.useEffect(() => {
    const log = JSON.parse(localStorage.getItem("activityLog") || "[]");
    setActivityLog(log.slice(-10).reverse()); // show last 10, newest first
  }, []);

  return (
  <div className="min-h-screen bg-gray-100 py-10 px-4">
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Profile Card */}
      <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col md:flex-row items-center justify-between gap-6">

        <div className="flex items-center gap-6">
          <img
            src={`https://ui-avatars.com/api/?name=${user?.name}`}
            alt="profile"
            className="w-24 h-24 rounded-full object-cover shadow-md"
          />

          <div>
            <h2 className="text-2xl font-bold text-gray-800">{user?.name}</h2>
            <p className="text-gray-500">{user?.email}</p>

            {user?.role === 'admin' && (
              <span className="bg-yellow-400 text-xs px-2 py-1 rounded mt-1 inline-block">
                Admin
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`px-5 py-2 rounded-full font-medium transition shadow
            ${isEditing
              ? 'bg-red-500 text-white'
              : 'bg-black text-white hover:bg-gray-800'}`}
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {/* Stats Section */}
            {/* User Activity Log */}
            <div className="bg-white rounded-3xl shadow p-8">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              {activityLog.length === 0 ? (
                <div className="text-gray-400">No recent activity found.</div>
              ) : (
                <ul className="list-disc pl-6 space-y-1 text-gray-700 text-sm">
                  {activityLog.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow text-center">
          <p className="text-xl font-bold">12</p>
          <p className="text-gray-500 text-sm">Bookings</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow text-center">
          <p className="text-xl font-bold">5</p>
          <p className="text-gray-500 text-sm">Favorites</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow text-center">
          <p className="text-xl font-bold">3</p>
          <p className="text-gray-500 text-sm">Reviews</p>
        </div>
      </div>

      {/* Personal Info */}
      <div className="bg-white rounded-3xl shadow p-8">
        <h3 className="text-lg font-semibold mb-6">Personal Information</h3>

        <div className="grid md:grid-cols-2 gap-6">

          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={!isEditing}
            placeholder="Full Name"
            className="border rounded-xl px-4 py-3 bg-gray-50"
          />

          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={!isEditing}
            placeholder="Phone"
            className="border rounded-xl px-4 py-3 bg-gray-50"
          />

          <input
            name="city"
            value={formData.city}
            onChange={handleChange}
            disabled={!isEditing}
            placeholder="City"
            className="border rounded-xl px-4 py-3 bg-gray-50"
          />

          <input
            name="state"
            value={formData.state}
            onChange={handleChange}
            disabled={!isEditing}
            placeholder="State"
            className="border rounded-xl px-4 py-3 bg-gray-50"
          />

          <input
            name="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            disabled={!isEditing}
            placeholder="Zip Code"
            className="border rounded-xl px-4 py-3 bg-gray-50"
          />

          <input
            name="country"
            value={formData.country}
            onChange={handleChange}
            disabled={!isEditing}
            placeholder="Country"
            className="border rounded-xl px-4 py-3 bg-gray-50"
          />
        </div>

        {/* Amenities */}
        <div className="mt-6">
          <label className="text-sm text-gray-500">Preferred Amenities</label>
          <select
            multiple
            disabled={!isEditing}
            value={formData.amenities}
            onChange={(e) => {
              const options = Array.from(e.target.selectedOptions, o => o.value);
              setFormData(prev => ({ ...prev, amenities: options }));
            }}
            className="w-full mt-2 border rounded-xl p-3 bg-gray-50"
          >
            <option value="wifi">WiFi</option>
            <option value="pool">Pool</option>
            <option value="breakfast">Breakfast</option>
            <option value="parking">Parking</option>
            <option value="gym">Gym</option>
            <option value="spa">Spa</option>
          </select>

          <div className="flex gap-2 mt-3 flex-wrap">
            {formData.amenities?.map(a => (
              <span key={a} className="bg-gray-200 px-3 py-1 rounded-full text-xs">
                {a}
              </span>
            ))}
          </div>
        </div>

        {/* Save Buttons */}
        {isEditing && (
          <div className="flex gap-4 mt-6">
            <button
              onClick={handleSave}
              className="bg-black text-white px-6 py-2 rounded-xl"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Bookings and Favorites */}
      <div className="bg-white rounded-3xl shadow p-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-4">My Bookings</h3>
          <a
            href="/mybookings"
            className="inline-block bg-blue-600 text-white px-5 py-2 rounded-xl mb-2"
          >
            View My Bookings
          </a>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-4">My Favorites</h3>
          <a
            href="/favorites"
            className="inline-block bg-black text-white px-5 py-2 rounded-xl"
          >
            View Favorites
          </a>
        </div>
      </div>

    </div>
  </div>
);
}

export default Profile;