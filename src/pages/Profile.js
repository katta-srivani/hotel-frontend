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

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-lg p-6 text-white mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-white/20 text-2xl">
                <FaUser />
              </div>

              <div>
                <h2 className="text-xl font-bold">{user?.name}</h2>
                <p className="text-white/70 text-sm">{user?.email}</p>
                {user?.role === 'admin' && (
                  <span className="bg-yellow-400 text-black text-xs px-2 py-1 rounded mt-1 inline-block">
                    Admin
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition ${
                isEditing
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-white/30 hover:bg-white/40'
              }`}
            >
              {isEditing ? (
                <>
                  <FaSave /> Cancel
                </>
              ) : (
                <>
                  <FaEdit /> Edit
                </>
              )}
            </button>
          </div>
        </div>


        {/* Form */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="font-bold text-lg mb-4">Personal Information</h3>

          {/* Preferred Amenities Dropdown */}
          <div className="mb-6">
            <label className="text-sm text-gray-500 font-semibold mb-2 block">Preferred Amenities</label>
            <select
              multiple
              disabled={!isEditing}
              value={formData.amenities || []}
              onChange={e => {
                const options = Array.from(e.target.selectedOptions, o => o.value);
                setFormData(prev => ({ ...prev, amenities: options }));
              }}
              className="border rounded-lg px-3 py-2 w-full bg-gray-100"
            >
              <option value="wifi">WiFi</option>
              <option value="pool">Pool</option>
              <option value="breakfast">Breakfast</option>
              <option value="parking">Parking</option>
              <option value="gym">Gym</option>
              <option value="spa">Spa</option>
            </select>
            {!isEditing && formData.amenities && formData.amenities.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.amenities.map(a => (
                  <span key={a} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs">{a.charAt(0).toUpperCase() + a.slice(1)}</span>
                ))}
              </div>
            )}
          </div>

          {/* Name + Phone */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            
            <div>
              <label className="text-sm text-gray-500">Full Name</label>
              <div className="flex items-center bg-gray-100 rounded-lg px-3">
                <FaUser className="text-blue-600 mr-2" />
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="bg-transparent w-full py-2 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500">Phone</label>
              <div className="flex items-center bg-gray-100 rounded-lg px-3">
                <FaPhone className="text-blue-600 mr-2" />
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="bg-transparent w-full py-2 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Address Section */}
          <h4 className="font-semibold text-blue-600 mb-3">
            Address Information
          </h4>

          <div className="grid gap-4 mb-6">

            <div>
              <label className="text-sm text-gray-500">Street Address</label>
              <div className="flex items-center bg-gray-100 rounded-lg px-3">
                <FaHome className="text-blue-600 mr-2" />
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="bg-transparent w-full py-2 outline-none"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <input
                name="city"
                placeholder="City"
                value={formData.city}
                onChange={handleChange}
                disabled={!isEditing}
                className="bg-gray-100 rounded-lg px-3 py-2 outline-none"
              />
              <input
                name="state"
                placeholder="State"
                value={formData.state}
                onChange={handleChange}
                disabled={!isEditing}
                className="bg-gray-100 rounded-lg px-3 py-2 outline-none"
              />
              <input
                name="zipCode"
                placeholder="Zip Code"
                value={formData.zipCode}
                onChange={handleChange}
                disabled={!isEditing}
                className="bg-gray-100 rounded-lg px-3 py-2 outline-none"
              />
              <div className="flex items-center bg-gray-100 rounded-lg px-3">
                <FaGlobe className="text-blue-600 mr-2" />
                <input
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="bg-transparent w-full py-2 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="mb-6 opacity-60">
            <label className="text-sm text-gray-500">
              Email (Cannot change)
            </label>
            <div className="flex items-center bg-gray-100 rounded-lg px-3">
              <FaEnvelope className="text-blue-600 mr-2" />
              <input
                value={user?.email}
                disabled
                className="bg-transparent w-full py-2 outline-none"
              />
            </div>
          </div>

          {/* Buttons */}
          {isEditing && (
            <div className="flex gap-4 border-t pt-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>

              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 border border-gray-300 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          )}

          {!isEditing && (
            <div className="bg-blue-100 text-sm text-gray-600 p-3 rounded-lg mt-4">
              Click <strong>Edit</strong> to update your profile.
            </div>
          )}
        </div>
      </div>

      {/* My Favorites Section */}
      <div className="bg-white rounded-2xl shadow p-6 mt-8">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <span className="text-red-500">❤</span> My Favorites
        </h3>
        <a
          href="/favorites"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          View Favorite Rooms
        </a>
      </div>
    </div>
  );
}

export default Profile;