"use client";

import React from "react";
import { usePlayer } from "@/components/app/player-context";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import Link from "next/link";

export default function PersistentPlayer() {
  const {
    currentTrack,
    isPlaying,
    togglePlayPause,
    nextTrack,
    previousTrack,
    currentTrackIndex,
    playlist,
  } = usePlayer();

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 shadow-lg z-50">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          {/* Track info */}
          <div className="flex items-center space-x-3 w-1/3">
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded">
              {currentTrack.coverImage ? (
                <img
                  src={currentTrack.coverImage}
                  alt={currentTrack.title}
                  className="h-full w-full object-cover rounded"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-500">
                  <Volume2 size={20} />
                </div>
              )}
            </div>
            <div className="overflow-hidden">
              <div className="font-medium text-sm truncate">
                {currentTrack.title}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {currentTrack.artist || "Unknown Artist"}
              </div>
            </div>
          </div>

          {/* Player controls */}
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={previousTrack}
              className="text-gray-600 dark:text-gray-300"
            >
              <SkipBack size={18} />
            </Button>

            <Button
              onClick={togglePlayPause}
              size="icon"
              className="bg-primary text-white hover:bg-primary/90 rounded-full h-9 w-9"
            >
              {isPlaying ? (
                <Pause size={18} />
              ) : (
                <Play size={18} className="ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={nextTrack}
              className="text-gray-600 dark:text-gray-300"
            >
              <SkipForward size={18} />
            </Button>

            {playlist.length > 0 && (
              <div className="text-xs text-gray-500 ml-1">
                {currentTrackIndex + 1}/{playlist.length}
              </div>
            )}
          </div>

          {/* Link to player page */}
          <div className="w-1/3 flex justify-end">
            <Link href="/player">
              <Button variant="outline" size="sm">
                Full Player
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
