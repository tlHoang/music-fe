import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export const useHasMounted = () => {
  const [hasMounted, setHasMounted] = useState<boolean>(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  return hasMounted;
};

// Add this to your existing custom hooks

export const useUserPlaylists = (userId: string) => {
  const { data: session } = useSession();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserPlaylists = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        setError(null);

        // Get token if available
        const token = session?.user?.access_token;
        const headers: HeadersInit = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        // Use the new endpoint: /playlists/user/{userId}
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/playlists/user/${userId}`,
          { headers }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch playlists for user: ${response.statusText}`
          );
        }

        const result = await response.json();

        if (result.data && result.data.success && result.data.data) {
          // Correctly access nested data array
          setPlaylists(result.data.data);
        } else if (result.success && result.data) {
          // Handle the non-nested format for backward compatibility
          setPlaylists(result.data);
        } else {
          setError(
            result.message || result.data?.message || "Failed to load playlists"
          );
        }
      } catch (err: any) {
        console.error("Error fetching user playlists:", err);
        setError(err.message || "An error occurred while fetching playlists");
      } finally {
        setLoading(false);
      }
    };

    fetchUserPlaylists();
  }, [userId, session]);

  return { playlists, loading, error };
};
