import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/api";
import btrlogo from "../assets/btrlogo.png";
import BTRheader from "../components/modals/btrHeader";
import BTRNavbar from "../components/modals/btrNavbar.jsx";
import btrlegpics from "../assets/btrlegpics.jpg";
import { Link } from "react-router-dom";
import { ChevronLeftCircle, ShieldUser } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeClosed } from "lucide-react";

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

  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
      toast.success(`Registered admin user: ${response.data?.user?.username ?? "new user"}`);
      // navigate('/');
    } catch (err) {
      console.error("Registration error:", err.response?.data);
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 relative">
        <BTRheader />
        <BTRNavbar />
        <div className="flex justify-center items-center w-dvw p-10">
          <div className="flex flex-col items-center w-full max-w-sm ">
            <div className="pb-3 relative">
              <Button
                onClick={handleBack}
                variant="ghost"
                className="relative inline-flex items-center text-sm font-medium px-3 py-1 bg-transparent border-none text-blue-900 hover:text-blue-950
                after:content-[''] after:absolute after:left-1/2 after:bottom-[-4px]
                after:h-[3px] after:w-0 after:bg-blue-950 after:rounded-full after:-translate-x-1/2
                after:transition-all after:duration-300 hover:after:w-full focus:outline-none"
              >
                <ChevronLeftCircle className="h-5 w-5 inline-block mr-2" />
                Back to Dashboard
              </Button>
            </div>

            <form
              onSubmit={handleRegister}
              className="p-6 space-y-4 w-full max-w-sm rounded-2xl bg-white shadow-md"
            >
              <ShieldUser className="mx-auto w-24 h-24" />
              <h1 className="text-xl font-bold text-center text-gray-800 border-b pb-3">
                Admin Registration
              </h1>

              {Object.values(errors).map((err, i) => (
                <p key={i} className="text-red-500 mb-2">
                  {err}
                </p>
              ))}

              <div className="flex flex-col items-start space-y-2">
                <Input
                  name="name"
                  placeholder="Name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded "
                  required
                />
              </div>

              <div className="flex flex-col items-start space-y-2">
                <Input
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded "
                  required
                />
              </div>

              <div className="flex flex-col items-start space-y-2">
                <Input
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded 0"
                  required
                />
              </div>

              <div className="flex flex-col items-start space-y-2">
                <Input
                  name="mobile_number"
                  type="tel"
                  placeholder="Mobile Number"
                  value={formData.mobile_number}
                  onChange={(e) => {
                    const digits = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 11);
                    handleChange({
                      target: { name: "mobile_number", value: digits },
                    });
                  }}
                  className="w-full px-4 py-2 border rounded "
                  required
                  pattern="\d{11}"
                />
              </div>

              <div className="flex flex-col items-start space-y-2 relative">
                <Input
                  name="password"
                  type={showPwd ? "text" : "password"}
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:ring-yellow-400 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/4 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPwd ? (
                    <Eye className="h-5 w-5 inline-block" />
                  ) : (
                    <EyeClosed className="h-5 w-5 inline-block" />
                  )}
                </button>
              </div>

              <div className="flex flex-col items-start space-y-2 relative">
                <Input
                  name="confirm_password"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:ring-yellow-400 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/4 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirm ? (
                    <Eye className="h-5 w-5 inline-block" />
                  ) : (
                    <EyeClosed className="h-5 w-5 inline-block" />
                  )}
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white font-semibold rounded-3xl"
              >
                {loading ? "Registering..." : "Register"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
