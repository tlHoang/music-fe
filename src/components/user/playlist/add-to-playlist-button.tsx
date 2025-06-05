"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ListPlus, Plus, Check } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Playlist {
  _id: string;
  name: string;
  visibility: string;
  songs: string[];
}

interface AddToPlaylistButtonProps {
  trackId: string;
  variant?: "button" | "dropdown";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function AddToPlaylistButton({
  trackId,
  variant = "button",
  size = "md",
  className,
}: AddToPlaylistButtonProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingToPlaylist, setAddingToPlaylist] = useState<string | null>(null);

  // Fetch user's playlists when dialog opens
  useEffect(() => {
    if (!open || !session?.user?.access_token) return;

    const fetchUserPlaylists = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/playlists/user`,
          {
            headers: {
              Authorization: `Bearer ${session.user.access_token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch playlists");
        }

        const result = await response.json();
        // console.log("Playlists response for add button:", result);

        // Handle different response structures
        let playlistsData = [];

        if (result.data?.data && Array.isArray(result.data.data)) {
          // Structure: { data: { data: [...] } }
          playlistsData = result.data.data;
        } else if (
          result.data?.success &&
          result.data?.data &&
          Array.isArray(result.data.data)
        ) {
          // Structure: { data: { success: true, data: [...] } }
          playlistsData = result.data.data;
        } else if (result.data && Array.isArray(result.data)) {
          // Structure: { data: [...] }
          playlistsData = result.data;
        } else if (
          result.success &&
          result.data &&
          Array.isArray(result.data)
        ) {
          // Structure directly from backend: { success: true, data: [...] }
          playlistsData = result.data;
        } else {
          throw new Error("Unexpected response format");
        }

        setUserPlaylists(playlistsData);
      } catch (error) {
        console.error("Error fetching user playlists:", error);
        toast.error("Failed to load your playlists");
      } finally {
        setLoading(false);
      }
    };

    fetchUserPlaylists();
  }, [open, session]);

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!session?.user?.access_token) {
      toast.error("You must be logged in to add to playlists");
      return;
    }

    try {
      setAddingToPlaylist(playlistId);

      // Check if the song is already in the playlist
      const playlist = userPlaylists.find((p) => p._id === playlistId);
      if (playlist && playlist.songs.includes(trackId)) {
        toast.info("This track is already in the playlist");
        setAddingToPlaylist(null);
        return;
      }

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
        toast.success("Added to playlist");

        // Update the local playlist data
        setUserPlaylists(
          userPlaylists.map((p) =>
            p._id === playlistId ? { ...p, songs: [...p.songs, trackId] } : p
          )
        );
      } else {
        throw new Error(result.message || "Failed to add to playlist");
      }
    } catch (error) {
      console.error("Error adding to playlist:", error);
      toast.error("Failed to add to playlist");
    } finally {
      setAddingToPlaylist(null);
    }
  };

  if (!session) {
    // If not logged in, show login prompt when clicked
    return variant === "dropdown" ? (
      <Link href="/login" className="flex items-center gap-2 w-full px-2 py-1">
        <ListPlus size={14} />
        <span>Add to Playlist (Login required)</span>
      </Link>
    ) : (
      <Button
        variant="outline"
        size={size === "sm" ? "sm" : size === "lg" ? "lg" : "default"}
        className={className}
        onClick={() => toast.error("You must be logged in to add to playlists")}
      >
        <ListPlus size={size === "sm" ? 14 : 16} className="mr-1" />
        Add to Playlist
      </Button>
    );
  }

  const trigger =
    variant === "dropdown" ? (
      <div className="flex items-center gap-2 w-full px-2 py-1">
        <ListPlus size={14} />
        <span>Add to Playlist</span>
      </div>
    ) : (
      <Button
        variant="outline"
        size={size === "sm" ? "sm" : size === "lg" ? "lg" : "default"}
        className={className}
      >
        <ListPlus size={size === "sm" ? 14 : 16} className="mr-1" />
        Add to Playlist
      </Button>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Playlist</DialogTitle>
        </DialogHeader>

        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          ) : userPlaylists.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">
                You don't have any playlists yet
              </p>
              <Link href="/playlist/create">
                <Button onClick={() => setOpen(false)}>
                  <Plus size={16} className="mr-1" />
                  Create Playlist
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {userPlaylists.map((playlist) => (
                <button
                  key={playlist._id}
                  className="w-full text-left px-4 py-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-between transition-colors"
                  onClick={() => handleAddToPlaylist(playlist._id)}
                  disabled={addingToPlaylist === playlist._id}
                >
                  <div>
                    <p className="font-medium">{playlist.name}</p>
                    <p className="text-xs text-gray-500">
                      {playlist.songs.length} songs •{" "}
                      {playlist.visibility === "PUBLIC" ? "Public" : "Private"}
                    </p>
                  </div>
                  {addingToPlaylist === playlist._id ? (
                    <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                  ) : playlist.songs.includes(trackId) ? (
                    <Check size={18} className="text-green-500" />
                  ) : (
                    <Plus size={18} className="text-gray-400" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 border-t pt-4 flex justify-between">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Link href="/playlist/create">
            <Button onClick={() => setOpen(false)}>
              <Plus size={16} className="mr-1" />
              New Playlist
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
