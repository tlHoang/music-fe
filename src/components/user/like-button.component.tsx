"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Heart, ListMusic } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLike } from "@/components/app/like-context";
import { usePlayer } from "@/components/app/player-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface LikeButtonProps {
  songId: string;
  initialLikeCount?: number;
  initialIsLiked?: boolean;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
  onLikeChange?: (isLiked: boolean, newCount: number) => void;
  song?: any; // Optional full song object for queue functionality
  showQueueOption?: boolean; // Whether to show the queue option
  disableQueueOption?: boolean; // Whether to disable the queue option
}

export default function LikeButton({
  songId,
  initialLikeCount = 0,
  initialIsLiked = false,
  size = "md",
  showCount = true,
  className,
  onLikeChange,
  song,
  showQueueOption = true,
  disableQueueOption = false,
}: LikeButtonProps) {
  const { data: session } = useSession();
  const { likedSongs, setLikeStatus, isLiked: getIsLiked } = useLike();
  const { addToQueue, addNextToQueue } = usePlayer();
  const [isLiked, setIsLiked] = useState(initialIsLiked || getIsLiked(songId));
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [likeId, setLikeId] = useState<string | null>(null);

  // Sync with the global like context
  useEffect(() => {
    if (likedSongs[songId] !== undefined) {
      setIsLiked(likedSongs[songId]);
    }
  }, [likedSongs, songId]);

  // Check current like status on mount or when session/songId changes
  useEffect(() => {
    if (songId) {
      checkLikeStatus();
    }
  }, [session, songId]);

  // Fetch like count on mount
  useEffect(() => {
    if (songId) {
      // fetchLikesCount();
    }
  }, [songId]);

  const fetchLikesCount = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/likes/count/${songId}`
      );
      const result = await response.json();
      if (response.ok && result.data) {
        setLikeCount(result.data.count);
      }
    } catch (error) {
      console.error("Error fetching likes count:", error);
    }
  };

  const checkLikeStatus = async () => {
    if (!songId) return;

    try {
      // Always send the auth header if available
      const headers: HeadersInit = {};

      if (session?.user?.access_token) {
        headers.Authorization = `Bearer ${session.user.access_token}`;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/likes/status/${songId}`,
        { headers }
      );

      const result = (await response.json()).data;

      if (response.ok) {
        const newLikeStatus = !!result.isLiked;

        // Update local state
        setIsLiked(newLikeStatus);

        // Update global context
        setLikeStatus(songId, newLikeStatus);

        if (result.likeCount !== undefined) {
          setLikeCount(result.likeCount);
        }
        if (result.likeId) {
          setLikeId(result.likeId);
        }
      }
    } catch (error) {
      console.error("Error checking like status:", error);
    }
  };

  const handleLike = async () => {
    if (!session?.user?.access_token) return;

    setIsLoading(true);
    setAnimate(true);

    try {
      // Store the current state before attempting to change it
      const wasLiked = isLiked;

      // Optimistic UI update (update UI before API call completes)
      const newLikeStatus = !wasLiked;
      setIsLiked(newLikeStatus);

      // Update the global context
      setLikeStatus(songId, newLikeStatus);

      const newCount = wasLiked ? Math.max(0, likeCount - 1) : likeCount + 1;
      setLikeCount(newCount);

      const endpoint = wasLiked ? "unlike" : "like";

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/likes/${endpoint}/${songId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Revert the UI state if the API call fails
        setIsLiked(wasLiked);
        setLikeStatus(songId, wasLiked);
        setLikeCount(wasLiked ? likeCount : Math.max(0, likeCount - 1));
        console.error("Like/unlike operation failed:", data);
        return;
      }

      // Update like id based on the API response
      if (!wasLiked && data.data?.like?._id) {
        setLikeId(data.data.like._id);
      } else if (wasLiked) {
        setLikeId(null);
      }

      // Notify parent component if needed
      if (onLikeChange) {
        onLikeChange(newLikeStatus, newCount);
      }
    } catch (error) {
      console.error(`Error handling like operation:`, error);
      // Revert on error
      setIsLiked(!isLiked);
      setLikeStatus(songId, !isLiked);
    } finally {
      setIsLoading(false);
      // Reset animation state after a short delay
      setTimeout(() => setAnimate(false), 500);
    }
  };

  // Queue functionality
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
    if (!song || !song.audioUrl) {
      console.error("Cannot add to queue: Missing song data");
      return;
    }

    const trackToQueue = { ...song };
    trackToQueue.audioUrl = getFullAudioUrl(song.audioUrl);

    addToQueue(trackToQueue);
    toast.success(`Added "${song.title || "Track"}" to the end of your queue`);
  };

  const handlePlayNext = () => {
    if (!song || !song.audioUrl) {
      console.error("Cannot play next: Missing song data");
      return;
    }

    const trackToQueue = { ...song };
    trackToQueue.audioUrl = getFullAudioUrl(song.audioUrl);

    addNextToQueue(trackToQueue);
    toast.success(`"${song.title || "Track"}" will play next`);
  };

  // Size classes for different button sizes
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Button
        type="button"
        variant={isLiked ? "default" : "ghost"}
        size="icon"
        className={cn(
          "rounded-full p-2 transition-colors",
          isLiked ? "bg-red-0 hover:bg-red-400 text-white border-red-500" : ""
        )}
        onClick={handleLike}
        disabled={isLoading || !session?.user}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={isLiked ? "liked" : "unliked"}
            initial={{ scale: animate ? 0.5 : 1 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.5 }}
            className="flex items-center justify-center"
          >
            <Heart
              className={cn(
                sizeClasses[size],
                isLiked
                  ? "fill-red-500 text-red-500"
                  : "text-gray-500 group-hover:text-red-500/70 dark:text-gray-400",
                "transition-colors duration-200"
              )}
            />
          </motion.div>
        </AnimatePresence>
        <span className="sr-only">{isLiked ? "Unlike" : "Like"}</span>
      </Button>

      {showCount && (
        <span
          className={cn(
            "text-sm font-medium transition-colors duration-200",
            isLiked ? "text-red-500" : "text-gray-600 dark:text-gray-400"
          )}
        >
          {likeCount > 0 ? likeCount : ""}
        </span>
      )}

      {/* Queue Button */}
      {showQueueOption && song && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
              disabled={disableQueueOption}
            >
              <ListMusic className={sizeClasses[size]} />
              <span className="sr-only">Add to queue</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={handleAddToQueue}
              className="flex items-center gap-2"
            >
              <span>Add to Queue</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handlePlayNext}
              className="flex items-center gap-2"
            >
              <span>Play Next</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
