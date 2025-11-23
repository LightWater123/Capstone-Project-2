import { useAuth } from "@/auth/AuthContext";
import GlobalSpinner from "@/components/loader";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RouteSession() {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const navigate = useNavigate();

  if (url === "" && user !== undefined) {
    if (user && user.role === "service_user") {
      setUrl("/service/dashboard");
    } else if (user && user.role === "admin") {
      setUrl("/admin/dashboard");
    } else {
      setUrl("/login");
    }
  }

  useEffect(() => {
    if (url.trim()) {
      navigate(url, { replace: true });
    }
  }, [url]);
  return <GlobalSpinner />;
}
