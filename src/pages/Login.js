// src/pages/Login.jsx
import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const cleanEmail = email.trim();
    if (!validateEmail(cleanEmail)) {
      toast.error("Enter a valid email address");
      return;
    }
    if (!password) {
      toast.error("Password is required");
      return;
    }

    setLoading(true);
    try {
      const result = await login(cleanEmail, password);
      if (result && result.success) {
        toast.success("Login successful!");
        navigate("/", { replace: true });
      } else {
        toast.error(result?.message || "Invalid email or password");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-700 to-blue-500 px-4">
      <div className="bg-white shadow-2xl rounded-xl max-w-4xl w-full grid md:grid-cols-2">
        <div className="hidden md:flex flex-col justify-center bg-blue-700 text-white p-8 rounded-l-xl">
          <h1 className="text-4xl font-bold mb-4">Welcome Back</h1>
          <p className="text-blue-100">
            Login to manage your bookings and explore hotels with ease.
          </p>
        </div>

        <div className="p-8 md:p-12">
          <h2 className="text-3xl font-bold mb-2">Sign In</h2>
          <p className="text-gray-500 mb-6">Enter your credentials to access your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-1">Email</label>
              <div className="flex items-center border rounded-lg overflow-hidden">
                <span className="px-3 text-gray-500">
                  <FaEnvelope />
                </span>
                <input
                  type="email"
                  className="flex-1 px-3 py-2 outline-none"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-1">Password</label>
              <div className="flex items-center border rounded-lg overflow-hidden">
                <span className="px-3 text-gray-500">
                  <FaLock />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  className="flex-1 px-3 py-2 outline-none"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span
                  className="px-3 text-gray-500 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-blue-600 hover:underline text-sm font-semibold"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-lg font-semibold text-white transition transform ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-blue-800 bg-blue-700 hover:scale-105 shadow-lg"
              }`}
              style={{
                background: loading
                  ? undefined
                  : "linear-gradient(to right, #2563eb, #1e40af), #2563eb",
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-500 text-sm">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
              Create one
            </Link>
          </p>

          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
            <p className="font-semibold mb-2">Demo credentials</p>
            <p>User: <span className="font-mono">user@example.com</span></p>
            <p>Password: <span className="font-mono">Password@123</span></p>
            <p className="mt-2">Admin: <span className="font-mono">admin@example.com</span></p>
            <p>Password: <span className="font-mono">Admin@123</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
