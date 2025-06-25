"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePlayer } from "@/components/app/player-context";
import LikeButton from "@/components/user/like-button.component";
import SubscriptionStatsComponent from "@/components/user/profile/subscription-stats.component";
import { Play, Pause, Edit } from "lucide-react";
import { toast } from "sonner";

const UserProfilePage = () => {
  const { data: session, update: updateSession } = useSession();
  const userId = session?.user?._id;

  // User state
  const [userData, setUserData] = useState<IUser | undefined>(undefined);
  const [tracks, setTracks] = useState<ISong[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<IPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "" });

  // Player context
  const { playTrack, currentTrack, isPlaying, togglePlayPause } = usePlayer();

  useEffect(() => {
    if (session?.user) {
      fetchUserData();
    }
  }, [session]);

  useEffect(() => {
    if (userData) {
      setEditForm({
        name: userData.name || "",
      });
    }
  }, [userData]);

  const fetchUserData = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      // Fetch user profile data
      const userRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
          },
          method: "GET",
        }
      );

      if (!userRes.ok) {
        throw new Error(`Failed to fetch user data: ${userRes.status}`);
      }

      const userResponse = await userRes.json();
      // Unwrap nested data if present
      const fetchedUser = userResponse.data?.data ?? userResponse.data;
      setUserData(fetchedUser);

      // Fetch user tracks
      const tracksRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/songs/user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
          },
          method: "GET",
        }
      );

      if (!tracksRes.ok) {
        throw new Error(`Failed to fetch tracks: ${tracksRes.status}`);
      }

      const tracksData = (await tracksRes.json()).data;
      setTracks(tracksData || []);

      // Fetch user playlists
      const playlistsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/playlists/user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
          },
          method: "GET",
        }
      );

      if (playlistsRes.ok) {
        const playlistsResponse = await playlistsRes.json();
        console.log("Raw playlists response:", playlistsResponse);

        // Handle different possible response structures
        let userPlaylistsData = [];

        if (
          playlistsResponse.data?.data &&
          Array.isArray(playlistsResponse.data.data)
        ) {
          // Structure: { data: { data: [...] } }
          console.log("Using data.data path");
          userPlaylistsData = playlistsResponse.data.data;
        } else if (
          playlistsResponse.data?.success &&
          playlistsResponse.data?.data &&
          Array.isArray(playlistsResponse.data.data)
        ) {
          // Structure: { data: { success: true, data: [...] } }
          console.log("Using data.success.data path");
          userPlaylistsData = playlistsResponse.data.data;
        } else if (
          playlistsResponse.data &&
          Array.isArray(playlistsResponse.data)
        ) {
          // Structure: { data: [...] }
          console.log("Using data array path");
          userPlaylistsData = playlistsResponse.data;
        } else if (
          playlistsResponse.success &&
          playlistsResponse.data &&
          Array.isArray(playlistsResponse.data)
        ) {
          // Structure: { success: true, data: [...] }
          console.log("Using success.data path");
          userPlaylistsData = playlistsResponse.data;
        } else if (Array.isArray(playlistsResponse)) {
          // Direct array
          console.log("Using direct array response");
          userPlaylistsData = playlistsResponse;
        } else {
          console.error(
            "Unexpected playlists response format:",
            playlistsResponse
          );
          userPlaylistsData = [];
        }

        console.log("Processed playlists:", userPlaylistsData);
        setUserPlaylists(userPlaylistsData);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Failed to load profile data");
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      // Prepare fetch options
      const fetchOptions: RequestInit = {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session?.user?.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`,
        fetchOptions
      );

      if (!res.ok) {
        throw new Error(`Failed to update profile: ${res.status}`);
      }

      const response = await res.json();

      if (response.data) {
        setUserData(response.data);
        // Update session data if needed
        updateSession({
          user: {
            ...session?.user,
            name: response.data.name,
          },
        });
        setIsEditing(false);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  const handlePlayTrack = (track: ISong) => {
    // if (playTrack) {
    //   const audioUrl = track.audioUrl.startsWith("/api/audio")
    //     ? track.audioUrl
    //     : `/api/audio?url=${encodeURIComponent(track.audioUrl)}`;
    // playTrack({
    //   ...track,
    //   audioUrl,
    // });
    // }
  };

  const isTrackPlaying = (trackId: string) => {
    return currentTrack?._id === trackId && isPlaying;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        {/* <p className="text-xl"></p> */}
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
          {error || "Failed to load profile data"}
        </div>
        <Button onClick={fetchUserData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* User profile header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {isEditing ? (
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
              <Image
                src={userData.profilePicture || "/default-profile.jpg"}
                alt="User Profile"
                width={128}
                height={128}
                className="object-cover w-full h-full"
              />
            </div>
          ) : (
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
              <Image
                src={userData.profilePicture || "/default-profile.jpg"}
                alt="User avatar"
                width={128}
                height={128}
                className="object-cover w-full h-full"
              />
            </div>
          )}

          <div className="flex-grow text-center md:text-left">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Display Name
                  </label>
                  <Input
                    name="name"
                    value={editForm.name}
                    onChange={handleInputChange}
                    placeholder="Your display name"
                  />
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold mb-2">
                  {userData.name || userData.username || userData.email}
                </h1>
                {userData.bio && (
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {userData.bio}
                  </p>
                )}
              </>
            )}

            {!isEditing && (
              <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start mb-4">
                <Link
                  href={`/profile/${userId}/followers`}
                  className="text-sm text-gray-600 hover:underline"
                >
                  <span className="font-semibold">
                    {userData.followersCount || 0}
                  </span>{" "}
                  Followers
                </Link>
                <Link
                  href={`/profile/${userId}/following`}
                  className="text-sm text-gray-600 hover:underline"
                >
                  <span className="font-semibold">
                    {userData.followingCount || 0}
                  </span>{" "}
                  Following
                </Link>
                <span className="text-sm text-gray-600">
                  <span className="font-semibold">{tracks.length}</span> Tracks
                </span>
              </div>
            )}

            <div className="flex gap-3 justify-center md:justify-start">
              {isEditing ? (
                <>
                  <Button onClick={handleProfileUpdate}>Save Changes</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    className="flex gap-2 items-center"
                  >
                    <Edit size={16} /> Edit Profile
                  </Button>
                  <Link href="/playlist/manage">
                    <Button variant="outline">Manage Playlists</Button>
                  </Link>
                  <Link href="/profile/my-music">
                    <Button variant="outline">Manage Your Music</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs for tracks and other content */}
      {!isEditing && (
        <Tabs defaultValue="tracks" className="w-full">
          {" "}
          <TabsList className="mb-6">
            <TabsTrigger key="tracks-tab" value="tracks">
              Tracks
            </TabsTrigger>
            <TabsTrigger key="playlists-tab" value="playlists">
              Playlists
            </TabsTrigger>{" "}
            <TabsTrigger key="stats-tab" value="stats">
              Statistics
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tracks">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Tracks</h2>
              {/* <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex gap-2 items-center">
                    <Upload size={16} /> Upload New
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload a new track</DialogTitle>
                  </DialogHeader>
                  <p className="text-center py-4">Upload form would go here</p>
                </DialogContent>
              </Dialog> */}
            </div>

            {tracks.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-lg text-center">
                <h2 className="text-xl font-semibold mb-4">No tracks found</h2>
                <p className="mb-4">You haven't uploaded any tracks yet.</p>
                <Button asChild>
                  <Link href="/upload">Upload Your First Track</Link>
                </Button>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {tracks.map((track) => (
                    <li
                      key={track._id}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 group"
                    >
                      <div className="flex items-center">
                        <div
                          className="h-12 w-12 flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded-md mr-4 flex items-center justify-center cursor-pointer relative group"
                          onClick={() =>
                            isTrackPlaying(track._id)
                              ? togglePlayPause()
                              : handlePlayTrack(track)
                          }
                        >
                          {false ? (
                            <div></div>
                          ) : // {track.imageUrl ? (
                          // <Image
                          //   src={track.imageUrl}
                          //   alt={track.title}
                          //   width={48}
                          //   height={48}
                          //   className="object-cover w-full h-full rounded-md"
                          // />
                          null}
                          <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center rounded-md">
                            {isTrackPlaying(track._id) ? (
                              <Pause className="text-white" size={20} />
                            ) : (
                              <Play className="text-white ml-0.5" size={20} />
                            )}
                          </div>
                        </div>

                        <div
                          className="flex-grow min-w-0 cursor-pointer"
                          onClick={() => handlePlayTrack(track)}
                        >
                          <p className="font-medium truncate">{track.title}</p>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{formatDuration(track.duration || 0)}</span>
                            <span>
                              {formatDate(track.uploadDate.toString())}
                            </span>
                          </div>
                        </div>

                        <div className="ml-4 flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            {track.playCount || 0} plays
                            {/* temp plays */}
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Your Playlists</h2>
              <Link href="/playlist/create">
                <Button size="sm">Create Playlist</Button>
              </Link>
            </div>

            {userPlaylists.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-lg text-center">
                <h2 className="text-xl font-semibold mb-4">
                  No playlists found
                </h2>
                <p className="mb-4">You haven't created any playlists yet.</p>
                <Link href="/playlist/create">
                  <Button>Create Your First Playlist</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {userPlaylists.map((playlist) => (
                  <div
                    key={playlist._id}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-medium text-lg mb-1">
                      {playlist.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {playlist.songs?.length || 0} tracks
                    </p>
                    <Link href={`/playlist/${playlist._id}`}>
                      <Button size="sm" variant="outline" className="w-full">
                        View Playlist
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>{" "}
          <TabsContent value="stats">
            <SubscriptionStatsComponent />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default UserProfilePage;
