import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

function Profile() {
  const { user, updateProfile } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({
    bookings: 0,
    favorites: 0,
  });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    profileImage: '',
  });

  useEffect(() => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      profileImage: user?.profileImage || '',
    });
  }, [user]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [bookingsRes, favoritesRes] = await Promise.all([
          api.get('/bookings/my'),
          api.get('/favorites'),
        ]);

        setStats({
          bookings: bookingsRes.data?.bookings?.length || 0,
          favorites: favoritesRes.data?.favorites?.length || 0,
        });
      } catch (error) {
        setStats({ bookings: 0, favorites: 0 });
      }
    };

    loadStats();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const res = await api.put('/users/update-profile', formData);
      const updatedUser = res.data?.data || res.data;
      updateProfile(updatedUser);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Guest';
  const avatarName = [formData.firstName, formData.lastName].filter(Boolean).join(' ') || fullName;

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="bg-white rounded-3xl shadow-lg p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <img
              src={formData.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName)}`}
              alt={fullName}
              className="w-24 h-24 rounded-full object-cover shadow-md"
            />

            <div>
              <h2 className="text-2xl font-bold text-gray-800">{fullName}</h2>
              <p className="text-gray-500">{user?.email}</p>
              <p className="text-sm text-gray-400 mt-1">
                Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
              </p>
              {user?.role === 'admin' && (
                <span className="bg-yellow-400 text-xs px-2 py-1 rounded mt-2 inline-block">
                  Admin
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => setIsEditing((prev) => !prev)}
            className={`px-5 py-2 rounded-full font-medium transition shadow ${
              isEditing ? 'bg-red-500 text-white' : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="bg-white rounded-2xl p-6 shadow text-center">
            <p className="text-xl font-bold">{stats.bookings}</p>
            <p className="text-gray-500 text-sm">Bookings</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow text-center">
            <p className="text-xl font-bold">{stats.favorites}</p>
            <p className="text-gray-500 text-sm">Favorites</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow text-center">
            <p className="text-xl font-bold capitalize">{user?.role || 'user'}</p>
            <p className="text-gray-500 text-sm">Account Type</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow text-center">
            <p className="text-xl font-bold">{user?.phone || '-'}</p>
            <p className="text-gray-500 text-sm">Phone</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow p-8">
          <h3 className="text-lg font-semibold mb-6">Personal Information</h3>

          <div className="grid md:grid-cols-2 gap-6">
            <input
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="First Name"
              className="border rounded-xl px-4 py-3 bg-gray-50"
            />
            <input
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="Last Name"
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
              name="profileImage"
              value={formData.profileImage}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="Profile image URL"
              className="border rounded-xl px-4 py-3 bg-gray-50"
            />
          </div>

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

        <div className="bg-white rounded-3xl shadow p-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-4">My Bookings</h3>
            <Link
              to="/mybookings"
              className="inline-block bg-blue-600 text-white px-5 py-2 rounded-xl mb-2"
            >
              View My Bookings
            </Link>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-4">My Favorites</h3>
            <Link
              to="/favorites"
              className="inline-block bg-black text-white px-5 py-2 rounded-xl"
            >
              View Favorites
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
