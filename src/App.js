// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Billing from "./pages/Billing";

import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import RoomDetails from "./pages/RoomDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyBookings from "./pages/MyBookings";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import Checkout from "./pages/Checkout";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import PrivateRoute from "./components/PrivateRoute";
import { AuthContext } from "./context/AuthContext";

function App() {
  const { isAuthenticated, user } = React.useContext(AuthContext);

  return (
    <Router>
      <Navbar />
      <Toaster position="top-right" />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/rooms/:id" element={<RoomDetails />} />
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Home />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Home />} />

        {/* Protected user routes */}
        <Route
          path="/my-bookings"
          element={
            <PrivateRoute>
              <MyBookings />
            </PrivateRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <PrivateRoute>
              <Billing />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <PrivateRoute>
              <Favorites />
            </PrivateRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <PrivateRoute>
              <Checkout />
            </PrivateRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <PrivateRoute adminOnly={user?.role === 'admin'}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;