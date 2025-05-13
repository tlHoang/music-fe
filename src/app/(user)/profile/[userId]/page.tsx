"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlayer } from "@/components/app/player-context";
import LikeButton from "@/components/user/like-button.component";
import { Play, Pause } from "lucide-react";
import { useUserPlaylists } from "@/utils/customHook";
import { Library, Music, Plus } from "lucide-react";

interface User {
  _id: string;
  name?: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
}

interface Track {
  _id: string;
  title: string;
  audioUrl: string;
  visibility: string;
  userId: string;
  duration: number;
  uploadDate: string;
  playCount?: number; // Changed from plays to playCount
  likeCount?: number; // Changed from likes to likeCount
  commentCount?: number; // Added commentCount
}

const UserProfilePage = () => {
  const { data: session } = useSession();
  const params = useParams();
  const userId = params?.userId as string;

  const [user, setUser] = useState<User | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const { playTrack, currentTrack, isPlaying, togglePlayPause } = usePlayer();

  const isCurrentUser = session?.user?._id === userId;

  // Use our custom hook to fetch user playlists
  const { playlists, loading: playlistsLoading, error: playlistsError } = useUserPlaylists(userId);

  useEffect(() => {
    fetchUserProfile();
    fetchUserTracks();
  }, [userId, session]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const headers: HeadersInit = {};
      if (session?.user?.access_token) {
        headers["Authorization"] = `Bearer ${session.user.access_token}`;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`,
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.data.data) {
        setUser(result.data.data);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setError("Failed to load user profile. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTracks = async () => {
    try {
      const headers: HeadersInit = {};
      if (session?.user?.access_token) {
        headers["Authorization"] = `Bearer ${session.user.access_token}`;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/songs/user/${userId}`,
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = (await response.json()).data;
      if (result) {
        // Filter out private tracks if not the owner
        const filteredTracks = isCurrentUser
          ? result
          : result.filter((track: Track) => track.visibility === "PUBLIC");
        setTracks(filteredTracks);
      }
    } catch (error) {
      console.error("Error fetching tracks:", error);
    }
  };

  const handleFollow = async () => {
    if (!session?.user?.access_token) {
      // Redirect to login if not authenticated
      window.location.href = "/login";
      return;
    }

    try {
      // Optimistic UI update first for immediate feedback
      setUser((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: true,
              followersCount: prev.followersCount + 1,
            }
          : null
      );

      setFollowLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/followers`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            followingId: userId,
            followerId: session.user._id,
          }),
        }
      );

      if (!response.ok) {
        // Revert the optimistic update if request fails
        setUser((prev) =>
          prev
            ? {
                ...prev,
                isFollowing: false,
                followersCount: prev.followersCount - 1,
              }
            : null
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.data.success) {
        // Revert the optimistic update if API reports failure
        setUser((prev) =>
          prev
            ? {
                ...prev,
                isFollowing: false,
                followersCount: prev.followersCount - 1,
              }
            : null
        );
      }
    } catch (error) {
      console.error("Error following user:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!session?.user?.access_token) {
      // Redirect to login if not authenticated
      window.location.href = "/login";
      return;
    }

    try {
      // Optimistic UI update first for immediate feedback
      setUser((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: false,
              followersCount: prev.followersCount - 1,
            }
          : null
      );

      setFollowLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/followers/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
          },
        }
      );

      if (!response.ok) {
        // Revert the optimistic update if request fails
        setUser((prev) =>
          prev
            ? {
                ...prev,
                isFollowing: true,
                followersCount: prev.followersCount + 1,
              }
            : null
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.data.success) {
        // Revert the optimistic update if API reports failure
        setUser((prev) =>
          prev
            ? {
                ...prev,
                isFollowing: true,
                followersCount: prev.followersCount + 1,
              }
            : null
        );
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handlePlayTrack = (track: Track) => {
    if (playTrack) {
      const audioUrl = track.audioUrl.startsWith("/api/audio")
        ? track.audioUrl
        : `/api/audio?url=${encodeURIComponent(track.audioUrl)}`;

      playTrack({
        ...track,
        audioUrl,
      });
    }
  };

  const isTrackPlaying = (trackId: string) => {
    return currentTrack?._id === trackId && isPlaying;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <p className="text-xl"></p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
          {error || "User not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* User profile header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
            <Image
              src={user.avatar || "/default-profile.jpg"}
              alt="user avatar"
              width={128}
              height={128}
              className="object-cover w-full h-full"
            />
          </div>

          <div className="flex-grow text-center md:text-left">
            <h1 className="text-2xl font-bold mb-2">
              {user.name || user.username || user.email}
            </h1>
            {user.bio && <p className="text-gray-600 mb-4">{user.bio}</p>}

            <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start mb-4">
              <Link
                href={`/profile/${userId}/followers`}
                className="text-sm text-gray-600 hover:underline"
              >
                <span className="font-semibold">{user.followersCount}</span>{" "}
                Followers
              </Link>
              <Link
                href={`/profile/${userId}/following`}
                className="text-sm text-gray-600 hover:underline"
              >
                <span className="font-semibold">{user.followingCount}</span>{" "}
                Following
              </Link>
              <span className="text-sm text-gray-600">
                <span className="font-semibold">{tracks.length}</span> Tracks
              </span>
            </div>

            <div className="flex gap-3 justify-center md:justify-start">
              {!isCurrentUser &&
                (user.isFollowing ? (
                  <Button
                    variant="outline"
                    onClick={handleUnfollow}
                    disabled={followLoading}
                  >
                    Unfollow
                  </Button>
                ) : (
                  <Button onClick={handleFollow} disabled={followLoading}>
                    Follow
                  </Button>
                ))}

              {isCurrentUser && (
                <Link href="/profile/my-music">
                  <Button variant="outline">Manage Your Music</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for tracks and other content */}
      <Tabs defaultValue="tracks" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="tracks">Tracks</TabsTrigger>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="tracks">
          {tracks.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <h2 className="text-xl font-semibold mb-4">No tracks found</h2>
              <p>This user hasn't uploaded any public tracks yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {tracks.map((track) => (
                  <li key={track._id} className="p-4 hover:bg-gray-50 group">
                    <div className="flex items-center">
                      <div
                        className="h-12 w-12 flex-shrink-0 bg-gray-200 rounded-md mr-4 flex items-center justify-center cursor-pointer relative group"
                        onClick={() =>
                          isTrackPlaying(track._id)
                            ? togglePlayPause()
                            : handlePlayTrack(track)
                        }
                      >
                        {isTrackPlaying(track._id) ? (
                          <Pause className="text-gray-600" size={20} />
                        ) : (
                          <Play className="text-gray-600 ml-0.5" size={20} />
                        )}
                      </div>

                      <div
                        className="flex-grow min-w-0 cursor-pointer"
                        onClick={() => handlePlayTrack(track)}
                      >
                        <p className="font-medium truncate">{track.title}</p>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{formatDuration(track.duration)}</span>
                          <span>{formatDate(track.uploadDate)}</span>
                        </div>
                      </div>

                      <div className="ml-4 flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {track.playCount || 0} plays
                        </span>

                        {/* Add Like Button with Queue functionality */}
                        <LikeButton
                          songId={track._id}
                          size="sm"
                          showCount={true}
                          song={track}
                          showQueueOption={true}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>

        <TabsContent value="playlists">
          {playlistsLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          ) : playlistsError ? (
            <div className="bg-red-50 p-6 rounded-lg">
              <p className="text-red-600">{playlistsError}</p>
            </div>
          ) : playlists.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <Library className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold mb-4">No playlists found</h2>
              <p className="text-gray-500 mb-4">
                {isCurrentUser 
                  ? "You haven't created any playlists yet." 
                  : "This user hasn't created any public playlists yet."}
              </p>
              
              {isCurrentUser && (
                <Link href="/playlist/create">
                  <Button>
                    <Plus size={16} className="mr-2" />
                    Create Your First Playlist
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {playlists.map((playlist) => (
                <Link key={playlist._id} href={`/playlist/${playlist._id}`}>
                  <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow group cursor-pointer h-full flex flex-col">
                    <div className="bg-gradient-to-br from-purple-400 to-indigo-600 aspect-square rounded-md mb-3 flex items-center justify-center text-white text-4xl relative overflow-hidden">
                      {playlist.name?.charAt(0).toUpperCase() || "P"}
                      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity flex items-center justify-center">
                        <Library className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1">{playlist.name}</h3>
                    
                    {playlist.userId && (
                      <p className="text-sm text-gray-500 mb-2 line-clamp-1">
                        By {playlist.userId.name || playlist.userId.username || "Unknown"}
                      </p>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-500 mt-auto">
                      <Music size={14} className="mr-1" />
                      <span>{playlist.songs?.length || 0} songs</span>
                      {playlist.visibility === "PRIVATE" && (
                        <span className="ml-auto text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                          Private
                        </span>
                      )}
                      {playlist.isFeatured && (
                        <span className="ml-auto text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          
          {isCurrentUser && playlists.length > 0 && (
            <div className="mt-6 text-center">
              <Link href="/playlist/create">
                <Button variant="outline">
                  <Plus size={16} className="mr-2" />
                  Create New Playlist
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value="about">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              About {user.name || user.username || user.email}
            </h2>
            {user.bio ? (
              <p className="text-gray-700">{user.bio}</p>
            ) : (
              <p className="text-gray-500">This user hasn't added a bio yet.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfilePage;
