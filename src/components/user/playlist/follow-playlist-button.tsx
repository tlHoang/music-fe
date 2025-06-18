"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Heart, Plus, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FollowPlaylistButtonProps {
  playlistId: string;
  variant?: "button" | "icon";
  size?: "sm" | "md" | "lg";
  className?: string;
  onFollowChange?: (isFollowing: boolean) => void;
  initialFollowState?: boolean; // Add this prop to set initial state
}

export default function FollowPlaylistButton({
  playlistId,
  variant = "button",
  size = "md",
  className,
  onFollowChange,
  initialFollowState,
}: FollowPlaylistButtonProps) {
  const { data: session } = useSession();
  const [isFollowing, setIsFollowing] = useState(initialFollowState ?? false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(
    initialFollowState === undefined
  );

  // Check follow status on component mount only if initial state is not provided
  useEffect(() => {
    if (initialFollowState !== undefined) {
      setIsFollowing(initialFollowState);
      setIsCheckingStatus(false);
      return;
    }

    if (session?.user?.access_token && playlistId) {
      checkFollowStatus();
    } else {
      setIsCheckingStatus(false);
    }
  }, [session, playlistId, initialFollowState]);

  const checkFollowStatus = async () => {
    try {
      setIsCheckingStatus(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/follow-playlist/${playlistId}/status`,
        {
          headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        console.log("Status check API Response:", data); // Debug log

        // Handle nested response structure
        if (data.data?.success) {
          setIsFollowing(data.data.data.isFollowing);
        }
      }
    } catch (error) {
      console.error("Error checking follow status:", error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!session?.user?.access_token) {
      toast.error("You must be logged in to follow playlists");
      return;
    }

    if (isLoading) return;

    try {
      setIsLoading(true);

      const endpoint = isFollowing
        ? `${process.env.NEXT_PUBLIC_API_URL}/follow-playlist/${playlistId}/unfollow`
        : `${process.env.NEXT_PUBLIC_API_URL}/follow-playlist/${playlistId}/follow`;

      const method = isFollowing ? "DELETE" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.user.access_token}`,
        },
      });
      const data = await response.json();
      console.log("Follow/Unfollow API Response:", data); // Debug log

      // Handle nested response structure: check for data.data.success and also accept 201 status for follow
      if ((response.ok || response.status === 201) && data.data?.success) {
        const newFollowState = !isFollowing;
        setIsFollowing(newFollowState);
        onFollowChange?.(newFollowState);

        toast.success(
          data.data.message ||
            (newFollowState
              ? "Successfully followed playlist"
              : "Successfully unfollowed playlist")
        );
      } else {
        throw new Error(
          data.data?.message || data.message || "Failed to update follow status"
        );
      }
    } catch (error: any) {
      console.error("Error toggling follow:", error);
      toast.error(error.message || "Failed to update follow status");
    } finally {
      setIsLoading(false);
    }
  };

  if (!session?.user) {
    return null; // Don't show button if user is not logged in
  }
  if (isCheckingStatus) {
    return (
      <Button
        variant="outline"
        size={size === "md" ? "default" : size}
        disabled
        className={className}
      >
        <Loader2 size={16} className="mr-1 animate-spin" />
        {variant === "button" && "Loading..."}
      </Button>
    );
  }

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggleFollow}
        disabled={isLoading}
        className={`p-2 ${className}`}
        title={isFollowing ? "Unfollow playlist" : "Follow playlist"}
      >
        {isLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : isFollowing ? (
          <Check size={16} className="text-green-600" />
        ) : (
          <Plus size={16} />
        )}
      </Button>
    );
  }
  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size={size === "md" ? "default" : size}
      onClick={handleToggleFollow}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 size={16} className="mr-1 animate-spin" />
      ) : isFollowing ? (
        <Check size={16} className="mr-1" />
      ) : (
        <Plus size={16} className="mr-1" />
      )}
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}
