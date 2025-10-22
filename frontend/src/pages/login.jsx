import { useState } from "react";
import api from "../api/api"; // centralized Axios instance
import { useNavigate } from "react-router-dom";
import btrlogo from "../assets/btrlogo.png";
import btrlegpics from "../assets/btrlegpics.jpg";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Eye } from 'lucide-react';
import { EyeClosed } from 'lucide-react';
import { useEffect } from "react";

export default function Login() {
  const [identifier, setIdentifier] = useState(""); // username or email
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!showPassword) return; // nothing to do
    const t = setTimeout(() => setShowPassword(false), 3000);
    return () => clearTimeout(t); // clean up if user clicks again
  }, [showPassword]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Get CSRF cookie
      await api.get("/sanctum/csrf-cookie");

      // Attempt login
      // const response = await api.post("/api/login", {
      //   login: identifier,
      //   password,
      // });
      await login(identifier, password).then((e) => {
        console.log("Current user logged-in:", identifier, e);
        if (e.redirect) {
          navigate(e.redirect);
        }
      });

      // console.log("Login response:", response.data);

      // Navigate to the redirect URL provided by the backend
      // if (response.data.redirect) {
      //   console.log("Navigating to:", response.data.redirect);
      //   navigate(response.data.redirect);
      // } else {
      //   console.log("No redirect URL, navigating to home");
      //   navigate("/");
      // }
    } catch (err) {
      console.error("Login error:", err.message ?? err);
      setError(
        err.response?.data?.message || "Invalid credentials or login failed."
      );
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

      {/* login form */}
      <form
        onSubmit={handleLogin}
        className="relative p-6 space-y-4 w-full max-w-sm rounded-lg bg-white"
        style={{ boxShadow: "0 4px 50px rgba(0, 0, 0, 0.3)" }}
      >
        {/* logo and title */}
        <img src={btrlogo} alt="Logo" className="mx-auto w-24 h-24" />
        <h2 className="text-xl font-bold text-gray-800 text-center">Login</h2>

        {/* username */}
        <div className="flex flex-col items-start space-y-2">
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Username or Email"
            required
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:ring-yellow-400"
          />
        </div>

        {/* password */}

        <div className="flex flex-col items-start space-y-2 relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full px-4 py-2 pr-10 border rounded focus:outline-none focus:ring focus:ring-yellow-400"
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 inline-block top-1 focus:outline-none"
          >
            {showPassword ? (
              <Eye className="h-5 w-5 text-gray-600 hover:text-gray-800" />
            ) : (
              <EyeClosed className="h-5 w-5 text-gray-600 hover:text-gray-800" />
            )}
          </button>

          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>

        {/* login button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 text-white font-bold rounded ${
            loading ? "bg-gray-400" : "bg-yellow-400 hover:bg-yellow-500"
          }`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* register Link */}
        {/* <p className="text-center text-sm">
          Don’t have an account?{" "}
          <Link
            to="/register/admin"
            className="text-blue-600 hover:underline font-medium"
          >
            Register  
          </Link>
        </p> */}

        {/* forgot password */}
        <div className="text-sm text-right -mt-2 mb-2">
          <Link to="/forgot-password" className="text-blue-600 hover:underline">
            Forgot password?
          </Link>
        </div>
      </form>
    </div>
  );
}
