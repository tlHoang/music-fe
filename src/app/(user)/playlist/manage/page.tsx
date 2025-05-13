"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import SessionDebugger from "@/components/debug/session-debugger";
import DatabaseCheck from "@/components/debug/database-check";
import APIResponse from "@/components/debug/api-response";
import PlaylistDebugger from "@/components/debug/playlist-debugger";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Library,
  Pencil,
  Trash2,
  Music,
  Plus,
  Globe,
  Lock,
  Search,
  ArrowLeft,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function ManagePlaylistsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [playlists, setPlaylists] = useState<IPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<IPlaylist | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [songSearchDialogOpen, setSongSearchDialogOpen] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    visibility: "PUBLIC",
  });

  // Song search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ISong[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchUserPlaylists();
    }
  }, [session]);
  const fetchUserPlaylists = async () => {
    if (!session?.user?._id || !session?.user?.access_token) {
      console.error("Missing user ID or access token in session");
      setError("You must be logged in to view your playlists");
      setLoading(false);
      return;
    }

    console.log("Session user:", {
      id: session.user._id,
      email: session.user.email,
      role: session.user.role,
      tokenLength: session.user.access_token?.length,
    });

    setLoading(true);
    setError(null);

    try {
      // This is the correct endpoint for the current user's playlists
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/playlists/user`;
      console.log("Fetching playlists from:", apiUrl);
      console.log(
        "Using auth token:",
        session.user.access_token?.substring(0, 10) + "..."
      );

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${session.user.access_token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        console.error("Response status:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("Error response body:", errorText);

        // Handle specific error cases
        if (response.status === 401) {
          console.error("Authentication error - token may be invalid");
          // Optionally force a re-login
          // signOut({ redirect: true, callbackUrl: "/login" });
          setError("Your session has expired. Please log in again.");
        } else {
          throw new Error(
            `Failed to fetch playlists: ${response.status} - ${errorText}`
          );
        }
        return;
      }
      const responseData = await response.json();
      console.log("Playlists response:", responseData);

      // Detailed logging of the response structure
      console.log("Response structure:", {
        hasStatusCode: responseData.statusCode !== undefined,
        statusCode: responseData.statusCode,
        hasData: responseData.data !== undefined,
        dataType: typeof responseData.data,
        hasNestedSuccess: responseData.data?.success !== undefined,
        hasNestedData: responseData.data?.data !== undefined,
        nestedDataIsArray: Array.isArray(responseData.data?.data),
      });

      // Extract playlists from the nested response format we're seeing
      let playlistsData = [];

      // Very specific check for the exact format shown in the error message
      if (
        responseData.statusCode === 200 &&
        typeof responseData.data === "object" &&
        responseData.data !== null
      ) {
        console.log("Found expected response format with statusCode 200");

        // Check for the nested data.success.data structure
        if (
          responseData.data.success === true &&
          Array.isArray(responseData.data.data)
        ) {
          console.log("Found nested data.success.data array structure");
          playlistsData = responseData.data.data;
          console.log(
            `Extracted ${playlistsData.length} playlists from nested structure`
          );
        }
      }
      // Original format checks (fallbacks)
      else if (responseData.success && Array.isArray(responseData.data)) {
        console.log("Using success.data format");
        playlistsData = responseData.data;
      } else if (Array.isArray(responseData)) {
        console.log("Using direct array format");
        playlistsData = responseData;
      } else if (responseData.data && Array.isArray(responseData.data)) {
        console.log("Using data format");
        playlistsData = responseData.data;
      } else {
        console.error("Unexpected response format:", responseData);
        setError(
          `Received an unexpected response format. Check console for details.`
        );
        toast.error("Failed to load playlists: unexpected format");
        return;
      } // Transform the playlists data if needed to match the IPlaylist interface
      const transformedPlaylists = playlistsData.map((playlist: any) => {
        console.log("Raw playlist data:", playlist);

        // Ensure songs is always an array of ISong objects
        const songs = Array.isArray(playlist.songs)
          ? playlist.songs.map((song: any) => {
              // If song is just an ID string, transform to minimal ISong object
              if (typeof song === "string") {
                return {
                  _id: song,
                  title: "Unknown Track",
                  duration: 0,
                  audioUrl: "",
                };
              }
              return song;
            })
          : [];

        // Ensure userId is an IUser object
        const userId =
          typeof playlist.userId === "string"
            ? {
                _id: playlist.userId,
                name: "Unknown User",
                username: "",
                email: "",
              }
            : playlist.userId;

        return {
          ...playlist,
          songs,
          userId,
        };
      });
      // Display playlist data for debugging
      if (transformedPlaylists.length > 0) {
        console.log(
          "Sample playlist:",
          JSON.stringify(transformedPlaylists[0], null, 2)
        );
      } else {
        console.log("No playlists found");
      }

      setPlaylists(transformedPlaylists);
    } catch (error: any) {
      console.error("Error fetching playlists:", error);
      setError(`Failed to load playlists: ${error.message || "Unknown error"}`);
      toast.error(
        `Failed to load playlists: ${error.message || "Unknown error"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (playlist: IPlaylist) => {
    setSelectedPlaylist(playlist);
    setEditForm({
      name: playlist.name,
      visibility: playlist.visibility,
    });
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (playlist: IPlaylist) => {
    setSelectedPlaylist(playlist);
    setDeleteDialogOpen(true);
  };

  const handleAddSongsClick = (playlist: IPlaylist) => {
    setSelectedPlaylist(playlist);
    setSearchQuery("");
    setSearchResults([]);
    setSongSearchDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedPlaylist || !session?.user?.access_token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/playlists/${selectedPlaylist._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.access_token}`,
          },
          body: JSON.stringify({
            name: editForm.name,
            visibility: editForm.visibility,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update playlist: ${response.status}`);
      }

      toast.success("Playlist updated successfully");
      setEditDialogOpen(false);

      // Refresh the playlists list
      fetchUserPlaylists();
    } catch (error) {
      console.error("Error updating playlist:", error);
      toast.error("Failed to update playlist");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPlaylist || !session?.user?.access_token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/playlists/${selectedPlaylist._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete playlist: ${response.status}`);
      }

      toast.success("Playlist deleted successfully");
      setDeleteDialogOpen(false);

      // Remove the deleted playlist from the list
      setPlaylists(playlists.filter((p) => p._id !== selectedPlaylist._id));
    } catch (error) {
      console.error("Error deleting playlist:", error);
      toast.error("Failed to delete playlist");
    }
  };
  const handleSearch = async () => {
    if (!searchQuery.trim() || !session?.user?.access_token) return;

    setSearchLoading(true);
    try {
      console.log("Searching for songs with query:", searchQuery);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/songs/search?query=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Search API error:", errorText);
        throw new Error(`Failed to search songs: ${response.status}`);
      }

      const responseData = await response.json();
      console.log("Search response:", responseData);

      // Extract songs from the nested response format
      let songs = [];
      if (responseData.success && Array.isArray(responseData.data)) {
        songs = responseData.data;
      } else if (
        responseData.data?.success &&
        Array.isArray(responseData.data?.data)
      ) {
        songs = responseData.data.data;
      }

      console.log(`Found ${songs.length} songs matching '${searchQuery}'`);
      setSearchResults(songs);
    } catch (error) {
      console.error("Error searching songs:", error);
      toast.error("Failed to search songs");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };
  const handleAddSongToPlaylist = async (songId: string) => {
    if (!selectedPlaylist || !session?.user?.access_token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/playlists/${selectedPlaylist._id}/songs/${songId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
          },
        }
      );

      const data = await response.json();
      console.log("Add song response:", data);

      // Log the exact response structure for debugging
      console.log("Add song response structure:", {
        status: response.status,
        statusText: response.statusText,
        dataSuccess: data.success,
        dataMessage: data.message,
        nestedSuccess: data.data?.success,
        nestedMessage: data.data?.message,
      });

      // Check for 409 Conflict status code which indicates song already exists
      if (response.status === 409) {
        toast.info("Song is already in this playlist");
        return;
      }

      // Case 1: Direct success/failure in the response
      if (
        data.success === false &&
        data.message === "Song already exists in this playlist"
      ) {
        toast.info("Song is already in this playlist");
        return;
      }

      // Case 2: Success/failure nested in data property
      if (
        data.data &&
        data.data.success === false &&
        data.data.message === "Song already exists in this playlist"
      ) {
        toast.info("Song is already in this playlist");
        return;
      }

      // Case 3: Status code with nested success/failure
      if (data.statusCode && data.data && data.data.success === false) {
        toast.info(data.data.message || "Cannot add song to playlist");
        return;
      }
      if (response.ok) {
        toast.success("Song added to playlist");

        // If we received the added song in the response, we can update the UI without a full refetch
        if (data.success && data.data && data.data.addedSong) {
          console.log("Added song details received:", data.data.addedSong);

          // If the UI needs to be immediately updated with the new song
          const newSong = data.data.addedSong;

          // Update the selected playlist in state if needed
          if (selectedPlaylist) {
            // Create a copy of the playlist with the new song added
            const updatedPlaylist = {
              ...selectedPlaylist,
              songs: [...(selectedPlaylist.songs || []), newSong],
            };

            setSelectedPlaylist(updatedPlaylist);

            // Also update the playlist in the playlists array
            setPlaylists(
              playlists.map((p) =>
                p._id === selectedPlaylist._id ? updatedPlaylist : p
              )
            );
          }
        } else {
          // Otherwise, fetch the updated playlist data
          fetchUserPlaylists();
        }
      } else {
        throw new Error(
          data.message || data.data?.message || "Failed to add song to playlist"
        );
      }
    } catch (error) {
      console.error("Error adding song to playlist:", error);
      toast.error("Failed to add song to playlist");
    }
  };
  const handleRemoveSongFromPlaylist = async (
    playlistId: string,
    songId: string
  ) => {
    if (!session?.user?.access_token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/playlists/${playlistId}/songs/${songId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
          },
        }
      );

      const data = await response.json();
      console.log("Remove song response:", data);

      // Log the exact response structure for debugging
      console.log("Remove song response structure:", {
        status: response.status,
        statusText: response.statusText,
        dataSuccess: data.success,
        dataMessage: data.message,
        nestedSuccess: data.data?.success,
        nestedMessage: data.data?.message,
      });

      // Handle specific HTTP status codes
      if (response.status === 404) {
        toast.error("Song not found in this playlist");
        return;
      }

      if (response.status === 403) {
        toast.error("You don't have permission to modify this playlist");
        return;
      }

      // Handle response with success: false
      if (data.success === false) {
        toast.error(data.message || "Failed to remove song from playlist");
        return;
      }

      // Handle nested success: false
      if (data.data && data.data.success === false) {
        toast.error(data.data.message || "Failed to remove song from playlist");
        return;
      }

      if (response.ok) {
        toast.success("Song removed from playlist");
        // Refresh playlists to update the UI
        fetchUserPlaylists();
      } else {
        throw new Error(
          data.message ||
            data.data?.message ||
            "Failed to remove song from playlist"
        );
      }
    } catch (error) {
      console.error("Error removing song from playlist:", error);
      toast.error("Failed to remove song from playlist");
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <PlaylistDebugger />

        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <div className="space-y-4">
          <Button onClick={fetchUserPlaylists} className="mr-4">
            Retry
          </Button>

          <Button
            onClick={async () => {
              const token = prompt("Enter a valid JWT token for testing:");
              if (!token) return;

              try {
                const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/playlists/user`;
                const response = await fetch(apiUrl, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                });

                if (!response.ok) {
                  const errorText = await response.text();
                  alert(`Error: ${response.status} - ${errorText}`);
                  return;
                }
                const result = await response.json();
                console.log("Manual request result:", result);

                // Handle the nested response structure
                let playlists = [];
                if (
                  result.statusCode === 200 &&
                  result.data &&
                  result.data.success &&
                  Array.isArray(result.data.data)
                ) {
                  playlists = result.data.data;
                  console.log("Found playlists in nested format:", playlists);
                } else if (result.success && Array.isArray(result.data)) {
                  playlists = result.data;
                } else if (Array.isArray(result)) {
                  playlists = result;
                } else if (result.data && Array.isArray(result.data)) {
                  playlists = result.data;
                }

                const responseStr = JSON.stringify(result).substring(0, 150);
                alert(
                  `Found ${playlists.length} playlists. Response format: ${responseStr}...`
                );
              } catch (err: any) {
                console.error("Manual fetch error:", err);
                alert(`Error: ${err.message}`);
              }
            }}
            variant="outline"
          >
            Test with manual token
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="container mx-auto p-6">
      {process.env.NODE_ENV !== "production" && <PlaylistDebugger />}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Your Playlists</h1>{" "}
        <div className="flex gap-3">
          <Button onClick={() => router.back()} variant="outline" size="sm">
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
          <Link href="/playlist/create">
            <Button size="sm">
              <Plus size={16} className="mr-2" />
              Create New Playlist
            </Button>
          </Link>
          {/* Debug button for direct API check */}
          {process.env.NODE_ENV !== "production" && (
            <Button
              variant="outline"
              size="sm"
              className="ml-4 bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200"
              onClick={async () => {
                if (!session?.user?.access_token) {
                  alert("No access token found");
                  return;
                }

                try {
                  // First, check for any playlists in MongoDB
                  const userId = session.user._id;
                  console.log(
                    "Checking MongoDB for playlists with userId:",
                    userId
                  );

                  // Fetch again with explicit debugging
                  fetchUserPlaylists();

                  // Alert the user
                  alert("Checking for playlists - see console for debug info");
                } catch (error: any) {
                  console.error("API test error:", error);
                  alert(`Error: ${error.message}`);
                }
              }}
            >
              Debug: Check API
            </Button>
          )}
          {/* Debug button for manual playlist creation */}
          {process.env.NODE_ENV !== "production" && (
            <Button
              variant="outline"
              size="sm"
              className="ml-4 bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200"
              onClick={async () => {
                if (!session?.user?.access_token) {
                  alert("No access token found");
                  return;
                }

                try {
                  const name = prompt("Enter playlist name:");
                  if (!name) return;

                  const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/playlists`,
                    {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${session.user.access_token}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        name,
                        visibility: "PUBLIC",
                        userId: session.user._id,
                      }),
                    }
                  );

                  if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Create playlist error response:", errorText);
                    alert(`Failed to create playlist: ${errorText}`);
                    return;
                  }
                  const result = await response.json();
                  console.log("Create playlist result:", result);

                  // Log detailed information about the response
                  console.log("Create playlist response details:", {
                    hasStatusCode: result.statusCode !== undefined,
                    statusCode: result.statusCode,
                    hasData: result.data !== undefined,
                    dataType: typeof result.data,
                  });

                  alert(
                    "Playlist created successfully! Refreshing playlists..."
                  );

                  // Fetch the playlists again
                  fetchUserPlaylists();
                } catch (error: any) {
                  console.error("Error creating playlist:", error);
                  alert(`Error: ${error.message}`);
                }
              }}
            >
              Debug: Create Playlist
            </Button>
          )}
        </div>
      </div>
      {playlists.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-lg text-center">
          <Library className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-4">No playlists found</h2>
          <p className="text-gray-500 mb-4">
            You haven't created any playlists yet.
          </p>
          <Link href="/playlist/create">
            <Button>
              <Plus size={16} className="mr-2" />
              Create Your First Playlist
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {playlists.map((playlist) => (
            <div
              key={playlist._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{playlist.name}</h2>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    {playlist.visibility === "PUBLIC" ? (
                      <>
                        <Globe size={14} className="mr-1" />
                        <span>Public</span>
                      </>
                    ) : (
                      <>
                        <Lock size={14} className="mr-1" />
                        <span>Private</span>
                      </>
                    )}
                    <span className="mx-2">•</span>
                    <Music size={14} className="mr-1" />
                    <span>{playlist.songs?.length || 0} songs</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-2 sm:mt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddSongsClick(playlist)}
                  >
                    <Plus size={16} className="mr-1" /> Add Songs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(playlist)}
                  >
                    <Pencil size={16} className="mr-1" /> Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(playlist)}
                  >
                    <Trash2 size={16} className="mr-1" /> Delete
                  </Button>
                </div>
              </div>

              {/* Playlist songs */}
              {playlist.songs && playlist.songs.length > 0 ? (
                <div className="mt-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                      {playlist.songs.map((song, index) => (
                        <li
                          key={song._id}
                          className="flex items-center justify-between p-4 hover:bg-gray-100 dark:hover:bg-gray-650"
                        >
                          <div className="flex items-center">
                            <span className="w-6 text-gray-500 text-sm">
                              {index + 1}
                            </span>
                            <div className="ml-3">
                              <p className="font-medium">{song.title}</p>
                              <p className="text-sm text-gray-500">
                                {formatDuration(song.duration || 0)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleRemoveSongFromPlaylist(
                                playlist._id,
                                song._id
                              )
                            }
                            className="text-red-500 hover:text-red-700"
                          >
                            <XCircle size={18} />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 mt-4 rounded-lg text-center text-gray-500">
                  This playlist doesn't have any songs yet.
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <Link href={`/playlist/${playlist._id}`}>
                  <Button variant="link" size="sm">
                    View Playlist
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Edit Playlist Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Playlist Name</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                placeholder="My Playlist"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select
                value={editForm.visibility}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, visibility: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">
                    Public - Anyone can see and play
                  </SelectItem>
                  <SelectItem value="PRIVATE">
                    Private - Only you can see
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Playlist Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Playlist</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedPlaylist?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete Playlist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>{" "}
      {/* Add Songs Dialog */}
      <Dialog
        open={songSearchDialogOpen}
        onOpenChange={setSongSearchDialogOpen}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add Songs to {selectedPlaylist?.name}</DialogTitle>
            <DialogDescription>
              Search for songs to add to your playlist
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 my-4">
            <div className="relative flex-1">
              <Input
                placeholder="Search for songs by title or artist"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
                className="pr-10"
              />
              {searchQuery && (
                <button
                  className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setSearchQuery("")}
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button onClick={handleSearch} disabled={searchLoading}>
              {searchLoading ? (
                <span className="flex items-center">
                  <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                  Searching...
                </span>
              ) : (
                <span className="flex items-center">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </span>
              )}
            </Button>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {searchLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery.trim() ? (
                  <div>
                    <div className="mb-2 flex justify-center">
                      <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="font-medium">
                      No songs found matching "{searchQuery}"
                    </p>
                    <p className="mt-2 text-sm">
                      Try using different keywords or check for typos
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="mb-2 flex justify-center">
                      <Music className="h-8 w-8 text-gray-400" />
                    </div>
                    <p>Search for songs to add to your playlist</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 mb-2">
                  Found {searchResults.length} songs matching "{searchQuery}"
                </p>
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {searchResults.map((song) => (
                    <li
                      key={song._id}
                      className="py-3 px-2 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md"
                    >
                      <div className="flex items-center space-x-3">
                        {song.coverImage || song.thumbnail ? (
                          <img
                            src={song.coverImage || song.thumbnail}
                            alt={song.title}
                            className="h-10 w-10 object-cover rounded"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                            <Music className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{song.title}</p>
                          <p className="text-sm text-gray-500">
                            {song.artist || "Unknown Artist"}
                            {song.duration
                              ? ` • ${formatDuration(song.duration)}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddSongToPlaylist(song._id)}
                        className="ml-2 flex items-center"
                      >
                        <Plus size={16} className="mr-1" /> Add
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSongSearchDialogOpen(false)}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
