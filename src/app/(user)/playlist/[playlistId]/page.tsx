"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { usePlayer } from "@/components/app/player-context";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlayCircle,
  Shuffle,
  Pause,
  MoreHorizontal,
  Calendar,
  Music,
  Share2,
} from "lucide-react";
import Link from "next/link";
import TrackCard from "@/components/user/track-card.component";
import LikeButton from "@/components/user/like-button.component";
import DraggablePlaylistTracks from "@/components/user/playlist/draggable-playlist-tracks";
import { toast } from "sonner";

interface PlaylistTrack {
  _id: string;
  title: string;
  artist?: string;
  coverImage?: string;
  audioUrl: string;
  duration: number;
  uploadDate: string;
  visibility: string;
}

interface PlaylistUser {
  _id: string;
  name: string;
  username: string;
  profilePicture?: string;
}

interface Playlist {
  _id: string;
  name: string;
  userId: PlaylistUser;
  songs: PlaylistTrack[];
  visibility: string;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PlaylistPage() {
  const { data: session } = useSession();
  const params = useParams();
  const playlistId = (params?.playlistId as string) || "";

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {
    playTrack,
    isPlaying,
    currentTrack,
    togglePlayPause,
    setPlaylist: setPlayerPlaylist,
    shuffleQueue,
    playTrackInQueue,
  } = usePlayer();

  // Function to check if a track is currently playing
  const isTrackPlaying = (trackId: string) => {
    return currentTrack?._id === trackId && isPlaying;
  };
  // Function to play all tracks in the playlist
  const playAllTracks = () => {
    if (!playlist || playlist.songs.length === 0) return;

    // Format tracks for player
    const tracksForPlayer = playlist.songs.map((track) => ({
      ...track,
      artist: track.artist || "Unknown Artist",
      // Make sure audioUrl is properly formatted for playback
      audioUrl: getFullAudioUrl(track.audioUrl),
    }));

    // Set the playlist in the player context
    setPlayerPlaylist(tracksForPlayer);

    // Play the first track in the queue
    // Using playTrackInQueue instead of playTrack to ensure we keep the entire playlist
    // in the queue rather than replacing it with just the first track
    playTrackInQueue(0);
  };

  // Function to play the playlist in shuffle mode
  const playShuffled = () => {
    if (!playlist || playlist.songs.length === 0) return;

    // Format tracks for player
    const tracksForPlayer = playlist.songs.map((track) => ({
      ...track,
      artist: track.artist || "Unknown Artist",
      // Make sure audioUrl is properly formatted for playback
      audioUrl: getFullAudioUrl(track.audioUrl),
    }));

    // Set the playlist in the player context
    setPlayerPlaylist(tracksForPlayer);

    // Shuffle the queue and play the first track
    shuffleQueue();
    playTrackInQueue(0);
  };

  // Helper function to format audio URLs
  const getFullAudioUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `/api/audio?url=${encodeURIComponent(url)}`;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Fetch playlist data
  useEffect(() => {
    const fetchPlaylistData = async () => {
      if (!playlistId) return;

      try {
        setLoading(true);
        setError(null);

        const token = session?.user?.access_token;
        const headers: HeadersInit = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/playlists/${playlistId}`,
          { headers }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch playlist");
        }

        const result = await response.json();
        console.log("Playlist API response:", result);

        // Handle different response structures
        if (result.data && result.data.data) {
          // Handle nested structure: { data: { success: true, data: {...} } }
          setPlaylist(result.data.data);
        } else if (result.data && !result.data.data) {
          // Handle structure: { data: {...} }
          setPlaylist(result.data);
        } else if (result.success && result.data) {
          // Handle structure: { success: true, data: {...} }
          setPlaylist(result.data);
        } else {
          setError("Failed to load playlist data");
        }
      } catch (err) {
        console.error("Error fetching playlist:", err);
        setError("An error occurred while fetching the playlist");
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylistData();
  }, [playlistId, session]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-4">Playlist not found</h2>
          <p className="mb-4">
            The playlist you're looking for doesn't exist or may have been
            removed.
          </p>
          <Link href="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = session?.user?._id === playlist.userId._id;

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        {/* Playlist header */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            {/* Playlist cover */}
            <div className="w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded-md shadow-lg flex items-center justify-center text-5xl text-gray-400">
              {playlist.name?.charAt(0).toUpperCase() || "P"}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">{playlist.name}</h1>

              <div className="mb-4">
                <p className="text-gray-200">
                  Created by{" "}
                  <Link
                    href={`/profile/${playlist.userId._id}`}
                    className="font-medium hover:underline"
                  >
                    {playlist.userId.name || playlist.userId.username}
                  </Link>
                </p>

                <div className="flex flex-wrap gap-3 justify-center md:justify-start mt-2 text-sm">
                  <span className="flex items-center gap-1">
                    <Music size={16} />
                    {playlist.songs.length} tracks
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={16} />
                    {formatDate(playlist.createdAt)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <Button
                  onClick={playAllTracks}
                  className="bg-white text-black hover:bg-gray-100"
                >
                  <PlayCircle size={18} className="mr-2" />
                  Play All
                </Button>

                <Button
                  onClick={playShuffled}
                  variant="outline"
                  className="border-white text-black hover:bg-white/20"
                >
                  <Shuffle size={18} className="mr-2" />
                  Shuffle
                </Button>

                {/* Add like button for the playlist */}
                {/* Implement LikeButton for playlists when available */}

                {isOwner && (
                  <Link href={`/playlist/${playlistId}/edit`}>
                    <Button
                      variant="outline"
                      className="border-white text-black hover:bg-white/20"
                    >
                      Edit Playlist
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Playlist content */}
        <div className="p-6">
          <Tabs defaultValue="tracks">
            <TabsList className="mb-6">
              <TabsTrigger value="tracks">Tracks</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
            </TabsList>

            <TabsContent value="tracks">
              {playlist.songs.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-md">
                  <h3 className="text-xl font-semibold mb-2">
                    This playlist is empty
                  </h3>
                  {isOwner ? (
                    <p className="text-gray-500 mb-4">
                      Start adding tracks to your playlist!
                    </p>
                  ) : (
                    <p className="text-gray-500">
                      No tracks have been added to this playlist yet.
                    </p>
                  )}

                  {isOwner && (
                    <Link href="/upload">
                      <Button>Upload Tracks</Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div>
                  <DraggablePlaylistTracks
                    tracks={playlist.songs}
                    playlistId={playlistId}
                    isOwner={isOwner}
                    getFullAudioUrl={getFullAudioUrl}
                    onTrackClick={(index) => {
                      // Playing from the playlist view - add all tracks to queue if not already there
                      // and then play the selected track
                      const tracksForPlayer = playlist.songs.map((t) => ({
                        ...t,
                        artist: t.artist || "Unknown Artist",
                        audioUrl: getFullAudioUrl(t.audioUrl),
                      }));

                      // Compare current queue with playlist tracks to avoid duplicating the queue
                      const isPlaylistAlreadyQueued =
                        tracksForPlayer.length === playlist.songs.length &&
                        tracksForPlayer.every(
                          (t, i) => t._id === playlist.songs[i]?._id
                        );

                      if (!isPlaylistAlreadyQueued) {
                        setPlayerPlaylist(tracksForPlayer);
                      }

                      // Play the selected track
                      playTrackInQueue(index);
                    }}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="about">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">
                  About this playlist
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {`A playlist by ${playlist.userId.name || playlist.userId.username}. 
                  Created on ${formatDate(playlist.createdAt)}.`}
                </p>

                <div className="flex flex-wrap gap-2">
                  <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm">
                    {playlist.visibility === "PUBLIC" ? "Public" : "Private"}
                  </div>
                  {playlist.isFeatured && (
                    <div className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100 px-3 py-1 rounded-full text-sm">
                      Featured
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
