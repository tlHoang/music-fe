"use client";

import React, { useState } from "react";
import { usePlayer } from "@/components/app/player-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  FileText,
} from "lucide-react";
import Link from "next/link";
import LikeButton from "./like-button.component";
import QueueManager from "./queue-manager";
import AddToPlaylistButton from "./playlist/add-to-playlist-button";

export default function PersistentPlayer() {
  const [showLyricsModal, setShowLyricsModal] = useState(false);
  const {
    currentTrack,
    isPlaying,
    togglePlayPause,
    nextTrack,
    previousTrack,
    currentTrackIndex,
    playlist,
  } = usePlayer();

  // console.log(currentTrack);

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
                {(currentTrack as any).userId?.username ||
                  currentTrack.artist ||
                  "Unknown Artist"}
              </div>
            </div>{" "}
            {/* Like button */}
            {currentTrack._id && (
              <div className="ml-2 flex gap-1">
                <LikeButton
                  songId={currentTrack._id}
                  size="sm"
                  showCount={false}
                />
                <AddToPlaylistButton
                  trackId={currentTrack._id}
                  variant="button"
                  size="sm"
                />
              </div>
            )}
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
            )}{" "}
            {/* Queue Manager Button */}
            <div className="ml-3">
              <QueueManager />
            </div>
            {/* Lyrics Button */}
            {currentTrack?.lyrics && (
              <Button
                onClick={() => setShowLyricsModal(true)}
                variant="ghost"
                size="icon"
                className="text-gray-600 dark:text-gray-300 ml-1"
                title="View Lyrics"
              >
                <FileText size={16} />
              </Button>
            )}
          </div>

          {/* Link to player page */}
          <div className="w-1/3 flex justify-end">
            <Link href="/player">
              <Button variant="outline" size="sm">
                Full Player
              </Button>
            </Link>{" "}
          </div>
        </div>
      </div>

      {/* Lyrics Modal */}
      <Dialog open={showLyricsModal} onOpenChange={setShowLyricsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText size={20} />
              Lyrics - {currentTrack?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              by{" "}
              {(currentTrack as any)?.userId?.username ||
                currentTrack?.artist ||
                "Unknown Artist"}
            </div>
            <div className="whitespace-pre-line text-gray-800 dark:text-gray-200 leading-relaxed">
              {currentTrack?.lyrics || "No lyrics available for this track."}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
