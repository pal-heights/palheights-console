import { useEffect, useState } from 'react';

export interface User {
  userName?: string;
  profilePicture?: string;
  // add other fields as needed
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // console.log("useUser running on", typeof window !== "undefined" ? "client" : "server");
    fetch('/api/user/me', {
      credentials: 'include', // Send cookies with the request
    })
      .then(res => {
        // console.log("/api/user/me response status:", res.status);
        return res.ok ? res.json() : Promise.reject(res);
      })
      .then(data => {
        // console.log("/api/user/me response data:", data);
        setUser(data.user || null);
        setLoading(false);
      })
      .catch((err) => {
        // console.error("/api/user/me fetch error:", err);
        setUser(null);
        setLoading(false);
      });
  }, []);

  return { user, loading, setUser };
} 