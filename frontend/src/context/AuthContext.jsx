import { createContext, useContext, useEffect, useState } from "react";
import { loginUser, registerUser, logoutUser, getMe } from "../api/auth";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    setUser(data.user);
    return data.user;
  };

  const register = async (data) => {
    const result = await registerUser(data);
    setUser(result.user);
    return result.user;
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  const isBuyer    = user?.role === "BUYER";
  const isSupplier = user?.role === "SUPPLIER";

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout, isBuyer, isSupplier }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);