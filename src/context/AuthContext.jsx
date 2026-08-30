import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);

  /*
    Call this AFTER the backend successfully
    verifies the administrator.
  */
  const completeLogin = (adminData) => {
    setAdmin(adminData);
  };

  const logout = () => {
    setAdmin(null);
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}

export {
  AuthProvider,
  useAuth,
};