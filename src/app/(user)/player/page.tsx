"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { sendRequest } from "@/utils/api";
import MusicPlayer from "@/components/ui/music-player";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";
import { usePlayer } from "@/components/app/player-context";
import LikeButton from "@/components/user/like-button.component";
import CommentSection from "@/components/user/comment-section.component";
import TrackCard from "@/components/user/track-card.component";
import AddToPlaylistButton from "@/components/user/playlist/add-to-playlist-button";
import { FileText } from "lucide-react";

interface Track {
  _id: string;
  title: string;
  audioUrl: string;
  visibility: string;
  userId: string;
  duration: number;
  uploadDate: string;
  plays?: number;
  cover?: string; // Add cover field for signed cover URL
  lyrics?: string;
}

const PlayerPage = () => {
  const { data: session } = useSession();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPlayerTime, setCurrentPlayerTime] = useState<number>(0);
  const [showLyricsModal, setShowLyricsModal] = useState(false);

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
    playWithSeek,
    audioElement,
  } = usePlayer();

  // Update current time from audio element for timestamps in comments
  useEffect(() => {
    if (!audioElement) return;

    const updateCurrentTime = () => {
      setCurrentPlayerTime(audioElement.currentTime);
    };

    audioElement.addEventListener("timeupdate", updateCurrentTime);

    return () => {
      audioElement.removeEventListener("timeupdate", updateCurrentTime);
    };
  }, [audioElement]);

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

          // We're removing the auto-initialization of the playlist
          // Now tracks will only be loaded to the queue when explicitly selected
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
    const track = tracks[index];
    const trackWithFullUrl = { ...track };
    trackWithFullUrl.audioUrl = getFullAudioUrl(track.audioUrl);

    // Instead of replacing the queue with all tracks,
    // just play this individual track
    playTrack(trackWithFullUrl);
  };

  const handleTrackEnd = () => {
    nextTrack();
  };

  // Handle comment timestamp click to seek to that position in the song
  const handleCommentTimestampClick = (time: number) => {
    if (audioElement) {
      playWithSeek(audioElement, time);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        {/* <p className="text-lg">Loading your tracks...</p> */}
        <p></p>
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
              <div className="space-y-4">
                <MusicPlayer
                  audioUrl={getFullAudioUrl(currentDisplayTrack.audioUrl)}
                  title={currentDisplayTrack.title}
                  coverImage={currentDisplayTrack.cover}
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
                />                {/* Like button for the current track */}
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">                  <div className="flex items-center gap-3">
                    <LikeButton
                      songId={currentDisplayTrack._id}
                      size="md"
                      showCount={true}
                    />
                    
                    <AddToPlaylistButton
                      trackId={currentDisplayTrack._id}
                      size="md"
                    />
                    
                    {currentDisplayTrack.lyrics && (
                      <Button
                        onClick={() => setShowLyricsModal(true)}
                        variant="outline"
                        size="sm"
                      >
                        <FileText className="mr-2" size={16} />
                        View Lyrics
                      </Button>
                    )}
                  </div>

                  <div className="text-sm text-gray-500">
                    Track {displayIndex + 1} of {tracks.length}
                  </div>
                </div>
              </div>
            )}

            {/* Comments section */}
            {currentDisplayTrack && (
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <CommentSection
                  songId={currentDisplayTrack._id}
                  currentTime={currentPlayerTime}
                  onCommentTimestampClick={handleCommentTimestampClick}
                />
              </div>
            )}
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
                    className={
                      currentTrack?._id === track._id
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : ""
                    }
                  >
                    <TrackCard
                      track={track}
                      isCompact={true}
                      index={index}
                      className="cursor-pointer"
                      onMainClick={() => handleTrackSelect(index)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
            <h3 className="text-lg font-semibold mb-3">How to Use</h3>
            <ul className="space-y-2 text-sm">
              <li>• Click on any track in the playlist to start playing it</li>
              <li>
                • Use the menu (⋯) to add tracks to your queue or play next
              </li>
              <li>• Use the playback controls to navigate between tracks</li>
              <li>• Like tracks or add comments with timestamps</li>
              <li>
                • Click on comment timestamps to jump to that part of the song
              </li>
              <li>
                • Your playback will continue even when you navigate to other
                pages
              </li>
              <li>
                • Use the mini player at the bottom to control playback anywhere
              </li>
              <li>
                • Open the Queue Manager to view and reorder your play queue
              </li>
            </ul>          </div> */}
        </div>
      </div>

      {/* Lyrics Modal */}
      <Dialog open={showLyricsModal} onOpenChange={setShowLyricsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText size={20} />
              Lyrics - {currentDisplayTrack?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              by {(currentDisplayTrack as any)?.userId?.username || (currentDisplayTrack as any)?.artist || "Unknown Artist"}
            </div>
            <div className="whitespace-pre-line text-gray-800 dark:text-gray-200 leading-relaxed">
              {currentDisplayTrack?.lyrics || "No lyrics available for this track."}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlayerPage;
