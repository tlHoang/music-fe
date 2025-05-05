"use client";

import React, { useState } from "react";
import { usePlayer } from "@/components/app/player-context";
import { Button } from "@/components/ui/button";
import { Pause, Play, X, GripVertical, ListMusic, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface TrackCardProps {
  track: any;
  index: number;
  currentTrackIndex: number;
  isPlaying: boolean;
  onPlay: () => void;
  onRemove: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
}

const TrackCard = ({
  track,
  index,
  currentTrackIndex,
  isPlaying,
  onPlay,
  onRemove,
  onDragStart,
  onDragOver,
  onDragEnd,
}: TrackCardProps) => {
  const isCurrentTrack = index === currentTrackIndex;

  return (
    <div
      className={cn(
        "flex items-center p-2 rounded-md mb-1 group",
        isCurrentTrack
          ? "bg-blue-50 dark:bg-blue-900/30"
          : "hover:bg-gray-100 dark:hover:bg-gray-800"
      )}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="mr-2 cursor-grab text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
        <GripVertical size={16} />
      </div>

      <div className="w-8 text-center text-xs text-gray-500 mr-2">
        {index + 1}
      </div>

      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 mr-2 flex-shrink-0 rounded">
        {track.coverImage ? (
          <img
            src={track.coverImage}
            alt={track.title}
            className="h-full w-full object-cover rounded"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-500">
            <ListMusic size={14} />
          </div>
        )}
      </div>

      <div className="flex-grow overflow-hidden">
        <div className="font-medium text-sm truncate">{track.title}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {track.artist || "Unknown Artist"}
        </div>
      </div>

      <div className="flex items-center gap-1 ml-2">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-6 w-6",
            isCurrentTrack && isPlaying ? "text-blue-500" : "text-gray-500"
          )}
          onClick={onPlay}
        >
          {isCurrentTrack && isPlaying ? (
            <Pause size={14} />
          ) : (
            <Play size={14} className="ml-0.5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={onRemove}
        >
          <X size={14} />
        </Button>
      </div>
    </div>
  );
};

export default function QueueManager() {
  const {
    playlist,
    setPlaylist,
    currentTrackIndex,
    setCurrentTrackIndex,
    playTrack,
    playTrackInQueue,
    isPlaying,
  } = usePlayer();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Handle drag and drop to reorder queue
  const handleDragStart =
    (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = "move";
    };

  const handleDragOver =
    (index: number) => (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === index) return;

      // Reorder the playlist
      const newPlaylist = [...playlist];
      const draggedTrack = newPlaylist[draggedIndex];

      // Remove the dragged track and insert it at the new position
      newPlaylist.splice(draggedIndex, 1);
      newPlaylist.splice(index, 0, draggedTrack);

      // Update current track index if needed
      let newCurrentIndex = currentTrackIndex;
      if (currentTrackIndex === draggedIndex) {
        // If we're dragging the current track, update its index
        newCurrentIndex = index;
      } else if (
        (draggedIndex < currentTrackIndex && index >= currentTrackIndex) ||
        (draggedIndex > currentTrackIndex && index <= currentTrackIndex)
      ) {
        // Adjust current index if the drag operation affects its position
        newCurrentIndex =
          draggedIndex < currentTrackIndex
            ? currentTrackIndex - 1
            : currentTrackIndex + 1;
      }

      setCurrentTrackIndex(newCurrentIndex);
      setPlaylist(newPlaylist);
      setDraggedIndex(index);
    };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Play track at specific index
  const playTrackAtIndex = (index: number) => {
    // Use the new playTrackInQueue function that won't reset the queue
    playTrackInQueue(index);
  };

  // Remove track from queue
  const removeTrackFromQueue = (index: number) => {
    const newPlaylist = [...playlist];
    newPlaylist.splice(index, 1);

    // Adjust currentTrackIndex if needed
    let newCurrentIndex = currentTrackIndex;
    if (index === currentTrackIndex) {
      // If we're removing the current track, don't change the index (the next track will play)
      // Unless we're removing the last track, then move to the previous one
      if (index === newPlaylist.length) {
        newCurrentIndex = Math.max(0, newPlaylist.length - 1);
      }
    } else if (index < currentTrackIndex) {
      // If we remove a track before the current one, adjust the index
      newCurrentIndex = currentTrackIndex - 1;
    }

    setCurrentTrackIndex(newCurrentIndex);
    setPlaylist(newPlaylist);
  };

  // Clear queue
  const clearQueue = () => {
    setPlaylist([]);
    setCurrentTrackIndex(0);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-600 hover:text-gray-900"
        >
          <ListMusic size={16} className="mr-1" />
          <span className="text-xs">Queue</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between mt-5">
            <span>Play Queue ({playlist.length})</span>
            {playlist.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={clearQueue}
                className="h-7 text-xs"
              >
                <Trash2 size={14} className="mr-1" />
                Clear Queue
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto pr-1">
          {playlist.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Your queue is empty
            </div>
          ) : (
            playlist.map((track, index) => (
              <TrackCard
                key={`${track._id}-${index}`}
                track={track}
                index={index}
                currentTrackIndex={currentTrackIndex}
                isPlaying={isPlaying}
                onPlay={() => playTrackAtIndex(index)}
                onRemove={() => removeTrackFromQueue(index)}
                onDragStart={handleDragStart(index)}
                onDragOver={handleDragOver(index)}
                onDragEnd={handleDragEnd}
              />
            ))
          )}
        </div>

        <div className="mt-2 text-xs text-gray-500">
          Tip: Drag and drop tracks to reorder the queue
        </div>
      </DialogContent>
    </Dialog>
  );
}
