import React, { useEffect, useState } from "react";
import api from "../api/api"; // centralized Axios instance
import { useNavigate } from "react-router-dom";
import btrlogo from "../assets/btrlogo.png";
import btrlegpics from "../assets/btrlegpics.jpg";
import sevenimage from "../assets/sevenimage.png";
import siximage from "../assets/siximage.png";
import eightimage from "../assets/eightimage.png";

import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { EyeClosed, Eye, User, Lock, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Login() {
  const [identifier, setIdentifier] = useState(""); // username or email
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const images = [eightimage, siximage, sevenimage];

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
        //console.log("Current user logged-in:", identifier, e);
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
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="flex h-full animate-banner"
          style={{ width: `${images.length * 2 * 100}vw` }}
        >
          {[...images, ...images].map((img, i) => (
            <div
              key={i}
              className="w-screen h-screen flex-shrink-0"
              style={{
                backgroundImage: `url(${img})`,
                backgroundSize: "auto",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            ></div>
          ))}
        </div>
      </div>
      {/* overlay */}
      <div className="absolute inset-0 bg-blue-950/80 backdrop-blur-none p-4"></div>
      {/* login form */}
      <form
        onSubmit={handleLogin}
        className="relative p-8 space-y-5 w-full max-w-sm
              rounded-2xl
              bg-blue-950/60          
              backdrop-blur-md     
              border-white/80
              shadow-2xl shadow-black/30"
      >
        {/* logo and title */}
        <img src={btrlogo} alt="Logo" className="mx-auto w-24 h-24" />
        <h2 className="text-xl font-bold text-white text-center">Welcome Back!</h2>

        {/* Username */}
        <div className="flex flex-col items-start space-y-2">
          <div className="relative w-full">
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Username or Email"
              required
              className="text-white w-full pl-10 pr-4 py-2 border-b bg-transparent backdrop-blur-none"
            />
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white opacity-40" />
          </div>
        </div>

        {/* password */}

        <div className="flex flex-col items-start space-y-2 relative">
          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="text-white w-full pl-10 pr-10 py-2 border-b bg-transparent backdrop-blur-none"
            />
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white opacity-40" />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 inline-block top-1/2 transform -translate-y-1/2 focus:outline-none"
            >
              {showPassword ? (
                <Eye className="h-5 w-5 text-white opacity-40 hover:text-gray-100" />
              ) : (
                <EyeClosed className="h-5 w-5 text-white opacity-40 hover:text-gray-100" />
              )}
            </button>
          </div>
          {error && <p className="text-red-800 text-sm p-2">{error}</p>}{" "}
        </div>

        {/* login button */}
        <Button
          type="submit"
          disabled={loading}
          className={`relative w-full py-2 px-4 text-lg font-bold rounded-md border-none overflow-hidden ${
            loading ? "cursor-not-allowed opacity-70" : "cursor-pointer"
          } 
            text-white/90 bg-blue-950/70 transition-all duration-500 z-[1] before:content-[''] before:absolute before:inset-y-0 before:left-[-20%] before:right-[-20%] 
            before:bg-white before:-skew-x-[45deg] before:scale-x-0 before:transition-transform before:duration-500 before:z-[-1]
            hover:text-black hover:before:scale-x-100`}
        >
          <LogIn className="h-5 w-5 inline-block mr-2 relative top-[-1px]" />
          {loading ? "Logging in..." : "Login"}
        </Button>

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
        {/* <div className="text-sm text-right -mt-2 mb-2">
          <Link to="/forgot-password" className="text-white hover:underline">
            Forgot password?
          </Link>
        </div> */}
      </form>
    </div>
  );
}
