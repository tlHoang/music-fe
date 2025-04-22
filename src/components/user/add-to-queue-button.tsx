"use client";

import React from "react";
import { usePlayer } from "@/components/app/player-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, SkipForward, ListMusic } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Track {
  _id: string;
  title: string;
  audioUrl: string;
  artist?: string;
  coverImage?: string;
  [key: string]: any;
}

interface AddToQueueButtonProps {
  track: Track;
  variant?: "dropdown" | "split" | "icon";
  className?: string;
  buttonSize?: "default" | "sm" | "lg" | "icon";
}

export default function AddToQueueButton({
  track,
  variant = "dropdown",
  className,
  buttonSize = "default",
}: AddToQueueButtonProps) {
  const { addToQueue, addNextToQueue } = usePlayer();

  // Ensure the audio URL is complete with the API base URL if needed
  const getFullAudioUrl = (url: string) => {
    if (!url) return "";

    try {
      if (url.startsWith("/api/audio?url=")) {
        return url;
      }
      return `/api/audio?url=${encodeURIComponent(url)}`;
    } catch (e) {
      console.error("Error formatting audio URL:", e);
      return "";
    }
  };

  const handleAddToQueue = () => {
    const trackWithFullUrl = { ...track };
    trackWithFullUrl.audioUrl = getFullAudioUrl(track.audioUrl);

    addToQueue(trackWithFullUrl);
    toast.success(`Added "${track.title}" to the end of your queue`);
  };

  const handlePlayNext = () => {
    const trackWithFullUrl = { ...track };
    trackWithFullUrl.audioUrl = getFullAudioUrl(track.audioUrl);

    addNextToQueue(trackWithFullUrl);
    toast.success(`"${track.title}" will play next`);
  };

  // Dropdown variant (default)
  if (variant === "dropdown") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size={buttonSize}
            className={cn("flex items-center gap-1", className)}
          >
            <ListMusic size={16} />
            <span>Add to Queue</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={handleAddToQueue}
            className="flex items-center gap-2"
          >
            <Plus size={14} />
            <span>Add to End</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handlePlayNext}
            className="flex items-center gap-2"
          >
            <SkipForward size={14} />
            <span>Play Next</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Split button variant
  if (variant === "split") {
    return (
      <div className={cn("flex", className)}>
        <Button
          variant="outline"
          size={buttonSize}
          onClick={handleAddToQueue}
          className="rounded-r-none"
        >
          <Plus size={16} className="mr-1" />
          Add to Queue
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size={buttonSize}
              className="rounded-l-none border-l-0 px-2"
            >
              <SkipForward size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={handlePlayNext}>
              Play Next
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Icon-only variant
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", className)}
        >
          <ListMusic size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={handleAddToQueue}
          className="flex items-center gap-2"
        >
          <Plus size={14} />
          <span>Add to End</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handlePlayNext}
          className="flex items-center gap-2"
        >
          <SkipForward size={14} />
          <span>Play Next</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
