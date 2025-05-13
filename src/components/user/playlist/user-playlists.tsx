"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Music, Library, Plus } from "lucide-react";

interface PlaylistItem {
  _id: string;
  name: string;
  songs: string[];
  visibility: string;
  isFeatured: boolean;
  createdAt: string;
}

interface UserPlaylistsProps {
  userId: string;
  limit?: number;
  showCreateButton?: boolean;
  isCurrentUser?: boolean;
}

export default function UserPlaylists({
  userId,
  limit = 4,
  showCreateButton = true,
  isCurrentUser = false,
}: UserPlaylistsProps) {
  const { data: session } = useSession();
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserPlaylists = async () => {
      try {
        setLoading(true);
        setError(null);

        let endpoint = '';
        let headers: HeadersInit = {};
        
        // If viewing current user's playlists, use the user endpoint that includes private playlists
        if (isCurrentUser && session?.user?.access_token) {
          endpoint = `${process.env.NEXT_PUBLIC_API_URL}/playlists/user`;
          headers = {
            Authorization: `Bearer ${session.user.access_token}`,
          };
        } else {
          // Otherwise fetch only public playlists from this user
          endpoint = `${process.env.NEXT_PUBLIC_API_URL}/playlists?userId=${userId}&visibility=PUBLIC`;
        }

        const response = await fetch(endpoint, { headers });
        
        if (!response.ok) {
          throw new Error("Failed to fetch playlists");
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          setPlaylists(result.data.slice(0, limit));
        } else {
          setError(result.message || "Failed to load playlists");
        }
      } catch (error) {
        console.error("Error fetching playlists:", error);
        setError("An error occurred while loading playlists");
      } finally {
        setLoading(false);
      }
    };

    fetchUserPlaylists();
  }, [userId, session, limit, isCurrentUser]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Playlists</h2>
          {showCreateButton && isCurrentUser && (
            <Link href="/playlist/create">
              <Button size="sm">
                <Plus size={16} className="mr-1" /> Create
              </Button>
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <Skeleton className="h-36 w-full mb-3 rounded-md" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Playlists</h2>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Playlists</h2>
          {showCreateButton && isCurrentUser && (
            <Link href="/playlist/create">
              <Button size="sm">
                <Plus size={16} className="mr-1" /> Create
              </Button>
            </Link>
          )}
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-center">
          <Library className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No playlists yet</h3>
          {isCurrentUser ? (
            <>
              <p className="text-gray-500 mb-4">Create your first playlist to organize your favorite tracks.</p>
              <Link href="/playlist/create">
                <Button>Create Playlist</Button>
              </Link>
            </>
          ) : (
            <p className="text-gray-500">This user hasn't created any public playlists yet.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Playlists</h2>
        {showCreateButton && isCurrentUser && (
          <Link href="/playlist/create">
            <Button size="sm">
              <Plus size={16} className="mr-1" /> Create
            </Button>
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {playlists.map((playlist) => (
          <Link key={playlist._id} href={`/playlist/${playlist._id}`}>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow group cursor-pointer h-full flex flex-col">
              <div className="bg-gradient-to-br from-purple-400 to-indigo-600 aspect-square rounded-md mb-3 flex items-center justify-center text-white text-4xl relative overflow-hidden">
                {playlist.name?.charAt(0).toUpperCase() || "P"}
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity flex items-center justify-center">
                  <Library className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-1 line-clamp-1">{playlist.name}</h3>
              <div className="flex items-center text-sm text-gray-500 mt-auto">
                <Music size={14} className="mr-1" />
                <span>{playlist.songs?.length || 0} songs</span>
                {playlist.visibility === "PRIVATE" && (
                  <span className="ml-auto text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    Private
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
      {playlists.length > 0 && playlists.length === limit && (
        <div className="text-center mt-4">
          <Link href={isCurrentUser ? "/profile" : `/profile/${userId}`}>
            <Button variant="outline">View All Playlists</Button>
          </Link>
        </div>
      )}
    </div>
  );
}