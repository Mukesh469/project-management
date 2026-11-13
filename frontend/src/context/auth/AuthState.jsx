
import {
  useCallback,
  useEffect,
  useState
} from "react";

import AuthContext from "./AuthContext";

const AuthState = ({ children }) => {

  const [accessToken, setAccessToken] = useState(() => {
    try {
      return sessionStorage.getItem("accessToken") || null;
    } catch {
      return null;
    }
  });

  const [person, setPerson] = useState(() => {
    try {
      const stored = sessionStorage.getItem("person");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);

  const host = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  const logout = useCallback(async () => {
    try {
      await fetch(`${host}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setAccessToken(null);
      setPerson(null);
      setError(null);
      
      try {
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("person");
      } catch (storageErr) {
        console.warn("SessionStorage clear failed:", storageErr);
      }
    }
  }, [host]);

  const updateAccessToken = useCallback((newToken) => {
    setAccessToken(newToken);
  }, []);

  const login = useCallback(async (email, password, source) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${host}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, source }),
        credentials: "include",
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Login failed");
      }

      const { accessToken: newAccessToken, person: userData } = data.data || {};

      if (!newAccessToken || !userData) {
        throw new Error("Invalid login response");
      }

      setAccessToken(newAccessToken);
      setPerson(userData);

      try {
        sessionStorage.setItem("accessToken", newAccessToken);
        sessionStorage.setItem("person", JSON.stringify(userData));
      } catch (storageErr) {
        console.warn("SessionStorage write failed:", storageErr);
      }

      return {
        success: true,
        message: data.message || "Login successful",
        role: userData.role
      };

    } catch (err) {
      const errorMessage = err.message || "Login failed";
      setError(errorMessage);
      return { success: false, message: errorMessage };

    } finally {
      setLoading(false);
    }

  }, [host]);

  const refreshAccessToken = useCallback(async () => {
    try {
      const response = await fetch(`${host}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Session expired");
      }

      const newAccessToken = data.data?.accessToken;
      const userData = data.data?.person;

      if (!newAccessToken) {
        throw new Error("Invalid refresh response");
      }

      setAccessToken(newAccessToken);
      if (userData) {
        setPerson(userData);
      }
      setError(null);

      try {
        sessionStorage.setItem("accessToken", newAccessToken);
        if (userData) {
          sessionStorage.setItem("person", JSON.stringify(userData));
        }
      } catch (storageErr) {
        console.warn("SessionStorage write failed:", storageErr);
      }

      return newAccessToken;

    } catch (err) {
      console.error("Token refresh failed:", err.message);
      setAccessToken(null);
      setPerson(null);
      try {
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("person");
      } catch (storageErr) {
        console.warn("SessionStorage clear failed:", storageErr);
      }
      throw err;
    }
  }, [host]);

  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    const initializeAuth = async () => {
      try {
        console.log("Attempting to restore session...");
        await refreshAccessToken();
        console.log("Session restored successfully");
      } catch (err) {
        console.log("Session restore failed:", err.message);
        
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`Retry ${retryCount}/${MAX_RETRIES} in 2 seconds...`);
          setTimeout(initializeAuth, 2000);
        } else {
          console.log("Max retries reached. User needs to login.");
          setAccessToken(null);
          setPerson(null);
        }
      } finally {
        if (isMounted && retryCount >= MAX_RETRIES) {
          setInitializing(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };

  }, [host]);

  const contextValue = {
    accessToken,
    person,
    loading,
    initializing,
    error,
    isAuthenticated: !!accessToken && !!person,
    login,
    logout,
    refreshAccessToken,
    updateAccessToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthState;
