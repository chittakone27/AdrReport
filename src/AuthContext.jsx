import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    username: "01chittakone",
    password: "Wen27101998!",

  });

  const clearAuth = () => setAuth(null);

  return (
    <AuthContext.Provider value={{ auth, setAuth, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
