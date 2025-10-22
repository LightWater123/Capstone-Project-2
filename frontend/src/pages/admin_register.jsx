import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/api";
import btrlogo from "../assets/btrlogo.png";
import btrlegpics from "../assets/btrlegpics.jpg";
import { Link } from "react-router-dom";
import { ChevronLeftCircle } from "lucide-react";

export default function AdminRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirm_password: "",
    mobile_number: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBack = () => navigate("/admin/dashboard");

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    if (formData.password !== formData.confirm_password) {
      setErrors((prev) => ({
        ...prev,
        confirm_password: "Passwords do not match.",
      }));
      setLoading(false);
      return;
    }

    try {
      await axios.get("/sanctum/csrf-cookie");

      const response = await axios.post("/api/register", {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.confirm_password,
        mobile_number: formData.mobile_number,
        role: "admin",
      });

      console.log("Registered admin user:", response.data.user);
      //navigate('/');
    } catch (err) {
      console.error("Registration error:", err.response?.data);
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        alert("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* background image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${btrlegpics})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      ></div>

      {/* yellow overlay */}
      <div className="absolute inset-0 bg-[#FCFC62] opacity-90"></div>

      {/* This new wrapper div fixes the layout.
        - 'relative' places it on top of the overlays.
        - 'flex flex-col' stacks the button and form vertically.
        - 'w-full max-w-sm' constraints the width.
      */}
      <div className="relative flex flex-col items-center w-full max-w-sm">
        <button
          onClick={handleBack}
          className="w-full px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-white font-bold rounded mb-6"
          style={{ boxShadow: "0 4px 50px rgba(255, 255, 255, 0.3)" }}
        >
          <ChevronLeftCircle className="h-5 w-5 inline-block mr-2" />
          Back to Dashboard
        </button>

        <form
          onSubmit={handleRegister}
          className="p-6 space-y-4 w-full max-w-sm rounded-lg bg-white"
          style={{ boxShadow: "0 4px 50px rgba(0, 0, 0, 0.3)" }}
        >
          <img src={btrlogo} alt="Logo" className="mx-auto w-24 h-24" />
          <h1 className="text-2xl font-bold text-center text-gray-800">
            Admin Registration
          </h1>

          {Object.values(errors).map((err, i) => (
            <p key={i} className="text-red-500 mb-2">
              {err}
            </p>
          ))}

          <div className="flex flex-col items-start space-y-2">
            <input
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:ring-yellow-400"
              required
            />
          </div>

          <div className="flex flex-col items-start space-y-2">
            <input
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:ring-yellow-400"
              required
            />
          </div>

          <div className="flex flex-col items-start space-y-2">
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:ring-yellow-400"
              required
            />
          </div>

          <div className="flex flex-col items-start space-y-2">
            <input
              name="mobile_number"
              type="tel"
              placeholder="Mobile Number"
              value={formData.mobile_number}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                handleChange({
                  target: { name: "mobile_number", value: digits },
                });
              }}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:ring-yellow-400"
              required
              pattern="\d{11}"
            />
          </div>

          <div className="flex flex-col items-start space-y-2">
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:ring-yellow-400"
              required
            />
          </div>

          <div className="flex flex-col items-start space-y-2">
            <input
              name="confirm_password"
              type="password"
              placeholder="Confirm Password"
              value={formData.confirm_password}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:ring-yellow-400"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 text-white font-bold rounded bg-yellow-400 hover:bg-yellow-500"
          >
            {loading ? "Registering..." : "Register"}
          </button>

          {/* register Link */}
          <p className="text-center text-sm">
            Back To{" "}
            <Link to="/" className="text-blue-600 hover:underline font-medium">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}