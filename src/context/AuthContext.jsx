import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

function getStoredAdmin() {
  try {
    const storedAdmin = localStorage.getItem("issuer-admin");
    const accessToken = localStorage.getItem("accessToken");

    if (storedAdmin && accessToken) {
      return JSON.parse(storedAdmin);
    }
  } catch (error) {
    console.error("Unable to restore issuer session:", error);
  }

  return null;
}

function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(getStoredAdmin);

  /*
    Call this AFTER the backend successfully
    verifies the administrator.
  */
  const completeLogin = (adminData) => {
    setAdmin(adminData);
    localStorage.setItem("issuer-admin", JSON.stringify(adminData));
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem("issuer-admin");
    localStorage.removeItem("accessToken");
  };

  const value = useMemo(
    () => ({
      admin,
      isAuthenticated: Boolean(admin),
      completeLogin,
      logout,
    }),
    [admin],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}

export { AuthProvider, useAuth };
