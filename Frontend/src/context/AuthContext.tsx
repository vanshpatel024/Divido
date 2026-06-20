import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
  username?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string, username: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const resolveAvatarUrl = (url: string, nameOrId: string): string => {
  if (url && url.includes("ui-avatars.com") && url.includes("background=random")) {
    const colors = ["AAD9BB", "C9B7E0", "F7DCB9", "FBC4AB", "B7D4E0", "E0CFB7"];
    let hash = 0;
    for (let i = 0; i < nameOrId.length; i++) {
      hash = nameOrId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    const color = colors[index];
    return url.replace("background=random", `background=${color}`);
  }
  return url;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("divido_token");
      if (storedToken) {
        try {
          const res = await fetch("http://localhost:3000/auth/me", {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });
          
          if (res.status === 401) {
            localStorage.removeItem("divido_token");
            setToken(null);
            setUser(null);
          } else {
            const responseData = await res.json();
            if (responseData.success) {
              const profile = responseData.data.profile || {};
              const authUser = responseData.data.auth || {};
              const resolvedDisplayName = profile.display_name || authUser.user_metadata?.display_name || "";
              const rawAvatarUrl = profile.avatar_url || authUser.user_metadata?.avatar_url || "";
              const resolvedAvatarUrl = resolveAvatarUrl(rawAvatarUrl, authUser.id || profile.id || resolvedDisplayName);

              setToken(storedToken);
              setUser({
                id: authUser.id || profile.id,
                email: authUser.email || profile.email,
                display_name: resolvedDisplayName,
                avatar_url: resolvedAvatarUrl,
              });
            } else {
              localStorage.removeItem("divido_token");
              setToken(null);
              setUser(null);
            }
          }
        } catch (error) {
          console.error("Error restoring auth session:", error);
          // Don't clear token on network failure, just set loading false so offline capability or retry works.
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const responseData = await res.json();

    if (!responseData.success) {
      throw new Error(responseData.message || "Login failed");
    }

    const { session, user: authUser } = responseData.data;
    const tokenStr = session.access_token;
    
    let display_name = authUser.user_metadata?.display_name || "";
    let avatar_url = authUser.user_metadata?.avatar_url || "";
    
    // Try to get profile as well if it's there
    try {
      const profileRes = await fetch("http://localhost:3000/auth/me", {
        headers: {
          Authorization: `Bearer ${tokenStr}`,
        },
      });
      const profileData = await profileRes.json();
      if (profileData.success && profileData.data.profile) {
        display_name = profileData.data.profile.display_name || display_name;
        avatar_url = profileData.data.profile.avatar_url || avatar_url;
      }
    } catch (e) {
      console.warn("Could not fetch profile, using user metadata:", e);
    }

    const resolvedAvatarUrl = resolveAvatarUrl(avatar_url, authUser.id || display_name);

    localStorage.setItem("divido_token", tokenStr);
    setToken(tokenStr);
    setUser({
      id: authUser.id,
      email: authUser.email,
      display_name,
      avatar_url: resolvedAvatarUrl,
    });
  };

  const signup = async (email: string, password: string, displayName: string, username: string) => {
    const res = await fetch("http://localhost:3000/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, displayName, username }),
    });

    const responseData = await res.json();

    if (!responseData.success) {
      throw new Error(responseData.message || "Signup failed");
    }

    const { session, user: authUser } = responseData.data;
    
    if (session && session.access_token) {
      const tokenStr = session.access_token;
      const rawAvatarUrl = authUser.user_metadata?.avatar_url || "";
      const resolvedAvatarUrl = resolveAvatarUrl(rawAvatarUrl, authUser.id || displayName);

      localStorage.setItem("divido_token", tokenStr);
      setToken(tokenStr);
      setUser({
        id: authUser.id,
        email: authUser.email,
        display_name: displayName,
        avatar_url: resolvedAvatarUrl,
        username,
      });
    } else {
      // If signup does not auto-login (e.g. requires verification)
      throw new Error("Registration successful. Please log in.");
    }
  };

  const logout = () => {
    localStorage.removeItem("divido_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
