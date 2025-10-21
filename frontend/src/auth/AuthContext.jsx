import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

const AuthContext = createContext(null);

// redirects an unauthorized user to the login trying to access a page
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  const Navigate = useNavigate();

  useEffect(() => {
    async function run() {
      if (user === undefined) {
        const res = await api.get("/api/verifyUser");
        if (res.data.user) {
          setUser(res.data.user);
        } else {
          throw new Error("no user data");
        }
      }
    }
    run().catch(() => {
      setUser(null);
      Navigate("/");
    });
  }, [user]);

  const login = async (user, password) => {
    const response = await api.post("/api/login", {
      login: user,
      password,
    });
    if (response.data) {
      setUser(response.data.user);
      return response.data;
    } else {
      setUser(null);
      return null;
    }
  };

  const logout = async (user, password) => {
    const response = await api.post("/api/logout");
    setUser(null);
    return null;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
