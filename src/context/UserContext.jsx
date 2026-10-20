import { createContext, useEffect, useState } from "react";
import { api } from "../lib/api";
// eslint-disable-next-line react-refresh/only-export-components
export const UserContext = createContext();
export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState("");
  useEffect(() => {
    let active = true;
    api("/auth/me")
      .then((data) => {
        if (active) setUser(data.user);
      })
      .catch((error) => {
        if (
          active &&
          !error.message.includes("sign in") &&
          !error.message.includes("session")
        )
          setSessionError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    const expired = () => setUser(null);
    window.addEventListener("session-expired", expired);
    return () => {
      active = false;
      window.removeEventListener("session-expired", expired);
    };
  }, []);
  async function login(credentials) {
    const data = await api("/auth/login", {
      method: "POST",
      body: credentials,
    });
    setSessionError("");
    setUser(data.user);
  }
  async function logout() {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
  }
  return (
    <UserContext.Provider
      value={{ user, loading, login, logout, sessionError }}
    >
      {children}
    </UserContext.Provider>
  );
}
