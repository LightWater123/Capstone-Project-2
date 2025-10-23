import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { queryClient } from "@/App";

const AuthContext = createContext(null);

// redirects an unauthorized user to the login trying to access a page
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  const Navigate = useNavigate();

  useEffect(() => {
    async function run() {
      if (!user) {
        const data = await queryClient.fetchQuery({
          queryKey: ["verifyUser"],
          queryFn: async () => {
            const res = await api.get("/api/verifyUser");

            return res.data;
          },
          staleTime: 15000,
          retry: 3,
        });
        if (data.user) {
          setUser(data.user);
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
      queryClient.invalidateQueries({ queryKey: ["verifyUser"] });
      return response.data;
    } else {
      setUser(null);
      return null;
    }
  };

  const logout = async (user, password) => {
    const response = await api.post("/api/logout");
    setUser(null);
    queryClient.invalidateQueries({ queryKey: ["verifyUser"] });

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
