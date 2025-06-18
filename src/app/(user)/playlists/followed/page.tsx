"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Music, Library, Heart, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import FollowPlaylistButton from "@/components/user/playlist/follow-playlist-button";

interface PlaylistUser {
  _id: string;
  name: string;
  username: string;
  profilePicture?: string;
}

interface FollowedPlaylist {
  _id: string;
  name: string;
  userId: PlaylistUser;
  songs: string[];
  visibility: string;
  isFeatured: boolean;
  createdAt: string;
  followersCount?: number;
}

export default function FollowedPlaylistsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [playlists, setPlaylists] = useState<FollowedPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.access_token) {
      fetchFollowedPlaylists();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchFollowedPlaylists = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/follow-playlist/user/followed`,
        {
          headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch followed playlists");
      }
      const result = await response.json();
      console.log("API Response:", result); // Debug log

      // Handle API response structure: result.data.data contains the playlists array
      if (result.data && result.data.success && result.data.data) {
        setPlaylists(result.data.data);
      } else {
        setError(
          result.message ||
            result.data?.message ||
            "Failed to load followed playlists"
        );
      }
    } catch (error) {
      console.error("Error fetching followed playlists:", error);
      setError("An error occurred while loading followed playlists");
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = (playlistId: string, isFollowing: boolean) => {
    if (!isFollowing) {
      // Remove the playlist from the list when unfollowed
      setPlaylists(playlists.filter((p) => p._id !== playlistId));
    }
  };

  if (!session?.user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">Please sign in</h2>
          <p className="mb-4">
            You need to be logged in to view your followed playlists.
          </p>
          <Link href="/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-20" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"
                >
                  <Skeleton className="h-36 w-full mb-3 rounded-md" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mr-4"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Followed Playlists</h1>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mr-4"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Followed Playlists</h1>
            <p className="text-gray-500">
              {playlists.length} playlist{playlists.length !== 1 ? "s" : ""}{" "}
              you're following
            </p>
          </div>
        </div>
      </div>

      {playlists.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-center">
          <Heart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">
            No followed playlists yet
          </h3>
          <p className="text-gray-500 mb-4">
            Start following playlists you love to see them here.
          </p>
          <Link href="/discover/playlists">
            <Button>Discover Playlists</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {playlists.map((playlist) => (
            <div
              key={playlist._id}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow group h-full flex flex-col"
            >
              <Link href={`/playlist/${playlist._id}`} className="flex-1">
                <div className="bg-gradient-to-br from-purple-400 to-indigo-600 aspect-square rounded-md mb-3 flex items-center justify-center text-white text-4xl relative overflow-hidden">
                  {playlist.name?.charAt(0).toUpperCase() || "P"}
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity flex items-center justify-center">
                    <Library className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                  {playlist.name}
                </h3>
                <p className="text-sm text-gray-500 mb-2 line-clamp-1">
                  By{" "}
                  {playlist.userId?.name ||
                    playlist.userId?.username ||
                    "Unknown"}
                </p>
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <Music size={14} className="mr-1" />
                  <span>{playlist.songs?.length || 0} songs</span>
                  {playlist.followersCount !== undefined && (
                    <>
                      <span className="mx-2">•</span>
                      <Heart size={14} className="mr-1" />
                      <span>{playlist.followersCount} followers</span>
                    </>
                  )}
                </div>
              </Link>
              <div className="mt-auto pt-2">
                <FollowPlaylistButton
                  playlistId={playlist._id}
                  variant="button"
                  size="sm"
                  className="w-full"
                  initialFollowState={true}
                  onFollowChange={(isFollowing) =>
                    handleUnfollow(playlist._id, isFollowing)
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
