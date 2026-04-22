import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import RoomDetails from "./pages/RoomDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyBookings from "./pages/MyBookings.js";
import BookingDetails from "./pages/BookingDetails.js";
import Favorites from "./pages/Favorites";
import Wishlist from "./pages/Wishlist";
import Profile from "./pages/Profile";
import Checkout from "./pages/Checkout";
import Billing from "./pages/Billing";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Gratitude from "./pages/Gratitude";
import Offer from "./pages/Offer";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PrivateRoute from "./components/PrivateRoute";
import { AuthContext } from "./context/AuthContext";

function App() {
  const { isAuthenticated, loading } = React.useContext(AuthContext);

  // Show a smooth full-page loading spinner while auth state initializes
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.5rem'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <Navbar />
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/rooms/:id" element={<RoomDetails />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/offers" element={<Offer />} />
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" replace />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Protected user routes */}
          <Route path="/mybookings" element={<PrivateRoute><MyBookings /></PrivateRoute>} />
          <Route path="/booking/:id" element={<PrivateRoute><BookingDetails /></PrivateRoute>} />
          <Route path="/billing" element={<PrivateRoute><Billing /></PrivateRoute>} />
          <Route path="/gratitude" element={<PrivateRoute><Gratitude /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/favorites" element={<PrivateRoute><Favorites /></PrivateRoute>} />
          <Route path="/wishlist" element={<PrivateRoute><Wishlist /></PrivateRoute>} />
          <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />

          {/* Admin routes */}
          <Route path="/admin/dashboard" element={<PrivateRoute adminOnly={true}><AdminDashboard /></PrivateRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
