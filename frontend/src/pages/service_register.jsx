import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/api";
import BTRheader from "../components/modals/btrHeader";
import { ChevronLeftCircle } from "lucide-react"


export default function ServiceRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    company_name:'',
    email: '',
    password: '',
    confirm_password: '',
    mobile_number: '',
    address: '',
    service_type: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleBack = () => navigate("/admin/dashboard");

  const serviceTypes = [
    { value: 'Vehicle', label: 'Vehicle' },
    { value: 'Appliances', label: 'Appliances' },
    { value: 'ICT Equipment', label: 'ICT Equipment' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    if (formData.password !== formData.confirm_password) {
      setErrors(prev => ({ ...prev, confirm_password: 'Passwords do not match.' }));
      setLoading(false);
      return;
    }

    try {
      await axios.get('/sanctum/csrf-cookie');

      const response = await axios.post('/api/register', {
        name: formData.name,
        username: formData.username,
        company_name:formData.company_name,
        email: formData.email,
        password: formData.password,
        mobile_number: formData.mobile_number,
        address: formData.address,
        service_type: formData.service_type,
        role: 'service_user',
      });

      //console.log("Registered service user:", response.data.user);
      navigate('/');
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
    <>
      <div className="min-h-screen bg-gray-50 relative">
        <BTRheader />
        <div className="flex justify-center items-center w-dvw p-10">
          <div className="flex flex-col items-center w-full max-w-sm">
            <button
              onClick={handleBack}
              className="w-full px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-white font-bold rounded mb-6"
              style={{ boxShadow: "0 4px 50px rgba(255, 255, 255, 0.3)" }}
            >
              <ChevronLeftCircle className="h-5 w-5 inline-block mr-2" />
              Back to Dashboard
            </button>

            <div
              className="relative p-6 space-y-4 w-full max-w-xl rounded-lg shadow-md bg-white"
              style={{ boxShadow: "0 4px 50px rgba(0, 0, 0, 0.3)" }}
            >
              <form onSubmit={handleRegister} className="space-y-4">
                <h1 className="text-2xl font-bold mb-4 text-black text-center">
                  Service User Registration
                </h1>

                {Object.values(errors).map((err, i) => (
                  <p key={i} className="text-red-500 mb-2">
                    {err}
                  </p>
                ))}

                <div className="flex flex-col items-start space-y-2">
                  <input
                    name="company_name"
                    placeholder="Company Name"
                    value={formData.company_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:ring-yellow-400"
                    required
                  />
                </div>

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
                      const digits = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 11);
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
                    name="address"
                    placeholder="Address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:ring-yellow-400"
                    required
                  />
                </div>

                <div className="flex flex-col items-start space-y-2">
                  <select
                    name="service_type"
                    value={formData.service_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:ring-yellow-400"
                    required
                  >
                    <option value="">Select Service Type</option>
                    {serviceTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
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
                  className="w-full px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-white font-bold rounded"
                >
                  {loading ? "Registering..." : "Register Account"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
