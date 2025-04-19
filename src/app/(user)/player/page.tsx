"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { sendRequest } from "@/utils/api";
import MusicPlayer from "@/components/ui/music-player";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import Link from "next/link";
import { usePlayer } from "@/components/app/player-context";

interface Track {
  _id: string;
  title: string;
  audioUrl: string;
  visibility: string;
  userId: string;
  duration: number;
  uploadDate: string;
  plays?: number;
}

const PlayerPage = () => {
  const { data: session } = useSession();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get player context
  const {
    currentTrack,
    isPlaying,
    playTrack,
    pauseTrack,
    togglePlayPause,
    nextTrack,
    previousTrack,
    playlist,
    setPlaylist,
    currentTrackIndex,
    setCurrentTrackIndex,
  } = usePlayer();

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!session?.user?.access_token) return;

        const response = await sendRequest<any>({
          url: `${process.env.NEXT_PUBLIC_API_URL}/songs/user-songs`,
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
          },
          method: "GET",
        });

        if (response.data) {
          setTracks(response.data);

          // Initialize the playlist if it's empty and we have tracks
          if (response.data.length > 0 && playlist.length === 0) {
            setPlaylist(response.data);

            // If no track is playing, set the first one as current
            if (!currentTrack) {
              setCurrentTrackIndex(0);
              // Note: We don't auto-play here to avoid unexpected sound
            }
          }
        }
      } catch (error) {
        console.error("Error fetching tracks:", error);
        setError("Failed to load your tracks. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, [session]);

  // Ensure the audio URL is complete with the API base URL if needed
  const getFullAudioUrl = (url: string) => {
    if (!url) return "";

    try {
      // Check if it's already a fully-formed URL with our proxy
      if (url.startsWith("/api/audio?url=")) {
        return url;
      }

      // Otherwise, build the proxy URL properly
      return `/api/audio?url=${encodeURIComponent(url)}`;
    } catch (e) {
      console.error("Error formatting audio URL:", e);
      return "";
    }
  };

  const handleTrackSelect = (index: number) => {
    // If the playlist has changed, update it
    if (JSON.stringify(tracks) !== JSON.stringify(playlist)) {
      setPlaylist(tracks);
    }

    setCurrentTrackIndex(index);
    const track = tracks[index];
    track.audioUrl = getFullAudioUrl(track.audioUrl);
    playTrack(track);
  };

  const handleTrackEnd = () => {
    nextTrack();
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p className="text-lg">Loading your tracks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
          {error}
        </div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Music Player</h1>
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-4">No tracks found</h2>
          <p className="mb-4">
            You don't have any tracks yet. Upload some music to get started!
          </p>
          <Link href="/upload">
            <Button>Upload Your First Track</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Get currently playing track
  const currentDisplayTrack = currentTrack || tracks[0];
  const displayIndex = currentTrack
    ? tracks.findIndex((t) => t._id === currentTrack._id)
    : 0;

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Music Player</h1>
        <Link href="/upload">
          <Button>Upload New Track</Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Now playing section */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Now Playing</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4">
                {error}
              </div>
            )}

            {currentDisplayTrack && (
              <MusicPlayer
                audioUrl={getFullAudioUrl(currentDisplayTrack.audioUrl)}
                title={currentDisplayTrack.title}
                onEnded={handleTrackEnd}
                onPrevious={previousTrack}
                onNext={nextTrack}
                onPlayStateChange={(isPlaying) => {
                  if (isPlaying) {
                    playTrack(currentDisplayTrack);
                  } else {
                    pauseTrack();
                  }
                }}
                autoPlay={isPlaying}
              />
            )}

            {/* Track navigation info */}
            <div className="flex justify-center items-center space-x-4 mt-6">
              <div className="text-sm text-center">
                <span className="font-medium">
                  Track {displayIndex + 1} of {tracks.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Playlist section */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold">Your Tracks</h2>
            </div>
            <div className="overflow-y-auto max-h-[500px]">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {tracks.map((track, index) => (
                  <li
                    key={track._id}
                    className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                      currentTrack?._id === track._id
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : ""
                    }`}
                    onClick={() => handleTrackSelect(index)}
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full mr-3 flex items-center justify-center">
                        {currentTrack?._id === track._id ? (
                          isPlaying ? (
                            <Pause size={12} />
                          ) : (
                            <Play size={12} className="ml-0.5" />
                          )
                        ) : (
                          <span className="text-sm">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-medium truncate">{track.title}</p>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{formatDuration(track.duration)}</span>
                          <span>{formatDate(track.uploadDate)}</span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
            <h3 className="text-lg font-semibold mb-3">How to Use</h3>
            <ul className="space-y-2 text-sm">
              <li>• Click on any track in the playlist to start playing it</li>
              <li>• Use the playback controls to navigate between tracks</li>
              <li>
                • Your playback will continue even when you navigate to other
                pages
              </li>
              <li>
                • Use the mini player at the bottom to control playback anywhere
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerPage;
