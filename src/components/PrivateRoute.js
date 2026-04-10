// src/components/PrivateRoute.js
import React from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user, loading } = React.useContext(AuthContext);

  // Wait until auth is checked
  if (loading) return <div>Loading...</div>; // you can replace with spinner

  // Not logged in
  if (!isAuthenticated) return <Navigate to="/login" />;

  // Admin only
  if (adminOnly && user?.role !== "admin") return <Navigate to="/" />;

  return children;
};

export default PrivateRoute;