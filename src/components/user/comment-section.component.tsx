"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CircleAlert, MessageSquare, Trash2, Send } from "lucide-react";

interface CommentSectionProps {
  songId: string;
  currentTime?: number;
  onCommentTimestampClick?: (time: number) => void;
}

interface Comment {
  _id: string;
  content: string;
  userId: {
    _id: string;
    name?: string;
    username: string;
    email: string;
    avatarUrl?: string;
  };
  createdAt: string;
  timestamp?: number;
}

export default function CommentSection({
  songId,
  currentTime,
  onCommentTimestampClick,
}: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeTimestamp, setIncludeTimestamp] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch comments when the component mounts or songId changes
  useEffect(() => {
    if (songId) {
      fetchComments();
    }
  }, [songId]);

  // console.log(comments);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/comments/song/${songId}`
      );
      const result = await response.json();

      if (response.ok && result.data) {
        setComments(result.data);
      } else {
        setError("Failed to load comments");
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError("An error occurred while loading comments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTimestamp = () => {
    if (!currentTime) return;

    const minutes = Math.floor(currentTime / 60);
    const seconds = Math.floor(currentTime % 60);
    const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    setIncludeTimestamp(true);
    setNewComment((prev) => `[${formattedTime}] ${prev}`);

    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user || !newComment.trim()) return;

    try {
      setIsSubmitting(true);

      const commentData = {
        userId: session.user._id,
        songId,
        content: newComment.trim(),
      };

      // Add timestamp if it was included
      if (includeTimestamp && currentTime !== undefined) {
        commentData.content = newComment;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.access_token}`,
          },
          body: JSON.stringify(commentData),
        }
      );

      const result = await response.json();

      // console.log(result);

      if (response.ok && result.data) {
        // Add the new comment to the list with user info
        const newCommentWithUser = {
          ...result.data,
          userId: {
            _id: session.user._id,
            // name: session.user.name,
            email: session.user.email,
            // avatarUrl: session.user.profilePicture,
            username: session.user.username,
          },
        };

        setComments((prev) => [newCommentWithUser, ...prev]);
        setNewComment("");
        setIncludeTimestamp(false);
      } else {
        setError(result.message || "Failed to post comment");
      }
    } catch (err) {
      console.error("Error posting comment:", err);
      setError("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!session?.user?.access_token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/comments/${commentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete comment");
      }

      // Remove the comment from state
      setComments((prevComments) =>
        prevComments.filter((comment) => comment._id !== commentId)
      );
    } catch (err) {
      console.error("Error deleting comment:", err);
      setError("Failed to delete comment");
    }
  };

  // Helper function to format timestamp for display
  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Helper function to extract timestamp from comment content
  const extractTimestamp = (content: string) => {
    const timeRegex = /\[(\d+:\d+)\]/;
    const match = content.match(timeRegex);

    if (match) {
      const [minutes, seconds] = match[1].split(":").map(Number);
      const totalSeconds = minutes * 60 + seconds;

      return {
        text: match[0],
        time: totalSeconds,
      };
    }

    return null;
  };

  return (
    <div className="flex flex-col space-y-6 w-full max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Comments</h3>
        <div className="flex items-center">
          <MessageSquare className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">{comments.length}</span>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <CircleAlert className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {session?.user ? (
        <form onSubmit={handleCommentSubmit} className="space-y-4">
          <div className="flex space-x-4">
            {" "}
            <Avatar className="h-10 w-10">
              {" "}
              <AvatarImage
                src={session.user.profilePicture || "/default-profile.jpg"}
                alt={session.user.name || "User"}
              />
              <AvatarFallback>
                {session.user.name?.[0].toLocaleUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2 flex-1">
              <div className="relative">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-20 w-full"
                  ref={textareaRef}
                />
              </div>

              <div className="flex justify-between items-center">
                {currentTime !== undefined && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddTimestamp}
                  >
                    Add timestamp
                  </Button>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  size="sm"
                >
                  {isSubmitting ? "Posting..." : "Post Comment"}
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="text-center p-4 border rounded-md">
          <p className="text-sm text-muted-foreground">
            Please sign in to leave a comment
          </p>
        </div>
      )}

      <div className="space-y-4 mt-8">
        {isLoading ? (
          // Loading skeletons
          Array(3)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="flex animate-pulse space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment._id} className="flex space-x-4">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={comment.userId.avatarUrl || ""}
                  alt={comment.userId.name}
                />
                <AvatarFallback>
                  {comment.userId.name?.charAt(0).toUpperCase() ||
                    comment.userId.username?.[0].toUpperCase() ||
                    "U"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-1">
                <div className="flex justify-between">
                  <div>
                    <span className="font-medium">
                      {comment.userId.name || comment.userId.username || "User"}
                    </span>
                    <span className="text-muted-foreground text-sm ml-2">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  {session?.user?._id === comment.userId._id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteComment(comment._id)}
                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <p className="text-sm">
                  {(() => {
                    const timestamp = extractTimestamp(comment.content);
                    if (timestamp && onCommentTimestampClick) {
                      return (
                        <>
                          <button
                            className="text-blue-500 hover:underline"
                            onClick={() =>
                              onCommentTimestampClick(timestamp.time)
                            }
                          >
                            {timestamp.text}
                          </button>
                          {comment.content.replace(timestamp.text, "")}
                        </>
                      );
                    }
                    return comment.content;
                  })()}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
}
