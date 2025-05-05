"use client";

import React from "react";
import { usePlayer } from "@/components/app/player-context";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  MoreHorizontal,
  Plus,
  SkipForward as PlayNext,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LikeButton from "./like-button.component";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface TrackCardProps {
  track: {
    _id: string;
    title: string;
    artist?: string;
    audioUrl: string;
    coverImage?: string;
    duration?: number;
    uploadDate?: string;
  };
  isCompact?: boolean;
  showLikeButton?: boolean;
  className?: string;
  index?: number;
  onMainClick?: () => void; // New prop for handling main card click
}

const TrackCard = ({
  track,
  isCompact = false,
  showLikeButton = true,
  className,
  index,
  onMainClick,
}: TrackCardProps) => {
  const {
    currentTrack,
    isPlaying,
    playTrack,
    togglePlayPause,
    addToQueue,
    addNextToQueue,
  } = usePlayer();

  const isCurrentTrack = currentTrack?._id === track._id;

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

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the event from bubbling up

    if (isCurrentTrack) {
      togglePlayPause();
    } else {
      const trackWithFullUrl = { ...track };
      trackWithFullUrl.audioUrl = getFullAudioUrl(track.audioUrl);
      playTrack(trackWithFullUrl);
    }
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the event from bubbling up

    const trackWithFullUrl = { ...track };
    trackWithFullUrl.audioUrl = getFullAudioUrl(track.audioUrl);

    addToQueue(trackWithFullUrl);
    toast.success(`Added "${track.title}" to the end of your queue`);
  };

  const handlePlayNext = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the event from bubbling up

    const trackWithFullUrl = { ...track };
    trackWithFullUrl.audioUrl = getFullAudioUrl(track.audioUrl);

    addNextToQueue(trackWithFullUrl);
    toast.success(`"${track.title}" will play next`);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "--:--";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isCompact) {
    // Compact version for playlists, search results, etc.
    return (
      <div
        className={cn(
          "flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 group",
          className
        )}
        onClick={onMainClick} // Add the onClick handler to the main div
      >
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded mr-3 flex-shrink-0 relative group">
          {track.coverImage ? (
            <img
              src={track.coverImage}
              alt={track.title}
              className="h-full w-full object-cover rounded"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded">
              {index !== undefined && (
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {index + 1}
                </span>
              )}
            </div>
          )}

          <button
            onClick={handlePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded transition-opacity"
          >
            {isCurrentTrack && isPlaying ? (
              <Pause className="text-white" size={16} />
            ) : (
              <Play className="text-white ml-0.5" size={16} />
            )}
          </button>
        </div>

        <div className="flex-grow min-w-0">
          <p className="font-medium text-sm truncate">{track.title}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {track.artist || "Unknown Artist"}
          </p>
        </div>

        <div
          className="flex items-center gap-1 ml-2"
          onClick={(e) => e.stopPropagation()}
        >
          {showLikeButton && track._id && (
            <LikeButton songId={track._id} size="sm" showCount={false} />
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal size={15} />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={handleAddToQueue}
                className="flex items-center gap-2"
              >
                <Plus size={14} />
                <span>Add to Queue</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handlePlayNext}
                className="flex items-center gap-2"
              >
                <PlayNext size={14} />
                <span>Play Next</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  // Full version for homepage, discover page, etc.
  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden",
        className
      )}
      onClick={onMainClick} // Add the onClick handler to the main div
    >
      <div className="relative group aspect-square bg-gray-200 dark:bg-gray-700">
        {track.coverImage ? (
          <img
            src={track.coverImage}
            alt={track.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-300 dark:bg-gray-600">
            <span className="text-3xl font-bold text-gray-400 dark:text-gray-500">
              {track.title?.charAt(0).toUpperCase() || "♪"}
            </span>
          </div>
        )}

        <button
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {isCurrentTrack && isPlaying ? (
            <Pause className="text-white" size={36} />
          ) : (
            <Play className="text-white ml-1" size={36} />
          )}
        </button>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium truncate">{track.title}</h3>
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 -mr-1 -mt-1"
                >
                  <MoreHorizontal size={16} />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={handleAddToQueue}
                  className="flex items-center gap-2"
                >
                  <Plus size={14} />
                  <span>Add to Queue</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handlePlayNext}
                  className="flex items-center gap-2"
                >
                  <PlayNext size={14} />
                  <span>Play Next</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-3">
          {track.artist || "Unknown Artist"}
        </p>

        <div className="flex justify-between items-center">
          <div onClick={(e) => e.stopPropagation()}>
            {showLikeButton && track._id && (
              <LikeButton songId={track._id} size="sm" showCount={true} />
            )}
          </div>

          <div className="text-xs text-gray-500">
            {formatDuration(track.duration)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackCard;
