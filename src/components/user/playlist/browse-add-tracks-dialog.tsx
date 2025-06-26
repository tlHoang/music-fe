"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { sendRequest } from "@/utils/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  PlayCircle,
  Clock,
  Calendar,
  Music2,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

interface Track {
  _id: string;
  title: string;
  artist?: string;
  cover?: string;
  coverImage?: string;
  thumbnail?: string;
  audioUrl: string;
  duration: number;
  uploadDate: string;
  visibility: string;
  genre?: {
    _id: string;
    name: string;
  };
  lyrics?: string;
}

interface BrowseAddTracksDialogProps {
  playlistId: string;
  playlistSongs: string[]; // Array of song IDs already in the playlist
  onTrackAdded?: () => void; // Callback to refresh playlist
  trigger?: React.ReactNode;
}

export default function BrowseAddTracksDialog({
  playlistId,
  playlistSongs,
  onTrackAdded,
  trigger,
}: BrowseAddTracksDialogProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"title" | "lyrics">("title");
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingTracks, setAddingTracks] = useState<Set<string>>(new Set());

  const defaultTrigger = (
    <Button
      variant="outline"
      className="border-white text-black hover:bg-white/20"
    >
      <Plus size={18} className="mr-2" />
      Add Tracks
    </Button>
  ); // Search for tracks
  const searchTracks = useCallback(
    async (query: string, type: "title" | "lyrics") => {
      if (!query.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        setLoading(true);

        if (type === "lyrics") {
          // Use the same approach as tracks page for lyrics search
          const params = new URLSearchParams();
          params.append("q", query.trim());
          params.append("limit", "20");
          params.append("threshold", "0.7");

          const url = `${process.env.NEXT_PUBLIC_API_URL}/songs/search/lyrics?${params.toString()}`;

          const response = await sendRequest<any>({
            url,
            method: "GET",
            headers: session?.user?.access_token
              ? { Authorization: `Bearer ${session.user.access_token}` }
              : {},
          });
          if (response.data && response.data.data) {
            setSearchResults(response.data.data);
          } else {
            setSearchResults([]);
          }
        } else {
          // Use the same approach as tracks page for title search
          const params = new URLSearchParams();
          params.append("search", query.trim());
          params.append("visibility", "PUBLIC");
          params.append("limit", "20");
          params.append("page", "1");

          const url = `${process.env.NEXT_PUBLIC_API_URL}/songs/search?${params.toString()}`;

          const response = await sendRequest<any>({
            url,
            method: "GET",
            headers: session?.user?.access_token
              ? { Authorization: `Bearer ${session.user.access_token}` }
              : {},
          });

          if (response.data && response.data.data) {
            setSearchResults(response.data.data);
          } else {
            setSearchResults([]);
          }
        }
      } catch (error) {
        console.error("Error searching tracks:", error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    },
    [session?.user?.access_token]
  );

  // Add track to playlist
  const addTrackToPlaylist = async (trackId: string) => {
    if (!session?.user?.access_token) {
      toast.error("You must be logged in to add tracks");
      return;
    }

    if (playlistSongs.includes(trackId)) {
      toast.info("This track is already in the playlist");
      return;
    }

    try {
      setAddingTracks((prev) => new Set([...prev, trackId]));

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/playlists/${playlistId}/songs/${trackId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Track added to playlist");
        onTrackAdded?.();
      } else {
        throw new Error(result.message || "Failed to add track");
      }
    } catch (error) {
      console.error("Error adding track:", error);
      toast.error("Failed to add track to playlist");
    } finally {
      setAddingTracks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(trackId);
        return newSet;
      });
    }
  };

  // Add top 5 tracks
  const addTopTracks = async () => {
    const topTracks = searchResults
      .slice(0, 5)
      .filter((track) => !playlistSongs.includes(track._id));

    if (topTracks.length === 0) {
      toast.info("No new tracks to add from top results");
      return;
    }

    try {
      setLoading(true);
      let addedCount = 0;

      for (const track of topTracks) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/playlists/${playlistId}/songs/${track._id}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${session?.user?.access_token}`,
              },
            }
          );

          const result = await response.json();
          if (response.ok && result.success) {
            addedCount++;
          }
        } catch (error) {
          console.error(`Error adding track ${track.title}:`, error);
        }
      }

      if (addedCount > 0) {
        toast.success(`Added ${addedCount} tracks to playlist`);
        onTrackAdded?.();
      } else {
        toast.error("Failed to add tracks");
      }
    } catch (error) {
      console.error("Error adding top tracks:", error);
      toast.error("Failed to add tracks");
    } finally {
      setLoading(false);
    }
  }; // Handle search when query or type changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchTracks(searchQuery, searchType);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchType, searchTracks]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Browse & Add Tracks</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Search Controls */}
          <div className="space-y-3">
            {" "}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <Input
                placeholder={
                  searchType === "lyrics"
                    ? "Search by lyrics..."
                    : "Search by title, artist..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {/* Modern Search Mode Toggle */}
            <div className="flex items-center justify-between p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <button
                onClick={() => setSearchType("title")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  searchType === "title"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                <Music2 size={16} />
                <span>Title & Artist</span>
              </button>
              <button
                onClick={() => setSearchType("lyrics")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  searchType === "lyrics"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                <Search size={16} />
                <span>Lyrics</span>
              </button>
            </div>
            {searchType === "lyrics" && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2 text-xs">
                <strong>Lyrics Search:</strong> Find songs by themes, emotions,
                or specific phrases within lyrics.
              </div>
            )}
            {searchResults.length > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Found {searchResults.length} tracks
                </p>
                <Button
                  onClick={addTopTracks}
                  disabled={loading}
                  size="sm"
                  variant="outline"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Add Top 5
                </Button>
              </div>
            )}
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto">
            {loading && searchQuery && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Searching...</span>
              </div>
            )}

            {!loading && searchQuery && searchResults.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No tracks found for "{searchQuery}"
              </div>
            )}

            {!searchQuery && (
              <div className="text-center py-8 text-gray-500">
                Start typing to search for tracks
              </div>
            )}

            <div className="space-y-2">
              {searchResults.map((track) => {
                const isInPlaylist = playlistSongs.includes(track._id);
                const isAdding = addingTracks.has(track._id);

                return (
                  <div
                    key={track._id}
                    className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    {" "}
                    {/* Cover Image */}
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden flex-shrink-0">
                      {track.cover || track.coverImage || track.thumbnail ? (
                        <Image
                          src={
                            track.cover ||
                            track.coverImage ||
                            track.thumbnail ||
                            ""
                          }
                          alt={track.title}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music2 size={20} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{track.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {track.artist || "Unknown Artist"}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatDuration(track.duration)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {formatDate(track.uploadDate)}
                        </span>
                        {track.genre && (
                          <Badge variant="secondary" className="text-xs">
                            {track.genre.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {/* Add Button */}
                    <div className="flex-shrink-0">
                      {isInPlaylist ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle size={16} />
                          <span className="text-sm">In Playlist</span>
                        </div>
                      ) : (
                        <Button
                          onClick={() => addTrackToPlaylist(track._id)}
                          disabled={isAdding}
                          size="sm"
                        >
                          {isAdding ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-1" />
                              Add
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
