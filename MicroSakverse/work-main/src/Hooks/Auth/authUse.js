import { useState, useEffect, useCallback } from "react";
import forge from 'node-forge';

const APIURL = import.meta.env.VITE_API_URL;
const PORT = import.meta.env.VITE_BACKEND_PORT;

const API_BASE = "/sakverse";

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
YOUR_RSA_PUBLIC_KEY_HERE
-----END PUBLIC KEY-----`;

function encryptPassword(password) {
  const publicKey = forge.pki.publicKeyFromPem(PUBLIC_KEY);
  const encrypted = publicKey.encrypt(password, 'RSA-OAEP');
  return forge.util.encode64(encrypted);
}

export default function authUse() {
  const [authInfo, setAuthInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // ✅ CHECK AUTH (MAIN SOURCE OF TRUTH)
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/check`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        mode: "cors",
      });

      if (!res.ok) throw new Error("Unauthorized");

      const data = await res.json();

      setAuthInfo(data);
      setIsAuthenticated(data.isAuthenticated);

      // ✅ RESTORE USER AFTER REFRESH
      if (data.isAuthenticated) {
        setUser({
          displayName: data.displayName,
          allowedProjects: data.allowedProjects?.map(String) || [],
        });
      }

    } catch (err) {
      setAuthInfo(null);
      setIsAuthenticated(false);
      // ❌ DO NOT clear user here (important)
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ LOGIN
  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);

    const encodedPassword = btoa(password);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        mode: "cors",
        body: JSON.stringify({ username, password: encodedPassword }),
      });

      if (!res.ok) throw new Error("Invalid username or password");

      // ✅ DON'T TRUST LOGIN RESPONSE → use checkAuth
      await checkAuth();

      setIsAuthenticated(true);

    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login failed");
      setAuthInfo(null);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, [checkAuth]);

  // ✅ LOGOUT
  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
        mode: "cors",
      });

      setAuthInfo(null);
      setUser(null);
      setIsAuthenticated(false);

    } catch (err) {
      console.warn("Logout failed:", err);
    }
  }, []);

  // ✅ ACCESS CONTROL
  const canAccessProject = (projectId) => {
    return user?.allowedProjects?.includes(projectId.toString());
  };

  // ✅ INITIAL LOAD
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    login,
    logout,
    authInfo,
    isAuthenticated,
    loading,
    error,
    user,
    canAccessProject,
  };
}