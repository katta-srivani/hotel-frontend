import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";

function Register() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    passwordConfirm: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { register: registerUser } = useContext(AuthContext);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Password validation
    if (form.password !== form.passwordConfirm) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    const result = await registerUser(
      form.firstName,
      form.email,
      form.password,
      form.phone,
      form.lastName
    );

    if (result.success) {
      toast.success("Registered successfully 🎉");

      // ✅ Go to login (correct flow)
      setTimeout(() => {
        navigate("/login", { state: { email: form.email } });
      }, 500);
    } else {
      toast.error(result.message || "Registration failed");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-8">

        <h2 className="text-3xl font-bold text-gray-800 text-center">
          Create Account
        </h2>
        <p className="text-gray-500 text-center mb-6">
          Start your journey today
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={form.firstName}
              onChange={handleChange}
              required
              className="input"
            />

            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={form.lastName}
              onChange={handleChange}
              className="input"
            />
          </div>

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={handleChange}
            required
            className="input"
          />

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={form.phone}
            onChange={handleChange}
            required
            className="input"
          />

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              className="input pr-10"
            />

            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-500 cursor-pointer"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* Confirm Password */}
          <input
            type={showPassword ? "text" : "password"}
            name="passwordConfirm"
            placeholder="Confirm Password"
            value={form.passwordConfirm}
            onChange={handleChange}
            required
            className="input"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 rounded-xl hover:scale-[1.02] transition-all duration-300 shadow-md hover:shadow-xl"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-600 font-semibold hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>

      {/* Tailwind reusable class */}
      <style>
        {`
          .input {
            width: 100%;
            border: 1px solid #d1d5db;
            border-radius: 0.5rem;
            padding: 0.75rem 1rem;
            outline: none;
            transition: 0.3s;
          }

          .input:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59,130,246,0.2);
          }
        `}
      </style>
    </div>
  );
}

export default Register;