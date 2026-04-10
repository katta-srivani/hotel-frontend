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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      toast.error("Email and password are required");
      return;
    }

    setLoading(true);

    try {
      const result = await login(cleanEmail, password);

      if (result.success) {
        toast.success("Login successful! 🎉");
        navigate("/", { replace: true });
        return;
      } else {
        toast.error(result.message || "Invalid email or password");
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
        {/* LEFT SIDE */}
        <div className="hidden md:flex flex-col justify-center bg-blue-700 text-white p-8 rounded-l-xl">
          <h1 className="text-4xl font-bold mb-4">Welcome Back 👋</h1>
          <p className="text-blue-100">
            Login to manage your bookings and explore hotels with ease.
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div className="p-8 md:p-12">
          <h2 className="text-3xl font-bold mb-2">Sign In</h2>
          <p className="text-gray-500 mb-6">Enter your credentials to access your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* EMAIL */}
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

            {/* PASSWORD */}
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

            {/* FORGOT PASSWORD */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-blue-600 hover:underline text-sm font-semibold"
              >
                Forgot password?
              </Link>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-lg font-semibold text-white transition transform ${
                loading
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-blue-800 bg-blue-700 hover:scale-105 shadow-lg"
              }`}
              style={{ background: loading ? undefined : 'linear-gradient(to right, #2563eb, #1e40af), #2563eb' }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* REGISTER LINK */}
          <p className="text-center mt-6 text-gray-500 text-sm">
            Don’t have an account?{" "}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;